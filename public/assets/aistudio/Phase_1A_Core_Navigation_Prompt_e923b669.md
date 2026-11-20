# PHASE 1A — CORE NAVIGATION & ADVENTURE FLOW MIGRATION

**Project:** Dragon Spirit Chronicles  
**Reference specification:** Technical Specification v1.1  
**Previous gate:** Phase 0.1 Backup Restore Verification — approved  
**Execution mode:** Incremental implementation with a verified pre-change backup

---

## 0. MISSION AND SCOPE

Implement only the first controlled slice of Phase 1: the six-item primary navigation and the Adventure-owned Story Battle navigation flow, while promoting Summon from a Home modal to a primary screen.

This is an implementation task, but it is intentionally limited to navigation and screen composition. Preserve the existing game logic, combat calculations, player save data, economic rules, summon probabilities, and character data.

Do not attempt to implement the entire Full Scope game in this task.

## 1. NON-NEGOTIABLE GAME RULES

The primary bottom navigation must contain exactly these six items, in this order:

1. Home
2. Adventure
3. Adventurers
4. Summon
5. Growth
6. Bag

Rules:

- Battle must not appear as a primary navigation item.
- Battle may only be entered through Adventure's encounter flow.
- Summon must be a primary screen, not the main Divination modal opened from Home.
- The existing Hero screen may be reused, but its user-facing navigation label must be **Adventurers**.
- Preserve the current Top HUD unless a small layout adjustment is strictly required for the new navigation.
- Navigation state is UI state. Do not add navigation routes or selected screen state to the player's permanent save unless there is an existing unavoidable requirement; explain that requirement before making such a change.
- Preserve the Story rule from Technical Specification v1.1: a cleared Story Stage is historical/read-only and cannot be replayed. Do not loosen or replace that rule.

## 2. SAFETY CHECKPOINT BEFORE EDITING

The workspace has no Git repository according to Phase 0. Before changing any file:

1. Confirm the Phase 0.1 backup exists at `backups/phase0/dragon_spirit_chronicles_phase0_backup_2026-11-19_1425.zip`.
2. Verify its SHA-256 matches the previously reported value:
   `d6dc59aeb0682d77cda449357bfe07710555bc0228fcfb0b8d532758e06aabd9`
3. Create a new pre-Phase-1A ZIP backup of the current workspace in `backups/phase1/`.
4. Exclude `node_modules/`, `dist/`, `.aistudio/`, `.playwright-cli/`, and the entire `backups/` directory from the new archive. Do not include secrets such as `.env` files. Keep `.env.example` if present.
5. Verify ZIP integrity and record the archive path, byte size, and SHA-256.
6. Do not overwrite or delete the Phase 0 backup.

If the existing Phase 0.1 backup is missing or fails verification, STOP before editing and report the blocker.

## 3. INSPECT THE CURRENT IMPLEMENTATION FIRST

Read the current versions of these files and their imports/callers before editing:

- `src/App.tsx`
- `src/types/game.ts`
- `src/components/BottomNav.tsx`
- `src/components/battle/BattleTabContainer.tsx`
- `src/components/battle/StageMapScreen.tsx`
- `src/components/battle/FormationScreen.tsx`
- `src/components/battle/CombatArenaScreen.tsx`
- `src/components/battle/BattleResultModal.tsx`
- `src/components/tabs/AdventureTabScreen.tsx`
- `src/components/DivinationModal.tsx`
- `src/context/GameContext.tsx` (inspect only the navigation/modal integration points; do not redesign persistence)

Create a short dependency map before changing code. Identify every place that reads/writes `TabId`, opens `activeModal === 'divination'`, or renders `BattleTabContainer`.

Do not assume the old ZIP is the current workspace. The current workspace files are authoritative. If the actual file structure differs from this list, adapt to the current source and report the difference.

## 4. TARGET NAVIGATION CONTRACT

Use a UI-only navigation model equivalent to:

