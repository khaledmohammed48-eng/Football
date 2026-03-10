'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BestPlayerButtonProps {
  playerId: string;
  teamId: string;
  isBestPlayer: boolean;
}

export function BestPlayerButton({ playerId, teamId, isBestPlayer: initialState }: BestPlayerButtonProps) {
  const [isBest, setIsBest]   = useState(initialState);
  const [loading, setLoading] = useState(false);
  const router                = useRouter();

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch('/api/coach/best-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // If already best player, pass null to clear; otherwise set
        body: JSON.stringify({ playerId: isBest ? null : playerId, teamId }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsBest(data.isBestPlayer ?? false);
        router.refresh(); // refresh server component data
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={isBest ? 'إلغاء أفضل لاعب' : 'تعيين كأفضل لاعب للفريق'}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition shadow-md disabled:opacity-60 ${
        isBest
          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600'
          : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 border border-gray-200'
      }`}
    >
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : (
        <span>{isBest ? '⭐' : '☆'}</span>
      )}
      {isBest ? 'أفضل لاعب ✓' : 'تعيين كأفضل لاعب'}
    </button>
  );
}
