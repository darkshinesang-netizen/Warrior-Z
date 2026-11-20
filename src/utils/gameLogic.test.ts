import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../data/gameSeed';
import {
  calculateTeamPower,
  claimAfkRewards,
  claimSignInReward,
  formatGoldOrDiamond,
  formatPowerCompact,
  performDivinationSummon,
  sanitizeLoadedState,
  starUpHero,
  upgradeHeroLevel,
} from './gameLogic';

test('initial starter roster team power totals exactly 246,000 (246 K)', () => {
  const state = createInitialGameState();
  const total = calculateTeamPower(state.heroes);
  assert.equal(total, 246000);
  assert.equal(formatPowerCompact(total), '246 K');
  assert.equal(formatGoldOrDiamond(state.player.gold), '50,291');
});

test('claiming Day 1 sign-in grants Diamonds and Gold once and blocks duplicate claim', () => {
  const initial = createInitialGameState();
  const afterClaim = claimSignInReward(initial, 1);
  assert.equal(afterClaim.player.diamonds, 388 + 150);
  assert.equal(afterClaim.player.gold, 50291 + 5000);
  assert.deepEqual(afterClaim.signIn.claimedDays, [1]);

  const duplicate = claimSignInReward(afterClaim, 1);
  assert.equal(duplicate.player.diamonds, afterClaim.player.diamonds);
});

test('claiming AFK rewards adds Gold, resets accumulated chest, and applies player EXP', () => {
  const initial = createInitialGameState();
  initial.stageProgress.afkReward.accumulatedGold = 1200;
  initial.stageProgress.afkReward.accumulatedExp = 550;

  const after = claimAfkRewards(initial);
  assert.equal(after.player.gold, 50291 + 1200);
  assert.equal(after.player.level, 2);
  assert.equal(after.player.exp, 50);
  assert.equal(after.stageProgress.afkReward.accumulatedGold, 0);
  assert.equal(after.stageProgress.afkReward.accumulatedExp, 0);
});

test('upgrading hero level and star up updates power and consumes resources', () => {
  const initial = createInitialGameState();
  const levelRes = upgradeHeroLevel(initial, 'small-goku');
  assert.equal(levelRes.success, true);
  assert.ok(levelRes.nextState.player.gold < initial.player.gold);
  assert.equal(
    levelRes.nextState.heroes.find((h) => h.id === 'small-goku')?.level,
    42
  );

  const starRes = starUpHero(levelRes.nextState, 'small-goku');
  assert.equal(starRes.success, true);
  assert.equal(
    starRes.nextState.heroes.find((h) => h.id === 'small-goku')?.stars,
    5
  );
  assert.equal(
    starRes.nextState.bag.find((b) => b.id === 'ascension-stone')?.quantity,
    10
  );
});

test('divination summon deducts 150 Diamonds and unlocks a hero or adds shards', () => {
  const initial = createInitialGameState();
  const summon = performDivinationSummon(initial, 0.05);
  assert.equal(summon.success, true);
  assert.equal(summon.nextState.player.diamonds, 388 - 150);
  assert.equal(summon.wasNewUnlock, true);
  assert.equal(summon.nextState.totalSummons, 1);
  assert.ok(calculateTeamPower(summon.nextState.heroes) > 246000);
});

test('sanitizeLoadedState falls back safely on malformed input', () => {
  const recovered = sanitizeLoadedState({ broken: true });
  assert.equal(recovered.player.name, 'PaltryLee');
  assert.equal(recovered.stageProgress.currentStage, '1-6');
});
