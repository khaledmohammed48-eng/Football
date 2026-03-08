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

  const plan = await prisma.sessionPlan.findUnique({
    where: { id: params.id },
  });
  if (!plan) return errorResponse('الجلسة غير موجودة', 404);
  if (plan.coachId !== coach.id) return errorResponse('غير مصرح', 403);

  const body = await req.json();
  const { title, date, description, exercises, targetGroupId } = body;

  const updated = await prisma.sessionPlan.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(description !== undefined && { description: description ?? null }),
      ...(exercises !== undefined && { exercises: JSON.stringify(exercises) }),
      ...(targetGroupId !== undefined && { targetGroupId: targetGroupId ?? null }),
    },
  });

  return successResponse({
    id: updated.id,
    coachId: updated.coachId,
    teamId: updated.teamId,
    title: updated.title,
    date: updated.date.toISOString(),
    description: updated.description,
    exercises: JSON.parse(updated.exercises),
    targetGroupId: updated.targetGroupId,
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

  const plan = await prisma.sessionPlan.findUnique({
    where: { id: params.id },
  });
  if (!plan) return errorResponse('الجلسة غير موجودة', 404);
  if (plan.coachId !== coach.id) return errorResponse('غير مصرح', 403);

  await prisma.sessionPlan.delete({ where: { id: params.id } });

  return successResponse({ deleted: true });
}
