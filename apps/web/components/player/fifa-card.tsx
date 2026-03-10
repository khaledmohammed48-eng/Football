'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FifaCardData {
  playerName: string;          // ⚠ Must be English — entered by admin
  photoUrl?: string | null;
  position?: string | null;    // GOALKEEPER | DEFENDER | MIDFIELDER | FORWARD
  attributes?: {
    speed: number;
    passing: number;
    shooting: number;
    dribbling: number;
    defense: number;
    stamina: number;
    overall?: number | null;
    [key: string]: unknown;
  } | null;
  academyName: string;
  academyLogoUrl?: string | null;
  isBestPlayer?: boolean;
}

// ── Confetti (5-minute celebration) ──────────────────────────────────────────

const CONFETTI_COLORS = [
  '#FFD700', '#FFFFFF', '#1a7a3a', '#FFA500',
  '#FF4500', '#00CED1', '#FF69B4', '#c9a227',
];

interface ConfettiParticle {
  x: number; y: number;
  w: number; h: number;
  color: string;
  dx: number; dy: number;
  rot: number; drot: number;
  alpha: number;
}

// Canvas confetti that runs for `durationMs` milliseconds
function ConfettiCanvas({ durationMs = 300_000 }: { durationMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = ctx;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: ConfettiParticle[] = [];
    const startTime = Date.now();
    let lastSpawn   = startTime;
    let animId: number;

    function spawn(count: number) {
      const W = canvas!.width;
      for (let i = 0; i < count; i++) {
        particles.push({
          x:    Math.random() * W,
          y:    -10 - Math.random() * 30,
          w:    Math.random() * 9 + 4,
          h:    Math.random() * 5 + 2,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          dx:   (Math.random() - 0.5) * 4,
          dy:   Math.random() * 3 + 1.5,
          rot:  Math.random() * Math.PI * 2,
          drot: (Math.random() - 0.5) * 0.18,
          alpha: 1,
        });
      }
    }

    spawn(140); // initial burst

    function animate() {
      const now     = Date.now();
      const elapsed = now - startTime;

      // Spawn rate: heavy first 20s, light afterwards
      const interval   = elapsed < 20_000 ? 600  : 4_000;
      const spawnCount = elapsed < 20_000 ? 25   : 8;
      if (now - lastSpawn > interval && elapsed < durationMs) {
        spawn(spawnCount);
        lastSpawn = now;
      }

      const W = canvas!.width;
      const H = canvas!.height;
      draw.clearRect(0, 0, W, H);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x   += p.dx;
        p.y   += p.dy;
        p.dy  += 0.06;   // gravity
        p.rot += p.drot;
        if (p.y > H * 0.85) p.alpha -= 0.025;
        if (p.y > H + 20 || p.alpha <= 0) { particles.splice(i, 1); continue; }

        draw.save();
        draw.globalAlpha = p.alpha;
        draw.translate(p.x, p.y);
        draw.rotate(p.rot);
        draw.fillStyle = p.color;
        draw.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        draw.restore();
      }

      if (elapsed < durationMs || particles.length > 0) {
        animId = requestAnimationFrame(animate);
      }
    }

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [durationMs]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function posShort(pos?: string | null) {
  const map: Record<string, string> = {
    GOALKEEPER: 'GK',
    DEFENDER:   'CB',
    MIDFIELDER: 'CAM',
    FORWARD:    'ST',
  };
  return map[pos ?? ''] ?? 'PLY';
}

// Overall: if stored > 10 treat as 100-scale, else × 10
function computeOverall(attrs: FifaCardData['attributes']): number {
  if (!attrs) return 0;
  if (attrs.overall) {
    const raw = Number(attrs.overall);
    return Math.min(100, Math.round(raw > 10 ? raw : raw * 10));
  }
  const vals = [attrs.speed, attrs.passing, attrs.shooting, attrs.dribbling, attrs.defense, attrs.stamina];
  return Math.min(100, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10));
}

// 1–10 → 10–100
function scaleStat(v: number): number {
  return Math.round(Math.min(100, Math.max(1, v * 10)));
}

