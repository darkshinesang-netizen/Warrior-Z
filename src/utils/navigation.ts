import { AdventureRoute, AppNavigationState, GameState, PrimaryTab } from '../types/game';
import { canEnterStoryStage } from './storyProgression';

export const PRIMARY_TAB_ORDER: readonly PrimaryTab[] = [
  'home',
  'adventure',
  'adventurers',
  'summon',
  'growth',
  'bag',
] as const;

export function createInitialNavigationState(): AppNavigationState {
  return {
    primaryTab: 'home',
    adventureRoute: 'hub',
    selectedStageId: null,
    selectedModeId: null,
    activeBattleSessionId: null,
  };
}

/**
 * Transitions between the 6 primary bottom-nav tabs.
 * Safety rule: if an active Story battle or post-battle result overlay is open
 * when switching away from Adventure, safely cancel/close that encounter back to
 * Story Map with no invented rewards so returning to Adventure never duplicates
 * or restarts combat unexpectedly.
 */
export function selectPrimaryTab(
  current: AppNavigationState,
  nextTab: PrimaryTab
): AppNavigationState {
  if (current.primaryTab === nextTab) {
    return current;
  }

  let nextAdventureRoute: AdventureRoute = current.adventureRoute;
  let nextBattleSessionId = current.activeBattleSessionId;

  if (
    current.primaryTab === 'adventure' &&
    nextTab !== 'adventure' &&
    (current.adventureRoute === 'battle' || current.adventureRoute === 'result')
  ) {
    nextAdventureRoute = 'story-map';
    nextBattleSessionId = null;
  }

  return {
    ...current,
    primaryTab: nextTab,
    adventureRoute: nextAdventureRoute,
    activeBattleSessionId: nextBattleSessionId,
  };
}

export function goToAdventureHub(current: AppNavigationState): AppNavigationState {
  return {
    ...current,
    primaryTab: 'adventure',
    adventureRoute: 'hub',
    activeBattleSessionId: null,
  };
}

export function openAdventureStoryMap(
  current: AppNavigationState
): AppNavigationState {
  return {
    ...current,
    primaryTab: 'adventure',
    adventureRoute: 'story-map',
    selectedModeId: null,
    activeBattleSessionId: null,
  };
}

export function openAdventureFormation(
  current: AppNavigationState,
  stageId: string
): AppNavigationState {
  return {
    ...current,
    primaryTab: 'adventure',
    adventureRoute: 'formation',
    selectedStageId: stageId,
    activeBattleSessionId: null,
  };
}

export function backFromFormation(
  current: AppNavigationState
): AppNavigationState {
  return {
    ...current,
    primaryTab: 'adventure',
    adventureRoute: 'story-map',
    activeBattleSessionId: null,
  };
}

export function startAdventureBattle(
  current: AppNavigationState,
  stageId: string,
  sessionId: string
): AppNavigationState {
  return {
    ...current,
    primaryTab: 'adventure',
    adventureRoute: 'battle',
    selectedStageId: stageId,
    activeBattleSessionId: sessionId,
  };
}

export function completeAdventureBattle(
  current: AppNavigationState
): AppNavigationState {
  return {
    ...current,
    primaryTab: 'adventure',
    adventureRoute: 'result',
  };
}

export function exitAdventureBattleToStoryMap(
  current: AppNavigationState
): AppNavigationState {
  return {
    ...current,
    primaryTab: 'adventure',
    adventureRoute: 'story-map',
    activeBattleSessionId: null,
  };
}

export function setSelectedAdventureMode(
  current: AppNavigationState,
  modeId: string | null
): AppNavigationState {
  return {
    ...current,
    selectedModeId: modeId,
  };
}

export function tryOpenAdventureFormation(
  current: AppNavigationState,
  gameState: Pick<GameState, 'player' | 'stageProgress'>,
  stageId: string
): { nav: AppNavigationState; allowed: boolean; message?: string } {
  const check = canEnterStoryStage(gameState, stageId);
  if (!check.allowed) {
    return {
      nav: current,
      allowed: false,
      message: check.message,
    };
  }
  return {
    nav: openAdventureFormation(current, stageId),
    allowed: true,
  };
}

export function tryStartAdventureBattle(
  current: AppNavigationState,
  gameState: Pick<GameState, 'player' | 'stageProgress'>,
  stageId: string,
  sessionId: string
): { nav: AppNavigationState; allowed: boolean; message?: string } {
  const check = canEnterStoryStage(gameState, stageId);
  if (!check.allowed) {
    return {
      nav: {
        ...current,
        primaryTab: 'adventure',
        adventureRoute: 'story-map',
        activeBattleSessionId: null,
      },
      allowed: false,
      message: check.message,
    };
  }
  return {
    nav: startAdventureBattle(current, stageId, sessionId),
    allowed: true,
  };
}
