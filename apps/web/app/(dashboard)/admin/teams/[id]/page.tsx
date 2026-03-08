import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { POSITION_LABELS } from '@football-academy/shared';
import { TeamEditForm } from './team-edit-form';
import { AssignCoachPanel } from './assign-coach-panel';

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const [team, allCoaches] = await Promise.all([
    prisma.team.findUnique({
      where: { id: params.id },
      include: {
        coaches: { select: { id: true, name: true, photoUrl: true } },
        players: { select: { id: true, name: true, photoUrl: true, position: true } },
      },
    }),
    prisma.coach.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, photoUrl: true, teamId: true },
    }),
  ]);

  if (!team) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/teams" className="text-gray-400 hover:text-gray-600 transition">
          ← الفرق
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Edit Form */}
        <div>
          <TeamEditForm team={{ id: team.id, name: team.name, description: team.description }} />
        </div>

        {/* Coaches — with assign panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            المدربون ({team.coaches.length})
          </h2>

          {/* Currently assigned coaches */}
          {team.coaches.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">لا يوجد مدربون معيّنون لهذا الفريق</p>
          ) : (
            <div className="space-y-2 mb-4">
              {team.coaches.map((coach) => (
                <div key={coach.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {coach.photoUrl ? (
                      <img src={coach.photoUrl} alt={coach.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : <span>👨‍💼</span>}
                  </div>
                  <span className="text-sm font-medium text-gray-900 flex-1">{coach.name}</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">مُعيَّن</span>
                </div>
              ))}
            </div>
          )}

          {/* Assign / unassign */}
          <AssignCoachPanel
            teamId={team.id}
            assignedCoachIds={team.coaches.map((c) => c.id)}
            allCoaches={allCoaches}
          />
        </div>

        {/* Players */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            اللاعبون ({team.players.length})
          </h2>
          {team.players.length === 0 ? (
            <p className="text-sm text-gray-400">لا يوجد لاعبون في هذا الفريق</p>
          ) : (
            <div className="space-y-3">
              {team.players.map((player) => (
                <Link
                  key={player.id}
                  href={`/admin/players/${player.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : '⚽'}
                  </div>
                  <div>
                    <div className="text-sm text-gray-900">{player.name}</div>
                    {player.position && (
                      <div className="text-xs text-gray-500">
                        {POSITION_LABELS[player.position as keyof typeof POSITION_LABELS]}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
