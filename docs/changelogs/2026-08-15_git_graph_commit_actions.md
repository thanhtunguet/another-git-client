# Git Graph commit actions

## Summary

- Added **Create patch…** to the Git Graph commit context menu. It uses the existing `git format-patch --stdout` backend command and copies the generated patch to the clipboard.
- Kept the existing backend-backed commit actions available from the same menu: copy hash, detached checkout, create branch/tag, cherry-pick, revert, reset, and compare with the current revision.
- Fixed the global text-selection menu so it does not replace the commit context menu with a Copy-only item.
- Consolidated the three reset menu entries into **Reset current branch to here…**, using the shared Soft/Mixed/Hard reset dialog.
- Selecting a changed file keeps the user in Git Graph, hides Source Control, collapses the graph list to roughly 20% of the viewport, and displays the commit-file diff in a pane on the right.
- Hydrated the Git Graph changed-file list from the selected commit instead of placeholder paths, so inline diffs resolve against the actual commit file.
- Made an ordinary commit click select the commit and open its changed-file list immediately. Git Graph keeps one active selection, and opening a commit closes every other commit's changed-file list.
- Kept double-click aligned with the single-click behavior.

## Verification

- `npm run typecheck`
- `npm run lint`
