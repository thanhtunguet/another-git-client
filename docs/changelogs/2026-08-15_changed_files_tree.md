# Changed-files tree

## Summary

- Grouped changed files in Diff/Merge, Source Control, Commit Detail, and expanded Git Graph commits by their parent folders.
- Added collapsible folder nodes, with keyboard support for expanding and collapsing.
- Preserved file selection, context menus, staging actions, and per-file change counts.

## Verification

- `npm run typecheck` passes.
- `npm run lint` passes with 14 pre-existing warnings outside this change.
- `npm run build:tauri-frontend` passes.
