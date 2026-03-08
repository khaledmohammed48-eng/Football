'use client';

import { useState, useEffect } from 'react';
import { LineupBuilder } from './lineup-builder';

interface Academy { id: string; name: string; logoUrl?: string | null; city?: string | null; }
interface Lineup  { starting: string[]; bench: string[]; }

export interface MatchItem {
  id: string;
  ageGroup: string;
  proposedDate: string;
  location?: string | null;
  homeOrAway: string;
  notes?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  resultNotes?: string | null;
  fromAcademy: Academy;
  toAcademy: Academy;
  fromAcademyId: string;
  toAcademyId: string;
  isHome: boolean;
  myAcademy: Academy;
  opponent: Academy;
  // Coach-only fields:
  myLineup?: Lineup;
  lineupSide?: 'home' | 'away';
}

interface MatchesListProps {
  apiUrl: string;
  /** Pass true in coach context to show lineup builder */
  showLineup?: boolean;
}

export function MatchesList({ apiUrl, showLineup = false }: MatchesListProps) {
  const [matches, setMatches]           = useState<MatchItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [builderMatch, setBuilderMatch] = useState<MatchItem | null>(null);

  useEffect(() => {
    fetch(apiUrl)
      .then((r) => r.json())
      .then((data) => {
        setMatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('تعذّر تحميل المباريات');
        setLoading(false);
      });
  }, [apiUrl]); // eslint-disable-line

  if (loading) return <div className="text-center py-10 text-gray-400">جارٍ التحميل...</div>;
  if (error)   return <div className="text-center py-10 text-red-500 text-sm">{error}</div>;

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="text-4xl mb-3">⚔️</div>
        <p className="text-gray-400 text-sm">لا توجد مباريات مؤكدة بعد</p>
        <p className="text-xs text-gray-400 mt-1">ستظهر المباريات هنا بعد قبول الطلبات من المدير</p>
      </div>
    );
  }

  const now = new Date();
  const upcoming = matches.filter((m) => new Date(m.proposedDate) >= now);
  const past     = matches.filter((m) => new Date(m.proposedDate) < now);

  function ResultScore({ m }: { m: MatchItem }) {
    if (m.homeScore === null || m.homeScore === undefined) {
      return <div className="text-center py-2 text-gray-300 text-xs">لم تُسجَّل النتيجة بعد</div>;
    }
    const myScore  = m.isHome ? m.homeScore : m.awayScore!;
    const oppScore = m.isHome ? m.awayScore! : m.homeScore;
    const win = myScore > oppScore;
    const draw = myScore === oppScore;
    return (
      <div className={`flex flex-col items-center py-2 px-4 rounded-xl ${win ? 'bg-green-50' : draw ? 'bg-gray-50' : 'bg-red-50'}`}>
        <div className={`text-3xl font-black tracking-widest ${win ? 'text-green-700' : draw ? 'text-gray-700' : 'text-red-600'}`}>
          {m.homeScore} <span className="text-xl font-normal text-gray-400">-</span> {m.awayScore}
        </div>
        <div className={`text-xs font-semibold mt-0.5 ${win ? 'text-green-600' : draw ? 'text-gray-500' : 'text-red-500'}`}>
          {win ? '🏆 فوز' : draw ? '🤝 تعادل' : '❌ خسارة'}
        </div>
        {m.resultNotes && <div className="text-xs text-gray-500 mt-1 text-center">📝 {m.resultNotes}</div>}
      </div>
    );
  }

  function LineupBadge({ lineup }: { lineup: Lineup }) {
    const total = lineup.starting.length + lineup.bench.length;
    if (total === 0) return null;
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
        📋 {lineup.starting.length} أساسي · {lineup.bench.length} احتياط
      </span>
    );
  }

  function MatchCard({ m }: { m: MatchItem }) {
    const isPast   = new Date(m.proposedDate) < now;
    const hasLineup = showLineup && m.myLineup && (m.myLineup.starting.length + m.myLineup.bench.length) > 0;

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header row */}
        <div className={`px-4 py-2 flex items-center justify-between text-xs ${isPast ? 'bg-gray-50' : 'bg-green-50'}`}>
          {/* Left side: lineup controls */}
          <div className="flex items-center gap-2">
            {showLineup && !isPast && (
              <button
                onClick={() => setBuilderMatch(m)}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
              >
                📋 {hasLineup ? 'تعديل التشكيلة' : 'إضافة تشكيلة'}
              </button>
            )}
            {showLineup && m.myLineup && <LineupBadge lineup={m.myLineup} />}
          </div>
          {/* Right side: status + age group */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400">فئة {m.ageGroup}</span>
            <span className={`font-medium ${isPast ? 'text-gray-500' : 'text-green-700'}`}>
              {isPast ? '✅ منتهية' : '⏳ قادمة'}
            </span>
          </div>
        </div>

        <div className="p-4">
          {/* Teams row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* My academy */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg mb-1 overflow-hidden">
                {m.myAcademy.logoUrl
                  ? <img src={m.myAcademy.logoUrl} alt={m.myAcademy.name} className="w-10 h-10 object-cover rounded-full" />
                  : '🏆'}
              </div>
              <span className="text-xs font-semibold text-gray-900 leading-tight">{m.myAcademy.name}</span>
              <span className="text-xs text-blue-600 mt-0.5">{m.isHome ? '🏠 الأرض' : '✈️ الزوار'}</span>
            </div>

            {/* Score or VS */}
            <div className="flex-shrink-0 px-2">
              {isPast ? <ResultScore m={m} /> : (
                <div className="text-center">
                  <div className="text-gray-300 font-bold text-lg">VS</div>
                </div>
              )}
            </div>

            {/* Opponent */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg mb-1 overflow-hidden">
                {m.opponent.logoUrl
                  ? <img src={m.opponent.logoUrl} alt={m.opponent.name} className="w-10 h-10 object-cover rounded-full" />
                  : '🏆'}
              </div>
              <span className="text-xs font-semibold text-gray-900 leading-tight">{m.opponent.name}</span>
              {m.opponent.city && <span className="text-xs text-gray-400 mt-0.5">{m.opponent.city}</span>}
            </div>
          </div>

          {/* Match details */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>📅 {new Date(m.proposedDate).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {m.location && <span>📍 {m.location}</span>}
          </div>
          {m.notes && <p className="text-xs text-gray-400 mt-1.5 bg-gray-50 rounded px-2 py-1">{m.notes}</p>}

          {/* Lineup summary (coach view only) */}
          {showLineup && m.myLineup && m.myLineup.starting.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-600 mb-1.5">📋 التشكيلة المسجّلة</p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>🟢 أساسيون: {m.myLineup.starting.length}</span>
                <span>🟡 احتياط: {m.myLineup.bench.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Lineup builder modal */}
      {builderMatch && (
        <LineupBuilder
          matchId={builderMatch.id}
          matchTitle={`${builderMatch.myAcademy.name} ضد ${builderMatch.opponent.name}`}
          initialLineup={builderMatch.myLineup ?? { starting: [], bench: [] }}
          onClose={() => setBuilderMatch(null)}
          onSaved={(lineup) => {
            setMatches((prev) =>
              prev.map((m) => m.id === builderMatch.id ? { ...m, myLineup: lineup } : m)
            );
            setBuilderMatch(null);
          }}
        />
      )}

      <div className="space-y-6">
        {upcoming.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">⏳ المباريات القادمة ({upcoming.length})</h3>
            <div className="space-y-3">{upcoming.map((m) => <MatchCard key={m.id} m={m} />)}</div>
          </div>
        )}
        {past.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 النتائج السابقة ({past.length})</h3>
            <div className="space-y-3">{past.map((m) => <MatchCard key={m.id} m={m} />)}</div>
          </div>
        )}
      </div>
    </>
  );
}
