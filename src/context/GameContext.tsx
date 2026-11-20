import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createInitialGameState } from '../data/gameSeed';
import {
  AdventureModeId,
  AppNavigationState,
  BattleLoot,
  DivinationPullEntry,
  GameState,
  Hero,
  HomeModalId,
  PrimaryTab,
  ProfileSubTab,
  TabId,
} from '../types/game';
import { applyBattleVictoryToState } from '../utils/combatEngine';
import {
  addBagItemQuantity,
  applyDevBoost,
  autoCraftShards,
  calculateTeamPower,
  claimAfkRewards,
  claimDivinationMilestone,
  claimSignInReward,
  completeAdventureModeRun,
  performDivinationBatch,
  performDivinationSummon,
  refineDragonSkills,
  sanitizeLoadedState,
  starUpHero,
  starUpHeroWithShards,
  tickAfkRewards,
  toggleResonanceSlot,
  unlockResonanceSlot,
  upgradeHeroLevel,
  useBagItem,
} from '../utils/gameLogic';
import {
  backFromFormation,
  completeAdventureBattle,
  createInitialNavigationState,
  exitAdventureBattleToStoryMap,
  goToAdventureHub,
  openAdventureStoryMap,
  selectPrimaryTab,
  setSelectedAdventureMode,
  tryOpenAdventureFormation,
  tryStartAdventureBattle,
} from '../utils/navigation';
import { soundFx } from '../utils/soundFx';

const STORAGE_KEY = 'dragon_spirit_chronicles_save_v1';

