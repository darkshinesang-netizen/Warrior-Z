import React, { useEffect, useState } from 'react';
import {
  CalendarCheck2,
  Gift,
  Megaphone,
  MessageSquareHeart,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ASSETS, SYSTEM_TICKER_MESSAGES } from '../data/gameSeed';
import { formatPowerCompact, getHeroEffectivePower } from '../utils/gameLogic';
import { HomeModalId, PrimaryTab } from '../types/game';
import { ElementBadge, RarityTag } from './RpgIcons';
import { soundFx } from '../utils/soundFx';

interface FloatingActionItem {
  id: 'benefits' | 'signin' | 'community' | 'shop' | 'summon' | 'legion' | 'starup';
  label: string;
  icon: React.FC<{ className?: string }>;
  accent: string;
  hasDot?: boolean;
  targetTab?: PrimaryTab;
  targetModal?: Exclude<HomeModalId, null>;
}

export const HomeScreen: React.FC = () => {
  const { state, featuredHero, openModal, setActiveTab } = useGame();
  const [tickerIdx, setTickerIdx] = useState(0);
  const [showSpeech, setShowSpeech] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % SYSTEM_TICKER_MESSAGES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const signInPending = !state.signIn.claimedDays.includes(state.signIn.currentDay);
  const benefitsPending = !state.claimedBenefits.includes('newcomer-pack');
  const stones = state.bag.find((b) => b.id === 'ascension-stone')?.quantity ?? 0;

  const leftActions: FloatingActionItem[] = [
    {
      id: 'benefits',
      label: 'Benefit Events',
      icon: Gift,
      accent: 'from-rose-500 to-amber-500 border-amber-200/80',
      hasDot: benefitsPending,
      targetModal: 'benefits',
    },
    {
      id: 'signin',
      label: 'Sign In',
      icon: CalendarCheck2,
      accent: 'from-sky-500 to-blue-700 border-sky-200/80',
      hasDot: signInPending,
      targetModal: 'signin',
    },
    {
      id: 'community',
      label: 'Community',
      icon: MessageSquareHeart,
      accent: 'from-emerald-500 to-teal-700 border-emerald-200/80',
      targetModal: 'community',
    },
  ];

  const rightActions: FloatingActionItem[] = [
    {
      id: 'shop',
      label: 'Shop',
      icon: ShoppingBag,
      accent: 'from-amber-500 to-orange-700 border-amber-200/80',
      targetModal: 'shop',
    },
    {
      id: 'summon',
      label: 'Summon',
      icon: Sparkles,
      accent: 'from-violet-500 to-purple-800 border-violet-200/80',
      hasDot:
        state.divination.freeDailyAvailable ||
        (state.bag.find((b) => b.id === 'divination-ticket')?.quantity ?? 0) > 0 ||
        state.player.diamonds >= 150,
      targetTab: 'summon',
    },
    {
      id: 'legion',
      label: 'Legion',
      icon: Shield,
      accent: 'from-cyan-500 to-indigo-700 border-cyan-200/80',
      targetModal: 'legion',
    },
    {
      id: 'starup',
      label: 'Star Up',
      icon: Star,
      accent: 'from-yellow-400 to-amber-600 border-yellow-100/90',
      hasDot: stones >= 5,
      targetModal: 'starup',
    },
  ];

  const handleTapHero = () => {
    soundFx.playClick(state.player.audio.sfx);
    setShowSpeech((prev) => !prev);
  };

  const renderFloatingButton = (item: FloatingActionItem) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          if (item.targetTab) {
            setActiveTab(item.targetTab);
          } else if (item.targetModal) {
            openModal(item.targetModal);
          }
        }}
        aria-label={item.label}
        className="group relative flex flex-col items-center w-[62px] min-h-[58px] transition-transform duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-amber-300"
      >
        <div
          className={`relative w-11 h-11 rounded-2xl bg-gradient-to-b ${item.accent} border-2 flex items-center justify-center shadow-[0_4px_12px_rgba(2,6,23,0.65)] group-hover:brightness-110 transition-all`}
        >
          <Icon className="w-5 h-5 text-white drop-shadow" />
          {item.hasDot && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow"
              aria-hidden="true"
            />
          )}
        </div>
        <span className="mt-1 px-1.5 py-[1px] rounded bg-slate-950/85 border border-amber-300/35 text-[9.5px] font-display font-bold text-amber-50 leading-tight text-center shadow whitespace-nowrap">
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <section
      className="relative flex-1 overflow-hidden flex flex-col justify-between select-none"
      aria-label="Sanctuary Home Screen"
    >
      {/* Full-Height Scenic Coastal / Sky Anime Backdrop */}
      <img
        src={ASSETS.homeCoastalBg}
        alt="Coastal martial arts sanctuary island"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />
      {/* Subtle atmospheric top/bottom depth vignette for UI readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-950/25 via-transparent to-slate-950/75 pointer-events-none" />

      {/* Main Stage Grid: Left Floating Icons | Hero Centerpiece | Right Floating Icons */}
      <div className="relative z-10 flex-1 flex items-stretch justify-between px-2.5 pt-4 pb-2">
        {/* Left Floating Action Column */}
        <div className="flex flex-col gap-3 z-20">
          {leftActions.map(renderFloatingButton)}
        </div>

        {/* Center Featured Hero with Idle Breathing Animation */}
        <div className="relative flex-1 flex flex-col items-center justify-end pb-4 px-1">
          {/* Interactive Hero Speech Bubble */}
          {showSpeech && (
            <div
              role="status"
              className="absolute top-3 z-30 max-w-[215px] px-3 py-2 rounded-xl bg-slate-950/90 border border-amber-300/60 text-[11px] font-medium text-amber-50 text-center shadow-xl"
            >
              “{featuredHero.quote}”
            </div>
          )}

          {/* Soft golden ki ground aura */}
          <div className="relative flex flex-col items-center justify-end">
            <div
              className="absolute -bottom-2 w-48 h-11 rounded-full bg-amber-400/45 blur-md animate-aura-pulse pointer-events-none"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={handleTapHero}
              aria-label={`Interact with featured hero ${featuredHero.name}`}
              className="relative group focus-visible:outline-2 focus-visible:outline-amber-300 rounded-[110px]"
            >
              {/* Softly Arch-Framed Hero Sanctuary Spotlight with Idle Breathing */}
              <div className="animate-idle-breathe relative w-[212px] h-[306px] sm:w-[224px] sm:h-[322px] rounded-t-[112px] rounded-b-[32px] overflow-hidden border-2 border-amber-300/85 shadow-[0_16px_38px_rgba(2,6,23,0.72),0_0_24px_rgba(251,191,36,0.22)] bg-sky-900/30">
                <img
                  src={featuredHero.image}
                  alt={`${featuredHero.name} ready stance`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
                {/* Soft bottom nameplate scrim */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-transparent pointer-events-none" />

                {/* Hero Pedestal Plate */}
                <div className="absolute inset-x-2.5 bottom-2.5 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <RarityTag rarity={featuredHero.rarity} />
                    <ElementBadge element={featuredHero.element} size="sm" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-extrabold text-sm text-white tracking-tight drop-shadow">
                      {featuredHero.name}
                    </span>
                    <span className="text-[11px] font-display font-bold text-amber-300 tabular-nums">
                      Lv.{featuredHero.level}
                    </span>
                  </div>
                  <span className="text-[10px] font-display font-semibold text-sky-200 tabular-nums">
                    Power {formatPowerCompact(getHeroEffectivePower(featuredHero))} · Tap to Talk
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Floating Action Column */}
        <div className="flex flex-col gap-3 z-20">
          {rightActions.map(renderFloatingButton)}
        </div>
      </div>

      {/* Bottom System Ticker directly above Bottom Nav */}
      <div className="relative z-20 mx-2.5 mb-2 px-2.5 py-1.5 rounded-lg bg-slate-950/85 border border-sky-400/35 flex items-center gap-2 shadow-lg">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-400/20 border border-amber-300/50 text-amber-300 shrink-0">
          <Megaphone className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
        <p className="text-[11px] font-medium text-sky-100 truncate flex-1">
          {SYSTEM_TICKER_MESSAGES[tickerIdx]}
        </p>
      </div>
    </section>
  );
};
