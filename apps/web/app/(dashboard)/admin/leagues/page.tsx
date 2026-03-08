'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface League {
  id: string;
  name: string;
  type: string;
  ageGroup: string | null;
  status: string;
  season: string | null;
  rounds: number;
  teams: { id: string; teamName: string }[];
  matches: { status: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  ACTIVE: 'جارٍ',
  COMPLETED: 'منتهي',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

const TYPE_LABELS: Record<string, string> = {
  INTERNAL: 'داخلي',
  EXTERNAL: 'خارجي',
};

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leagues')
      .then(r => r.json())
      .then(data => { setLeagues(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const completedMatches = (league: League) => league.matches.filter(m => m.status === 'COMPLETED').length;

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الدوريات والبطولات</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة الدوريات الداخلية والخارجية</p>
        </div>
        <Link
          href="/admin/leagues/new"
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2"
        >
          <span>+</span>
          <span>إنشاء دوري</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20 text-lg">جاري التحميل...</div>
      ) : leagues.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🏅</div>
          <p className="text-gray-500 text-lg font-medium">لا يوجد دوريات بعد</p>
          <p className="text-gray-400 text-sm mt-1">أنشئ أول دوري الآن</p>
          <Link
            href="/admin/leagues/new"
            className="mt-5 inline-block bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition"
          >
            إنشاء دوري
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {leagues.map(league => (
            <Link
              key={league.id}
              href={`/admin/leagues/${league.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-2xl flex-shrink-0">
                  🏅
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{league.name}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[league.type] ?? league.type}
                    </span>
                    {league.ageGroup && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {league.ageGroup}
                      </span>
                    )}
                    {league.season && (
                      <span className="text-xs text-gray-400">{league.season}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-800">{league.teams.length}</div>
                  <div className="text-xs text-gray-400">فريق</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">{completedMatches(league)}/{league.matches.length}</div>
                  <div className="text-xs text-gray-400">مباريات</div>
                </div>
                <div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[league.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[league.status] ?? league.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
