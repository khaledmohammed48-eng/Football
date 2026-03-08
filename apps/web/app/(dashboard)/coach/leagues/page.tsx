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
  teams: { id: string; teamName: string }[];
  matches: { status: string }[];
}

const STATUS_LABELS: Record<string, string> = { DRAFT: 'مسودة', ACTIVE: 'جارٍ', COMPLETED: 'منتهي' };
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

export default function CoachLeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leagues').then(r => r.json()).then(d => { setLeagues(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">الدوريات والبطولات</h1>
        <p className="text-gray-500 text-sm mt-1">اطلع على جدول المباريات والترتيب</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">جاري التحميل...</div>
      ) : leagues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">🏅</div>
          <p className="text-gray-400">لا توجد دوريات بعد</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {leagues.map(l => (
            <Link
              key={l.id}
              href={`/coach/leagues/${l.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🏅</div>
                <div>
                  <div className="font-bold text-gray-900">{l.name}</div>
                  <div className="flex gap-2 mt-1">
                    {l.ageGroup && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{l.ageGroup}</span>}
                    {l.season && <span className="text-xs text-gray-400">{l.season}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{l.teams.length} فريق</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[l.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[l.status] ?? l.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
