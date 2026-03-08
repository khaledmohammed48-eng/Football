'use client';

import { useState, useEffect, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
  photoUrl?: string | null;
  position?: string | null;
}

interface Props {
  players: Player[];
  coachId: string;
  teamId: string;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDateAr(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function AttendanceTab({ players }: Props) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchAttendance = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coach/attendance?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setPresent(new Set(data.presentPlayerIds ?? []));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, fetchAttendance]);

  function toggle(playerId: string) {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
    setSaved(false);
  }

  function markAll(value: boolean) {
    setPresent(value ? new Set(players.map((p) => p.id)) : new Set());
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/coach/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          presentPlayerIds: Array.from(present),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const presentCount = present.size;
  const absentCount = players.length - presentCount;
  const isToday = selectedDate === todayStr();

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600 font-bold text-lg"
        >
          ›
        </button>
        <div className="text-center">
          <div className="text-base font-semibold text-gray-900">
            {formatDateAr(selectedDate)}
          </div>
          {isToday && (
            <span className="text-xs text-green-600 font-medium">اليوم</span>
          )}
        </div>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          disabled={selectedDate >= todayStr()}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600 font-bold text-lg disabled:opacity-30"
        >
          ‹
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          <span className="text-sm font-medium text-gray-700">{presentCount} حاضر</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
          <span className="text-sm font-medium text-gray-700">{absentCount} غائب</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => markAll(true)}
          className="text-xs text-green-600 hover:underline px-2 py-1"
        >
          تحديد الكل
        </button>
        <button
          onClick={() => markAll(false)}
          className="text-xs text-red-500 hover:underline px-2 py-1"
        >
          إلغاء الكل
        </button>
      </div>

      {/* Player list */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="py-10 text-center text-gray-400 text-sm">جاري التحميل...</div>
        ) : players.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">لا يوجد لاعبون في الفريق</div>
        ) : (
          players.map((player) => {
            const isPresent = present.has(player.id);
            return (
              <div
                key={player.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.name} className="w-10 h-10 object-cover" />
                  ) : (
                    <span className="font-bold text-green-700 text-sm">{player.name.charAt(0)}</span>
                  )}
                </div>
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{player.name}</div>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => toggle(player.id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    isPresent
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                >
                  {isPresent ? '✓ حاضر' : '✗ غائب'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-xl transition text-sm"
        >
          {saved ? '✅ تم الحفظ' : saving ? 'جاري الحفظ...' : 'حفظ الحضور'}
        </button>
      </div>
    </div>
  );
}
