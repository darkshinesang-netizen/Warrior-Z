import { createInitialGameState, SIGN_IN_CALENDAR } from '../data/gameSeed';
import {
  ADVENTURE_MODES,
  DIVINATION_MILESTONES,
  HERO_BONDS,
} from '../data/phase3Data';
import {
  AdventureModeDef,
  AdventureModeId,
  AfkRewardState,
  BagItem,
  BondBonus,
  DivinationPullEntry,
  ElementType,
  GameState,
  Hero,
  HeroBondDef,
  PlayerInfo,
  Rarity,
} from '../types/game';
import { normalizeStoryStageProgress } from './storyProgression';

export const AFK_MAX_SECONDS = 24 * 3600; // 24:00:00 cap

export function formatGoldOrDiamond(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString('en-US');
}

export function formatPowerCompact(power: number): string {
  if (power >= 1_000_000) {
    return `${(power / 1_000_000).toFixed(1).replace(/\.0$/, '')} M`;
  }
  if (power >= 1_000) {
    return `${Math.round(power / 1_000)} K`;
  }
  return String(Math.round(power));
}

export function formatAfkTimer(totalSeconds: number): string {
  const clamped = Math.max(0, Math.min(AFK_MAX_SECONDS, Math.floor(totalSeconds)));
  const hours = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return [hours, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

export function getAfkTimeCapPercent(elapsedSeconds: number): number {
  return Math.min(100, Math.round((Math.max(0, elapsedSeconds) / AFK_MAX_SECONDS) * 100));
}

export function canSkipBattle(player: Pick<PlayerInfo, 'level' | 'vipLevel'>): boolean {
  return player.level >= 71 || player.vipLevel >= 3;
}

export function getHeroEffectivePower(hero: Hero): number {
  const levelBonus = Math.max(0, hero.level - 1) * 450;
  const starBonus = Math.max(0, hero.stars - 3) * 4000;
  // Keep starter seed power exact at initial levels (Small Goku Lv.41 4-star = 95,000, Krillin Lv.20 4-star = 78,000, Bulma Lv.1 3-star = 73,000)
  if (hero.isStarter && hero.id === 'small-goku' && hero.level === 41 && hero.stars === 4) {
    return 95000;
  }
  if (hero.isStarter && hero.id === 'krillin' && hero.level === 20 && hero.stars === 4) {
    return 78000;
  }
  if (hero.isStarter && hero.id === 'bulma' && hero.level === 1 && hero.stars === 3) {
    return 73000;
  }
  if (hero.isStarter) {
    const baseLv = hero.id === 'small-goku' ? 41 : hero.id === 'krillin' ? 20 : 1;
    const baseStar = hero.id === 'bulma' ? 3 : 4;
    return hero.basePower + (hero.level - baseLv) * 850 + (hero.stars - baseStar) * 12000;
  }
  return hero.basePower + levelBonus + starBonus;
}

export function calculateTeamPower(heroes: Hero[]): number {
  return heroes
    .filter((h) => h.unlocked)
    .reduce((sum, hero) => sum + getHeroEffectivePower(hero), 0);
}

// Phase 3: Resonance & Bond Calculations
export function getResonanceBaselineLevel(heroes: Hero[]): number {
  const unlockedLevels = heroes
    .filter((h) => h.unlocked)
    .map((h) => h.level)
    .sort((a, b) => b - a);
  if (unlockedLevels.length >= 2) {
    return Math.max(20, unlockedLevels[1]);
  }
  return Math.max(1, unlockedLevels[0] ?? 1);
}

export function getHeroEffectiveLevel(hero: Hero, state: GameState): number {
  if (!hero.unlocked) return hero.level;
  const isResonant = state.resonance?.slottedHeroIds?.includes(hero.id);
  if (!isResonant) return hero.level;
  return Math.max(hero.level, getResonanceBaselineLevel(state.heroes));
}

export function getActiveBonds(heroes: Hero[]): HeroBondDef[] {
  const unlockedIds = new Set(heroes.filter((h) => h.unlocked).map((h) => h.id));
  return HERO_BONDS.filter((bond) => bond.heroIds.every((id) => unlockedIds.has(id)));
}

export function getBondElementBonuses(
  heroes: Hero[],
  element: ElementType
): BondBonus {
  const active = getActiveBonds(heroes);
  return active.reduce<BondBonus>(
    (acc, bond) => {
      if (bond.targetElements.includes(element)) {
        acc.atkPct += bond.bonus.atkPct;
        acc.hpPct += bond.bonus.hpPct;
        acc.defPct += bond.bonus.defPct;
      }
      return acc;
    },
    { atkPct: 0, hpPct: 0, defPct: 0 }
  );
}

export function getHeroComputedStats(hero: Hero, state: GameState) {
  const effectiveLevel = getHeroEffectiveLevel(hero, state);
  const effectiveHero: Hero = { ...hero, level: effectiveLevel };
  const bondBonus = getBondElementBonuses(state.heroes, hero.element);
  const lvScale = 1 + (effectiveLevel - 1) * 0.025;
  const starScale = 1 + Math.max(0, hero.stars - 3) * 0.16;

  const hp = Math.round(hero.baseHp * lvScale * starScale * (1 + bondBonus.hpPct / 100));
  const atk = Math.round(hero.baseAtk * lvScale * starScale * (1 + bondBonus.atkPct / 100));
  const def = Math.round(hero.baseDef * lvScale * starScale * (1 + bondBonus.defPct / 100));
  const power = Math.round(
    getHeroEffectivePower(effectiveHero) *
      (1 + (bondBonus.atkPct + bondBonus.hpPct) / 400)
  );

  return {
    effectiveLevel,
    isResonant: effectiveLevel > hero.level,
    hp,
    atk,
    def,
    spd: hero.spd,
    power,
    bondBonus,
  };
}

export function addBagItemQuantity(
  bag: GameState['bag'],
  itemId: string,
  delta: number,
  fallbackNewItem?: Omit<BagItem, 'quantity'>
): GameState['bag'] {
  const exists = bag.some((i) => i.id === itemId);
  if (exists) {
    return bag.map((item) =>
      item.id === itemId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    );
  }
  if (delta > 0 && fallbackNewItem) {
    return [...bag, { ...fallbackNewItem, quantity: delta }];
  }
  return bag;
}

export function applyPlayerExp(
  player: GameState['player'],
  gainedExp: number
): GameState['player'] {
  let level = player.level;
  let exp = player.exp + gainedExp;
  let maxExp = player.maxExp;

  while (exp >= maxExp) {
    exp -= maxExp;
    level += 1;
    maxExp = Math.round(maxExp * 1.4);
  }

  return {
    ...player,
    level,
    exp,
    maxExp,
  };
}

export function tickAfkRewards(state: GameState, deltaSeconds: number): GameState {
  const afk = state.stageProgress.afkReward;
  if (afk.elapsedSeconds >= AFK_MAX_SECONDS) {
    return state; // Accumulation strictly pauses once 24:00:00 cap is reached
  }
  const nextElapsed = Math.min(AFK_MAX_SECONDS, afk.elapsedSeconds + deltaSeconds);
  const addedSeconds = nextElapsed - afk.elapsedSeconds;
  if (addedSeconds <= 0) return state;

  const goldGain = Math.max(1, Math.round((afk.goldPerMin / 60) * addedSeconds));
  const expGain = Math.max(1, Math.round((afk.expPerMin / 60) * addedSeconds));

  return {
    ...state,
    stageProgress: {
      ...state.stageProgress,
      afkReward: {
        ...afk,
        elapsedSeconds: nextElapsed,
        accumulatedGold: afk.accumulatedGold + goldGain,
        accumulatedExp: afk.accumulatedExp + expGain,
      },
    },
  };
}

export function setAfkElapsedForTest(
  afk: AfkRewardState,
  elapsedSeconds: number
): AfkRewardState {
  const clamped = Math.max(0, Math.min(AFK_MAX_SECONDS, elapsedSeconds));
  return {
    ...afk,
    elapsedSeconds: clamped,
  };
}

export function claimSignInReward(state: GameState, day: number): GameState {
  if (day > state.signIn.currentDay || state.signIn.claimedDays.includes(day)) {
    return state;
  }
  const reward = SIGN_IN_CALENDAR.find((entry) => entry.day === day);
  if (!reward) return state;

  let nextBag = state.bag;
  if (reward.ascensionStones) {
    nextBag = addBagItemQuantity(nextBag, 'ascension-stone', reward.ascensionStones);
  }

  return {
    ...state,
    player: {
      ...state.player,
      gold: state.player.gold + (reward.gold ?? 0),
      diamonds: state.player.diamonds + (reward.diamonds ?? 0),
    },
    bag: nextBag,
    signIn: {
      ...state.signIn,
      claimedDays: [...state.signIn.claimedDays, day],
    },
  };
}

export function claimAfkRewards(state: GameState): GameState {
  const { accumulatedGold, accumulatedExp, elapsedSeconds } = state.stageProgress.afkReward;
  if (accumulatedGold <= 0 && accumulatedExp <= 0 && elapsedSeconds <= 0) {
    return state;
  }

  return {
    ...state,
    player: {
      ...applyPlayerExp(state.player, accumulatedExp),
      gold: state.player.gold + accumulatedGold,
    },
    stageProgress: {
      ...state.stageProgress,
      afkReward: {
        ...state.stageProgress.afkReward,
        accumulatedGold: 0,
        accumulatedExp: 0,
        elapsedSeconds: 0,
        lastClaimedAt: Date.now(),
      },
    },
  };
}

export function upgradeHeroLevel(
  state: GameState,
  heroId: string,
  useMartialScroll = false
): {
  nextState: GameState;
  success: boolean;
  reason?: string;
} {
  const target = state.heroes.find((h) => h.id === heroId);
  if (!target || !target.unlocked) {
    return { nextState: state, success: false, reason: 'Hero is locked.' };
  }

  if (useMartialScroll) {
    const scrollQty = state.bag.find((b) => b.id === 'exp-scroll')?.quantity ?? 0;
    const goldCost = 800 + target.level * 50;
    if (scrollQty < 1) {
      return { nextState: state, success: false, reason: 'Need 1 Martial Scroll.' };
    }
    if (state.player.gold < goldCost) {
      return { nextState: state, success: false, reason: 'Insufficient Gold.' };
    }
    return {
      success: true,
      nextState: {
        ...state,
        player: { ...state.player, gold: state.player.gold - goldCost },
        bag: addBagItemQuantity(state.bag, 'exp-scroll', -1),
        heroes: state.heroes.map((h) =>
          h.id === heroId ? { ...h, level: h.level + 2 } : h
        ),
      },
    };
  }

  const cost = 1500 + target.level * 120;
  if (state.player.gold < cost) {
    return { nextState: state, success: false, reason: 'Insufficient Gold.' };
  }

  return {
    success: true,
    nextState: {
      ...state,
      player: {
        ...state.player,
        gold: state.player.gold - cost,
      },
      heroes: state.heroes.map((h) =>
        h.id === heroId ? { ...h, level: h.level + 1 } : h
      ),
    },
  };
}

export function starUpHero(state: GameState, heroId: string): {
  nextState: GameState;
  success: boolean;
  reason?: string;
} {
  const target = state.heroes.find((h) => h.id === heroId);
  if (!target || !target.unlocked) {
    return { nextState: state, success: false, reason: 'Hero is locked.' };
  }
  if (target.stars >= target.maxStars) {
    return { nextState: state, success: false, reason: 'Already at Max Stars.' };
  }

  const stoneItem = state.bag.find((b) => b.id === 'ascension-stone');
  const stoneCost = 5;
  if (!stoneItem || stoneItem.quantity < stoneCost) {
    return { nextState: state, success: false, reason: 'Need 5 Ascension Stones.' };
  }

  return {
    success: true,
    nextState: {
      ...state,
      bag: addBagItemQuantity(state.bag, 'ascension-stone', -stoneCost),
      heroes: state.heroes.map((h) =>
        h.id === heroId ? { ...h, stars: h.stars + 1 } : h
      ),
    },
  };
}

export function starUpHeroWithShards(state: GameState, heroId: string): {
  nextState: GameState;
  success: boolean;
  reason?: string;
} {
  const target = state.heroes.find((h) => h.id === heroId);
  if (!target || !target.unlocked) {
    return { nextState: state, success: false, reason: 'Hero is locked.' };
  }
  if (target.stars >= target.maxStars) {
    return { nextState: state, success: false, reason: 'Already at Max Stars.' };
  }
  const shardItem = state.bag.find(
    (b) => b.category === 'Shard' && b.shardHeroId === heroId
  );
  const shardCost = shardItem?.craftCost ?? 20;
  if (!shardItem || shardItem.quantity < shardCost) {
    return {
      nextState: state,
      success: false,
      reason: `Need ${shardCost} ${target.name} Shards.`,
    };
  }

  return {
    success: true,
    nextState: {
      ...state,
      bag: addBagItemQuantity(state.bag, shardItem.id, -shardCost),
      heroes: state.heroes.map((h) =>
        h.id === heroId ? { ...h, stars: h.stars + 1 } : h
      ),
    },
  };
}

export function toggleResonanceSlot(
  state: GameState,
  heroId: string
): { nextState: GameState; success: boolean; reason?: string } {
  const hero = state.heroes.find((h) => h.id === heroId);
  if (!hero || !hero.unlocked) {
    return { nextState: state, success: false, reason: 'Unlock hero first.' };
  }

  const slots = [...state.resonance.slottedHeroIds];
  const existingIdx = slots.indexOf(heroId);
  if (existingIdx !== -1) {
    slots[existingIdx] = null;
    return {
      success: true,
      nextState: {
        ...state,
        resonance: { ...state.resonance, slottedHeroIds: slots },
      },
    };
  }

  const emptyIdx = slots.findIndex((id) => id === null);
  if (emptyIdx === -1) {
    return {
      nextState: state,
      success: false,
      reason: 'All unlocked Resonance slots are occupied.',
    };
  }

  slots[emptyIdx] = heroId;
  return {
    success: true,
    nextState: {
      ...state,
      resonance: { ...state.resonance, slottedHeroIds: slots },
    },
  };
}

export function unlockResonanceSlot(state: GameState): {
  nextState: GameState;
  success: boolean;
  reason?: string;
} {
  if (state.resonance.unlockedSlots >= 6) {
    return { nextState: state, success: false, reason: 'Max Resonance slots unlocked.' };
  }
  const essenceCost = 10;
  const crystals = state.bag.find((b) => b.id === 'azure-essence')?.quantity ?? 0;
  if (crystals < essenceCost) {
    return {
      nextState: state,
      success: false,
      reason: `Need ${essenceCost} Azure Essence Crystals.`,
    };
  }

  return {
    success: true,
    nextState: {
      ...state,
      bag: addBagItemQuantity(state.bag, 'azure-essence', -essenceCost),
      resonance: {
        unlockedSlots: state.resonance.unlockedSlots + 1,
        slottedHeroIds: [...state.resonance.slottedHeroIds, null],
      },
    },
  };
}

export function applyDevBoost(
  state: GameState,
  opts: { addLevels?: number; addVip?: number }
): GameState {
  const nextLv = Math.max(1, state.player.level + (opts.addLevels ?? 0));
  const nextVip = Math.max(0, Math.min(15, state.player.vipLevel + (opts.addVip ?? 0)));
  return {
    ...state,
    player: {
      ...state.player,
      level: nextLv,
      vipLevel: nextVip,
    },
    headgearFrames: state.headgearFrames.map((f) =>
      f.id === 'dragon-sovereign' && nextLv >= 20 ? { ...f, unlocked: true } : f
    ),
  };
}

function getHeroShardId(hero: Hero): string {
  if (hero.id === 'small-goku') return 'shard-goku';
  if (hero.id === 'prince-vegeta') return 'shard-vegeta';
  if (hero.id === 'yamcha-wolf') return 'shard-yamcha';
  return `shard-${hero.id}`;
}

function pickHeroByRoll(
  pool: Hero[],
  roll: number,
  guaranteeHighRarity: boolean,
  wishHeroId: string | null,
  wishUnlocked: boolean
): Hero {
  const byRarity = (r: Rarity) => pool.filter((h) => h.rarity === r);
  let targetRarity: Rarity;
  if (guaranteeHighRarity) {
    targetRarity = roll < 0.25 ? 'UR' : 'SSR';
  } else if (roll < 0.03) {
    targetRarity = 'UR';
  } else if (roll < 0.14) {
    targetRarity = 'SSR';
  } else if (roll < 0.42) {
    targetRarity = 'SR';
  } else if (roll < 0.78) {
    targetRarity = 'R';
  } else {
    targetRarity = 'N';
  }

  const candidates = byRarity(targetRarity);
  if (
    wishUnlocked &&
    wishHeroId &&
    (targetRarity === 'UR' || targetRarity === 'SSR') &&
    candidates.some((h) => h.id === wishHeroId)
  ) {
    return candidates.find((h) => h.id === wishHeroId)!;
  }

  const lockedCandidates = candidates.filter((h) => !h.unlocked);
  const chosenPool = lockedCandidates.length > 0 ? lockedCandidates : candidates.length > 0 ? candidates : pool;
  const idx = Math.floor(roll * 997) % chosenPool.length;
  return chosenPool[idx];
}

export function performDivinationSummon(
  state: GameState,
  deterministicRoll?: number
): {
  nextState: GameState;
  success: boolean;
  pulledHero?: Hero;
  wasNewUnlock?: boolean;
  reason?: string;
} {
  const batch = performDivinationBatch(
    {
      ...state,
      divination: { ...state.divination, freeDailyAvailable: false },
    },
    1,
    deterministicRoll !== undefined ? () => deterministicRoll : Math.random,
    true
  );
  if (!batch.success) {
    return { nextState: state, success: false, reason: batch.reason };
  }
  return {
    nextState: batch.nextState,
    success: true,
    pulledHero: batch.pulls[0]?.hero,
    wasNewUnlock: batch.pulls[0]?.wasNewUnlock,
  };
}

export function performDivinationBatch(
  state: GameState,
  count: 1 | 10,
  rng: () => number = Math.random,
  forceDiamondSingle = false
): {
  nextState: GameState;
  success: boolean;
  pulls: DivinationPullEntry[];
  usedCurrencyLabel: string;
  reason?: string;
} {
  const ticketItem = state.bag.find((b) => b.id === 'divination-ticket');
  const ticketQty = ticketItem?.quantity ?? 0;

  let diamondCost = 0;
  let ticketCost = 0;
  let consumeFree = false;
  let usedCurrencyLabel = '';

  if (count === 1) {
    if (!forceDiamondSingle && state.divination.freeDailyAvailable) {
      consumeFree = true;
      usedCurrencyLabel = 'Free Daily Divination';
    } else if (!forceDiamondSingle && ticketQty >= 1) {
      ticketCost = 1;
      usedCurrencyLabel = '1 Divination Ticket';
    } else {
      diamondCost = 150;
      usedCurrencyLabel = '150 Diamonds';
    }
  } else {
    diamondCost = 1620;
    usedCurrencyLabel = '1,620 Diamonds';
  }

  if (state.player.diamonds < diamondCost) {
    return {
      nextState: state,
      success: false,
      pulls: [],
      usedCurrencyLabel: '',
      reason: `Need ${formatGoldOrDiamond(diamondCost)} Diamonds for Divination x${count}.`,
    };
  }

  let workingHeroes = state.heroes.map((h) => ({ ...h }));
  let workingBag = state.bag.map((b) => ({ ...b }));
  if (ticketCost > 0) {
    workingBag = addBagItemQuantity(workingBag, 'divination-ticket', -ticketCost);
  }

  let pity = state.divination.pityCount;
  let totalDraws = state.divination.totalDraws;
  const wishUnlocked = totalDraws >= 200;
  const pulls: DivinationPullEntry[] = [];

  for (let i = 0; i < count; i++) {
    totalDraws += 1;
    pity += 1;
    const isPityTrigger = pity >= 1000;
    const isTenPullBonus = count === 10 && i === 9 && !pulls.some((p) => p.hero.rarity === 'SSR' || p.hero.rarity === 'UR');
    const guaranteeHigh = isPityTrigger || isTenPullBonus;
    const roll = rng();

    const picked = pickHeroByRoll(
      workingHeroes,
      roll,
      guaranteeHigh,
      state.divination.wishHeroId,
      wishUnlocked
    );

    if (picked.rarity === 'UR' || picked.rarity === 'SSR') {
      pity = 0;
    }

    const wasNewUnlock = !picked.unlocked;
    if (wasNewUnlock) {
      workingHeroes = workingHeroes.map((h) =>
        h.id === picked.id ? { ...h, unlocked: true } : h
      );
      pulls.push({
        hero: { ...picked, unlocked: true },
        wasNewUnlock: true,
      });
    } else if (
      state.divination.autoDismantle &&
      (picked.rarity === 'N' || picked.rarity === 'R')
    ) {
      const stoneGain = picked.rarity === 'R' ? 2 : 1;
      workingBag = addBagItemQuantity(workingBag, 'ascension-stone', stoneGain);
      pulls.push({
        hero: picked,
        wasNewUnlock: false,
        dismantledStones: stoneGain,
      });
    } else {
      const shardId = getHeroShardId(picked);
      const shardGain = picked.rarity === 'UR' ? 15 : picked.rarity === 'SSR' ? 10 : 8;
      workingBag = addBagItemQuantity(workingBag, shardId, shardGain, {
        id: shardId,
        name: `${picked.name} Shard`,
        category: 'Shard',
        rarity: picked.rarity,
        description: `Collect shards to promote ${picked.name} to the next Star tier.`,
        source: 'Divination Shrine',
        iconKey: 'shard',
        shardHeroId: picked.id,
        craftCost: picked.rarity === 'UR' ? 50 : picked.rarity === 'SSR' ? 30 : 20,
      });
      pulls.push({
        hero: picked,
        wasNewUnlock: false,
        convertedToShardQty: shardGain,
      });
    }
  }

  return {
    success: true,
    pulls,
    usedCurrencyLabel,
    nextState: {
      ...state,
      player: {
        ...state.player,
        diamonds: state.player.diamonds - diamondCost,
      },
      heroes: workingHeroes,
      bag: workingBag,
      totalSummons: state.totalSummons + count,
      divination: {
        ...state.divination,
        pityCount: pity,
        totalDraws,
        freeDailyAvailable: consumeFree ? false : state.divination.freeDailyAvailable,
      },
    },
  };
}

export function claimDivinationMilestone(
  state: GameState,
  milestoneDraws: number
): { nextState: GameState; success: boolean; reason?: string } {
  const def = DIVINATION_MILESTONES.find((m) => m.draws === milestoneDraws);
  if (!def) {
    return { nextState: state, success: false, reason: 'Milestone not found.' };
  }
  if (state.divination.totalDraws < def.draws) {
    return { nextState: state, success: false, reason: `Reach ${def.draws} total draws first.` };
  }
  if (state.divination.claimedMilestones.includes(def.draws)) {
    return { nextState: state, success: false, reason: 'Milestone already claimed.' };
  }

  return {
    success: true,
    nextState: {
      ...state,
      player: {
        ...state.player,
        diamonds: state.player.diamonds + def.diamonds,
      },
      bag: addBagItemQuantity(state.bag, 'ascension-stone', def.ascensionStones),
      divination: {
        ...state.divination,
        claimedMilestones: [...state.divination.claimedMilestones, def.draws],
      },
    },
  };
}

export function autoCraftShards(state: GameState): {
  nextState: GameState;
  craftedCount: number;
  summary: string;
} {
  let workingHeroes = state.heroes.map((h) => ({ ...h }));
  let workingBag = state.bag.map((b) => ({ ...b }));
  let workingGold = state.player.gold;
  const craftedLabels: string[] = [];

  for (const item of state.bag) {
    if (item.category !== 'Shard' || !item.shardHeroId) continue;
    const cost = item.craftCost ?? 20;
    if (item.quantity < cost) continue;

    const hero = workingHeroes.find((h) => h.id === item.shardHeroId);
    if (!hero) continue;

    if (!hero.unlocked) {
      workingHeroes = workingHeroes.map((h) =>
        h.id === hero.id ? { ...h, unlocked: true } : h
      );
      workingBag = addBagItemQuantity(workingBag, item.id, -cost);
      craftedLabels.push(`Unlocked ${hero.name}`);
    } else if (hero.stars < hero.maxStars) {
      workingHeroes = workingHeroes.map((h) =>
        h.id === hero.id ? { ...h, stars: h.stars + 1 } : h
      );
      workingBag = addBagItemQuantity(workingBag, item.id, -cost);
      craftedLabels.push(`${hero.name} +1★`);
    } else {
      workingBag = addBagItemQuantity(workingBag, item.id, -cost);
      workingBag = addBagItemQuantity(workingBag, 'ascension-stone', 5);
      workingGold += 1000;
      craftedLabels.push(`${hero.name} Shards → 5 Stones`);
    }
  }

  if (craftedLabels.length === 0) {
    return {
      nextState: state,
      craftedCount: 0,
      summary: 'No shards currently meet craft threshold.',
    };
  }

  return {
    craftedCount: craftedLabels.length,
    summary: `Auto Craft complete: ${craftedLabels.join(', ')}`,
    nextState: {
      ...state,
      player: { ...state.player, gold: workingGold },
      heroes: workingHeroes,
      bag: workingBag,
    },
  };
}

export function refineDragonSkills(state: GameState): {
  nextState: GameState;
  success: boolean;
  summary: string;
} {
  const srTome = state.bag.find((b) => b.id === 'kame-manual' && b.quantity >= 2);
  if (srTome) {
    let nextBag = addBagItemQuantity(state.bag, 'kame-manual', -2);
    nextBag = addBagItemQuantity(nextBag, 'dragon-ki-mastery', 1, {
      id: 'dragon-ki-mastery',
      name: 'Dragon Ki Mastery Tome',
      category: 'Dragon Skills',
      rarity: 'SSR',
      description: 'Refined SSR Dragon Skill granting +15 starting Rage in Adventure raids.',
      source: 'Refine Synthesis',
      iconKey: 'skill',
    });
    return {
      success: true,
      summary: 'Refined 2x Wave Technique Tome into Dragon Ki Mastery Tome (SSR)!',
      nextState: { ...state, bag: nextBag },
    };
  }

  const ssrTome = state.bag.find((b) => b.id === 'dragon-ki-mastery' && b.quantity >= 2);
  if (ssrTome) {
    let nextBag = addBagItemQuantity(state.bag, 'dragon-ki-mastery', -2);
    nextBag = addBagItemQuantity(nextBag, 'celestial-dragon-codex', 1, {
      id: 'celestial-dragon-codex',
      name: 'Celestial Dragon Codex',
      category: 'Dragon Skills',
      rarity: 'UR',
      description: 'Apex UR Dragon Skill awakening supreme team Ki Resonance.',
      source: 'Refine Synthesis',
      iconKey: 'skill',
    });
    return {
      success: true,
      summary: 'Refined 2x Dragon Ki Mastery Tome into Celestial Dragon Codex (UR)!',
      nextState: { ...state, bag: nextBag },
    };
  }

  return {
    nextState: state,
    success: false,
    summary: 'Need at least 2 identical SR or SSR Dragon Skill tomes to synthesize.',
  };
}

export function useBagItem(
  state: GameState,
  itemId: string
): { nextState: GameState; success: boolean; message: string } {
  const item = state.bag.find((b) => b.id === itemId && b.quantity > 0);
  if (!item) {
    return { nextState: state, success: false, message: 'Item unavailable.' };
  }

  if (item.id === 'stamina-bento') {
    const nextPlayer = applyPlayerExp(
      { ...state.player, gold: state.player.gold + 1200 },
      150
    );
    return {
      success: true,
      message: 'Consumed Master Bento: +1,200 Gold & +150 Player EXP!',
      nextState: {
        ...state,
        player: nextPlayer,
        bag: addBagItemQuantity(state.bag, 'stamina-bento', -1),
      },
    };
  }

  if (item.id === 'dojo-badge') {
    return {
      success: true,
      message: 'Activated Turtle School Badge tribute: +50 Diamonds!',
      nextState: {
        ...state,
        player: { ...state.player, diamonds: state.player.diamonds + 50 },
        bag: addBagItemQuantity(state.bag, 'dojo-badge', -1),
      },
    };
  }

  return {
    nextState: state,
    success: false,
    message: `${item.name} is used automatically in Hero Upgrade or Divination.`,
  };
}

export function isAdventureModeUnlocked(
  mode: AdventureModeDef,
  state: GameState
): boolean {
  if (state.player.level < mode.minPlayerLevel) return false;
  if (
    mode.requiredStageCleared &&
    !state.stageProgress.completedStages.includes(mode.requiredStageCleared)
  ) {
    return false;
  }
  return true;
}

export function completeAdventureModeRun(
  state: GameState,
  modeId: AdventureModeId
): { nextState: GameState; success: boolean; message: string } {
  const mode = ADVENTURE_MODES.find((m) => m.id === modeId);
  if (!mode) return { nextState: state, success: false, message: 'Mode not found.' };
  if (!isAdventureModeUnlocked(mode, state)) {
    return {
      nextState: state,
      success: false,
      message: `Locked: ${mode.unlockRequirementLabel}`,
    };
  }

  const used = state.adventure.dailyAttempts[mode.id] ?? 0;
  if (used >= mode.dailyLimit) {
    return {
      nextState: state,
      success: false,
      message: `Daily attempts (${mode.dailyLimit}/${mode.dailyLimit}) exhausted for ${mode.name}.`,
    };
  }

  let nextBag = state.bag;
  if (mode.rewards.itemId && mode.rewards.itemQty && mode.rewards.itemName) {
    const isShard = mode.rewards.itemId.startsWith('shard-');
    const isTicket = mode.rewards.itemId === 'divination-ticket';
    nextBag = addBagItemQuantity(nextBag, mode.rewards.itemId, mode.rewards.itemQty, {
      id: mode.rewards.itemId,
      name: mode.rewards.itemName,
      category: isShard ? 'Shard' : isTicket ? 'Cost' : 'Materials',
      rarity: 'SR',
      description: `Reward earned from ${mode.name}.`,
      source: mode.name,
      iconKey: isShard ? 'shard' : isTicket ? 'cost' : 'stone',
    });
  }

  const nextCleared = state.adventure.clearedModes.includes(mode.id)
    ? state.adventure.clearedModes
    : [...state.adventure.clearedModes, mode.id];

  return {
    success: true,
    message: `${mode.name} Victory! ${mode.rewardSummary}`,
    nextState: {
      ...state,
      player: {
        ...applyPlayerExp(state.player, mode.rewards.exp),
        gold: state.player.gold + mode.rewards.gold,
        diamonds: state.player.diamonds + mode.rewards.diamonds,
      },
      bag: nextBag,
      adventure: {
        clearedModes: nextCleared,
        dailyAttempts: {
          ...state.adventure.dailyAttempts,
          [mode.id]: used + 1,
        },
      },
    },
  };
}

export function sanitizeLoadedState(raw: unknown): GameState {
  const fallback = createInitialGameState();
  if (!raw || typeof raw !== 'object') return fallback;
  const parsed = raw as Partial<GameState>;
  if (!parsed.player || !Array.isArray(parsed.heroes) || !parsed.stageProgress) {
    return fallback;
  }

  const fallbackHeroMap = new Map(fallback.heroes.map((h) => [h.id, h]));
  const mergedHeroes = fallback.heroes.map((seedHero) => {
    const saved = parsed.heroes?.find((h) => h.id === seedHero.id);
    if (!saved) return seedHero;
    return {
      ...seedHero,
      ...saved,
      roleTag: saved.roleTag ?? seedHero.roleTag,
      baseHp: saved.baseHp ?? seedHero.baseHp,
      baseAtk: saved.baseAtk ?? seedHero.baseAtk,
      baseDef: saved.baseDef ?? seedHero.baseDef,
      spd: saved.spd ?? seedHero.spd,
      ultPattern: saved.ultPattern ?? seedHero.ultPattern,
      skillDescription: saved.skillDescription ?? seedHero.skillDescription,
    };
  });

  for (const h of parsed.heroes) {
    if (!fallbackHeroMap.has(h.id)) mergedHeroes.push(h);
  }

  // Merge Bag items safely so newly added seed items (like Cost / Yamcha Shard) exist when migrating Phase 1/2 saves
  const savedBag = Array.isArray(parsed.bag) ? parsed.bag : [];
  const savedBagMap = new Map(savedBag.map((b) => [b.id, b]));
  const mergedBag = fallback.bag.map((seedItem) => {
    const saved = savedBagMap.get(seedItem.id);
    return saved
      ? {
          ...seedItem,
          ...saved,
          category: saved.category ?? seedItem.category,
          iconKey: saved.iconKey ?? seedItem.iconKey,
          source: saved.source ?? seedItem.source,
        }
      : seedItem;
  });
  for (const b of savedBag) {
    if (!fallback.bag.some((seed) => seed.id === b.id)) {
      mergedBag.push(b);
    }
  }

  const validFormation =
    Array.isArray(parsed.formation) && parsed.formation.length === 5
      ? parsed.formation
      : fallback.formation;

  const savedAfk = parsed.stageProgress.afkReward;
  const elapsedSeconds =
    typeof savedAfk?.elapsedSeconds === 'number'
      ? Math.min(AFK_MAX_SECONDS, Math.max(0, savedAfk.elapsedSeconds))
      : fallback.stageProgress.afkReward.elapsedSeconds;

  const normalizedStory = normalizeStoryStageProgress({
    currentStage: parsed.stageProgress.currentStage ?? fallback.stageProgress.currentStage,
    completedStages: Array.isArray(parsed.stageProgress.completedStages)
      ? parsed.stageProgress.completedStages
      : fallback.stageProgress.completedStages,
  });

  return {
    ...fallback,
    ...parsed,
    heroes: mergedHeroes,
    bag: mergedBag,
    formation: validFormation,
    autoBattle: Boolean(parsed.autoBattle),
    player: {
      ...fallback.player,
      ...parsed.player,
      audio: {
        ...fallback.player.audio,
        ...(parsed.player.audio ?? {}),
      },
    },
    stageProgress: {
      ...fallback.stageProgress,
      ...parsed.stageProgress,
      currentStage: normalizedStory.currentStage,
      completedStages: normalizedStory.completedStages,
      questTracker: {
        ...fallback.stageProgress.questTracker,
        ...(parsed.stageProgress.questTracker ?? {}),
      },
      afkReward: {
        ...fallback.stageProgress.afkReward,
        ...(savedAfk ?? {}),
        elapsedSeconds,
      },
    },
    signIn: {
      ...fallback.signIn,
      ...(parsed.signIn ?? {}),
    },
    resonance: {
      ...fallback.resonance,
      ...(parsed.resonance ?? {}),
      slottedHeroIds:
        Array.isArray(parsed.resonance?.slottedHeroIds) &&
        parsed.resonance.slottedHeroIds.length >= 4
          ? parsed.resonance.slottedHeroIds
          : fallback.resonance.slottedHeroIds,
    },
    divination: {
      ...fallback.divination,
      ...(parsed.divination ?? {}),
      claimedMilestones: Array.isArray(parsed.divination?.claimedMilestones)
        ? parsed.divination.claimedMilestones
        : fallback.divination.claimedMilestones,
    },
    adventure: {
      ...fallback.adventure,
      ...(parsed.adventure ?? {}),
      clearedModes: Array.isArray(parsed.adventure?.clearedModes)
        ? parsed.adventure.clearedModes
        : fallback.adventure.clearedModes,
      dailyAttempts:
        parsed.adventure?.dailyAttempts && typeof parsed.adventure.dailyAttempts === 'object'
          ? parsed.adventure.dailyAttempts
          : fallback.adventure.dailyAttempts,
    },
  };
}
