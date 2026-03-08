'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface LeagueTeam {
  id: string;
  teamName: string;
  logoUrl: string | null;
}

interface LeagueMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: LeagueTeam;
  awayTeam: LeagueTeam;
  homeScore: number | null;
  awayScore: number | null;
  scheduledDate: string | null;
  location: string | null;
  status: string;
  round: number;
}

interface Standing {
  id: string;
  teamName: string;
  logoUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

interface League {
  id: string;
  name: string;
  type: string;
  ageGroup: string | null;
  status: string;
  season: string | null;
  rounds: number;
  teams: LeagueTeam[];
  matches: LeagueMatch[];
  standings: Standing[];
}

const TROPHY = ['🥇', '🥈', '🥉'];

export default function LeagueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'standings' | 'matches'>('standings');
  const [generating, setGenerating] = useState(false);
  const [editMatch, setEditMatch] = useState<LeagueMatch | null>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedLocation, setSchedLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/leagues/${id}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setLeague(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    const res = await fetch(`/api/leagues/${id}/generate`, { method: 'POST' });
    setGenerating(false);
    if (res.ok) load();
  };

  const openEdit = (m: LeagueMatch) => {
    setEditMatch(m);
    setHomeScore(m.homeScore !== null ? String(m.homeScore) : '');
    setAwayScore(m.awayScore !== null ? String(m.awayScore) : '');
    setSchedDate(m.scheduledDate ? m.scheduledDate.slice(0, 16) : '');
    setSchedLocation(m.location ?? '');
  };

  const saveMatch = async () => {
    if (!editMatch) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      location: schedLocation || null,
      scheduledDate: schedDate || null,
    };
    if (homeScore !== '' && awayScore !== '') {
      body.homeScore = Number(homeScore);
      body.awayScore = Number(awayScore);
    }
    await fetch(`/api/leagues/${id}/matches/${editMatch.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setEditMatch(null);
    load();
  };

  const changeStatus = async (status: string) => {
    await fetch(`/api/leagues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteLeague = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الدوري؟')) return;
    await fetch(`/api/leagues/${id}`, { method: 'DELETE' });
    router.push('/admin/leagues');
  };

  if (loading) return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;
  if (!league) return <div className="text-center py-20 text-red-500">الدوري غير موجود</div>;

