import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// Coaches can see all ACCEPTED matches for their academy
export async function GET() {
  const { error, status, session } = await requireAuth('COACH');
  if (error) return errorResponse(error, status);

  const academyId = session!.user.academyId!;

  const matches = await prisma.matchRequest.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { fromAcademyId: academyId },
        { toAcademyId: academyId },
      ],
    },
    include: {
      fromAcademy: { select: { id: true, name: true, logoUrl: true, city: true } },
      toAcademy:   { select: { id: true, name: true, logoUrl: true, city: true } },
    },
    orderBy: { proposedDate: 'asc' },
  });

  // Parse lineup JSON helper
  const parseLineup = (raw: string | null) => {
    if (!raw) return { starting: [] as string[], bench: [] as string[] };
    try { return JSON.parse(raw) as { starting: string[]; bench: string[] }; }
    catch { return { starting: [] as string[], bench: [] as string[] }; }
  };

  return successResponse(
    matches.map((m) => {
      const isFromAcademy = m.fromAcademyId === academyId;
      const isHome = isFromAcademy
        ? m.homeOrAway === 'HOME'
        : m.homeOrAway === 'AWAY';

      // Our lineup is on the home or away side
      const ourSideIsHome =
        (isFromAcademy && m.homeOrAway === 'HOME') ||
        (!isFromAcademy && m.homeOrAway === 'AWAY');
      const myLineup = parseLineup(ourSideIsHome ? m.lineupHome : m.lineupAway);

      return {
        ...m,
        proposedDate: m.proposedDate.toISOString(),
        createdAt:    m.createdAt.toISOString(),
        updatedAt:    m.updatedAt.toISOString(),
        isHome,
        myAcademy: isFromAcademy ? m.fromAcademy : m.toAcademy,
        opponent:  isFromAcademy ? m.toAcademy   : m.fromAcademy,
        myLineup,           // { starting: playerId[], bench: playerId[] }
        lineupSide: ourSideIsHome ? 'home' : 'away',
      };
    })
  );
}
