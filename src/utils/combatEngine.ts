import {
  calculateTeamAura,
  getElementMultiplier,
  STORY_STAGES,
} from '../data/stagesData';
import {
  BattleLoot,
  BattleSimulationResult,
  CombatActionEvent,
  CombatUnit,
  DebuffType,
  FloatingCombatHit,
  GameState,
  Hero,
  StageDef,
  UltPattern,
} from '../types/game';
import {
  addBagItemQuantity,
  applyPlayerExp,
  getBondElementBonuses,
  getHeroEffectivePower,
  getResonanceBaselineLevel,
} from './gameLogic';
import {
  canEnterStoryStage,
  getNextForwardStageId,
  normalizeStoryStageProgress,
} from './storyProgression';

export const MAX_BATTLE_TURNS = 15;
export const AFK_CAP_GOLD = 7200; // 100% cap for visual fullness

export function getAfkCapProgress(accumulatedGold: number): number {
  return Math.min(100, Math.round((accumulatedGold / AFK_CAP_GOLD) * 100));
}

export function getDeployedHeroes(heroes: Hero[], formation: (string | null)[]): Hero[] {
  const byId = new Map(heroes.map((h) => [h.id, h]));
  return formation
    .map((id) => (id ? byId.get(id) : undefined))
    .filter((h): h is Hero => Boolean(h && h.unlocked));
}

export function calculateFormationPower(
  heroes: Hero[],
  formation: (string | null)[]
): number {
  const deployed = getDeployedHeroes(heroes, formation);
  const aura = calculateTeamAura(deployed);
  const raw = deployed.reduce((sum, h) => sum + getHeroEffectivePower(h), 0);
  return Math.round(raw * (1 + aura.atkBonusPct / 200));
}

/**
 * Auto-fills best unlocked heroes into 5 tactical slots:
 * [0, 1] = Front Row (Tank/Melee priority)
 * [2, 3, 4] = Back Row (Mage/Support priority)
 */
export function autoFillFormation(heroes: Hero[]): (string | null)[] {
  const unlocked = heroes
    .filter((h) => h.unlocked)
    .sort((a, b) => getHeroEffectivePower(b) - getHeroEffectivePower(a));

  const frontPriority = unlocked.filter(
    (h) => h.roleTag === 'Tank' || h.roleTag === 'Melee'
  );
  const backPriority = unlocked.filter(
    (h) => h.roleTag === 'Mage' || h.roleTag === 'Support'
  );

  const slots: (string | null)[] = [null, null, null, null, null];
  const used = new Set<string>();

  // First pass: place Tank/Melee into Front Row [0, 1]
  for (const idx of [0, 1]) {
    const pick = frontPriority.find((h) => !used.has(h.id));
    if (pick) {
      slots[idx] = pick.id;
      used.add(pick.id);
    }
  }

  // Second pass: place Mage/Support into Back Row [2, 3, 4]
  for (const idx of [2, 3, 4]) {
    const pick = backPriority.find((h) => !used.has(h.id));
    if (pick) {
      slots[idx] = pick.id;
      used.add(pick.id);
    }
  }

  // Overflow pass: fill any remaining empty slots up to 5 deployed heroes
  for (const idx of [0, 1, 2, 3, 4]) {
    if (slots[idx]) continue;
    const pick = unlocked.find((h) => !used.has(h.id));
    if (pick) {
      slots[idx] = pick.id;
      used.add(pick.id);
    }
  }

  return slots;
}

export function buildPlayerCombatUnits(
  heroes: Hero[],
  formation: (string | null)[],
  resonanceSlotIds: (string | null)[] = []
): CombatUnit[] {
  const deployed = getDeployedHeroes(heroes, formation);
  const aura = calculateTeamAura(deployed);
  const resonanceBaseline = getResonanceBaselineLevel(heroes);
  const byId = new Map(heroes.map((h) => [h.id, h]));

  const units: CombatUnit[] = [];
  formation.forEach((heroId, slotIndex) => {
    if (!heroId) return;
    const hero = byId.get(heroId);
    if (!hero || !hero.unlocked) return;

    const effectiveLevel = resonanceSlotIds.includes(hero.id)
      ? Math.max(hero.level, resonanceBaseline)
      : hero.level;
    const bondBonus = getBondElementBonuses(heroes, hero.element);
    const hpMult = 1 + (aura.hpBonusPct + bondBonus.hpPct) / 100;
    const atkMult = 1 + (aura.atkBonusPct + bondBonus.atkPct) / 100;
    const defMult = 1 + bondBonus.defPct / 100;

    const lvScale = 1 + (effectiveLevel - 1) * 0.025;
    const starScale = 1 + Math.max(0, hero.stars - 3) * 0.16;
    const maxHp = Math.round(hero.baseHp * lvScale * starScale * hpMult);
    const atk = Math.round(hero.baseAtk * lvScale * starScale * atkMult);
    const def = Math.round(hero.baseDef * lvScale * starScale * defMult);

    units.push({
      uid: `p-${hero.id}-${slotIndex}`,
      sourceId: hero.id,
      side: 'player',
      slotIndex,
      name: hero.name,
      element: hero.element,
      roleTag: hero.roleTag,
      ultPattern: hero.ultPattern,
      signatureSkill: hero.signatureSkill,
      image: hero.image,
      hp: maxHp,
      maxHp,
      rage: 0, // Every battle starts at 100% HP and 0 Rage
      atk,
      def,
      spd: hero.spd,
      statuses: [],
      damageDealt: 0,
      healingDone: 0,
    });
  });

  return units;
}

