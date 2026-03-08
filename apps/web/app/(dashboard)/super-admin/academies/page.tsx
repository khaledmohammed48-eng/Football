import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function AcademiesListPage() {
  const academies = await prisma.academy.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { players: true, teams: true, users: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الأكاديميات</h1>
        <Link href="/super-admin/academies/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + أكاديمية جديدة
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">الأكاديمية</th>
              <th className="px-4 py-3">المدينة</th>
              <th className="px-4 py-3">الفئات العمرية</th>
              <th className="px-4 py-3">اللاعبون</th>
              <th className="px-4 py-3">الفرق</th>
              <th className="px-4 py-3">المستخدمون</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {academies.map((a) => {
              const groups: string[] = JSON.parse(a.ageGroups);
              return (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{a.name}</div>
                    {a.location && <div className="text-xs text-gray-400">{a.location}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {groups.map((g) => (
                        <span key={g} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{g}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{a._count.players}</td>
                  <td className="px-4 py-3 text-sm text-center">{a._count.teams}</td>
                  <td className="px-4 py-3 text-sm text-center">{a._count.users}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/super-admin/academies/${a.id}`} className="text-xs text-blue-600 hover:underline">عرض</Link>
                      <Link href={`/super-admin/academies/${a.id}/edit`} className="text-xs text-green-600 hover:underline">تعديل</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {academies.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">لا توجد أكاديميات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
