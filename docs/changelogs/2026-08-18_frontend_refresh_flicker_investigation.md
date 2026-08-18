# Frontend refresh flicker investigation

## Symptom

- The desktop frontend visibly re-renders about once per second while a repository is active.

## Finding

- The primary cause is the repository refresh pipeline, not React Strict Mode.
- `git_watch_repository` recursively watches the entire repository and emits
  `git:repository-changed` for every successful native filesystem event, without filtering the
  event kind or affected path.
- The frontend listener debounces every event and calls `refreshRepository`. That call reloads
  graph, changed files, stashes, worktrees, submodules, commit count, operation state, and branch
  summary.
- The snapshot setter writes freshly allocated arrays and objects even when repository data is
  unchanged. As the provider passes one large context value, this renders all context consumers;
  `graphLoading` also toggles for each refresh.
- Watching the full tree includes `.git`, `node_modules`, build output, editor metadata, and any
  other filesystem churn. On a development repository that is enough to cause recurring refreshes.

## Parity comparison

- The VS Code extension baseline watches only explicit Git paths and maps each path to the minimum
  state scopes. It does not recursively refresh every state slice after an arbitrary workspace
  filesystem event.

## Evidence

- `src-tauri/src/git_backend.rs`: `git_watch_repository` uses `RecursiveMode::Recursive` and emits
  for every `event.is_ok()`.
- `src/context/GitClientContext.tsx`: the event listener always schedules `refreshRepository`, and
  `refreshRepositorySnapshot` reloads all repository models and updates their state.
- GitNexus impact analysis marks `refreshRepositorySnapshot` as CRITICAL: 39 direct callers, 40
  affected processes, and 61 reachable symbols. No product code was changed during this
  investigation.

## Recommended remediation

- Replace the broad watcher with targeted Git metadata watches and include the changed path/event
  kind in the frontend payload.
- Refresh only the affected scope, ignore non-Git workspace changes, coalesce concurrent refreshes,
  and retain existing state references when a payload is unchanged.

## Remediation implemented

- Added `REPOSITORY_WATCHER_REFRESH_INTERVAL_MS` (10,000 ms) in
  `src/config/repositoryRefresh.ts`. Filesystem events are now throttled to at most one passive
  refresh per interval; explicit Git actions still refresh immediately.
- Passive watcher refreshes no longer toggle the graph loading state, and repository DTO state
  retains its reference when the backend returns unchanged data.
- Memoized the graph filter multi-select controls and memoized their match-count calculation.
- Memoized the reusable resize handle, which does not read repository context and therefore can
  skip parent refreshes while its props remain stable.
- Removed the obsolete Settings debounce input because refresh timing is now source-configured.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed with 14 pre-existing warnings and no errors.
- `git diff --check` passed.

## Follow-up plan

- Added `docs/plans/2026-08-18_git_client_state_composition_refactor.md` for a phased Redux
  selector migration and decomposition of the current `GitClientProvider` god component.

## Composition refactor progress

- Installed Redux Toolkit and React-Redux with pnpm. Added the Redux provider, typed store hooks,
  and isolated repository graph slice; it is not yet hydrated by the legacy refresh pipeline, so
  no parallel backend reader has been introduced.
