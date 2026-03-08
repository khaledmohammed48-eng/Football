import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

/**
 * POST /api/admin/players/import
 * Accepts a multipart/form-data upload with:
 *   - file: Excel (.xlsx / .xls / .csv) file
 *   - teamId: optional team assignment for all imported players
 *   - defaultPassword: password for all created accounts (default: 123456)
 *   - autoAgeGroups: 'true' to auto-assign players to age-group teams based on age
 *
 * Excel columns (case-insensitive, order-flexible):
 *   الاسم | Name          → player name   (required)
 *   الجوال | Mobile | Phone → phone number (required, shared phones allowed)
 *   العمر | Age            → player age (required for autoAgeGroups)
 *   تاريخ الميلاد | DOB   → date of birth (alternative to age)
 *   المركز | Position     → GOALKEEPER | DEFENDER | MIDFIELDER | FORWARD (optional)
 *   الفريق | Team         → team name to look up (overrides global teamId param)
 *
 * Age-group mapping (when autoAgeGroups=true):
 *   6–8  → U8    9–10 → U10    11–12 → U12
 *   13–14 → U14   15–16 → U16   17–18 → U18
 *   Teams are created automatically if they don't exist.
 *
 * Returns:
 *   { imported, skipped, total, rows, ageGroupSummary }
 */
