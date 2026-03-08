import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/leagues/[id]/generate
// Auto-generate round-robin matches for the league
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const league = await prisma.league.findUnique({
    where: { id: params.id },
    include: { teams: true, matches: true },
  });
  if (!league || league.academyId !== session.user.academyId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (league.matches.length > 0)
    return NextResponse.json({ error: 'Matches already generated' }, { status: 400 });

  const teams = league.teams;
  if (teams.length < 2)
    return NextResponse.json({ error: 'Need at least 2 teams' }, { status: 400 });

  // Generate round-robin pairs (each pair plays `rounds` times)
  const matchesToCreate: { leagueId: string; homeTeamId: string; awayTeamId: string; round: number }[] = [];

  for (let r = 1; r <= league.rounds; r++) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        // Alternate home/away for second round
        const [home, away] = r % 2 === 1 ? [teams[i], teams[j]] : [teams[j], teams[i]];
        matchesToCreate.push({
          leagueId: league.id,
          homeTeamId: home.id,
          awayTeamId: away.id,
          round: r,
        });
      }
    }
  }

  await prisma.leagueMatch.createMany({ data: matchesToCreate });

  // Activate league
  await prisma.league.update({ where: { id: params.id }, data: { status: 'ACTIVE' } });

  return NextResponse.json({ generated: matchesToCreate.length });
}
