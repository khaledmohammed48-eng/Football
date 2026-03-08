import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { SessionPlanViewer } from '@/components/coach/session-plan-viewer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getStats(academyId: string) {
  const [teams, players, coaches] = await Promise.all([
    prisma.team.count({ where: { academyId } }),
    prisma.player.count({ where: { academyId } }),
    prisma.coach.count({ where: { academyId } }),
  ]);
  return { teams, players, coaches };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const academyId = session!.user.academyId!;

  const stats = await getStats(academyId);

  const rawSessions = await prisma.sessionPlan.findMany({
    where: { date: { gte: new Date() }, team: { academyId } },
    orderBy: { date: 'asc' },
    take: 10,
    include: {
      coach: { select: { name: true } },
      team: { select: { name: true } },
    },
  });

  const upcomingSessions = rawSessions.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date.toISOString(),
    description: s.description,
    exercises: JSON.parse(s.exercises) as { name: string; duration: string; notes: string }[],
    targetGroupId: s.targetGroupId,
    coachName: s.coach.name,
    teamName: s.team.name,
  }));

  const cards = [
    { label: 'الفرق', value: stats.teams, icon: '🏆', href: '/admin/teams', color: 'bg-blue-50 border-blue-200' },
    { label: 'اللاعبون', value: stats.players, icon: '⚽', href: '/admin/players', color: 'bg-green-50 border-green-200' },
    { label: 'المدربون', value: stats.coaches, icon: '👨‍💼', href: '/admin/coaches', color: 'bg-orange-50 border-orange-200' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`block border rounded-xl p-6 ${card.color} hover:shadow-md transition`}
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-600 mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Upcoming session plans */}
      {upcomingSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 جلسات التدريب القادمة</h2>
          <SessionPlanViewer sessions={upcomingSessions} showCoachName showTeamName />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
          <div className="space-y-3">
            <Link
              href="/admin/accounts"
              className="flex items-center gap-3 text-sm text-gray-700 hover:text-green-600 transition"
            >
              <span className="text-lg">➕</span>
              <span>إنشاء حساب جديد (لاعب أو مدرب)</span>
            </Link>
            <Link
              href="/admin/teams"
              className="flex items-center gap-3 text-sm text-gray-700 hover:text-green-600 transition"
            >
              <span className="text-lg">🏆</span>
              <span>إدارة الفرق</span>
            </Link>
            <Link
              href="/admin/players"
              className="flex items-center gap-3 text-sm text-gray-700 hover:text-green-600 transition"
            >
              <span className="text-lg">⚽</span>
              <span>عرض جميع اللاعبين</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">معلومات النظام</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>إجمالي الفرق:</span>
              <span className="font-medium text-gray-900">{stats.teams}</span>
            </div>
            <div className="flex justify-between">
              <span>إجمالي اللاعبين:</span>
              <span className="font-medium text-gray-900">{stats.players}</span>
            </div>
            <div className="flex justify-between">
              <span>إجمالي المدربين:</span>
              <span className="font-medium text-gray-900">{stats.coaches}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
