import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { updatePlayerSchema } from '@football-academy/shared';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth();
  if (error) return errorResponse(error, status);

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: {
      team: { select: { id: true, name: true } },
      attributes: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { coach: { select: { name: true } } },
      },
    },
  });

  if (!player) return errorResponse('اللاعب غير موجود', 404);

  // ADMIN must be from the same academy
  if (session!.user.role === 'ADMIN' && player.academyId !== session!.user.academyId) {
    return errorResponse('غير مصرح', 403);
  }

  // Players can only view their own profile
  if (session!.user.role === 'PLAYER' && player.userId !== session!.user.id) {
    return errorResponse('غير مصرح', 403);
  }

  // Coaches can only view players on their team
  if (session!.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({
      where: { userId: session!.user.id },
      select: { teamId: true },
    });
    if (coach?.teamId !== player.teamId) {
      return errorResponse('غير مصرح', 403);
    }
  }

  return successResponse({
    ...player,
    dateOfBirth: player.dateOfBirth?.toISOString() ?? null,
    subscriptionEnd: player.subscriptionEnd?.toISOString() ?? null,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
    attributes: player.attributes
      ? { ...player.attributes, updatedAt: player.attributes.updatedAt.toISOString() }
      : null,
    notes: player.notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = updatePlayerSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const existing = await prisma.player.findUnique({ where: { id: params.id } });
  if (!existing) return errorResponse('اللاعب غير موجود', 404);
  if (existing.academyId !== session!.user.academyId) return errorResponse('غير مصرح', 403);

  const { dateOfBirth, subscriptionEnd, ...rest } = parsed.data;

  const player = await prisma.player.update({
    where: { id: params.id },
    data: {
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : subscriptionEnd === null ? null : undefined,
    },
  });

  return successResponse({
    ...player,
    dateOfBirth: player.dateOfBirth?.toISOString() ?? null,
    subscriptionEnd: player.subscriptionEnd?.toISOString() ?? null,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const player = await prisma.player.findUnique({ where: { id: params.id } });
  if (!player) return errorResponse('اللاعب غير موجود', 404);
  if (player.academyId !== session!.user.academyId) return errorResponse('غير مصرح', 403);

  const body = await request.json() as { isActive?: boolean };
  if (typeof body.isActive !== 'boolean') {
    return errorResponse('قيمة isActive مطلوبة (true/false)', 400);
  }

  const updated = await prisma.player.update({
    where: { id: params.id },
    data: { isActive: body.isActive },
  });

  return successResponse({ id: updated.id, isActive: updated.isActive });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const player = await prisma.player.findUnique({ where: { id: params.id } });
  if (!player) return errorResponse('اللاعب غير موجود', 404);
  if (player.academyId !== session!.user.academyId) return errorResponse('غير مصرح', 403);

  // Deleting the User cascades to Player
  await prisma.user.delete({ where: { id: player.userId } });
  return successResponse({ message: 'تم حذف اللاعب' });
}
