import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CoachEditForm } from './coach-edit-form';
import { CoachDetailTabs } from './coach-detail-tabs';

export default async function CoachDetailPage({ params }: { params: { id: string } }) {
  const [coach, teams] = await Promise.all([
    prisma.coach.findUnique({
      where: { id: params.id },
      include: {
        team: {
          include: {
            players: {
              include: { attributes: true },
              orderBy: { name: 'asc' },
            },
          },
        },
        coachTeams: { include: { team: { select: { id: true, name: true } } } },
        user: { select: { email: true } },
        sessionPlans: { orderBy: { date: 'desc' }, take: 30 },
        notes: {
          include: { player: { select: { id: true, name: true, photoUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        trainingGroups: { orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  if (!coach) notFound();

  const serialized = {
    ...coach,
    createdAt: coach.createdAt.toISOString(),
    updatedAt: coach.updatedAt.toISOString(),
  };

  // Serialize for client component
  const players = coach.team?.players.map((p) => ({
    id: p.id,
    name: p.name,
    photoUrl: p.photoUrl,
    position: p.position,
    dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
    subscriptionEnd: p.subscriptionEnd?.toISOString() ?? null,
    attributes: p.attributes
      ? {
          speed: p.attributes.speed,
          passing: p.attributes.passing,
          shooting: p.attributes.shooting,
          dribbling: p.attributes.dribbling,
          defense: p.attributes.defense,
          stamina: p.attributes.stamina,
        }
      : null,
  })) ?? [];

  const sessions = coach.sessionPlans.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date.toISOString(),
    description: s.description,
    exercises: JSON.parse(s.exercises) as { name: string; duration: string; notes: string }[],
    targetGroupId: s.targetGroupId,
  }));

  const notes = coach.notes.map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    player: {
      id: n.player.id,
      name: n.player.name,
      photoUrl: n.player.photoUrl,
    },
  }));

  const groups = coach.trainingGroups.map((g) => ({
    id: g.id,
    name: g.name,
    type: g.type,
    playerIds: JSON.parse(g.playerIds) as string[],
    captainId: g.captainId,
    formation: g.formation,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/coaches" className="text-gray-400 hover:text-gray-600 transition">
          ← المدربون
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{coach.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coach Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl overflow-hidden">
              {coach.photoUrl ? (
                <img src={coach.photoUrl} alt={coach.name} className="w-16 h-16 object-cover rounded-full" />
              ) : '👨‍💼'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{coach.name}</h2>
              <p className="text-sm text-gray-500">{coach.user.email}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {coach.coachTeams.length > 0
                  ? coach.coachTeams.map((ct) => ct.team.name).join(' · ')
                  : 'بدون فريق'}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <CoachEditForm coach={{ ...serialized, teamIds: coach.coachTeams.map((ct) => ct.teamId) }} teams={teams} />
      </div>

      {/* Full-width coach detail tabs */}
      <div className="mt-8">
        <CoachDetailTabs
          players={players}
          sessions={sessions}
          notes={notes}
          groups={groups}
          teamName={coach.team?.name ?? null}
        />
      </div>
    </div>
  );
}
