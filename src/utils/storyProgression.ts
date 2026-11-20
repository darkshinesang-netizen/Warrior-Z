import { getNextStageId, STORY_STAGES } from '../data/stagesData';
import { GameState, StageDef, StageProgress } from '../types/game';

export type StoryStageStatus =
  | 'CLEARED'
  | 'AVAILABLE'
  | 'LEVEL_LOCKED'
  | 'SEQUENCE_LOCKED'
  | 'INVALID';

export interface StoryStageEntryCheck {
  allowed: boolean;
  status: StoryStageStatus;
  stage?: StageDef;
  requiredLevel?: number;
  message?: string;
}

export function findStoryStage(stageId: string): StageDef | undefined {
  return STORY_STAGES.find((s) => s.id === stageId);
}

export function getStoryStageIndex(stageId: string): number {
  return STORY_STAGES.findIndex((s) => s.id === stageId);
}

/**
 * Computes canonical forward-only status for a Story stage:
 * - CLEARED: already in completedStages (never replayable, even if 1-10 is also currentStage)
 * - AVAILABLE: is currentStage AND player.level >= stage.minPlayerLevel
 * - LEVEL_LOCKED: is currentStage BUT player.level < stage.minPlayerLevel
 * - SEQUENCE_LOCKED: valid stage not yet reached sequentially
 * - INVALID: unknown stageId
 */
export function getStoryStageStatus(
  state: Pick<GameState, 'player' | 'stageProgress'>,
  stageId: string
): StoryStageStatus {
  const stage = findStoryStage(stageId);
  if (!stage) return 'INVALID';

  if (state.stageProgress.completedStages.includes(stageId)) {
    return 'CLEARED';
  }

  if (stageId !== state.stageProgress.currentStage) {
    return 'SEQUENCE_LOCKED';
  }

  if (state.player.level < stage.minPlayerLevel) {
    return 'LEVEL_LOCKED';
  }

  return 'AVAILABLE';
}

export function canEnterStoryStage(
  state: Pick<GameState, 'player' | 'stageProgress'>,
  stageId: string
): StoryStageEntryCheck {
  const stage = findStoryStage(stageId);
  const status = getStoryStageStatus(state, stageId);

  switch (status) {
    case 'AVAILABLE':
      return {
        allowed: true,
        status,
        stage,
      };
    case 'CLEARED':
      return {
        allowed: false,
        status,
        stage,
        message: `Stage ${stageId} is already cleared (cannot replay)`,
      };
    case 'LEVEL_LOCKED':
      return {
        allowed: false,
        status,
        stage,
        requiredLevel: stage?.minPlayerLevel,
        message: `Reach Player Lv.${stage?.minPlayerLevel} to unlock Stage ${stageId}`,
      };
    case 'SEQUENCE_LOCKED':
      return {
        allowed: false,
        status,
        stage,
        requiredLevel: stage?.minPlayerLevel,
        message: `Clear Stage ${state.stageProgress.currentStage} to unlock ${stageId}`,
      };
    case 'INVALID':
    default:
      return {
        allowed: false,
        status: 'INVALID',
        message: `Stage ${stageId} does not exist`,
      };
  }
}

/**
 * Sanitizes Story progression on save load or state normalization:
 * - Deduplicates & restricts completedStages to valid stage IDs in canonical order.
 * - Ensures currentStage is always a valid stage ID.
 * - Prevents backwards regression: currentStage can never point behind or onto an
 *   already-cleared stage while later stages remain uncompleted.
 */
export function normalizeStoryStageProgress(
  stageProgress: Pick<StageProgress, 'currentStage' | 'completedStages'>
): { currentStage: string; completedStages: string[] } {
  const rawCompleted = Array.isArray(stageProgress.completedStages)
    ? stageProgress.completedStages
    : [];
  const completedSet = new Set(
    rawCompleted.filter((id) => STORY_STAGES.some((s) => s.id === id))
  );

  const completedStages = STORY_STAGES.filter((s) => completedSet.has(s.id)).map(
    (s) => s.id
  );

  // Compute minimum valid sequential frontier after the highest completed stage
  let highestCompletedIdx = -1;
  for (const id of completedStages) {
    const idx = getStoryStageIndex(id);
    if (idx > highestCompletedIdx) highestCompletedIdx = idx;
  }

  const lastStageIdx = STORY_STAGES.length - 1;
  const minFrontierIdx =
    highestCompletedIdx >= lastStageIdx ? lastStageIdx : highestCompletedIdx + 1;

  const savedCurrentIdx = getStoryStageIndex(stageProgress.currentStage);

  // Preserve saved currentStage if valid and at/ahead of frontier (or already completed cap at 1-10)
  const resolvedIdx =
    savedCurrentIdx >= minFrontierIdx ? savedCurrentIdx : minFrontierIdx;

  return {
    currentStage: STORY_STAGES[resolvedIdx].id,
    completedStages,
  };
}

/**
 * Resolves the next currentStage pointer after winning `clearedStageId`,
 * enforcing forward-only progression and never moving backwards.
 */
export function getNextForwardStageId(
  currentStageId: string,
  clearedStageId: string
): string {
  const nextId = getNextStageId(clearedStageId);
  if (!nextId) {
    const clearedIdx = getStoryStageIndex(clearedStageId);
    const currentIdx = getStoryStageIndex(currentStageId);
    return currentIdx >= clearedIdx && currentIdx !== -1
      ? currentStageId
      : clearedStageId;
  }
  const nextIdx = getStoryStageIndex(nextId);
  const currentIdx = getStoryStageIndex(currentStageId);
  if (currentIdx > nextIdx) {
    return currentStageId;
  }
  return nextId;
}
