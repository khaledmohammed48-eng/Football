'use client';

import { useState, useEffect, useCallback } from 'react';
import { LineupBuilder } from '@/components/matches/lineup-builder';

interface Academy { id: string; name: string; logoUrl?: string | null; city?: string | null; }
interface Lineup  { starting: string[]; bench: string[]; }
interface MatchRequest {
  id: string; ageGroup: string; proposedDate: string; location?: string | null;
  homeOrAway: string; status: string; notes?: string | null;
  homeScore?: number | null; awayScore?: number | null; resultNotes?: string | null;
  lineupHome?: string | null; lineupAway?: string | null;
  fromAcademy: Academy; toAcademy: Academy; fromAcademyId: string; toAcademyId: string;
}

function parseLineup(raw: string | null | undefined): Lineup {
  if (!raw) return { starting: [], bench: [] };
  try { return JSON.parse(raw) as Lineup; } catch { return { starting: [], bench: [] }; }
}

export default function MatchesPage() {
  const [matches, setMatches]         = useState<MatchRequest[]>([]);
  const [myAcademyId, setMyAcademyId] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [actionMsg, setActionMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const [resultModal, setResultModal] = useState<MatchRequest | null>(null);
  const [homeScore, setHomeScore]     = useState('');
  const [awayScore, setAwayScore]     = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [savingResult, setSavingResult] = useState(false);
  // Lineup state
  const [lineupMatch, setLineupMatch] = useState<MatchRequest | null>(null);
  const [lineupMap, setLineupMap]     = useState<Record<string, Lineup>>({});

  const fetchMatches = useCallback(async () => {
    const [matchRes, sessionRes] = await Promise.all([fetch('/api/matches'), fetch('/api/auth/session')]);
    const [matchData, sessionData] = await Promise.all([matchRes.json(), sessionRes.json()]);
    const list: MatchRequest[] = Array.isArray(matchData) ? matchData : [];
    setMatches(list);
    const aid: string | null = sessionData?.user?.academyId ?? null;
    setMyAcademyId(aid);

    // Pre-populate lineupMap from match data
    if (aid) {
      const map: Record<string, Lineup> = {};
      list.forEach((m) => {
        if (m.status !== 'ACCEPTED') return;
        const isFromAcademy = m.fromAcademyId === aid;
        const ourSideIsHome =
          (isFromAcademy && m.homeOrAway === 'HOME') ||
          (!isFromAcademy && m.homeOrAway === 'AWAY');
        map[m.id] = parseLineup(ourSideIsHome ? m.lineupHome : m.lineupAway);
      });
      setLineupMap(map);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  async function handleAction(id: string, action: 'ACCEPT' | 'REJECT' | 'CANCEL') {
    setActionMsg(null);
    if (action === 'CANCEL') {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      if (res.ok) { setActionMsg({ text: 'تم إلغاء الطلب', ok: true }); fetchMatches(); }
      else { const d = await res.json(); setActionMsg({ text: d.error ?? 'حدث خطأ', ok: false }); }
    } else {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setActionMsg({ text: action === 'ACCEPT' ? 'تم قبول الطلب ✅' : 'تم رفض الطلب', ok: action === 'ACCEPT' });
        fetchMatches();
      } else {
        const d = await res.json();
        setActionMsg({ text: d.error ?? 'حدث خطأ', ok: false });
      }
    }
  }

  function openResultModal(m: MatchRequest) {
    setResultModal(m);
    setHomeScore(m.homeScore !== null && m.homeScore !== undefined ? String(m.homeScore) : '');
    setAwayScore(m.awayScore !== null && m.awayScore !== undefined ? String(m.awayScore) : '');
    setResultNotes(m.resultNotes ?? '');
  }

  async function saveResult() {
    if (!resultModal) return;
    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      setActionMsg({ text: 'يجب إدخال نتيجة صحيحة (أرقام غير سالبة)', ok: false });
      setResultModal(null);
      return;
    }
    setSavingResult(true);
    try {
      const res = await fetch(`/api/matches/${resultModal.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESULT', homeScore: hs, awayScore: as_, resultNotes }),
      });
      if (res.ok) {
        setActionMsg({ text: 'تم حفظ النتيجة ✅', ok: true });
        setResultModal(null);
        fetchMatches();
      } else {
        const d = await res.json();
        setActionMsg({ text: d.error ?? 'حدث خطأ', ok: false });
        setResultModal(null);
      }
    } finally {
      setSavingResult(false);
    }
  }

  const incoming  = matches.filter((m) => m.toAcademyId === myAcademyId && m.status === 'PENDING');
  const outgoing  = matches.filter((m) => m.fromAcademyId === myAcademyId && m.status === 'PENDING');
  const confirmed = matches.filter((m) => m.status === 'ACCEPTED');
  const rejected  = matches.filter((m) => m.status === 'REJECTED');

  function statusBadge(status: string, homeOrAway: string) {
    return (
      <div className="flex gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {status === 'PENDING' ? 'معلق' : status === 'ACCEPTED' ? 'مقبول' : 'مرفوض'}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${homeOrAway === 'HOME' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
          {homeOrAway === 'HOME' ? '🏠 أرضنا' : '✈️ أرضهم'}
        </span>
      </div>
    );
  }

  function ScoreBadge({ m }: { m: MatchRequest }) {
    if (m.homeScore === null || m.homeScore === undefined) return null;
    const isMyHome = m.fromAcademyId === myAcademyId ? m.homeOrAway === 'HOME' : m.homeOrAway === 'AWAY';
    const myScore  = isMyHome ? m.homeScore : m.awayScore!;
    const oppScore = isMyHome ? m.awayScore! : m.homeScore;
    const win = myScore > oppScore; const draw = myScore === oppScore;
    return (
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${win ? 'bg-green-100 text-green-700' : draw ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-600'}`}>
        <span>{m.homeScore}</span><span className="text-xs font-normal mx-0.5">-</span><span>{m.awayScore}</span>
        <span className="text-xs font-medium mr-1">{win ? '🏆 فوز' : draw ? '🤝 تعادل' : '❌ خسارة'}</span>
      </div>
    );
  }

  function MatchCard({ m, isIncoming }: { m: MatchRequest; isIncoming?: boolean }) {
    const opponent = isIncoming ? m.fromAcademy : m.toAcademy;
    const canResult = m.status === 'ACCEPTED' && (m.fromAcademyId === myAcademyId || m.toAcademyId === myAcademyId);
    const myLineup = lineupMap[m.id];
    const lineupCount = myLineup ? myLineup.starting.length + myLineup.bench.length : 0;

    return (
      <div className={`bg-white rounded-xl border p-4 ${m.status === 'PENDING' && isIncoming ? 'border-yellow-300' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{opponent.name}</span>
              {opponent.city && <span className="text-xs text-gray-400">{opponent.city}</span>}
            </div>
            <div className="flex gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
              <span>📅 {new Date(m.proposedDate).toLocaleDateString('ar-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span className="font-medium text-blue-700">فئة: {m.ageGroup}</span>
              {m.location && <span>📍 {m.location}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {statusBadge(m.status, m.homeOrAway)}
            <ScoreBadge m={m} />
          </div>
        </div>
        {m.notes && <p className="text-xs text-gray-500 mb-2 bg-gray-50 rounded px-2 py-1">{m.notes}</p>}
        {m.resultNotes && <p className="text-xs text-blue-600 mb-2 bg-blue-50 rounded px-2 py-1">📝 {m.resultNotes}</p>}
        {m.status === 'PENDING' && isIncoming && (
          <div className="flex gap-2 mt-3">
            <button onClick={() => handleAction(m.id, 'ACCEPT')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-xs font-medium transition">✅ قبول</button>
            <button onClick={() => handleAction(m.id, 'REJECT')} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg text-xs font-medium transition">❌ رفض</button>
          </div>
        )}
        {m.status === 'PENDING' && !isIncoming && (
          <button onClick={() => handleAction(m.id, 'CANCEL')} className="mt-2 text-xs text-gray-500 hover:text-red-500 transition">إلغاء الطلب</button>
        )}
        {/* Confirmed match actions: result + lineup */}
        {canResult && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openResultModal(m)}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition font-medium"
            >
              {m.homeScore !== null && m.homeScore !== undefined ? '✏️ تعديل النتيجة' : '⚽ إدخال النتيجة'}
            </button>
            <button
              onClick={() => setLineupMatch(m)}
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1"
            >
              📋 {lineupCount > 0 ? `تعديل التشكيلة (${myLineup!.starting.length}+${myLineup!.bench.length})` : 'تحديد التشكيلة'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="text-center py-16 text-gray-400">جارٍ التحميل...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">طلبات المباريات</h1>

      {actionMsg && (
        <div className={`mb-4 text-sm border rounded-lg px-4 py-2.5 ${actionMsg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* Result entry modal */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setResultModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">⚽ إدخال نتيجة المباراة</h3>
            <p className="text-xs text-gray-500 mb-4">فئة {resultModal.ageGroup} — {new Date(resultModal.proposedDate).toLocaleDateString('ar-SA')}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-medium truncate">{resultModal.fromAcademy.name} (أرضنا/ضيف)</label>
                <input type="number" min="0" max="99" value={homeScore} onChange={(e) => setHomeScore(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-medium truncate">{resultModal.toAcademy.name} (الزوار)</label>
                <input type="number" min="0" max="99" value={awayScore} onChange={(e) => setAwayScore(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">ملاحظات (اختياري)</label>
              <textarea value={resultNotes} onChange={(e) => setResultNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2}
                placeholder="مثل: مباراة رائعة، هدف في الوقت الإضافي..." />
            </div>
            <div className="flex gap-2">
              <button onClick={saveResult} disabled={savingResult}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition">
                {savingResult ? 'جارٍ الحفظ...' : 'حفظ النتيجة'}
              </button>
              <button onClick={() => setResultModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Lineup builder modal */}
      {lineupMatch && (
        <LineupBuilder
          matchId={lineupMatch.id}
          matchTitle={`${lineupMatch.fromAcademy.name} ضد ${lineupMatch.toAcademy.name} — فئة ${lineupMatch.ageGroup}`}
          initialLineup={lineupMap[lineupMatch.id] ?? { starting: [], bench: [] }}
          playersApiUrl="/api/admin/my-players"
          lineupApiUrl={`/api/coach/matches/${lineupMatch.id}/lineup`}
          onClose={() => setLineupMatch(null)}
          onSaved={(lineup) => {
            setLineupMap((prev) => ({ ...prev, [lineupMatch.id]: lineup }));
            setLineupMatch(null);
          }}
        />
      )}

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3">📥 الطلبات الواردة ({incoming.length})</h2>
        {incoming.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">لا توجد طلبات واردة معلقة</div>
        ) : <div className="space-y-3">{incoming.map((m) => <MatchCard key={m.id} m={m} isIncoming />)}</div>}
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3">📤 الطلبات المُرسَلة ({outgoing.length})</h2>
        {outgoing.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">لا توجد طلبات مرسلة معلقة</div>
        ) : <div className="space-y-3">{outgoing.map((m) => <MatchCard key={m.id} m={m} />)}</div>}
      </section>

      {confirmed.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-green-700 mb-3">✅ المباريات المؤكدة ({confirmed.length})</h2>
          <div className="space-y-3">{confirmed.map((m) => <MatchCard key={m.id} m={m} isIncoming={m.toAcademyId === myAcademyId} />)}</div>
        </section>
      )}

      {rejected.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-400 mb-3">الطلبات المرفوضة ({rejected.length})</h2>
          <div className="space-y-3 opacity-60">{rejected.map((m) => <MatchCard key={m.id} m={m} isIncoming={m.toAcademyId === myAcademyId} />)}</div>
        </section>
      )}

      {matches.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">⚔️</div>
          <p className="text-gray-400">لا توجد طلبات مباريات بعد.</p>
          <p className="text-sm text-gray-400 mt-1">اذهب إلى "أكاديميات أخرى" لإرسال طلب مباراة.</p>
        </div>
      )}
    </div>
  );
}