function cardTheme(overall: number) {
  if (overall >= 90) {
    return {
      cardBg:        'linear-gradient(148deg, #ccc8b4 0%, #e8e4d4 40%, #f8f6ee 60%, #e0dcc8 85%, #ccc8b4 100%)',
      photoBg:       '#c8c4b0',
      photoOverlayL: 'rgba(205,200,185,0.82)',
      photoOverlayT: 'rgba(180,175,155,0.55)',
      fadeBottom:    '#dedad0',
      border:        '#c9a227',
      glow:          'rgba(201,162,39,0.70)',
      innerBorder:   '#c9a22752',
      textOverall:   '#6e500a',
      textPos:       '#7a5c12',
      textName:      '#111111',
      statValue:     '#111111',
      statLabel:     '#7a5c12',
      divider:       '#c9a22760',
      bottomBg:      'rgba(200,192,168,0.92)',
      footerText:    '#6e500a',
      silFill:       '#9a9070',
      ornament:      '#c9a227',
      acText:        '#7a5c12',
      label:         'SPECIAL',
    };
  }
  if (overall >= 80) {
    return {
      cardBg:        'linear-gradient(148deg, #1a1000 0%, #432e00 38%, #7a5800 58%, #432e00 80%, #1a1000 100%)',
      photoBg:       '#2a1e00',
      photoOverlayL: 'rgba(20,14,0,0.75)',
      photoOverlayT: 'rgba(10,8,0,0.60)',
      fadeBottom:    '#261c00',
      border:        '#f0c040',
      glow:          'rgba(240,192,64,0.65)',
      innerBorder:   '#f0c04050',
      textOverall:   '#ffe880',
      textPos:       '#ffd060',
      textName:      '#ffffff',
      statValue:     '#ffffff',
      statLabel:     '#f0c040',
      divider:       '#f0c04062',
      bottomBg:      'rgba(6,4,0,0.78)',
      footerText:    '#f0c040',
      silFill:       '#b88030',
      ornament:      '#f0c040',
      acText:        '#f0c040',
      label:         'GOLD',
    };
  }
  if (overall >= 70) {
    return {
      cardBg:        'linear-gradient(148deg, #141414 0%, #303030 38%, #545454 58%, #303030 80%, #141414 100%)',
      photoBg:       '#1a1a1a',
      photoOverlayL: 'rgba(16,16,16,0.75)',
      photoOverlayT: 'rgba(10,10,10,0.60)',
      fadeBottom:    '#181818',
      border:        '#b8b8b8',
      glow:          'rgba(184,184,184,0.50)',
      innerBorder:   '#b8b8b850',
      textOverall:   '#e8e8e8',
      textPos:       '#d0d0d0',
      textName:      '#ffffff',
      statValue:     '#ffffff',
      statLabel:     '#cccccc',
      divider:       '#c0c0c062',
      bottomBg:      'rgba(0,0,0,0.72)',
      footerText:    '#cccccc',
      silFill:       '#808080',
      ornament:      '#b8b8b8',
      acText:        '#cccccc',
      label:         'SILVER',
    };
  }
  return {
    cardBg:        'linear-gradient(148deg, #120600 0%, #2e1800 38%, #5a3000 58%, #2e1800 80%, #120600 100%)',
    photoBg:       '#1a0a00',
    photoOverlayL: 'rgba(16,8,0,0.75)',
    photoOverlayT: 'rgba(10,5,0,0.60)',
    fadeBottom:    '#160800',
    border:        '#cd7832',
    glow:          'rgba(205,120,50,0.50)',
    innerBorder:   '#cd783250',
    textOverall:   '#eeaa64',
    textPos:       '#d09050',
    textName:      '#fff0d8',
    statValue:     '#fff0d8',
    statLabel:     '#cd9050',
    divider:       '#cd783262',
    bottomBg:      'rgba(0,0,0,0.72)',
    footerText:    '#d09050',
    silFill:       '#804820',
    ornament:      '#cd7832',
    acText:        '#d09050',
    label:         'BRONZE',
  };
}

