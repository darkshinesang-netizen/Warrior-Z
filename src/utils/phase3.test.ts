import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../data/gameSeed';
import { ADVENTURE_MODES } from '../data/phase3Data';
import {
  AFK_MAX_SECONDS,
  applyDevBoost,
  autoCraftShards,
  canSkipBattle,
  claimAfkRewards,
  claimDivinationMilestone,
  completeAdventureModeRun,
  formatAfkTimer,
  getActiveBonds,
  getBondElementBonuses,
  getHeroEffectiveLevel,
  getResonanceBaselineLevel,
  isAdventureModeUnlocked,
  performDivinationBatch,
  refineDragonSkills,
  sanitizeLoadedState,
  tickAfkRewards,
  toggleResonanceSlot,
  upgradeHeroLevel,
  useBagItem,
} from './gameLogic';

test('AFK 24-hour cap formats HH:MM:SS, pauses at 86,400s, and resets cleanly on claim', () => {
  const state = createInitialGameState();
  assert.equal(formatAfkTimer(state.stageProgress.afkReward.elapsedSeconds), '04:32:10');
  assert.equal(formatAfkTimer(AFK_MAX_SECONDS), '24:00:00');

  const nearCap = {
    ...state,
    stageProgress: {
      ...state.stageProgress,
      afkReward: {
        ...state.stageProgress.afkReward,
        elapsedSeconds: AFK_MAX_SECONDS - 10,
      },
    },
  };
  const atCap = tickAfkRewards(nearCap, 60);
  assert.equal(atCap.stageProgress.afkReward.elapsedSeconds, AFK_MAX_SECONDS);
  const paused = tickAfkRewards(atCap, 300);
  assert.equal(paused.stageProgress.afkReward.accumulatedGold, atCap.stageProgress.afkReward.accumulatedGold);

  const claimed = claimAfkRewards(paused);
  assert.equal(claimed.stageProgress.afkReward.elapsedSeconds, 0);
  assert.equal(claimed.stageProgress.afkReward.accumulatedGold, 0);
});

test('Skip battle condition unlocks ONLY at Lv.71+ OR VIP 3+ and Dev boost reaches unlock cleanly', () => {
  const state = createInitialGameState();
  assert.equal(canSkipBattle(state.player), false);
  assert.equal(canSkipBattle({ level: 70, vipLevel: 2 }), false);
  assert.equal(canSkipBattle({ level: 71, vipLevel: 0 }), true);
  assert.equal(canSkipBattle({ level: 1, vipLevel: 3 }), true);

  const boostedVip = applyDevBoost(state, { addVip: 3 });
  assert.equal(canSkipBattle(boostedVip.player), true);

  const boostedLv = applyDevBoost(state, { addLevels: 70 });
  assert.equal(boostedLv.player.level, 71);
  assert.equal(canSkipBattle(boostedLv.player), true);
});

test('Resonance syncs slotted Lv.1 hero to Mentor Baseline Lv.20+ and toggles cleanly', () => {
  const state = createInitialGameState();
  const baseline = getResonanceBaselineLevel(state.heroes);
  assert.equal(baseline, 20);

  const bulma = state.heroes.find((h) => h.id === 'bulma')!;
  assert.equal(bulma.level, 1);
  assert.equal(getHeroEffectiveLevel(bulma, state), 20); // Slotted initially

  const removed = toggleResonanceSlot(state, 'bulma');
  assert.equal(removed.success, true);
  assert.equal(getHeroEffectiveLevel(bulma, removed.nextState), 1);
});

test('Active Bonds grant permanent Type Stats Bonus to matching elements', () => {
  const state = createInitialGameState();
  const active = getActiveBonds(state.heroes);
  assert.ok(active.some((b) => b.id === 'bond-kame-disciples'));
  assert.ok(active.some((b) => b.id === 'bond-west-city-quest'));

  const strBonus = getBondElementBonuses(state.heroes, 'STR');
  assert.equal(strBonus.atkPct, 14); // 8 + 6
  assert.equal(strBonus.hpPct, 18); // 8 + 10
});

