# Branches view tag sorting

## Summary

- Preserved each tag's backend-provided creation timestamp in the Branches view model.
- Sorted tag leaves newest-first, with tag names as the stable tie-breaker.
- Sorted tag path folders by the newest tag they contain to match the VS Code extension behavior.

## Verification

- `npm run typecheck` passes.
- `npm run lint` passes with 14 pre-existing warnings outside this change.
- `npm run build:tauri-frontend` passes with the existing bundle-size advisory.
- Focused Prettier verification found only pre-existing formatting differences elsewhere in `BranchesView.tsx`; the changed tag-sorting code is formatted correctly.
