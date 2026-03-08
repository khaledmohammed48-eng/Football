import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';
import { createAccountSchema } from '@football-academy/shared';
import { notifyNewCoach } from '@/lib/notifications';

export async function GET() {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const users = await prisma.user.findMany({
    where: { academyId: session!.user.academyId, role: { in: ['COACH', 'PLAYER'] } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      coach: { select: { name: true, phone: true, team: { select: { name: true } } } },
      player: { select: { name: true, phone: true, team: { select: { name: true } } } },
    },
  });

  const mapped = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    profile: u.coach
      ? { name: u.coach.name, phone: u.coach.phone, teamName: u.coach.team?.name }
      : u.player
        ? { name: u.player.name, phone: u.player.phone, teamName: u.player.team?.name }
        : null,
  }));

  return successResponse(mapped);
}

export async function POST(request: Request) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const data = parsed.data;
  const hashedPassword = await bcrypt.hash(data.password, 12);

  if (data.role === 'COACH') {
    // Coach uses phone number for login
    const phone = data.phone;
    const existingCoach = await prisma.coach.findFirst({ where: { phone, academyId: session!.user.academyId } });
    if (existingCoach) return errorResponse('رقم الجوال مستخدم بالفعل لمدرب آخر', 409);

    // Generate a unique placeholder email — phone is the real login identifier
    const placeholderEmail = `coach_${phone}_${crypto.randomUUID().slice(0, 8)}@coach.local`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: placeholderEmail,
          mobile: phone,
          password: hashedPassword,
          role: 'COACH',
          createdById: session!.user.id,
          academyId: session!.user.academyId,
        },
      });
      await tx.coach.create({
        data: { userId: user.id, name: data.name, phone, teamId: data.teamId ?? null, academyId: session!.user.academyId },
      });
      return user;
    });

    // 🔔 Notify admin of new coach
    if (session!.user.academyId) {
      notifyNewCoach({ academyId: session!.user.academyId, coachName: data.name }).catch(() => {});
    }

    return successResponse({ id: result.id, phone, role: result.role }, 201);

  } else {
    // Player uses phone login — generate a unique placeholder email for the User record.
    // Multiple players may share the same phone (e.g. siblings using father's number),
    // so we append a short unique suffix instead of using the phone alone.
    const phone = data.phone;
    const placeholderEmail = `player_${phone}_${crypto.randomUUID().slice(0, 8)}@academy.local`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: placeholderEmail,
          password: hashedPassword,
          role: 'PLAYER',
          createdById: session!.user.id,
          academyId: session!.user.academyId,
        },
      });
      await tx.player.create({
        data: { userId: user.id, name: data.name, phone, teamId: data.teamId ?? null, academyId: session!.user.academyId },
      });
      return user;
    });

    return successResponse({ id: result.id, phone, role: 'PLAYER' }, 201);
  }
}
