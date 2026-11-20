import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../data/gameSeed';
import { getStageById, STORY_STAGES } from '../data/stagesData';
import { GameState } from '../types/game';
import {
  applyBattleVictoryToState,
  buildEnemyCombatUnits,
  buildPlayerCombatUnits,
  simulateBattle,
} from './combatEngine';
import {
  claimAfkRewards,
  completeAdventureModeRun,
  sanitizeLoadedState,
  useBagItem,
} from './gameLogic';
import {
  createInitialNavigationState,
  openAdventureStoryMap,
  tryOpenAdventureFormation,
  tryStartAdventureBattle,
} from './navigation';
import {
  canEnterStoryStage,
  getStoryStageStatus,
} from './storyProgression';

function createFreshStage11State(): GameState {
  const base = createInitialGameState();
  return {
    ...base,
    player: {
      ...base.player,
      level: 1,
      exp: 0,
      maxExp: 500,
    },
    stageProgress: {
      ...base.stageProgress,
      currentStage: '1-1',
      completedStages: [],
      questTracker: {
        ...base.stageProgress.questTracker,
        current: 0,
        target: 10,
        bonusClaimed: false,
      },
    },
  };
}

test('every Story stage defines a valid positive monotonic minPlayerLevel', () => {
  assert.equal(STORY_STAGES.length, 10);
  let prevReq = 1;
  for (const stage of STORY_STAGES) {
    assert.equal(typeof stage.minPlayerLevel, 'number');
    assert.ok(stage.minPlayerLevel >= prevReq, `${stage.id} minPlayerLevel must not decrease`);
    prevReq = stage.minPlayerLevel;
  }
});

