'use client';

import { useRef, useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FifaCardData {
  playerName: string;          // shown on card (should be English)
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
    [key: string]: unknown; // allow extra DB fields
  } | null;
  academyName: string;
  academyLogoUrl?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function posShort(pos?: string | null) {
  const map: Record<string, string> = {
    GOALKEEPER: 'GK',
    DEFENDER:   'CB',
    MIDFIELDER: 'MID',
    FORWARD:    'ST',
  };
  return map[pos ?? ''] ?? 'PLY';
}

function computeOverall(attrs: FifaCardData['attributes']) {
  if (!attrs) return 0;
  if (attrs.overall) return attrs.overall;
  const vals = [attrs.speed, attrs.passing, attrs.shooting, attrs.dribbling, attrs.defense, attrs.stamina];
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10);
}

// Card tier colours based on overall (scale 0-100)
function cardTheme(overall: number) {
  if (overall >= 90) {
    return {
      bg: 'linear-gradient(160deg, #0a2a2a 0%, #0d4a4a 30%, #1a7a6e 55%, #0d4a4a 80%, #0a2a2a 100%)',
      border: '#4dffc3',
      glow: 'rgba(0,255,180,0.45)',
      shine: 'rgba(255,255,255,0.15)',
      statBg: 'rgba(0,0,0,0.45)',
      textTop: '#c0fff2',
      textMain: '#ffffff',
      label: 'SPECIAL',
    };
  }
  if (overall >= 80) {
    return {
      bg: 'linear-gradient(160deg, #1a1200 0%, #3d2e00 30%, #7a5c00 55%, #3d2e00 80%, #1a1200 100%)',
      border: '#f5c842',
      glow: 'rgba(255,200,0,0.45)',
      shine: 'rgba(255,255,255,0.18)',
      statBg: 'rgba(0,0,0,0.45)',
      textTop: '#ffe87d',
      textMain: '#ffffff',
      label: 'GOLD',
    };
  }
  if (overall >= 70) {
    return {
      bg: 'linear-gradient(160deg, #1a1a1a 0%, #3a3a3a 30%, #6e6e6e 55%, #3a3a3a 80%, #1a1a1a 100%)',
      border: '#c8c8c8',
      glow: 'rgba(200,200,200,0.4)',
      shine: 'rgba(255,255,255,0.15)',
      statBg: 'rgba(0,0,0,0.4)',
      textTop: '#e0e0e0',
      textMain: '#ffffff',
      label: 'SILVER',
    };
  }
  return {
    bg: 'linear-gradient(160deg, #1a0d00 0%, #3d2000 30%, #7a4500 55%, #3d2000 80%, #1a0d00 100%)',
    border: '#cd7f32',
    glow: 'rgba(205,127,50,0.4)',
    shine: 'rgba(255,255,255,0.12)',
    statBg: 'rgba(0,0,0,0.4)',
    textTop: '#e8a96e',
    textMain: '#ffffff',
    label: 'BRONZE',
  };
}

