import { ASSETS } from './gameSeed';
import { AuraSummary, ElementType, Hero, StageDef, StageEnemyDef } from '../types/game';

function makeTrooper(
  id: string,
  name: string,
  slotIndex: number,
  level: number,
  element: ElementType,
  roleTag: 'Tank' | 'Melee' | 'Mage' | 'Support',
  scale: number
): StageEnemyDef {
  return {
    id,
    name,
    element,
    roleTag,
    ultPattern: roleTag === 'Mage' ? 'BACK_ROW' : roleTag === 'Support' ? 'ALLY_HEAL_BUFF' : 'SINGLE_FRONT',
    signatureSkill:
      roleTag === 'Mage'
        ? 'Plasma Volley!'
        : roleTag === 'Support'
        ? 'Field Repair!'
        : 'Vanguard Crush!',
    slotIndex,
    level,
    hp: Math.round(9200 * scale),
    atk: Math.round(780 * scale),
    def: Math.round(320 * scale),
    spd: 96 + level,
    power: Math.round(28000 * scale),
    image: ASSETS.enemyTrooper,
  };
}

function makeBoss(
  id: string,
  name: string,
  slotIndex: number,
  level: number,
  element: ElementType,
  scale: number
): StageEnemyDef {
  return {
    id,
    name,
    element,
    roleTag: 'Melee',
    ultPattern: 'FRONT_ROW',
    signatureSkill: 'Crimson Nova Slash!',
    slotIndex,
    level,
    hp: Math.round(16800 * scale),
    atk: Math.round(1150 * scale),
    def: Math.round(450 * scale),
    spd: 112 + level,
    power: Math.round(52000 * scale),
    image: ASSETS.enemyWarlord,
    isBoss: true,
  };
}

