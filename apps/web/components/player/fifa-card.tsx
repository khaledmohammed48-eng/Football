'use client';

import { useRef, useState, useCallback } from 'react';

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

// Overall out of 100.
// Stored overall field: if >10 treat as already on 100-scale, else multiply ×10.
// Fallback: average of 6 attributes × 10.
function computeOverall(attrs: FifaCardData['attributes']): number {
  if (!attrs) return 0;
  if (attrs.overall) {
    const raw = Number(attrs.overall);
    const scaled = raw > 10 ? raw : raw * 10;
    return Math.min(100, Math.round(scaled));
  }
  const vals = [attrs.speed, attrs.passing, attrs.shooting, attrs.dribbling, attrs.defense, attrs.stamina];
  return Math.min(100, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10));
}

// Individual stat: 1–10 → 10–100
function scaleStat(v: number): number {
  return Math.round(Math.min(100, Math.max(1, v * 10)));
}

// Tier theme
function cardTheme(overall: number) {
  if (overall >= 90) {
    return {
      // Pearl / Special
      cardBg:         'linear-gradient(148deg, #ccc8b4 0%, #e8e4d4 40%, #f8f6ee 60%, #e0dcc8 85%, #ccc8b4 100%)',
      photoBg:        '#c8c4b0',
      photoOverlayL:  'rgba(205,200,185,0.82)',
      photoOverlayT:  'rgba(180,175,155,0.55)',
      fadeBottom:     '#dedad0',
      border:         '#c9a227',
      glow:           'rgba(201,162,39,0.70)',
      innerBorder:    '#c9a22752',
      textOverall:    '#6e500a',
      textPos:        '#7a5c12',
      textName:       '#111111',
      statValue:      '#111111',
      statLabel:      '#7a5c12',
      divider:        '#c9a22760',
      bottomBg:       'rgba(200,192,168,0.92)',
      footerText:     '#6e500a',
      silFill:        '#9a9070',
      ornament:       '#c9a227',
      label:          'SPECIAL',
    };
  }
  if (overall >= 80) {
    return {
      cardBg:         'linear-gradient(148deg, #1a1000 0%, #432e00 38%, #7a5800 58%, #432e00 80%, #1a1000 100%)',
      photoBg:        '#2a1e00',
      photoOverlayL:  'rgba(20,14,0,0.75)',
      photoOverlayT:  'rgba(10,8,0,0.60)',
      fadeBottom:     '#261c00',
      border:         '#f0c040',
      glow:           'rgba(240,192,64,0.65)',
      innerBorder:    '#f0c04050',
      textOverall:    '#ffe880',
      textPos:        '#ffd060',
      textName:       '#ffffff',
      statValue:      '#ffffff',
      statLabel:      '#f0c040',
      divider:        '#f0c04062',
      bottomBg:       'rgba(6,4,0,0.78)',
      footerText:     '#f0c040',
      silFill:        '#b88030',
      ornament:       '#f0c040',
      label:          'GOLD',
    };
  }
  if (overall >= 70) {
    return {
      cardBg:         'linear-gradient(148deg, #141414 0%, #303030 38%, #545454 58%, #303030 80%, #141414 100%)',
      photoBg:        '#1a1a1a',
      photoOverlayL:  'rgba(16,16,16,0.75)',
      photoOverlayT:  'rgba(10,10,10,0.60)',
      fadeBottom:     '#181818',
      border:         '#b8b8b8',
      glow:           'rgba(184,184,184,0.50)',
      innerBorder:    '#b8b8b850',
      textOverall:    '#e8e8e8',
      textPos:        '#d0d0d0',
      textName:       '#ffffff',
      statValue:      '#ffffff',
      statLabel:      '#cccccc',
      divider:        '#c0c0c062',
      bottomBg:       'rgba(0,0,0,0.72)',
      footerText:     '#cccccc',
      silFill:        '#808080',
      ornament:       '#b8b8b8',
      label:          'SILVER',
    };
  }
  return {
    cardBg:         'linear-gradient(148deg, #120600 0%, #2e1800 38%, #5a3000 58%, #2e1800 80%, #120600 100%)',
    photoBg:        '#1a0a00',
    photoOverlayL:  'rgba(16,8,0,0.75)',
    photoOverlayT:  'rgba(10,5,0,0.60)',
    fadeBottom:     '#160800',
    border:         '#cd7832',
    glow:           'rgba(205,120,50,0.50)',
    innerBorder:    '#cd783250',
    textOverall:    '#eeaa64',
    textPos:        '#d09050',
    textName:       '#fff0d8',
    statValue:      '#fff0d8',
    statLabel:      '#cd9050',
    divider:        '#cd783262',
    bottomBg:       'rgba(0,0,0,0.72)',
    footerText:     '#d09050',
    silFill:        '#804820',
    ornament:       '#cd7832',
    label:          'BRONZE',
  };
}

