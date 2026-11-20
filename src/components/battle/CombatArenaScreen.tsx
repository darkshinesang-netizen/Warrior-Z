import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FastForward, Lock, LogOut, Sparkles, Zap } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ASSETS } from '../../data/gameSeed';
import {
  BattleSimulationResult,
  CombatActionEvent,
  CombatUnit,
  StageDef,
} from '../../types/game';
import {
  buildEnemyCombatUnits,
  buildPlayerCombatUnits,
  simulateBattle,
} from '../../utils/combatEngine';
import { canSkipBattle, formatGoldOrDiamond } from '../../utils/gameLogic';
import { soundFx } from '../../utils/soundFx';

interface CombatArenaScreenProps {
  stage: StageDef;
  onExit: () => void;
  onComplete: (result: BattleSimulationResult) => void;
}

interface ActiveFloatingHit {
  uid: string;
  amount: number;
  isCrit: boolean;
  isHeal: boolean;
  debuff?: string;
}

export const CombatArenaScreen: React.FC<CombatArenaScreenProps> = ({
  stage,
  onExit,
  onComplete,
}) => {
  const { state, showToast } = useGame();
  const skipUnlocked = canSkipBattle(state.player);

  // Compute deterministic battle script on mount with 100% HP & 0 Rage initial units
  const initialSetup = useMemo(() => {
    const players = buildPlayerCombatUnits(
      state.heroes,
      state.formation,
      state.resonance.slottedHeroIds
    );
    const enemies = buildEnemyCombatUnits(stage);
    const sim = simulateBattle(
      players,
      enemies,
      stage,
      state.stageProgress.questTracker.current,
      state.stageProgress.questTracker.target
    );
    return { players, enemies, sim };
  }, [
    state.heroes,
    state.formation,
    state.resonance.slottedHeroIds,
    stage,
    state.stageProgress.questTracker.current,
    state.stageProgress.questTracker.target,
  ]);

  const [playerUnits, setPlayerUnits] = useState<CombatUnit[]>(() =>
    initialSetup.players.map((u) => ({ ...u }))
  );
  const [enemyUnits, setEnemyUnits] = useState<CombatUnit[]>(() =>
    initialSetup.enemies.map((u) => ({ ...u }))
  );
  const [eventIdx, setEventIdx] = useState<number>(0);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [totalDamage, setTotalDamage] = useState<number>(0);
  const [speedMult, setSpeedMult] = useState<1 | 2>(1);
  const [activeEvent, setActiveEvent] = useState<CombatActionEvent | null>(null);
  const [floatingHits, setFloatingHits] = useState<ActiveFloatingHit[]>([]);
  const [skipTooltipOpen, setSkipTooltipOpen] = useState(false);

  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const sfxEnabled = state.player.audio.sfx;

  useEffect(() => {
    if (finishedRef.current) return;

    const events = initialSetup.sim.events;
    if (eventIdx >= events.length) {
      const finishTimer = window.setTimeout(() => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        if (initialSetup.sim.victory) {
          soundFx.playVictory(sfxEnabled);
        } else {
          soundFx.playDefeat(sfxEnabled);
        }
        onCompleteRef.current(initialSetup.sim);
      }, 420);
      return () => window.clearTimeout(finishTimer);
    }

    const stepDelay = speedMult === 2 ? 340 : 680;
    const timer = window.setTimeout(() => {
      const ev = events[eventIdx];
      setCurrentTurn(ev.turn);
      setActiveEvent(ev);
      setTotalDamage(ev.totalPlayerDamageSoFar);

      if (ev.isUltimate) {
        soundFx.playUltimate(sfxEnabled);
      } else {
        const hasCrit = ev.hits.some((h) => h.isCrit);
        soundFx.playHit(sfxEnabled, hasCrit);
      }

      // Apply event HP/Rage/Status deltas for crisp visual playback
      setPlayerUnits((prev) =>
        prev.map((u) => {
          const copy = { ...u, statuses: [...u.statuses] };
          if (copy.uid === ev.actorUid) {
            copy.rage = ev.isUltimate ? 0 : Math.min(100, copy.rage + 35);
          }
          const hit = ev.hits.find((h) => h.targetUid === copy.uid);
          if (hit) {
            if (hit.isHeal) {
              copy.hp = Math.min(copy.maxHp, copy.hp + hit.amount);
              copy.rage = Math.min(100, copy.rage + 20);
            } else {
              copy.hp = Math.max(0, copy.hp - hit.amount);
              copy.rage = Math.min(100, copy.rage + 15);
            }
          }
          return copy;
        })
      );

      setEnemyUnits((prev) =>
        prev.map((u) => {
          const copy = { ...u, statuses: [...u.statuses] };
          if (copy.uid === ev.actorUid) {
            copy.rage = ev.isUltimate ? 0 : Math.min(100, copy.rage + 35);
          }
          const hit = ev.hits.find((h) => h.targetUid === copy.uid);
          if (hit && !hit.isHeal) {
            copy.hp = Math.max(0, copy.hp - hit.amount);
            copy.rage = Math.min(100, copy.rage + 15);
          }
          return copy;
        })
      );

      setFloatingHits(
        ev.hits.map((h) => ({
          uid: h.targetUid,
          amount: h.amount,
          isCrit: h.isCrit,
          isHeal: h.isHeal,
          debuff:
            h.appliedDebuff === 'DEF_DOWN'
              ? 'DEF↓'
              : h.appliedDebuff === 'BURN'
              ? 'BURN'
              : h.appliedDebuff === 'STUN'
              ? 'STUN'
              : h.appliedDebuff === 'ATK_UP'
              ? 'ATK↑'
              : undefined,
        }))
      );

      setEventIdx((i) => i + 1);
    }, stepDelay);

    return () => window.clearTimeout(timer);
  }, [eventIdx, initialSetup.sim, sfxEnabled, speedMult]);

  const handleSkip = () => {
    if (!skipUnlocked) {
      soundFx.playClick(sfxEnabled);
      setSkipTooltipOpen(true);
      showToast('Unlock at Lv.71 or VIP 3');
      window.setTimeout(() => setSkipTooltipOpen(false), 2600);
      return;
    }
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPlayerUnits(initialSetup.sim.finalPlayers);
    setEnemyUnits(initialSetup.sim.finalEnemies);
    setCurrentTurn(initialSetup.sim.turnsTaken);
    setTotalDamage(initialSetup.sim.totalPlayerDamage);
    if (initialSetup.sim.victory) {
      soundFx.playVictory(sfxEnabled);
    } else {
      soundFx.playDefeat(sfxEnabled);
    }
    onComplete(initialSetup.sim);
  };

  const alivePlayers = playerUnits.filter((u) => u.hp > 0).length;
  const aliveEnemies = enemyUnits.filter((u) => u.hp > 0).length;

  const renderCombatCard = (
    unit: CombatUnit | undefined,
    slotLabel: string,
    slotKey: string,
    sideHint: 'player' | 'enemy'
  ) => {
    if (!unit) {
      return (
        <div
          key={slotKey}
          className="w-[54px] h-[64px] rounded-xl border border-dashed border-slate-700/40 bg-slate-950/20 opacity-30 flex items-center justify-center text-[8px] text-slate-500"
        >
          {slotLabel}
        </div>
      );
    }

    const isDead = unit.hp <= 0;
    const isActing = activeEvent?.actorUid === unit.uid;
    const hitInfo = floatingHits.find((h) => h.uid === unit.uid);
    const hpPct = Math.max(0, Math.round((unit.hp / unit.maxHp) * 100));
    const ragePct = Math.min(100, unit.rage);

    return (
      <div
        key={slotKey}
        className={`relative w-[54px] h-[66px] rounded-xl border-2 transition-transform duration-150 ${
          isDead
            ? 'opacity-35 grayscale border-slate-700 bg-slate-950/80'
            : isActing
            ? unit.side === 'player'
              ? 'translate-x-2 scale-105 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.7)] z-20'
              : '-translate-x-2 scale-105 border-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.7)] z-20'
            : hitInfo && !hitInfo.isHeal
            ? 'border-rose-400 bg-rose-950/60 scale-95'
            : unit.side === 'player'
            ? 'border-sky-300/85 bg-slate-950/85'
            : 'border-rose-400/80 bg-slate-950/85'
        }`}
      >
        <img
          src={unit.image}
          alt={unit.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top rounded-[10px]"
        />

        {/* HP & Rage Bars */}
        <div className="absolute inset-x-0.5 bottom-0.5 bg-slate-950/90 rounded p-0.5 space-y-[2px]">
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-[width] duration-150 ${
                unit.side === 'player' ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-[width] duration-150"
              style={{ width: `${ragePct}%` }}
            />
          </div>
        </div>

        {/* Floating Combat Text */}
        {hitInfo && (
          <div
            className={`pointer-events-none absolute -top-5 z-30 whitespace-nowrap ${
              sideHint === 'enemy' ? 'right-0 text-right' : 'left-0 text-left'
            }`}
          >
            <span
              className={`block font-display font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] tabular-nums ${
                hitInfo.isHeal
                  ? 'text-[11px] text-emerald-300'
                  : hitInfo.isCrit
                  ? 'text-xs text-orange-300'
                  : 'text-[11px] text-white'
              }`}
            >
              {hitInfo.isHeal
                ? `+${formatGoldOrDiamond(hitInfo.amount)}`
                : hitInfo.isCrit
                ? `Critical! -${formatGoldOrDiamond(hitInfo.amount)}`
                : `-${formatGoldOrDiamond(hitInfo.amount)}`}
            </span>
            {hitInfo.debuff && (
              <span className="inline-block px-1 rounded bg-slate-950/90 border border-amber-300/70 text-[8.5px] font-display font-extrabold text-amber-200">
                {hitInfo.debuff}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      className="relative flex-1 flex flex-col overflow-hidden bg-[#070E1F]"
      aria-label="Turn-Based Combat Arena"
    >
      {/* Top Combat HUD: Turn Counter & Total Damage */}
      <div className="shrink-0 px-3 py-2 bg-gradient-to-r from-[#0E2042] via-[#152B56] to-[#2F132A] border-b border-amber-400/45 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-amber-300/60 shrink-0 whitespace-nowrap">
          <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="font-display font-black text-xs text-amber-200 tabular-nums whitespace-nowrap">
            Turn: {currentTurn}/15
          </span>
        </div>

        <span className="font-display font-bold text-xs text-white truncate min-w-0">
          Stage {stage.id} · {stage.name}
        </span>

        <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-rose-400/50 text-[11px] font-display font-extrabold text-rose-200 tabular-nums shrink-0 whitespace-nowrap">
          Dmg: {formatGoldOrDiamond(totalDamage)}
        </div>
      </div>

      {/* Main 5v5 Battlefield */}
      <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col justify-between p-3">
        <img
          src={ASSETS.arenaBattlefieldBg}
          alt="Combat stage"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />

        {/* Dramatic Ultimate Skill Banner + Energy Beam VFX */}
        {activeEvent?.isUltimate && (
          <div className="relative z-30 mx-auto mt-1 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 border-2 border-amber-100 shadow-[0_0_26px_rgba(251,191,36,0.75)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white shrink-0" />
            <span className="font-display font-black text-xs text-white tracking-wide">
              {activeEvent.actorName}: {activeEvent.skillName}
            </span>
          </div>
        )}

        {/* Energy Projectile Beam Overlay during Ultimates */}
        {activeEvent?.isUltimate && (
          <svg
            viewBox="0 0 360 120"
            className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 z-20 opacity-85"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="kiBeamGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop
                  offset="0%"
                  stopColor={activeEvent.actorSide === 'player' ? '#38BDF8' : '#FB7185'}
                  stopOpacity="0.2"
                />
                <stop
                  offset="50%"
                  stopColor={activeEvent.actorSide === 'player' ? '#FDE047' : '#F43F5E'}
                  stopOpacity="0.95"
                />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <rect x="20" y="52" width="320" height="16" rx="8" fill="url(#kiBeamGrad)" />
          </svg>
        )}

        {/* 5v5 Battle Grid */}
        <div className="relative z-10 my-auto flex items-center justify-between gap-2">
          {/* Player Side (Back 3 | Front 2) */}
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col gap-2">
              {[2, 3, 4].map((slot) =>
                renderCombatCard(
                  playerUnits.find((u) => u.slotIndex === slot),
                  'Back',
                  `p-back-${slot}`,
                  'player'
                )
              )}
            </div>
            <div className="flex flex-col gap-3">
              {[0, 1].map((slot) =>
                renderCombatCard(
                  playerUnits.find((u) => u.slotIndex === slot),
                  'Front',
                  `p-front-${slot}`,
                  'player'
                )
              )}
            </div>
          </div>

          {/* Enemy Side (Front 2 | Back 3) */}
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col gap-3">
              {[0, 1].map((slot) =>
                renderCombatCard(
                  enemyUnits.find((u) => u.slotIndex === slot),
                  'Front',
                  `e-front-${slot}`,
                  'enemy'
                )
              )}
            </div>
            <div className="flex flex-col gap-2">
              {[2, 3, 4].map((slot) =>
                renderCombatCard(
                  enemyUnits.find((u) => u.slotIndex === slot),
                  'Back',
                  `e-back-${slot}`,
                  'enemy'
                )
              )}
            </div>
          </div>
        </div>

        {/* Live Action Log Strip */}
        <div className="relative z-20 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-sky-400/35 text-[11px] text-sky-100 text-center truncate">
          {activeEvent
            ? `${activeEvent.actorName} used ${activeEvent.skillName}!`
            : 'Deploying squad at 100% HP and 0 Rage...'}
        </div>
      </div>

      {/* Bottom Combat Controls & Status Bar */}
      <div className="shrink-0 bg-[#0B152B] border-t border-amber-400/40 px-3 pt-2 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onExit}
            className="min-h-[40px] px-3 rounded-xl bg-slate-900 border border-slate-600 text-slate-200 font-display font-bold text-xs flex items-center gap-1.5 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>

          <button
            type="button"
            onClick={() => setSpeedMult((s) => (s === 1 ? 2 : 1))}
            className={`min-h-[40px] px-4 rounded-xl border font-display font-black text-xs active:scale-95 ${
              speedMult === 2
                ? 'bg-sky-500/25 border-sky-300 text-sky-200'
                : 'bg-slate-900 border-slate-600 text-slate-200'
            }`}
          >
            x{speedMult} Speed
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={handleSkip}
              aria-label={skipUnlocked ? 'Skip Match' : 'Skip Match Locked — Unlock at Lv.71 or VIP 3'}
              className={`min-h-[40px] px-3.5 rounded-xl border font-display font-black text-xs flex items-center gap-1.5 active:scale-95 ${
                skipUnlocked
                  ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-amber-100 text-slate-950 shadow-md'
                  : 'bg-slate-900/90 border-slate-600 text-slate-300'
              }`}
            >
              {skipUnlocked ? (
                <FastForward className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Skip</span>
              {!skipUnlocked && (
                <span className="px-1 py-0.5 rounded bg-slate-800 border border-slate-600 text-[9px] text-amber-200 leading-none">
                  Lv.71 / VIP3
                </span>
              )}
            </button>
            {skipTooltipOpen && !skipUnlocked && (
              <div className="pointer-events-none absolute bottom-11 right-0 w-44 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-amber-300/75 text-[10px] font-display font-bold text-amber-100 shadow-xl z-40 text-center">
                Unlock at Lv.71 or VIP 3
              </div>
            )}
          </div>
        </div>

        {/* Our Team vs Enemy Team Status Bar */}
        <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700/70 text-[10.5px] font-display font-bold tabular-nums">
          <span className="text-sky-300">Our Team: {alivePlayers}/{playerUnits.length} Ready</span>
          <span className="text-amber-300">Total Damage: {formatGoldOrDiamond(totalDamage)}</span>
          <span className="text-rose-300">Enemy Team: {aliveEnemies}/{enemyUnits.length}</span>
        </div>
      </div>
    </section>
  );
};
