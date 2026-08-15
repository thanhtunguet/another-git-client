# Branches view recent commits

## Summary

- Added the `git_get_ref_graph` Tauri command and typed frontend wrapper for loading Git history for one explicit ref.
- Updated `BranchesView` to load the selected branch's three latest commits whenever branch selection changes.
- Added loading, empty, and error states to the recent-commits pane.
- Extended selection to tags as well as branches: clicking a tag now inspects its history rather than checking it out, and the pane now uses the revision-neutral wording “Recent commits on this revision”.
- Expanded the tag context menu with the Git actions shared by tags and branches: checkout, create branch, merge, rebase, compare, open graph, and soft/mixed/hard reset. Tag-only deletion remains available.

## Root cause

The pane previously searched the paginated, all-refs Git Graph cache for an exact branch-name match. Git graph decorations use full ref names, and a selected branch might not be included in the loaded page, so branch selection often yielded no visible commits.

## Verification

- `npm run typecheck` and `npm run build` pass.
- `npm run lint` completes with 14 pre-existing warnings outside this change.
- `cargo fmt --check` reports existing whole-project formatting differences; no automatic reformat was applied to avoid unrelated edits.
