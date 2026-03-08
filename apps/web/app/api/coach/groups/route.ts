import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET() {
  const { error, status, session } = await requireAuth('COACH');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
  });
  if (!coach?.teamId) return errorResponse('لم يتم تعيينك في فريق بعد', 404);

  const groups = await prisma.trainingGroup.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse(
    groups.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      playerIds: JSON.parse(g.playerIds),
      captainId: g.captainId,
      formation: g.formation,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAuth('COACH');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
  });
  if (!coach?.teamId) return errorResponse('لم يتم تعيينك في فريق بعد', 404);

  const body = await req.json();
  const { name, type, playerIds, captainId, formation } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return errorResponse('اسم المجموعة مطلوب', 400);
  }
  if (!['TEMPORARY', 'PERMANENT'].includes(type)) {
    return errorResponse('نوع المجموعة غير صالح', 400);
  }
  if (!Array.isArray(playerIds)) {
    return errorResponse('قائمة اللاعبين غير صالحة', 400);
  }

  const group = await prisma.trainingGroup.create({
    data: {
      coachId: coach.id,
      teamId: coach.teamId,
      name: name.trim(),
      type,
      playerIds: JSON.stringify(playerIds),
      captainId: captainId ?? null,
      formation: formation ?? null,
    },
  });

  return successResponse(
    {
      id: group.id,
      name: group.name,
      type: group.type,
      playerIds: JSON.parse(group.playerIds),
      captainId: group.captainId,
      formation: group.formation,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    },
    201
  );
}
