'use client';

import { useState, useEffect } from 'react';

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: 'حارس',
  DEFENDER:   'مدافع',
  MIDFIELDER: 'وسط',
  FORWARD:    'مهاجم',
};

const POSITION_ORDER: Record<string, number> = {
  GOALKEEPER: 0,
  DEFENDER:   1,
  MIDFIELDER: 2,
  FORWARD:    3,
};

interface Player {
  id: string;
  name: string;
  position: string | null;
  photoUrl: string | null;
}

interface Lineup {
  starting: string[];
  bench: string[];
}

interface Props {
  matchId: string;
  matchTitle: string;
  initialLineup: Lineup;
  onClose: () => void;
  onSaved: (lineup: Lineup) => void;
  /** API to load players from. Coach uses /api/coach/my-team, admin uses /api/admin/my-players */
  playersApiUrl?: string;
  /** API to PUT lineup to. Defaults to /api/coach/matches/[id]/lineup */
  lineupApiUrl?: string;
}

export function LineupBuilder({
  matchId,
  matchTitle,
  initialLineup,
  onClose,
  onSaved,
  playersApiUrl = '/api/coach/my-team',
  lineupApiUrl,
}: Props) {
  const saveUrl = lineupApiUrl ?? `/api/coach/matches/${matchId}/lineup`;

  const [players, setPlayers] = useState<Player[]>([]);
  const [starting, setStarting] = useState<string[]>(initialLineup.starting);
  const [bench, setBench]       = useState<string[]>(initialLineup.bench);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch(playersApiUrl)
      .then((r) => r.json())
      .then((data) => {
        // /api/coach/my-team wraps in { players: [] }
        // /api/admin/my-players returns []  directly
        const raw: Player[] = Array.isArray(data)
          ? data
          : Array.isArray(data.players)
            ? data.players
            : [];

        const sorted = raw.sort((a, b) => {
          const pa = POSITION_ORDER[a.position ?? ''] ?? 9;
          const pb = POSITION_ORDER[b.position ?? ''] ?? 9;
          return pa - pb || a.name.localeCompare(b.name);
        });
        setPlayers(sorted);
        setLoading(false);
      })
      .catch(() => { setError('تعذّر تحميل اللاعبين'); setLoading(false); });
  }, [playersApiUrl]); // eslint-disable-line

  const toggle = (playerId: string, list: 'starting' | 'bench') => {
    if (list === 'starting') {
      if (starting.includes(playerId)) {
        setStarting(starting.filter((id) => id !== playerId));
      } else {
        if (starting.length >= 11) {
          setError('الحد الأقصى للتشكيلة الأساسية 11 لاعباً'); return;
        }
        setError(null);
        setBench(bench.filter((id) => id !== playerId));
        setStarting([...starting, playerId]);
      }
    } else {
      if (bench.includes(playerId)) {
        setBench(bench.filter((id) => id !== playerId));
      } else {
        if (bench.length >= 10) {
          setError('الحد الأقصى للاحتياط 10 لاعبين'); return;
        }
        setError(null);
        setStarting(starting.filter((id) => id !== playerId));
        setBench([...bench, playerId]);
      }
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(saveUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starting, bench }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? 'حدث خطأ'); setSaving(false); return; }
      onSaved({ starting, bench });
      onClose();
    } catch {
      setError('تعذّر الحفظ');
      setSaving(false);
    }
  };

  const getStatus = (id: string) => {
    if (starting.includes(id)) return 'starting';
    if (bench.includes(id))    return 'bench';
    return 'none';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 text-right overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-5 py-4 flex items-center justify-between">
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
          <div className="text-right">
            <h2 className="text-white font-bold text-base">📋 تشكيلة المباراة</h2>
            <p className="text-green-100 text-xs mt-0.5 truncate max-w-xs">{matchTitle}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center justify-end gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
            غير محدد
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            أساسي ({starting.length}/11)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
            احتياط ({bench.length}/10)
          </span>
        </div>

        {/* Player list */}
        <div className="px-4 py-3 overflow-y-auto max-h-[55vh]">
          {loading && <p className="text-center text-gray-400 py-8">جارٍ التحميل...</p>}
          {!loading && players.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">
              لا توجد لاعبون — تأكد من إضافة لاعبين للأكاديمية أولاً
            </p>
          )}
          {!loading && players.map((player) => {
            const status = getStatus(player.id);
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 py-2.5 px-2 rounded-lg mb-1 transition-colors ${
                  status === 'starting' ? 'bg-green-50 border border-green-200' :
                  status === 'bench'    ? 'bg-orange-50 border border-orange-200' :
                  'border border-transparent hover:bg-gray-50'
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-sm">
                  {player.photoUrl
                    ? <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    : '⚽'}
                </div>

                {/* Name + position */}
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-medium text-gray-900 truncate">{player.name}</p>
                  {player.position && (
                    <p className="text-xs text-gray-400">{POSITION_LABELS[player.position] ?? player.position}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggle(player.id, 'bench')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      status === 'bench'
                        ? 'bg-orange-400 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                    }`}
                  >
                    احتياط
                  </button>
                  <button
                    onClick={() => toggle(player.id, 'starting')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      status === 'starting'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    أساسي
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 text-right">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
          >
            إلغاء
          </button>

          <div className="text-xs text-gray-400 text-center">
            {starting.length} أساسي · {bench.length} احتياط
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {saving ? 'جارٍ الحفظ...' : '💾 حفظ التشكيلة'}
          </button>
        </div>
      </div>
    </div>
  );
}
