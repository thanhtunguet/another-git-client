# Diff/Merge content selection

## Summary

- Split Diff/Merge panes now keep their previous and current change content in separate selectable groups.
- Line-number gutters cannot start a text selection and are excluded from selections.
- After clicking a split side, Cmd/Ctrl+A selects only that side's change content instead of the application UI.

## Verification

- `npm run typecheck`
- `npm run lint`
