'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  label: string;
  x: number; // left %
  y: number; // top %
}

// ── Formations ──────────────────────────────────────────────────────────────

const FORMATIONS: Record<string, { name: string; size: number; slots: FormationSlot[] }> = {

  // ── 6-a-side ──
  '6: 1-2-2': {
    name: '1-2-2', size: 6,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 65, y: 68 }, { label: 'CB', x: 35, y: 68 },
      { label: 'CM', x: 65, y: 45 }, { label: 'CM', x: 35, y: 45 },
      { label: 'ST', x: 50, y: 22 },
    ],
  },
  '6: 1-3-1': {
    name: '1-3-1', size: 6,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 70, y: 66 }, { label: 'CB', x: 50, y: 66 }, { label: 'CB', x: 30, y: 66 },
      { label: 'CM', x: 50, y: 44 },
      { label: 'ST', x: 50, y: 22 },
    ],
  },
  '6: 2-2-1': {
    name: '2-2-1', size: 6,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 65, y: 70 }, { label: 'CB', x: 35, y: 70 },
      { label: 'RM', x: 72, y: 48 }, { label: 'LM', x: 28, y: 48 },
      { label: 'ST', x: 50, y: 24 },
    ],
  },

  // ── 8-a-side ──
  '8: 2-3-2': {
    name: '2-3-2', size: 8,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 65, y: 72 }, { label: 'CB', x: 35, y: 72 },
      { label: 'RM', x: 78, y: 52 }, { label: 'CM', x: 50, y: 52 }, { label: 'LM', x: 22, y: 52 },
      { label: 'ST', x: 65, y: 26 }, { label: 'ST', x: 35, y: 26 },
    ],
  },
  '8: 3-3-1': {
    name: '3-3-1', size: 8,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 70, y: 72 }, { label: 'CB', x: 50, y: 72 }, { label: 'CB', x: 30, y: 72 },
      { label: 'RM', x: 75, y: 50 }, { label: 'CM', x: 50, y: 50 }, { label: 'LM', x: 25, y: 50 },
      { label: 'ST', x: 50, y: 24 },
    ],
  },
  '8: 2-4-1': {
    name: '2-4-1', size: 8,
    slots: [
      { label: 'GK', x: 50, y: 88 },
      { label: 'CB', x: 65, y: 73 }, { label: 'CB', x: 35, y: 73 },
      { label: 'RM', x: 82, y: 52 }, { label: 'CM', x: 60, y: 52 },
      { label: 'CM', x: 40, y: 52 }, { label: 'LM', x: 18, y: 52 },
      { label: 'ST', x: 50, y: 25 },
    ],
  },

  // ── 11-a-side ──
  '11: 4-3-3': {
    name: '4-3-3', size: 11,
    slots: [
      { label: 'GK',  x: 50, y: 88 },
      { label: 'RB',  x: 80, y: 72 }, { label: 'CB',  x: 60, y: 72 },
      { label: 'CB',  x: 40, y: 72 }, { label: 'LB',  x: 20, y: 72 },
      { label: 'CM',  x: 70, y: 52 }, { label: 'CM',  x: 50, y: 52 }, { label: 'CM',  x: 30, y: 52 },
      { label: 'RW',  x: 80, y: 30 }, { label: 'ST',  x: 50, y: 22 }, { label: 'LW',  x: 20, y: 30 },
    ],
  },
  '11: 4-4-2': {
    name: '4-4-2', size: 11,
    slots: [
      { label: 'GK',  x: 50, y: 88 },
      { label: 'RB',  x: 80, y: 72 }, { label: 'CB',  x: 60, y: 72 },
      { label: 'CB',  x: 40, y: 72 }, { label: 'LB',  x: 20, y: 72 },
      { label: 'RM',  x: 80, y: 50 }, { label: 'CM',  x: 60, y: 50 },
      { label: 'CM',  x: 40, y: 50 }, { label: 'LM',  x: 20, y: 50 },
      { label: 'ST',  x: 62, y: 22 }, { label: 'ST',  x: 38, y: 22 },
    ],
  },
  '11: 4-2-3-1': {
    name: '4-2-3-1', size: 11,
    slots: [
      { label: 'GK',  x: 50, y: 88 },
      { label: 'RB',  x: 80, y: 73 }, { label: 'CB',  x: 60, y: 73 },
      { label: 'CB',  x: 40, y: 73 }, { label: 'LB',  x: 20, y: 73 },
      { label: 'DM',  x: 62, y: 58 }, { label: 'DM',  x: 38, y: 58 },
      { label: 'RW',  x: 78, y: 38 }, { label: 'AM',  x: 50, y: 38 }, { label: 'LW',  x: 22, y: 38 },
      { label: 'ST',  x: 50, y: 18 },
    ],
  },
  '11: 3-5-2': {
    name: '3-5-2', size: 11,
    slots: [
      { label: 'GK',  x: 50, y: 88 },
      { label: 'CB',  x: 68, y: 73 }, { label: 'CB',  x: 50, y: 73 }, { label: 'CB',  x: 32, y: 73 },
      { label: 'RWB', x: 85, y: 53 }, { label: 'CM',  x: 65, y: 53 },
      { label: 'CM',  x: 50, y: 53 }, { label: 'CM',  x: 35, y: 53 }, { label: 'LWB', x: 15, y: 53 },
      { label: 'ST',  x: 62, y: 22 }, { label: 'ST',  x: 38, y: 22 },
    ],
  },
};

