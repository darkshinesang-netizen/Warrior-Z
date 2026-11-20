import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { TopHud } from './components/TopHud';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { CharacterProfileModal } from './components/CharacterProfileModal';
import { HomeActionModals } from './components/HomeActionModals';
import { AdventureTabScreen } from './components/tabs/AdventureTabScreen';
import { HeroTabScreen } from './components/tabs/HeroTabScreen';
import { SummonScreen } from './components/tabs/SummonScreen';
import { GrowthTabScreen } from './components/tabs/GrowthTabScreen';
import { BagTabScreen } from './components/tabs/BagTabScreen';

const GameViewportShell: React.FC = () => {
  const { activeTab, setActiveTab, toastMessage } = useGame();
  const [heroInspectId, setHeroInspectId] = useState<string | null>(null);

  const handleInspectHeroFromGrowth = (heroId: string) => {
    setHeroInspectId(heroId);
    setActiveTab('adventurers');
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#060913] flex items-center justify-center overflow-hidden">
      {/* Subtle Desktop Framing Backdrop */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.16),transparent_55%),radial-gradient(circle_at_50%_85%,rgba(245,158,11,0.12),transparent_55%)]"
        aria-hidden="true"
      />

      {/* Centered 9:16 Mobile Game Container */}
      <div className="relative w-full max-w-[430px] h-[100dvh] flex flex-col overflow-hidden bg-[#0A1326] sm:border-x-2 sm:border-amber-400/40 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
        {/* Persistent Top HUD */}
        <TopHud />

        {/* Active Screen Viewport */}
        <main className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'adventure' && <AdventureTabScreen />}
          {activeTab === 'adventurers' && (
            <HeroTabScreen
              initialHeroId={heroInspectId}
              onClearInitialHero={() => setHeroInspectId(null)}
            />
          )}
          {activeTab === 'summon' && <SummonScreen />}
          {activeTab === 'growth' && (
            <GrowthTabScreen onInspectHero={handleInspectHeroFromGrowth} />
          )}
          {activeTab === 'bag' && <BagTabScreen />}
        </main>

        {/* Persistent 6-Tab Bottom Navigation Bar */}
        <BottomNav />

        {/* Modals */}
        <CharacterProfileModal />
        <HomeActionModals />

        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute bottom-[74px] left-1/2 -translate-x-1/2 z-[60] max-w-[390px] truncate px-4 py-2 rounded-xl bg-slate-950/95 border border-amber-300/80 text-xs font-display font-bold text-amber-100 shadow-2xl"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameViewportShell />
    </GameProvider>
  );
}
