import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// Players see accepted matches for their academy that match their age group
// The ageGroup on the match is matched via the player's training groups (if any)
// Fallback: show all accepted matches for the academy
export async function GET() {
  const { error, status, session } = await requireAuth('PLAYER');
  if (error) return errorResponse(error, status);

  const academyId = session!.user.academyId!;

  // Find the player's training groups to know their age group(s)
  const player = await prisma.player.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, teamId: true },
  });

  // Get training groups this player belongs to (to determine their age group(s))
  let playerAgeGroups: string[] | null = null;
  if (player?.teamId) {
    const groups = await prisma.trainingGroup.findMany({
      where: { teamId: player.teamId },
      select: { playerIds: true, name: true },
    });
    // Find groups that contain this player
    const myGroups = groups.filter((g) => {
      const ids: string[] = JSON.parse(g.playerIds);
      return ids.includes(player.id);
    });

    // Extract age groups from group names matching "U8", "U10" etc
    const ageGroupPattern = /\b(U8|U10|U12|U14|U16|U18|U21)\b/i;
    const found = new Set<string>();
    myGroups.forEach((g) => {
      const m = g.name.match(ageGroupPattern);
      if (m) found.add(m[1].toUpperCase());
    });
    if (found.size > 0) playerAgeGroups = Array.from(found);
  }

  const matches = await prisma.matchRequest.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { fromAcademyId: academyId },
        { toAcademyId: academyId },
      ],
      // If we know the player's age groups, filter by them; otherwise show all
      ...(playerAgeGroups && playerAgeGroups.length > 0
        ? { ageGroup: { in: playerAgeGroups } }
        : {}),
    },
    include: {
      fromAcademy: { select: { id: true, name: true, logoUrl: true, city: true } },
      toAcademy:   { select: { id: true, name: true, logoUrl: true, city: true } },
    },
    orderBy: { proposedDate: 'asc' },
  });

  return successResponse(
    matches.map((m) => ({
      ...m,
      proposedDate: m.proposedDate.toISOString(),
      createdAt:    m.createdAt.toISOString(),
      updatedAt:    m.updatedAt.toISOString(),
      isHome: m.fromAcademyId === academyId
        ? m.homeOrAway === 'HOME'
        : m.homeOrAway === 'AWAY',
      myAcademy: m.fromAcademyId === academyId ? m.fromAcademy : m.toAcademy,
      opponent:  m.fromAcademyId === academyId ? m.toAcademy   : m.fromAcademy,
    }))
  );
}
