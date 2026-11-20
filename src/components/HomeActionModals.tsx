import React from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  Gift,
  Lock,
  MessageSquareHeart,
  Shield,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { SIGN_IN_CALENDAR } from '../data/gameSeed';
import { formatGoldOrDiamond, formatPowerCompact, getHeroEffectivePower } from '../utils/gameLogic';
import { DiamondGemIcon, GoldCoinIcon, RarityTag } from './RpgIcons';

const SHOP_ITEMS = [
  {
    id: 'shop-stones',
    name: 'Ascension Stone',
    description: 'Essential star-ascension crystal (Pack of 5).',
    costType: 'gold' as const,
    cost: 4500,
    rewardItemId: 'ascension-stone',
    quantity: 5,
  },
  {
    id: 'shop-scrolls',
    name: 'Martial Scroll',
    description: 'Combat experience manual (Pack of 4).',
    costType: 'gold' as const,
    cost: 2800,
    rewardItemId: 'exp-scroll',
    quantity: 4,
  },
  {
    id: 'shop-vegeta-shard',
    name: 'Prince Vegeta Shard',
    description: 'UR Saiyan Tactician awakening fragment (x5).',
    costType: 'diamonds' as const,
    cost: 120,
    rewardItemId: 'shard-vegeta',
    quantity: 5,
  },
];

