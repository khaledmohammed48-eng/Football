'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  photoUrl?: string | null;
  position?: string | null;
  attributes?: {
    speed: number; passing: number; shooting: number;
    dribbling: number; defense: number; stamina: number;
  } | null;
}

interface FormationSlot {
  label: string; // e.g. "GK", "CB", "ST"
  // position on pitch as percentage: x=left%, y=top%
  x: number;
  y: number;
}

// ── Formation size selector ───────────────────────────────────────────────────
// Each size group contains named formations.
// Slot coordinates: x = left%, y = top% (0=top of pitch, 100=bottom).
// Teams play toward the top (attack up).

const FORMATIONS: Record<string, { name: string; size: number; slots: FormationSlot[] }> = {

  // ── 6-a-side ────────────────────────────────────────────────────────────────
  '6: 1-2-2': {
    name: '1-2-2',
    size: 6,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 65, y: 68 },
      { label: 'CB', x: 35, y: 68 },
      { label: 'CM', x: 65, y: 45 },
      { label: 'CM', x: 35, y: 45 },
      { label: 'ST', x: 50, y: 22 },
    ],
  },
  '6: 1-3-1': {
    name: '1-3-1',
    size: 6,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 70, y: 66 },
      { label: 'CB', x: 50, y: 66 },
      { label: 'CB', x: 30, y: 66 },
      { label: 'CM', x: 50, y: 44 },
      { label: 'ST', x: 50, y: 22 },
    ],
  },
  '6: 2-2-1': {
    name: '2-2-1',
    size: 6,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 65, y: 70 },
      { label: 'CB', x: 35, y: 70 },
      { label: 'RM', x: 72, y: 48 },
      { label: 'LM', x: 28, y: 48 },
      { label: 'ST', x: 50, y: 24 },
    ],
  },

  // ── 8-a-side ────────────────────────────────────────────────────────────────
  '8: 2-3-2': {
    name: '2-3-2',
    size: 8,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 65, y: 72 },
      { label: 'CB', x: 35, y: 72 },
      { label: 'RM', x: 78, y: 52 },
      { label: 'CM', x: 50, y: 52 },
      { label: 'LM', x: 22, y: 52 },
      { label: 'ST', x: 65, y: 26 },
      { label: 'ST', x: 35, y: 26 },
    ],
  },
  '8: 3-3-1': {
    name: '3-3-1',
    size: 8,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 70, y: 72 },
      { label: 'CB', x: 50, y: 72 },
      { label: 'CB', x: 30, y: 72 },
      { label: 'RM', x: 75, y: 50 },
      { label: 'CM', x: 50, y: 50 },
      { label: 'LM', x: 25, y: 50 },
      { label: 'ST', x: 50, y: 24 },
    ],
  },
  '8: 2-4-1': {
    name: '2-4-1',
    size: 8,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 65, y: 73 },
      { label: 'CB', x: 35, y: 73 },
      { label: 'RM', x: 82, y: 52 },
      { label: 'CM', x: 60, y: 52 },
      { label: 'CM', x: 40, y: 52 },
      { label: 'LM', x: 18, y: 52 },
      { label: 'ST', x: 50, y: 25 },
    ],
  },

  // ── 11-a-side ───────────────────────────────────────────────────────────────
  '11: 4-3-3': {
    name: '4-3-3',
    size: 11,
    slots: [
      { label: 'GK',  x: 50, y: 88 },
      { label: 'RB',  x: 80, y: 72 },
      { label: 'CB',  x: 60, y: 72 },
      { label: 'CB',  x: 40, y: 72 },
      { label: 'LB',  x: 20, y: 72 },
      { label: 'CM',  x: 70, y: 52 },
      { label: 'CM',  x: 50, y: 52 },
      { label: 'CM',  x: 30, y: 52 },
      { label: 'RW',  x: 80, y: 30 },
      { label: 'ST',  x: 50, y: 22 },
      { label: 'LW',  x: 20, y: 30 },
    ],
  },
  '11: 4-4-2': {
    name: '4-4-2',
    size: 11,
    slots: [
      { label: 'GK',  x: 50, y: 88 },
      { label: 'RB',  x: 80, y: 72 },
      { label: 'CB',  x: 60, y: 72 },
      { label: 'CB',  x: 40, y: 72 },
      { label: 'LB',  x: 20, y: 72 },
      { label: 'RM',  x: 80, y: 50 },
      { label: 'CM',  x: 60, y: 50 },
      { label: 'CM',  x: 40, y: 50 },
      { label: 'LM',  x: 20, y: 50 },
      { label: 'ST',  x: 62, y: 22 },
      { label: 'ST',  x: 38, y: 22 },
    ],
  },
  '11: 4-2-3-1': {
    name: '4-2-3-1',
    size: 11,
    slots: [
      { label: 'GK',  x: 50, y: 88 },
      { label: 'RB',  x: 80, y: 73 },
      { label: 'CB',  x: 60, y: 73 },
      { label: 'CB',  x: 40, y: 73 },
      { label: 'LB',  x: 20, y: 73 },
      { label: 'DM',  x: 62, y: 58 },
      { label: 'DM',  x: 38, y: 58 },
      { label: 'RW',  x: 78, y: 38 },
      { label: 'AM',  x: 50, y: 38 },
      { label: 'LW',  x: 22, y: 38 },
      { label: 'ST',  x: 50, y: 18 },
    ],
  },
  '11: 3-5-2': {
    name: '3-5-2',
    size: 11,
    slots: [
      { label: 'GK',  x: 50, y: 88 },
      { label: 'CB',  x: 68, y: 73 },
      { label: 'CB',  x: 50, y: 73 },
      { label: 'CB',  x: 32, y: 73 },
      { label: 'RWB', x: 85, y: 53 },
      { label: 'CM',  x: 65, y: 53 },
      { label: 'CM',  x: 50, y: 53 },
      { label: 'CM',  x: 35, y: 53 },
      { label: 'LWB', x: 15, y: 53 },
      { label: 'ST',  x: 62, y: 22 },
      { label: 'ST',  x: 38, y: 22 },
    ],
  },
};

