export type Rarity = 'UR' | 'SSR' | 'SR' | 'R' | 'N';

export type ElementType = 'STR' | 'PHY' | 'INT' | 'S' | 'UL';

export type HeroClass = 'Melee' | 'Mage/Support' | 'Support' | 'Tank/Mage' | 'Fighter';

export type UltPattern =
  | 'SINGLE_FRONT'
  | 'FRONT_ROW'
  | 'COLUMN'
  | 'BACK_ROW'
  | 'ALL_ENEMIES'
  | 'ALLY_HEAL_BUFF';

export type DebuffType = 'DEF_DOWN' | 'BURN' | 'STUN' | 'ATK_UP';

export type PrimaryTab =
  | 'home'
  | 'adventure'
  | 'adventurers'
  | 'summon'
  | 'growth'
  | 'bag';

export type TabId = PrimaryTab;

export type AdventureRoute =
  | 'hub'
  | 'story-map'
  | 'mode-detail'
  | 'formation'
  | 'battle'
  | 'result';

export interface AppNavigationState {
  primaryTab: PrimaryTab;
  adventureRoute: AdventureRoute;
  selectedStageId: string | null;
  selectedModeId: string | null;
  activeBattleSessionId: string | null;
}

export type ProfileSubTab = 'details' | 'portrait' | 'headgear' | 'settings';

export type HeroSubTab = 'warrior' | 'resonance' | 'bond' | 'album';

export type HomeModalId =
  | null
  | 'profile'
  | 'signin'
  | 'benefits'
  | 'community'
  | 'shop'
  | 'legion'
  | 'starup';

export type BagCategory =
  | 'Materials'
  | 'Cost'
  | 'Shard'
  | 'Gear'
  | 'Dragon Soul'
  | 'Essence Crystal'
  | 'Badges'
  | 'Dragon Skills';

export interface Hero {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
  element: ElementType;
  heroClass: HeroClass;
  roleTag: 'Tank' | 'Melee' | 'Mage' | 'Support';
  level: number;
  stars: number;
  maxStars: number;
  basePower: number;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  spd: number;
  ultPattern: UltPattern;
  unlocked: boolean;
  isStarter?: boolean;
  deployedSlot?: number | null;
  image: string;
  quote: string;
  signatureSkill: string;
  skillDescription?: string;
}

export interface HeadgearFrame {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  requirement?: string;
}

export interface AudioSettings {
  music: boolean;
  sfx: boolean;
}

export interface PlayerInfo {
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  vipLevel: number;
  server: string;
  avatarId: string;
  avatarFrameId: string;
  featuredHeroId: string;
  gold: number;
  diamonds: number;
  audio: AudioSettings;
}

export interface AfkRewardState {
  accumulatedGold: number;
  accumulatedExp: number;
  goldPerMin: number;
  expPerMin: number;
  elapsedSeconds: number; // 0..86400 (24h cap)
  lastClaimedAt: number;
}

export interface StageProgress {
  currentStage: string;
  completedStages: string[];
  questTracker: {
    title: string;
    current: number;
    target: number;
    bonusClaimed?: boolean;
  };
  afkReward: AfkRewardState;
}

export interface BagItem {
  id: string;
  name: string;
  category: BagCategory;
  quantity: number;
  rarity: Rarity;
  description: string;
  source?: string;
  iconKey: 'stone' | 'cost' | 'shard' | 'gear' | 'soul' | 'crystal' | 'badge' | 'skill';
  shardHeroId?: string;
  craftCost?: number;
}

export interface SignInDay {
  day: number;
  rewardLabel: string;
  gold?: number;
  diamonds?: number;
  ascensionStones?: number;
}

export interface ResonanceState {
  unlockedSlots: number;
  slottedHeroIds: (string | null)[];
}

export interface DivinationState {
  pityCount: number; // 0..1000
  totalDraws: number;
  freeDailyAvailable: boolean;
  wishHeroId: string | null;
  claimedMilestones: number[];
  autoDismantle: boolean;
  skipAnimation: boolean;
}

export interface AdventureState {
  clearedModes: string[];
  dailyAttempts: Record<string, number>;
}

export interface BondBonus {
  atkPct: number;
  hpPct: number;
  defPct: number;
}

export interface HeroBondDef {
  id: string;
  name: string;
  subtitle: string;
  heroIds: string[];
  targetElements: ElementType[];
  bonus: BondBonus;
}