test('Hero upgrade supports Martial Scroll accelerated leveling', () => {
  const state = createInitialGameState();
  const res = upgradeHeroLevel(state, 'krillin', true);
  assert.equal(res.success, true);
  assert.equal(res.nextState.heroes.find((h) => h.id === 'krillin')?.level, 22);
  assert.equal(res.nextState.bag.find((b) => b.id === 'exp-scroll')?.quantity, 7);
});

test('Divination supports free daily 1x, 1620-diamond 10x with SR/SSR guarantee, milestones, and auto-dismantle', () => {
  const state = createInitialGameState();
  const freePull = performDivinationBatch(state, 1, () => 0.1);
  assert.equal(freePull.success, true);
  assert.equal(freePull.usedCurrencyLabel, 'Free Daily Divination');
  assert.equal(freePull.nextState.divination.freeDailyAvailable, false);
  assert.equal(freePull.nextState.player.diamonds, 388);

  const richState = {
    ...freePull.nextState,
    player: { ...freePull.nextState.player, diamonds: 5000 },
  };
  const tenPull = performDivinationBatch(richState, 10, () => 0.5);
  assert.equal(tenPull.success, true);
  assert.equal(tenPull.pulls.length, 10);
  assert.equal(tenPull.nextState.player.diamonds, 5000 - 1620);
  assert.equal(tenPull.nextState.divination.totalDraws, 11);
  assert.ok(tenPull.pulls.some((p) => p.hero.rarity === 'SSR' || p.hero.rarity === 'UR'));

  const milestone = claimDivinationMilestone(tenPull.nextState, 10);
  assert.equal(milestone.success, true);
  assert.ok(milestone.nextState.player.diamonds > tenPull.nextState.player.diamonds);
});

test('Bag Auto Craft unlocks Yamcha from 20 shards and Refine Synthesis upgrades 2x Dragon Skills', () => {
  const state = createInitialGameState();
  assert.equal(state.heroes.find((h) => h.id === 'yamcha-wolf')?.unlocked, false);

  const crafted = autoCraftShards(state);
  assert.equal(crafted.craftedCount, 1);
  assert.equal(crafted.nextState.heroes.find((h) => h.id === 'yamcha-wolf')?.unlocked, true);
  assert.equal(crafted.nextState.bag.find((b) => b.id === 'shard-yamcha')?.quantity, 0);

  const refined = refineDragonSkills(crafted.nextState);
  assert.equal(refined.success, true);
  assert.equal(refined.nextState.bag.find((b) => b.id === 'kame-manual')?.quantity, 0);
  assert.equal(refined.nextState.bag.find((b) => b.id === 'dragon-ki-mastery')?.quantity, 1);

  const bento1 = useBagItem(refined.nextState, 'stamina-bento');
  assert.equal(bento1.success, true);
  assert.equal(bento1.nextState.player.gold, state.player.gold + 1200);
});

test('Adventure Modes verify unlock rules and award resources into centralized state', () => {
  const state = createInitialGameState();
  const ruins = ADVENTURE_MODES.find((m) => m.id === 'ruins-battlefield')!;
  const showdown = ADVENTURE_MODES.find((m) => m.id === 'dragon-ball-showdown')!;

  assert.equal(isAdventureModeUnlocked(ruins, state), true);
  assert.equal(isAdventureModeUnlocked(showdown, state), false);

  const run = completeAdventureModeRun(state, 'ruins-battlefield');
  assert.equal(run.success, true);
  assert.equal(run.nextState.player.gold, state.player.gold + ruins.rewards.gold);
  assert.equal(run.nextState.bag.find((b) => b.id === 'ascension-stone')?.quantity, 15 + 6);
});

test('sanitizeLoadedState migrates Phase 2 saves safely to Phase 3 schema', () => {
  const legacy = {
    player: { name: 'PaltryLee', level: 3, gold: 1000, diamonds: 200 },
    heroes: [{ id: 'small-goku', level: 45, unlocked: true }],
    stageProgress: { currentStage: '1-7', completedStages: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'] },
  };
  const migrated = sanitizeLoadedState(legacy);
  assert.equal(migrated.bag.some((b) => b.category === 'Cost'), true);
  assert.equal(migrated.divination.pityCount, 0);
  assert.equal(migrated.resonance.unlockedSlots, 4);
  assert.equal(migrated.stageProgress.afkReward.elapsedSeconds, 16330);
});