function avgRating(attrs: Player['attributes']) {
  if (!attrs) return null;
  const v = [attrs.speed, attrs.passing, attrs.shooting, attrs.dribbling, attrs.defense, attrs.stamina];
  return (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1);
}

function positionAr(pos: string) {
  const map: Record<string, string> = {
    GOALKEEPER: 'حارس', DEFENDER: 'مدافع', MIDFIELDER: 'وسط', FORWARD: 'مهاجم',
  };
  return map[pos] ?? pos;
}

const SIZE_GROUPS: { size: number; label: string }[] = [
  { size: 6, label: '6 لاعبين' },
  { size: 8, label: '8 لاعبين' },
  { size: 11, label: '11 لاعباً' },
];

// ── Drag state (ref, not state — no re-renders while dragging) ───────────────

interface DragState {
  active: boolean;
  playerId: string;
  sourceType: 'bench' | 'slot';
  sourceSlot?: number;
  pointerId: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TacticalBoard({
  players,
  teamName,
  teamId,
}: {
  players: Player[];
  teamName: string;
  teamId: string;
}) {
  const [activeSize, setActiveSize] = useState<number>(11);
  const defaultFormation = Object.keys(FORMATIONS).find((k) => FORMATIONS[k].size === 11) ?? '11: 4-3-3';
  const [formation, setFormation] = useState(defaultFormation);
  // slotIndex → playerId
  const [slotMap, setSlotMap] = useState<Record<number, string>>({});
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const pitchRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // Keep slotMap + formation accessible inside pointer handlers without stale closure
  const slotMapRef = useRef(slotMap);
  useEffect(() => { slotMapRef.current = slotMap; }, [slotMap]);
  const formationRef = useRef(formation);
  useEffect(() => { formationRef.current = formation; }, [formation]);

  const slots = FORMATIONS[formation].slots;
  const sizeFormations = Object.keys(FORMATIONS).filter((k) => FORMATIONS[k].size === activeSize);

  // Build reverse map: playerId → slotIndex
  const playerToSlot: Record<string, number> = {};
  Object.entries(slotMap).forEach(([si, pid]) => { playerToSlot[pid] = Number(si); });

  const bench = players.filter((p) => !(p.id in playerToSlot));
  const filledCount = Object.keys(slotMap).length;

  // ── Load lineup from API on mount ────────────────────────────────────────
  useEffect(() => {
    if (!teamId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/coach/lineup?teamId=${encodeURIComponent(teamId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) {
          const { formation: f, slots: s } = data.data as { formation: string; slots: Record<string, string> };
          if (f && FORMATIONS[f]) {
            setFormation(f);
            setActiveSize(FORMATIONS[f].size);
          }
          if (s) {
            // Convert string keys to number keys
            const numMap: Record<number, string> = {};
            Object.entries(s).forEach(([k, v]) => { numMap[Number(k)] = v; });
            setSlotMap(numMap);
          }
        }
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // ── Save lineup to API ────────────────────────────────────────────────────
  async function saveLineup() {
    setSaving(true);
    try {
      const strMap: Record<string, string> = {};
      Object.entries(slotMap).forEach(([k, v]) => { strMap[k] = v; });
      await fetch('/api/coach/lineup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, formation, slots: strMap }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {/* ignore */} finally {
      setSaving(false);
    }
  }

  // ── Ghost element helpers ─────────────────────────────────────────────────
  function createGhost(player: Player, cx: number, cy: number) {
    removeGhost();
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'z-index:9999',
      'pointer-events:none',
      'width:52px',
      'height:52px',
      'border-radius:50%',
      'border:3px solid #fff',
      'box-shadow:0 4px 20px rgba(0,0,0,0.5)',
      'overflow:hidden',
      'background:#166534',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'transform:translate(-50%,-50%) scale(1.15)',
      'transition:transform 0.05s',
      `left:${cx}px`,
      `top:${cy}px`,
    ].join(';');
    if (player.photoUrl) {
      const img = document.createElement('img');
      img.src = player.photoUrl;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      el.appendChild(img);
    } else {
      el.style.color = '#fff';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '18px';
      el.textContent = player.name.charAt(0);
    }
    document.body.appendChild(el);
    ghostRef.current = el;
  }

  function moveGhost(cx: number, cy: number) {
    if (ghostRef.current) {
      ghostRef.current.style.left = `${cx}px`;
      ghostRef.current.style.top = `${cy}px`;
    }
  }

  function removeGhost() {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
  }

  // ── Hit test: which slot index is at (cx, cy)? ───────────────────────────
  function slotIndexAtPoint(cx: number, cy: number): number | null {
    const pitch = pitchRef.current;
    if (!pitch) return null;
    const rect = pitch.getBoundingClientRect();
    const px = ((cx - rect.left) / rect.width) * 100;
    const py = ((cy - rect.top) / rect.height) * 100;
    const currentSlots = FORMATIONS[formationRef.current].slots;
    const HIT = 9; // % radius
    for (let i = 0; i < currentSlots.length; i++) {
      const s = currentSlots[i];
      const dx = px - s.x;
      const dy = py - s.y;
      if (Math.sqrt(dx * dx + dy * dy) < HIT) return i;
    }
    return null;
  }

  // ── Pointer event handlers ────────────────────────────────────────────────

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current?.active) return;
    moveGhost(e.clientX, e.clientY);
    const si = slotIndexAtPoint(e.clientX, e.clientY);
    setHoverSlot(si);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerUp = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag?.active) return;

    removeGhost();
    setHoverSlot(null);
    dragRef.current = null;

    const targetSlot = slotIndexAtPoint(e.clientX, e.clientY);
    const currentMap = slotMapRef.current;
    const playerId = drag.playerId;

    if (targetSlot !== null) {
      // Drop onto a slot
      const newMap = { ...currentMap };

      if (drag.sourceType === 'slot' && drag.sourceSlot !== undefined) {
        // Dragged from a slot: swap if target occupied
        const displaced = newMap[targetSlot];
        if (displaced) {
          newMap[drag.sourceSlot] = displaced;
        } else {
          delete newMap[drag.sourceSlot];
        }
      }
      newMap[targetSlot] = playerId;
      setSlotMap(newMap);
      setSaved(false);
    } else if (drag.sourceType === 'slot' && drag.sourceSlot !== undefined) {
      // Dropped outside pitch — remove from slot
      const newMap = { ...currentMap };
      delete newMap[drag.sourceSlot];
      setSlotMap(newMap);
      setSaved(false);
    }

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPointerMove]);

  function startDrag(
    e: React.PointerEvent,
    player: Player,
    sourceType: 'bench' | 'slot',
    sourceSlot?: number,
  ) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragRef.current = {
      active: true,
      playerId: player.id,
      sourceType,
      sourceSlot,
      pointerId: e.pointerId,
    };

    createGhost(player, e.clientX, e.clientY);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  // ── Formation / size change ───────────────────────────────────────────────

  function handleSizeChange(size: number) {
    setActiveSize(size);
    const first = Object.keys(FORMATIONS).find((k) => FORMATIONS[k].size === size);
    if (first) setFormation(first);
    setSlotMap({});
    setSaved(false);
  }

  function handleFormationChange(f: string) {
    setFormation(f);
    setSlotMap({});
    setSaved(false);
  }

  // ── Auto-fill ─────────────────────────────────────────────────────────────

  function autoFill() {
    const newMap: Record<number, string> = {};
    const available = [...players];
    const posMap: Record<string, string[]> = {
      GK: ['GOALKEEPER'],
      CB: ['DEFENDER'], RB: ['DEFENDER'], LB: ['DEFENDER'],
      CM: ['MIDFIELDER'], DM: ['MIDFIELDER'], AM: ['MIDFIELDER'],
      RM: ['MIDFIELDER'], LM: ['MIDFIELDER'], RWB: ['MIDFIELDER'], LWB: ['MIDFIELDER'],
      ST: ['FORWARD'], RW: ['FORWARD'], LW: ['FORWARD'],
    };
    slots.forEach((slot, i) => {
      if (available.length === 0) return;
      const preferred = posMap[slot.label] ?? [];
      const matchIdx = available.findIndex((p) => preferred.includes(p.position ?? ''));
      const pick = matchIdx >= 0 ? available.splice(matchIdx, 1)[0] : available.splice(0, 1)[0];
      newMap[i] = pick.id;
    });
    setSlotMap(newMap);
    setSaved(false);
  }

  function clearLineup() {
    setSlotMap({});
    setSaved(false);
  }

  function removeFromSlot(slotIndex: number) {
    const newMap = { ...slotMap };
    delete newMap[slotIndex];
    setSlotMap(newMap);
    setSaved(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="text-center space-y-2">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm">جاري تحميل التشكيلة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Controls bar ── */}
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="flex flex-col gap-2">
          {/* Size tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600">عدد اللاعبين:</span>
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
          {/* Formation tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600">التشكيلة:</span>
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

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={autoFill}
            className="px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-medium"
          >
            ملء تلقائي
          </button>
          <button
            onClick={clearLineup}
            className="px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 transition font-medium"
          >
            مسح
          </button>
          <button
            onClick={saveLineup}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg text-sm bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium transition"
          >
            {saving ? 'جاري الحفظ...' : saved ? '✅ تم الحفظ' : 'حفظ التشكيلة'}
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── PITCH ── */}
        <div className="flex-1 min-w-0">
          <div
            ref={pitchRef}
            className="relative w-full rounded-xl overflow-hidden select-none"
            style={{
              paddingBottom: '140%',
              background: 'linear-gradient(180deg,#166534 0%,#15803d 20%,#16a34a 40%,#15803d 60%,#166534 80%,#14532d 100%)',
            }}
          >
            {/* Pitch markings SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
              <rect x="3" y="3" width="94" height="134" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              <line x1="3" y1="70" x2="97" y2="70" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.5)"/>
              <rect x="22" y="3" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              <rect x="35" y="3" width="30" height="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              <circle cx="50" cy="17" r="0.8" fill="rgba(255,255,255,0.5)"/>
              <rect x="22" y="115" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              <rect x="35" y="128" width="30" height="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              <circle cx="50" cy="123" r="0.8" fill="rgba(255,255,255,0.5)"/>
              {[0,1,2,3,4,5,6].map((i) => (
                <rect key={i} x="3" y={3 + i * 19.1} width="94" height="9.55" fill="rgba(255,255,255,0.03)" />
              ))}
            </svg>

            {/* Formation label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-xs font-bold opacity-60 pointer-events-none">
              {activeSize}-a-side · {FORMATIONS[formation].name}
            </div>

            {/* Player slots */}
            {slots.map((slot, i) => {
              const playerId = slotMap[i];
              const player = players.find((p) => p.id === playerId) ?? null;
              const isHovered = hoverSlot === i;

              return (
                <div
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transform: 'translate(-50%,-50%)',
                    width: '14%',
                  }}
                >
                  {player ? (
                    <div
                      className="relative cursor-grab"
                      style={{ touchAction: 'none' }}
                      onPointerDown={(e) => startDrag(e, player, 'slot', i)}
                    >
                      {/* Avatar ring — yellow when hovered */}
                      <div
                        className={`w-10 h-10 rounded-full border-2 shadow-lg overflow-hidden bg-green-800 flex items-center justify-center mx-auto transition-all ${
                          isHovered ? 'border-yellow-400 scale-110' : 'border-white'
                        }`}
                      >
                        {player.photoUrl ? (
                          <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-bold">{player.name.charAt(0)}</span>
                        )}
                      </div>
                      {/* Rating badge */}
                      {avgRating(player.attributes) && (
                        <div
                          className="absolute -top-1 -right-1 bg-yellow-400 text-black font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                          style={{ fontSize: '9px' }}
                        >
                          {avgRating(player.attributes)}
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none hover:bg-red-600"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => removeFromSlot(i)}
                        title="إزالة"
                      >
                        ×
                      </button>
                      {/* Name */}
                      <div
                        className="text-white text-center mt-1 leading-tight pointer-events-none"
                        style={{ fontSize: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.8)', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                      >
                        {player.name.split(' ')[0]}
                      </div>
                    </div>
                  ) : (
                    /* Empty slot — highlights when something is hovering over it */
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center mx-auto transition-all ${
                          isHovered
                            ? 'border-yellow-400 bg-yellow-400/30 scale-110'
                            : 'border-white/60 bg-white/10'
                        }`}
                      >
                        <span className="text-white/80 font-bold" style={{ fontSize: '9px' }}>{slot.label}</span>
                      </div>
                      <div className="text-white/60 mt-1 pointer-events-none" style={{ fontSize: '9px' }}>{slot.label}</div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Fill counter */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
              {filledCount} / {slots.length}
            </div>
          </div>
        </div>

        {/* ── BENCH / SQUAD ── */}
        <div className="xl:w-64 bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">
            الاحتياطيون / القائمة ({bench.length})
          </h3>

          {bench.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">جميع اللاعبين في التشكيلة</p>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto flex-1">
              {bench.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-grab border border-gray-200 transition active:scale-95"
                  style={{ touchAction: 'none' }}
                  onPointerDown={(e) => startDrag(e, player, 'bench')}
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm overflow-hidden flex-shrink-0 pointer-events-none">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.name} className="w-8 h-8 object-cover rounded-full" />
                    ) : (
                      <span className="font-bold text-green-700 text-xs">{player.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pointer-events-none">
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
                    className="text-gray-400 hover:text-blue-500 text-xs flex-shrink-0 z-10"
                    title="عرض الملف"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    👤
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
            <p>• اسحب اللاعب إلى موقعه في الملعب</p>
            <p>• اسحب من الملعب خارجاً لإزالته</p>
            <p>• اضغط × لإزالة لاعب من موقعه</p>
          </div>
        </div>
      </div>
    </div>
  );
}
