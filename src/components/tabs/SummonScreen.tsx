import React, { useState } from 'react';
import {
  Award,
  Check,
  Crown,
  Eye,
  Flame,
  Gift,
  Info,
  Lock,
  Sparkles,
  Star,
  Ticket,
  X,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { DIVINATION_MILESTONES, DIVINATION_RATES } from '../../data/phase3Data';
import { DivinationPullEntry, Hero, Rarity } from '../../types/game';
import { formatGoldOrDiamond } from '../../utils/gameLogic';
import { DiamondGemIcon, ElementBadge, RarityTag } from '../RpgIcons';

type SummonSubModal =
  | null
  | 'prize-pool'
  | 'build'
  | 'hero-wish'
  | 'milestones'
  | 'simulator-info';

const RARITY_GLOW: Record<Rarity, string> = {
  UR: 'border-amber-300 bg-gradient-to-b from-rose-950/90 via-amber-950/70 to-violet-950 shadow-[0_0_18px_rgba(251,191,36,0.65)]',
  SSR: 'border-amber-400 bg-gradient-to-b from-amber-950/85 to-slate-950 shadow-[0_0_14px_rgba(245,158,11,0.45)]',
  SR: 'border-violet-400 bg-gradient-to-b from-violet-950/80 to-slate-950 shadow-[0_0_10px_rgba(139,92,246,0.35)]',
  R: 'border-sky-400/75 bg-slate-900/90',
  N: 'border-slate-600 bg-slate-950/90',
};

export const SummonScreen: React.FC = () => {
  const {
    state,
    summonDivinationBatch,
    setDivinationWishHero,
    toggleDivinationAutoDismantle,
    toggleDivinationSkipAnimation,
    claimDivinationMilestoneAction,
  } = useGame();

  const [subModal, setSubModal] = useState<SummonSubModal>(null);
  const [summonAnimActive, setSummonAnimActive] = useState(false);
  const [summonResult, setSummonResult] = useState<{
    pulls: DivinationPullEntry[];
    usedCurrencyLabel: string;
  } | null>(null);

  const { divination, heroes, player, bag } = state;
  const ticketQty = bag.find((b) => b.id === 'divination-ticket')?.quantity ?? 0;
  const wishUnlocked = divination.totalDraws >= 200;
  const featuredHero = heroes.find((h) => h.id === 'prince-vegeta') ?? heroes[0];
  const floatingShowcase = [
    heroes.find((h) => h.id === 'prince-vegeta'),
    heroes.find((h) => h.id === 'small-goku'),
    heroes.find((h) => h.id === 'piccolo-sage'),
    heroes.find((h) => h.id === 'master-roshi'),
  ].filter((h): h is Hero => Boolean(h));

  const claimableMilestoneCount = DIVINATION_MILESTONES.filter(
    (m) => divination.totalDraws >= m.draws && !divination.claimedMilestones.includes(m.draws)
  ).length;

  const handleSummon = (count: 1 | 10) => {
    const res = summonDivinationBatch(count);
    if (!res.success) return;

    if (divination.skipAnimation) {
      setSummonResult({
        pulls: res.pulls,
        usedCurrencyLabel: res.usedCurrencyLabel,
      });
    } else {
      setSummonAnimActive(true);
      window.setTimeout(() => {
        setSummonAnimActive(false);
        setSummonResult({
          pulls: res.pulls,
          usedCurrencyLabel: res.usedCurrencyLabel,
        });
      }, 480);
    }
  };

  return (
    <section
      className="relative flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#160F33] via-[#0B112B] to-[#060916]"
      aria-labelledby="summon-screen-title"
    >
      {/* Top Bar: Pity Counter, VIP & Balances */}
      <header className="shrink-0 px-3 pt-2.5 pb-2 bg-slate-950/90 border-b border-amber-400/45 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            <div className="min-w-0">
              <h1
                id="summon-screen-title"
                className="font-display font-extrabold text-sm text-amber-100 leading-tight truncate"
              >
                Summon · Divination Shrine
              </h1>
              <p className="text-[10px] text-violet-200/90 tabular-nums">
                Guaranteed SSR/UR Pity:{' '}
                <span className="font-bold text-amber-300">{divination.pityCount}/1000</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-display font-black text-[10px] tabular-nums">
              VIP {player.vipLevel} / 14
            </span>
          </div>
        </div>

        {/* Resource Strip & Draws Counter */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-display font-bold tabular-nums">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-cyan-400/40 text-cyan-200">
              <DiamondGemIcon className="w-3.5 h-3.5" />
              {formatGoldOrDiamond(player.diamonds)}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-violet-400/40 text-violet-200">
              <Ticket className="w-3.5 h-3.5 text-amber-300" />
              {ticketQty} Tickets
            </span>
          </div>
          <span className="text-[10.5px] text-amber-200">
            Draws: <span className="font-black text-white">{divination.totalDraws}</span>
          </span>
        </div>
      </header>

      {/* Main Center Stage with Left & Right Side Panels */}
      <div className="relative flex-1 min-h-0 flex items-stretch justify-between px-2.5 py-3 overflow-hidden">
        {/* Radial Starfield Glow */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(245,158,11,0.22),rgba(139,92,246,0.12)_38%,transparent_70%)]"
          aria-hidden="true"
        />

        {/* Left Side Panel */}
        <div className="relative z-20 flex flex-col justify-center gap-2 w-[78px] shrink-0">
          <button
            type="button"
            onClick={() => setSubModal('prize-pool')}
            className="flex flex-col items-center justify-center p-1.5 min-h-[54px] rounded-xl bg-slate-950/85 border border-sky-400/50 text-sky-100 hover:border-amber-300 active:scale-95"
          >
            <Eye className="w-4 h-4 text-sky-300 mb-0.5" />
            <span className="text-[9.5px] font-display font-bold leading-tight text-center">
              Prize Pool
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubModal('build')}
            className="flex flex-col items-center justify-center p-1.5 min-h-[54px] rounded-xl bg-slate-950/85 border border-rose-400/50 text-rose-100 hover:border-amber-300 active:scale-95"
          >
            <Crown className="w-4 h-4 text-amber-300 mb-0.5" />
            <span className="text-[9.5px] font-display font-bold leading-tight text-center">
              Build
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubModal('hero-wish')}
            className="relative flex flex-col items-center justify-center p-1.5 min-h-[58px] rounded-xl bg-slate-950/85 border border-violet-400/55 text-violet-100 hover:border-amber-300 active:scale-95"
          >
            <Star className="w-4 h-4 text-violet-300 mb-0.5" />
            <span className="text-[9.5px] font-display font-bold leading-tight text-center">
              Hero Wish
            </span>
            <span className="text-[8.5px] text-amber-300 font-bold tabular-nums">
              {wishUnlocked ? 'Active' : `${divination.totalDraws}/200`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubModal('milestones')}
            className="relative flex flex-col items-center justify-center p-1.5 min-h-[54px] rounded-xl bg-slate-950/85 border border-amber-400/55 text-amber-100 hover:border-amber-200 active:scale-95"
          >
            <Gift className="w-4 h-4 text-amber-300 mb-0.5" />
            <span className="text-[9.5px] font-display font-bold leading-tight text-center">
              Milestones
            </span>
            {claimableMilestoneCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border border-white text-[8px] font-black text-white flex items-center justify-center"
                aria-hidden="true"
              >
                {claimableMilestoneCount}
              </span>
            )}
          </button>
        </div>

        {/* Centerpiece: Glowing Golden Summoning Core + Floating Cards */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-1">
          {/* Top Featured Rate-Up Badge */}
          <div className="mb-2 px-2.5 py-0.5 rounded-lg bg-slate-950/85 border border-amber-300/60 text-[10px] font-display font-extrabold text-amber-200 text-center">
            UR Spotlight · {featuredHero.name}
          </div>

          <div className="relative w-[196px] h-[230px] flex items-center justify-center">
            {/* Orbiting Floating Fighter Cards */}
            {floatingShowcase.map((hero, idx) => {
              const posClass =
                idx === 0
                  ? 'top-0 left-1 -rotate-6'
                  : idx === 1
                  ? 'top-1 right-1 rotate-6'
                  : idx === 2
                  ? 'bottom-2 left-2 rotate-3'
                  : 'bottom-1 right-2 -rotate-3';
              return (
                <div
                  key={hero.id}
                  className={`animate-float-gentle absolute ${posClass} w-12 h-16 rounded-lg overflow-hidden border-2 ${
                    hero.rarity === 'UR' ? 'border-amber-300' : 'border-sky-300/80'
                  } shadow-lg bg-slate-900 z-10`}
                  style={{ animationDelay: `${idx * 0.45}s` }}
                >
                  <img
                    src={hero.image}
                    alt={hero.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-[7.5px] font-display font-black text-amber-200 text-center py-[1px]">
                    {hero.rarity}
                  </span>
                </div>
              );
            })}

            {/* Glowing Golden Energy Orb Core */}
            <div
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-300 ${
                summonAnimActive ? 'scale-125 brightness-150' : 'scale-100'
              }`}
            >
              <div className="absolute inset-0 rounded-full bg-amber-400/35 blur-xl animate-aura-pulse" />
              <div className="absolute inset-2 rounded-full border-2 border-amber-200/70 animate-[spin_10s_linear_infinite] border-dashed" />
              <div className="relative w-22 h-22 rounded-full bg-[radial-gradient(circle_at_35%_35%,#FEF08A,#F59E0B_55%,#B45309)] border-2 border-amber-100 shadow-[0_0_32px_rgba(251,191,36,0.85)] flex flex-col items-center justify-center">
                <Sparkles className="w-7 h-7 text-white drop-shadow" />
                <span className="font-display font-black text-[9px] text-amber-50 tracking-wider uppercase mt-0.5">
                  CORE
                </span>
              </div>
            </div>
          </div>

          <p className="mt-1 text-[10.5px] text-center text-violet-100/90 max-w-[205px] leading-snug">
            10x Summon guarantees <span className="text-amber-300 font-bold">SSR / UR</span> Warrior!
          </p>
        </div>

        {/* Right Side Panel */}
        <div className="relative z-20 flex flex-col justify-center gap-2 w-[78px] shrink-0">
          <button
            type="button"
            onClick={() => setSubModal('prize-pool')}
            className="flex flex-col items-center justify-center p-1.5 min-h-[54px] rounded-xl bg-slate-950/85 border border-amber-300/50 text-amber-100 hover:border-amber-200 active:scale-95"
          >
            <Flame className="w-4 h-4 text-orange-400 mb-0.5" />
            <span className="text-[9.5px] font-display font-bold leading-tight text-center">
              Lucky Draw
            </span>
          </button>

          <div
            className={`flex flex-col items-center justify-center p-1.5 min-h-[56px] rounded-xl border text-center ${
              divination.freeDailyAvailable
                ? 'bg-emerald-950/75 border-emerald-300 text-emerald-100'
                : 'bg-slate-950/85 border-slate-700 text-slate-400'
            }`}
          >
            <Award className="w-4 h-4 mb-0.5 text-emerald-300" />
            <span className="text-[9.5px] font-display font-bold leading-tight">
              Free Gacha
            </span>
            <span className="text-[8.5px] font-black text-emerald-300">
              {divination.freeDailyAvailable ? 'Available' : 'Claimed'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSubModal('simulator-info')}
            className="flex flex-col items-center justify-center p-1.5 min-h-[54px] rounded-xl bg-slate-950/85 border border-cyan-400/50 text-cyan-100 hover:border-amber-300 active:scale-95"
          >
            <Info className="w-4 h-4 text-cyan-300 mb-0.5" />
            <span className="text-[9.5px] font-display font-bold leading-tight text-center">
              Simulator Gin
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Summon Controls */}
      <div className="shrink-0 bg-slate-950/95 border-t border-amber-400/45 px-3 pt-2.5 pb-3 space-y-2.5">
        {/* Toggles: Auto Dismantle & Skip Animation */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <button
            type="button"
            role="switch"
            aria-checked={divination.autoDismantle}
            onClick={toggleDivinationAutoDismantle}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-display font-bold transition-colors ${
              divination.autoDismantle
                ? 'bg-amber-400/20 border-amber-300 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                divination.autoDismantle
                  ? 'bg-amber-400 border-amber-200 text-slate-950'
                  : 'border-slate-500'
              }`}
            >
              {divination.autoDismantle && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>Auto Dismantle</span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={divination.skipAnimation}
            onClick={toggleDivinationSkipAnimation}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-display font-bold transition-colors ${
              divination.skipAnimation
                ? 'bg-sky-400/20 border-sky-300 text-sky-200'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                divination.skipAnimation
                  ? 'bg-sky-400 border-sky-200 text-slate-950'
                  : 'border-slate-500'
              }`}
            >
              {divination.skipAnimation && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>Skip Animation</span>
          </button>
        </div>

        {/* Divination x1 & Divination x10 Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSummon(1)}
            className="relative min-h-[50px] px-3 py-1.5 rounded-xl bg-gradient-to-b from-sky-400 to-blue-700 border-2 border-sky-200/80 text-white flex flex-col items-center justify-center shadow-lg active:scale-95"
          >
            <span className="font-display font-black text-xs">Divination x1</span>
            {divination.freeDailyAvailable ? (
              <span className="text-[10px] font-display font-extrabold text-emerald-200">
                Free this time
              </span>
            ) : ticketQty >= 1 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold text-amber-200 tabular-nums">
                <Ticket className="w-3 h-3" /> 1 Ticket
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold text-cyan-100 tabular-nums">
                <DiamondGemIcon className="w-3 h-3" /> 150
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSummon(10)}
            className="relative min-h-[50px] px-3 py-1.5 rounded-xl bg-gradient-to-b from-amber-300 via-amber-400 to-orange-600 border-2 border-amber-100 text-slate-950 flex flex-col items-center justify-center shadow-[0_6px_18px_rgba(245,158,11,0.4)] active:scale-95"
          >
            <span className="font-display font-black text-xs">Divination x10</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-display font-extrabold text-slate-900 tabular-nums">
              <DiamondGemIcon className="w-3 h-3" /> 1,620
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Modals: Prize Pool / Build / Hero Wish / Milestones / Simulator Info */}
      {subModal && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summon-submodal-title"
        >
          <div className="w-full max-h-[78dvh] flex flex-col rounded-2xl bg-gradient-to-b from-[#172952] to-[#0B152C] border-2 border-amber-400/70 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/70 border-b border-amber-400/35">
              <h2
                id="summon-submodal-title"
                className="font-display font-extrabold text-sm text-amber-100"
              >
                {subModal === 'prize-pool'
                  ? 'Divination Prize Pool & Rates'
                  : subModal === 'build'
                  ? 'Featured UR Showcase'
                  : subModal === 'hero-wish'
                  ? 'Hero Wish Sanctuary'
                  : subModal === 'milestones'
                  ? 'Draw Milestone Rewards'
                  : 'Simulator Gin · Summon Rules'}
              </h2>
              <button
                type="button"
                onClick={() => setSubModal(null)}
                aria-label="Close panel"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rpg-scroll p-3 space-y-2.5 text-xs">
              {subModal === 'prize-pool' && (
                <>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {DIVINATION_RATES.map((r) => (
                      <div
                        key={r.rarity}
                        className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-700"
                      >
                        <RarityTag rarity={r.rarity} />
                        <p className="mt-1 font-display font-bold text-[10px] text-amber-200 tabular-nums">
                          {r.rateLabel}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {heroes.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-700/80"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={h.image}
                            alt={h.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover object-top border border-amber-300/60"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-display font-bold text-white">{h.name}</span>
                              <RarityTag rarity={h.rarity} />
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {h.heroClass} · {h.signatureSkill}
                            </p>
                          </div>
                        </div>
                        <ElementBadge element={h.element} size="sm" />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {subModal === 'build' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/75 border border-amber-300/60">
                    <img
                      src={featuredHero.image}
                      alt={featuredHero.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-24 rounded-xl object-cover object-top border-2 border-amber-300"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <RarityTag rarity={featuredHero.rarity} />
                        <ElementBadge element={featuredHero.element} size="sm" />
                      </div>
                      <p className="font-display font-extrabold text-base text-white">
                        {featuredHero.name}
                      </p>
                      <p className="text-[11px] text-amber-200">{featuredHero.title}</p>
                      <p className="text-[10.5px] text-slate-300 tabular-nums">
                        Base Power: {formatGoldOrDiamond(featuredHero.basePower)} · SPD {featuredHero.spd}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-violet-400/40 space-y-1">
                    <p className="font-display font-bold text-amber-200">
                      Ultimate: {featuredHero.signatureSkill}
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {featuredHero.skillDescription}
                    </p>
                  </div>
                </div>
              )}

              {subModal === 'hero-wish' && (
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-violet-400/45 flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-violet-100">
                        200 Draws Wish Unlock
                      </p>
                      <p className="text-[10.5px] text-slate-300">
                        {wishUnlocked
                          ? 'Unlocked! Wish hero receives elevated SSR/UR focus.'
                          : `Complete ${Math.max(0, 200 - divination.totalDraws)} more draws to activate Wish Focus.`}
                      </p>
                    </div>
                    {!wishUnlocked && <Lock className="w-4 h-4 text-amber-300 shrink-0" />}
                  </div>

                  <div className="space-y-1.5">
                    {heroes
                      .filter((h) => h.rarity === 'UR' || h.rarity === 'SSR')
                      .map((h) => {
                        const selected = divination.wishHeroId === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setDivinationWishHero(h.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl border text-left ${
                              selected
                                ? 'bg-amber-400/15 border-amber-300'
                                : 'bg-slate-950/70 border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={h.image}
                                alt={h.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-lg object-cover object-top"
                              />
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-display font-bold text-white">{h.name}</span>
                                  <RarityTag rarity={h.rarity} />
                                </div>
                                <span className="text-[10px] text-slate-400">{h.signatureSkill}</span>
                              </div>
                            </div>
                            {selected && (
                              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black">
                                Wished
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {subModal === 'milestones' && (
                <div className="space-y-2">
                  {DIVINATION_MILESTONES.map((m) => {
                    const reached = divination.totalDraws >= m.draws;
                    const claimed = divination.claimedMilestones.includes(m.draws);
                    return (
                      <div
                        key={m.draws}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/75 border border-amber-400/35"
                      >
                        <div>
                          <p className="font-display font-bold text-white">{m.label}</p>
                          <p className="text-[10.5px] text-amber-200 tabular-nums">
                            +{m.diamonds} Diamonds · +{m.ascensionStones} Ascension Stones
                          </p>
                          <p className="text-[10px] text-slate-400 tabular-nums">
                            Progress: {Math.min(divination.totalDraws, m.draws)}/{m.draws}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!reached || claimed}
                          onClick={() => claimDivinationMilestoneAction(m.draws)}
                          className={`min-h-[38px] px-3 rounded-xl font-display font-extrabold text-[11px] ${
                            claimed
                              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                              : reached
                              ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400 opacity-60'
                          }`}
                        >
                          {claimed ? 'Claimed' : reached ? 'Claim' : 'Locked'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {subModal === 'simulator-info' && (
                <div className="space-y-2 text-slate-200 leading-relaxed">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-400/35">
                    <p className="font-display font-bold text-cyan-200 mb-1">
                      Divination Guarantee Rules
                    </p>
                    <p className="text-[11px]">
                      • Every 10x Divination guarantees at least one <span className="text-amber-300 font-bold">SSR or UR</span> fighter.
                      <br />• Pity counter resets upon obtaining SSR/UR and guarantees SSR/UR by 1,000 draws.
                      <br />• Enabling <span className="text-amber-200 font-bold">Auto Dismantle</span> converts duplicate R/N draws directly into Ascension Stones.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summon Results Modal */}
      {summonResult && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/90 p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summon-result-title"
        >
          <div className="w-full max-h-[84dvh] flex flex-col rounded-2xl bg-gradient-to-b from-[#1C2A57] to-[#0B1226] border-2 border-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.4)] overflow-hidden">
            <div className="px-4 py-3 bg-slate-950/80 border-b border-amber-400/45 text-center">
              <h2
                id="summon-result-title"
                className="font-display font-black text-base text-amber-200 tracking-wide"
              >
                Divination Results ({summonResult.pulls.length}x)
              </h2>
              <p className="text-[10.5px] text-sky-200">{summonResult.usedCurrencyLabel}</p>
            </div>

            <div className="flex-1 overflow-y-auto rpg-scroll p-3">
              <div
                className={`grid gap-2 ${
                  summonResult.pulls.length === 1 ? 'grid-cols-1 max-w-[220px] mx-auto' : 'grid-cols-2'
                }`}
              >
                {summonResult.pulls.map((entry, idx) => (
                  <div
                    key={`${entry.hero.id}-${idx}`}
                    className={`relative flex items-center gap-2 p-2 rounded-xl border-2 ${
                      RARITY_GLOW[entry.hero.rarity]
                    }`}
                  >
                    <img
                      src={entry.hero.image}
                      alt={entry.hero.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-14 rounded-lg object-cover object-top border border-white/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <RarityTag rarity={entry.hero.rarity} />
                        <ElementBadge element={entry.hero.element} size="sm" />
                      </div>
                      <p className="font-display font-bold text-xs text-white truncate mt-1">
                        {entry.hero.name}
                      </p>
                      <p className="text-[9.5px] font-display font-bold text-amber-200">
                        {entry.wasNewUnlock
                          ? 'NEW Warrior Unlocked!'
                          : entry.dismantledStones
                          ? `Dismantled: +${entry.dismantledStones} Stones`
                          : `+${entry.convertedToShardQty ?? 8} Shards`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-950/85 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSummonResult(null)}
                className="w-full min-h-[44px] rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 font-display font-black text-sm active:scale-95"
              >
                Confirm & Collect
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
