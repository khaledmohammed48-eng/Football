import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';
import { notifyNewSession, notifyNewCoach } from '@/lib/notifications';

function serializeSession(s: {
  id: string; coachId: string; teamId: string; title: string; date: Date;
  description: string | null; exercises: string; targetGroupId: string | null;
  createdAt: Date; updatedAt: Date; coach?: { name: string }; team?: { name: string };
}) {
  return {
    id: s.id, coachId: s.coachId, teamId: s.teamId, title: s.title,
    date: s.date.toISOString(), description: s.description,
    exercises: JSON.parse(s.exercises) as { name: string; duration: string; notes: string }[],
    targetGroupId: s.targetGroupId,
    createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(),
    coachName: s.coach?.name, teamName: s.team?.name,
  };
}

export async function GET(req: NextRequest) {
  const { error, status, session } = await requireAuth(['ADMIN', 'COACH', 'PLAYER']);
  if (error) return errorResponse(error, status);

  const role = session!.user.role;

  if (role === 'ADMIN') {
    const sessions = await prisma.sessionPlan.findMany({
      where: { date: { gte: new Date() }, team: { academyId: session!.user.academyId } },
      orderBy: { date: 'asc' }, take: 50,
      include: { coach: { select: { name: true } }, team: { select: { name: true } } },
    });
    return successResponse(sessions.map(serializeSession));
  }

  if (role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId: session!.user.id } });
    if (!coach) return errorResponse('غير مصرح', 403);
    const sessions = await prisma.sessionPlan.findMany({
      where: { coachId: coach.id }, orderBy: { date: 'asc' },
    });
    return successResponse(sessions.map(serializeSession));
  }

  // PLAYER
  const player = await prisma.player.findUnique({ where: { userId: session!.user.id } });
  if (!player?.teamId) return successResponse([]);

  const sessions = await prisma.sessionPlan.findMany({
    where: { teamId: player.teamId, date: { gte: new Date() } },
    orderBy: { date: 'asc' }, take: 10,
    include: { coach: { select: { name: true } } },
  });
  return successResponse(sessions.map(serializeSession));
}

export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAuth('COACH');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
    include: { user: { select: { academyId: true } } },
  });
  if (!coach?.teamId) return errorResponse('لم يتم تعيينك في فريق بعد', 404);

  const body = await req.json();
  const { title, date, description, exercises, targetGroupId } = body;

  if (!title || typeof title !== 'string' || !title.trim()) return errorResponse('عنوان الجلسة مطلوب', 400);
  if (!date) return errorResponse('تاريخ الجلسة مطلوب', 400);
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return errorResponse('تاريخ غير صالح', 400);

  const session_plan = await prisma.sessionPlan.create({
    data: {
      coachId: coach.id, teamId: coach.teamId, title: title.trim(),
      date: parsedDate, description: description ?? null,
      exercises: JSON.stringify(exercises ?? []), targetGroupId: targetGroupId ?? null,
    },
  });

  // 🔔 Notify players (and coaches) in the team
  const academyId = coach.user.academyId ?? session!.user.academyId;
  if (academyId) {
    notifyNewSession({
      academyId,
      teamId: coach.teamId,
      sessionTitle: title.trim(),
      sessionDate: parsedDate,
      targetGroupId: targetGroupId ?? null,
    }).catch(() => {});
  }

  return successResponse(serializeSession(session_plan), 201);
}
