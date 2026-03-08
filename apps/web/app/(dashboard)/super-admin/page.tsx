import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function SuperAdminDashboard() {
  const [academies, totalPlayers, totalUsers] = await Promise.all([
    prisma.academy.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { players: true, teams: true, coaches: true } } },
    }),
    prisma.player.count(),
    prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم — المدير العام</h1>
        <Link href="/super-admin/academies/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + إضافة أكاديمية
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'الأكاديميات', value: academies.length, icon: '🏟️', color: 'bg-blue-50 border-blue-200' },
          { label: 'اللاعبون (الكل)', value: totalPlayers, icon: '⚽', color: 'bg-green-50 border-green-200' },
          { label: 'المستخدمون', value: totalUsers, icon: '👥', color: 'bg-purple-50 border-purple-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold text-gray-800">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Academy cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {academies.map((a) => {
          const groups: string[] = JSON.parse(a.ageGroups);
          return (
            <Link key={a.id} href={`/super-admin/academies/${a.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                  {a.logoUrl ? <img src={a.logoUrl} alt={a.name} className="w-10 h-10 object-cover rounded-full" /> : '🏟️'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{a.name}</h3>
                  {a.city && <p className="text-xs text-gray-500">{a.city}</p>}
                </div>
              </div>
              <div className="flex gap-3 text-sm text-gray-600 mb-3">
                <span>⚽ {a._count.players} لاعب</span>
                <span>🏆 {a._count.teams} فريق</span>
                <span>👨‍💼 {a._count.coaches} مدرب</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {groups.map((g) => (
                  <span key={g} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{g}</span>
                ))}
              </div>
            </Link>
          );
        })}
        {academies.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">🏟️</div>
            <p>لا توجد أكاديميات بعد. ابدأ بإضافة أكاديمية جديدة.</p>
          </div>
        )}
      </div>
    </div>
  );
}