test('Phase 1B Cases A-J: sequential progression, level gate lock/auto-unlock via valid EXP, non-replayable cleared stages, and reload persistence', () => {
  // Start fresh at Stage 1-1 with Player Lv.1 (0/500 EXP)
  let state = createFreshStage11State();
  let nav = openAdventureStoryMap(createInitialNavigationState());

  assert.equal(getStoryStageStatus(state, '1-1'), 'AVAILABLE');
  assert.equal(getStoryStageStatus(state, '1-2'), 'SEQUENCE_LOCKED');

  // Case A: Player wins Stage 1-1
  const stage11 = getStageById('1-1');
  const win11 = simulateBattle(
    buildPlayerCombatUnits(state.heroes, state.formation),
    buildEnemyCombatUnits(stage11).map((e) => ({ ...e, hp: 50, maxHp: 50, atk: 5 })),
    stage11,
    0,
    10,
    () => 0.5
  );
  assert.equal(win11.victory, true);
  assert.ok(win11.loot);

  state = applyBattleVictoryToState(state, '1-1', win11.loot!);

  // Case B: Stage 1-1 becomes permanently cleared; currentStage advances to 1-2
  assert.deepEqual(state.stageProgress.completedStages, ['1-1']);
  assert.equal(state.stageProgress.currentStage, '1-2');
  assert.equal(state.player.level, 1); // +120 EXP -> 120/500
  assert.equal(getStoryStageStatus(state, '1-1'), 'CLEARED');

  // Case C: Stage 1-2 remains locked when player level (1) < required level (2)
  const stage12 = getStageById('1-2');
  assert.equal(stage12.minPlayerLevel, 2);
  assert.equal(getStoryStageStatus(state, '1-2'), 'LEVEL_LOCKED');

  // Case D: Attempting to enter Stage 1-2 (Formation or Battle) is rejected cleanly without mutating resources or progress
  const goldBeforeReject = state.player.gold;
  const diamondsBeforeReject = state.player.diamonds;
  const formAttempt = tryOpenAdventureFormation(nav, state, '1-2');
  assert.equal(formAttempt.allowed, false);
  assert.equal(formAttempt.nav.adventureRoute, 'story-map');
  assert.match(formAttempt.message ?? '', /Lv\.2/);

  const battleAttempt = tryStartAdventureBattle(nav, state, '1-2', 'illegal-12');
  assert.equal(battleAttempt.allowed, false);
  assert.equal(battleAttempt.nav.adventureRoute, 'story-map');
  assert.equal(battleAttempt.nav.activeBattleSessionId, null);

  // Also verify direct victory injection for level-locked 1-2 is rejected
  const victoryInject = applyBattleVictoryToState(state, '1-2', win11.loot!);
  assert.equal(victoryInject, state);
  assert.equal(state.player.gold, goldBeforeReject);
  assert.equal(state.player.diamonds, diamondsBeforeReject);
  assert.deepEqual(state.stageProgress.completedStages, ['1-1']);
  assert.equal(state.stageProgress.currentStage, '1-2');

  // Case E & F: Player gains EXP from other valid game systems (AFK Claim + Master Bento) to reach Lv.2
  // 120 (from 1-1) + 320 (AFK) = 440/500 (still Lv.1); + 150 (Master Bento) = 590 -> Lv.2 (90/700)!
  state = claimAfkRewards(state);
  assert.equal(state.player.level, 1);
  assert.equal(getStoryStageStatus(state, '1-2'), 'LEVEL_LOCKED');

  const bentoRes = useBagItem(state, 'stamina-bento');
  assert.equal(bentoRes.success, true);
  state = bentoRes.nextState;
  assert.equal(state.player.level, 2);

  // Case G: Stage 1-2 becomes available automatically without replaying 1-1 or claiming unlock reward
  assert.equal(getStoryStageStatus(state, '1-2'), 'AVAILABLE');
  assert.equal(canEnterStoryStage(state, '1-2').allowed, true);

  // Also verify Adventure Mode EXP path works from Lv.1 (Ruins Battlefield grants +120 EXP)
  const expAlt = completeAdventureModeRun(
    {
      ...createFreshStage11State(),
      player: { ...createFreshStage11State().player, exp: 420 },
    },
    'ruins-battlefield'
  );
  assert.equal(expAlt.success, true);
  assert.equal(expAlt.nextState.player.level, 2);

  // Case H: Stage 1-1 remains cleared and non-playable
  assert.equal(getStoryStageStatus(state, '1-1'), 'CLEARED');
  const replay11Check = tryOpenAdventureFormation(nav, state, '1-1');
  assert.equal(replay11Check.allowed, false);
  const replay11Battle = tryStartAdventureBattle(nav, state, '1-1', 'replay-11');
  assert.equal(replay11Battle.allowed, false);
  const replay11Victory = applyBattleVictoryToState(state, '1-1', win11.loot!);
  assert.equal(replay11Victory, state);

  // Case I: Player enters and wins Stage 1-2 and advances to Stage 1-3
  const enter12 = tryOpenAdventureFormation(nav, state, '1-2');
  assert.equal(enter12.allowed, true);
  assert.equal(enter12.nav.adventureRoute, 'formation');
  const start12 = tryStartAdventureBattle(enter12.nav, state, '1-2', 'session-12');
  assert.equal(start12.allowed, true);
  assert.equal(start12.nav.adventureRoute, 'battle');

  const win12 = simulateBattle(
    buildPlayerCombatUnits(state.heroes, state.formation),
    buildEnemyCombatUnits(stage12).map((e) => ({ ...e, hp: 50, maxHp: 50, atk: 5 })),
    stage12,
    1,
    10,
    () => 0.5
  );
  assert.equal(win12.victory, true);
  state = applyBattleVictoryToState(state, '1-2', win12.loot!);

  assert.deepEqual(state.stageProgress.completedStages, ['1-1', '1-2']);
  assert.equal(state.stageProgress.currentStage, '1-3');
  assert.equal(getStoryStageStatus(state, '1-2'), 'CLEARED');
  assert.equal(getStoryStageStatus(state, '1-3'), 'AVAILABLE');

  // Case J: Reload (JSON serialize -> sanitizeLoadedState) preserves updated Story progression
  const reloaded = sanitizeLoadedState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(reloaded.stageProgress.completedStages, ['1-1', '1-2']);
  assert.equal(reloaded.stageProgress.currentStage, '1-3');
  assert.equal(reloaded.player.level, 2);
  assert.equal(getStoryStageStatus(reloaded, '1-1'), 'CLEARED');
  assert.equal(getStoryStageStatus(reloaded, '1-2'), 'CLEARED');
  assert.equal(getStoryStageStatus(reloaded, '1-3'), 'AVAILABLE');
});