```ts
type PrimaryTab =
  | 'home'
  | 'adventure'
  | 'adventurers'
  | 'summon'
  | 'growth'
  | 'bag';

type AdventureRoute =
  | 'hub'
  | 'story-map'
  | 'mode-detail'
  | 'formation'
  | 'battle'
  | 'result';

interface AppNavigationState {
  primaryTab: PrimaryTab;
  adventureRoute: AdventureRoute;
  selectedStageId: string | null;
  selectedModeId: string | null;
  activeBattleSessionId: string | null;
}
```

You may adapt names to match the existing code, but the behavior and separation must remain equivalent.

Do not place a second independent `battle` destination in the primary navigation. The `battle` value above is an internal Adventure route only.

## 5. ADVENTURE FLOW

Create or refactor a single Adventure host/controller that owns these views:

- Adventure Hub
- Story Map
- Mode Detail (only if an existing mode detail view exists; otherwise preserve the current mode list and record that detail view remains future work)
- Formation
- Battle
- Result

Required Story navigation:

`Adventure tab → Adventure Hub → Story Map → Current available Stage → Formation → Battle → Result → Story Map`

Required interaction rules:

- Selecting Story from the Adventure Hub opens the existing Story Stage Map.
- Selecting the current playable Story Stage opens the existing Formation screen.
- Formation starts the existing combat flow for the selected Stage.
- Battle completion opens the existing Result UI.
- Continuing from a Story Result returns to Story Map, showing the updated progress.
- Exiting/backing out from Formation or Battle returns to the appropriate preceding Adventure view, not Home.
- Changing to another primary tab and returning to Adventure must not accidentally start or duplicate a Battle.
- If an existing battle session cannot safely be retained across a tab switch, exit it through the existing safe cancellation path and explain the behavior. Do not invent a reward or mark a Stage cleared.
- A cleared Story Stage must remain non-playable. Preserve existing protection in both UI and domain logic.

Do not rewrite the Combat Engine. Reuse the existing `BattleTabContainer`, `StageMapScreen`, `FormationScreen`, `CombatArenaScreen`, and `BattleResultModal` where possible. You may refactor wrappers and callback wiring to make Adventure the owner of the flow.

## 6. ADVENTURE HUB AND EXISTING CHALLENGE MODES

The current `AdventureTabScreen.tsx` contains the 10 Adventure Modes. Preserve its existing content and navigation entry point inside the Adventure Hub.

Important scope boundary:

- Do not implement the actual battle mechanics for the ten modes in this task.
- Do not change their reward formulas or direct-run behavior in this task.
- Do not claim those modes are now connected to the Combat Engine.
- If the existing screen has a Story/Challenge distinction, keep both reachable from Adventure Hub without creating a separate Battle tab.
- Record the current direct instant-reward behavior of modes as known remaining work for the later PvE phase.

## 7. SUMMON PRIMARY SCREEN

Promote the existing Divination experience into a dedicated primary screen named **Summon**.

Requirements:

- Reuse the existing summon UI, banner display, controls, result presentation, and modal subflows wherever possible.
- Extract or compose the existing `DivinationModal` content into a screen-level component such as `SummonScreen.tsx`.
- Do not show the main Summon experience as a blocking modal launched from Home.
- Any true subdialogs (rate details, summon results, wish selection, milestone details, confirmation) may remain modals within the Summon screen.
- Preserve existing summon action functions and current probability/cost behavior exactly in this task. The rate mismatch is a known separate defect and must be reported, not silently changed here.
- Remove or disable the old Home entry point that opens the main Divination modal, replacing it with navigation to the Summon primary tab.
- Do not duplicate summon state or implement a second summon algorithm.

## 8. BOTTOM NAVIGATION

Update `BottomNav.tsx` and the app's navigation types so that it renders exactly:

`Home | Adventure | Adventurers | Summon | Growth | Bag`

Requirements:

- Remove Battle from the primary nav.
- Rename the user-facing Hero label to Adventurers.
- Add Summon as a primary destination.
- Preserve badges/notification indicators where they already exist.
- Ensure accessible labels do not accidentally prepend notification text to the control's accessible name.
- Maintain mobile portrait layout at 390x844 and reasonable desktop responsiveness.

