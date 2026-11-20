import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Crown,
  Gift,
  Lock,
  Play,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ASSETS } from '../../data/gameSeed';
import { getStageById, STORY_STAGES } from '../../data/stagesData';
import {
  calculateFormationPower,
  getDeployedHeroes,
} from '../../utils/combatEngine';
import {
  AFK_MAX_SECONDS,
  formatAfkTimer,
  formatGoldOrDiamond,
  formatPowerCompact,
  getAfkTimeCapPercent,
} from '../../utils/gameLogic';
import {
  canEnterStoryStage,
  getStoryStageStatus,
} from '../../utils/storyProgression';
import { DiamondGemIcon, GoldCoinIcon, PowerEmblemIcon } from '../RpgIcons';

interface StageMapScreenProps {
  onOpenFormation: (stageId: string) => void;
}

export const StageMapScreen: React.FC<StageMapScreenProps> = ({ onOpenFormation }) => {
  const { state, claimAfk, toggleAutoBattle } = useGame();
  const { stageProgress, heroes, formation, autoBattle, player } = state;

  const [afkModalOpen, setAfkModalOpen] = useState(false);
  const [dioramaTick, setDioramaTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDioramaTick((t) => (t + 1) % 4);
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  const currentStage = useMemo(
    () => getStageById(stageProgress.currentStage),
    [stageProgress.currentStage]
  );

  const currentStageEntry = useMemo(
    () => canEnterStoryStage(state, currentStage.id),
    [state, currentStage.id]
  );

  const visibleStages = useMemo(() => {
    const curIdx = STORY_STAGES.findIndex((s) => s.id === stageProgress.currentStage);
    const start = Math.max(0, Math.min(curIdx - 2, STORY_STAGES.length - 6));
    return STORY_STAGES.slice(start, start + 6);
  }, [stageProgress.currentStage]);

  const deployedHeroes = useMemo(
    () => getDeployedHeroes(heroes, formation),
    [heroes, formation]
  );

  const formationPower = useMemo(
    () => calculateFormationPower(heroes, formation),
    [heroes, formation]
  );

  const afkElapsed = stageProgress.afkReward.elapsedSeconds ?? 0;
  const afkCapPct = getAfkTimeCapPercent(afkElapsed);
  const afkTimerLabel = formatAfkTimer(afkElapsed);
  const isAfkFull = afkElapsed >= AFK_MAX_SECONDS;
  const questPct = Math.round(
    (stageProgress.questTracker.current / stageProgress.questTracker.target) * 100
  );

  return (
    <section
      className="relative flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0E1E3E] via-[#0B1730] to-[#081022]"
      aria-label="Adventure Stage Map"
    >
      {/* Top Story Progress Tracker & Chapter Header */}
      <div className="shrink-0 px-3 pt-2.5 pb-2 bg-[#0B162C]/95 border-b border-amber-400/30 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-sm text-white leading-tight truncate">
              Main Story 1 · Coastal Sanctuary
            </h1>
            <p className="text-[10.5px] text-sky-200/85 tabular-nums">
              {currentStageEntry.status === 'CLEARED' ? (
                <span className="font-bold text-emerald-300">All 10 Stages Cleared!</span>
              ) : currentStageEntry.status === 'LEVEL_LOCKED' ? (
                <>
                  Next Stage: <span className="font-bold text-amber-300">{currentStage.id}</span> ·{' '}
                  <span className="font-bold text-rose-300">
                    Requires Player Lv.{currentStage.minPlayerLevel} (Now Lv.{player.level})
                  </span>
                </>
              ) : (
                <>
                  Active Stage: <span className="font-bold text-amber-300">{currentStage.id}</span> ·{' '}
                  {currentStage.name}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/80 border border-amber-400/35 shrink-0">
            <PowerEmblemIcon className="w-3.5 h-3.5" />
            <span className="font-display font-extrabold text-[11px] text-amber-200 tabular-nums">
              {formatPowerCompact(formationPower)}
            </span>
          </div>
        </div>

        {/* Stage Quest Tracker */}
        <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/75 border border-sky-400/30 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-display font-bold text-amber-100">
              {stageProgress.questTracker.title}{' '}
              <span className="text-amber-300 tabular-nums">
                ({stageProgress.questTracker.current}/{stageProgress.questTracker.target})
              </span>
            </span>
            <span className="inline-flex items-center gap-1 font-display font-extrabold text-cyan-200 tabular-nums">
              <DiamondGemIcon className="w-3 h-3" /> +200 Bonus
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 transition-[width] duration-300"
              style={{ width: `${questPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Vertical Stage Node Path (Top Half) */}
      <div className="relative flex-1 min-h-0 overflow-y-auto rpg-scroll px-3 py-3 bg-[radial-gradient(circle_at_50%_30%,rgba(14,165,233,0.14),transparent_70%)]">
        <div className="relative flex flex-col-reverse gap-2.5 max-w-[360px] mx-auto">
          {visibleStages.map((stage, idx) => {
            const status = getStoryStageStatus(state, stage.id);
            const isCleared = status === 'CLEARED';
            const isActive = status === 'AVAILABLE';
            const isLevelLocked = status === 'LEVEL_LOCKED';

            return (
              <div key={stage.id} className="relative flex items-center gap-3">
                {/* Vertical connector line */}
                {idx < visibleStages.length - 1 && (
                  <div
                    className={`absolute left-6 -top-3 w-0.5 h-3.5 ${
                      isCleared ? 'bg-emerald-400/70' : 'bg-slate-600/70'
                    }`}
                    aria-hidden="true"
                  />
                )}

                <button
                  type="button"
                  onClick={() => onOpenFormation(stage.id)}
                  aria-label={`Stage ${stage.id} ${stage.name} ${
                    isActive
                      ? 'Active'
                      : isCleared
                      ? 'Cleared'
                      : isLevelLocked
                      ? `Locked Req. Lv.${stage.minPlayerLevel}`
                      : `Locked Req. Lv.${stage.minPlayerLevel}`
                  }`}
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-all min-h-[52px] ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-sky-900/60 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.28)] active:scale-[0.98]'
                      : isCleared
                      ? 'bg-emerald-950/35 border-emerald-500/35 text-emerald-100/80'
                      : isLevelLocked
                      ? 'bg-rose-950/30 border-rose-400/45 text-rose-100/90'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-amber-400 border-amber-100 text-slate-950 animate-pulse'
                          : isCleared
                          ? 'bg-emerald-600 border-emerald-300 text-white'
                          : isLevelLocked
                          ? 'bg-rose-950 border-rose-400 text-rose-300'
                          : 'bg-slate-800 border-slate-600 text-slate-400'
                      }`}
                    >
                      {isActive ? (
                        <Swords className="w-4 h-4" />
                      ) : isCleared ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-extrabold text-xs text-white tabular-nums">
                          {stage.id}
                        </span>
                        <span className="font-display font-bold text-xs truncate">
                          {stage.name}
                        </span>
                        {stage.isElite && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-600/90 border border-rose-300/70 text-[9px] font-display font-black text-white">
                            <Crown className="w-2.5 h-2.5" /> BOSS
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300/85 tabular-nums">
                        Req. Lv.{stage.minPlayerLevel} · Enemy {formatPowerCompact(stage.enemyPower)} · +
                        {stage.rewards.diamonds} Gems
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 text-[10px] font-display font-extrabold px-2 py-0.5 rounded tabular-nums ${
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : isCleared
                        ? 'text-emerald-300'
                        : isLevelLocked
                        ? 'bg-rose-950/90 border border-rose-400/60 text-rose-200'
                        : 'text-slate-500'
                    }`}
                  >
                    {isActive
                      ? 'Ready'
                      : isCleared
                      ? 'Cleared'
                      : isLevelLocked
                      ? `Req. Lv.${stage.minPlayerLevel}`
                      : `Lv.${stage.minPlayerLevel}+`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animated Diorama Preview & Controls (Bottom Half) */}
      <div className="relative shrink-0 h-[218px] border-t-2 border-amber-400/45 overflow-hidden flex flex-col justify-between">
        <img
          src={ASSETS.arenaBattlefieldBg}
          alt="Coastal battlefield terrain"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/55 pointer-events-none" />

        {/* Top Diorama Label */}
        <div className="relative z-10 flex items-center justify-between px-3 pt-2">
          <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-sky-400/40 text-[10px] font-display font-bold text-sky-100">
            Idle Skirmish · {currentStage.id}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-rose-400/40 text-[10px] font-display font-bold text-rose-200 tabular-nums">
            {currentStage.enemies.length} Hostiles Ahead
          </span>
        </div>

        {/* Squad vs Enemy Idle Clash Diorama */}
        <div className="relative z-10 flex items-center justify-between px-4 py-1">
          {/* Player Active Squad */}
          <div className="flex items-center -space-x-2">
            {deployedHeroes.slice(0, 3).map((hero, idx) => (
              <div
                key={hero.id}
                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 border-sky-300 shadow-lg transition-transform duration-300 ${
                  dioramaTick % 2 === idx % 2 ? 'translate-x-1 -translate-y-0.5' : ''
                }`}
              >
                <img
                  src={hero.image}
                  alt={hero.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            ))}
          </div>

          {/* Floating Clash Indicator & Damage */}
          <div className="relative flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-300/70 flex items-center justify-center animate-pulse">
              <Zap className="w-4 h-4 text-amber-300" />
            </div>
            <span
              className="mt-0.5 font-display font-black text-xs text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tabular-nums"
              key={dioramaTick}
            >
              {dioramaTick % 2 === 0 ? '-1,240' : 'Crit! -2,490'}
            </span>
          </div>

          {/* Current Stage Enemy Squad */}
          <div className="flex items-center -space-x-2">
            {currentStage.enemies.slice(0, 3).map((enemy, idx) => (
              <div
                key={enemy.id}
                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 ${
                  enemy.isBoss ? 'border-rose-400 ring-2 ring-amber-400/60' : 'border-rose-300/80'
                } shadow-lg transition-transform duration-300 ${
                  dioramaTick % 2 !== idx % 2 ? '-translate-x-1 -translate-y-0.5' : ''
                }`}
              >
                <img
                  src={enemy.image}
                  alt={enemy.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Action Row: AFK Reward Chest | Challenge CTA | Auto Toggle */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-3 pb-2.5">
          {/* AFK Reward Chest (Bottom Left) */}
          <button
            type="button"
            onClick={() => setAfkModalOpen(true)}
            aria-label="Open AFK Reward Chest"
            className="relative flex items-center gap-2 min-h-[46px] px-2.5 rounded-xl bg-slate-950/90 border border-amber-300/70 text-left shadow-lg active:scale-95 transition-transform"
          >
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-b from-amber-400 to-orange-600 flex items-center justify-center text-slate-950 shrink-0">
              <Gift className="w-4 h-4" />
              {stageProgress.afkReward.accumulatedGold > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
              )}
            </div>
            <div className="leading-tight">
              <span className="block font-display font-extrabold text-[10.5px] text-amber-200 whitespace-nowrap">
                AFK Reward
              </span>
              <span className="block font-display font-bold text-[10px] text-sky-200 tabular-nums whitespace-nowrap">
                {isAfkFull ? '24h Full!' : `${afkCapPct}% · ${afkTimerLabel.slice(0, 5)}`}
              </span>
            </div>
          </button>

          {/* Primary Challenge / Challenge Elite / Level-Locked CTA */}
          <button
            type="button"
            onClick={() => onOpenFormation(currentStage.id)}
            className={`flex-1 min-h-[46px] px-3 rounded-xl border-2 font-display font-black text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform whitespace-nowrap ${
              currentStageEntry.allowed
                ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 border-amber-100 text-slate-950 shadow-[0_6px_18px_rgba(245,158,11,0.45)]'
                : currentStageEntry.status === 'CLEARED'
                ? 'bg-emerald-950/90 border-emerald-400/60 text-emerald-200'
                : 'bg-slate-900/95 border-rose-400/70 text-rose-200'
            }`}
          >
            {currentStageEntry.allowed ? (
              <>
                <Swords className="w-4 h-4 shrink-0" />
                <span>{currentStage.isElite ? 'Challenge Elite' : 'Challenge'}</span>
              </>
            ) : currentStageEntry.status === 'CLEARED' ? (
              <>
                <Check className="w-4 h-4 shrink-0" />
                <span>Story Cleared</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 shrink-0" />
                <span>Reach Lv.{currentStage.minPlayerLevel}</span>
              </>
            )}
          </button>

          {/* Auto Toggle Button */}
          <button
            type="button"
            onClick={toggleAutoBattle}
            aria-pressed={autoBattle}
            aria-label="Toggle Auto Stage Advance"
            className={`min-h-[46px] min-w-[58px] px-2.5 rounded-xl border font-display font-extrabold text-[11px] flex flex-col items-center justify-center transition-all active:scale-95 ${
              autoBattle
                ? 'bg-emerald-500/25 border-emerald-300 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-slate-950/90 border-slate-600 text-slate-300'
            }`}
          >
            <Play className="w-3.5 h-3.5 mb-0.5" />
            <span>{autoBattle ? 'Auto On' : 'Auto'}</span>
          </button>
        </div>
      </div>

      {/* AFK Reward Claim Modal */}
      {afkModalOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="afk-modal-title"
        >
          <div className="w-full max-w-[340px] rounded-2xl bg-gradient-to-b from-[#162952] to-[#0B152C] border-2 border-amber-400/75 p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-300" />
                <h2 id="afk-modal-title" className="font-display font-extrabold text-base text-amber-100">
                  AFK Sanctuary Chest
                </h2>
              </div>
              <span className="text-xs font-display font-bold text-sky-200 tabular-nums">
                {afkCapPct}% Cap
              </span>
            </div>

            {/* 24-Hour AFK Cap Timer Bar */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-400/35 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] tabular-nums">
                <span className="text-slate-300 font-medium">Elapsed AFK Time</span>
                <span className="font-display font-extrabold text-amber-200">
                  {afkTimerLabel} / 24:00:00
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
                <div
                  className={`h-full transition-[width] duration-300 ${
                    isAfkFull
                      ? 'bg-gradient-to-r from-rose-400 to-amber-300'
                      : 'bg-gradient-to-r from-sky-400 to-amber-400'
                  }`}
                  style={{ width: `${afkCapPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {isAfkFull
                  ? '24-hour maximum reached — accumulation paused until claimed.'
                  : 'Accumulates up to 24:00:00 max capacity.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/75 border border-sky-400/30 space-y-2 text-xs tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Accrued Gold</span>
                <span className="inline-flex items-center gap-1 font-display font-extrabold text-amber-200">
                  <GoldCoinIcon className="w-4 h-4" />
                  +{formatGoldOrDiamond(stageProgress.afkReward.accumulatedGold)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Accrued Player EXP</span>
                <span className="inline-flex items-center gap-1 font-display font-extrabold text-sky-200">
                  <Sparkles className="w-4 h-4 text-sky-300" />
                  +{formatGoldOrDiamond(stageProgress.afkReward.accumulatedExp)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAfkModalOpen(false)}
                className="min-h-[42px] rounded-xl bg-slate-800 border border-slate-600 text-xs font-display font-bold text-slate-200 active:scale-95"
              >
                Close
              </button>
              <button
                type="button"
                disabled={
                  stageProgress.afkReward.accumulatedGold <= 0 &&
                  stageProgress.afkReward.accumulatedExp <= 0
                }
                onClick={() => {
                  claimAfk();
                  setAfkModalOpen(false);
                }}
                className="min-h-[42px] rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 text-xs font-display font-extrabold disabled:opacity-45 active:scale-95"
              >
                Claim All
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
