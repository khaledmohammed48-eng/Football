import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const league = await prisma.league.findUnique({
    where: { id: params.id },
    include: {
      teams: true,
      matches: {
        include: { homeTeam: true, awayTeam: true },
        orderBy: [{ round: 'asc' }, { scheduledDate: 'asc' }],
      },
    },
  });

  if (!league) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only academy members or SUPER_ADMIN can view
  if (session.user.role !== 'SUPER_ADMIN' && league.academyId !== session.user.academyId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Compute standings
  const standings = computeStandings(league.teams, league.matches);

  return NextResponse.json({ ...league, standings });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league || league.academyId !== session.user.academyId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.league.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      status: body.status ?? undefined,
      season: body.season ?? undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league || league.academyId !== session.user.academyId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.league.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// ─── Standings helper ────────────────────────────────────────────────────────
function computeStandings(
  teams: { id: string; teamName: string; logoUrl: string | null }[],
  matches: {
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
  }[]
) {
  const stats: Record<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }> = {};
  for (const t of teams) stats[t.id] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };

  for (const m of matches) {
    if (m.status !== 'COMPLETED' || m.homeScore == null || m.awayScore == null) continue;
    const h = stats[m.homeTeamId];
    const a = stats[m.awayTeamId];
    if (!h || !a) continue;
    h.played++; a.played++;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.won++; h.pts += 3; a.lost++; }
    else if (m.homeScore < m.awayScore) { a.won++; a.pts += 3; h.lost++; }
    else { h.drawn++; h.pts++; a.drawn++; a.pts++; }
  }

  return teams
    .map(t => ({ ...t, ...stats[t.id], gd: (stats[t.id]?.gf ?? 0) - (stats[t.id]?.ga ?? 0) }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.teamName.localeCompare(b.teamName));
}