export const HomeActionModals: React.FC = () => {
  const {
    state,
    activeModal,
    closeModal,
    claimSignIn,
    claimBenefit,
    buyShopItem,
    starUpHeroAction,
    setActiveTab,
  } = useGame();

  if (!activeModal || activeModal === 'profile') return null;

  const modalTitleMap = {
    signin: { title: '7-Day Sign In', icon: CalendarCheck2 },
    benefits: { title: 'Benefit Events', icon: Gift },
    community: { title: 'Sanctuary Community', icon: MessageSquareHeart },
    shop: { title: 'Sanctuary Supply Shop', icon: ShoppingBag },
    legion: { title: 'Legion Hall', icon: Shield },
    starup: { title: 'Quick Star Up', icon: Star },
  } as const;

  const meta = modalTitleMap[activeModal];
  const HeaderIcon = meta.icon;
  const stones = state.bag.find((b) => b.id === 'ascension-stone')?.quantity ?? 0;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-action-modal-title"
    >
      <div className="relative w-full max-h-[84dvh] flex flex-col rounded-2xl bg-gradient-to-b from-[#132347] to-[#0B152C] border-2 border-amber-400/70 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1A3161] via-[#1E3A73] to-[#1A3161] border-b border-amber-400/40 shrink-0">
          <div className="flex items-center gap-2">
            <HeaderIcon className="w-5 h-5 text-amber-300" aria-hidden="true" />
            <h2
              id="home-action-modal-title"
              className="font-display font-extrabold text-base text-amber-100"
            >
              {meta.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label={`Close ${meta.title}`}
            className="w-9 h-9 min-h-[40px] min-w-[40px] rounded-xl bg-slate-900/70 border border-slate-500/50 text-slate-200 hover:text-white hover:border-amber-300 flex items-center justify-center transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto rpg-scroll p-3.5 space-y-3">
          {activeModal === 'signin' && (
            <>
              <p className="text-xs text-sky-100/90">
                Check in daily to gather Diamonds, Gold, and Ascension Stones for your martial squad.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SIGN_IN_CALENDAR.map((entry) => {
                  const isClaimed = state.signIn.claimedDays.includes(entry.day);
                  const isAvailable = entry.day <= state.signIn.currentDay && !isClaimed;
                  const isLocked = entry.day > state.signIn.currentDay;

                  return (
                    <button
                      key={entry.day}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => claimSignIn(entry.day)}
                      className={`flex flex-col items-center justify-between p-2.5 rounded-xl border min-h-[86px] text-center transition-all ${
                        entry.day === 7 ? 'col-span-3 flex-row justify-between px-4 min-h-[60px]' : ''
                      } ${
                        isClaimed
                          ? 'bg-emerald-950/60 border-emerald-400/50 text-emerald-200'
                          : isAvailable
                          ? 'bg-gradient-to-b from-amber-400/25 to-amber-600/20 border-amber-300 text-white shadow-[0_0_15px_rgba(251,191,36,0.25)] active:scale-95'
                          : 'bg-slate-950/65 border-slate-700/70 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-[10px] font-display font-extrabold text-amber-200">
                        Day {entry.day}
                      </span>
                      <span className="text-[11px] font-display font-bold leading-tight my-1">
                        {entry.rewardLabel}
                      </span>
                      <span className="text-[10px] font-display font-bold">
                        {isClaimed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                          </span>
                        ) : isAvailable ? (
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                            Claim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Lock className="w-3 h-3" /> Day {entry.day}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {activeModal === 'benefits' && (
            <div className="space-y-2.5">
              {[
                {
                  id: 'newcomer-pack',
                  title: 'Newcomer Sanctuary Gift',
                  subtitle: 'Instant starter boost for Server S1 explorers.',
                  diamonds: 100,
                  gold: 5000,
                  eligible: true,
                },
                {
                  id: 'story-1-5',
                  title: 'Main Story 1-5 Milestone',
                  subtitle: `Cleared ${state.stageProgress.completedStages.length}/5 initial coastal stages.`,
                  diamonds: 120,
                  gold: 8000,
                  eligible: state.stageProgress.completedStages.length >= 5,
                },
              ].map((b) => {
                const claimed = state.claimedBenefits.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/65 border border-sky-400/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-sm text-white">{b.title}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{b.subtitle}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-display font-bold tabular-nums">
                        <span className="inline-flex items-center gap-1 text-cyan-200">
                          <DiamondGemIcon className="w-3.5 h-3.5" /> +{b.diamonds}
                        </span>
                        <span className="inline-flex items-center gap-1 text-amber-200">
                          <GoldCoinIcon className="w-3.5 h-3.5" /> +{formatGoldOrDiamond(b.gold)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={claimed || !b.eligible}
                      onClick={() => claimBenefit(b.id, b.diamonds, b.gold)}
                      className={`shrink-0 min-h-[40px] px-3.5 rounded-xl font-display font-extrabold text-xs transition-all ${
                        claimed
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                          : 'bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 active:scale-95'
                      }`}
                    >
                      {claimed ? 'Claimed' : 'Claim'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeModal === 'shop' && (
            <div className="space-y-2.5">
              {SHOP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/65 border border-amber-400/25"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-sm text-white">
                      {item.name} <span className="text-amber-300">x{item.quantity}</span>
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => buyShopItem(item)}
                    className="shrink-0 min-h-[40px] px-3 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 font-display font-extrabold text-xs flex items-center gap-1 active:scale-95 tabular-nums"
                  >
                    {item.costType === 'gold' ? (
                      <GoldCoinIcon className="w-3.5 h-3.5" />
                    ) : (
                      <DiamondGemIcon className="w-3.5 h-3.5" />
                    )}
                    <span>{formatGoldOrDiamond(item.cost)}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeModal === 'starup' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/70 border border-amber-400/30 text-xs">
                <span className="text-slate-200 font-medium">Ascension Stones Owned</span>
                <span className="font-display font-extrabold text-amber-300 tabular-nums">
                  {stones} Stones (5 / Star Up)
                </span>
              </div>
              {state.heroes
                .filter((h) => h.unlocked)
                .map((hero) => (
                  <div
                    key={hero.id}
                    className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80"
                  >
                    <img
                      src={hero.image}
                      alt={hero.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover object-top border border-amber-300/60 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-xs text-white truncate">
                          {hero.name}
                        </span>
                        <RarityTag rarity={hero.rarity} />
                      </div>
                      <p className="text-[11px] text-amber-300 tabular-nums mt-0.5">
                        {'★'.repeat(hero.stars)}
                        {'☆'.repeat(hero.maxStars - hero.stars)} · Power{' '}
                        {formatPowerCompact(getHeroEffectivePower(hero))}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={stones < 5 || hero.stars >= hero.maxStars}
                      onClick={() => starUpHeroAction(hero.id)}
                      className="shrink-0 min-h-[40px] px-3 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 font-display font-extrabold text-xs disabled:opacity-45 active:scale-95"
                    >
                      {hero.stars >= hero.maxStars ? 'Max' : 'Star Up'}
                    </button>
                  </div>
                ))}
            </div>
          )}

          {activeModal === 'legion' && (
            <div className="space-y-3 text-xs text-slate-200">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-400/35 space-y-1">
                <p className="font-display font-extrabold text-sm text-cyan-200">
                  Z-Fighters Dojo · Lv.1 Legion
                </p>
                <p className="text-slate-300">
                  Server {state.player.server} · Members 14/30 · Weekly Trial Raid unlocks in Phase 2.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  setActiveTab('adventure');
                }}
                className="w-full min-h-[44px] rounded-xl bg-gradient-to-b from-sky-400 to-blue-600 border border-sky-200/70 text-white font-display font-bold text-xs active:scale-95"
              >
                Go to Adventure Map
              </button>
            </div>
          )}

          {activeModal === 'community' && (
            <div className="space-y-2.5 text-xs text-slate-200">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-400/35 space-y-1">
                <p className="font-display font-bold text-emerald-200">Server S1 Notice Board</p>
                <p className="text-slate-300 leading-relaxed">
                  Coastal Sanctuary Server S1 is live! Customize your Character Profile, claim daily Sign-In gifts, summon warriors in Divination, conquer 10 Adventure modes, and upgrade your squad.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
