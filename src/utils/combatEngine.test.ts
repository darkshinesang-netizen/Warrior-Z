import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../data/gameSeed';
import { calculateTeamAura, getElementMultiplier, getStageById } from '../data/stagesData';
import {
  applyBattleVictoryToState,
  autoFillFormation,
  buildEnemyCombatUnits,
  buildPlayerCombatUnits,
  calculateFormationPower,
  MAX_BATTLE_TURNS,
  simulateBattle,
} from './combatEngine';

test('autoFillFormation places melee/tank in front row and mage/support in back row', () => {
  const state = createInitialGameState();
  const filled = autoFillFormation(state.heroes);
  assert.equal(filled[0], 'small-goku'); // Front slot 0
  assert.ok(filled[2] === 'krillin' || filled[2] === 'bulma'); // Back slot
  assert.ok(filled[3] === 'krillin' || filled[3] === 'bulma');
});

test('all deployed units start combat at 100% HP and 0 Rage with Aura bonus applied', () => {
  const state = createInitialGameState();
  const units = buildPlayerCombatUnits(state.heroes, state.formation);
  assert.equal(units.length, 3);
  for (const u of units) {
    assert.equal(u.hp, u.maxHp);
    assert.equal(u.rage, 0);
  }
  const aura = calculateTeamAura(state.heroes.filter((h) => h.unlocked));
  assert.equal(aura.active, true);
  assert.equal(aura.atkBonusPct, 10); // Tri-Element Harmony (STR, PHY, INT)
  assert.ok(calculateFormationPower(state.heroes, state.formation) > 246000);
});

test('element advantage matrix applies 1.2x multiplier on favorable matchups', () => {
  assert.equal(getElementMultiplier('STR', 'PHY'), 1.2);
  assert.equal(getElementMultiplier('PHY', 'INT'), 1.2);
  assert.equal(getElementMultiplier('INT', 'STR'), 1.2);
  assert.equal(getElementMultiplier('S', 'UL'), 1.18);
  assert.equal(getElementMultiplier('PHY', 'STR'), 0.88);
});

test('normal attacks generate +35 Rage and trigger Ultimate Skills at 100 Rage', () => {
  const state = createInitialGameState();
  const stage = getStageById('1-6');
  const players = buildPlayerCombatUnits(state.heroes, state.formation);
  const enemies = buildEnemyCombatUnits(stage);

  const result = simulateBattle(players, enemies, stage, 5, 10, () => 0.5);
  assert.ok(result.events.length > 0);
  assert.ok(result.turnsTaken <= MAX_BATTLE_TURNS);
  assert.equal(result.events[0].isUltimate, false); // Turn 1 starts at 0 Rage
  const hasUltimate = result.events.some((e) => e.isUltimate);
  assert.equal(hasUltimate, true);
  const hasHeal = result.events.some((e) => e.hits.some((h) => h.isHeal));
  assert.equal(hasHeal, true);
});

test('enemies surviving past Turn 15 causes defeat due to TURN_LIMIT_REACHED', () => {
  const state = createInitialGameState();
  const stage = getStageById('1-6');
  const players = buildPlayerCombatUnits(state.heroes, state.formation);
  const immortalEnemies = buildEnemyCombatUnits(stage).map((e) => ({
    ...e,
    hp: 9_999_999,
    maxHp: 9_999_999,
    atk: 1, // Keep player alive through 15 turns
  }));

  const result = simulateBattle(players, immortalEnemies, stage, 5, 10, () => 0.5);
  assert.equal(result.victory, false);
  assert.equal(result.turnsTaken, 15);
  assert.equal(result.reason, 'TURN_LIMIT_REACHED');
  assert.equal(result.loot, null);
});

test('applyBattleVictoryToState advances 1-6 -> 1-7, increments quest, adds Bag loot, and grants +200 Diamonds at 10/10', () => {
  const baseState = createInitialGameState();
  const state = {
    ...baseState,
    player: { ...baseState.player, level: 6 },
  };
  const stage16 = getStageById('1-6');
  const players = buildPlayerCombatUnits(state.heroes, state.formation);
  const weakEnemies = buildEnemyCombatUnits(stage16).map((e) => ({
    ...e,
    hp: 100,
    maxHp: 100,
    atk: 10,
  }));

  const res = simulateBattle(players, weakEnemies, stage16, 5, 10, () => 0.5);
  assert.equal(res.victory, true);
  assert.ok(res.loot);

  const after16 = applyBattleVictoryToState(state, '1-6', res.loot!);
  assert.equal(after16.stageProgress.currentStage, '1-7');
  assert.ok(after16.stageProgress.completedStages.includes('1-6'));
  assert.equal(after16.stageProgress.questTracker.current, 6);
  assert.equal(
    after16.bag.find((b) => b.id === 'ascension-stone')?.quantity,
    15 + stage16.rewards.ascensionStones
  );

  // Replaying already-cleared 1-6 does not farm infinite currency
  const replay = applyBattleVictoryToState(after16, '1-6', res.loot!);
  assert.equal(replay.player.gold, after16.player.gold);

  // Completing quest step 9 -> 10 awards +200 bonus Diamonds
  const nearTen = {
    ...after16,
    stageProgress: {
      ...after16.stageProgress,
      currentStage: '1-10',
      questTracker: { ...after16.stageProgress.questTracker, current: 9, target: 10 },
    },
  };
  const stage110 = getStageById('1-10');
  const res110 = simulateBattle(
    players,
    buildEnemyCombatUnits(stage110).map((e) => ({ ...e, hp: 100, maxHp: 100, atk: 10 })),
    stage110,
    9,
    10,
    () => 0.5
  );
  assert.equal(res110.loot?.storyBonusDiamonds, 200);
  const after110 = applyBattleVictoryToState(nearTen, '1-10', res110.loot!);
  assert.equal(
    after110.player.diamonds,
    nearTen.player.diamonds + stage110.rewards.diamonds + 200
  );
});
