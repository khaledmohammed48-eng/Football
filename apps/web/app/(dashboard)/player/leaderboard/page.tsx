'use client';

import { useState, useEffect } from 'react';

interface AcademyRow {
  id: string; name: string; logoUrl?: string | null; city?: string | null;
  played: number; won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainst: number; goalDiff: number; points: number;
}

function LeaderboardTable({ table }: { table: AcademyRow[] }) {
  if (table.length === 0) {
    return (
      <div className='text-center py-20 bg-white rounded-xl border border-gray-200'>
        <div className='text-4xl mb-3'>📊</div>
        <p className='text-gray-400'>لا توجد نتائج مسجلة بعد</p>
        <p className='text-xs text-gray-400 mt-1'>يتم احتساب النقاط بعد إدخال نتائج المباريات</p>
      </div>
    );
  }
  return (
    <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-gray-50 border-b border-gray-200'>
              <th className='text-right px-4 py-3 text-xs font-semibold text-gray-500 w-8'>#</th>
              <th className='text-right px-4 py-3 text-xs font-semibold text-gray-500'>الأكاديمية</th>
              <th className='text-center px-3 py-3 text-xs font-semibold text-gray-500'>لعب</th>
              <th className='text-center px-3 py-3 text-xs font-semibold text-green-700'>ف</th>
              <th className='text-center px-3 py-3 text-xs font-semibold text-gray-500'>ت</th>
              <th className='text-center px-3 py-3 text-xs font-semibold text-red-600'>خ</th>
              <th className='text-center px-3 py-3 text-xs font-semibold text-gray-500'>له/عليه</th>
              <th className='text-center px-3 py-3 text-xs font-semibold text-gray-500'>±</th>
              <th className='text-center px-3 py-3 text-xs font-semibold text-blue-700'>نقاط</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {table.map((row, i) => {
              const rank = i + 1;
              return (
                <tr key={row.id} className={rank === 1 ? 'bg-yellow-50' : rank === 2 ? 'bg-gray-50' : rank === 3 ? 'bg-orange-50/40' : 'hover:bg-gray-50'}>
                  <td className='px-4 py-3 text-center'>
                    <span className={'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ' + (rank === 1 ? 'bg-yellow-400 text-white' : rank === 2 ? 'bg-gray-400 text-white' : rank === 3 ? 'bg-orange-400 text-white' : 'text-gray-500')}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2.5'>
                      <div className='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0'>
                        {row.logoUrl ? <img src={row.logoUrl} alt={row.name} className='w-8 h-8 object-cover rounded-full' /> : <span className='text-sm'>🏟️</span>}
                      </div>
                      <div>
                        <div className='font-semibold text-gray-900'>{row.name}</div>
                        {row.city && <div className='text-xs text-gray-400'>{row.city}</div>}
                      </div>
                    </div>
                  </td>
                  <td className='px-3 py-3 text-center text-gray-600'>{row.played}</td>
                  <td className='px-3 py-3 text-center font-medium text-green-700'>{row.won}</td>
                  <td className='px-3 py-3 text-center text-gray-600'>{row.drawn}</td>
                  <td className='px-3 py-3 text-center text-red-600'>{row.lost}</td>
                  <td className='px-3 py-3 text-center text-gray-600'>{row.goalsFor}:{row.goalsAgainst}</td>
                  <td className='px-3 py-3 text-center'>
                    <span className={row.goalDiff > 0 ? 'font-medium text-green-600' : row.goalDiff < 0 ? 'font-medium text-red-600' : 'text-gray-500'}>
                      {row.goalDiff > 0 ? '+' : ''}{row.goalDiff}
                    </span>
                  </td>
                  <td className='px-3 py-3 text-center'>
                    <span className={'inline-block min-w-[32px] text-center font-black text-base rounded-lg py-0.5 px-2 ' + (rank === 1 ? 'text-yellow-700 bg-yellow-100' : rank === 2 ? 'text-gray-600 bg-gray-100' : rank === 3 ? 'text-orange-700 bg-orange-100' : 'text-blue-700 bg-blue-50')}>
                      {row.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PlayerLeaderboardPage() {
  const [table, setTable] = useState<AcademyRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => { setTable(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);
  if (loading) return <div className='text-center py-20 text-gray-400'>جارٍ التحميل...</div>;
  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-900 mb-2'>🏆 جدول ترتيب الأكاديميات</h1>
      <p className='text-sm text-gray-500 mb-8'>فوز = 3 نقاط · تعادل = 1 نقطة · خسارة = 0 نقطة</p>
      <LeaderboardTable table={table} />
    </div>
  );
}
