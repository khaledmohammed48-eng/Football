import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { updateAttributesSchema } from '@football-academy/shared';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status } = await requireAuth();
  if (error) return errorResponse(error, status);

  let attrs = await prisma.playerAttribute.findUnique({
    where: { playerId: params.id },
  });

  if (!attrs) {
    attrs = await prisma.playerAttribute.create({
      data: { playerId: params.id },
    });
  }

  return successResponse({ ...attrs, updatedAt: attrs.updatedAt.toISOString() });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth(['ADMIN', 'COACH']);
  if (error) return errorResponse(error, status);

  // Coaches can only update players on one of their assigned teams
  if (session!.user.role === 'COACH') {
    const player = await prisma.player.findUnique({
      where: { id: params.id },
      select: { teamId: true },
    });
    const coach = await prisma.coach.findUnique({
      where: { userId: session!.user.id },
      select: { id: true },
    });
    if (!player?.teamId || !coach) return errorResponse('غير مصرح', 403);
    const coachTeam = await prisma.coachTeam.findFirst({
      where: { coachId: coach.id, teamId: player.teamId },
    });
    if (!coachTeam) return errorResponse('غير مصرح', 403);
  }

  const body = await request.json();
  const parsed = updateAttributesSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const attrs = await prisma.playerAttribute.upsert({
    where: { playerId: params.id },
    create: { playerId: params.id, ...parsed.data },
    update: parsed.data,
  });

  return successResponse({ ...attrs, updatedAt: attrs.updatedAt.toISOString() });
}
