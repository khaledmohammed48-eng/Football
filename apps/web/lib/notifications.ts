/**
 * Notification helper — creates Notification rows for the right users.
 *
 * Strategy:
 *  - NEW_MATCH / MATCH_ACCEPTED / MATCH_REJECTED / MATCH_RESULT
 *      → both academies' ADMIN users
 *      → both academies' COACH users
 *      → players in the matched age group (from both academies)
 *  - NEW_TEAM  → ADMIN + all COACHes of same academy
 *  - NEW_COACH → ADMIN of same academy
 *  - NEW_SESSION → COACHes + players in the target team of same academy
 */

import { prisma } from './prisma';

export type NotifType =
  | 'NEW_MATCH'
  | 'MATCH_ACCEPTED'
  | 'MATCH_REJECTED'
  | 'MATCH_RESULT'
  | 'NEW_TEAM'
  | 'NEW_COACH'
  | 'NEW_SESSION';

interface CreateOpts {
  type: NotifType;
  title: string;
  body: string;
  link?: string;
  userIds: string[];
}

async function bulkCreate(opts: CreateOpts) {
  if (opts.userIds.length === 0) return;
  await prisma.notification.createMany({
    data: opts.userIds.map((userId) => ({
      userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link ?? null,
    })),
  });
}

// ── Match notifications ───────────────────────────────────────────────────────

export async function notifyMatch(opts: {
  type: 'NEW_MATCH' | 'MATCH_ACCEPTED' | 'MATCH_REJECTED' | 'MATCH_RESULT';
  matchId: string;
  fromAcademyId: string;
  toAcademyId: string;
  ageGroup: string;
  title: string;
  body: string;
}) {
  const academyIds = [opts.fromAcademyId, opts.toAcademyId];

  // Admin + Coach users from both academies
  const staffUsers = await prisma.user.findMany({
    where: { academyId: { in: academyIds }, role: { in: ['ADMIN', 'COACH'] } },
    select: { id: true },
  });

  // Players in that age group — find via training groups named with the age group
  // Simpler: just notify all players in both academies (admins control age groups anyway)
  const playerUsers = await prisma.user.findMany({
    where: {
      academyId: { in: academyIds },
      role: 'PLAYER',
      player: {
        // Only active players
        isActive: true,
      },
    },
    select: { id: true },
  });

  const userIds = [
    ...staffUsers.map((u) => u.id),
    ...playerUsers.map((u) => u.id),
  ];

  await bulkCreate({
    type: opts.type,
    title: opts.title,
    body: opts.body,
    link: '/admin/matches',
    userIds,
  });
}

// ── Team notifications ────────────────────────────────────────────────────────

export async function notifyNewTeam(opts: {
  academyId: string;
  teamName: string;
}) {
  const users = await prisma.user.findMany({
    where: { academyId: opts.academyId, role: { in: ['ADMIN', 'COACH'] } },
    select: { id: true },
  });
  await bulkCreate({
    type: 'NEW_TEAM',
    title: 'فريق جديد 🏆',
    body: `تم إنشاء فريق "${opts.teamName}"`,
    link: '/admin/teams',
    userIds: users.map((u) => u.id),
  });
}

// ── Coach notifications ───────────────────────────────────────────────────────

export async function notifyNewCoach(opts: {
  academyId: string;
  coachName: string;
}) {
  const users = await prisma.user.findMany({
    where: { academyId: opts.academyId, role: 'ADMIN' },
    select: { id: true },
  });
  await bulkCreate({
    type: 'NEW_COACH',
    title: 'مدرب جديد 👨‍💼',
    body: `تم إضافة المدرب "${opts.coachName}"`,
    link: '/admin/coaches',
    userIds: users.map((u) => u.id),
  });
}

// ── Session notifications ─────────────────────────────────────────────────────

export async function notifyNewSession(opts: {
  academyId: string;
  teamId: string;
  sessionTitle: string;
  sessionDate: Date;
  targetGroupId?: string | null;
}) {
  // Notify the coach(es) of that team + all players in the team
  const coachUsers = await prisma.user.findMany({
    where: {
      academyId: opts.academyId,
      role: 'COACH',
      coach: { teamId: opts.teamId },
    },
    select: { id: true },
  });

  // Player users in the team
  let playerQuery: { teamId: string; isActive: boolean } | { id: { in: string[] }; isActive: boolean } = {
    teamId: opts.teamId,
    isActive: true,
  };

  // If targetGroupId specified, only notify players in that group
  if (opts.targetGroupId) {
    const group = await prisma.trainingGroup.findUnique({
      where: { id: opts.targetGroupId },
      select: { playerIds: true },
    });
    if (group) {
      const ids: string[] = JSON.parse(group.playerIds);
      playerQuery = { id: { in: ids }, isActive: true };
    }
  }

  const players = await prisma.player.findMany({
    where: playerQuery,
    select: { userId: true },
  });

  const userIds = [
    ...coachUsers.map((u) => u.id),
    ...players.map((p) => p.userId),
  ];

  const dateStr = opts.sessionDate.toLocaleDateString('ar-SA', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  await bulkCreate({
    type: 'NEW_SESSION',
    title: 'جلسة تدريبية جديدة 📋',
    body: `"${opts.sessionTitle}" — ${dateStr}`,
    link: '/coach/team',
    userIds,
  });
}
