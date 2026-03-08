'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface LeagueTeam { id: string; teamName: string; logoUrl: string | null }
interface LeagueMatch {
  id: string; homeTeam: LeagueTeam; awayTeam: LeagueTeam;
  homeScore: number | null; awayScore: number | null;
  scheduledDate: string | null; location: string | null;
  status: string; round: number;
}
interface Standing {
  id: string; teamName: string; played: number; won: number;
  drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number;
}
interface League {
  id: string; name: string; type: string; ageGroup: string | null;
  status: string; season: string | null; teams: LeagueTeam[];
  matches: LeagueMatch[]; standings: Standing[];
}

const TROPHY = ['🥇', '🥈', '🥉'];

export default function PlayerLeagueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'standings' | 'matches'>('standings');

  const load = useCallback(async () => {
    const res = await fetch(`/api/leagues/${id}`);
    if (res.ok) setLeague(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;
  if (!league) return <div className="text-center py-20 text-red-400">الدوري غير موجود</div>;

  const rounds = Array.from(new Set(league.matches.map(m => m.round))).sort((a, b) => a - b);

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <Link href="/player/leagues" className="text-sm text-gray-400 hover:text-gray-600 mb-1 inline-block">← الدوريات</Link>
        <h1 className="text-2xl font-bold text-gray-900">🏅 {league.name}</h1>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {league.ageGroup && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{league.ageGroup}</span>}
          {league.season && <span className="text-xs text-gray-400">{league.season}</span>}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${league.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : league.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {league.status === 'DRAFT' ? 'مسودة' : league.status === 'ACTIVE' ? 'جارٍ' : 'منتهي'}
          </span>
        </div>
      </div>

      {league.status === 'COMPLETED' && league.standings[0] && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-4xl">🏆</div>
          <div>
            <div className="text-xs text-yellow-600 font-semibold">بطل الدوري</div>
            <div className="text-xl font-bold text-yellow-800">{league.standings[0].teamName}</div>
          </div>
          <div className="mr-auto flex gap-4">
            {league.standings.slice(0, 3).map((s, i) => (
              <div key={s.id} className="text-center">
                <div className="text-xl">{TROPHY[i]}</div>
                <div className="text-xs font-semibold text-gray-700">{s.teamName}</div>
                <div className="text-xs text-gray-400">{s.pts} ن</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['standings', 'matches'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t === 'standings' ? '📊 الترتيب' : '📅 المباريات'}
          </button>
        ))}
      </div>

      {tab === 'standings' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {league.standings.length === 0 ? (
            <div className="text-center py-10 text-gray-400">لا نتائج بعد</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs">
                  <th className="text-right px-4 py-3 w-8">#</th>
                  <th className="text-right px-4 py-3">الفريق</th>
                  <th className="text-center px-2 py-3">ل</th>
                  <th className="text-center px-2 py-3">ف</th>
                  <th className="text-center px-2 py-3">ت</th>
                  <th className="text-center px-2 py-3">خ</th>
                  <th className="text-center px-2 py-3">فا</th>
                  <th className="text-center px-3 py-3 font-bold text-gray-700">ن</th>
                </tr>
              </thead>
              <tbody>
                {league.standings.map((s, i) => (
                  <tr key={s.id} className={`border-t border-gray-50 ${i === 0 && league.status === 'COMPLETED' ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 text-center">{i < 3 ? TROPHY[i] : <span className="text-gray-400 text-xs">{i + 1}</span>}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.teamName}</td>
                    <td className="px-2 py-3 text-center text-gray-500">{s.played}</td>
                    <td className="px-2 py-3 text-center text-green-600 font-medium">{s.won}</td>
                    <td className="px-2 py-3 text-center text-gray-400">{s.drawn}</td>
                    <td className="px-2 py-3 text-center text-red-400">{s.lost}</td>
                    <td className={`px-2 py-3 text-center font-medium ${s.gd > 0 ? 'text-green-600' : s.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {s.gd > 0 ? '+' : ''}{s.gd}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-gray-900">{s.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'matches' && (
        <div className="space-y-4">
          {league.matches.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">لا مباريات بعد</div>
          ) : rounds.map(round => (
            <div key={round} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">الجولة {round}</div>
              <div className="divide-y divide-gray-50">
                {league.matches.filter(m => m.round === round).map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex-1 text-right font-semibold text-gray-800">{m.homeTeam.teamName}</div>
                    <div className="mx-4 text-center min-w-16">
                      {m.status === 'COMPLETED'
                        ? <span className="font-bold text-gray-900">{m.homeScore} - {m.awayScore}</span>
                        : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : 'غير محدد'}
                        </span>}
                    </div>
                    <div className="flex-1 font-semibold text-gray-800">{m.awayTeam.teamName}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
