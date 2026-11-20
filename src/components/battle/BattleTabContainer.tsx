import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getNextStageId, getStageById } from '../../data/stagesData';
import { BattleSimulationResult } from '../../types/game';
import { canEnterStoryStage } from '../../utils/storyProgression';
import { BattleResultModal } from './BattleResultModal';
import { CombatArenaScreen } from './CombatArenaScreen';
import { FormationScreen } from './FormationScreen';
import { StageMapScreen } from './StageMapScreen';

export const BattleTabContainer: React.FC = () => {
  const {
    state,
    navState,
    goAdventureHub,
    openStoryFormationForStage,
    backToStoryMapFromFormation,
    startStoryBattleForStage,
    completeStoryBattleResult,
    exitStoryBattleToMap,
    completeBattleVictory,
    setActiveTab,
    showToast,
  } = useGame();

  const [battleResult, setBattleResult] = useState<BattleSimulationResult | null>(null);

  useEffect(() => {
    if (navState.adventureRoute !== 'result') {
      setBattleResult(null);
    }
  }, [navState.adventureRoute]);

  const stage = useMemo(
    () => getStageById(navState.selectedStageId ?? state.stageProgress.currentStage),
    [navState.selectedStageId, state.stageProgress.currentStage]
  );

  const handleCombatComplete = (result: BattleSimulationResult) => {
    if (result.victory && result.loot) {
      completeBattleVictory(stage.id, result.loot);
    }
    setBattleResult(result);
    completeStoryBattleResult();
  };

  const handleContinueFromResult = () => {
    const wasVictory = Boolean(battleResult?.victory);
    const nextId = getNextStageId(stage.id);
    setBattleResult(null);

    if (wasVictory && state.autoBattle && nextId) {
      const check = canEnterStoryStage(state, nextId);
      if (check.allowed) {
        startStoryBattleForStage(nextId);
        return;
      }
      if (check.message) {
        showToast(check.message);
      }
    }
    exitStoryBattleToMap();
  };

  const handleExitBattle = () => {
    setBattleResult(null);
    exitStoryBattleToMap();
  };

  const showBattleArena =
    navState.adventureRoute === 'battle' || navState.adventureRoute === 'result';

  return (
    <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
      {navState.adventureRoute === 'story-map' && (
        <>
          <div className="shrink-0 px-3 py-1.5 bg-[#081022] border-b border-sky-400/25 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goAdventureHub}
              className="inline-flex items-center gap-1.5 min-h-[32px] px-2.5 rounded-lg bg-slate-900 border border-slate-600 text-[11px] font-display font-bold text-sky-100 hover:border-amber-300 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Adventure Hub</span>
            </button>
            <span className="text-[10.5px] font-display font-extrabold text-amber-200 uppercase tracking-wider">
              Story Campaign
            </span>
          </div>
          <StageMapScreen onOpenFormation={openStoryFormationForStage} />
        </>
      )}

      {navState.adventureRoute === 'formation' && (
        <FormationScreen
          stageId={stage.id}
          onBack={backToStoryMapFromFormation}
          onStartCombat={() => startStoryBattleForStage(stage.id)}
        />
      )}

      {showBattleArena && (
        <CombatArenaScreen
          key={navState.activeBattleSessionId ?? stage.id}
          stage={stage}
          onExit={handleExitBattle}
          onComplete={handleCombatComplete}
        />
      )}

      {navState.adventureRoute === 'result' && battleResult && (
        <BattleResultModal
          stage={stage}
          result={battleResult}
          onContinue={handleContinueFromResult}
          onGoToTab={(tab) => {
            setBattleResult(null);
            exitStoryBattleToMap();
            setActiveTab(tab);
          }}
        />
      )}
    </div>
  );
};
