import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

/**
 * POST /api/coaches/import
 * Accepts multipart/form-data:
 *   - file: Excel (.xlsx / .xls / .csv)
 *   - defaultPassword: password for all coaches (default: 12345678)
 *   - teamId: optional default team assignment
 *
 * Excel columns (case-insensitive):
 *   الاسم | Name          → coach name (required)
 *   الجوال | Mobile | Phone → phone number (required)
 *   الفريق | Team         → team name (optional, overrides teamId)
 *
 * Returns: { imported, skipped, total, rows }
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

  const defaultPassword = (formData.get('defaultPassword') as string | null) ?? '12345678';
  if (defaultPassword.length < 6) return errorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 400);

  const globalTeamId = (formData.get('teamId') as string | null) || null;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let rows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } catch {
    return errorResponse('تعذّر قراءة ملف Excel — تأكد من أنه بصيغة .xlsx أو .xls أو .csv', 400);
  }

  if (rows.length === 0) return errorResponse('الملف فارغ أو لا يحتوي على بيانات', 400);
  if (rows.length > 200) return errorResponse('الحد الأقصى للاستيراد الواحد هو 200 مدرب', 400);

  const academyTeams = await prisma.team.findMany({
    where: { academyId },
    select: { id: true, name: true },
  });
  const teamByName = Object.fromEntries(academyTeams.map((t) => [t.name.trim().toLowerCase(), t.id]));

  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const COL = {
    name:  ['الاسم', 'name', 'اسم المدرب', 'coach name'],
    phone: ['الجوال', 'mobile', 'phone', 'رقم الجوال', 'رقم الهاتف', 'موبايل'],
    team:  ['الفريق', 'team', 'فريق'],
  };

  function getCol(row: Record<string, unknown>, aliases: string[]): string {
    for (const key of Object.keys(row)) {
      if (aliases.includes(key.trim().toLowerCase())) {
        return String(row[key] ?? '').trim();
      }
    }
    return '';
  }

  type RowResult = {
    row: number;
    name: string;
    phone: string;
    status: 'ok' | 'error';
    error?: string;
    coachId?: string;
  };

  const results: RowResult[] = [];
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const row = rows[i] as Record<string, unknown>;

    const name     = getCol(row, COL.name);
    const phone    = getCol(row, COL.phone).replace(/\s+/g, '').replace(/^00966/, '0').replace(/^\+966/, '0');
    const teamName = getCol(row, COL.team).toLowerCase().trim();

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

    // Check duplicate coach phone in this academy
    const existingCoach = await prisma.coach.findFirst({ where: { phone, academyId } });
    if (existingCoach) {
      results.push({ row: rowNum, name, phone, status: 'error', error: 'رقم الجوال مستخدم بالفعل' });
      skipped++;
      continue;
    }

    let teamId: string | null = globalTeamId;
    if (teamName) {
      const found = teamByName[teamName];
      if (!found) {
        results.push({ row: rowNum, name, phone, status: 'error', error: `الفريق "${getCol(row, COL.team)}" غير موجود` });
        skipped++;
        continue;
      }
      teamId = found;
    }

    try {
      const placeholderEmail = `coach_${phone}_${crypto.randomUUID().slice(0, 8)}@coach.local`;

      const coachId = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: placeholderEmail,
            mobile: phone,
            password: hashedPassword,
            role: 'COACH',
            createdById,
            academyId,
          },
        });
        const coach = await tx.coach.create({
          data: { userId: user.id, name, phone, teamId, academyId },
        });
        return coach.id;
      });

      results.push({ row: rowNum, name, phone, status: 'ok', coachId });
      imported++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
      results.push({ row: rowNum, name, phone, status: 'error', error: msg });
      skipped++;
    }
  }

  return successResponse({ imported, skipped, total: rows.length, rows: results });
}
