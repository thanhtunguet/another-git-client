# Frontend UI audit

## Scope

- Reviewed every user-facing frontend view, shared overlay, toolbar, dock, panel, context menu, and interactive control against `src/services/tauriGitBackend.ts` and the registered Tauri commands.
- No product code was changed in this review.

## Result

- Most primary Git workflows are connected to typed Tauri commands and refresh their repository state after mutation.
- The audit found misleading seeded fallback data, simulated rebase controls, a broken conflict-side checkout route, and several parity gaps where existing backend commands are not surfaced by the UI.

## Priority findings

1. Replace `RAW_COMMITS`, generated hashes/files, the initial commit message, and `seedLog()` fallback display data with empty/loading/error states. The current fallbacks can show Linux history after a live backend failure.
2. Add explicit backend commands and UI wiring for rebase/cherry-pick/revert continue, skip, and abort; the status-bar operation controls only mutate React state today.
3. Add a conflict-side checkout command accepting structured `{ path, side }` data. `DiffView` currently passes `--ours -- <path>` through the branch checkout command, which executes it as one argument and cannot work.
4. Extend Compare with tags and a genuine working-tree mode; the existing backend accepts references, while the UI selector only hydrates branches.

## Remediation

- Removed all active seeded history, generated commit-file fallback, seeded output console, and sample commit-message state. Empty repositories and failed snapshots now render empty/error states instead of Linux demo data.
- Added typed backend commands for remote tracking checkout, conflict-side restore, operation-state discovery, continue/skip/abort, comparison patch creation, and repository filesystem watching.
- Replaced status polling with a debounced native repository watcher that refreshes branch, graph, index, stash, worktree, submodule, and operation state after Git or terminal changes.
- Made merge, rebase, cherry-pick, and revert failures rehydrate operation state so real continuation controls appear when Git pauses for conflicts.
- Added `WORKTREE` as an explicit Compare target, tag options, changed-file output, comparison errors, and binary diff-patch export.
- Added Source Control controls to copy the staged patch, paste/apply a patch, and confirm discard-all changes; changed files now include backend-derived additions/deletions.
- Replaced remote detached checkout with a local tracking checkout flow.
- Removed the unreachable component-showcase view whose demonstration buttons had no behavior.
- Added explicit error content for Graph, Compare, commit details, and diff retrieval.

## Verification

- Re-indexed GitNexus before reviewing execution flows.
- `npm run typecheck` passed.
- `git diff --check` passed.
- `npm run lint` passed with 14 pre-existing warnings and no errors.
- `cargo test` passed (2 backend tests); `cargo check` passed.
