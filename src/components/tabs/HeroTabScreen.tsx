import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Flame,
  HeartHandshake,
  Lock,
  Plus,
  Sparkles,
  Star,
  Swords,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { HERO_BONDS, ULT_PATTERN_DESCRIPTIONS } from '../../data/phase3Data';
import { ElementType, Hero, HeroSubTab, Rarity } from '../../types/game';
import {
  formatGoldOrDiamond,
  formatPowerCompact,
  getActiveBonds,
  getHeroComputedStats,
  getResonanceBaselineLevel,
} from '../../utils/gameLogic';
import { ElementBadge, GoldCoinIcon, PowerEmblemIcon, RarityTag } from '../RpgIcons';

const SUB_TABS: { id: HeroSubTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'warrior', label: 'Warrior', icon: Users },
  { id: 'resonance', label: 'Resonance', icon: Sparkles },
  { id: 'bond', label: 'Bond', icon: HeartHandshake },
  { id: 'album', label: 'Album', icon: BookOpen },
];

const ELEMENT_FILTERS: ('A' | ElementType)[] = ['A', 'STR', 'PHY', 'INT', 'S', 'UL'];
const RARITY_FILTERS: ('All' | Rarity)[] = ['All', 'UR', 'SSR', 'SR', 'R', 'N'];