export async function POST(request: Request) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const academyId = session!.user.academyId!;
  const createdById = session!.user.id;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('يجب إرسال البيانات بصيغة multipart/form-data', 400);
  }

  const file = formData.get('file') as File | null;
  if (!file) return errorResponse('لم يتم إرفاق ملف Excel', 400);

  const defaultPassword = (formData.get('defaultPassword') as string | null) ?? '123456';
  if (defaultPassword.length < 6) return errorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 400);

  const globalTeamId = (formData.get('teamId') as string | null) || null;
  const autoAgeGroups = formData.get('autoAgeGroups') === 'true';

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Parse with SheetJS
  let rows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } catch {
    return errorResponse('تعذّر قراءة ملف Excel — تأكد من أنه بصيغة .xlsx أو .xls أو .csv', 400);
  }

  if (rows.length === 0) return errorResponse('الملف فارغ أو لا يحتوي على بيانات', 400);
  if (rows.length > 1000) return errorResponse('الحد الأقصى للاستيراد الواحد هو 1000 لاعب', 400);

  // Load academy teams for lookup by name
  const academyTeams = await prisma.team.findMany({
    where: { academyId },
    select: { id: true, name: true },
  });
  const teamByName = Object.fromEntries(academyTeams.map((t) => [t.name.trim().toLowerCase(), t.id]));

  // Cache for auto-created age-group teams: groupName → teamId
  const ageGroupTeamCache: Record<string, string> = {};
  for (const t of academyTeams) {
    const upper = t.name.trim().toUpperCase();
    if (['U8', 'U10', 'U12', 'U14', 'U16', 'U18'].includes(upper)) {
      ageGroupTeamCache[upper] = t.id;
    }
  }

  // Hash password once
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Column name aliases (Arabic + English)
  const COL = {
    name:     ['الاسم', 'name', 'اسم اللاعب', 'player name'],
    phone:    ['الجوال', 'mobile', 'phone', 'رقم الجوال', 'رقم الهاتف', 'موبايل'],
    age:      ['العمر', 'age', 'سن', 'السن'],
    dob:      ['تاريخ الميلاد', 'dob', 'dateofbirth', 'date of birth', 'birthdate'],
    position: ['المركز', 'position', 'مركز اللاعب'],
    team:     ['الفريق', 'team', 'فريق'],
  };

  const POSITION_MAP: Record<string, string> = {
    'حارس': 'GOALKEEPER', 'goalkeeper': 'GOALKEEPER', 'gk': 'GOALKEEPER',
    'مدافع': 'DEFENDER',  'defender': 'DEFENDER',     'def': 'DEFENDER', 'cb': 'DEFENDER', 'lb': 'DEFENDER', 'rb': 'DEFENDER',
    'وسط': 'MIDFIELDER',  'midfielder': 'MIDFIELDER',  'mid': 'MIDFIELDER', 'cm': 'MIDFIELDER', 'dm': 'MIDFIELDER',
    'مهاجم': 'FORWARD',   'forward': 'FORWARD',        'fw': 'FORWARD', 'st': 'FORWARD', 'cf': 'FORWARD',
  };

  // Find cell value by alias list
  function getCol(row: Record<string, unknown>, aliases: string[]): string {
    for (const key of Object.keys(row)) {
      if (aliases.includes(key.trim().toLowerCase())) {
        return String(row[key] ?? '').trim();
      }
    }
    return '';
  }

  // Parse age or DOB value → Date | null
  function parseAgeOrDob(ageVal: string, dobVal: string): Date | null {
    const raw = dobVal || ageVal;
    if (!raw) return null;

    // Pure number 1–99 → treat as age
    const asNum = Number(raw);
    if (!isNaN(asNum) && asNum > 0 && asNum < 100) {
      const birthYear = new Date().getFullYear() - Math.round(asNum);
      return new Date(`${birthYear}-01-01`);
    }

    // Try parsing as date string
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;

    return null;
  }

  // Map age number → age-group team name
  function getAgeGroupName(age: number): string | null {
    if (age >= 6  && age <= 8)  return 'U8';
    if (age >= 9  && age <= 10) return 'U10';
    if (age >= 11 && age <= 12) return 'U12';
    if (age >= 13 && age <= 14) return 'U14';
    if (age >= 15 && age <= 16) return 'U16';
    if (age >= 17 && age <= 18) return 'U18';
    return null;
  }

  // Get or create an age-group team, return its teamId
  async function getOrCreateAgeGroupTeam(groupName: string): Promise<string> {
    if (ageGroupTeamCache[groupName]) return ageGroupTeamCache[groupName];

    const team = await prisma.team.create({
      data: { name: groupName, academyId },
    });
    ageGroupTeamCache[groupName] = team.id;
    teamByName[groupName.toLowerCase()] = team.id;
    return team.id;
  }

  type RowResult = {
    row: number;
    name: string;
    phone: string;
    status: 'ok' | 'error';
    error?: string;
    playerId?: string;
    ageGroup?: string;
  };

  const results: RowResult[] = [];
  let imported = 0;
  let skipped = 0;
  const ageGroupSummary: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +2 because row 1 is header
    const row = rows[i] as Record<string, unknown>;

    const name     = getCol(row, COL.name);
    const phone    = getCol(row, COL.phone).replace(/\s+/g, '').replace(/^00966/, '0').replace(/^\+966/, '0');
    const ageStr   = getCol(row, COL.age);
    const dobStr   = getCol(row, COL.dob);
    const positionRaw = getCol(row, COL.position).toLowerCase();
    const teamName = getCol(row, COL.team).toLowerCase().trim();

    // Validate required fields
    if (!name) {
      results.push({ row: rowNum, name: '', phone, status: 'error', error: 'الاسم مطلوب' });
      skipped++;
      continue;
    }
    if (!phone) {
      results.push({ row: rowNum, name, phone: '', status: 'error', error: 'رقم الجوال مطلوب' });
      skipped++;
      continue;
    }

    const dateOfBirth = parseAgeOrDob(ageStr, dobStr);
    const position    = POSITION_MAP[positionRaw] ?? null;

    // Resolve team assignment
    let teamId: string | null = globalTeamId;
    let ageGroup: string | undefined;

    if (autoAgeGroups && ageStr) {
      // Auto age-group takes priority over everything
      const ageNum = Number(ageStr);
      if (!isNaN(ageNum) && ageNum >= 6 && ageNum <= 18) {
        const groupName = getAgeGroupName(Math.round(ageNum));
        if (groupName) {
          ageGroup = groupName;
          teamId = await getOrCreateAgeGroupTeam(groupName);
        }
      }
    } else if (teamName) {
      // Row-level team name overrides global teamId
      const found = teamByName[teamName];
      if (!found) {
        results.push({ row: rowNum, name, phone, status: 'error', error: `الفريق "${getCol(row, COL.team)}" غير موجود` });
        skipped++;
        continue;
      }
      teamId = found;
    }

    // Create user + player in transaction
    try {
      const placeholderEmail = `player_${phone}_${crypto.randomUUID().slice(0, 8)}@academy.local`;

      const playerId = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: placeholderEmail,
            password: hashedPassword,
            role: 'PLAYER',
            createdById,
            academyId,
          },
        });
        const player = await tx.player.create({
          data: {
            userId: user.id,
            name,
            phone,
            dateOfBirth,
            position,
            teamId,
            academyId,
          },
        });
        return player.id;
      });

      if (ageGroup) {
        ageGroupSummary[ageGroup] = (ageGroupSummary[ageGroup] ?? 0) + 1;
      }
      results.push({ row: rowNum, name, phone, status: 'ok', playerId, ageGroup });
      imported++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
      results.push({ row: rowNum, name, phone, status: 'error', error: msg });
      skipped++;
    }
  }

  return successResponse({ imported, skipped, total: rows.length, rows: results, ageGroupSummary });
}
