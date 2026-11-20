import React from 'react';
import {
  Backpack,
  Compass,
  Flame,
  Home,
  Sparkles,
  Users,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { PrimaryTab } from '../types/game';

interface NavTabDef {
  id: PrimaryTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_TABS: NavTabDef[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'adventure', label: 'Adventure', icon: Compass },
  { id: 'adventurers', label: 'Adventurers', icon: Users },
  { id: 'summon', label: 'Summon', icon: Sparkles },
  { id: 'growth', label: 'Growth', icon: Flame },
  { id: 'bag', label: 'Bag', icon: Backpack },
];

export const BottomNav: React.FC = () => {
  const { state, activeTab, setActiveTab } = useGame();

  const hasSignInDot = !state.signIn.claimedDays.includes(state.signIn.currentDay);
  const hasAfkDot = state.stageProgress.afkReward.accumulatedGold >= 500;
  const ticketQty = state.bag.find((b) => b.id === 'divination-ticket')?.quantity ?? 0;
  const hasSummonDot = state.divination.freeDailyAvailable || ticketQty > 0;
  const ascensionStones = state.bag.find((b) => b.id === 'ascension-stone')?.quantity ?? 0;
  const hasGrowthDot = ascensionStones >= 5;
  const hasBagCraftDot = state.bag.some(
    (b) => b.category === 'Shard' && b.quantity >= (b.craftCost ?? 20)
  );

  const dotMap: Partial<Record<PrimaryTab, boolean>> = {
    home: hasSignInDot,
    adventure: hasAfkDot,
    adventurers: hasGrowthDot,
    summon: hasSummonDot,
    growth: hasGrowthDot,
    bag: hasBagCraftDot,
  };

  return (
    <nav
      className="relative z-30 shrink-0 grid grid-cols-6 bg-gradient-to-t from-[#081022] via-[#0F1E3C] to-[#16294F] border-t-2 border-amber-400/50 px-1 pt-1 pb-1.5 shadow-[0_-6px_20px_rgba(2,6,23,0.85)]"
      aria-label="Primary Game Navigation"
    >
      {NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const showDot = Boolean(dotMap[tab.id]);

        return (
          <button
            key={tab.id}
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              setActiveTab(tab.id);
            }}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex flex-col items-center justify-center min-h-[52px] px-0.5 rounded-lg transition-colors duration-100 active:scale-95 focus-visible:outline-2 focus-visible:outline-amber-300 ${
              isActive
                ? 'bg-gradient-to-b from-amber-400/25 to-amber-500/10 text-amber-300 shadow-[inset_0_1px_0_rgba(253,224,71,0.45)] border border-amber-400/50'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  isActive ? 'scale-110 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.65)]' : ''
                }`}
                aria-hidden="true"
              />
              {showDot && (
                <span
                  className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow-sm"
                  aria-hidden="true"
                />
              )}
            </div>
            <span
              className={`mt-1 text-[9.5px] font-display font-bold tracking-tight whitespace-nowrap leading-none ${
                isActive ? 'text-amber-200' : 'text-slate-300'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
