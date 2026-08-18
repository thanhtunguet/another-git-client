# Implementation Plan — Git client state composition refactor

## Goal

Replace the monolithic `GitClientProvider` with composable state boundaries. Repository data moves
to a selector-based Redux Toolkit store; UI coordination stays in small React contexts. A component
must subscribe only to the state slice it renders.

## Constraints

- Preserve all existing Tauri command names, DTOs, Git action behavior, and refresh semantics.
- Do not expose a single `useSelector(state => state.repository)` selector; it defeats the work.
- Do not migrate all consumers in one change. Keep a compatibility adapter until every view has
  moved.
- The `useGitClient` hook has 22 direct callers and is HIGH risk. The initial repository-snapshot
  migration must not change its action API.

## Target composition

```text
GitClient
└─ AppProviders
   ├─ Redux Provider
   │  ├─ repository.graph
   │  ├─ repository.workingTree
   │  ├─ repository.stashes
   │  ├─ repository.worktrees
   │  ├─ repository.submodules
   │  └─ repository.operation
   ├─ GitSessionProvider       (active repository, branch/ahead/behind, watcher lifecycle)
   ├─ GitUiProvider            (view/layout/dialog/menu/toast/console/preferences)
   └─ GitActionsProvider       (typed Tauri action orchestration and immediate refresh)
```

`GitActionsProvider` composes `GitSessionProvider`, `GitUiProvider`, and the Redux dispatch; it
does not own repository data. This keeps the existing action ergonomics while making state
ownership explicit.

## Redux slice shape and selector rules

```ts
interface RepositoryState {
  graph: { rows; hasMore; loading; loadingMore; totalCommitCount; error };
  workingTree: { staged; unstaged; untracked };
  stashes: { items };
  worktrees: { items };
  submodules: { items };
  operation: { current };
}
```

- Reducers receive normalized backend DTOs and replace only a changed sub-slice. Equal DTOs retain
  their previous reference.
- Export leaf selectors such as `selectGraphRows`, `selectStagedFiles`, and
  `selectCurrentOperation`; compose derived selectors with `createSelector`.
- Components subscribe to leaf selectors or a memoized derived selector, never to the full state.
- Keep transient UI fields (open menus, input text, drag state) local or in `GitUiProvider`, not in
  Redux.

## Migration phases

### 0. Characterize and protect behavior

- Record the current refresh contract: background watcher refresh is throttled; explicit Git
  actions refresh immediately.
- Add reducer and selector unit-test scaffolding before moving consumers.
- Capture React Profiler baselines for Graph, Source Control, Diff, Worktrees, and Submodules.

Exit condition: a test can assert that an unchanged refresh preserves every relevant state
reference and that a graph update does not notify a working-tree selector.

### 1. Introduce the store without moving views

- Add Redux Toolkit and React-Redux.
- Create `src/store/` with `store.ts`, `repositorySlice.ts`, typed hooks, and selectors grouped by
  domain.
- Add `AppProviders.tsx` and mount the Redux provider around the current provider.
- Implement a repository refresh controller that fetches the existing backend models and dispatches
  domain actions. Do not remove current context state yet.

Exit condition: store reducer/selector tests pass and the store can hydrate in parallel with the
legacy context without altering UI behavior.

Status: in progress. Redux Toolkit and React-Redux are installed through pnpm; the initial graph
slice is intentionally not hydrated by the legacy refresh pipeline, so it introduces no duplicate
backend reads while selector consumers are migrated.

### 2. Move repository data and read-only consumers by domain

Migrate in this order to keep each change narrow:

| Slice | Consumers | Selector examples |
| --- | --- | --- |
| Graph | `GraphView`, `CommitDetailsView` | rows, graph status, derived commits/graph data |
| Working tree | `DiffView`, `SourceControlDock`, `StatusBar` | staged, unstaged, untracked, changed counts |
| Worktrees | `WorktreesView` | items and health groups |
| Submodules | `SubmodulesView` | items and health groups |
| Stashes | `SourceControlDock` | stash items |
| Operation | `StatusBar` | current operation |

- Replace each consumer's data fields with narrow store hooks while retaining `useGitClient` only
  for UI commands during the transition.
- Move derived graph data, filters, and changed-file grouping into memoized selectors rather than
  recomputing in the global provider.

Exit condition: each migrated component demonstrably avoids rendering when an unrelated slice is
updated.

### 3. Move refresh and action orchestration

- Extract `repositoryRefreshController.ts` from `GitClientContext`; it owns refresh scheduling,
  cancellation, stale-result guards, and domain dispatches.
- Extract typed action modules by domain: branch/tag, working tree/index, stash, worktree,
  submodule, operation, and remote.
- `GitActionsProvider` supplies only command callbacks, notifications, and optimistic refresh
  requests. It reads current repository data through store accessors when an action needs it.

Exit condition: `GitClientContext` no longer owns repository snapshot `useState` calls or calls
backend readers directly.

### 4. Split remaining UI/session context and remove the legacy adapter

- Move repository identity and watcher lifecycle to `GitSessionProvider`.
- Move navigation, overlays, preferences, console, and toast state to `GitUiProvider`; split local
  view-only state further where it has a single consumer.
- Replace `useGitClient` with targeted hooks: `useGitSession`, `useGitUi`, `useGitActions`, and
  repository selectors. Keep a temporary deprecated facade only while callers are migrated.
- Delete the facade only after GitNexus shows no remaining direct callers.

Exit condition: no provider mixes repository DTO state with UI state or action orchestration.

### 5. Verify and measure

- Reducer tests: unchanged DTO retains references; a changed slice changes only that slice.
- Selector tests: derived data remains referentially stable for unrelated updates.
- Integration tests: watcher refresh, explicit Git action refresh, operation continue/skip/abort,
  stage/unstage, graph paging, and repository switching.
- Use React Profiler to verify that a graph-only update does not render Diff, Source Control,
  Worktrees, or Submodules.
- Run `npm run typecheck`, `npm run lint`, targeted tests, `git diff --check`, and GitNexus
  `detect_changes` after every phase.

## Non-goals for the first migration

- Changing Tauri/Rust command contracts.
- Persisting the full repository snapshot to local storage.
- Replacing local form/input state with Redux.
- Rewriting all Git action behavior as thunks before selectors are in place.

## Rollout and rollback

- Each phase should be independently mergeable and guarded by reducer/selector tests.
- Keep the existing context adapter until the matching consumer group has migrated and profiler
  evidence confirms isolation.
- If a slice migration regresses a Git workflow, restore that slice's legacy adapter without
  reverting unrelated completed slices.
