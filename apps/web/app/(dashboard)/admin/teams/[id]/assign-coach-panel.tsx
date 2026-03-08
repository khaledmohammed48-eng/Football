'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Coach {
  id: string;
  name: string;
  photoUrl?: string | null;
  teamId?: string | null;
}

interface Props {
  teamId: string;
  assignedCoachIds: string[];
  allCoaches: Coach[];
}

export function AssignCoachPanel({ teamId, assignedCoachIds, allCoaches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Coaches not yet on this team
  const unassigned = allCoaches.filter((c) => !assignedCoachIds.includes(c.id));
  // Coaches on this team (for unassign)
  const assigned = allCoaches.filter((c) => assignedCoachIds.includes(c.id));

  async function assignCoach(coachId: string) {
    setLoadingId(coachId);
    await fetch(`/api/coaches/${coachId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    });
    setLoadingId(null);
    startTransition(() => router.refresh());
  }

  async function unassignCoach(coachId: string) {
    setLoadingId(coachId);
    await fetch(`/api/coaches/${coachId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: null }),
    });
    setLoadingId(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="border-t border-gray-100 pt-4 space-y-4">
      {/* Unassign section */}
      {assigned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">إزالة مدرب</p>
          <div className="space-y-2">
            {assigned.map((coach) => (
              <div key={coach.id} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {coach.photoUrl ? (
                    <img src={coach.photoUrl} alt={coach.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : <span className="text-xs">👨‍💼</span>}
                </div>
                <span className="text-sm text-gray-700 flex-1">{coach.name}</span>
                <button
                  onClick={() => unassignCoach(coach.id)}
                  disabled={loadingId === coach.id || isPending}
                  className="text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
                >
                  {loadingId === coach.id ? '...' : 'إزالة'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign section */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">تعيين مدرب</p>
        {unassigned.length === 0 ? (
          <p className="text-xs text-gray-400">
            {allCoaches.length === 0
              ? 'لا يوجد مدربون — أنشئ حسابات المدربين أولاً'
              : 'جميع المدربون مُعيَّنون لهذا الفريق'}
          </p>
        ) : (
          <div className="space-y-2">
            {unassigned.map((coach) => (
              <div key={coach.id} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {coach.photoUrl ? (
                    <img src={coach.photoUrl} alt={coach.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : <span className="text-xs">👨‍💼</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-700 truncate">{coach.name}</div>
                  {coach.teamId && coach.teamId !== teamId && (
                    <div className="text-xs text-orange-500">مُعيَّن لفريق آخر</div>
                  )}
                </div>
                <button
                  onClick={() => assignCoach(coach.id)}
                  disabled={loadingId === coach.id || isPending}
                  className="text-xs px-2.5 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition flex-shrink-0"
                >
                  {loadingId === coach.id ? '...' : 'تعيين'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