function avgRating(attrs: Player['attributes']) {
  if (!attrs) return null;
  const v = [attrs.speed, attrs.passing, attrs.shooting, attrs.dribbling, attrs.defense, attrs.stamina];
  return (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1);
}

// Group formation keys by player count
const SIZE_GROUPS: { size: number; label: string }[] = [
  { size: 6,  label: '6 لاعبين' },
  { size: 8,  label: '8 لاعبين' },
  { size: 11, label: '11 لاعباً' },
];

export function TacticalBoard({ players, teamName }: { players: Player[]; teamName: string }) {
  const [activeSize, setActiveSize] = useState<number>(11);
  const defaultFormation = Object.keys(FORMATIONS).find((k) => FORMATIONS[k].size === 11) ?? '11: 4-3-3';
  const [formation, setFormation] = useState(defaultFormation);
  const [lineup, setLineup] = useState<Record<number, Player | null>>({}); // slotIndex → player
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragSource, setDragSource] = useState<{ type: 'bench' | 'slot'; slotIndex?: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const pitchRef = useRef<HTMLDivElement>(null);

  const slots = FORMATIONS[formation].slots;

  // Formations available for current size
  const sizeFormations = Object.keys(FORMATIONS).filter((k) => FORMATIONS[k].size === activeSize);

  // Players not yet in lineup
  const bench = players.filter(
    (p) => !Object.values(lineup).some((lp) => lp?.id === p.id)
  );

  function handleSizeChange(size: number) {
    setActiveSize(size);
    const firstOfSize = Object.keys(FORMATIONS).find((k) => FORMATIONS[k].size === size);
    if (firstOfSize) setFormation(firstOfSize);
    setLineup({});
  }

  function handleFormationChange(f: string) {
    setFormation(f);
    setLineup({});
  }

  function onDragStartBench(player: Player) {
    setDraggedPlayer(player);
    setDragSource({ type: 'bench' });
  }

  function onDragStartSlot(player: Player, slotIndex: number) {
    setDraggedPlayer(player);
    setDragSource({ type: 'slot', slotIndex });
  }

  function onDropSlot(slotIndex: number) {
    if (!draggedPlayer) return;

    const newLineup = { ...lineup };

    // If dragged from another slot, clear that slot
    if (dragSource?.type === 'slot' && dragSource.slotIndex !== undefined) {
      // Swap if target slot already occupied
      const displaced = newLineup[slotIndex] ?? null;
      newLineup[dragSource.slotIndex] = displaced;
    }

    newLineup[slotIndex] = draggedPlayer;
    setLineup(newLineup);
    setDraggedPlayer(null);
    setDragSource(null);
    setSaved(false);
  }

  function onDropBench() {
    if (!draggedPlayer || dragSource?.type !== 'slot') return;
    if (dragSource.slotIndex === undefined) return;
    const newLineup = { ...lineup };
    delete newLineup[dragSource.slotIndex];
    setLineup(newLineup);
    setDraggedPlayer(null);
    setDragSource(null);
    setSaved(false);
  }

  function removeFromSlot(slotIndex: number) {
    const newLineup = { ...lineup };
    delete newLineup[slotIndex];
    setLineup(newLineup);
    setSaved(false);
  }

  function autoFill() {
    const newLineup: Record<number, Player | null> = {};
    const available = [...players];
    slots.forEach((slot, i) => {
      if (available.length === 0) return;
      // Try to match position label
      const posMap: Record<string, string[]> = {
        GK: ['GOALKEEPER'],
        CB: ['DEFENDER'], RB: ['DEFENDER'], LB: ['DEFENDER'],
        CM: ['MIDFIELDER'], DM: ['MIDFIELDER'], AM: ['MIDFIELDER'],
        RM: ['MIDFIELDER'], LM: ['MIDFIELDER'], RWB: ['MIDFIELDER'], LWB: ['MIDFIELDER'],
        ST: ['FORWARD'], RW: ['FORWARD'], LW: ['FORWARD'],
      };
      const preferred = posMap[slot.label] ?? [];
      const matchIdx = available.findIndex((p) => preferred.includes(p.position ?? ''));
      const pick = matchIdx >= 0 ? available.splice(matchIdx, 1)[0] : available.splice(0, 1)[0];
      newLineup[i] = pick;
    });
    setLineup(newLineup);
    setSaved(false);
  }

  function clearLineup() {
    setLineup({});
    setSaved(false);
  }

  function saveLineup() {
    // Save to localStorage for now (could be extended to an API)
    const key = `lineup_${teamName}`;
    localStorage.setItem(key, JSON.stringify({ formation, lineup: Object.fromEntries(
      Object.entries(lineup).map(([k, v]) => [k, v?.id ?? null])
    )}));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const filledCount = Object.values(lineup).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-col gap-2 flex-wrap">
          {/* Size selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">عدد اللاعبين:</span>
            {SIZE_GROUPS.map(({ size, label }) => (
              <button
                key={size}
                onClick={() => handleSizeChange(size)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeSize === size
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Formation selector for current size */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">التشكيلة:</span>
            {sizeFormations.map((f) => (
              <button
                key={f}
                onClick={() => handleFormationChange(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  formation === f
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {FORMATIONS[f].name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={autoFill}
            className="px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
          >
            ملء تلقائي
          </button>
          <button
            onClick={clearLineup}
            className="px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red600 hover:bg-red-100 transition text-red-600"
          >
            مسح
          </button>
          <button
            onClick={saveLineup}
            className="px-4 py-1.5 rounded-lg text-sm bg-green-600 hover:bg-green-700 text-white font-medium transition"
          >
            {saved ? '✅ تم الحفظ' : 'حفظ التشكيلة'}
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* PITCH */}
        <div className="flex-1 min-w-0">
          <div
            ref={pitchRef}
            className="relative w-full rounded-xl overflow-hidden select-none"
            style={{ paddingBottom: '140%', background: 'linear-gradient(180deg, #166534 0%, #15803d 20%, #16a34a 40%, #15803d 60%, #166534 80%, #14532d 100%)' }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropBench}
          >
            {/* Pitch markings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
              {/* Outer border */}
              <rect x="3" y="3" width="94" height="134" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              {/* Center line */}
              <line x1="3" y1="70" x2="97" y2="70" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              {/* Center circle */}
              <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.5)"/>
              {/* Top penalty area */}
              <rect x="22" y="3" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              {/* Top goal area */}
              <rect x="35" y="3" width="30" height="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              {/* Top penalty spot */}
              <circle cx="50" cy="17" r="0.8" fill="rgba(255,255,255,0.5)"/>
              {/* Bottom penalty area */}
              <rect x="22" y="115" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              {/* Bottom goal area */}
              <rect x="35" y="128" width="30" height="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              {/* Bottom penalty spot */}
              <circle cx="50" cy="123" r="0.8" fill="rgba(255,255,255,0.5)"/>
              {/* Grass stripes */}
              {[0,1,2,3,4,5,6].map((i) => (
                <rect key={i} x="3" y={3 + i * 19.1} width="94" height="9.55"
                  fill="rgba(255,255,255,0.03)" />
              ))}
            </svg>

            {/* Formation label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-xs font-bold opacity-60">
              {activeSize}-a-side · {FORMATIONS[formation].name}
            </div>

            {/* Player slots */}
            {slots.map((slot, i) => {
              const player = lineup[i];
              return (
                <div
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '14%',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.stopPropagation(); onDropSlot(i); }}
                >
                  {player ? (
                    <div
                      className="relative cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={() => onDragStartSlot(player, i)}
                    >
                      {/* Player avatar */}
                      <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-green-800 flex items-center justify-center mx-auto">
                        {player.photoUrl ? (
                          <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-bold">
                            {player.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      {/* Rating badge */}
                      {avgRating(player.attributes) && (
                        <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none" style={{fontSize:'9px'}}>
                          {avgRating(player.attributes)}
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none hover:bg-red-600"
                        onClick={() => removeFromSlot(i)}
                        title="إزالة"
                      >
                        ×
                      </button>
                      {/* Name */}
                      <div className="text-white text-center mt-1 leading-tight" style={{fontSize:'10px', textShadow:'0 1px 3px rgba(0,0,0,0.8)', maxWidth:'100%', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis'}}>
                        {player.name.split(' ')[0]}
                      </div>
                    </div>
                  ) : (
                    /* Empty slot */
                    <div className="flex flex-col items-center opacity-80">
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center bg-white/10 mx-auto">
                        <span className="text-white/80 font-bold" style={{fontSize:'9px'}}>{slot.label}</span>
                      </div>
                      <div className="text-white/60 mt-1" style={{fontSize:'9px'}}>{slot.label}</div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Fill counter */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
              {filledCount} / {slots.length}
            </div>
          </div>
        </div>

        {/* BENCH / SQUAD */}
        <div
          className="xl:w-64 bg-white rounded-xl border border-gray-200 p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropBench}
        >
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">
            الاحتياطيون / القائمة ({bench.length})
          </h3>
          {bench.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">جميع اللاعبين في التشكيلة</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {bench.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-grab active:cursor-grabbing border border-gray-200 transition"
                  draggable
                  onDragStart={() => onDragStartBench(player)}
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.name} className="w-8 h-8 object-cover rounded-full" />
                    ) : (
                      <span className="font-bold text-green-700 text-xs">{player.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{player.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      {player.position && <span>{positionAr(player.position)}</span>}
                      {avgRating(player.attributes) && (
                        <span className="text-yellow-600 font-medium">⭐ {avgRating(player.attributes)}</span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/coach/players/${player.id}`}
                    className="text-gray-400 hover:text-blue-500 text-xs flex-shrink-0"
                    title="عرض الملف"
                    onClick={(e) => e.stopPropagation()}
                  >
                    👤
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
            <p>• اسحب اللاعب إلى موقعه في الملعب</p>
            <p>• اسحب من الملعب للإزالة</p>
            <p>• اضغط × لإزالة لاعب من موقعه</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function positionAr(pos: string) {
  const map: Record<string, string> = {
    GOALKEEPER: 'حارس',
    DEFENDER: 'مدافع',
    MIDFIELDER: 'وسط',
    FORWARD: 'مهاجم',
  };
  return map[pos] ?? pos;
}
