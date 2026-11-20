import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Flame,
  Globe,
  Lock,
  Map,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trees,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ASSETS } from '../../data/gameSeed';
import { ADVENTURE_MODES } from '../../data/phase3Data';
import { getStageById } from '../../data/stagesData';
import { AdventureModeId } from '../../types/game';
import {
  formatGoldOrDiamond,
  formatPowerCompact,
  isAdventureModeUnlocked,
} from '../../utils/gameLogic';
import { BattleTabContainer } from '../battle/BattleTabContainer';
import { DiamondGemIcon, GoldCoinIcon, PowerEmblemIcon } from '../RpgIcons';

function getModeIcon(id: AdventureModeId) {
  switch (id) {
    case 'ruins-battlefield':
      return Shield;
    case 'dragon-ball-showdown':
      return Sparkles;
    case 'trials':
      return Flame;
    case 'arena':
      return Trophy;
    case 'planet-clash':
      return Globe;
    case 'coop-team':
      return Users;
    case 'legendary-battle':
      return Crown;
    case 'lost-forest':
      return Trees;
    case 'world-boss':
      return Skull;
    case 'time-rift':
      return Clock;
  }
}

export const AdventureTabScreen: React.FC = () => {
  const {
    state,
    navState,
    teamPower,
    openStoryMapInAdventure,
    selectAdventureModeId,
    runAdventureMode,
    showToast,
  } = useGame();
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);

  const selectedMode = useMemo(
    () => ADVENTURE_MODES.find((m) => m.id === navState.selectedModeId) ?? null,
    [navState.selectedModeId]
  );

  const currentStage = useMemo(
    () => getStageById(state.stageProgress.currentStage),
    [state.stageProgress.currentStage]
  );

  // When Adventure is in a Story sub-route, render the Story controller
  if (navState.adventureRoute !== 'hub') {
    return <BattleTabContainer />;
  }

  const unlockedCount = ADVENTURE_MODES.filter((m) =>
    isAdventureModeUnlocked(m, state)
  ).length;

  return (
    <section
      className="relative flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0E1E3E] via-[#0B1730] to-[#081022]"
      aria-label="Adventure Hub"
    >
      {/* Header */}
      <div className="shrink-0 px-3 pt-2.5 pb-2 bg-[#0B162C]/95 border-b border-amber-400/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Compass className="w-4 h-4 text-amber-300 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-sm text-white truncate">
              Adventure Hub
            </h1>
            <p className="text-[10px] text-sky-200/85 tabular-nums">
              Main Story &amp; 10 Challenge Zones · {unlockedCount}/10 Unlocked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/80 border border-amber-400/35 shrink-0">
          <PowerEmblemIcon className="w-3.5 h-3.5" />
          <span className="font-display font-extrabold text-[11px] text-amber-200 tabular-nums">
            {formatPowerCompact(teamPower)}
          </span>
        </div>
      </div>

      {/* Scrollable Hub Body */}
      <div className="relative flex-1 min-h-0 overflow-y-auto rpg-scroll px-3 py-3 space-y-3 bg-[radial-gradient(circle_at_50%_15%,rgba(56,189,248,0.14),transparent_65%)]">
        {/* Main Story Campaign Entry Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/75 bg-slate-950/90 shadow-xl">
          <img
            src={ASSETS.arenaBattlefieldBg}
            alt="Coastal Sanctuary Story Campaign"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-45 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A142B]/95 via-[#0E1E40]/85 to-[#0A142B]/70 pointer-events-none" />
          <div className="relative z-10 p-3 flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <Map className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-[10px] font-display font-black uppercase tracking-wider text-amber-300">
                  Main Story Campaign
                </span>
              </div>
              <h2 className="font-display font-extrabold text-sm text-white truncate">
                Main Story 1 · Coastal Sanctuary
              </h2>
              <p className="text-[10.5px] text-sky-100 tabular-nums truncate">
                Active Stage:{' '}
                <span className="font-bold text-amber-200">
                  {currentStage.id} ({currentStage.name})
                </span>
                {state.player.level < currentStage.minPlayerLevel && (
                  <span className="ml-1 text-rose-300 font-bold">
                    · Req. Lv.{currentStage.minPlayerLevel}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-emerald-200/90 font-display font-bold tabular-nums">
                {state.stageProgress.questTracker.title} ({state.stageProgress.questTracker.current}/
                {state.stageProgress.questTracker.target})
              </p>
            </div>

            <button
              type="button"
              onClick={openStoryMapInAdventure}
              className="shrink-0 min-h-[44px] px-3.5 rounded-xl bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 border-2 border-amber-100 text-slate-950 font-display font-black text-xs flex items-center gap-1.5 shadow-[0_6px_18px_rgba(245,158,11,0.45)] active:scale-95"
            >
              <Swords className="w-4 h-4 shrink-0" />
              <span>Story Map</span>
            </button>
          </div>
        </div>

        {/* Challenge Modes Section Header */}
        <div className="flex items-center justify-between px-0.5">
          <h2 className="font-display font-extrabold text-xs text-sky-200 uppercase tracking-wider">
            Challenge Modes (10)
          </h2>
          <span className="text-[10px] text-slate-400 tabular-nums">
            {unlockedCount}/10 Available
          </span>
        </div>

        {/* Connected Node/Card Map for all 10 Modes */}
        <div className="relative space-y-2.5">
          {ADVENTURE_MODES.map((mode, idx) => {
            const Icon = getModeIcon(mode.id);
            const unlocked = isAdventureModeUnlocked(mode, state);
            const used = state.adventure.dailyAttempts[mode.id] ?? 0;
            const remaining = Math.max(0, mode.dailyLimit - used);
            const cleared = state.adventure.clearedModes.includes(mode.id);

            return (
              <div key={mode.id} className="relative pl-5">
                {/* Connected Node Path Spine */}
                {idx < ADVENTURE_MODES.length - 1 && (
                  <div
                    className={`absolute left-[9px] top-7 -bottom-4 w-0.5 ${
                      unlocked ? 'bg-amber-400/60' : 'bg-slate-700'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`absolute left-0 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-display font-black tabular-nums ${
                    unlocked
                      ? cleared
                        ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                        : 'bg-amber-400 border-amber-100 text-slate-950'
                      : 'bg-slate-800 border-slate-600 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!unlocked) {
                      showToast(`${mode.name} Locked · ${mode.unlockRequirementLabel}`);
                      return;
                    }
                    setLastOutcome(null);
                    selectAdventureModeId(mode.id);
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    unlocked
                      ? 'bg-gradient-to-r from-[#142750]/95 to-[#0D1A36]/95 border-sky-400/45 hover:border-amber-300 shadow-md active:scale-[0.98]'
                      : 'bg-slate-950/70 border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                        unlocked
                          ? 'bg-amber-400/15 border-amber-300/60 text-amber-300'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      {unlocked ? (
                        <Icon className="w-5 h-5" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-extrabold text-xs text-white truncate">
                          {mode.name}
                        </span>
                        {cleared && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300 truncate">
                        {mode.subtitle}
                      </p>
                      <p className="text-[9.5px] font-display font-bold mt-0.5 text-amber-200/90 truncate">
                        {unlocked ? mode.rewardSummary : `Unlock: ${mode.unlockRequirementLabel}`}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {unlocked ? (
                      <>
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-display font-black text-[10px]">
                          Enter
                        </span>
                        <span className="block mt-0.5 text-[9.5px] text-sky-200 tabular-nums">
                          {remaining}/{mode.dailyLimit} Left
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[9.5px] font-display font-bold text-slate-400">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Playable Expedition / Mini-Encounter Modal (preserved direct-run behavior) */}
      {selectedMode && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="adventure-mode-title"
        >
          <div className="w-full max-w-[350px] rounded-2xl bg-gradient-to-b from-[#172B56] to-[#0B152C] border-2 border-amber-400/75 overflow-hidden shadow-2xl">
            <div className="relative h-24 w-full overflow-hidden">
              <img
                src={ASSETS.arenaBattlefieldBg}
                alt={selectedMode.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#122246] via-slate-950/35 to-transparent" />
              <button
                type="button"
                onClick={() => selectAdventureModeId(null)}
                aria-label="Close Expedition Modal"
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg bg-slate-950/80 border border-slate-500 text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-3">
                <h2
                  id="adventure-mode-title"
                  className="font-display font-black text-base text-white drop-shadow"
                >
                  {selectedMode.name}
                </h2>
              </div>
            </div>

            <div className="p-3.5 space-y-3 text-xs">
              <p className="text-slate-200 leading-snug">{selectedMode.subtitle}</p>

              <div className="p-2.5 rounded-xl bg-slate-950/75 border border-rose-400/35 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Target Guardian</span>
                  <span className="font-display font-bold text-rose-200">
                    {selectedMode.enemyName}
                  </span>
                </div>
                <span className="font-display font-extrabold text-amber-200 tabular-nums">
                  Power {formatPowerCompact(selectedMode.enemyPower)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/75 border border-sky-400/35 space-y-1.5">
                <span className="font-display font-bold text-[11px] text-amber-200 block">
                  Clear Rewards
                </span>
                <div className="flex items-center flex-wrap gap-3 text-[11px] font-display font-bold tabular-nums">
                  <span className="inline-flex items-center gap-1 text-amber-200">
                    <GoldCoinIcon className="w-3.5 h-3.5" />+{formatGoldOrDiamond(selectedMode.rewards.gold)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-cyan-200">
                    <DiamondGemIcon className="w-3.5 h-3.5" />+{selectedMode.rewards.diamonds}
                  </span>
                  {selectedMode.rewards.itemName && (
                    <span className="text-emerald-200">
                      +{selectedMode.rewards.itemQty} {selectedMode.rewards.itemName}
                    </span>
                  )}
                </div>
              </div>

              {lastOutcome && (
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-400/60 text-emerald-100 font-display font-bold text-center">
                  {lastOutcome}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectAdventureModeId(null)}
                  className="min-h-[42px] rounded-xl bg-slate-800 border border-slate-600 text-slate-200 font-display font-bold"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={
                    (state.adventure.dailyAttempts[selectedMode.id] ?? 0) >=
                    selectedMode.dailyLimit
                  }
                  onClick={() => {
                    const res = runAdventureMode(selectedMode.id);
                    if (res.success) {
                      setLastOutcome(res.message);
                    }
                  }}
                  className="min-h-[42px] rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 font-display font-black flex items-center justify-center gap-1.5 disabled:opacity-45 active:scale-95"
                >
                  <Swords className="w-4 h-4" />
                  <span>Challenge Raid</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
