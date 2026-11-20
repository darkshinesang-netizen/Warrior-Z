import React from 'react';
import { Award, CheckCircle2, Flame, ShieldAlert, Sparkles, Trophy } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { BattleSimulationResult, StageDef } from '../../types/game';
import { formatGoldOrDiamond, formatPowerCompact } from '../../utils/gameLogic';
import { DiamondGemIcon, GoldCoinIcon } from '../RpgIcons';

interface BattleResultModalProps {
  stage: StageDef;
  result: BattleSimulationResult;
  onContinue: () => void;
  onGoToTab: (tab: 'adventurers' | 'growth') => void;
}

export const BattleResultModal: React.FC<BattleResultModalProps> = ({
  stage,
  result,
  onContinue,
  onGoToTab,
}) => {
  const { state } = useGame();
  const { victory, mvpUnit, loot, turnsTaken, totalPlayerDamage, reason } = result;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3.5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="battle-result-title"
      onClick={onContinue}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[370px] rounded-2xl border-2 p-4 space-y-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.9)] ${
          victory
            ? 'bg-gradient-to-b from-[#1A2D58] via-[#101C39] to-[#0A1124] border-amber-300'
            : 'bg-gradient-to-b from-[#331424] via-[#1B0E1A] to-[#0C0914] border-rose-400/80'
        }`}
      >
        {/* VICTORY / DEFEAT Banner */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-950/70 border border-amber-300/60 mx-auto">
            {victory ? (
              <Trophy className="w-7 h-7 text-amber-300" />
            ) : (
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            )}
          </div>
          <h2
            id="battle-result-title"
            className={`font-display font-black text-2xl tracking-wider ${
              victory
                ? 'text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]'
                : 'text-rose-400'
            }`}
          >
            {victory ? 'VICTORY' : 'DEFEAT'}
          </h2>
          <p className="text-[11px] font-display font-semibold text-slate-300 tabular-nums">
            Stage {stage.id} · {turnsTaken}/15 Turns · Total Damage{' '}
            {formatGoldOrDiamond(totalPlayerDamage)}
          </p>
        </div>

        {/* MVP Highlight Card */}
        {mvpUnit && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/75 border border-amber-400/45">
            <div className="relative shrink-0">
              <img
                src={mvpUnit.image}
                alt={mvpUnit.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover object-top border-2 border-amber-300"
              />
              <span className="absolute -top-1.5 -left-1.5 px-1.5 py-[1px] rounded bg-amber-400 text-slate-950 text-[9px] font-display font-black flex items-center gap-0.5 shadow">
                <Award className="w-2.5 h-2.5" /> MVP
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-extrabold text-sm text-white truncate">
                {mvpUnit.name}
              </p>
              <p className="text-[11px] text-amber-200 tabular-nums">
                Damage: {formatGoldOrDiamond(mvpUnit.damageDealt)}
                {mvpUnit.healingDone > 0
                  ? ` · Heal: ${formatGoldOrDiamond(mvpUnit.healingDone)}`
                  : ''}
              </p>
            </div>
          </div>
        )}

        {victory && loot ? (
          <>
            {/* Acquire Loot Grid */}
            <div className="space-y-1.5">
              <p className="font-display font-bold text-xs text-sky-200">Acquire Loot</p>
              <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-950/75 border border-amber-400/35">
                  <GoldCoinIcon className="w-4 h-4 shrink-0" />
                  <span className="font-display font-bold text-amber-100">
                    +{formatGoldOrDiamond(loot.gold)} Gold
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-950/75 border border-cyan-400/35">
                  <DiamondGemIcon className="w-4 h-4 shrink-0" />
                  <span className="font-display font-bold text-cyan-100">
                    +{loot.diamonds} Diamonds
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-950/75 border border-sky-400/35">
                  <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
                  <span className="font-display font-bold text-sky-100">
                    +{loot.exp} Player EXP
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-950/75 border border-violet-400/35">
                  <Flame className="w-4 h-4 text-violet-300 shrink-0" />
                  <span className="font-display font-bold text-violet-100">
                    +{loot.ascensionStones} Asc. Stones
                  </span>
                </div>
              </div>

              {loot.shardName && loot.shardQty && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-300/60 text-xs font-display font-bold text-amber-100 tabular-nums">
                  <span>{loot.shardName}</span>
                  <span>+{loot.shardQty}</span>
                </div>
              )}

              {loot.storyBonusDiamonds && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-300/70 text-xs font-display font-extrabold text-emerald-200 tabular-nums">
                  <span>Main Story 10/10 Milestone!</span>
                  <span>+{loot.storyBonusDiamonds} Diamonds</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-display font-semibold text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                Stage {stage.id} Cleared · Story Progress{' '}
                {state.stageProgress.questTracker.current}/{state.stageProgress.questTracker.target}
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-950/75 border border-rose-400/35 text-xs text-rose-100 space-y-1">
              <p className="font-display font-bold">
                {reason === 'TURN_LIMIT_REACHED'
                  ? '15-Turn Limit Reached: Enemies survived past Turn 15.'
                  : 'Your squad fell in combat.'}
              </p>
              <p className="text-slate-300 text-[11px]">
                Tip: Level up fighters in Growth, summon new warriors in Summon, or adjust your Front/Back row Element Aura!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onGoToTab('adventurers')}
                className="min-h-[40px] rounded-xl bg-slate-900 border border-sky-400/50 text-xs font-display font-bold text-sky-200 active:scale-95"
              >
                Adventurers
              </button>
              <button
                type="button"
                onClick={() => onGoToTab('growth')}
                className="min-h-[40px] rounded-xl bg-slate-900 border border-amber-400/50 text-xs font-display font-bold text-amber-200 active:scale-95"
              >
                Upgrade Growth
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onContinue}
          className="w-full min-h-[46px] rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 font-display font-black text-sm shadow-lg active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
