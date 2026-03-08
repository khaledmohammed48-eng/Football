import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const academyId = session.user.academyId;
  if (!academyId) return NextResponse.json({ error: 'No academy' }, { status: 403 });

  const leagues = await prisma.league.findMany({
    where: { academyId },
    include: {
      teams: true,
      matches: { include: { homeTeam: true, awayTeam: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(leagues);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const academyId = session.user.academyId;
  if (!academyId) return NextResponse.json({ error: 'No academy' }, { status: 403 });

  const body = await req.json();
  const { name, type, ageGroup, rounds, season, teamIds, academyIds } = body;

  if (!name || !type) return NextResponse.json({ error: 'name and type required' }, { status: 400 });

  // For INTERNAL, need at least 2 teams; for EXTERNAL, at least 2 academies
  const participants: string[] = type === 'INTERNAL' ? (teamIds ?? []) : (academyIds ?? []);
  if (participants.length < 2)
    return NextResponse.json({ error: 'At least 2 participants required' }, { status: 400 });

  // Fetch participant details for team names
  let leagueTeamsData: { teamId?: string; academyId?: string; teamName: string; logoUrl?: string }[] = [];

  if (type === 'INTERNAL') {
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds }, academyId },
    });
    leagueTeamsData = teams.map(t => ({ teamId: t.id, teamName: t.name, logoUrl: t.logoUrl ?? undefined }));
  } else {
    const academies = await prisma.academy.findMany({
      where: { id: { in: academyIds } },
    });
    // Also add the host academy itself
    const hostAcademy = await prisma.academy.findUnique({ where: { id: academyId } });
    const allAcademies = hostAcademy
      ? [hostAcademy, ...academies.filter(a => a.id !== academyId)]
      : academies;
    leagueTeamsData = allAcademies.map(a => ({
      academyId: a.id,
      teamName: a.name,
      logoUrl: a.logoUrl ?? undefined,
    }));
  }

  const league = await prisma.league.create({
    data: {
      name,
      type,
      ageGroup: ageGroup ?? null,
      rounds: rounds ?? 1,
      season: season ?? null,
      academyId,
      teams: { create: leagueTeamsData },
    },
    include: { teams: true },
  });

  return NextResponse.json(league, { status: 201 });
}
