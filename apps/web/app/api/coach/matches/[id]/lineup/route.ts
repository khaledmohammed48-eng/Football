import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

/**
 * PUT /api/coach/matches/[id]/lineup
 * Coach saves their academy's lineup for an accepted match.
 * Body: { starting: string[], bench: string[] }
 *   - starting: up to 11 player IDs
 *   - bench:    up to 10 player IDs
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth(['COACH', 'ADMIN']);
  if (error) return errorResponse(error, status);

  const academyId = session!.user.academyId!;

  // Fetch the match
  const match = await prisma.matchRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      fromAcademyId: true,
      toAcademyId: true,
      status: true,
      proposedDate: true,
    },
  });

  if (!match) return errorResponse('المباراة غير موجودة', 404);
  if (match.status !== 'ACCEPTED') return errorResponse('يمكن تحديد التشكيلة للمباريات المقبولة فقط', 400);

  // Make sure the coach's academy is a participant
  const isFromAcademy = match.fromAcademyId === academyId;
  const isToAcademy   = match.toAcademyId   === academyId;
  if (!isFromAcademy && !isToAcademy) {
    return errorResponse('غير مصرح — أكاديميتك ليست طرفاً في هذه المباراة', 403);
  }

  const body = await request.json() as { starting?: string[]; bench?: string[] };
  const starting: string[] = Array.isArray(body.starting) ? body.starting.slice(0, 11) : [];
  const bench: string[]    = Array.isArray(body.bench)    ? body.bench.slice(0, 10)    : [];

  // Validate no overlap
  const overlap = starting.filter((id) => bench.includes(id));
  if (overlap.length > 0) {
    return errorResponse('لا يمكن أن يكون اللاعب في التشكيلة الأساسية والاحتياطية معاً', 400);
  }

  // Verify all player IDs belong to the coach's academy
  const allIds = [...starting, ...bench];
  if (allIds.length > 0) {
    const validPlayers = await prisma.player.findMany({
      where: { id: { in: allIds }, academyId },
      select: { id: true },
    });
    const validIds = new Set(validPlayers.map((p) => p.id));
    const invalid = allIds.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      return errorResponse('بعض اللاعبين لا ينتمون لأكاديميتك', 400);
    }
  }

  const lineupJson = JSON.stringify({ starting, bench });

  // Determine which field to update (home or away side)
  // homeOrAway on MatchRequest is from fromAcademy perspective:
  //   fromAcademy HOME → fromAcademy is the home side → lineupHome belongs to fromAcademy
  const updatedMatch = await prisma.matchRequest.findUnique({
    where: { id: params.id },
    select: { homeOrAway: true },
  });

  // Determine if our academy is on the "home" side of the match
  const ourSideIsHome =
    (isFromAcademy && updatedMatch!.homeOrAway === 'HOME') ||
    (isToAcademy   && updatedMatch!.homeOrAway === 'AWAY');

  const updated = await prisma.matchRequest.update({
    where: { id: params.id },
    data: ourSideIsHome
      ? { lineupHome: lineupJson }
      : { lineupAway: lineupJson },
  });

  return successResponse({
    matchId: updated.id,
    side: ourSideIsHome ? 'home' : 'away',
    lineup: { starting, bench },
  });
}

/**
 * GET /api/coach/matches/[id]/lineup
 * Returns lineups for both academies (names + positions).
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth(['COACH', 'ADMIN']);
  if (error) return errorResponse(error, status);

  const academyId = session!.user.academyId!;

  const match = await prisma.matchRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      fromAcademyId: true,
      toAcademyId: true,
      homeOrAway: true,
      lineupHome: true,
      lineupAway: true,
      status: true,
    },
  });

  if (!match) return errorResponse('المباراة غير موجودة', 404);

  const isFromAcademy = match.fromAcademyId === academyId;
  const isToAcademy   = match.toAcademyId   === academyId;
  if (!isFromAcademy && !isToAcademy) {
    return errorResponse('غير مصرح', 403);
  }

  // Parse lineups
  const parseLineup = (raw: string | null) => {
    if (!raw) return { starting: [], bench: [] };
    try { return JSON.parse(raw) as { starting: string[]; bench: string[] }; }
    catch { return { starting: [], bench: [] }; }
  };

  const homeLineup = parseLineup(match.lineupHome);
  const awayLineup = parseLineup(match.lineupAway);

  // Resolve player names for both lineups
  const allIds = [...homeLineup.starting, ...homeLineup.bench, ...awayLineup.starting, ...awayLineup.bench];
  const players = allIds.length > 0
    ? await prisma.player.findMany({
        where: { id: { in: allIds } },
        select: { id: true, name: true, position: true, photoUrl: true },
      })
    : [];
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  const resolveIds = (ids: string[]) =>
    ids.map((id) => playerMap[id] ?? { id, name: 'لاعب غير معروف', position: null, photoUrl: null });

  return successResponse({
    matchId: match.id,
    home: {
      lineup: {
        starting: resolveIds(homeLineup.starting),
        bench:    resolveIds(homeLineup.bench),
      },
    },
    away: {
      lineup: {
        starting: resolveIds(awayLineup.starting),
        bench:    resolveIds(awayLineup.bench),
      },
    },
  });
}