export const STORY_STAGES: StageDef[] = [
  {
    id: '1-1',
    name: 'Beachhead Patrol',
    chapter: 1,
    order: 1,
    minPlayerLevel: 1,
    isElite: false,
    enemyPower: 64000,
    enemies: [
      makeTrooper('e-11-1', 'Scout Trooper', 0, 5, 'PHY', 'Melee', 0.65),
      makeTrooper('e-11-2', 'Blaster Drone', 2, 5, 'INT', 'Mage', 0.6),
    ],
    rewards: { gold: 2200, exp: 120, diamonds: 40, ascensionStones: 2 },
  },
  {
    id: '1-2',
    name: 'Coral Ridge',
    chapter: 1,
    order: 2,
    minPlayerLevel: 2,
    isElite: false,
    enemyPower: 82000,
    enemies: [
      makeTrooper('e-12-1', 'Shield Trooper', 0, 7, 'STR', 'Tank', 0.72),
      makeTrooper('e-12-2', 'Scout Trooper', 1, 7, 'PHY', 'Melee', 0.68),
      makeTrooper('e-12-3', 'Signal Scout', 3, 7, 'INT', 'Mage', 0.65),
    ],
    rewards: { gold: 2600, exp: 140, diamonds: 45, ascensionStones: 2 },
  },
  {
    id: '1-3',
    name: 'Palm Gorge',
    chapter: 1,
    order: 3,
    minPlayerLevel: 2,
    isElite: false,
    enemyPower: 105000,
    enemies: [
      makeTrooper('e-13-1', 'Iron Vanguard', 0, 9, 'STR', 'Tank', 0.8),
      makeTrooper('e-13-2', 'Plasma Sniper', 2, 9, 'INT', 'Mage', 0.75),
      makeTrooper('e-13-3', 'Med-Tech Unit', 4, 9, 'PHY', 'Support', 0.72),
    ],
    rewards: { gold: 3100, exp: 165, diamonds: 50, ascensionStones: 3 },
  },
  {
    id: '1-4',
    name: 'Tidal Ruins',
    chapter: 1,
    order: 4,
    minPlayerLevel: 2,
    isElite: false,
    enemyPower: 132000,
    enemies: [
      makeTrooper('e-14-1', 'Armored Guard', 0, 11, 'PHY', 'Tank', 0.88),
      makeTrooper('e-14-2', 'Shock Striker', 1, 11, 'STR', 'Melee', 0.85),
      makeTrooper('e-14-3', 'Plasma Sniper', 3, 11, 'INT', 'Mage', 0.8),
    ],
    rewards: { gold: 3600, exp: 190, diamonds: 55, ascensionStones: 3 },
  },
  {
    id: '1-5',
    name: 'Cliffside Outpost',
    chapter: 1,
    order: 5,
    minPlayerLevel: 2,
    isElite: false,
    enemyPower: 158000,
    enemies: [
      makeTrooper('e-15-1', 'Vanguard Brute', 0, 13, 'STR', 'Tank', 0.95),
      makeTrooper('e-15-2', 'Vanguard Striker', 1, 13, 'PHY', 'Melee', 0.9),
      makeTrooper('e-15-3', 'Void Gunner', 2, 13, 'INT', 'Mage', 0.88),
      makeTrooper('e-15-4', 'Field Medic', 4, 13, 'PHY', 'Support', 0.82),
    ],
    rewards: { gold: 4200, exp: 220, diamonds: 60, ascensionStones: 4 },
  },
  {
    id: '1-6',
    name: 'Sanctuary Cliff Boss',
    chapter: 1,
    order: 6,
    minPlayerLevel: 2,
    isElite: true,
    enemyPower: 185000,
    enemies: [
      makeBoss('e-16-boss', 'Warlord Kraal', 0, 16, 'STR', 1.05),
      makeTrooper('e-16-1', 'Vanguard Guard', 1, 15, 'PHY', 'Tank', 0.96),
      makeTrooper('e-16-2', 'Plasma Sniper', 2, 15, 'INT', 'Mage', 0.92),
      makeTrooper('e-16-3', 'Scout Medic', 4, 15, 'PHY', 'Support', 0.88),
    ],
    rewards: {
      gold: 6500,
      exp: 320,
      diamonds: 100,
      ascensionStones: 5,
      shardHeroId: 'small-goku',
      shardQty: 5,
    },
  },
  {
    id: '1-7',
    name: 'Skyline Causeway',
    chapter: 1,
    order: 7,
    minPlayerLevel: 3,
    isElite: false,
    enemyPower: 218000,
    enemies: [
      makeTrooper('e-17-1', 'Heavy Sentinel', 0, 18, 'PHY', 'Tank', 1.12),
      makeTrooper('e-17-2', 'Galactic Raider', 1, 18, 'STR', 'Melee', 1.08),
      makeTrooper('e-17-3', 'Nova Caster', 2, 18, 'INT', 'Mage', 1.05),
      makeTrooper('e-17-4', 'Nova Caster II', 3, 18, 'INT', 'Mage', 1.02),
    ],
    rewards: { gold: 7400, exp: 360, diamonds: 90, ascensionStones: 5 },
  },
  {
    id: '1-8',
    name: 'Pagoda Courtyard',
    chapter: 1,
    order: 8,
    minPlayerLevel: 4,
    isElite: false,
    enemyPower: 248000,
    enemies: [
      makeTrooper('e-18-1', 'Elite Bulwark', 0, 20, 'STR', 'Tank', 1.22),
      makeTrooper('e-18-2', 'Elite Striker', 1, 20, 'PHY', 'Melee', 1.18),
      makeTrooper('e-18-3', 'Starlight Sniper', 2, 20, 'S', 'Mage', 1.14),
      makeTrooper('e-18-4', 'Field Surgeon', 4, 20, 'INT', 'Support', 1.1),
    ],
    rewards: { gold: 8500, exp: 410, diamonds: 100, ascensionStones: 6 },
  },
  {
    id: '1-9',
    name: 'Dragon Gate Steps',
    chapter: 1,
    order: 9,
    minPlayerLevel: 5,
    isElite: false,
    enemyPower: 282000,
    enemies: [
      makeTrooper('e-19-1', 'Royal Vanguard', 0, 22, 'UL', 'Tank', 1.32),
      makeTrooper('e-19-2', 'Shadow Raider', 1, 22, 'STR', 'Melee', 1.28),
      makeTrooper('e-19-3', 'Arcane Trooper', 2, 22, 'INT', 'Mage', 1.24),
      makeTrooper('e-19-4', 'Arcane Trooper II', 3, 22, 'PHY', 'Mage', 1.2),
      makeTrooper('e-19-5', 'Tech Officer', 4, 22, 'S', 'Support', 1.15),
    ],
    rewards: { gold: 9600, exp: 460, diamonds: 120, ascensionStones: 6 },
  },
  {
    id: '1-10',
    name: 'Summit Citadel Boss',
    chapter: 1,
    order: 10,
    minPlayerLevel: 6,
    isElite: true,
    enemyPower: 330000,
    enemies: [
      makeBoss('e-110-boss', 'Overlord Vexar', 0, 25, 'UL', 1.45),
      makeTrooper('e-110-1', 'Citadel Guard', 1, 24, 'STR', 'Tank', 1.34),
      makeTrooper('e-110-2', 'Orbital Gunner', 2, 24, 'INT', 'Mage', 1.3),
      makeTrooper('e-110-3', 'Plasma Bombardier', 3, 24, 'PHY', 'Mage', 1.28),
      makeTrooper('e-110-4', 'Citadel Medic', 4, 24, 'S', 'Support', 1.24),
    ],
    rewards: {
      gold: 14000,
      exp: 600,
      diamonds: 180,
      ascensionStones: 10,
      shardHeroId: 'prince-vegeta',
      shardQty: 10,
    },
  },
];