export function buildEnemyCombatUnits(stage: StageDef): CombatUnit[] {
  return stage.enemies.map((e) => ({
    uid: `e-${e.id}`,
    sourceId: e.id,
    side: 'enemy',
    slotIndex: e.slotIndex,
    name: e.name,
    element: e.element,
    roleTag: e.roleTag,
    ultPattern: e.ultPattern,
    signatureSkill: e.signatureSkill,
    image: e.image,
    hp: e.hp,
    maxHp: e.hp,
    rage: 0,
    atk: e.atk,
    def: e.def,
    spd: e.spd,
    statuses: [],
    damageDealt: 0,
    healingDone: 0,
    isBoss: e.isBoss,
  }));
}

export function getUltPreviewSlotIndices(pattern: UltPattern): number[] {
  switch (pattern) {
    case 'SINGLE_FRONT':
      return [0];
    case 'FRONT_ROW':
      return [0, 1];
    case 'COLUMN':
      return [0, 2];
    case 'BACK_ROW':
      return [2, 3, 4];
    case 'ALL_ENEMIES':
      return [0, 1, 2, 3, 4];
    case 'ALLY_HEAL_BUFF':
      return [0, 1, 2, 3, 4];
  }
}

function selectTargets(
  actor: CombatUnit,
  allies: CombatUnit[],
  opponents: CombatUnit[],
  isUltimate: boolean
): CombatUnit[] {
  const livingOpponents = opponents.filter((u) => u.hp > 0);
  const livingAllies = allies.filter((u) => u.hp > 0);
  if (livingOpponents.length === 0) return [];

  if (isUltimate && actor.ultPattern === 'ALLY_HEAL_BUFF') {
    const lowest = [...livingAllies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    return lowest.slice(0, Math.min(2, lowest.length));
  }

  const frontOpponents = livingOpponents.filter((u) => u.slotIndex <= 1);
  const backOpponents = livingOpponents.filter((u) => u.slotIndex >= 2);

  if (!isUltimate || actor.ultPattern === 'SINGLE_FRONT') {
    // Normal attacks always hit Front Row first unless Front Row is defeated
    const pool = frontOpponents.length > 0 ? frontOpponents : backOpponents;
    return [pool[0]];
  }

  switch (actor.ultPattern) {
    case 'FRONT_ROW':
      return frontOpponents.length > 0 ? frontOpponents : backOpponents.slice(0, 2);
    case 'BACK_ROW':
      return backOpponents.length > 0 ? backOpponents : frontOpponents;
    case 'COLUMN': {
      const targetFront = frontOpponents[0] ?? livingOpponents[0];
      const pairedBack =
        targetFront.slotIndex === 0
          ? livingOpponents.find((u) => u.slotIndex === 2 || u.slotIndex === 3)
          : livingOpponents.find((u) => u.slotIndex === 4 || u.slotIndex === 3);
      return pairedBack && pairedBack.uid !== targetFront.uid
        ? [targetFront, pairedBack]
        : [targetFront];
    }
    case 'ALL_ENEMIES':
      return livingOpponents;
    default:
      return [frontOpponents[0] ?? livingOpponents[0]];
  }
}

function hasStatus(unit: CombatUnit, type: DebuffType): boolean {
  return unit.statuses.some((s) => s.type === type && s.turnsRemaining > 0);
}

function applyStatus(unit: CombatUnit, type: DebuffType, turns: number) {
  const existing = unit.statuses.find((s) => s.type === type);
  if (existing) {
    existing.turnsRemaining = Math.max(existing.turnsRemaining, turns);
  } else {
    unit.statuses.push({ type, turnsRemaining: turns });
  }
}

export function simulateBattle(
  initialPlayers: CombatUnit[],
  initialEnemies: CombatUnit[],
  stage: StageDef,
  questCurrent: number,
  questTarget: number,
  rng: () => number = Math.random
): BattleSimulationResult {
  const players = initialPlayers.map((u) => ({ ...u, statuses: [...u.statuses] }));
  const enemies = initialEnemies.map((u) => ({ ...u, statuses: [...u.statuses] }));
  const events: CombatActionEvent[] = [];

  let totalPlayerDamage = 0;
  let turnsTaken = 0;

  for (let turn = 1; turn <= MAX_BATTLE_TURNS; turn++) {
    turnsTaken = turn;

    // Tick Burn DoT at start of turn
    for (const unit of [...players, ...enemies]) {
      if (unit.hp <= 0) continue;
      if (hasStatus(unit, 'BURN')) {
        const burnDmg = Math.max(120, Math.round(unit.maxHp * 0.05));
        unit.hp = Math.max(0, unit.hp - burnDmg);
      }
      unit.statuses = unit.statuses
        .map((s) => ({ ...s, turnsRemaining: s.turnsRemaining - 1 }))
        .filter((s) => s.turnsRemaining > 0);
    }

    if (enemies.every((e) => e.hp <= 0) || players.every((p) => p.hp <= 0)) {
      break;
    }

    // Sequential turn order based on SPD
    const actOrder = [...players, ...enemies]
      .filter((u) => u.hp > 0)
      .sort((a, b) => b.spd - a.spd || a.slotIndex - b.slotIndex);

    for (const actor of actOrder) {
      if (actor.hp <= 0) continue;
      if (enemies.every((e) => e.hp <= 0) || players.every((p) => p.hp <= 0)) {
        break;
      }

      if (hasStatus(actor, 'STUN')) {
        continue;
      }

      const allies = actor.side === 'player' ? players : enemies;
      const opponents = actor.side === 'player' ? enemies : players;

      const isUltimate = actor.rage >= 100;
      const targets = selectTargets(actor, allies, opponents, isUltimate);
      if (targets.length === 0) continue;

      const hits: FloatingCombatHit[] = [];

      if (isUltimate && actor.ultPattern === 'ALLY_HEAL_BUFF') {
        actor.rage = 0;
        for (const ally of targets) {
          const healAmount = Math.round(actor.atk * 1.15);
          ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
          ally.rage = Math.min(100, ally.rage + 20);
          applyStatus(ally, 'ATK_UP', 2);
          actor.healingDone += healAmount;
          hits.push({
            targetUid: ally.uid,
            amount: healAmount,
            isCrit: false,
            isHeal: true,
            appliedDebuff: 'ATK_UP',
          });
        }
      } else {
        if (isUltimate) {
          actor.rage = 0;
        } else {
          actor.rage = Math.min(100, actor.rage + 35);
        }

        const atkBoost = hasStatus(actor, 'ATK_UP') ? 1.2 : 1.0;
        const skillMult = isUltimate
          ? actor.ultPattern === 'ALL_ENEMIES'
            ? 1.28
            : actor.ultPattern === 'FRONT_ROW' || actor.ultPattern === 'COLUMN'
            ? 1.5
            : 1.85
          : 1.0;

        for (const target of targets) {
          const defMod = hasStatus(target, 'DEF_DOWN') ? 0.75 : 1.0;
          const elemMult = getElementMultiplier(actor.element, target.element);
          const isCrit = rng() < (isUltimate ? 0.28 : 0.16);
          const critMult = isCrit ? 1.55 : 1.0;
          const variance = 0.94 + rng() * 0.12;

          const effectiveDef = target.def * defMod;
          const baseDmg = Math.max(
            actor.atk * 0.35,
            actor.atk * atkBoost - effectiveDef * 0.45
          );
          const finalDmg = Math.max(
            90,
            Math.round(baseDmg * skillMult * elemMult * critMult * variance)
          );

          target.hp = Math.max(0, target.hp - finalDmg);
          target.rage = Math.min(100, target.rage + 15);
          actor.damageDealt += finalDmg;
          if (actor.side === 'player') {
            totalPlayerDamage += finalDmg;
          }

          let appliedDebuff: DebuffType | undefined;
          if (isUltimate && target.hp > 0) {
            if (actor.roleTag === 'Melee' || actor.roleTag === 'Tank') {
              applyStatus(target, 'DEF_DOWN', 2);
              appliedDebuff = 'DEF_DOWN';
            } else if (actor.roleTag === 'Mage') {
              const debuff: DebuffType = rng() < 0.35 ? 'STUN' : 'BURN';
              applyStatus(target, debuff, debuff === 'STUN' ? 1 : 2);
              appliedDebuff = debuff;
            }
          }

          hits.push({
            targetUid: target.uid,
            amount: finalDmg,
            isCrit,
            isHeal: false,
            appliedDebuff,
          });
        }
      }

      events.push({
        turn,
        actorUid: actor.uid,
        actorSide: actor.side,
        actorName: actor.name,
        isUltimate,
        skillName: isUltimate ? actor.signatureSkill : 'Basic Attack',
        ultPattern: actor.ultPattern,
        hits,
        totalPlayerDamageSoFar: totalPlayerDamage,
      });
    }

    if (enemies.every((e) => e.hp <= 0) || players.every((p) => p.hp <= 0)) {
      break;
    }
  }

  const allEnemiesDefeated = enemies.every((e) => e.hp <= 0);
  const allAlliesDefeated = players.every((p) => p.hp <= 0);
  const victory = allEnemiesDefeated && !allAlliesDefeated;

  const reason = allEnemiesDefeated
    ? 'ALL_ENEMIES_DEFEATED'
    : allAlliesDefeated
    ? 'ALL_ALLIES_DEFEATED'
    : 'TURN_LIMIT_REACHED';

  const mvpUnit = [...players].sort(
    (a, b) => b.damageDealt + b.healingDone - (a.damageDealt + a.healingDone)
  )[0];

  let loot: BattleLoot | null = null;
  if (victory) {
    const nextQuestCount = Math.min(questTarget, questCurrent + 1);
    const hitsTenOfTen = questCurrent < questTarget && nextQuestCount >= questTarget;
    loot = {
      gold: stage.rewards.gold,
      exp: stage.rewards.exp,
      diamonds: stage.rewards.diamonds,
      ascensionStones: stage.rewards.ascensionStones,
      shardHeroId: stage.rewards.shardHeroId,
      shardQty: stage.rewards.shardQty,
      shardName:
        stage.rewards.shardHeroId === 'prince-vegeta'
          ? 'Prince Vegeta Shard'
          : stage.rewards.shardHeroId === 'small-goku'
          ? 'Small Goku Shard'
          : undefined,
      storyBonusDiamonds: hitsTenOfTen ? 200 : undefined,
    };
  }

  return {
    victory,
    turnsTaken,
    reason,
    events,
    finalPlayers: players,
    finalEnemies: enemies,
    totalPlayerDamage,
    mvpUnit,
    loot,
  };
}

export function applyBattleVictoryToState(
  state: GameState,
  stageId: string,
  loot: BattleLoot
): GameState {
  const entryCheck = canEnterStoryStage(state, stageId);
  if (!entryCheck.allowed) {
    // Reject already cleared, skipped, unknown, or level-locked stages without mutating state
    return state;
  }

  const normalized = normalizeStoryStageProgress({
    currentStage: getNextForwardStageId(state.stageProgress.currentStage, stageId),
    completedStages: [...state.stageProgress.completedStages, stageId],
  });

  const nextQuestCurrent = Math.min(
    state.stageProgress.questTracker.target,
    state.stageProgress.questTracker.current + 1
  );

  const bonusDiamonds = loot.storyBonusDiamonds ?? 0;
  const nextPlayer = {
    ...applyPlayerExp(state.player, loot.exp),
    gold: state.player.gold + loot.gold,
    diamonds: state.player.diamonds + loot.diamonds + bonusDiamonds,
  };

  let nextBag = addBagItemQuantity(
    state.bag,
    'ascension-stone',
    loot.ascensionStones
  );

  if (loot.shardHeroId && loot.shardQty) {
    const shardId =
      loot.shardHeroId === 'small-goku'
        ? 'shard-goku'
        : loot.shardHeroId === 'prince-vegeta'
        ? 'shard-vegeta'
        : `shard-${loot.shardHeroId}`;
    const exists = nextBag.some((b) => b.id === shardId);
    if (exists) {
      nextBag = addBagItemQuantity(nextBag, shardId, loot.shardQty);
    } else if (loot.shardName) {
      nextBag = [
        ...nextBag,
        {
          id: shardId,
          name: loot.shardName,
          category: 'Shard',
          quantity: loot.shardQty,
          rarity: 'SSR',
          description: `Hero fragments earned from ${stageId}.`,
          iconKey: 'shard',
        },
      ];
    }
  }

  return {
    ...state,
    player: nextPlayer,
    bag: nextBag,
    stageProgress: {
      ...state.stageProgress,
      currentStage: STORY_STAGES.some((s) => s.id === normalized.currentStage)
        ? normalized.currentStage
        : state.stageProgress.currentStage,
      completedStages: normalized.completedStages,
      questTracker: {
        ...state.stageProgress.questTracker,
        current: nextQuestCurrent,
        bonusClaimed:
          state.stageProgress.questTracker.bonusClaimed ||
          Boolean(loot.storyBonusDiamonds),
      },
    },
  };
}