  const rounds = Array.from(new Set(league.matches.map(m => m.round))).sort((a, b) => a - b);
  const champion = league.standings[0];

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/leagues" className="text-sm text-gray-400 hover:text-gray-600 mb-1 inline-block">
            ← الدوريات
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🏅 {league.name}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {league.type === 'INTERNAL' ? 'داخلي' : 'خارجي'}
            </span>
            {league.ageGroup && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{league.ageGroup}</span>
            )}
            {league.season && <span className="text-xs text-gray-400">{league.season}</span>}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              league.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              league.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {league.status === 'DRAFT' ? 'مسودة' : league.status === 'ACTIVE' ? 'جارٍ' : 'منتهي'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {league.status === 'ACTIVE' && (
            <button onClick={() => changeStatus('COMPLETED')} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              إنهاء الدوري
            </button>
          )}
          <button onClick={deleteLeague} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
            حذف
          </button>
        </div>
      </div>

      {/* Trophy banner (completed league) */}
      {league.status === 'COMPLETED' && champion && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="text-5xl">🏆</div>
          <div>
            <div className="text-xs text-yellow-600 font-semibold">بطل الدوري</div>
            <div className="text-2xl font-bold text-yellow-800">{champion.teamName}</div>
            <div className="text-sm text-yellow-600">{champion.pts} نقطة · {champion.won} فوز</div>
          </div>
          <div className="mr-auto flex gap-6 text-center">
            {league.standings.slice(0, 3).map((s, i) => (
              <div key={s.id}>
                <div className="text-2xl">{TROPHY[i]}</div>
                <div className="text-xs font-semibold text-gray-700 mt-1">{s.teamName}</div>
                <div className="text-xs text-gray-500">{s.pts} نقطة</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate matches button */}
      {league.matches.length === 0 && league.teams.length >= 2 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="font-semibold text-green-800">جاهز لتوليد جدول المباريات</div>
            <div className="text-sm text-green-600 mt-0.5">
              {league.teams.length} فريق · {league.rounds === 1 ? 'جولة واحدة' : 'ذهاب وإياب'}
            </div>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {generating ? 'جاري التوليد...' : 'توليد جدول المباريات'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['standings', 'matches'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'standings' ? '📊 الترتيب' : '📅 المباريات'}
          </button>
        ))}
      </div>

      {/* Standings table */}
      {tab === 'standings' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {league.standings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">لا توجد نتائج بعد</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="text-right px-4 py-3 w-8">#</th>
                  <th className="text-right px-4 py-3">الفريق</th>
                  <th className="text-center px-2 py-3">ل</th>
                  <th className="text-center px-2 py-3">ف</th>
                  <th className="text-center px-2 py-3">ت</th>
                  <th className="text-center px-2 py-3">خ</th>
                  <th className="text-center px-2 py-3">أف</th>
                  <th className="text-center px-2 py-3">أع</th>
                  <th className="text-center px-2 py-3">فا</th>
                  <th className="text-center px-3 py-3 font-bold text-gray-700">ن</th>
                </tr>
              </thead>
              <tbody>
                {league.standings.map((s, i) => (
                  <tr key={s.id} className={`border-t border-gray-50 ${i === 0 && league.status === 'COMPLETED' ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 text-center font-semibold text-gray-500">
                      {i < 3 ? <span>{TROPHY[i]}</span> : <span className="text-gray-400">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.teamName}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{s.played}</td>
                    <td className="px-2 py-3 text-center text-green-600 font-medium">{s.won}</td>
                    <td className="px-2 py-3 text-center text-gray-500">{s.drawn}</td>
                    <td className="px-2 py-3 text-center text-red-500">{s.lost}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{s.gf}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{s.ga}</td>
                    <td className={`px-2 py-3 text-center font-medium ${s.gd > 0 ? 'text-green-600' : s.gd < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                      {s.gd > 0 ? '+' : ''}{s.gd}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-gray-900">{s.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 border-t border-gray-100">
            ل=لعب · ف=فوز · ت=تعادل · خ=خسارة · أف=أهداف له · أع=أهداف عليه · فا=فارق الأهداف · ن=نقاط
          </div>
        </div>
      )}

      {/* Matches tab */}
      {tab === 'matches' && (
        <div className="space-y-5">
          {league.matches.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
              لم يتم توليد المباريات بعد
            </div>
          ) : rounds.map(round => (
            <div key={round} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 text-sm">
                الجولة {round}
              </div>
              <div className="divide-y divide-gray-50">
                {league.matches.filter(m => m.round === round).map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                    <div className="flex-1 text-right font-semibold text-gray-800">{m.homeTeam.teamName}</div>
                    <div className="mx-4 flex items-center gap-2">
                      {m.status === 'COMPLETED' ? (
                        <span className="font-bold text-lg text-gray-900">{m.homeScore} - {m.awayScore}</span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          {m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : 'غير محدد'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-right font-semibold text-gray-800">{m.awayTeam.teamName}</div>
                    {league.status !== 'COMPLETED' && (
                      <button
                        onClick={() => openEdit(m)}
                        className="mr-4 text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        تعديل
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit match modal */}
      {editMatch && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditMatch(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 mb-4">
              {editMatch.homeTeam.teamName} vs {editMatch.awayTeam.teamName}
            </h3>

            {/* Score */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">النتيجة</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={e => setHomeScore(e.target.value)}
                  placeholder="أهداف"
                  className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-center text-lg font-bold focus:ring-2 focus:ring-green-500 outline-none"
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={e => setAwayScore(e.target.value)}
                  placeholder="أهداف"
                  className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-center text-lg font-bold focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">تاريخ المباراة</label>
              <input
                type="datetime-local"
                value={schedDate}
                onChange={e => setSchedDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {/* Location */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">الملعب</label>
              <input
                value={schedLocation}
                onChange={e => setSchedLocation(e.target.value)}
                placeholder="اسم الملعب أو الموقع"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveMatch}
                disabled={saving}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? 'حفظ...' : 'حفظ'}
              </button>
              <button
                onClick={() => setEditMatch(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