## 9. STRICTLY OUT OF SCOPE — DO NOT CHANGE

Do not modify or implement any of the following in Phase 1A:

- `GameState` schema or Save Key
- LocalStorage persistence implementation
- Save v1 → v2 migration
- Wallet / Resource Manager
- Summon rates, pity thresholds, summon costs, or random algorithm
- Gear / Equipment / Dragon Soul systems
- Character Definition / Instance migration
- Original IP character/art replacement
- Story `minPlayerLevel` values or Level Gate logic
- Story Stage reward formulas
- Adventure Mode daily limits or reward behavior
- AFK / Daily Reset behavior
- Firebase, authentication, Cloud Save, Arena, Legion, Co-op, World Boss
- Any new dependency or package/lockfile upgrade

Do not perform broad refactors of `GameContext.tsx` or `gameLogic.ts`. Change only the minimum navigation/modal integration points required by the task.

## 10. IMPLEMENTATION SAFETY

- Preserve existing component behavior and callbacks.
- Do not delete legacy components until the replacement is wired and verified.
- Avoid duplicate state sources for primary navigation or selected encounter.
- Avoid putting UI navigation state in permanent GameState.
- Keep strict TypeScript types; do not use `any` to bypass type errors.
- Do not use broad search-and-replace for route identifiers.
- Do not create placeholder buttons that appear functional but have no behavior.
- Do not alter player save data.
- Do not clear LocalStorage or invoke `resetSaveData()`.
- Do not change package.json or bun.lock.

## 11. REQUIRED TESTS AND ACCEPTANCE GATE

After implementation, run:

1. `npm run lint`
2. `npm run build`
3. Existing tests:
   `./node_modules/.bin/tsx --test src/utils/combatEngine.test.ts src/utils/gameLogic.test.ts src/utils/phase3.test.ts`
4. Add focused navigation tests if the existing test environment supports them without introducing dependencies. Otherwise provide a documented manual smoke test.
5. Run Preview smoke tests at 390x844.

Verify each of these paths:

- Home → Adventure → Story Map
- Story Map → current available Stage → Formation
- Formation → Battle → Victory → Result → Story Map
- Formation → Battle → Defeat → Result → retry current Stage
- Adventure → Challenge Modes list
- Home → Summon screen
- Summon → Rate Details subdialog → close back to Summon
- Summon → perform one existing test-eligible action only if safe and isolated; do not spend or alter the real player's save
- Adventurers screen renders
- Growth renders
- Bag renders
- Switching among all six primary tabs does not show a seventh Battle tab
- Browser refresh returns to a valid Home/default route without blank screen or corrupting player save

Use an isolated preview/browser origin for any state-changing test. Never access or modify the real player's LocalStorage. Do not use real currency, consume the user's free summon, or reset their save during testing.

Acceptance criteria:

- Exactly six primary navigation items in the required order.
- No Battle primary tab.
- Battle accessible through Adventure Story flow.
- Story cleared stages remain non-playable.
- Summon is a primary screen, with its existing subdialogs preserved.
- Existing Hero functionality is still available under Adventurers.
- Existing Home, Growth, and Bag functionality remains intact.
- Lint, Build, and all existing tests pass.
- No original player save or unrelated game systems are changed.

If any criterion fails, do not claim Phase 1A is complete. Report the exact failure and smallest safe fix.

## 12. FINAL REPORT FORMAT

Return a detailed report with:

A. Pre-change backup path, size, ZIP integrity, and SHA-256  
B. Files inspected and dependency map  
C. Files changed / added / deleted (with reasons)  
D. New navigation state/type contract  
E. Adventure route flow implementation  
F. Summon screen extraction and preserved subdialogs  
G. Bottom navigation verification  
H. Lint output  
I. Build output and warnings  
J. Unit test output  
K. Preview smoke-test evidence and screenshots  
L. Save integrity confirmation  
M. Known remaining issues intentionally deferred  
N. Phase 1A Gate: PASS / WARNING / FAIL

Do not begin Phase 1B or any later phase automatically. Stop after returning this report and wait for review.
