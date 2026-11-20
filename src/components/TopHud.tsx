import React from 'react';
import { useGame } from '../context/GameContext';
import { formatGoldOrDiamond, formatPowerCompact } from '../utils/gameLogic';
import { AvatarWithFrame, DiamondGemIcon, GoldCoinIcon, PowerEmblemIcon } from './RpgIcons';

export const TopHud: React.FC = () => {
  const { state, teamPower, avatarHero, openModal } = useGame();
  const { player } = state;
  const expPct = Math.min(100, Math.round((player.exp / player.maxExp) * 100));

  return (
    <header
      className="relative z-30 shrink-0 px-2.5 pt-2 pb-1.5 bg-gradient-to-b from-[#0C1730] via-[#101F3E] to-[#0B152B] border-b border-amber-400/35 shadow-[0_4px_16px_rgba(2,6,23,0.75)]"
      aria-label="Player HUD"
    >
      {/* Metallic top accent hairline */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-sky-400/50 via-amber-300/80 to-sky-400/50" />

      <div className="flex items-center justify-between gap-2">
        {/* Left: Clickable Player Avatar + Name + Lv + VIP */}
        <button
          type="button"
          onClick={() => openModal('profile')}
          aria-label={`Open Character Profile for ${player.name}`}
          className="group flex items-center gap-2 min-h-[44px] pr-2 rounded-xl text-left transition-transform duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          <AvatarWithFrame
            image={avatarHero.image}
            alt={player.name}
            frameId={player.avatarFrameId}
            size="sm"
          />

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-[13px] leading-none text-white truncate max-w-[92px] group-hover:text-amber-200 transition-colors">
                {player.name}
              </span>
            </div>

            <div className="flex items-center gap-1 mt-1">
              <span className="inline-flex items-center px-1.5 py-[1px] rounded bg-sky-900/90 border border-sky-400/50 text-[10px] font-display font-extrabold text-sky-100 tabular-nums leading-tight">
                Lv.{player.level}
              </span>
              <span className="inline-flex items-center px-1.5 py-[1px] rounded bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100/70 text-[10px] font-display font-black text-slate-950 tabular-nums leading-tight shadow-sm">
                VIP {player.vipLevel}
              </span>
            </div>
          </div>
        </button>

        {/* Center/Right: Currencies, Team Power & EXP Bar */}
        <div className="flex flex-col items-end gap-1 min-w-0 flex-1">
          {/* Currencies Row */}
          <div className="flex items-center justify-end gap-1.5 w-full">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#081022]/90 border border-amber-400/35 shadow-inner"
              title="Gold"
            >
              <GoldCoinIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-display font-bold text-[11px] text-amber-100 tabular-nums whitespace-nowrap">
                {formatGoldOrDiamond(player.gold)}
              </span>
            </div>

            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#081022]/90 border border-cyan-400/35 shadow-inner"
              title="Diamonds"
            >
              <DiamondGemIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-display font-bold text-[11px] text-cyan-100 tabular-nums whitespace-nowrap">
                {formatGoldOrDiamond(player.diamonds)}
              </span>
            </div>
          </div>

          {/* Power & EXP Row */}
          <div className="flex items-center justify-end gap-2 w-full">
            <div className="flex items-center gap-1 shrink-0">
              <PowerEmblemIcon className="w-3.5 h-3.5" />
              <span className="font-display font-extrabold text-[11px] text-amber-300 tabular-nums whitespace-nowrap tracking-tight">
                Power: {formatPowerCompact(teamPower)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 min-w-[82px] max-w-[106px] flex-1">
              <div
                className="relative h-2.5 flex-1 rounded-full bg-slate-950/90 border border-slate-600/70 overflow-hidden"
                role="progressbar"
                aria-valuenow={player.exp}
                aria-valuemin={0}
                aria-valuemax={player.maxExp}
                aria-label="Player Experience"
              >
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 transition-[width] duration-300"
                  style={{ width: `${expPct}%` }}
                />
              </div>
              <span className="text-[9px] font-display font-semibold text-sky-200/90 tabular-nums whitespace-nowrap">
                {player.exp}/{player.maxExp}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
