# Diff/Merge content selection

## Summary

- Split Diff/Merge panes now keep their previous and current change content in separate selectable groups.
- Line-number gutters cannot start a text selection and are excluded from selections.
- After clicking a split side, Cmd/Ctrl+A selects only that side's change content instead of the application UI.
- The Cmd/Ctrl+A listener runs in the window capture phase and is tied to the side focused by pointer input, so browser-native selection state cannot fall back to the whole app.
- File metadata such as `deleted file mode 100644`, rename, copy, and binary markers are hidden.
- The first `@@ -… +… @@` range is shown inline with its file header instead of occupying a separate row.

## Verification

- `npm run typecheck`
- `npm run lint`
