# Google AI Studio Prompt — Phase 0: Project Stabilization & Safety Audit

You are acting as the senior engineer responsible for stabilizing the EXISTING project **Dragon Spirit Chronicles**. This is Phase 0 only. Your task is to establish a safe, reproducible baseline before any feature development or refactoring begins.

## 0. Scope and strict safety rules

This phase is an audit, backup, and baseline verification phase — **not an implementation phase**.

**Do not modify application source code or gameplay behavior.** In particular, do not edit, rename, delete, reformat, or regenerate any of the following:

- `src/**`
- `index.html`
- `package.json`
- Any lockfile, if one exists in the current workspace
- `tsconfig.json`
- `vite.config.ts`
- `metadata.json`
- `.env*` files or AI Studio Secrets
- Existing player save data or browser LocalStorage

Do not run `npm run clean`, `git reset`, `git checkout --`, `git clean`, `localStorage.clear()`, the in-game **Reset Save Data** action, formatters, autofix commands, or any destructive command.

Do not implement Phase 1 or later. Do not change navigation, GameState, Summon, Story, Battle, Gear, assets, UI, or Firebase. Do not add dependencies or scripts. Do not invent missing design values.

Allowed actions are limited to: inspect files and environment; create a backup; install dependencies only in a controlled/isolated workspace when necessary; run read-only checks/tests/build; inspect the running preview; and write a Phase 0 report. Build output such as `dist/` and dependency files such as `node_modules/` may be generated only if ignored/untracked and must not replace source files.

If you cannot create and verify a restorable backup before running checks that may write files, STOP and report the blocker. Do not proceed as if backup succeeded.

## 1. Confirm the exact workspace

First inspect the current AI Studio workspace; do not assume it is byte-for-byte identical to an earlier ZIP.

Report:

1. Current project root and project name.
2. Whether this is the existing Dragon Spirit Chronicles app (check `README.md`, `metadata.json`, `index.html`, and `src/App.tsx`).
3. Current Git status, current branch, and whether there are uncommitted or untracked changes. Do not discard or stash user changes.
4. The exact Node.js and npm versions (`node --version`, `npm --version`).
5. The package manager and lockfiles present in the current workspace.
6. The current `package.json` scripts and declared dependency versions.
7. Any runtime/build environment constraints reported by AI Studio.

