import React from 'react';
import { ElementType, Rarity } from '../types/game';

export const GoldCoinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10.5" fill="#92400E" />
    <circle cx="12" cy="12" r="9" fill="url(#goldCoinGrad)" stroke="#FEF08A" strokeWidth="1.2" />
    <circle cx="12" cy="12" r="6" fill="none" stroke="#B45309" strokeWidth="1.2" strokeDasharray="2 1.5" />
    <path d="M12 7.5v9M9.5 10.2c0-1.1 1.1-1.8 2.5-1.8s2.5.7 2.5 1.8c0 1.4-2.5 1.5-2.5 2.7 0 .9 1 1.4 2.5 1.4" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <defs>
      <linearGradient id="goldCoinGrad" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
  </svg>
);

export const DiamondGemIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <polygon points="6,4 18,4 22,10 12,21 2,10" fill="#0E7490" stroke="#A5F3FC" strokeWidth="1.2" strokeLinejoin="round" />
    <polygon points="6,4 18,4 15.5,10 8.5,10" fill="#67E8F9" />
    <polygon points="8.5,10 15.5,10 12,21" fill="#22D3EE" />
    <polygon points="2,10 8.5,10 12,21" fill="#06B6D4" />
    <polygon points="15.5,10 22,10 12,21" fill="#0891B2" />
  </svg>
);

export const PowerEmblemIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M13.5 2L5 13h6l-1.5 9L19 11h-6l.5-9z" fill="#FBBF24" stroke="#78350F" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const ELEMENT_META: Record<
  ElementType,
  { bg: string; border: string; text: string; label: string; glyph: string }
> = {
  STR: {
    bg: 'from-rose-600 to-red-800',
    border: 'border-rose-300/70',
    text: 'text-rose-50',
    label: 'STR',
    glyph: 'M12 3c2.8 3.2 4.5 6 4.5 9a4.5 4.5 0 1 1-9 0c0-1.8.8-3.4 1.8-4.7.2 1.4 1 2.2 1.8 2.4-.3-2.4.2-4.6.9-6.7Z',
  },
  PHY: {
    bg: 'from-emerald-500 to-teal-800',
    border: 'border-emerald-300/70',
    text: 'text-emerald-50',
    label: 'PHY',
    glyph: 'M12 4l6 4v5c0 4-2.6 6.8-6 8-3.4-1.2-6-4-6-8V8l6-4Z',
  },
  INT: {
    bg: 'from-sky-500 to-indigo-800',
    border: 'border-sky-300/70',
    text: 'text-sky-50',
    label: 'INT',
    glyph: 'M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3Z',
  },
  S: {
    bg: 'from-amber-400 to-orange-700',
    border: 'border-amber-200/80',
    text: 'text-amber-50',
    label: 'S',
    glyph: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
  },
  UL: {
    bg: 'from-violet-600 to-purple-950',
    border: 'border-violet-300/80',
    text: 'text-violet-50',
    label: 'UL',
    glyph: 'M13 2L4 14h7l-1 8 10-12h-7l0-8Z',
  },
};

export const ElementBadge: React.FC<{ element: ElementType; size?: 'sm' | 'md' }> = ({
  element,
  size = 'sm',
}) => {
  const meta = ELEMENT_META[element];
  const dim = size === 'sm' ? 'h-5 px-1.5 text-[10px] gap-1' : 'h-6 px-2 text-xs gap-1';

  return (
    <span
      className={`inline-flex items-center rounded border bg-gradient-to-b ${meta.bg} ${meta.border} ${meta.text} font-display font-extrabold tracking-tight shadow-sm ${dim}`}
    >
      <svg viewBox="0 0 24 24" className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="currentColor" aria-hidden="true">
        <path d={meta.glyph} />
      </svg>
      <span>{meta.label}</span>
    </span>
  );
};

const RARITY_STYLES: Record<Rarity, string> = {
  UR: 'from-rose-500 via-amber-400 to-violet-600 text-white border-amber-200 shadow-amber-500/30',
  SSR: 'from-amber-400 to-orange-600 text-slate-950 border-amber-200 shadow-amber-500/20',
  SR: 'from-violet-500 to-indigo-700 text-violet-50 border-violet-300/80 shadow-violet-500/20',
  R: 'from-sky-500 to-blue-700 text-sky-50 border-sky-300/70',
  N: 'from-slate-500 to-slate-700 text-slate-100 border-slate-300/60',
};

export const RarityTag: React.FC<{ rarity: Rarity }> = ({ rarity }) => (
  <span
    className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-display font-black tracking-wider border bg-gradient-to-b shadow-sm ${RARITY_STYLES[rarity]}`}
  >
    {rarity}
  </span>
);

export const AvatarWithFrame: React.FC<{
  image: string;
  alt: string;
  frameId: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ image, alt, frameId, size = 'sm' }) => {
  const dims =
    size === 'sm' ? 'w-11 h-11' : size === 'md' ? 'w-14 h-14' : 'w-20 h-20';
  const isChamp = frameId === 'championship';

  return (
    <div className={`relative shrink-0 ${dims}`}>
      {/* Ornate Championship Wings & Crown */}
      {isChamp && (
        <svg
          viewBox="0 0 80 80"
          className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none z-10"
          aria-hidden="true"
        >
          <path
            d="M40 3l5 7h-10l5-7zM10 26l-7-4 5 11-5 6 7 3M70 26l7-4-5 11 5 6-7 3"
            fill="#FBBF24"
            stroke="#78350F"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <rect
            x="9"
            y="9"
            width="62"
            height="62"
            rx="12"
            fill="none"
            stroke="url(#champGoldGrad)"
            strokeWidth="4.5"
          />
          <defs>
            <linearGradient id="champGoldGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
        </svg>
      )}
      <div
        className={`w-full h-full overflow-hidden rounded-xl bg-slate-800 ${
          isChamp
            ? 'border-2 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.55)]'
            : 'border-2 border-sky-300/80 shadow-[0_2px_8px_rgba(14,165,233,0.35)]'
        }`}
      >
        <img
          src={image}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top"
        />
      </div>
    </div>
  );
};