export function getStageById(stageId: string): StageDef {
  return STORY_STAGES.find((s) => s.id === stageId) ?? STORY_STAGES[5];
}

export function getNextStageId(currentStageId: string): string | null {
  const idx = STORY_STAGES.findIndex((s) => s.id === currentStageId);
  if (idx === -1 || idx >= STORY_STAGES.length - 1) return null;
  return STORY_STAGES[idx + 1].id;
}

/**
 * Rock-paper-scissors elemental multiplier:
 * STR -> PHY -> INT -> STR (1.2x advantage, 0.88x disadvantage)
 * S <-> UL mutual advantage (1.18x against each other)
 */
export function getElementMultiplier(attacker: ElementType, defender: ElementType): number {
  if (
    (attacker === 'STR' && defender === 'PHY') ||
    (attacker === 'PHY' && defender === 'INT') ||
    (attacker === 'INT' && defender === 'STR')
  ) {
    return 1.2;
  }
  if (
    (attacker === 'PHY' && defender === 'STR') ||
    (attacker === 'INT' && defender === 'PHY') ||
    (attacker === 'STR' && defender === 'INT')
  ) {
    return 0.88;
  }
  if (
    (attacker === 'S' && defender === 'UL') ||
    (attacker === 'UL' && defender === 'S')
  ) {
    return 1.18;
  }
  return 1.0;
}

export function calculateTeamAura(deployedHeroes: Hero[]): AuraSummary {
  if (deployedHeroes.length === 0) {
    return {
      name: 'No Aura',
      description: 'Deploy heroes to activate tactical synergy.',
      atkBonusPct: 0,
      hpBonusPct: 0,
      active: false,
    };
  }

  const counts = new Map<ElementType, number>();
  deployedHeroes.forEach((h) => {
    counts.set(h.element, (counts.get(h.element) ?? 0) + 1);
  });

  const maxSame = Math.max(...Array.from(counts.values()));
  const distinctCount = counts.size;

  if (maxSame >= 3) {
    return {
      name: 'Mono Element Resonance',
      description: '3+ heroes share an element: +14% ATK & +14% HP.',
      atkBonusPct: 14,
      hpBonusPct: 14,
      active: true,
    };
  }

  if (distinctCount >= 3) {
    return {
      name: 'Tri-Element Harmony',
      description: '3+ distinct elements deployed: +10% ATK & +10% HP.',
      atkBonusPct: 10,
      hpBonusPct: 10,
      active: true,
    };
  }

  if (deployedHeroes.length >= 2) {
    return {
      name: 'Vanguard Duo',
      description: '2+ martial heroes deployed: +5% ATK & +5% HP.',
      atkBonusPct: 5,
      hpBonusPct: 5,
      active: true,
    };
  }

  return {
    name: 'Solo Stance',
    description: 'Deploy 2+ heroes for an Aura stat bonus.',
    atkBonusPct: 0,
    hpBonusPct: 0,
    active: false,
  };
}