export type AdventureModeId =
  | 'ruins-battlefield'
  | 'dragon-ball-showdown'
  | 'trials'
  | 'arena'
  | 'planet-clash'
  | 'coop-team'
  | 'legendary-battle'
  | 'lost-forest'
  | 'world-boss'
  | 'time-rift';

export interface AdventureModeDef {
  id: AdventureModeId;
  name: string;
  subtitle: string;
  unlockRequirementLabel: string;
  minPlayerLevel: number;
  requiredStageCleared?: string;
  dailyLimit: number;
  rewardSummary: string;
  rewards: {
    gold: number;
    diamonds: number;
    exp: number;
    itemId?: string;
    itemName?: string;
    itemQty?: number;
  };
  enemyName: string;
  enemyPower: number;
}

export interface DivinationPullEntry {
  hero: Hero;
  wasNewUnlock: boolean;
  convertedToShardQty?: number;
  dismantledStones?: number;
}

export interface GameState {
  player: PlayerInfo;
  heroes: Hero[];
  headgearFrames: HeadgearFrame[];
  stageProgress: StageProgress;
  bag: BagItem[];
  signIn: {
    currentDay: number;
    claimedDays: number[];
  };
  claimedBenefits: string[];
  totalSummons: number;
  // Phase 2 Battle System state
  formation: (string | null)[]; // 5 tactical slots: [0,1] Front Row, [2,3,4] Back Row
  autoBattle: boolean;
  // Phase 3 Systems
  resonance: ResonanceState;
  divination: DivinationState;
  adventure: AdventureState;
}

// Phase 2 Stage & Combat Types
export interface StageEnemyDef {
  id: string;
  name: string;
  element: ElementType;
  roleTag: 'Tank' | 'Melee' | 'Mage' | 'Support';
  ultPattern: UltPattern;
  signatureSkill: string;
  slotIndex: number; // 0..4 (0,1 Front Row; 2,3,4 Back Row)
  level: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  power: number;
  image: string;
  isBoss?: boolean;
}

export interface StageRewardDef {
  gold: number;
  exp: number;
  diamonds: number;
  ascensionStones: number;
  shardHeroId?: string;
  shardQty?: number;
}

export interface StageDef {
  id: string;
  name: string;
  chapter: number;
  order: number;
  minPlayerLevel: number;
  isElite: boolean;
  enemyPower: number;
  enemies: StageEnemyDef[];
  rewards: StageRewardDef;
}

export interface AuraSummary {
  name: string;
  description: string;
  atkBonusPct: number;
  hpBonusPct: number;
  active: boolean;
}

export interface CombatStatusEffect {
  type: DebuffType;
  turnsRemaining: number;
}

export interface CombatUnit {
  uid: string;
  sourceId: string;
  side: 'player' | 'enemy';
  slotIndex: number;
  name: string;
  element: ElementType;
  roleTag: 'Tank' | 'Melee' | 'Mage' | 'Support';
  ultPattern: UltPattern;
  signatureSkill: string;
  image: string;
  hp: number;
  maxHp: number;
  rage: number; // 0..100
  atk: number;
  def: number;
  spd: number;
  statuses: CombatStatusEffect[];
  damageDealt: number;
  healingDone: number;
  isBoss?: boolean;
}

export interface FloatingCombatHit {
  targetUid: string;
  amount: number;
  isCrit: boolean;
  isHeal: boolean;
  appliedDebuff?: DebuffType;
}

export interface CombatActionEvent {
  turn: number;
  actorUid: string;
  actorSide: 'player' | 'enemy';
  actorName: string;
  isUltimate: boolean;
  skillName: string;
  ultPattern: UltPattern;
  hits: FloatingCombatHit[];
  totalPlayerDamageSoFar: number;
}

export interface BattleLoot {
  gold: number;
  exp: number;
  diamonds: number;
  ascensionStones: number;
  shardName?: string;
  shardHeroId?: string;
  shardQty?: number;
  storyBonusDiamonds?: number;
}

export interface BattleSimulationResult {
  victory: boolean;
  turnsTaken: number;
  reason: 'ALL_ENEMIES_DEFEATED' | 'ALL_ALLIES_DEFEATED' | 'TURN_LIMIT_REACHED';
  events: CombatActionEvent[];
  finalPlayers: CombatUnit[];
  finalEnemies: CombatUnit[];
  totalPlayerDamage: number;
  mvpUnit: CombatUnit;
  loot: BattleLoot | null;
}