export const HeroTabScreen: React.FC<{
  initialHeroId?: string | null;
  onClearInitialHero?: () => void;
}> = ({ initialHeroId = null, onClearInitialHero }) => {
  const {
    state,
    levelUpHero,
    levelUpHeroWithScroll,
    starUpHeroAction,
    starUpHeroByShardsAction,
    toggleResonanceHero,
    unlockResonanceSlotAction,
    setFeaturedHero,
    setActiveTab,
  } = useGame();

  const [subTab, setSubTab] = useState<HeroSubTab>('warrior');
  const [elemFilter, setElemFilter] = useState<'A' | ElementType>('A');
  const [rarityFilter, setRarityFilter] = useState<'All' | Rarity>('All');
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(initialHeroId);

  useEffect(() => {
    if (initialHeroId) {
      setSubTab('warrior');
      setSelectedHeroId(initialHeroId);
      onClearInitialHero?.();
    }
  }, [initialHeroId, onClearInitialHero]);

  const resonanceBaseline = useMemo(
    () => getResonanceBaselineLevel(state.heroes),
    [state.heroes]
  );

  const activeBonds = useMemo(() => getActiveBonds(state.heroes), [state.heroes]);

  const ownedHeroes = useMemo(
    () =>
      state.heroes.filter(
        (h) => h.unlocked && (elemFilter === 'A' || h.element === elemFilter)
      ),
    [state.heroes, elemFilter]
  );

  const albumHeroes = useMemo(
    () =>
      state.heroes.filter(
        (h) =>
          (elemFilter === 'A' || h.element === elemFilter) &&
          (rarityFilter === 'All' || h.rarity === rarityFilter)
      ),
    [state.heroes, elemFilter, rarityFilter]
  );

  const selectedHero = useMemo(
    () => state.heroes.find((h) => h.id === selectedHeroId) ?? null,
    [state.heroes, selectedHeroId]
  );

  const stonesQty = state.bag.find((b) => b.id === 'ascension-stone')?.quantity ?? 0;
  const scrollsQty = state.bag.find((b) => b.id === 'exp-scroll')?.quantity ?? 0;
  const crystalsQty = state.bag.find((b) => b.id === 'azure-essence')?.quantity ?? 0;

  return (
    <section className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0E1E3E] via-[#0B1730] to-[#081022]">
      {/* Sub-Tab Header: Warrior | Resonance | Bond | Album */}
      <div className="shrink-0 px-2.5 pt-2.5 pb-2 bg-[#0B162C]/95 border-b border-amber-400/30 space-y-2">
        <div className="grid grid-cols-4 gap-1.5">
          {SUB_TABS.map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`min-h-[38px] px-1.5 rounded-xl border font-display font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                  active
                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-amber-100 text-slate-950 shadow'
                    : 'bg-slate-900/75 border-slate-700 text-slate-300 hover:border-sky-400/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Element / Class Filter Bar: A, STR, PHY, INT, S, UL */}
        <div className="flex items-center justify-between gap-1">
          {ELEMENT_FILTERS.map((el) => {
            const active = elemFilter === el;
            return (
              <button
                key={el}
                type="button"
                onClick={() => setElemFilter(el)}
                className={`flex-1 min-h-[30px] rounded-lg border text-[10.5px] font-display font-extrabold transition-all active:scale-95 ${
                  active
                    ? 'bg-sky-500 border-sky-200 text-white shadow'
                    : 'bg-slate-950/80 border-slate-700/80 text-slate-300'
                }`}
              >
                {el}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto rpg-scroll p-3">
        {/* SUB-TAB 1: WARRIOR */}
        {subTab === 'warrior' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300 px-0.5">
              <span>
                Owned Fighters:{' '}
                <span className="font-bold text-amber-300 tabular-nums">
                  {state.heroes.filter((h) => h.unlocked).length}/{state.heroes.length}
                </span>
              </span>
              <span className="text-sky-200">Tap a warrior to upgrade</span>
            </div>

            {ownedHeroes.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No unlocked warriors match element {elemFilter}.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 content-start items-start">
                {ownedHeroes.map((hero) => {
                  const computed = getHeroComputedStats(hero, state);
                  const canAscend = stonesQty >= 5 && hero.stars < hero.maxStars;
                  return (
                    <button
                      key={hero.id}
                      type="button"
                      onClick={() => setSelectedHeroId(hero.id)}
                      className="relative flex flex-col rounded-xl bg-slate-950/80 border-2 border-sky-400/35 hover:border-amber-300 overflow-hidden text-left shadow-lg transition-all active:scale-[0.98]"
                    >
                      <div className="relative h-28 w-full bg-slate-900">
                        <img
                          src={hero.image}
                          alt={hero.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950 to-transparent" />
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                          <RarityTag rarity={hero.rarity} />
                          <ElementBadge element={hero.element} size="sm" />
                        </div>
                        {canAscend && (
                          <span
                            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"
                            aria-label="Star up ready"
                          />
                        )}
                        <span
                          className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/85 border text-[10px] font-display font-extrabold tabular-nums ${
                            computed.isResonant
                              ? 'border-cyan-400/70 text-cyan-200'
                              : 'border-amber-400/40 text-amber-200'
                          }`}
                        >
                          Lv.{computed.effectiveLevel}
                          {computed.isResonant ? ' (Sync)' : ''}
                        </span>
                      </div>

                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-display font-bold text-xs text-white truncate">
                            {hero.name}
                          </p>
                          <span className="text-[9.5px] text-slate-400 shrink-0">
                            {hero.roleTag}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] tabular-nums">
                          <span className="text-amber-300">
                            {'★'.repeat(hero.stars)}
                          </span>
                          <span className="inline-flex items-center gap-0.5 font-display font-bold text-sky-200">
                            <PowerEmblemIcon className="w-3 h-3" />
                            {formatPowerCompact(computed.power)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 2: RESONANCE */}
        {subTab === 'resonance' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-950 to-indigo-950/80 border border-cyan-400/45 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <h3 className="font-display font-extrabold text-sm text-cyan-100">
                    Spirit Resonance Sanctuary
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-300/60 font-display font-black text-xs text-cyan-200 tabular-nums">
                  Sync Lv.{resonanceBaseline}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Slotted fighters automatically synchronize to your Mentor Baseline (<span className="text-cyan-200 font-bold">Lv.{resonanceBaseline}</span>) in stats and combat!
              </p>
            </div>

            {/* Active Resonance Slots */}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, idx) => {
                const isSlotUnlocked = idx < state.resonance.unlockedSlots;
                const heroId = state.resonance.slottedHeroIds[idx] ?? null;
                const hero = heroId ? state.heroes.find((h) => h.id === heroId) : null;

                if (!isSlotUnlocked) {
                  return (
                    <button
                      key={`res-lock-${idx}`}
                      type="button"
                      onClick={unlockResonanceSlotAction}
                      className="min-h-[88px] rounded-xl border border-dashed border-slate-600 bg-slate-950/60 flex flex-col items-center justify-center p-2 text-center hover:border-cyan-300 active:scale-95"
                    >
                      <Lock className="w-4 h-4 text-slate-400 mb-1" />
                      <span className="text-[10px] font-display font-bold text-slate-300">
                        Unlock Slot
                      </span>
                      <span className="text-[9px] text-cyan-300 tabular-nums">
                        10 Essence ({crystalsQty})
                      </span>
                    </button>
                  );
                }

                if (!hero) {
                  return (
                    <div
                      key={`res-empty-${idx}`}
                      className="min-h-[88px] rounded-xl border border-dashed border-cyan-400/45 bg-slate-950/45 flex flex-col items-center justify-center p-2 text-center"
                    >
                      <Plus className="w-4 h-4 text-cyan-300 mb-1" />
                      <span className="text-[10px] font-display font-bold text-cyan-200">
                        Open Slot
                      </span>
                      <span className="text-[9px] text-slate-400">Tap hero below</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={`res-hero-${idx}`}
                    type="button"
                    onClick={() => toggleResonanceHero(hero.id)}
                    className="relative min-h-[88px] rounded-xl border-2 border-cyan-300 bg-slate-950 overflow-hidden text-left active:scale-95"
                  >
                    <img
                      src={hero.image}
                      alt={hero.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-14 object-cover object-top"
                    />
                    <span className="absolute top-1 right-1 px-1 rounded bg-cyan-500 text-slate-950 text-[8.5px] font-black tabular-nums">
                      Lv.{Math.max(hero.level, resonanceBaseline)}
                    </span>
                    <div className="p-1 text-center">
                      <p className="text-[10px] font-display font-bold text-white truncate">
                        {hero.name}
                      </p>
                      <p className="text-[8.5px] text-rose-300">Tap to Remove</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Available Unlocked Heroes to Sync */}
            <div className="space-y-1.5 pt-1">
              <p className="font-display font-bold text-xs text-amber-200">
                Assign Unlocked Warriors to Resonance
              </p>
              <div className="space-y-1.5">
                {ownedHeroes.map((hero) => {
                  const slotted = state.resonance.slottedHeroIds.includes(hero.id);
                  const syncedLv = Math.max(hero.level, resonanceBaseline);
                  return (
                    <button
                      key={hero.id}
                      type="button"
                      onClick={() => toggleResonanceHero(hero.id)}
                      className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl border text-left transition-all active:scale-[0.98] ${
                        slotted
                          ? 'bg-cyan-500/15 border-cyan-300'
                          : 'bg-slate-950/75 border-slate-700/80 hover:border-cyan-400/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={hero.image}
                          alt={hero.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover object-top shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-xs text-white truncate">
                              {hero.name}
                            </span>
                            <ElementBadge element={hero.element} size="sm" />
                          </div>
                          <p className="text-[10px] text-slate-300 tabular-nums">
                            Base Lv.{hero.level} → Sync Lv.{syncedLv}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-display font-extrabold ${
                          slotted
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-slate-800 border border-slate-600 text-slate-200'
                        }`}
                      >
                        {slotted ? 'Synced' : 'Assign'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: BOND */}
        {subTab === 'bond' && (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950/75 border border-amber-400/35 flex items-center justify-between text-xs">
              <span className="font-display font-bold text-amber-100">
                Active Synergy Bonds
              </span>
              <span className="font-display font-black text-emerald-300 tabular-nums">
                {activeBonds.length}/{HERO_BONDS.length} Active
              </span>
            </div>

            {HERO_BONDS.map((bond) => {
              const requiredHeroes = bond.heroIds
                .map((id) => state.heroes.find((h) => h.id === id))
                .filter((h): h is Hero => Boolean(h));
              const isActive = requiredHeroes.every((h) => h.unlocked);

              return (
                <div
                  key={bond.id}
                  className={`p-3 rounded-xl border space-y-2 ${
                    isActive
                      ? 'bg-gradient-to-br from-emerald-950/55 via-slate-950 to-amber-950/30 border-emerald-400/60'
                      : 'bg-slate-950/75 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-extrabold text-xs text-white">
                        {bond.name}
                      </p>
                      <p className="text-[10px] text-slate-300">{bond.subtitle}</p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-[9.5px] font-display font-black ${
                        isActive
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {/* Required Heroes */}
                  <div className="flex items-center gap-2">
                    {requiredHeroes.map((h) => (
                      <div key={h.id} className="flex items-center gap-1.5">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-600">
                          <img
                            src={h.image}
                            alt={h.name}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover object-top ${
                              !h.unlocked ? 'grayscale brightness-50' : ''
                            }`}
                          />
                          {!h.unlocked && (
                            <Lock className="w-3 h-3 text-white absolute bottom-0.5 right-0.5" />
                          )}
                        </div>
                        <span className="text-[10px] font-display font-semibold text-slate-200">
                          {h.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Type Stats Bonus */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 mr-0.5">Type Bonus:</span>
                      {bond.targetElements.map((el) => (
                        <ElementBadge key={el} element={el} size="sm" />
                      ))}
                    </div>
                    <span className="font-display font-bold text-amber-300 tabular-nums">
                      ATK +{bond.bonus.atkPct}% · HP +{bond.bonus.hpPct}% · DEF +{bond.bonus.defPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SUB-TAB 4: ALBUM */}
        {subTab === 'album' && (
          <div className="space-y-2.5">
            {/* Rarity Filter Bar */}
            <div className="flex items-center gap-1">
              {RARITY_FILTERS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarityFilter(r)}
                  className={`flex-1 min-h-[28px] rounded-lg border text-[10px] font-display font-extrabold transition-all ${
                    rarityFilter === r
                      ? 'bg-amber-400 border-amber-100 text-slate-950'
                      : 'bg-slate-950/80 border-slate-700 text-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 content-start items-start">
              {albumHeroes.map((hero) => (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => setSelectedHeroId(hero.id)}
                  className={`relative flex flex-col rounded-xl border overflow-hidden text-left transition-all active:scale-95 ${
                    hero.unlocked
                      ? 'bg-slate-950/85 border-amber-400/50'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="relative h-24 w-full bg-slate-900">
                    <img
                      src={hero.image}
                      alt={hero.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover object-top ${
                        !hero.unlocked ? 'grayscale brightness-[0.35]' : ''
                      }`}
                    />
                    <div className="absolute top-1 left-1">
                      <RarityTag rarity={hero.rarity} />
                    </div>
                    {!hero.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-slate-200 drop-shadow" />
                      </div>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="font-display font-bold text-[10.5px] text-white truncate">
                      {hero.name}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate">
                      {hero.unlocked ? `${hero.element} · Unlocked` : 'Divination / Shards'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* HERO DETAIL & UPGRADE MODAL / DRAWER */}
      {selectedHero && (
        <div
          className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hero-detail-title"
        >
          <HeroDetailModalContent
            hero={selectedHero}
            stonesQty={stonesQty}
            scrollsQty={scrollsQty}
            onClose={() => setSelectedHeroId(null)}
            onLevelUp={() => levelUpHero(selectedHero.id)}
            onScrollBoost={() => levelUpHeroWithScroll(selectedHero.id)}
            onStarUp={() => starUpHeroAction(selectedHero.id)}
            onShardAscend={() => starUpHeroByShardsAction(selectedHero.id)}
            onSetFeatured={() => setFeaturedHero(selectedHero.id)}
            onGoDivination={() => {
              setSelectedHeroId(null);
              setActiveTab('summon');
            }}
          />
        </div>
      )}
    </section>
  );
};

interface HeroDetailProps {
  hero: Hero;
  stonesQty: number;
  scrollsQty: number;
  onClose: () => void;
  onLevelUp: () => void;
  onScrollBoost: () => void;
  onStarUp: () => void;
  onShardAscend: () => void;
  onSetFeatured: () => void;
  onGoDivination: () => void;
}

const HeroDetailModalContent: React.FC<HeroDetailProps> = ({
  hero,
  stonesQty,
  scrollsQty,
  onClose,
  onLevelUp,
  onScrollBoost,
  onStarUp,
  onShardAscend,
  onSetFeatured,
  onGoDivination,
}) => {
  const { state } = useGame();
  const computed = getHeroComputedStats(hero, state);
  const goldCost = 1500 + hero.level * 120;
  const shardItem = state.bag.find(
    (b) => b.category === 'Shard' && b.shardHeroId === hero.id
  );
  const shardQty = shardItem?.quantity ?? 0;
  const shardCost = shardItem?.craftCost ?? 20;
  const ultInfo = ULT_PATTERN_DESCRIPTIONS[hero.ultPattern];
  const isFeatured = state.player.featuredHeroId === hero.id;

  return (
    <div className="w-full max-h-[84dvh] flex flex-col rounded-2xl bg-gradient-to-b from-[#162952] to-[#0A1326] border-2 border-amber-400/75 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/75 border-b border-amber-400/35 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <RarityTag rarity={hero.rarity} />
          <h2 id="hero-detail-title" className="font-display font-extrabold text-sm text-white truncate">
            {hero.name}
          </h2>
          <ElementBadge element={hero.element} size="sm" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Hero Details"
          className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto rpg-scroll p-3.5 space-y-3">
        {/* Top Card */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-sky-400/30">
          <img
            src={hero.image}
            alt={hero.name}
            referrerPolicy="no-referrer"
            className={`w-20 h-24 rounded-xl object-cover object-top border-2 border-amber-300 shrink-0 ${
              !hero.unlocked ? 'grayscale brightness-50' : ''
            }`}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[11px] font-display font-bold text-amber-200">{hero.title}</p>
            <p className="text-[11px] text-slate-300">
              {hero.heroClass} · Role: <span className="text-white font-semibold">{hero.roleTag}</span>
            </p>
            <p className="text-xs text-amber-300 tabular-nums">
              {'★'.repeat(hero.stars)}
              {'☆'.repeat(hero.maxStars - hero.stars)}
            </p>
            <div className="flex items-center gap-2 pt-0.5 tabular-nums">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-amber-300/40 text-[11px] font-display font-extrabold text-amber-200">
                Lv.{computed.effectiveLevel}
                {computed.isResonant ? ` (Base ${hero.level})` : ''}
              </span>
              <span className="inline-flex items-center gap-1 font-display font-black text-xs text-sky-200">
                <PowerEmblemIcon className="w-3.5 h-3.5" />
                {formatGoldOrDiamond(computed.power)}
              </span>
            </div>
          </div>
        </div>

        {/* Combat Stats Grid */}
        <div className="grid grid-cols-4 gap-1.5 text-center tabular-nums">
          {[
            { label: 'HP', val: formatGoldOrDiamond(computed.hp), color: 'text-emerald-300' },
            { label: 'ATK', val: formatGoldOrDiamond(computed.atk), color: 'text-rose-300' },
            { label: 'DEF', val: formatGoldOrDiamond(computed.def), color: 'text-sky-300' },
            { label: 'SPD', val: String(computed.spd), color: 'text-amber-300' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-2 rounded-xl bg-slate-950/75 border border-slate-700/80"
            >
              <span className="block text-[9.5px] font-display font-bold text-slate-400">
                {stat.label}
              </span>
              <span className={`block font-display font-extrabold text-xs mt-0.5 ${stat.color}`}>
                {stat.val}
              </span>
            </div>
          ))}
        </div>

        {(computed.bondBonus.atkPct > 0 || computed.bondBonus.hpPct > 0) && (
          <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/45 border border-emerald-400/40 text-[10.5px] text-emerald-200 flex items-center justify-between tabular-nums">
            <span>Active Bond Type Bonus ({hero.element})</span>
            <span className="font-bold">
              ATK +{computed.bondBonus.atkPct}% · HP +{computed.bondBonus.hpPct}%
            </span>
          </div>
        )}

        {/* Ultimate Skill & Target Range */}
        <div className="p-3 rounded-xl bg-slate-950/75 border border-amber-400/35 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 font-display font-extrabold text-xs text-amber-200">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              {hero.signatureSkill}
            </span>
            <span className="px-2 py-0.5 rounded bg-violet-950/90 border border-violet-400/50 text-[9.5px] font-display font-bold text-violet-200">
              Range: {ultInfo.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            {hero.skillDescription ?? ultInfo.detail}
          </p>
        </div>

        {/* Upgrade Controls (if unlocked) */}
        {hero.unlocked ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onLevelUp}
                className="min-h-[46px] px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-sky-400 to-blue-700 border border-sky-200/80 text-white flex flex-col items-center justify-center active:scale-95"
              >
                <span className="font-display font-extrabold text-xs flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Level Up +1
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-200 tabular-nums">
                  <GoldCoinIcon className="w-3 h-3" /> {formatGoldOrDiamond(goldCost)}
                </span>
              </button>

              <button
                type="button"
                disabled={scrollsQty < 1}
                onClick={onScrollBoost}
                className="min-h-[46px] px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-emerald-400 to-teal-700 border border-emerald-200/80 text-white flex flex-col items-center justify-center disabled:opacity-45 active:scale-95"
              >
                <span className="font-display font-extrabold text-xs">Scroll +2 Lv</span>
                <span className="text-[10px] text-emerald-100 tabular-nums">
                  1 Scroll ({scrollsQty} owned)
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={stonesQty < 5 || hero.stars >= hero.maxStars}
                onClick={onStarUp}
                className="min-h-[46px] px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 flex flex-col items-center justify-center disabled:opacity-45 active:scale-95"
              >
                <span className="font-display font-black text-xs flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" /> Star Up
                </span>
                <span className="text-[10px] font-bold tabular-nums">
                  {hero.stars >= hero.maxStars ? 'Max Stars' : `5 Stones (${stonesQty})`}
                </span>
              </button>

              <button
                type="button"
                disabled={shardQty < shardCost || hero.stars >= hero.maxStars}
                onClick={onShardAscend}
                className="min-h-[46px] px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-violet-400 to-purple-700 border border-violet-200/80 text-white flex flex-col items-center justify-center disabled:opacity-45 active:scale-95"
              >
                <span className="font-display font-extrabold text-xs">Shard Ascend</span>
                <span className="text-[10px] text-violet-100 tabular-nums">
                  {shardQty}/{shardCost} Shards
                </span>
              </button>
            </div>

            <button
              type="button"
              disabled={isFeatured}
              onClick={onSetFeatured}
              className={`w-full min-h-[38px] rounded-xl border text-xs font-display font-bold flex items-center justify-center gap-1.5 ${
                isFeatured
                  ? 'bg-slate-900 border-emerald-400/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-600 text-slate-200 hover:border-amber-300'
              }`}
            >
              {isFeatured ? <Check className="w-3.5 h-3.5" /> : <Swords className="w-3.5 h-3.5" />}
              <span>{isFeatured ? 'Featured on Home Sanctuary' : 'Set as Home Hero'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-violet-400/45 text-center space-y-2">
            <p className="text-xs text-slate-300">
              Unlock <span className="text-white font-bold">{hero.name}</span> via{' '}
              <span className="text-amber-300 font-bold">Divination Shrine</span> or by collecting{' '}
              <span className="text-sky-200 font-bold">{shardCost} Shards</span> ({shardQty}/{shardCost}).
            </p>
            <button
              type="button"
              onClick={onGoDivination}
              className="w-full min-h-[42px] rounded-xl bg-gradient-to-b from-violet-400 to-indigo-700 border border-violet-200 text-white font-display font-extrabold text-xs active:scale-95"
            >
              Go to Summon
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
