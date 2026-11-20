import React, { useMemo, useState } from 'react';
import {
  Award,
  Backpack,
  Coins,
  Flame,
  Gem,
  Hammer,
  PackageOpen,
  Puzzle,
  Shield,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { BAG_CATEGORIES } from '../../data/gameSeed';
import { BagCategory, BagItem, Rarity } from '../../types/game';
import { RarityTag } from '../RpgIcons';

const CATEGORY_SHORT_LABELS: Record<BagCategory, string> = {
  Materials: 'Materials',
  Cost: 'Cost',
  Shard: 'Shard',
  Gear: 'Gear',
  'Dragon Soul': 'Dragon Soul',
  'Essence Crystal': 'Essence',
  Badges: 'Badges',
  'Dragon Skills': 'Dragon Skills',
};

const RARITY_BORDER: Record<Rarity, string> = {
  UR: 'border-amber-300 bg-gradient-to-b from-rose-950/75 via-amber-950/50 to-slate-950',
  SSR: 'border-amber-400/80 bg-gradient-to-b from-amber-950/60 to-slate-950',
  SR: 'border-violet-400/75 bg-gradient-to-b from-violet-950/55 to-slate-950',
  R: 'border-sky-400/70 bg-gradient-to-b from-sky-950/50 to-slate-950',
  N: 'border-slate-600 bg-slate-950/85',
};

function renderItemIcon(iconKey: BagItem['iconKey']) {
  switch (iconKey) {
    case 'stone':
      return <Sparkles className="w-6 h-6 text-amber-300" />;
    case 'cost':
      return <Coins className="w-6 h-6 text-cyan-300" />;
    case 'shard':
      return <Puzzle className="w-6 h-6 text-violet-300" />;
    case 'gear':
      return <Shield className="w-6 h-6 text-sky-300" />;
    case 'soul':
      return <Flame className="w-6 h-6 text-orange-400" />;
    case 'crystal':
      return <Gem className="w-6 h-6 text-cyan-200" />;
    case 'badge':
      return <Award className="w-6 h-6 text-amber-200" />;
    case 'skill':
      return <Swords className="w-6 h-6 text-rose-300" />;
  }
}

export const BagTabScreen: React.FC = () => {
  const {
    state,
    autoCraftBagShards,
    refineBagDragonSkills,
    useBagItemAction,
    setActiveTab,
  } = useGame();

  const [category, setCategory] = useState<BagCategory>('Materials');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const itemsInCategory = useMemo(
    () => state.bag.filter((b) => b.category === category && b.quantity > 0),
    [state.bag, category]
  );

  const selectedItem = useMemo(
    () => state.bag.find((b) => b.id === selectedItemId && b.quantity > 0) ?? null,
    [state.bag, selectedItemId]
  );

  const canAutoCraft = useMemo(
    () =>
      state.bag.some(
        (b) =>
          b.category === 'Shard' &&
          b.quantity >= (b.craftCost ?? 20) &&
          Boolean(b.shardHeroId)
      ),
    [state.bag]
  );

  const canRefineSkills = useMemo(
    () =>
      state.bag.some(
        (b) =>
          (b.id === 'kame-manual' || b.id === 'dragon-ki-mastery') && b.quantity >= 2
      ),
    [state.bag]
  );

  return (
    <section className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0E1E3E] via-[#0B1730] to-[#081022]">
      {/* Header */}
      <div className="shrink-0 px-3 pt-2.5 pb-2 bg-[#0B162C]/95 border-b border-amber-400/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Backpack className="w-4 h-4 text-amber-300" />
          <h1 className="font-display font-extrabold text-sm text-white">
            Sanctuary Inventory
          </h1>
        </div>
        <span className="text-[11px] font-display font-bold text-sky-200 tabular-nums">
          {itemsInCategory.length} Types · {category}
        </span>
      </div>

      {/* Split Layout: Left Vertical 8-Category Tabs | Right Item Grid */}
      <div className="flex-1 min-h-0 flex">
        {/* Left Vertical Category Tabs (8 Categories) */}
        <aside
          className="w-[98px] shrink-0 bg-[#081022] border-r border-sky-400/25 p-1.5 flex flex-col gap-1 overflow-y-auto rpg-scroll"
          aria-label="Bag Categories"
        >
          {BAG_CATEGORIES.map((cat, idx) => {
            const active = category === cat;
            const count = state.bag.filter((b) => b.category === cat && b.quantity > 0).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-current={active ? 'true' : undefined}
                className={`relative flex items-center justify-between gap-1 px-2 py-2 min-h-[42px] rounded-xl border text-left transition-all active:scale-95 ${
                  active
                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-amber-100 text-slate-950 shadow'
                    : 'bg-slate-900/70 border-slate-700/70 text-slate-300 hover:border-sky-400/45'
                }`}
              >
                <span className="text-[10.5px] font-display font-extrabold leading-tight">
                  {idx + 1}. {CATEGORY_SHORT_LABELS[cat]}
                </span>
                {count > 0 && (
                  <span
                    className={`px-1 py-0.5 rounded text-[8.5px] font-black tabular-nums ${
                      active ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-sky-200'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Right Grid & Category Action Bar */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto rpg-scroll p-2.5">
            {itemsInCategory.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-4 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-500">
                  <PackageOpen className="w-6 h-6" />
                </div>
                <p className="font-display font-extrabold text-sm text-slate-300">
                  Absolutely empty
                </p>
                <p className="text-[11px] text-slate-500 max-w-[200px]">
                  No items remaining in {category}. Earn more via Battle, Divination, or Adventure!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 content-start items-start">
                {itemsInCategory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`relative flex flex-col items-center p-2 rounded-xl border-2 text-center transition-all min-h-[92px] active:scale-95 ${
                      RARITY_BORDER[item.rarity]
                    }`}
                  >
                    {/* Top-right quantity badge */}
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-amber-300/45 text-[9.5px] font-display font-black text-amber-200 tabular-nums">
                      x{item.quantity}
                    </span>

                    <div className="mt-2 mb-1.5 w-10 h-10 rounded-xl bg-slate-900/80 border border-white/15 flex items-center justify-center">
                      {renderItemIcon(item.iconKey)}
                    </div>

                    <p className="text-[10px] font-display font-bold text-white leading-tight line-clamp-2">
                      {item.name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contextual Category Footer Actions: Auto Craft in Shard | Refine Synthesis in Dragon Skills */}
          {category === 'Shard' && (
            <div className="shrink-0 p-2.5 bg-slate-950/90 border-t border-amber-400/35">
              <button
                type="button"
                onClick={autoCraftBagShards}
                className={`w-full min-h-[42px] rounded-xl border font-display font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                  canAutoCraft
                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-amber-100 text-slate-950 shadow-lg'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
              >
                <Hammer className="w-4 h-4" />
                <span>Auto Craft</span>
              </button>
            </div>
          )}

          {category === 'Dragon Skills' && (
            <div className="shrink-0 p-2.5 bg-slate-950/90 border-t border-amber-400/35">
              <button
                type="button"
                onClick={refineBagDragonSkills}
                className={`w-full min-h-[42px] rounded-xl border font-display font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                  canRefineSkills
                    ? 'bg-gradient-to-b from-violet-400 to-indigo-700 border-violet-200 text-white shadow-lg'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Refine Synthesis</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Item Detail & Source Modal */}
      {selectedItem && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bag-item-title"
        >
          <div className="w-full max-w-[330px] rounded-2xl bg-gradient-to-b from-[#162952] to-[#0B152C] border-2 border-amber-400/75 p-4 space-y-3 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 ${
                    RARITY_BORDER[selectedItem.rarity]
                  }`}
                >
                  {renderItemIcon(selectedItem.iconKey)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <RarityTag rarity={selectedItem.rarity} />
                    <span className="text-[10px] font-display font-bold text-amber-200 tabular-nums">
                      Owned: {selectedItem.quantity}
                    </span>
                  </div>
                  <h2 id="bag-item-title" className="font-display font-extrabold text-sm text-white mt-0.5">
                    {selectedItem.name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemId(null)}
                aria-label="Close item detail"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-2.5 rounded-xl border border-slate-700/80">
              {selectedItem.description}
            </p>

            <div className="text-[11px] text-sky-200">
              <span className="font-display font-bold text-slate-400">Source: </span>
              {selectedItem.source ?? 'Main Story & Sanctuary Rewards'}
            </div>

            <div className="flex items-center gap-2 pt-1">
              {(selectedItem.id === 'stamina-bento' || selectedItem.id === 'dojo-badge') && (
                <button
                  type="button"
                  onClick={() => {
                    useBagItemAction(selectedItem.id);
                    if (selectedItem.quantity <= 1) setSelectedItemId(null);
                  }}
                  className="flex-1 min-h-[40px] rounded-xl bg-gradient-to-b from-emerald-400 to-teal-600 border border-emerald-200 text-slate-950 font-display font-black text-xs active:scale-95"
                >
                  Use Item
                </button>
              )}

              {selectedItem.id === 'divination-ticket' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemId(null);
                    setActiveTab('summon');
                  }}
                  className="flex-1 min-h-[40px] rounded-xl bg-gradient-to-b from-violet-400 to-purple-700 border border-violet-200 text-white font-display font-black text-xs active:scale-95"
                >
                  Open Summon
                </button>
              )}

              {(selectedItem.category === 'Materials' || selectedItem.category === 'Shard') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemId(null);
                    setActiveTab('adventurers');
                  }}
                  className="flex-1 min-h-[40px] rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-100 text-slate-950 font-display font-black text-xs active:scale-95"
                >
                  Go to Adventurers
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedItemId(null)}
                className="min-h-[40px] px-4 rounded-xl bg-slate-800 border border-slate-600 text-slate-200 font-display font-bold text-xs active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
