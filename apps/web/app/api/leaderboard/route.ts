import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// Points: win = 3, draw = 1, loss = 0
// homeScore / awayScore relative to fromAcademy perspective
export async function GET() {
  const { error, status } = await requireAuth();
  if (error) return errorResponse(error, status);

  // Get all academies with their matches that have results
  const academies = await prisma.academy.findMany({
    select: {
      id: true, name: true, logoUrl: true, city: true,
      sentRequests: {
        where: { status: 'ACCEPTED', homeScore: { not: null } },
        select: { homeScore: true, awayScore: true, homeOrAway: true },
      },
      receivedRequests: {
        where: { status: 'ACCEPTED', homeScore: { not: null } },
        select: { homeScore: true, awayScore: true, homeOrAway: true },
      },
    },
  });

  const table = academies.map((academy) => {
    let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

    // sentRequests = fromAcademy perspective: homeScore is home side, awayScore is away side
    for (const m of academy.sentRequests) {
      if (m.homeScore === null || m.awayScore === null) continue;
      played++;
      // fromAcademy is the home team if homeOrAway === 'HOME'
      const myGoals  = m.homeOrAway === 'HOME' ? m.homeScore : m.awayScore;
      const oppGoals = m.homeOrAway === 'HOME' ? m.awayScore : m.homeScore;
      goalsFor += myGoals;
      goalsAgainst += oppGoals;
      if (myGoals > oppGoals) won++;
      else if (myGoals === oppGoals) drawn++;
      else lost++;
    }

    // receivedRequests = toAcademy perspective: reversed
    for (const m of academy.receivedRequests) {
      if (m.homeScore === null || m.awayScore === null) continue;
      played++;
      // toAcademy is the away team if homeOrAway === 'HOME' (from fromAcademy's perspective)
      const myGoals  = m.homeOrAway === 'HOME' ? m.awayScore : m.homeScore;
      const oppGoals = m.homeOrAway === 'HOME' ? m.homeScore : m.awayScore;
      goalsFor += myGoals;
      goalsAgainst += oppGoals;
      if (myGoals > oppGoals) won++;
      else if (myGoals === oppGoals) drawn++;
      else lost++;
    }

    const points = won * 3 + drawn * 1;
    const goalDiff = goalsFor - goalsAgainst;

    return {
      id: academy.id,
      name: academy.name,
      logoUrl: academy.logoUrl,
      city: academy.city,
      played, won, drawn, lost, goalsFor, goalsAgainst, goalDiff, points,
    };
  });

  // Sort: points desc, then goal diff desc, then goals for desc
  table.sort((a, b) =>
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor
  );

  return successResponse(table);
}
