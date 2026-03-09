import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CoachTeamClient } from './team-client';
import { CoachTeamSelector } from './team-selector';

export default async function CoachTeamPage({
  searchParams,
}: {
  searchParams: { teamId?: string };
}) {
  const session = await getServerSession(authOptions);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
    include: {
      coachTeams: {
        include: {
          team: {
            include: {
              players: { include: { attributes: true }, orderBy: { name: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!coach || coach.coachTeams.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🏆</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">لم يتم تعيينك في فريق بعد</h2>
        <p className="text-gray-500 text-sm">تواصل مع المدير لتعيينك في فريق</p>
      </div>
    );
  }

  // Determine active team (from query param or first team)
  const allTeams = coach.coachTeams.map((ct) => ({ id: ct.team.id, name: ct.team.name }));
  const selectedTeamId =
    searchParams.teamId && allTeams.find((t) => t.id === searchParams.teamId)
      ? searchParams.teamId
      : allTeams[0].id;

  const activeCoachTeam = coach.coachTeams.find((ct) => ct.teamId === selectedTeamId)!;
  const team = activeCoachTeam.team;

  const rawGroups = await prisma.trainingGroup.findMany({
    where: { coachId: coach.id, teamId: team.id },
    orderBy: { createdAt: 'desc' },
  });

  const players = team.players.map((p) => ({
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
  }));

  const groups = rawGroups.map((g) => ({
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
      {allTeams.length > 1 && (
        <CoachTeamSelector teams={allTeams} selectedTeamId={selectedTeamId} />
      )}
      <CoachTeamClient
        teamName={team.name}
        teamId={team.id}
        coachId={coach.id}
        coachName={coach.name}
        players={players}
        groups={groups}
      />
    </div>
  );
}
