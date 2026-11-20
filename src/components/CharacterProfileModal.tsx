import React, { useState } from 'react';
import {
  Check,
  Crown,
  Lock,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Volume2,
  Music,
  X,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ProfileSubTab } from '../types/game';
import { formatPowerCompact, getHeroEffectivePower } from '../utils/gameLogic';
import { AvatarWithFrame, ElementBadge, PowerEmblemIcon, RarityTag } from './RpgIcons';

const SUB_TABS: { id: ProfileSubTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'details', label: 'Details', icon: User },
  { id: 'portrait', label: 'Portrait', icon: Sparkles },
  { id: 'headgear', label: 'Headgear', icon: Crown },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

export const CharacterProfileModal: React.FC = () => {
  const {
    state,
    activeModal,
    closeModal,
    profileSubTab,
    setProfileSubTab,
    teamPower,
    avatarHero,
    featuredHero,
    setAvatarHero,
    setAvatarFrame,
    toggleMusic,
    toggleSfx,
    devBoostPlayer,
    resetSaveData,
  } = useGame();

  const [confirmReset, setConfirmReset] = useState(false);

  if (activeModal !== 'profile') return null;

  const { player, heroes, headgearFrames } = state;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="relative w-full max-h-[86dvh] flex flex-col rounded-2xl bg-gradient-to-b from-[#132347] to-[#0B152C] border-2 border-amber-400/70 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1A3161] via-[#1E3A73] to-[#1A3161] border-b border-amber-400/40 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-300" aria-hidden="true" />
            <h2
              id="profile-modal-title"
              className="font-display font-extrabold text-base text-amber-100 tracking-wide"
            >
              Character Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close Character Profile"
            className="w-9 h-9 min-h-[40px] min-w-[40px] rounded-xl bg-slate-900/70 border border-slate-500/50 text-slate-200 hover:text-white hover:border-amber-300 flex items-center justify-center transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Split: Left Vertical Sub-Tabs + Right Content */}
        <div className="flex flex-1 min-h-0">
          {/* Left Vertical Sub-Tabs */}
          <aside
            className="w-[96px] shrink-0 bg-[#091225] border-r border-sky-400/25 p-1.5 flex flex-col gap-1.5"
            aria-label="Profile sections"
          >
            {SUB_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = profileSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setConfirmReset(false);
                    setProfileSubTab(tab.id);
                  }}
                  aria-current={active ? 'true' : undefined}
                  className={`flex flex-col items-center justify-center text-center px-1.5 py-2.5 min-h-[54px] rounded-xl border text-[11px] font-display font-bold leading-tight transition-all active:scale-95 ${
                    active
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-100 text-slate-950 shadow-md'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:text-white hover:border-sky-400/50'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Right Panel Content */}
          <div className="flex-1 overflow-y-auto rpg-scroll p-3.5 space-y-3.5">
            {profileSubTab === 'details' && (
              <>
                {/* Player Identity Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-sky-400/30">
                  <AvatarWithFrame
                    image={avatarHero.image}
                    alt={player.name}
                    frameId={player.avatarFrameId}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-extrabold text-base text-white">
                        {player.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-900 border border-sky-400/50 text-[10px] font-display font-bold text-sky-100 tabular-nums">
                        {player.server}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 tabular-nums">
                      <span>Lv.{player.level}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-300 font-semibold">VIP {player.vipLevel}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <PowerEmblemIcon className="w-4 h-4" />
                      <span className="font-display font-extrabold text-sm text-amber-300 tabular-nums">
                        Team Power: {formatPowerCompact(teamPower)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Warrior Showcase */}
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-xs text-amber-200 tracking-wide">
                    Main Warrior Showcase
                  </h3>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/75 border border-amber-400/35">
                    <img
                      src={featuredHero.image}
                      alt={featuredHero.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-16 rounded-lg object-cover object-top border border-amber-300/60 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <RarityTag rarity={featuredHero.rarity} />
                        <ElementBadge element={featuredHero.element} size="sm" />
                      </div>
                      <p className="font-display font-bold text-sm text-white mt-1 truncate">
                        {featuredHero.name}
                      </p>
                      <p className="text-[11px] text-slate-300 tabular-nums">
                        Lv.{featuredHero.level} · {featuredHero.heroClass} · Power{' '}
                        {formatPowerCompact(getHeroEffectivePower(featuredHero))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Locked Personnel Slots */}
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-xs text-sky-200 tracking-wide">
                    Personnel Slots
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { slot: 1, unlockLv: 15 },
                      { slot: 2, unlockLv: 30 },
                      { slot: 3, unlockLv: 50 },
                    ].map((entry) => (
                      <div
                        key={entry.slot}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 mb-1">
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        </div>
                        <span className="text-[10px] font-display font-bold text-slate-300">
                          Locked
                        </span>
                        <span className="text-[9.5px] text-slate-400 tabular-nums">
                          Lv.{entry.unlockLv}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {profileSubTab === 'portrait' && (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-300">
                  Select an unlocked hero to display as your Top HUD Portrait.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {heroes.map((hero) => {
                    const isSelected = player.avatarId === hero.id;
                    return (
                      <button
                        key={hero.id}
                        type="button"
                        disabled={!hero.unlocked}
                        onClick={() => setAvatarHero(hero.id)}
                        className={`relative flex flex-col items-center p-2 rounded-xl border text-center transition-all min-h-[104px] ${
                          !hero.unlocked
                            ? 'bg-slate-950/60 border-slate-800 opacity-55 cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-400/15 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                            : 'bg-slate-900/75 border-slate-700 hover:border-sky-400 active:scale-95'
                        }`}
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-600 bg-slate-800">
                          <img
                            src={hero.image}
                            alt={hero.name}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover object-top ${
                              !hero.unlocked ? 'grayscale brightness-50' : ''
                            }`}
                          />
                          {!hero.unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                              <Lock className="w-4 h-4 text-slate-200" />
                            </div>
                          )}
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="mt-1.5 text-[11px] font-display font-bold text-white truncate max-w-full">
                          {hero.name}
                        </span>
                        <span className="text-[9.5px] text-slate-400">
                          {hero.unlocked ? hero.rarity : 'Locked'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {profileSubTab === 'headgear' && (
              <div className="space-y-3">
                <div className="flex flex-col items-center p-3 rounded-xl bg-slate-950/65 border border-sky-400/25">
                  <AvatarWithFrame
                    image={avatarHero.image}
                    alt={player.name}
                    frameId={player.avatarFrameId}
                    size="lg"
                  />
                  <span className="mt-2 font-display font-bold text-xs text-amber-200">
                    Active Headgear Preview
                  </span>
                </div>

                <div className="space-y-2">
                  {headgearFrames.map((frame) => {
                    const isSelected = player.avatarFrameId === frame.id;
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        disabled={!frame.unlocked}
                        onClick={() => setAvatarFrame(frame.id)}
                        className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border text-left min-h-[56px] transition-all ${
                          !frame.unlocked
                            ? 'bg-slate-950/50 border-slate-800 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-400/15 border-amber-300'
                            : 'bg-slate-900/75 border-slate-700 hover:border-sky-400 active:scale-[0.98]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-xs text-white">
                              {frame.name}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-300 mt-0.5 leading-snug">
                            {frame.unlocked ? frame.description : frame.requirement}
                          </p>
                        </div>
                        <span className="shrink-0">
                          {!frame.unlocked ? (
                            <Lock className="w-4 h-4 text-slate-400" />
                          ) : isSelected ? (
                            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-display font-extrabold">
                              Equipped
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-200 text-[10px] font-display font-bold">
                              Equip
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {profileSubTab === 'settings' && (
              <div className="space-y-3">
                {/* Music Toggle */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-700/80">
                  <div className="flex items-center gap-2.5">
                    <Music className="w-4 h-4 text-sky-300 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-display font-bold text-xs text-white">Music</p>
                      <p className="text-[10px] text-slate-400">Sanctuary ambient chimes</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={player.audio.music}
                    aria-label="Toggle Music"
                    onClick={toggleMusic}
                    className={`relative w-12 h-7 rounded-full transition-colors p-1 ${
                      player.audio.music ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        player.audio.music ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Effects Toggle */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-700/80">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-display font-bold text-xs text-white">Sound Effects</p>
                      <p className="text-[10px] text-slate-400">UI clicks & reward chimes</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={player.audio.sfx}
                    aria-label="Toggle Sound Effects"
                    onClick={toggleSfx}
                    className={`relative w-12 h-7 rounded-full transition-colors p-1 ${
                      player.audio.sfx ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        player.audio.sfx ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Discreet Dev / Test Boost Controls */}
                <div className="p-2.5 rounded-xl bg-slate-950/75 border border-sky-400/25 space-y-2">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-display font-bold text-sky-200">
                      Dev/Test: +10 Lv / +1 VIP
                    </span>
                    <span className="text-slate-300 tabular-nums">
                      Lv.{player.level} · VIP {player.vipLevel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => devBoostPlayer({ addLevels: 10 })}
                      className="min-h-[36px] rounded-lg bg-sky-950/80 border border-sky-400/40 text-sky-100 hover:border-sky-300 text-[11px] font-display font-bold active:scale-95"
                    >
                      +10 Lv
                    </button>
                    <button
                      type="button"
                      onClick={() => devBoostPlayer({ addVip: 1 })}
                      className="min-h-[36px] rounded-lg bg-amber-950/70 border border-amber-400/40 text-amber-100 hover:border-amber-300 text-[11px] font-display font-bold active:scale-95"
                    >
                      +1 VIP
                    </button>
                  </div>
                  <p className="text-[9.5px] text-slate-400">
                    Battle Skip unlocks at Lv.71 or VIP 3 (currently{' '}
                    <span className="text-amber-300 font-bold">
                      {player.level >= 71 || player.vipLevel >= 3 ? 'Unlocked' : 'Locked'}
                    </span>
                    ).
                  </p>
                </div>

                {/* Reset Save Data */}
                <div className="pt-2 border-t border-slate-700/70 space-y-2">
                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 hover:bg-rose-900/80 font-display font-bold text-xs transition-colors active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      <span>Reset Save Data</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-400/70 space-y-2">
                      <p className="text-[11px] font-medium text-rose-100 text-center">
                        Restore starter roster, 50,291 Gold, and 388 Diamonds?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="min-h-[40px] rounded-lg bg-slate-800 border border-slate-600 text-xs font-display font-bold text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmReset(false);
                            resetSaveData();
                          }}
                          className="min-h-[40px] rounded-lg bg-rose-600 border border-rose-300 text-xs font-display font-bold text-white"
                        >
                          Confirm Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
