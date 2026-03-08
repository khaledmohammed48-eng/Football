import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { PlayerProfileClient } from '@/app/(dashboard)/admin/players/[id]/player-profile-client';

export default async function CoachPlayerPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, teamId: true },
  });

  if (!coach) redirect('/coach/team');

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: {
      team: { select: { id: true, name: true } },
      attributes: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { coach: { select: { name: true } } },
      },
    },
  });

  if (!player) notFound();

  // Enforce that player is on coach's team
  if (player.teamId !== coach.teamId) redirect('/coach/team');

  const serialized = {
    ...player,
    dateOfBirth: player.dateOfBirth?.toISOString() ?? null,
    subscriptionEnd: player.subscriptionEnd?.toISOString() ?? null,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
    attributes: player.attributes
      ? { ...player.attributes, updatedAt: player.attributes.updatedAt.toISOString() }
      : null,
    notes: player.notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/coach/team" className="text-gray-400 hover:text-gray-600 transition">
          ← الفريق
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{player.name}</h1>
      </div>
      <PlayerProfileClient
        player={serialized}
        teams={player.team ? [player.team] : []}
        isAdmin={false}
        coachId={coach.id}
      />
    </div>
  );
}
