'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TacticalBoard } from '@/components/coach/tactical-board';
import { ImageViewer } from '@/components/ui/image-viewer';
import { AttendanceTab } from '@/components/coach/attendance-tab';
import { GroupsTab } from '@/components/coach/groups-tab';
import { SessionsTab } from '@/components/coach/sessions-tab';
import { BannersCarousel } from '@/components/academy/banners-carousel';
import { MatchesList } from '@/components/matches/matches-list';

interface Player {
  id: string;
  name: string;
  photoUrl?: string | null;
  position?: string | null;
  dateOfBirth?: string | null;
  subscriptionEnd?: string | null;
  attributes?: {
    speed: number; passing: number; shooting: number;
    dribbling: number; defense: number; stamina: number;
  } | null;
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

function isExpired(sub?: string | null) {
  if (!sub) return false;
  return new Date(sub) < new Date();
}

function daysLeft(sub?: string | null) {
  if (!sub) return null;
  return Math.ceil((new Date(sub).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface Props {
  teamName: string;
  teamId: string;
  coachId: string;
  coachName: string;
  players: Player[];
  groups: Group[];
}

function avgRating(attrs: Player['attributes']) {
  if (!attrs) return null;
  const v = [attrs.speed, attrs.passing, attrs.shooting, attrs.dribbling, attrs.defense, attrs.stamina];
  return (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1);
}

function positionAr(pos: string) {
  const map: Record<string, string> = {
    GOALKEEPER: 'حارس مرمى',
    DEFENDER: 'مدافع',
    MIDFIELDER: 'لاعب وسط',
    FORWARD: 'مهاجم',
  };
  return map[pos] ?? pos;
}

function getAge(dob?: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

type Tab = 'squad' | 'tactical' | 'attendance' | 'groups' | 'sessions' | 'matches';

export function CoachTeamClient({ teamName, teamId, coachId, coachName, players, groups }: Props) {
  const [tab, setTab] = useState<Tab>('squad');
  const [viewingPhoto, setViewingPhoto] = useState<{ src: string; name: string } | null>(null);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
      tab === t ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <>
      {viewingPhoto && (
        <ImageViewer
          src={viewingPhoto.src}
          alt={viewingPhoto.name}
          onClose={() => setViewingPhoto(null)}
        />
      )}
      <div>
        <BannersCarousel />
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{teamName}</h1>
          <p className="text-gray-500 mt-1 text-sm">مرحباً {coachName} — إدارة فريقك</p>
        </div>

        {/* Tab switcher — scrollable on small screens */}
        <div className="flex gap-1.5 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
          <button className={tabClass('squad')} onClick={() => setTab('squad')}>
            👥 اللاعبون ({players.length})
          </button>
          <button className={tabClass('tactical')} onClick={() => setTab('tactical')}>
            🏟️ التكتيك
          </button>
          <button className={tabClass('attendance')} onClick={() => setTab('attendance')}>
            ✅ الحضور
          </button>
          <button className={tabClass('groups')} onClick={() => setTab('groups')}>
            🔵 المجموعات
          </button>
          <button className={tabClass('sessions')} onClick={() => setTab('sessions')}>
            📋 خطط التدريب
          </button>
          <button className={tabClass('matches')} onClick={() => setTab('matches')}>
            ⚔️ المباريات
          </button>
        </div>

        {/* Squad list */}
        {tab === 'squad' && (
          <>
            {players.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
                <div className="text-4xl mb-3">⚽</div>
                <div>لا يوجد لاعبون في هذا الفريق</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => {
                  const expired = isExpired(player.subscriptionEnd);
                  const dl = daysLeft(player.subscriptionEnd);
                  return (
                    <Link
                      key={player.id}
                      href={`/coach/players/${player.id}`}
                      className={`rounded-xl border p-5 hover:shadow-md transition group ${expired ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl overflow-hidden flex-shrink-0 group-hover:ring-2 transition ${expired ? 'bg-red-100 group-hover:ring-red-300' : 'bg-green-100 group-hover:ring-green-400'} ${player.photoUrl ? 'cursor-zoom-in' : ''}`}
                          onClick={(e) => {
                            if (player.photoUrl) {
                              e.preventDefault();
                              setViewingPhoto({ src: player.photoUrl, name: player.name });
                            }
                          }}
                        >
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-12 h-12 object-cover rounded-full" />
                          ) : (
                            <span className={`font-bold ${expired ? 'text-red-400' : 'text-green-700'}`}>{player.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold truncate ${expired ? 'text-gray-400' : 'text-gray-900'}`}>{player.name}</h3>
                            {expired ? (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full flex-shrink-0">غير نشط</span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">نشط</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {player.position && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                {positionAr(player.position)}
                              </span>
                            )}
                            {getAge(player.dateOfBirth) && (
                              <span className="text-xs text-gray-400">{getAge(player.dateOfBirth)} سنة</span>
                            )}
                          </div>
                          {player.subscriptionEnd && (
                            <div className={`text-xs mt-1 ${expired ? 'text-red-500 font-medium' : dl !== null && dl <= 30 ? 'text-orange-500' : 'text-gray-400'}`}>
                              {expired
                                ? `انتهى الاشتراك منذ ${Math.abs(dl!)} يوم`
                                : dl === 0 ? 'ينتهي الاشتراك اليوم!'
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
                            <span className="font-bold text-green-600">⭐ {avgRating(player.attributes)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 text-center py-2">لم يتم تقييم المهارات بعد</div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tactical board */}
        {tab === 'tactical' && (
          <TacticalBoard players={players} teamName={teamName} />
        )}

        {/* Attendance */}
        {tab === 'attendance' && (
          <AttendanceTab players={players} coachId={coachId} teamId={teamId} />
        )}

        {/* Training groups */}
        {tab === 'groups' && (
          <GroupsTab players={players} coachId={coachId} teamId={teamId} />
        )}

        {/* Session plans */}
        {tab === 'sessions' && (
          <SessionsTab coachId={coachId} teamId={teamId} groups={groups} />
        )}

        {/* Matches */}
        {tab === 'matches' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">المباريات المؤكدة مع الأكاديميات الأخرى</p>
            <MatchesList apiUrl="/api/coach/matches" showLineup />
          </div>
        )}
      </div>
    </>
  );
}
