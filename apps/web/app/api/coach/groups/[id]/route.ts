import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('COACH');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
  });
  if (!coach) return errorResponse('غير مصرح', 403);

  const group = await prisma.trainingGroup.findUnique({
    where: { id: params.id },
  });
  if (!group) return errorResponse('المجموعة غير موجودة', 404);
  if (group.coachId !== coach.id) return errorResponse('غير مصرح', 403);

  const body = await req.json();
  const { name, type, playerIds, captainId, formation } = body;

  const updated = await prisma.trainingGroup.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(type !== undefined && { type }),
      ...(playerIds !== undefined && { playerIds: JSON.stringify(playerIds) }),
      ...(captainId !== undefined && { captainId: captainId ?? null }),
      ...(formation !== undefined && { formation: formation ?? null }),
    },
  });

  return successResponse({
    id: updated.id,
    name: updated.name,
    type: updated.type,
    playerIds: JSON.parse(updated.playerIds),
    captainId: updated.captainId,
    formation: updated.formation,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('COACH');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
  });
  if (!coach) return errorResponse('غير مصرح', 403);

  const group = await prisma.trainingGroup.findUnique({
    where: { id: params.id },
  });
  if (!group) return errorResponse('المجموعة غير موجودة', 404);
  if (group.coachId !== coach.id) return errorResponse('غير مصرح', 403);

  await prisma.trainingGroup.delete({ where: { id: params.id } });

  return successResponse({ deleted: true });
}
