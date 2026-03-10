'use client';

import { useRef, useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FifaCardData {
  playerName: string;          // English name
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

// Overall out of 100: average of 6 attributes × 10
function computeOverall(attrs: FifaCardData['attributes']): number {
  if (!attrs) return 0;
  if (attrs.overall) return Math.min(100, Math.round(Number(attrs.overall)));
  const vals = [attrs.speed, attrs.passing, attrs.shooting, attrs.dribbling, attrs.defense, attrs.stamina];
  return Math.min(100, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10));
}

// Individual stat: 1-10 → 10-100
function scaleStat(v: number): number {
  return Math.round(Math.min(100, Math.max(1, v * 10)));
}

// Card tier colour theme based on overall /100
function cardTheme(overall: number) {
  if (overall >= 90) {
    // Pearl / Special — matches FIFA reference
    return {
      bg: 'linear-gradient(148deg, #d4d0c0 0%, #ece8dc 35%, #ffffff 55%, #e6e2d4 80%, #d0ccc0 100%)',
      shimmer: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.40) 100%)',
      border: '#c9a227',
      glow: 'rgba(201,162,39,0.70)',
      innerBorder: '#c9a22752',
      textOverall: '#7a5c0e',
      textPos: '#8a6a18',
      textName: '#111111',
      statValue: '#111111',
      statLabel: '#7a5c0e',
      divider: '#c9a22762',
      bottomBg: 'rgba(206,196,172,0.90)',
      fadeBottom: '#dedad0',
      silFill: '#9a9080',
      ornament: '#c9a227',
      footerText: '#7a5c0e',
      label: 'SPECIAL',
    };
  }
  if (overall >= 80) {
    return {
      bg: 'linear-gradient(148deg, #1c1200 0%, #4a3600 35%, #8c6a00 55%, #4a3600 80%, #1c1200 100%)',
      shimmer: 'linear-gradient(135deg, rgba(255,210,60,0.22) 0%, transparent 55%, rgba(255,200,0,0.10) 100%)',
      border: '#f0c040',
      glow: 'rgba(240,192,64,0.62)',
      innerBorder: '#f0c04050',
      textOverall: '#ffe880',
      textPos: '#ffd060',
      textName: '#ffffff',
      statValue: '#ffffff',
      statLabel: '#f0c040',
      divider: '#f0c04062',
      bottomBg: 'rgba(8,6,0,0.62)',
      fadeBottom: '#2a1e00',
      silFill: '#c09040',
      ornament: '#f0c040',
      footerText: '#f0c040',
      label: 'GOLD',
    };
  }
  if (overall >= 70) {
    return {
      bg: 'linear-gradient(148deg, #161616 0%, #363636 35%, #5e5e5e 55%, #363636 80%, #161616 100%)',
      shimmer: 'linear-gradient(135deg, rgba(200,200,200,0.20) 0%, transparent 55%, rgba(200,200,200,0.08) 100%)',
      border: '#b8b8b8',
      glow: 'rgba(184,184,184,0.48)',
      innerBorder: '#b8b8b850',
      textOverall: '#e8e8e8',
      textPos: '#d0d0d0',
      textName: '#ffffff',
      statValue: '#ffffff',
      statLabel: '#c8c8c8',
      divider: '#c0c0c062',
      bottomBg: 'rgba(0,0,0,0.58)',
      fadeBottom: '#181818',
      silFill: '#888888',
      ornament: '#c0c0c0',
      footerText: '#c8c8c8',
      label: 'SILVER',
    };
  }
  return {
    bg: 'linear-gradient(148deg, #140700 0%, #362000 35%, #623800 55%, #362000 80%, #140700 100%)',
    shimmer: 'linear-gradient(135deg, rgba(210,130,50,0.20) 0%, transparent 55%, rgba(210,130,50,0.08) 100%)',
    border: '#cd7832',
    glow: 'rgba(205,120,50,0.48)',
    innerBorder: '#cd783250',
    textOverall: '#eeaa64',
    textPos: '#d09050',
    textName: '#fff0d8',
    statValue: '#fff0d8',
    statLabel: '#d09050',
    divider: '#cd783262',
    bottomBg: 'rgba(0,0,0,0.58)',
    fadeBottom: '#140700',
    silFill: '#8a5030',
    ornament: '#cd7832',
    footerText: '#d09050',
    label: 'BRONZE',
  };
}