The supplied project archive had `package.json` but no `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, or `node_modules/`. The package manifest declared React 19, TypeScript 7, Vite 8, Tailwind CSS 4, and `tsx` as a development dependency. Verify the CURRENT workspace rather than assuming these facts remain unchanged. Do not guess a compatible Node version; report the actual environment and the compatibility evidence available from installed package metadata or package-manager output.

## 2. Create and verify a backup BEFORE checks

Use the safest available method:

- If Git is connected and the working tree is clean, create a clearly named backup branch such as `backup/phase0-pre-stabilization-YYYY-MM-DD` without changing project files. Do not push unless the user explicitly asks.
- If Git is not connected, or the working tree contains uncommitted/untracked user changes, create a ZIP backup of the current workspace so those changes are preserved. Do not switch branches, stash, reset, or clean the working tree.
- Exclude `node_modules/`, `dist/`, caches, and logs from a ZIP backup. Preserve source, project configuration, assets, and user-created files. Do not include `.env.local`, API keys, credentials, or other secret values. Preserve `.env.example` if present.

Verify the backup exists, record its exact name/location, and verify its archive listing or branch commit/reference. A backup is not considered complete merely because a command was attempted.

If the current workspace is dirty, explicitly list the changed/untracked paths in the report and confirm that the backup includes them. Never overwrite a previous backup.

## 3. Inspect persistence and save safety (read-only)

Inspect `src/context/GameContext.tsx`, `src/types/game.ts`, `src/data/gameSeed.ts`, and `src/utils/gameLogic.ts`.

The supplied archive previously showed:

- Save key: `dragon_spirit_chronicles_save_v1`
- `loadInitialState()` reads that key and passes parsed JSON to `sanitizeLoadedState()`.
- A state effect writes the current GameState back to that key.
- `resetSaveData()` replaces the save with a fresh initial state.

Verify these details in the CURRENT workspace and report any differences.

Do not read, print, upload, or expose API secrets. Do not clear, overwrite, migrate, or reset a real player save. Do not invoke `resetSaveData()`.

Create a safe save verification using an isolated copy or in-memory test data only:

1. Identify the save key and expected GameState shape.
2. If a test fixture/save sample is available, parse and serialize a COPY only.
3. Verify that the copied JSON can be parsed and passed through the current sanitizer, if this can be done without writing to the real save.
4. Report exactly what was verified and what could not be verified.

Do not claim a full browser save restore test unless an isolated browser profile or separate temporary storage was actually used and successfully restored. A JSON stringify/parse test alone is only a serialization smoke test, not a full restore test.

## 4. Dependency installation (only if required)

First check whether dependencies are already installed and whether AI Studio has already provisioned the project.

- If dependencies are present, do not reinstall them unnecessarily.
- If dependencies are missing and installation is necessary, install only in an isolated audit copy or use a command that does not modify `package.json` or create/update a lockfile. The supplied ZIP had no lockfile, so do not run `npm ci` unless a valid lockfile exists in the CURRENT workspace.
- Do not upgrade packages or change dependency versions.
- Do not modify `.env` or Secrets.

Report the exact install command and its complete result. If network access or package resolution fails, stop dependency-dependent checks and report that blocker; do not try random versions or package upgrades.

## 5. Run baseline checks without fixing anything

Run the commands supported by the CURRENT project. Do not fix errors during Phase 0.

Expected scripts in the supplied archive were:

- `npm run lint` → `tsc --noEmit`
- `npm run build` → `vite build`
- `npm run dev` → Vite development server on port 3000

The supplied archive did not define an `npm test` script. It contained three Node test files:

- `src/utils/combatEngine.test.ts`
- `src/utils/gameLogic.test.ts`
- `src/utils/phase3.test.ts`

It declared `tsx` as a dev dependency and those tests use `node:test`. If `tsx` is installed, run the explicit test command:

`npx tsx --test src/utils/combatEngine.test.ts src/utils/gameLogic.test.ts src/utils/phase3.test.ts`

Verify the current workspace before relying on these script names or test paths. Do not claim tests passed unless the command actually ran and its output confirms the result.

Run and record:

1. TypeScript check (`npm run lint`, if present).
2. Production build (`npm run build`, if present).
3. Existing unit tests using the actual available test runner.
4. Any warnings separately from errors.

Do not use `--fix`. Do not edit source to make a check pass. If a command fails, preserve the first complete error output and classify it as environment/dependency/configuration/source/test failure where evidence permits.

## 6. Preview smoke test

If AI Studio preview is available and the dev server can be started without source changes, perform a smoke test only:

- App loads without a blank screen.
- Home renders.
- Existing bottom navigation can switch between its current screens.
- Adventure, Battle, Hero, Growth, and Bag screens render if reachable.
- No critical uncaught runtime error appears in the console.

This is a baseline check of the CURRENT app; do not redesign the UI or change expected behavior in this phase.

Do not perform destructive interactions, purchases, Summon, Reset Save, or anything that can alter persistent player data. If testing navigation requires a click, use only non-destructive navigation.

Record which screens were actually opened. Do not claim a screen was tested if it was not opened.

## 7. Git and file-diff verification

At the end, compare the workspace to the state captured after backup and before checks.

- List all tracked-file changes, untracked files, and ignored generated files.
- Confirm that no application source/configuration file was modified by this Phase 0 task.
- If a tool or build process modified a tracked file, do not silently revert it; report the exact file and diff, and stop before further action.
- Do not commit or push changes automatically.

## 8. Required final report

Return a structured report with these exact sections:

### A. Workspace Identity
Project root, project identity, branch/Git state, Node/npm versions, package manager, lockfile status.

### B. Backup Evidence
Backup type, exact location/name or branch reference, included user changes, archive/restore verification performed, and any limitations.

### C. Dependency Status
Whether dependencies were already present or installed in an isolated copy; exact command and result; resolved versions if available.

### D. Baseline Check Results
A table for lint, build, unit tests, and preview smoke test. For each, include exact command/action, PASS/FAIL/BLOCKED/NOT RUN, and the actual error or output summary.

### E. Save Safety
Verified save key, current load/save/sanitizer behavior, safe-copy serialization/sanitizer result, and what was not tested. Confirm explicitly that the real save was not reset or overwritten.

### F. File Change Audit
List tracked/untracked/ignored files created or changed. State whether application source/configuration files remained unchanged.

### G. Baseline Issues
List all existing errors, warnings, missing tests, environment blockers, and risks. Separate confirmed facts from assumptions.

### H. Phase 0 Gate
Mark each criterion PASS or FAIL:

- A verified restorable backup exists.
- Current environment and dependency versions are recorded.
- Lint result is recorded.
- Build result is recorded.
- Unit test result is recorded or a clear blocker is documented.
- App preview smoke-test result is recorded or a clear blocker is documented.
- Save key and persistence behavior are documented.
- Real player save was not modified.
- No source/configuration changes were made.

**Do not begin Phase 1. Do not write implementation prompts. Do not fix baseline issues.** End by stating whether Phase 0 is safe to pass. If any mandatory gate fails, list the exact blocker and wait for a separate instruction.
