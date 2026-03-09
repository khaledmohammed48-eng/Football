'use client';

import { useRouter } from 'next/navigation';

interface Props {
  teams: { id: string; name: string }[];
  selectedTeamId: string;
}

export function CoachTeamSelector({ teams, selectedTeamId }: Props) {
  const router = useRouter();

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">اختر الفريق</p>
      <div className="flex flex-wrap gap-2">
        {teams.map((t) => (
          <button
            key={t.id}
            onClick={() => router.push(`/coach/team?teamId=${t.id}`)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
              t.id === selectedTeamId
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-700'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
