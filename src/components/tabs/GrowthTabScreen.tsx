import React, { useMemo } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Flame,
  HeartHandshake,
  Sparkles,
  Star,
  Swords,
  Zap,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { calculateTeamAura } from '../../data/stagesData';
import { calculateFormationPower, getDeployedHeroes } from '../../utils/combatEngine';
import {
  formatGoldOrDiamond,
  formatPowerCompact,
  getActiveBonds,
  getHeroComputedStats,
  getResonanceBaselineLevel,
} from '../../utils/gameLogic';
import { ElementBadge, GoldCoinIcon, PowerEmblemIcon, RarityTag } from '../RpgIcons';

interface GrowthTabScreenProps {
  onInspectHero: (heroId: string) => void;
}

export const GrowthTabScreen: React.FC<GrowthTabScreenProps> = ({ onInspectHero }) => {
  const {
    state,
    teamPower,
    levelUpHero,
    starUpHeroAction,
    setActiveTab,
    openStoryMapInAdventure,
  } = useGame();

  const stonesQty = state.bag.find((b) => b.id === 'ascension-stone')?.quantity ?? 0;
  const scrollsQty = state.bag.find((b) => b.id === 'exp-scroll')?.quantity ?? 0;

  const unlockedHeroes = useMemo(
    () => state.heroes.filter((h) => h.unlocked),
    [state.heroes]
  );
  const activeBonds = useMemo(() => getActiveBonds(state.heroes), [state.heroes]);
  const resonanceLv = useMemo(
    () => getResonanceBaselineLevel(state.heroes),
    [state.heroes]
  );
  const deployed = useMemo(
    () => getDeployedHeroes(state.heroes, state.formation),
    [state.heroes, state.formation]
  );
  const aura = useMemo(() => calculateTeamAura(deployed), [deployed]);
  const formationPower = useMemo(
    () => calculateFormationPower(state.heroes, state.formation),
    [state.heroes, state.formation]
  );

  const readyToStarUp = unlockedHeroes.filter(
    (h) => stonesQty >= 5 && h.stars < h.maxStars
  ).length;

  return (
    <section className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0E1E3E] via-[#0B1730] to-[#081022]">
      {/* Header */}
      <div className="shrink-0 px-3 pt-2.5 pb-2 bg-[#0B162C]/95 border-b border-amber-400/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-300" />
          <h1 className="font-display font-extrabold text-sm text-white">
            Growth Progression Hub
          </h1>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-400/15 border border-amber-300/45 text-[10.5px] font-display font-extrabold text-amber-200 tabular-nums">
          {stonesQty} Stones · {scrollsQty} Scrolls
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto rpg-scroll p-3 space-y-3">
        {/* Team Power Breakdown Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#162B56] to-[#0B152C] border border-amber-400/50 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PowerEmblemIcon className="w-5 h-5" />
              <div>
                <p className="font-display font-extrabold text-xs text-amber-100">
                  Team Power Breakdown
                </p>
                <p className="text-[10px] text-sky-200/80">
                  Roster + Formation Aura + Bonds + Resonance
                </p>
              </div>
            </div>
            <span className="font-display font-black text-base text-amber-300 tabular-nums">
              {formatPowerCompact(teamPower)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] tabular-nums">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-sky-400/30">
              <span className="block text-slate-400">Formation</span>
              <span className="font-display font-extrabold text-sky-200">
                {formatPowerCompact(formationPower)}
              </span>
              <span className="block text-[9px] text-emerald-300">
                {aura.active ? `Aura +${aura.atkBonusPct}%` : 'No Aura'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/70 border border-cyan-400/30">
              <span className="block text-slate-400">Resonance</span>
              <span className="font-display font-extrabold text-cyan-200">
                Lv.{resonanceLv}
              </span>
              <span className="block text-[9px] text-slate-400">
                {state.resonance.slottedHeroIds.filter(Boolean).length}/{state.resonance.unlockedSlots} Slotted
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/70 border border-emerald-400/30">
              <span className="block text-slate-400">Active Bonds</span>
              <span className="font-display font-extrabold text-emerald-200">
                {activeBonds.length} Links
              </span>
              <span className="block text-[9px] text-amber-300">Permanent Buff</span>
            </div>
          </div>
        </div>

        {/* Readiness Checklist Banner */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-sky-400/30 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                readyToStarUp > 0 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            />
            <span className="text-slate-200 truncate">
              {readyToStarUp > 0
                ? `${readyToStarUp} warrior(s) ready for Star Ascension!`
                : 'Gather 5 Ascension Stones to raise Star Ranks.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('adventurers')}
            className="shrink-0 text-[10.5px] font-display font-extrabold text-amber-300 flex items-center gap-0.5"
          >
            <span>Adventurers</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* One-Tap Upgradeable Heroes List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="font-display font-bold text-xs text-amber-200">
              Warrior Power Growth
            </h2>
            <span className="text-[10px] text-slate-400">One-tap Lv / Star Up</span>
          </div>

          {unlockedHeroes.map((hero) => {
            const computed = getHeroComputedStats(hero, state);
            const goldCost = 1500 + hero.level * 120;
            const canLevel = state.player.gold >= goldCost;
            const canStar = stonesQty >= 5 && hero.stars < hero.maxStars;

            return (
              <div
                key={hero.id}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 space-y-2"
              >
                <div className="flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => onInspectHero(hero.id)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left group"
                  >
                    <img
                      src={hero.image}
                      alt={hero.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover object-top border border-amber-300/65 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-xs text-white group-hover:text-amber-200 truncate">
                          {hero.name}
                        </span>
                        <RarityTag rarity={hero.rarity} />
                        <ElementBadge element={hero.element} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10.5px] tabular-nums">
                        <span className="text-sky-200 font-bold">
                          Lv.{computed.effectiveLevel}
                        </span>
                        <span className="text-amber-300">
                          {'★'.repeat(hero.stars)}
                        </span>
                        <span className="text-slate-300">
                          Power {formatPowerCompact(computed.power)}
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onInspectHero(hero.id)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-[10px] font-display font-bold text-slate-200 hover:border-amber-300"
                  >
                    Inspect
                  </button>
                </div>

                {/* Quick Upgrade Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!canLevel}
                    onClick={() => levelUpHero(hero.id)}
                    className="min-h-[36px] px-2 rounded-lg bg-gradient-to-b from-sky-500 to-blue-700 border border-sky-300/60 text-white text-[10.5px] font-display font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-45 active:scale-95 tabular-nums"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Lv +1</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-200">
                      <GoldCoinIcon className="w-3 h-3" />
                      {formatGoldOrDiamond(goldCost)}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!canStar}
                    onClick={() => starUpHeroAction(hero.id)}
                    className="min-h-[36px] px-2 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 text-[10.5px] font-display font-black flex items-center justify-center gap-1 disabled:opacity-45 active:scale-95 tabular-nums"
                  >
                    <Star className="w-3 h-3" />
                    <span>
                      {hero.stars >= hero.maxStars ? 'Max ★' : 'Star Up (5 Stones)'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links to Bond / Resonance / Battle */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('adventurers')}
            className="min-h-[42px] px-3 rounded-xl bg-slate-950/80 border border-emerald-400/40 text-emerald-200 font-display font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Check Bonds</span>
          </button>
          <button
            type="button"
            onClick={openStoryMapInAdventure}
            className="min-h-[42px] px-3 rounded-xl bg-slate-950/80 border border-amber-400/40 text-amber-200 font-display font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Swords className="w-4 h-4" />
            <span>Farm Story Stages</span>
          </button>
        </div>
      </div>
    </section>
  );
};
