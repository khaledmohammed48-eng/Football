import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET() {
  const { error, status, session } = await requireAuth('PLAYER');
  if (error) return errorResponse(error, status);

  const player = await prisma.player.findUnique({
    where: { userId: session!.user.id },
    include: {
      team: { select: { id: true, name: true } },
      attributes: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { coach: { select: { name: true } } },
      },
    },
  });

  if (!player) return errorResponse('اللاعب غير موجود', 404);

  return successResponse({
    ...player,
    dateOfBirth: player.dateOfBirth?.toISOString() ?? null,
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
