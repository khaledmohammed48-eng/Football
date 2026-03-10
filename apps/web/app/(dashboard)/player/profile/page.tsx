import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS, POSITION_LABELS } from '@football-academy/shared';
import { SessionPlanViewer } from '@/components/coach/session-plan-viewer';
import { BannersCarousel } from '@/components/academy/banners-carousel';
import { PlayerProfileClient } from './player-profile-client';
import { FifaCardModal } from '@/components/player/fifa-card';

export default async function PlayerProfilePage() {
  const session = await getServerSession(authOptions);

  const player = await prisma.player.findUnique({
    where: { userId: session!.user.id },
    include: {
      team: { select: { id: true, name: true } },
      attributes: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { coach: { select: { name: true } } },
      },
    },
  });

  const academy = player?.academyId
    ? await prisma.academy.findUnique({
        where: { id: player.academyId },
        select: { name: true, logoUrl: true },
      })
    : null;

  // Fetch upcoming session plans for player's team
  const upcomingSessions = player?.teamId
    ? await prisma.sessionPlan.findMany({
        where: {
          teamId: player.teamId,
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
        take: 5,
        include: { coach: { select: { name: true } } },
      })
    : [];

  const serializedSessions = upcomingSessions.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date.toISOString(),
    description: s.description,
    exercises: JSON.parse(s.exercises) as { name: string; duration: string; notes: string }[],
    targetGroupId: s.targetGroupId,
    coachName: s.coach.name,
  }));

  if (!player) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">⚽</div>
        <p className="text-gray-500">لم يتم إنشاء ملفك الشخصي بعد. تواصل مع المدير.</p>
      </div>
    );
  }

  const attrs = player.attributes;
  const defaultVal = 5;

  const attributeData = ATTRIBUTE_KEYS.map((key) => ({
    key,
    label: ATTRIBUTE_LABELS[key],
    color: ATTRIBUTE_COLORS[key],
    value: attrs ? attrs[key] : defaultVal,
  }));

  return (
    <div>
      <BannersCarousel />
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ملفي الشخصي</h1>
        <FifaCardModal
          data={{
            playerName: player.name,
            photoUrl: player.photoUrl,
            position: player.position,
            attributes: player.attributes,
            academyName: academy?.name ?? 'الأكاديمية',
            academyLogoUrl: academy?.logoUrl,
            isBestPlayer: player.isBestPlayer,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card — client component for photo upload */}
        <PlayerProfileClient
          playerId={player.id}
          name={player.name}
          photoUrl={player.photoUrl}
          position={player.position}
          team={player.team}
          phone={player.phone}
          dateOfBirth={player.dateOfBirth?.toISOString() ?? null}
          positionLabels={POSITION_LABELS}
        />

        <div className="lg:col-span-2 space-y-6">
          {/* Skills */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">المهارات</h2>
            <div className="space-y-4">
              {attributeData.map(({ key, label, color, value }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm font-bold" style={{ color }}>
                      {value}/10
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${value * 10}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming sessions */}
          {serializedSessions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">📋 جلسات التدريب القادمة</h2>
              <SessionPlanViewer sessions={serializedSessions} showCoachName />
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">
              ملاحظات المدربين ({player.notes.length})
            </h2>
            {player.notes.length === 0 ? (
              <p className="text-sm text-gray-400">لا توجد ملاحظات بعد</p>
            ) : (
              <div className="space-y-3">
                {player.notes.map((note) => (
                  <div key={note.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{note.coach.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