interface GameContextValue {
  state: GameState;
  navState: AppNavigationState;
  activeTab: TabId;
  setActiveTab: (tab: PrimaryTab) => void;
  goAdventureHub: () => void;
  openStoryMapInAdventure: () => void;
  openStoryFormationForStage: (stageId: string) => void;
  backToStoryMapFromFormation: () => void;
  startStoryBattleForStage: (stageId: string) => void;
  completeStoryBattleResult: () => void;
  exitStoryBattleToMap: () => void;
  selectAdventureModeId: (modeId: string | null) => void;
  activeModal: HomeModalId;
  openModal: (modal: HomeModalId) => void;
  closeModal: () => void;
  profileSubTab: ProfileSubTab;
  setProfileSubTab: (sub: ProfileSubTab) => void;
  teamPower: number;
  featuredHero: Hero;
  avatarHero: Hero;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // Actions
  setAvatarHero: (heroId: string) => void;
  setAvatarFrame: (frameId: string) => void;
  setFeaturedHero: (heroId: string) => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  claimSignIn: (day: number) => void;
  claimAfk: () => void;
  claimBenefit: (benefitId: string, diamonds: number, gold: number) => void;
  summonDivination: () => {
    success: boolean;
    pulledHero?: Hero;
    wasNewUnlock?: boolean;
    reason?: string;
  };
  summonDivinationBatch: (count: 1 | 10) => {
    success: boolean;
    pulls: DivinationPullEntry[];
    usedCurrencyLabel: string;
    reason?: string;
  };
  setDivinationWishHero: (heroId: string) => void;
  toggleDivinationAutoDismantle: () => void;
  toggleDivinationSkipAnimation: () => void;
  claimDivinationMilestoneAction: (draws: number) => void;
  levelUpHero: (heroId: string) => void;
  levelUpHeroWithScroll: (heroId: string) => void;
  starUpHeroAction: (heroId: string) => void;
  starUpHeroByShardsAction: (heroId: string) => void;
  toggleResonanceHero: (heroId: string) => void;
  unlockResonanceSlotAction: () => void;
  buyShopItem: (item: {
    id: string;
    name: string;
    costType: 'gold' | 'diamonds';
    cost: number;
    rewardItemId: string;
    quantity: number;
  }) => void;
  autoCraftBagShards: () => void;
  refineBagDragonSkills: () => void;
  useBagItemAction: (itemId: string) => void;
  runAdventureMode: (modeId: AdventureModeId) => { success: boolean; message: string };
  devBoostPlayer: (opts: { addLevels?: number; addVip?: number }) => void;
  setFormation: (formation: (string | null)[]) => void;
  toggleAutoBattle: () => void;
  completeBattleVictory: (stageId: string, loot: BattleLoot) => void;
  resetSaveData: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function loadInitialState(): GameState {
  if (typeof window === 'undefined') return createInitialGameState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialGameState();
    return sanitizeLoadedState(JSON.parse(raw));
  } catch {
    return createInitialGameState();
  }
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(loadInitialState);
  const [navState, setNavState] = useState<AppNavigationState>(createInitialNavigationState);
  const battleSessionCounterRef = useRef(0);
  const [activeModal, setActiveModal] = useState<HomeModalId>(null);
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('details');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeTab = navState.primaryTab;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    document.body.dataset.state = 'playing';
  }, []);

  useEffect(() => {
    soundFx.setAmbientMusic(state.player.audio.music);
    return () => soundFx.setAmbientMusic(false);
  }, [state.player.audio.music]);

  // Passive AFK reward & 24:00:00 timer ticking every 1 second (pauses automatically at 24h cap)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setState((prev) => tickAfkRewards(prev, 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const setActiveTab = useCallback(
    (tab: PrimaryTab) => {
      soundFx.playTabSwitch(state.player.audio.sfx);
      setNavState((prev) => {
        const cancellingBattle =
          prev.primaryTab === 'adventure' &&
          tab !== 'adventure' &&
          (prev.adventureRoute === 'battle' || prev.adventureRoute === 'result');
        if (cancellingBattle) {
          showToast('Battle exited — returning to Story Map');
        }
        return selectPrimaryTab(prev, tab);
      });
    },
    [state.player.audio.sfx, showToast]
  );

  const goAdventureHub = useCallback(() => {
    soundFx.playClick(state.player.audio.sfx);
    setNavState((prev) => goToAdventureHub(prev));
  }, [state.player.audio.sfx]);

  const openStoryMapInAdventure = useCallback(() => {
    soundFx.playTabSwitch(state.player.audio.sfx);
    setNavState((prev) => openAdventureStoryMap(prev));
  }, [state.player.audio.sfx]);

  const openStoryFormationForStage = useCallback(
    (stageId: string) => {
      soundFx.playClick(state.player.audio.sfx);
      const outcome = tryOpenAdventureFormation(navState, state, stageId);
      if (!outcome.allowed) {
        if (outcome.message) showToast(outcome.message);
        return;
      }
      setNavState(outcome.nav);
    },
    [navState, state, showToast]
  );

  const backToStoryMapFromFormation = useCallback(() => {
    soundFx.playClick(state.player.audio.sfx);
    setNavState((prev) => backFromFormation(prev));
  }, [state.player.audio.sfx]);

  const startStoryBattleForStage = useCallback(
    (stageId: string) => {
      soundFx.playClick(state.player.audio.sfx);
      battleSessionCounterRef.current += 1;
      const sessionId = `story-${stageId}-${battleSessionCounterRef.current}`;
      const outcome = tryStartAdventureBattle(navState, state, stageId, sessionId);
      if (!outcome.allowed) {
        if (outcome.message) showToast(outcome.message);
        setNavState(outcome.nav);
        return;
      }
      setNavState(outcome.nav);
    },
    [navState, state, showToast]
  );

  const completeStoryBattleResult = useCallback(() => {
    setNavState((prev) => completeAdventureBattle(prev));
  }, []);

  const exitStoryBattleToMap = useCallback(() => {
    soundFx.playClick(state.player.audio.sfx);
    setNavState((prev) => exitAdventureBattleToStoryMap(prev));
  }, [state.player.audio.sfx]);

  const selectAdventureModeId = useCallback((modeId: string | null) => {
    setNavState((prev) => setSelectedAdventureMode(prev, modeId));
  }, []);

  const openModal = useCallback(
    (modal: HomeModalId) => {
      soundFx.playClick(state.player.audio.sfx);
      if (modal === 'profile') setProfileSubTab('details');
      setActiveModal(modal);
    },
    [state.player.audio.sfx]
  );

  const closeModal = useCallback(() => {
    soundFx.playClick(state.player.audio.sfx);
    setActiveModal(null);
  }, [state.player.audio.sfx]);

  const setAvatarHero = useCallback(
    (heroId: string) => {
      soundFx.playClick(state.player.audio.sfx);
      setState((prev) => ({
        ...prev,
        player: { ...prev.player, avatarId: heroId },
      }));
      showToast('Player portrait updated');
    },
    [state.player.audio.sfx, showToast]
  );

  const setAvatarFrame = useCallback(
    (frameId: string) => {
      soundFx.playClick(state.player.audio.sfx);
      setState((prev) => ({
        ...prev,
        player: { ...prev.player, avatarFrameId: frameId },
      }));
      showToast('Headgear frame equipped');
    },
    [state.player.audio.sfx, showToast]
  );

  const setFeaturedHero = useCallback(
    (heroId: string) => {
      soundFx.playClick(state.player.audio.sfx);
      setState((prev) => ({
        ...prev,
        player: { ...prev.player, featuredHeroId: heroId },
      }));
      showToast('Sanctuary hero updated');
    },
    [state.player.audio.sfx, showToast]
  );

  const toggleMusic = useCallback(() => {
    soundFx.playClick(state.player.audio.sfx);
    setState((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        audio: { ...prev.player.audio, music: !prev.player.audio.music },
      },
    }));
  }, [state.player.audio.sfx]);

  const toggleSfx = useCallback(() => {
    setState((prev) => {
      const nextSfx = !prev.player.audio.sfx;
      if (nextSfx) soundFx.playClick(true);
      return {
        ...prev,
        player: {
          ...prev.player,
          audio: { ...prev.player.audio, sfx: nextSfx },
        },
      };
    });
  }, []);

  const claimSignIn = useCallback(
    (day: number) => {
      soundFx.playClaim(state.player.audio.sfx);
      setState((prev) => claimSignInReward(prev, day));
      showToast(`Day ${day} Sign-In reward claimed!`);
    },
    [state.player.audio.sfx, showToast]
  );

  const claimAfk = useCallback(() => {
    soundFx.playClaim(state.player.audio.sfx);
    setState((prev) => claimAfkRewards(prev));
    showToast('AFK rewards collected!');
  }, [state.player.audio.sfx, showToast]);

  const claimBenefit = useCallback(
    (benefitId: string, diamonds: number, gold: number) => {
      soundFx.playClaim(state.player.audio.sfx);
      setState((prev) => {
        if (prev.claimedBenefits.includes(benefitId)) return prev;
        return {
          ...prev,
          player: {
            ...prev.player,
            diamonds: prev.player.diamonds + diamonds,
            gold: prev.player.gold + gold,
          },
          claimedBenefits: [...prev.claimedBenefits, benefitId],
        };
      });
      showToast('Event reward claimed!');
    },
    [state.player.audio.sfx, showToast]
  );

  const summonDivination = useCallback(() => {
    const outcome = performDivinationSummon(state);
    if (outcome.success) {
      setState(outcome.nextState);
      soundFx.playSummon(state.player.audio.sfx);
    } else {
      soundFx.playClick(state.player.audio.sfx);
      if (outcome.reason) showToast(outcome.reason);
    }
    return {
      success: outcome.success,
      pulledHero: outcome.pulledHero,
      wasNewUnlock: outcome.wasNewUnlock,
      reason: outcome.reason,
    };
  }, [state, showToast]);

  const summonDivinationBatch = useCallback(
    (count: 1 | 10) => {
      const outcome = performDivinationBatch(state, count);
      if (outcome.success) {
        setState(outcome.nextState);
        soundFx.playSummon(state.player.audio.sfx);
      } else {
        soundFx.playClick(state.player.audio.sfx);
        if (outcome.reason) showToast(outcome.reason);
      }
      return {
        success: outcome.success,
        pulls: outcome.pulls,
        usedCurrencyLabel: outcome.usedCurrencyLabel,
        reason: outcome.reason,
      };
    },
    [state, showToast]
  );

  const setDivinationWishHero = useCallback(
    (heroId: string) => {
      soundFx.playClick(state.player.audio.sfx);
      setState((prev) => ({
        ...prev,
        divination: { ...prev.divination, wishHeroId: heroId },
      }));
      showToast('Hero Wish target updated');
    },
    [state.player.audio.sfx, showToast]
  );

  const toggleDivinationAutoDismantle = useCallback(() => {
    soundFx.playClick(state.player.audio.sfx);
    setState((prev) => ({
      ...prev,
      divination: {
        ...prev.divination,
        autoDismantle: !prev.divination.autoDismantle,
      },
    }));
  }, [state.player.audio.sfx]);

  const toggleDivinationSkipAnimation = useCallback(() => {
    soundFx.playClick(state.player.audio.sfx);
    setState((prev) => ({
      ...prev,
      divination: {
        ...prev.divination,
        skipAnimation: !prev.divination.skipAnimation,
      },
    }));
  }, [state.player.audio.sfx]);

  const claimDivinationMilestoneAction = useCallback(
    (draws: number) => {
      const res = claimDivinationMilestone(state, draws);
      if (res.success) {
        setState(res.nextState);
        soundFx.playClaim(state.player.audio.sfx);
        showToast(`${draws}-Draw Milestone claimed!`);
      } else {
        soundFx.playClick(state.player.audio.sfx);
        if (res.reason) showToast(res.reason);
      }
    },
    [state, showToast]
  );

  const levelUpHero = useCallback(
    (heroId: string) => {
      const res = upgradeHeroLevel(state, heroId, false);
      if (res.success) {
        setState(res.nextState);
        soundFx.playClaim(state.player.audio.sfx);
        showToast('Hero leveled up!');
      } else {
        soundFx.playClick(state.player.audio.sfx);
        if (res.reason) showToast(res.reason);
      }
    },
    [state, showToast]
  );

  const levelUpHeroWithScroll = useCallback(
    (heroId: string) => {
      const res = upgradeHeroLevel(state, heroId, true);
      if (res.success) {
        setState(res.nextState);
        soundFx.playClaim(state.player.audio.sfx);
        showToast('Martial Scroll Boost: +2 Hero Levels!');
      } else {
        soundFx.playClick(state.player.audio.sfx);
        if (res.reason) showToast(res.reason);
      }
    },
    [state, showToast]
  );

  const starUpHeroAction = useCallback(
    (heroId: string) => {
      const res = starUpHero(state, heroId);
      if (res.success) {
        setState(res.nextState);
        soundFx.playSummon(state.player.audio.sfx);
        showToast('Star Rank ascended!');
      } else {
        soundFx.playClick(state.player.audio.sfx);
        if (res.reason) showToast(res.reason);
      }
    },
    [state, showToast]
  );

  const starUpHeroByShardsAction = useCallback(
    (heroId: string) => {
      const res = starUpHeroWithShards(state, heroId);
      if (res.success) {
        setState(res.nextState);
        soundFx.playSummon(state.player.audio.sfx);
        showToast('Star Rank ascended via Shards!');
      } else {
        soundFx.playClick(state.player.audio.sfx);
        if (res.reason) showToast(res.reason);
      }
    },
    [state, showToast]
  );

  const toggleResonanceHero = useCallback(
    (heroId: string) => {
      const res = toggleResonanceSlot(state, heroId);
      if (res.success) {
        setState(res.nextState);
        soundFx.playClick(state.player.audio.sfx);
        showToast('Resonance Sanctuary updated');
      } else {
        soundFx.playClick(state.player.audio.sfx);
        if (res.reason) showToast(res.reason);
      }
    },
    [state, showToast]
  );

  const unlockResonanceSlotAction = useCallback(() => {
    const res = unlockResonanceSlot(state);
    if (res.success) {
      setState(res.nextState);
      soundFx.playClaim(state.player.audio.sfx);
      showToast('Unlocked extra Resonance slot!');
    } else {
      soundFx.playClick(state.player.audio.sfx);
      if (res.reason) showToast(res.reason);
    }
  }, [state, showToast]);

  const buyShopItem = useCallback(
    (item: {
      id: string;
      name: string;
      costType: 'gold' | 'diamonds';
      cost: number;
      rewardItemId: string;
      quantity: number;
    }) => {
      const balance = item.costType === 'gold' ? state.player.gold : state.player.diamonds;
      if (balance < item.cost) {
        soundFx.playClick(state.player.audio.sfx);
        showToast(`Insufficient ${item.costType === 'gold' ? 'Gold' : 'Diamonds'}`);
        return;
      }
      soundFx.playClaim(state.player.audio.sfx);
      showToast(`Purchased ${item.name} x${item.quantity}`);
      setState((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          gold: item.costType === 'gold' ? prev.player.gold - item.cost : prev.player.gold,
          diamonds:
            item.costType === 'diamonds' ? prev.player.diamonds - item.cost : prev.player.diamonds,
        },
        bag: addBagItemQuantity(prev.bag, item.rewardItemId, item.quantity),
      }));
    },
    [state.player.gold, state.player.diamonds, state.player.audio.sfx, showToast]
  );

  const autoCraftBagShards = useCallback(() => {
    const res = autoCraftShards(state);
    if (res.craftedCount > 0) {
      setState(res.nextState);
      soundFx.playSummon(state.player.audio.sfx);
    } else {
      soundFx.playClick(state.player.audio.sfx);
    }
    showToast(res.summary);
  }, [state, showToast]);

  const refineBagDragonSkills = useCallback(() => {
    const res = refineDragonSkills(state);
    if (res.success) {
      setState(res.nextState);
      soundFx.playSummon(state.player.audio.sfx);
    } else {
      soundFx.playClick(state.player.audio.sfx);
    }
    showToast(res.summary);
  }, [state, showToast]);

  const useBagItemAction = useCallback(
    (itemId: string) => {
      const res = useBagItem(state, itemId);
      if (res.success) {
        setState(res.nextState);
        soundFx.playClaim(state.player.audio.sfx);
      } else {
        soundFx.playClick(state.player.audio.sfx);
      }
      showToast(res.message);
    },
    [state, showToast]
  );

  const runAdventureMode = useCallback(
    (modeId: AdventureModeId) => {
      const res = completeAdventureModeRun(state, modeId);
      if (res.success) {
        setState(res.nextState);
        soundFx.playVictory(state.player.audio.sfx);
      } else {
        soundFx.playClick(state.player.audio.sfx);
      }
      showToast(res.message);
      return { success: res.success, message: res.message };
    },
    [state, showToast]
  );

  const devBoostPlayer = useCallback(
    (opts: { addLevels?: number; addVip?: number }) => {
      soundFx.playClaim(state.player.audio.sfx);
      setState((prev) => applyDevBoost(prev, opts));
      showToast('Dev boost applied!');
    },
    [state.player.audio.sfx, showToast]
  );

  const setFormation = useCallback((formation: (string | null)[]) => {
    setState((prev) => ({
      ...prev,
      formation,
    }));
  }, []);

  const toggleAutoBattle = useCallback(() => {
    soundFx.playClick(state.player.audio.sfx);
    setState((prev) => ({
      ...prev,
      autoBattle: !prev.autoBattle,
    }));
  }, [state.player.audio.sfx]);

  const completeBattleVictory = useCallback(
    (stageId: string, loot: BattleLoot) => {
      setState((prev) => applyBattleVictoryToState(prev, stageId, loot));
      if (loot.storyBonusDiamonds) {
        showToast('Main Story 10/10 Clear Bonus: +200 Diamonds!');
      }
    },
    [showToast]
  );

  const resetSaveData = useCallback(() => {
    const fresh = createInitialGameState();
    setState(fresh);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
    soundFx.playClick(fresh.player.audio.sfx);
    setActiveModal(null);
    setNavState(createInitialNavigationState());
    showToast('Save data reset to starter state');
  }, [showToast]);

  const teamPower = useMemo(() => calculateTeamPower(state.heroes), [state.heroes]);

  const featuredHero = useMemo(
    () =>
      state.heroes.find((h) => h.id === state.player.featuredHeroId && h.unlocked) ??
      state.heroes[0],
    [state.heroes, state.player.featuredHeroId]
  );

  const avatarHero = useMemo(
    () =>
      state.heroes.find((h) => h.id === state.player.avatarId && h.unlocked) ??
      state.heroes[0],
    [state.heroes, state.player.avatarId]
  );

  const value: GameContextValue = {
    state,
    navState,
    activeTab,
    setActiveTab,
    goAdventureHub,
    openStoryMapInAdventure,
    openStoryFormationForStage,
    backToStoryMapFromFormation,
    startStoryBattleForStage,
    completeStoryBattleResult,
    exitStoryBattleToMap,
    selectAdventureModeId,
    activeModal,
    openModal,
    closeModal,
    profileSubTab,
    setProfileSubTab,
    teamPower,
    featuredHero,
    avatarHero,
    toastMessage,
    showToast,
    setAvatarHero,
    setAvatarFrame,
    setFeaturedHero,
    toggleMusic,
    toggleSfx,
    claimSignIn,
    claimAfk,
    claimBenefit,
    summonDivination,
    summonDivinationBatch,
    setDivinationWishHero,
    toggleDivinationAutoDismantle,
    toggleDivinationSkipAnimation,
    claimDivinationMilestoneAction,
    levelUpHero,
    levelUpHeroWithScroll,
    starUpHeroAction,
    starUpHeroByShardsAction,
    toggleResonanceHero,
    unlockResonanceSlotAction,
    buyShopItem,
    autoCraftBagShards,
    refineBagDragonSkills,
    useBagItemAction,
    runAdventureMode,
    devBoostPlayer,
    setFormation,
    toggleAutoBattle,
    completeBattleVictory,
    resetSaveData,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