function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`;
}

// ── Card Inner ────────────────────────────────────────────────────────────────

interface FifaCardInnerProps {
  data: FifaCardData;
  cardRef: React.RefObject<HTMLDivElement>;
}

function FifaCardInner({ data, cardRef }: FifaCardInnerProps) {
  const overall = computeOverall(data.attributes);
  const theme   = cardTheme(overall);
  const attrs   = data.attributes;

  const stats: { label: string; arabic: string; value: number }[] = [
    { label: 'PAC', arabic: 'سرعة',    value: attrs?.speed     ?? 0 },
    { label: 'SHO', arabic: 'تسديد',   value: attrs?.shooting  ?? 0 },
    { label: 'PAS', arabic: 'تمرير',   value: attrs?.passing   ?? 0 },
    { label: 'DRI', arabic: 'مراوغة',  value: attrs?.dribbling ?? 0 },
    { label: 'DEF', arabic: 'دفاع',    value: attrs?.defense   ?? 0 },
    { label: 'PHY', arabic: 'لياقة',   value: attrs?.stamina   ?? 0 },
  ];

  const cardW   = 370;
  const cardH   = 530;
  const photoH  = 315;
  const bottomH = cardH - photoH;   // 215px
  const bpOff   = data.isBestPlayer ? 22 : 0;

  // Truncate long academy names
  const acName = data.academyName.length > 22
    ? data.academyName.slice(0, 21) + '…'
    : data.academyName;

  return (
    // No dir attribute — let html2canvas read Arabic correctly from page context
    <div
      ref={cardRef}
      style={{
        width: cardW, height: cardH,
        position: 'relative',
        borderRadius: 22,
        background: theme.cardBg,
        border: `3px solid ${theme.border}`,
        boxShadow: `0 0 40px ${theme.glow}, 0 16px 56px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.15)`,
        fontFamily: "'Arial Black', 'Arial', sans-serif",
        overflow: 'hidden',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Best player banner */}
      {data.isBestPlayer && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
          background: 'linear-gradient(90deg, #8b6500, #ffd700, #ffc200, #ffd700, #8b6500)',
          textAlign: 'center', padding: '4px 0',
          fontSize: 11, fontWeight: 900, letterSpacing: 2.5,
          color: '#1a0800',
          fontFamily: "'Arial Black', sans-serif",
          boxShadow: '0 2px 10px rgba(255,215,0,0.6)',
          direction: 'ltr',
        }}>
          ⭐ Best Player of the Month ⭐
        </div>
      )}

      {/* Full-width photo */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: photoH, overflow: 'hidden',
        background: theme.photoBg, zIndex: 1,
      }}>
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photoUrl}
            alt={data.playerName}
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <svg viewBox="0 0 200 260" style={{ width: '55%', height: '92%', fill: theme.silFill, opacity: 0.45 }}>
              <ellipse cx="100" cy="48" rx="40" ry="44" />
              <rect x="86" y="88" width="28" height="20" rx="6" />
              <path d="M26 260 Q40 162 100 142 Q160 162 174 260Z" />
              <rect x="26" y="144" width="34" height="98" rx="13" transform="rotate(-22 43 193)" />
              <rect x="140" y="144" width="34" height="98" rx="13" transform="rotate(22 157 193)" />
            </svg>
          </div>
        )}
        {/* Gradients over photo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '52%',
          background: `linear-gradient(to right, ${theme.photoOverlayL}, rgba(0,0,0,0) 100%)`,
          zIndex: 2,
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 55,
          background: `linear-gradient(to bottom, ${theme.photoOverlayT}, transparent)`,
          zIndex: 2,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
          background: `linear-gradient(to bottom, transparent, ${theme.fadeBottom})`,
          zIndex: 2,
        }} />
      </div>

      {/* Inner border */}
      <div style={{
        position: 'absolute', inset: 7, borderRadius: 16,
        border: `1.5px solid ${theme.innerBorder}`,
        pointerEvents: 'none', zIndex: 15,
      }} />

      {/* Top ornament */}
      <div style={{
        position: 'absolute', top: bpOff + 6, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 18, color: theme.ornament, zIndex: 12, lineHeight: 1,
        filter: `drop-shadow(0 0 6px ${theme.border})`,
      }}>
        ✦
      </div>

      {/* Overall + Position + 🇸🇦 — top left */}
      <div style={{
        position: 'absolute', top: bpOff + 18, left: 20,
        zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center',
        direction: 'ltr',
      }}>
        <div style={{
          fontSize: 82, fontWeight: 900, lineHeight: 0.86,
          color: theme.textOverall,
          textShadow: `0 2px 12px rgba(0,0,0,0.7), 0 0 28px ${theme.glow}`,
          fontFamily: "'Arial Black', sans-serif",
          letterSpacing: -2,
        }}>
          {overall}
        </div>
        <div style={{
          fontSize: 16, fontWeight: 900, letterSpacing: 3,
          color: theme.textPos, marginTop: 6,
          textShadow: '0 1px 6px rgba(0,0,0,0.8)',
          fontFamily: "'Arial Black', sans-serif",
        }}>
          {posShort(data.position)}
        </div>
        {/* Saudi flag below position */}
        <div style={{ marginTop: 8, fontSize: 26, lineHeight: 1, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))' }}>
          🇸🇦
        </div>
      </div>

      {/* Tier badge — top right */}
      <div style={{
        position: 'absolute', top: bpOff + 18, right: 18,
        zIndex: 10,
        fontSize: 8, fontWeight: 900, letterSpacing: 1.5,
        color: theme.border,
        border: `1px solid ${theme.border}90`,
        borderRadius: 5, padding: '3px 7px',
        background: 'rgba(0,0,0,0.40)',
        fontFamily: "'Arial', sans-serif",
        direction: 'ltr',
      }}>
        {theme.label}
      </div>

      {/* ── Bottom panel ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: bottomH,
        background: theme.bottomBg,
        zIndex: 8,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-evenly',
        padding: '8px 18px',
      }}>

        {/* Player name */}
        <div style={{
          textAlign: 'center', fontSize: 19, fontWeight: 900,
          letterSpacing: 3.5, textTransform: 'uppercase',
          color: theme.textName,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          textShadow: '0 1px 6px rgba(0,0,0,0.55)',
          fontFamily: "'Arial Black', sans-serif",
          direction: 'ltr',
        }}>
          {data.playerName}
        </div>

        {/* Stats: PAC SHO PAS DRI DEF PHY (label above, value below) */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          borderTop: `1px solid ${theme.divider}`,
          borderBottom: `1px solid ${theme.divider}`,
          padding: '6px 0',
          direction: 'ltr',
        }}>
          {stats.map(({ label, arabic, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {/* English abbrev */}
              <div style={{
                fontSize: 8, fontWeight: 700, letterSpacing: 0.5,
                color: theme.statLabel, opacity: 0.92,
                fontFamily: "'Arial', sans-serif",
              }}>
                {label}
              </div>
              {/* Stat number */}
              <div style={{
                fontSize: 18, fontWeight: 900, lineHeight: 1,
                color: theme.statValue,
                fontFamily: "'Arial Black', sans-serif",
              }}>
                {scaleStat(value)}
              </div>
              {/* Arabic name */}
              <div style={{
                fontSize: 7, fontWeight: 600,
                color: theme.statLabel, opacity: 0.78,
                whiteSpace: 'nowrap', letterSpacing: 0,
              }}>
                {arabic}
              </div>
            </div>
          ))}
        </div>

        {/* Academy name row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 7, direction: 'ltr',
        }}>
          {data.academyLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.academyLogoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 3, opacity: 0.9 }}
            />
          )}
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: theme.acText, opacity: 0.92,
            fontFamily: "'Arial', sans-serif",
            whiteSpace: 'nowrap',    // prevent bad line-wrap
            letterSpacing: 0,        // letterSpacing breaks Arabic connections
            unicodeBidi: 'embed',
          }}>
            {acName}
          </span>
        </div>

        {/* Footer: platform logo + "بواسطة أكاديميتنا ❤️" + date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={14} height={14} style={{ opacity: 0.78 }} />
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: theme.footerText, opacity: 0.88,
              fontFamily: "'Arial', sans-serif",
              whiteSpace: 'nowrap',
              letterSpacing: 0,
              unicodeBidi: 'embed',
            }}>
              بواسطة أكاديميتنا ❤️
            </span>
          </div>
          <div style={{
            fontSize: 9, color: theme.footerText, opacity: 0.60,
            fontFamily: "'Arial', sans-serif",
          }}>
            {todayStr()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FifaCard (card + download) ────────────────────────────────────────────────

export function FifaCard({ data }: { data: FifaCardData }) {
  const cardRef    = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const [scale, setScale]           = useState(1);
  const [downloading, setDownloading] = useState(false);

  // Scale card to fit container width on small screens
  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setScale(w > 0 && w < 370 ? w / 370 : 1);
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true, scale: 3, backgroundColor: null, logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${data.playerName.replace(/\s+/g, '_').toUpperCase()}_CARD.png`;
      a.click();
    } catch (err) {
      console.error('Card export failed:', err);
      alert('فشل تصدير البطاقة. حاول مجدداً.');
    } finally {
      setDownloading(false);
    }
  }, [data.playerName]);

  const cardH = 530;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Scaling wrapper — shrinks card to fit on small screens */}
      <div ref={wrapRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          flexShrink: 0,
          // compensate layout height after scale
          marginBottom: `${Math.round(cardH * scale - cardH)}px`,
        }}>
          <FifaCardInner data={data} cardRef={cardRef} />
        </div>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-green-900/30"
      >
        {downloading
          ? <><span className="animate-spin">⏳</span> جاري التصدير...</>
          : <>⬇️ حفظ البطاقة</>
        }
      </button>
      <p className="text-xs text-gray-400">سيتم حفظ البطاقة كصورة PNG بجودة عالية</p>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function FifaCardModal({
  data,
  trigger,
}: {
  data: FifaCardData;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl text-sm transition shadow-md">
            🃏 بطاقتي
          </button>
        )}
      </div>

      {open && (
        <>
          {/* Confetti — only for best player, runs 5 minutes */}
          {data.isBestPlayer && <ConfettiCanvas durationMs={300_000} />}

          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <div className="bg-gray-900 rounded-2xl p-3 sm:p-5 flex flex-col items-center gap-3 shadow-2xl w-full max-w-sm overflow-y-auto max-h-[95vh]">

              {/* Header — gold glow for best player */}
              <div className="flex items-center justify-between w-full">
                <h2 className={`font-bold text-lg ${data.isBestPlayer ? 'text-yellow-400' : 'text-white'}`}>
                  {data.isBestPlayer ? '⭐ أفضل لاعب!' : 'بطاقة اللاعب'}
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-white transition text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <FifaCard data={data} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