test('failed current stage allows retry without advancing or marking cleared', () => {
  const state = createFreshStage11State();
  const nav = openAdventureStoryMap(createInitialNavigationState());
  const stage11 = getStageById('1-1');

  // Simulate defeat against invincible enemies
  const defeat = simulateBattle(
    buildPlayerCombatUnits(state.heroes, state.formation),
    buildEnemyCombatUnits(stage11).map((e) => ({ ...e, hp: 9_999_999, maxHp: 9_999_999, atk: 1 })),
    stage11,
    0,
    10,
    () => 0.5
  );
  assert.equal(defeat.victory, false);
  assert.equal(defeat.loot, null);

  // Progress remains at 1-1 and player can retry 1-1 immediately
  assert.equal(state.stageProgress.currentStage, '1-1');
  assert.deepEqual(state.stageProgress.completedStages, []);
  const retryFormation = tryOpenAdventureFormation(nav, state, '1-1');
  assert.equal(retryFormation.allowed, true);
  const retryBattle = tryStartAdventureBattle(retryFormation.nav, state, '1-1', 'retry-11');
  assert.equal(retryBattle.allowed, true);
});

test('invalid direct navigation and backwards regression are rejected and normalized safely', () => {
  const state = createInitialGameState(); // currentStage: 1-6, completedStages: 1-1..1-5, level: 1
  const nav = openAdventureStoryMap(createInitialNavigationState());

  // 1. Unknown stage rejected
  assert.equal(tryOpenAdventureFormation(nav, state, '1-99').allowed, false);
  assert.equal(tryStartAdventureBattle(nav, state, '99-1', 'bad').allowed, false);

  // 2. Cleared stage (1-3) rejected
  assert.equal(tryOpenAdventureFormation(nav, state, '1-3').allowed, false);
  assert.equal(tryStartAdventureBattle(nav, state, '1-3', 'bad-replay').allowed, false);

  // 3. Future sequence-locked stage (1-7, 1-10) rejected
  assert.equal(tryOpenAdventureFormation(nav, state, '1-7').allowed, false);
  assert.equal(tryStartAdventureBattle(nav, state, '1-10', 'bad-skip').allowed, false);

  // 4. Level-locked stage (1-6 at Lv.1) rejected
  assert.equal(tryOpenAdventureFormation(nav, state, '1-6').allowed, false);
  assert.equal(tryStartAdventureBattle(nav, state, '1-6', 'bad-lv').allowed, false);

  // 5. Corrupted backwards currentStage (e.g. pointing back to 1-2 when 1-1..1-5 completed) self-heals forward, never backwards
  const corrupted = {
    ...state,
    stageProgress: {
      ...state.stageProgress,
      currentStage: '1-2',
      completedStages: ['1-1', '1-2', '1-3', '1-4', '1-5'],
    },
  };
  const healed = sanitizeLoadedState(corrupted);
  assert.equal(healed.stageProgress.currentStage, '1-6');
  assert.deepEqual(healed.stageProgress.completedStages, ['1-1', '1-2', '1-3', '1-4', '1-5']);

  // 6. Completing final stage 1-10 marks 1-10 CLEARED and blocks replay
  const at110 = {
    ...state,
    player: { ...state.player, level: 6 },
    stageProgress: {
      ...state.stageProgress,
      currentStage: '1-10',
      completedStages: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9'],
    },
  };
  const win110Loot = {
    gold: 14000,
    exp: 600,
    diamonds: 180,
    ascensionStones: 10,
  };
  const after110 = applyBattleVictoryToState(at110, '1-10', win110Loot);
  assert.equal(after110.stageProgress.currentStage, '1-10');
  assert.ok(after110.stageProgress.completedStages.includes('1-10'));
  assert.equal(getStoryStageStatus(after110, '1-10'), 'CLEARED');
  assert.equal(canEnterStoryStage(after110, '1-10').allowed, false);
});
