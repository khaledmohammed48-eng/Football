import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PlayerProfileClient } from './player-profile-client';
import { FifaCardModal } from '@/components/player/fifa-card';

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const [player, teams, academy] = await Promise.all([
    prisma.player.findUnique({
      where: { id: params.id },
      include: {
        team: { select: { id: true, name: true } },
        attributes: true,
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { coach: { select: { name: true, photoUrl: true } } },
        },
      },
    }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    session?.user?.academyId
      ? prisma.academy.findUnique({ where: { id: session.user.academyId }, select: { name: true, logoUrl: true } })
      : null,
  ]);

  if (!player) notFound();

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
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/players" className="text-gray-400 hover:text-gray-600 transition">
            ← اللاعبون
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900">{player.name}</h1>
        </div>
        <FifaCardModal
          data={{
            playerName: player.name,
            photoUrl: player.photoUrl,
            position: player.position,
            attributes: player.attributes,
            academyName: academy?.name ?? 'الأكاديمية',
            academyLogoUrl: academy?.logoUrl,
          }}
        />
      </div>
      <PlayerProfileClient player={serialized} teams={teams} isAdmin />
    </div>
  );
}