function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`;
}

// ── Card Inner ─────────────────────────────────────────────────────────────────

interface FifaCardInnerProps {
  data: FifaCardData;
  cardRef: React.RefObject<HTMLDivElement>;
}

function FifaCardInner({ data, cardRef }: FifaCardInnerProps) {
  const overall = computeOverall(data.attributes);
  const theme   = cardTheme(overall);
  const attrs   = data.attributes;

  // Stats always in LTR order: PAC SHO PAS DRI DEF PHY
  const stats: { label: string; value: number }[] = [
    { label: 'PAC', value: attrs?.speed     ?? 0 },
    { label: 'SHO', value: attrs?.shooting  ?? 0 },
    { label: 'PAS', value: attrs?.passing   ?? 0 },
    { label: 'DRI', value: attrs?.dribbling ?? 0 },
    { label: 'DEF', value: attrs?.defense   ?? 0 },
    { label: 'PHY', value: attrs?.stamina   ?? 0 },
  ];

  const cardW   = 370;
  const cardH   = 520;
  const photoH  = 330;           // top portion — photo fills full width
  const bottomH = cardH - photoH; // bottom panel

  const bestPlayerOffset = data.isBestPlayer ? 22 : 0;

  return (
    // dir="ltr" — IMPORTANT: prevents RTL bleeding from parent page
    <div
      ref={cardRef}
      dir="ltr"
      style={{
        width: cardW,
        height: cardH,
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
      {/* ── BEST PLAYER BANNER (top strip) ── */}
      {data.isBestPlayer && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
          background: 'linear-gradient(90deg, #8b6500, #ffd700, #ffc200, #ffd700, #8b6500)',
          textAlign: 'center',
          padding: '4px 0',
          fontSize: 11, fontWeight: 900, letterSpacing: 2.5,
          color: '#1a0800',
          fontFamily: "'Arial Black', sans-serif",
          boxShadow: '0 2px 10px rgba(255,215,0,0.6)',
        }}>
          ⭐ أفضل لاعب ⭐
        </div>
      )}

      {/* ── FULL-WIDTH PHOTO SECTION ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: photoH,
        overflow: 'hidden',
        background: theme.photoBg,
        zIndex: 1,
      }}>
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photoUrl}
            alt={data.playerName}
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        ) : (
          /* Silhouette placeholder */
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}>
            <svg
              viewBox="0 0 200 260"
              style={{ width: '55%', height: '92%', fill: theme.silFill, opacity: 0.45 }}
            >
              <ellipse cx="100" cy="48" rx="40" ry="44" />
              <rect x="86" y="88" width="28" height="20" rx="6" />
              <path d="M26 260 Q40 162 100 142 Q160 162 174 260Z" />
              <rect x="26" y="144" width="34" height="98" rx="13" transform="rotate(-22 43 193)" />
              <rect x="140" y="144" width="34" height="98" rx="13" transform="rotate(22 157 193)" />
            </svg>
          </div>
        )}

        {/* Left gradient — makes overall/position text readable over photo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: '52%',
          background: `linear-gradient(to right, ${theme.photoOverlayL} 0%, ${theme.photoOverlayL.replace('0.', '0.4').replace('0.75', '0.4').replace('0.82', '0.4')} 55%, transparent 100%)`,
          zIndex: 2,
        }} />

        {/* Top gradient */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 55,
          background: `linear-gradient(to bottom, ${theme.photoOverlayT}, transparent)`,
          zIndex: 2,
        }} />

        {/* Bottom fade into card body */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 90,
          background: `linear-gradient(to bottom, transparent, ${theme.fadeBottom})`,
          zIndex: 2,
        }} />
      </div>

      {/* Inner decorative border frame */}
      <div style={{
        position: 'absolute', inset: 7, borderRadius: 16,
        border: `1.5px solid ${theme.innerBorder}`,
        pointerEvents: 'none', zIndex: 15,
      }} />

      {/* Top ornament ✦ */}
      <div style={{
        position: 'absolute',
        top: bestPlayerOffset + 6, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 18, color: theme.ornament, zIndex: 12, lineHeight: 1,
        filter: `drop-shadow(0 0 6px ${theme.border})`,
      }}>
        ✦
      </div>

      {/* ── OVERALL + POSITION + BADGE (top-left, over photo) ── */}
      <div style={{
        position: 'absolute',
        top: bestPlayerOffset + 18, left: 20,
        zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Overall number */}
        <div style={{
          fontSize: 82, fontWeight: 900, lineHeight: 0.86,
          color: theme.textOverall,
          textShadow: `0 2px 12px rgba(0,0,0,0.7), 0 0 28px ${theme.glow}`,
          fontFamily: "'Arial Black', sans-serif",
          letterSpacing: -2,
        }}>
          {overall}
        </div>

        {/* Position */}
        <div style={{
          fontSize: 16, fontWeight: 900, letterSpacing: 3,
          color: theme.textPos, marginTop: 6,
          textShadow: '0 1px 6px rgba(0,0,0,0.8)',
          fontFamily: "'Arial Black', sans-serif",
        }}>
          {posShort(data.position)}
        </div>

        {/* Academy logo or ⚽ */}
        <div style={{
          marginTop: 10, width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {data.academyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.academyLogoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: 38, height: 38, objectFit: 'cover',
                borderRadius: 8,
                border: `2px solid ${theme.border}bb`,
                boxShadow: `0 0 8px ${theme.glow}`,
              }}
            />
          ) : (
            <span style={{ fontSize: 26, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.7))' }}>⚽</span>
          )}
        </div>
      </div>

      {/* Tier badge — top-right */}
      <div style={{
        position: 'absolute',
        top: bestPlayerOffset + 18, right: 18,
        zIndex: 10,
        fontSize: 8, fontWeight: 900, letterSpacing: 1.5,
        color: theme.border,
        border: `1px solid ${theme.border}90`,
        borderRadius: 5, padding: '3px 7px',
        background: 'rgba(0,0,0,0.40)',
        fontFamily: "'Arial', sans-serif",
      }}>
        {theme.label}
      </div>

      {/* ── BOTTOM PANEL ── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: bottomH,
        background: theme.bottomBg,
        zIndex: 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        padding: '10px 18px',
      }}>

        {/* Player name — ALL CAPS, English */}
        <div style={{
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 3.5,
          textTransform: 'uppercase',
          color: theme.textName,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textShadow: '0 1px 6px rgba(0,0,0,0.55)',
          fontFamily: "'Arial Black', sans-serif",
        }}>
          {data.playerName}
        </div>

        {/* Stats: PAC SHO PAS DRI DEF PHY — label above, value below */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderTop: `1px solid ${theme.divider}`,
          borderBottom: `1px solid ${theme.divider}`,
          padding: '6px 0',
        }}>
          {stats.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                color: theme.statLabel, opacity: 0.92,
                fontFamily: "'Arial', sans-serif",
              }}>
                {label}
              </div>
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

        {/* Footer: platform + date */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={15} height={15} style={{ opacity: 0.80 }} />
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: theme.footerText, opacity: 0.92,
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
        {downloading
          ? <><span className="animate-spin">⏳</span> جاري التصدير...</>
          : <>⬇️ حفظ البطاقة</>
        }
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-gray-900 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl w-full max-w-sm overflow-y-auto max-h-[95vh]">
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
