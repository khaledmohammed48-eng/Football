import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// POST /api/coach/best-player
// body: { playerId: string, teamId: string }
// Sets one player as best for the team, clears all others in same team.
// If playerId is null/empty, clears best player for the team.

export async function POST(request: Request) {
  const { error, status, session } = await requireAuth(['COACH', 'ADMIN']);
  if (error) return errorResponse(error, status);

  const body = await request.json().catch(() => ({}));
  const { playerId, teamId } = body as { playerId?: string; teamId?: string };

  if (!teamId) return errorResponse('teamId مطلوب', 400);

  // Verify coach is assigned to this team
  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, coachTeams: { select: { teamId: true } } },
  });

  if (!coach) return errorResponse('المدرب غير موجود', 404);

  const isAdmin = session!.user.role === 'ADMIN' || session!.user.role === 'SUPER_ADMIN';
  if (!isAdmin) {
    const coachTeamIds = coach.coachTeams.map((ct) => ct.teamId);
    if (!coachTeamIds.includes(teamId)) {
      return errorResponse('غير مصرح لك بهذا الفريق', 403);
    }
  }

  // Clear best player for all players in this team
  await prisma.player.updateMany({
    where: { teamId },
    data: { isBestPlayer: false },
  });

  // Set the new best player if provided
  if (playerId) {
    const player = await prisma.player.findFirst({
      where: { id: playerId, teamId },
      select: { id: true, name: true },
    });
    if (!player) return errorResponse('اللاعب غير موجود في هذا الفريق', 404);

    await prisma.player.update({
      where: { id: playerId },
      data: { isBestPlayer: true },
    });

    return successResponse({ isBestPlayer: true, playerName: player.name });
  }

  return successResponse({ isBestPlayer: false });
}
