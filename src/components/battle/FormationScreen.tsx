import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Crosshair,
  Info,
  Shield,
  Sparkles,
  Swords,
  Wand2,
  X,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ASSETS } from '../../data/gameSeed';
import { calculateTeamAura, getStageById } from '../../data/stagesData';
import { ElementType, Hero } from '../../types/game';
import {
  autoFillFormation,
  calculateFormationPower,
  getDeployedHeroes,
  getUltPreviewSlotIndices,
} from '../../utils/combatEngine';
import { formatPowerCompact } from '../../utils/gameLogic';
import { ElementBadge, PowerEmblemIcon, RarityTag } from '../RpgIcons';
import { soundFx } from '../../utils/soundFx';

interface FormationScreenProps {
  stageId?: string;
  onBack: () => void;
  onStartCombat: () => void;
}

const FILTER_PILLS: { id: 'A' | ElementType; label: string }[] = [
  { id: 'A', label: 'A' },
  { id: 'STR', label: 'STR' },
  { id: 'PHY', label: 'PHY' },
  { id: 'INT', label: 'INT' },
  { id: 'UL', label: 'UL' },
  { id: 'S', label: 'S' },
];

export const FormationScreen: React.FC<FormationScreenProps> = ({
  stageId,
  onBack,
  onStartCombat,
}) => {
  const { state, setFormation, showToast } = useGame();
  const { heroes, formation, stageProgress } = state;

  const [filter, setFilter] = useState<'A' | ElementType>('A');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showAuraModal, setShowAuraModal] = useState(false);
  const [ultHighlightOn, setUltHighlightOn] = useState(false);
  const [selectedUltHeroId, setSelectedUltHeroId] = useState<string | null>(null);

  const stage = useMemo(
    () => getStageById(stageId ?? stageProgress.currentStage),
    [stageId, stageProgress.currentStage]
  );

  const deployedHeroes = useMemo(
    () => getDeployedHeroes(heroes, formation),
    [heroes, formation]
  );

  const aura = useMemo(() => calculateTeamAura(deployedHeroes), [deployedHeroes]);

  const ourPower = useMemo(
    () => calculateFormationPower(heroes, formation),
    [heroes, formation]
  );

  const unlockedRoster = useMemo(
    () =>
      heroes.filter(
        (h) => h.unlocked && (filter === 'A' || h.element === filter)
      ),
    [heroes, filter]
  );

  const heroMap = useMemo(() => new Map(heroes.map((h) => [h.id, h])), [heroes]);

  // Compute highlighted enemy/ally target slots when Ult Range is toggled
  const ultTargetPreview = useMemo(() => {
    if (!ultHighlightOn) return { enemySlots: new Set<number>(), allySlots: new Set<number>(), label: '' };
    const focusHero =
      (selectedUltHeroId ? heroMap.get(selectedUltHeroId) : undefined) ??
      deployedHeroes[0];
    if (!focusHero) {
      return { enemySlots: new Set<number>(), allySlots: new Set<number>(), label: '' };
    }
    const indices = getUltPreviewSlotIndices(focusHero.ultPattern);
    if (focusHero.ultPattern === 'ALLY_HEAL_BUFF') {
      return {
        enemySlots: new Set<number>(),
        allySlots: new Set(indices),
        label: `${focusHero.name}: ${focusHero.signatureSkill} (Heals Allies)`,
      };
    }
    return {
      enemySlots: new Set(indices),
      allySlots: new Set<number>(),
      label: `${focusHero.name}: ${focusHero.signatureSkill} (${focusHero.ultPattern.replace('_', ' ')})`,
    };
  }, [ultHighlightOn, selectedUltHeroId, heroMap, deployedHeroes]);

  const handleRemoveSlot = (slotIdx: number) => {
    if (!formation[slotIdx]) return;
    soundFx.playClick(state.player.audio.sfx);
    const next = [...formation];
    next[slotIdx] = null;
    setFormation(next);
  };

  const handleToggleDeployHero = (hero: Hero) => {
    soundFx.playClick(state.player.audio.sfx);
    const existingIdx = formation.indexOf(hero.id);
    if (existingIdx !== -1) {
      const next = [...formation];
      next[existingIdx] = null;
      setFormation(next);
      return;
    }

    // Prefer Front Row [0,1] for Tank/Melee, Back Row [2,3,4] for Mage/Support
    const preferredOrder =
      hero.roleTag === 'Tank' || hero.roleTag === 'Melee'
        ? [0, 1, 2, 3, 4]
        : [2, 3, 4, 0, 1];
    const emptyIdx = preferredOrder.find((idx) => formation[idx] === null);
    if (emptyIdx === undefined) {
      showToast('Formation is full (Max 5 heroes)');
      return;
    }
    const next = [...formation];
    next[emptyIdx] = hero.id;
    setFormation(next);
    setSelectedUltHeroId(hero.id);
  };

  const handleAutoFormation = () => {
    soundFx.playClaim(state.player.audio.sfx);
    const filled = autoFillFormation(heroes);
    setFormation(filled);
    showToast('Optimal Front/Back formation applied');
  };

  const handleConfirm = () => {
    if (deployedHeroes.length === 0) {
      showToast('Deploy at least 1 hero before starting battle');
      return;
    }
    onStartCombat();
  };

  const renderPlayerSlot = (slotIdx: number, rowLabel: string) => {
    const heroId = formation[slotIdx];
    const hero = heroId ? heroMap.get(heroId) : undefined;
    const isAllyHighlighted = ultTargetPreview.allySlots.has(slotIdx);

    return (
      <button
        key={`p-slot-${slotIdx}`}
        type="button"
        onClick={() => (hero ? handleRemoveSlot(slotIdx) : showToast('Tap a hero below to deploy'))}
        aria-label={
          hero
            ? `Remove ${hero.name} from ${rowLabel} slot`
            : `Empty ${rowLabel} slot`
        }
        className={`relative w-[50px] h-[54px] rounded-xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${
          isAllyHighlighted
            ? 'border-emerald-300 ring-2 ring-emerald-400/70 bg-emerald-950/60'
            : hero
            ? 'border-sky-300 bg-slate-950/85 shadow-md'
            : 'border-dashed border-sky-400/45 bg-slate-950/45 text-sky-300/60'
        }`}
      >
        {hero ? (
          <>
            <img
              src={hero.image}
              alt={hero.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top rounded-[10px]"
            />
            <span className="absolute -top-1.5 -right-1.5 px-1 rounded bg-slate-950 border border-sky-300/70 text-[8.5px] font-display font-bold text-white tabular-nums">
              {hero.level}
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-slate-950/85 text-[8.5px] font-display font-bold text-sky-100 truncate px-0.5 rounded-b-[9px]">
              {hero.name}
            </span>
          </>
        ) : (
          <span className="text-[9px] font-display font-bold">{rowLabel}</span>
        )}
      </button>
    );
  };

  const renderEnemySlot = (slotIdx: number, rowLabel: string) => {
    const enemy = stage.enemies.find((e) => e.slotIndex === slotIdx);
    const isTargeted = ultTargetPreview.enemySlots.has(slotIdx) && Boolean(enemy);

    return (
      <div
        key={`e-slot-${slotIdx}`}
        className={`relative w-[50px] h-[54px] rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
          isTargeted
            ? 'border-amber-300 ring-2 ring-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.65)] scale-105'
            : enemy
            ? enemy.isBoss
              ? 'border-amber-400 bg-rose-950/85 shadow-md'
              : 'border-rose-400/80 bg-slate-950/85'
            : 'border-dashed border-slate-700/60 bg-slate-950/30 opacity-45'
        }`}
      >
        {enemy ? (
          <>
            <img
              src={enemy.image}
              alt={enemy.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top rounded-[10px]"
            />
            <span className="absolute -top-1.5 -left-1.5 px-1 rounded bg-rose-900 border border-rose-300/70 text-[8px] font-display font-black text-white">
              {enemy.roleTag}
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-slate-950/85 text-[8.5px] font-display font-bold text-rose-100 truncate px-0.5 rounded-b-[9px]">
              {enemy.name}
            </span>
          </>
        ) : (
          <span className="text-[8.5px] font-display text-slate-500">{rowLabel}</span>
        )}
      </div>
    );
  };

  return (
    <section
      className="relative flex-1 flex flex-col overflow-hidden bg-[#0A1328]"
      aria-label="Pre-Battle 5v5 Formation"
    >
      {/* Top Comparison Header */}
      <div className="shrink-0 px-3 py-2 bg-gradient-to-r from-[#0F2347] via-[#172B56] to-[#3A1429] border-b border-amber-400/40 flex items-center justify-between gap-2">
        {/* Left: Our Team */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-extrabold text-xs text-sky-200">Our Team</span>
            {aura.active && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-300/60 text-[9px] font-display font-extrabold text-emerald-200">
                +{aura.atkBonusPct}% Aura
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <PowerEmblemIcon className="w-3.5 h-3.5" />
            <span className="font-display font-black text-xs text-amber-300 tabular-nums">
              {formatPowerCompact(ourPower)}
            </span>
          </div>
        </div>

        {/* Center VS Emblem */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-b from-amber-300 to-orange-600 border-2 border-amber-100 flex items-center justify-center font-display font-black text-xs text-slate-950 shadow-lg shrink-0">
          VS
        </div>

        {/* Right: Enemy Lineup */}
        <div className="min-w-0 flex-1 text-right">
          <p className="font-display font-extrabold text-xs text-rose-200 truncate">
            Enemy · {stage.id}
          </p>
          <p className="font-display font-black text-xs text-rose-300 tabular-nums mt-0.5">
            {formatPowerCompact(stage.enemyPower)}
          </p>
        </div>
      </div>

      {/* 5v5 Tactical Battlefield Grid + Side Badges */}
      <div className="relative shrink-0 h-[238px] border-b border-amber-400/35 overflow-hidden flex flex-col justify-between px-2.5 py-2">
        <img
          src={ASSETS.arenaBattlefieldBg}
          alt="Tactical battlefield"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-slate-950/45 pointer-events-none" />

        {/* Side Badges Row: Aura | Type | Ult Range */}
        <div className="relative z-10 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowAuraModal(true)}
              className="min-h-[30px] px-2 rounded-lg bg-slate-950/85 border border-emerald-400/50 text-[10px] font-display font-bold text-emerald-200 flex items-center gap-1 active:scale-95"
            >
              <Sparkles className="w-3 h-3" /> Aura
            </button>
            <button
              type="button"
              onClick={() => setShowTypeModal(true)}
              className="min-h-[30px] px-2 rounded-lg bg-slate-950/85 border border-sky-400/50 text-[10px] font-display font-bold text-sky-200 flex items-center gap-1 active:scale-95"
            >
              <Info className="w-3 h-3" /> Type
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick(state.player.audio.sfx);
              setUltHighlightOn((v) => !v);
            }}
            aria-pressed={ultHighlightOn}
            className={`min-h-[30px] px-2.5 rounded-lg border text-[10px] font-display font-bold flex items-center gap-1 active:scale-95 ${
              ultHighlightOn
                ? 'bg-rose-600 border-amber-200 text-white shadow-md'
                : 'bg-slate-950/85 border-amber-400/50 text-amber-200'
            }`}
          >
            <Crosshair className="w-3 h-3" /> Ult Range
          </button>
        </div>

        {/* Ult Range Helper Strip */}
        {ultHighlightOn && ultTargetPreview.label && (
          <div className="relative z-10 px-2 py-0.5 rounded bg-rose-950/90 border border-amber-300/60 text-[10px] font-display font-bold text-amber-100 text-center truncate">
            {ultTargetPreview.label}
          </div>
        )}

        {/* 5v5 Grids: Left Player (Back 3 | Front 2) vs Right Enemy (Front 2 | Back 3) */}
        <div className="relative z-10 flex items-center justify-between gap-2 my-auto">
          {/* Player 5-Slot Grid */}
          <div className="flex items-center gap-1.5">
            {/* Back Row (3 slots: 2, 3, 4) */}
            <div className="flex flex-col gap-1.5">
              {renderPlayerSlot(2, 'Back')}
              {renderPlayerSlot(3, 'Back')}
              {renderPlayerSlot(4, 'Back')}
            </div>
            {/* Front Row (2 slots: 0, 1) */}
            <div className="flex flex-col gap-2">
              {renderPlayerSlot(0, 'Front')}
              {renderPlayerSlot(1, 'Front')}
            </div>
          </div>

          <div className="h-24 w-px bg-amber-300/35 shrink-0" aria-hidden="true" />

          {/* Enemy 5-Slot Grid */}
          <div className="flex items-center gap-1.5">
            {/* Enemy Front Row (2 slots: 0, 1) */}
            <div className="flex flex-col gap-2">
              {renderEnemySlot(0, 'Front')}
              {renderEnemySlot(1, 'Front')}
            </div>
            {/* Enemy Back Row (3 slots: 2, 3, 4) */}
            <div className="flex flex-col gap-1.5">
              {renderEnemySlot(2, 'Back')}
              {renderEnemySlot(3, 'Back')}
              {renderEnemySlot(4, 'Back')}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Roster Filter & Hero Selection */}
      <div className="flex-1 min-h-0 flex flex-col px-3 pt-2 pb-2 space-y-2 bg-[#091224]">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilter(pill.id)}
                className={`min-h-[32px] min-w-[34px] px-2 rounded-lg font-display font-extrabold text-[11px] transition-colors ${
                  filter === pill.id
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-900 border border-slate-700 text-slate-300'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
          <span className="text-[10.5px] font-display font-bold text-sky-200 tabular-nums shrink-0">
            {deployedHeroes.length}/5 Deployed
          </span>
        </div>

        {/* Scrollable Hero Cards */}
        <div className="flex-1 min-h-0 overflow-y-auto rpg-scroll grid grid-cols-3 content-start items-start gap-2 pr-0.5">
          {unlockedRoster.map((hero) => {
            const isDeployed = formation.includes(hero.id);
            return (
              <button
                key={hero.id}
                type="button"
                onClick={() => handleToggleDeployHero(hero)}
                className={`relative flex flex-col rounded-xl border p-1.5 text-left transition-all active:scale-95 ${
                  isDeployed
                    ? 'bg-sky-900/45 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                    : 'bg-slate-950/75 border-slate-700/80 hover:border-sky-400/60'
                }`}
              >
                <div className="relative h-16 w-full rounded-lg overflow-hidden bg-slate-900">
                  <img
                    src={hero.image}
                    alt={hero.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-1 left-1">
                    <RarityTag rarity={hero.rarity} />
                  </div>
                  {isDeployed && (
                    <span
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border border-white text-white flex items-center justify-center shadow"
                      aria-label="Deployed"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="font-display font-bold text-[11px] text-white truncate mt-1">
                  {hero.name}
                </p>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <ElementBadge element={hero.element} size="sm" />
                  <span className="text-[9.5px] font-display font-bold text-amber-300 tabular-nums">
                    Lv.{hero.level}
                  </span>
                </div>
                <span className="text-[9px] text-amber-200/90 tabular-nums mt-0.5">
                  {'★'.repeat(hero.stars)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Formation Controls: Back | Auto Formation | Confirm */}
        <div className="shrink-0 flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Stage Map"
            className="min-h-[44px] w-12 rounded-xl bg-slate-900 border border-slate-600 text-slate-200 flex items-center justify-center active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleAutoFormation}
            className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-b from-sky-500 to-blue-700 border border-sky-300/70 text-white font-display font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Wand2 className="w-4 h-4" />
            <span>Auto Formation</span>
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 border border-amber-100 text-slate-950 font-display font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
          >
            <Swords className="w-4 h-4" />
            <span>Confirm</span>
          </button>
        </div>
      </div>

      {/* Type Advantage Chart Popup */}
      {showTypeModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Element Advantage Chart"
        >
          <div className="w-full max-w-[340px] rounded-2xl bg-[#112244] border-2 border-sky-400/70 p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-extrabold text-sm text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-sky-300" /> Element Advantage Matrix
              </h2>
              <button
                type="button"
                onClick={() => setShowTypeModal(false)}
                aria-label="Close Type Chart"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/75 border border-sky-400/25 space-y-2 text-xs text-slate-200">
              <p className="font-display font-bold text-amber-200">
                Core Cycle (+20% Damage Advantage):
              </p>
              <p className="font-display font-bold text-white">
                STR (Fire) → PHY (Guard) → INT (Star) → STR
              </p>
              <p className="font-display font-bold text-violet-200 pt-1">
                Celestial Pair (+18% Mutual Advantage):
              </p>
              <p className="font-display font-bold text-white">S (Solar) ⇄ UL (Ultra)</p>
            </div>
          </div>
        </div>
      )}

      {/* Aura Synergy Popup */}
      {showAuraModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Team Aura Synergy"
        >
          <div className="w-full max-w-[340px] rounded-2xl bg-[#112244] border-2 border-emerald-400/70 p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-extrabold text-sm text-emerald-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Active Aura: {aura.name}
              </h2>
              <button
                type="button"
                onClick={() => setShowAuraModal(false)}
                aria-label="Close Aura Info"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-200">{aura.description}</p>
            <div className="p-2.5 rounded-xl bg-slate-950/75 border border-emerald-400/30 text-[11px] text-slate-300 space-y-1">
              <p>• Vanguard Duo (2+ heroes): +5% ATK & HP</p>
              <p>• Tri-Element Harmony (3+ distinct): +10% ATK & HP</p>
              <p>• Mono Element Resonance (3+ same): +14% ATK & HP</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
