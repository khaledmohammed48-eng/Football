import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/leagues/[id]/matches/[matchId]  — record result or update schedule
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league || league.academyId !== session.user.academyId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { homeScore, awayScore, scheduledDate, location, status } = body;

  const updateData: Record<string, unknown> = {};
  if (homeScore !== undefined) updateData.homeScore = homeScore;
  if (awayScore !== undefined) updateData.awayScore = awayScore;
  if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
  if (location !== undefined) updateData.location = location;
  if (status !== undefined) updateData.status = status;

  // Auto-mark as COMPLETED when scores are submitted
  if (homeScore !== undefined && awayScore !== undefined && status === undefined)
    updateData.status = 'COMPLETED';

  const updated = await prisma.leagueMatch.update({
    where: { id: params.matchId },
    data: updateData,
    include: { homeTeam: true, awayTeam: true },
  });

  return NextResponse.json(updated);
}