function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`;
}

// ── Card Inner (DOM captured by html2canvas) ──────────────────────────────────

interface FifaCardInnerProps {
  data: FifaCardData;
  cardRef: React.RefObject<HTMLDivElement>;
}

function FifaCardInner({ data, cardRef }: FifaCardInnerProps) {
  const overall = computeOverall(data.attributes);
  const theme   = cardTheme(overall);
  const attrs   = data.attributes;

  const stats: { label: string; value: number }[] = [
    { label: 'PAC', value: attrs?.speed     ?? 0 },
    { label: 'SHO', value: attrs?.shooting  ?? 0 },
    { label: 'PAS', value: attrs?.passing   ?? 0 },
    { label: 'DRI', value: attrs?.dribbling ?? 0 },
    { label: 'DEF', value: attrs?.defense   ?? 0 },
    { label: 'PHY', value: attrs?.stamina   ?? 0 },
  ];

  const cardW = 370;
  const cardH = 530;

  return (
    <div
      ref={cardRef}
      style={{
        width: cardW,
        height: cardH,
        position: 'relative',
        borderRadius: 22,
        background: theme.bg,
        border: `3px solid ${theme.border}`,
        boxShadow: `0 0 40px ${theme.glow}, 0 14px 50px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.20)`,
        fontFamily: "'Arial Black', 'Arial', sans-serif",
        overflow: 'hidden',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Shimmer overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        background: theme.shimmer, pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Inner decorative border */}
      <div style={{
        position: 'absolute', inset: 8, borderRadius: 16,
        border: `1.5px solid ${theme.innerBorder}`,
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Top ornament */}
      <div style={{
        position: 'absolute', top: -1, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 24, color: theme.ornament, zIndex: 5, lineHeight: 1,
        filter: `drop-shadow(0 0 8px ${theme.border})`,
      }}>
        ✦
      </div>

      {/* Tier badge (top-right corner) */}
      <div style={{
        position: 'absolute', top: 14, right: 16, zIndex: 5,
        fontSize: 8, fontWeight: 900, letterSpacing: 1.5,
        color: theme.border,
        border: `1px solid ${theme.border}88`,
        borderRadius: 4, padding: '2px 6px',
        fontFamily: "'Arial', sans-serif",
      }}>
        {theme.label}
      </div>

      {/* ── Overall + Position + Academy badge (top-left) ── */}
      <div style={{
        position: 'absolute', top: 22, left: 22, zIndex: 5,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Overall number */}
        <div style={{
          fontSize: 84, fontWeight: 900, lineHeight: 0.87,
          color: theme.textOverall,
          textShadow: `0 2px 16px rgba(0,0,0,0.22), 0 0 28px ${theme.glow}`,
          fontFamily: "'Arial Black', sans-serif",
          letterSpacing: -2,
        }}>
          {overall}
        </div>

        {/* Position */}
        <div style={{
          fontSize: 16, fontWeight: 900, letterSpacing: 3,
          color: theme.textPos, marginTop: 6,
          fontFamily: "'Arial Black', sans-serif",
        }}>
          {posShort(data.position)}
        </div>

        {/* Academy logo or ⚽ */}
        <div style={{
          marginTop: 12, width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {data.academyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.academyLogoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: 40, height: 40, objectFit: 'cover',
                borderRadius: 8, border: `1.5px solid ${theme.border}99`,
              }}
            />
          ) : (
            <span style={{ fontSize: 28, filter: `drop-shadow(0 0 5px ${theme.ornament})` }}>⚽</span>
          )}
        </div>
      </div>

      {/* ── Player photo / silhouette ── */}
      <div style={{
        position: 'absolute',
        top: 10, left: '40%',
        width: 240, height: 325,
        zIndex: 3,
      }}>
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photoUrl}
            alt={data.playerName}
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
          />
        ) : (
          <svg
            viewBox="0 0 200 280"
            style={{ width: '100%', height: '100%', fill: theme.silFill, opacity: 0.50 }}
          >
            <ellipse cx="100" cy="50" rx="40" ry="46" />
            <rect x="86" y="90" width="28" height="22" rx="6" />
            <path d="M28 280 Q40 168 100 148 Q160 168 172 280Z" />
            <rect x="28" y="148" width="34" height="102" rx="14" transform="rotate(-22 45 199)" />
            <rect x="138" y="148" width="34" height="102" rx="14" transform="rotate(22 155 199)" />
          </svg>
        )}
        {/* Fade to bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
          background: `linear-gradient(to bottom, transparent, ${theme.fadeBottom})`,
          zIndex: 4,
        }} />
      </div>

      {/* ── Bottom panel ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px 12px',
        background: theme.bottomBg,
        zIndex: 6,
      }}>

        {/* Player name — English, ALL CAPS */}
        <div style={{
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 3.5,
          textTransform: 'uppercase',
          color: theme.textName,
          marginBottom: 11,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textShadow: '0 1px 6px rgba(0,0,0,0.55)',
          fontFamily: "'Arial Black', sans-serif",
        }}>
          {data.playerName}
        </div>

        {/* Stats: label (top) then value (bottom) — FIFA style */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderTop: `1px solid ${theme.divider}`,
          borderBottom: `1px solid ${theme.divider}`,
          padding: '8px 0',
          marginBottom: 11,
        }}>
          {stats.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {/* Label above */}
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                color: theme.statLabel, opacity: 0.9,
                fontFamily: "'Arial', sans-serif",
              }}>
                {label}
              </div>
              {/* Value below */}
              <div style={{
                fontSize: 20, fontWeight: 900, lineHeight: 1,
                color: theme.statValue,
                fontFamily: "'Arial Black', sans-serif",
              }}>
                {scaleStat(value)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: "بواسطة أكاديميتنا ❤️" + date */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={16} height={16} style={{ opacity: 0.80 }} />
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: theme.footerText, opacity: 0.90,
              fontFamily: "'Arial', sans-serif",
            }}>
              بواسطة أكاديميتنا ❤️
            </span>
          </div>
          <div style={{
            fontSize: 9, color: theme.footerText, opacity: 0.65,
            fontFamily: "'Arial', sans-serif",
          }}>
            {todayStr()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export: card + download button ───────────────────────────────────────

export function FifaCard({ data }: { data: FifaCardData }) {
  const cardRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 3,
        backgroundColor: null,
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      const safeName = data.playerName.replace(/\s+/g, '_').toUpperCase();
      a.download = `${safeName}_CARD.png`;
      a.click();
    } catch (err) {
      console.error('Card export failed:', err);
      alert('فشل تصدير البطاقة. حاول مجدداً.');
    } finally {
      setDownloading(false);
    }
  }, [data.playerName]);

  return (
    <div className="flex flex-col items-center gap-4">
      <FifaCardInner data={data} cardRef={cardRef} />
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-green-900/30"
      >
        {downloading ? (
          <><span className="animate-spin">⏳</span> جاري التصدير...</>
        ) : (
          <>⬇️ حفظ البطاقة</>
        )}
      </button>
      <p className="text-xs text-gray-400">سيتم حفظ البطاقة كصورة PNG بجودة عالية</p>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-gray-900 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full overflow-y-auto max-h-screen">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-white font-bold text-lg">بطاقة اللاعب</h2>
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
      )}
    </>
  );
}
