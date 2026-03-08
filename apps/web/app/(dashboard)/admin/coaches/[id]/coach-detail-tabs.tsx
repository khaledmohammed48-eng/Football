'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlayerAttributes {
  speed: number;
  passing: number;
  shooting: number;
  dribbling: number;
  defense: number;
  stamina: number;
}

interface Player {
  id: string;
  name: string;
  photoUrl?: string | null;
  position?: string | null;
  dateOfBirth?: string | null;
  subscriptionEnd?: string | null;
  attributes?: PlayerAttributes | null;
}

interface Exercise {
  name: string;
  duration: string;
  notes: string;
}

interface Session {
  id: string;
  title: string;
  date: string;
  description?: string | null;
  exercises: Exercise[];
  targetGroupId?: string | null;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  player: {
    id: string;
    name: string;
    photoUrl?: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  type: string;
  playerIds: string[];
  captainId: string | null;
  formation: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  players: Player[];
  sessions: Session[];
  notes: Note[];
  groups: Group[];
  teamName: string | null;
}

// ── Helper functions ──────────────────────────────────────────────────────────

function avgRating(attrs: PlayerAttributes | null | undefined): number | null {
  if (!attrs) return null;
  const v = [attrs.speed, attrs.passing, attrs.shooting, attrs.dribbling, attrs.defense, attrs.stamina];
  return v.reduce((a, b) => a + b, 0) / 6;
}

function avgRatingDisplay(attrs: PlayerAttributes | null | undefined): string | null {
  const r = avgRating(attrs);
  return r !== null ? r.toFixed(1) : null;
}

function ratingColor(r: number): string {
  if (r >= 7.5) return 'text-green-600';
  if (r >= 5) return 'text-yellow-500';
  return 'text-red-500';
}

function ratingBg(r: number): string {
  if (r >= 7.5) return 'bg-green-50 border-green-200 text-green-700';
  if (r >= 5) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  return 'bg-red-50 border-red-200 text-red-600';
}

function positionAr(pos: string): string {
  const map: Record<string, string> = {
    GOALKEEPER: 'حارس مرمى',
    DEFENDER: 'مدافع',
    MIDFIELDER: 'لاعب وسط',
    FORWARD: 'مهاجم',
  };
  return map[pos] ?? pos;
}

function isExpired(sub?: string | null): boolean {
  if (!sub) return false;
  return new Date(sub) < new Date();
}

function daysLeft(sub?: string | null): number | null {
  if (!sub) return null;
  return Math.ceil((new Date(sub).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getAge(dob?: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function medalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = 'players' | 'elite' | 'sessions' | 'notes' | 'groups';

// ── Main component ────────────────────────────────────────────────────────────

export function CoachDetailTabs({ players, sessions, notes, groups, teamName }: Props) {
  const [tab, setTab] = useState<Tab>('players');

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
      tab === t ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div>
      {/* Section title */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        📊 نظرة عامة على المدرب
        {teamName && <span className="ml-2 text-sm font-normal text-gray-400">— {teamName}</span>}
      </h2>

      {/* Tab switcher */}
      <div className="flex gap-1.5 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        <button className={tabClass('players')} onClick={() => setTab('players')}>
          👥 اللاعبون ({players.length})
        </button>
        <button className={tabClass('elite')} onClick={() => setTab('elite')}>
          ⭐ أفضل اللاعبين
        </button>
        <button className={tabClass('sessions')} onClick={() => setTab('sessions')}>
          📋 جلسات التدريب ({sessions.length})
        </button>
        <button className={tabClass('notes')} onClick={() => setTab('notes')}>
          💬 الملاحظات ({notes.length})
        </button>
        <button className={tabClass('groups')} onClick={() => setTab('groups')}>
          🔵 المجموعات ({groups.length})
        </button>
      </div>

      {/* Tab content */}
      {tab === 'players' && <PlayersTab players={players} />}
      {tab === 'elite' && <EliteTab players={players} />}
      {tab === 'sessions' && <SessionsTab sessions={sessions} />}
      {tab === 'notes' && <NotesTab notes={notes} />}
      {tab === 'groups' && <GroupsTab groups={groups} players={players} />}
    </div>
  );
}

// ── Tab 1: Players ────────────────────────────────────────────────────────────

function PlayersTab({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
        <div className="text-4xl mb-3">⚽</div>
        <div>لا يوجد لاعبون في هذا الفريق</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player) => {
        const expired = isExpired(player.subscriptionEnd);
        const dl = daysLeft(player.subscriptionEnd);
        const rating = avgRatingDisplay(player.attributes);

        return (
          <Link
            key={player.id}
            href={`/admin/players/${player.id}`}
            className={`rounded-xl border p-5 hover:shadow-md transition group ${
              expired ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl overflow-hidden flex-shrink-0 group-hover:ring-2 transition ${
                  expired
                    ? 'bg-red-100 group-hover:ring-red-300'
                    : 'bg-green-100 group-hover:ring-green-400'
                }`}
              >
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="w-12 h-12 object-cover rounded-full" />
                ) : (
                  <span className={`font-bold ${expired ? 'text-red-400' : 'text-green-700'}`}>
                    {player.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold truncate ${expired ? 'text-gray-400' : 'text-gray-900'}`}>
                    {player.name}
                  </h3>
                  {expired ? (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      غير نشط
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      نشط
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {player.position && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {positionAr(player.position)}
                    </span>
                  )}
                  {getAge(player.dateOfBirth) !== null && (
                    <span className="text-xs text-gray-400">{getAge(player.dateOfBirth)} سنة</span>
                  )}
                </div>
                {player.subscriptionEnd && (
                  <div
                    className={`text-xs mt-1 ${
                      expired
                        ? 'text-red-500 font-medium'
                        : dl !== null && dl <= 30
                        ? 'text-orange-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {expired
                      ? `انتهى الاشتراك منذ ${Math.abs(dl!)} يوم`
                      : dl === 0
                      ? 'ينتهي الاشتراك اليوم!'
                      : `ينتهي الاشتراك خلال ${dl} يوم`}
                  </div>
                )}
              </div>
            </div>

            {/* Mini skill bars */}
            {player.attributes ? (
              <div className="space-y-1.5">
                {[
                  { label: 'السرعة', val: player.attributes.speed, color: '#f97316' },
                  { label: 'التسديد', val: player.attributes.shooting, color: '#ef4444' },
                  { label: 'التمرير', val: player.attributes.passing, color: '#3b82f6' },
                ].map((attr) => (
                  <div key={attr.label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-14 text-left">{attr.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${attr.val * 10}%`, backgroundColor: attr.color }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-4">{attr.val}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs mt-2 pt-1 border-t border-gray-100">
                  <span className="text-gray-500">متوسط المهارات</span>
                  <span className="font-bold text-green-600">⭐ {rating}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center py-2">لم يتم تقييم المهارات بعد</div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ── Tab 2: Elite ranking ──────────────────────────────────────────────────────

function EliteTab({ players }: { players: Player[] }) {
  const withRating = players
    .filter((p) => p.attributes !== null && p.attributes !== undefined)
    .map((p) => ({ ...p, rating: avgRating(p.attributes)! }))
    .sort((a, b) => b.rating - a.rating);

  const withoutRating = players.filter((p) => !p.attributes);

  if (players.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
        <div className="text-4xl mb-3">⭐</div>
        <div>لا يوجد لاعبون في هذا الفريق</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-5 py-3">
        <p className="text-sm font-semibold text-green-800">الفريق النخبة — مرتب حسب المستوى العام</p>
        <p className="text-xs text-green-600 mt-0.5">
          {withRating.length} لاعب مقيّم · {withoutRating.length} لاعب بدون تقييم
        </p>
      </div>

      {/* Ranked players */}
      {withRating.map((player, idx) => {
        const rank = idx + 1;
        const medal = medalEmoji(rank);
        const ratingStr = player.rating.toFixed(1);

        return (
          <Link
            key={player.id}
            href={`/admin/players/${player.id}`}
            className="flex gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition group"
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-10 flex flex-col items-center justify-center">
              {rank <= 3 ? (
                <span className="text-2xl leading-none">{medal}</span>
              ) : (
                <span className="text-lg font-bold text-gray-400">#{rank}</span>
              )}
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-green-100 flex items-center justify-center group-hover:ring-2 group-hover:ring-green-400 transition">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-12 h-12 object-cover" />
              ) : (
                <span className="font-bold text-green-700 text-lg">{player.name.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 truncate">{player.name}</h3>
                {player.position && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
                    {positionAr(player.position)}
                  </span>
                )}
              </div>

              {/* 6 skill bars */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { label: 'السرعة', val: player.attributes!.speed, color: '#f97316' },
                  { label: 'التمرير', val: player.attributes!.passing, color: '#3b82f6' },
                  { label: 'التسديد', val: player.attributes!.shooting, color: '#ef4444' },
                  { label: 'المراوغة', val: player.attributes!.dribbling, color: '#8b5cf6' },
                  { label: 'الدفاع', val: player.attributes!.defense, color: '#10b981' },
                  { label: 'التحمل', val: player.attributes!.stamina, color: '#f59e0b' },
                ].map((attr) => (
                  <div key={attr.label} className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 w-14 text-left">{attr.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${attr.val * 10}%`, backgroundColor: attr.color }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-3">{attr.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall rating badge */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center">
              <div
                className={`border rounded-xl px-3 py-2 text-center min-w-[52px] ${ratingBg(player.rating)}`}
              >
                <div className="text-xl font-bold leading-none">{ratingStr}</div>
                <div className="text-xs mt-0.5 opacity-70">/ 10</div>
              </div>
            </div>
          </Link>
        );
      })}

      {/* Players without rating */}
      {withoutRating.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">
            لم يتم التقييم بعد ({withoutRating.length})
          </div>
          {withoutRating.map((player) => (
            <Link
              key={player.id}
              href={`/admin/players/${player.id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition opacity-60"
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="w-9 h-9 object-cover" />
                ) : (
                  <span className="font-bold text-gray-500 text-sm">{player.name.charAt(0)}</span>
                )}
              </div>
              <span className="font-medium text-gray-600 text-sm">{player.name}</span>
              {player.position && (
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {positionAr(player.position)}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Sessions ───────────────────────────────────────────────────────────

function SessionsTab({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="text-4xl mb-2">📋</div>
        <p className="text-gray-400 text-sm">لا توجد جلسات تدريبية لهذا المدرب</p>
      </div>
    );
  }

  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.date) >= now);
  const past = sessions.filter((s) => new Date(s.date) < now);

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            القادمة ({upcoming.length})
          </div>
          {upcoming.map((session) => (
            <SessionCard key={session.id} session={session} isUpcoming />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-200 pt-4 mt-4">
            السابقة ({past.length})
          </div>
          {past.map((session) => (
            <SessionCard key={session.id} session={session} isUpcoming={false} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, isUpcoming }: { session: Session; isUpcoming: boolean }) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 space-y-3 ${
        isUpcoming ? 'border-green-200' : 'border-gray-200 opacity-80'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`rounded-lg px-3 py-2 text-center flex-shrink-0 min-w-[56px] ${
            isUpcoming ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <div className={`text-xs font-medium ${isUpcoming ? 'text-green-600' : 'text-gray-400'}`}>
            {new Date(session.date).toLocaleDateString('ar-SA', { month: 'short' })}
          </div>
          <div className={`text-xl font-bold leading-none ${isUpcoming ? 'text-green-700' : 'text-gray-400'}`}>
            {new Date(session.date).getDate()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{session.title}</h3>
          <div className="text-xs text-gray-400 mt-0.5">{formatDate(session.date)}</div>
        </div>
      </div>

      {session.description && (
        <p className="text-sm text-gray-600">{session.description}</p>
      )}

      {session.exercises.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">التمارين</div>
          <div className="flex flex-wrap gap-2">
            {session.exercises.map((ex, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                {ex.name}{ex.duration ? ` — ${ex.duration} دق` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Notes ──────────────────────────────────────────────────────────────

function NotesTab({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="text-4xl mb-2">💬</div>
        <p className="text-gray-400 text-sm">لم يكتب هذا المدرب أي ملاحظات بعد</p>
      </div>
    );
  }

  // Group by player
  const playerMap = new Map<string, { player: Note['player']; notes: Note[] }>();
  for (const note of notes) {
    if (!playerMap.has(note.player.id)) {
      playerMap.set(note.player.id, { player: note.player, notes: [] });
    }
    playerMap.get(note.player.id)!.notes.push(note);
  }

  return (
    <div className="space-y-4">
      {Array.from(playerMap.values()).map(({ player, notes: playerNotes }) => (
        <div key={player.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Player header */}
          <Link
            href={`/admin/players/${player.id}`}
            className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-8 h-8 object-cover" />
              ) : (
                <span className="text-xs font-bold text-green-700">{player.name.charAt(0)}</span>
              )}
            </div>
            <span className="font-semibold text-gray-800 text-sm">{player.name}</span>
            <span className="text-xs text-gray-400 mr-auto">{playerNotes.length} ملاحظة</span>
          </Link>

          {/* Notes list */}
          <div className="divide-y divide-gray-50">
            {playerNotes.map((note) => (
              <div key={note.id} className="px-4 py-3">
                <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(note.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab 5: Groups ─────────────────────────────────────────────────────────────

function GroupsTab({ groups, players }: { groups: Group[]; players: Player[] }) {
  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="text-4xl mb-2">🔵</div>
        <p className="text-gray-400 text-sm">لا توجد مجموعات تدريبية لهذا المدرب</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const groupPlayers = players.filter((p) => group.playerIds.includes(p.id));
        const captain = players.find((p) => p.id === group.captainId);

        return (
          <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-4">
            {/* Group header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      group.type === 'PERMANENT'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {group.type === 'PERMANENT' ? 'دائمة' : 'مؤقتة'}
                  </span>
                  {group.formation && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      ⚽ {group.formation.split(': ')[1] ?? group.formation}
                    </span>
                  )}
                </div>
                {captain && (
                  <div className="text-xs text-gray-500 mt-1">
                    ⭐ القائد: <span className="font-medium text-gray-700">{captain.name}</span>
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-0.5">{groupPlayers.length} لاعب</div>
              </div>
            </div>

            {/* Player avatars */}
            <div className="flex flex-wrap gap-2">
              {groupPlayers.length === 0 ? (
                <span className="text-xs text-gray-400">لا يوجد لاعبون في هذه المجموعة</span>
              ) : (
                groupPlayers.map((p) => (
                  <div key={p.id} className="relative flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-green-100 overflow-hidden border-2 border-white shadow flex items-center justify-center">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="w-9 h-9 object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-green-700">{p.name.charAt(0)}</span>
                      )}
                    </div>
                    {p.id === group.captainId && (
                      <span className="absolute -top-1 -right-1 text-xs leading-none">⭐</span>
                    )}
                    <span className="text-xs text-gray-500 mt-0.5 max-w-[48px] truncate text-center">
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
