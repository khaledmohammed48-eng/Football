import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(request: Request) {
  const { error, status, session } = await requireAuth();
  if (error) return errorResponse(error, status);

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const search = searchParams.get('search');

  let where: Record<string, unknown> = {};

  // Always scope to current academy
  where.academyId = session!.user.academyId;

  // Coaches can only see their team's players
  if (session!.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({
      where: { userId: session!.user.id },
      select: { teamId: true },
    });
    where.teamId = coach?.teamId ?? null;
  } else if (teamId) {
    where.teamId = teamId;
  }

  if (search) {
    where.name = { contains: search };
  }

  const players = await prisma.player.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      team: { select: { id: true, name: true } },
    },
  });

  return successResponse(
    players.map((p) => ({
      ...p,
      dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
      subscriptionEnd: p.subscriptionEnd?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
}