// Format today's date as DD / MM / YYYY
function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`;
}

// ── The Card (rendered as DOM, captured by html2canvas) ───────────────────────

interface FifaCardInnerProps {
  data: FifaCardData;
  cardRef: React.RefObject<HTMLDivElement>;
}

function FifaCardInner({ data, cardRef }: FifaCardInnerProps) {
  const overall = computeOverall(data.attributes);
  const theme = cardTheme(overall);
  const attrs = data.attributes;

  const stats: { label: string; value: number }[] = [
    { label: 'PAC', value: attrs?.speed     ?? 0 },
    { label: 'SHO', value: attrs?.shooting  ?? 0 },
    { label: 'PAS', value: attrs?.passing   ?? 0 },
    { label: 'DRI', value: attrs?.dribbling ?? 0 },
    { label: 'DEF', value: attrs?.defense   ?? 0 },
    { label: 'PHY', value: attrs?.stamina   ?? 0 },
  ];

  // Scale 1-10 to 1-99 for FIFA feel
  const scale = (v: number) => Math.round(Math.min(99, Math.max(1, v * 9.9)));

  const cardW = 340;
  const cardH = 480;

  return (
    <div
      ref={cardRef}
      style={{
        width: cardW,
        height: cardH,
        position: 'relative',
        borderRadius: 20,
        background: theme.bg,
        border: `2px solid ${theme.border}`,
        boxShadow: `0 0 32px ${theme.glow}, inset 0 0 60px ${theme.shine}`,
        fontFamily: "'Arial', sans-serif",
        color: theme.textMain,
        overflow: 'hidden',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Diagonal shine overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)',
      }} />

      {/* Academy header bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '10px 14px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.4)',
        borderBottom: `1px solid ${theme.border}44`,
      }}>
        {/* Academy logo */}
        <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {data.academyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.academyLogoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          ) : (
            <span style={{ fontSize: 18 }}>⚽</span>
          )}
        </div>
        {/* Academy name */}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: theme.textTop, letterSpacing: 1, textTransform: 'uppercase', padding: '0 8px' }}>
          {data.academyName}
        </div>
        {/* Tier badge */}
        <div style={{ fontSize: 9, fontWeight: 900, color: theme.border, border: `1px solid ${theme.border}`, borderRadius: 4, padding: '2px 5px', letterSpacing: 1 }}>
          {theme.label}
        </div>
      </div>

      {/* Overall + Position block — top left */}
      <div style={{
        position: 'absolute', top: 60, left: 18,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: theme.textTop, textShadow: `0 0 20px ${theme.glow}` }}>
          {overall}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: theme.textTop, marginTop: 2 }}>
          {posShort(data.position)}
        </div>
      </div>

      {/* Player photo — center */}
      <div style={{
        position: 'absolute', top: 48, left: '50%', transform: 'translateX(-30%)',
        width: 190, height: 210,
        overflow: 'hidden',
      }}>
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photoUrl}
            alt={data.playerName}
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        ) : (
          /* silhouette placeholder */
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 72, opacity: 0.3,
          }}>
            👤
          </div>
        )}
        {/* Bottom fade on photo */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: `linear-gradient(transparent, ${overall >= 80 ? '#3d2e00' : overall >= 70 ? '#3a3a3a' : '#3d2000'})`,
        }} />
      </div>

      {/* Player name */}
      <div style={{
        position: 'absolute', bottom: 128, left: 0, right: 0,
        textAlign: 'center',
        fontSize: 20, fontWeight: 900,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: theme.textMain,
        textShadow: `0 2px 8px rgba(0,0,0,0.8)`,
        padding: '0 16px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {data.playerName}
      </div>

      {/* Divider */}
      <div style={{
        position: 'absolute', bottom: 118, left: 24, right: 24,
        height: 1, background: `${theme.border}66`,
      }} />

      {/* Stats bar */}
      <div style={{
        position: 'absolute', bottom: 52, left: 14, right: 14,
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 4,
        background: theme.statBg,
        borderRadius: 10,
        padding: '8px 6px',
        border: `1px solid ${theme.border}33`,
      }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: theme.textTop, lineHeight: 1 }}>
              {scale(value)}
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, color: theme.textTop, opacity: 0.75, letterSpacing: 0.5 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: Created by + date */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '6px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.5)',
        borderTop: `1px solid ${theme.border}33`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Platform logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={16} height={16} style={{ opacity: 0.85 }} />
          <span style={{ fontSize: 9, color: theme.textTop, opacity: 0.8 }}>أكاديمتنا</span>
        </div>
        <div style={{ fontSize: 9, color: theme.textTop, opacity: 0.6 }}>
          {todayStr()}
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
      a.download = `${safeName}_FIFA_CARD.png`;
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
      {/* The card itself */}
      <FifaCardInner data={data} cardRef={cardRef} />

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-green-900/30"
      >
        {downloading ? (
          <>
            <span className="animate-spin">⏳</span>
            جاري التصدير...
          </>
        ) : (
          <>
            ⬇️ حفظ البطاقة
          </>
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
      {/* Trigger button */}
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl text-sm transition shadow-md">
            🃏 بطاقتي
          </button>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-gray-900 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full">
            {/* Header */}
            <div className="flex items-center justify-between w-full">
              <h2 className="text-white font-bold text-lg">بطاقة اللاعب</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Card + download */}
            <FifaCard data={data} />
          </div>
        </div>
      )}
    </>
  );
}
