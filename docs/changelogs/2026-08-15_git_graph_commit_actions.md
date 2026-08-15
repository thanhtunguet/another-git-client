# Git Graph commit actions

## Summary

- Added **Create patch…** to the Git Graph commit context menu. It uses the existing `git format-patch --stdout` backend command and copies the generated patch to the clipboard.
- Kept the existing backend-backed commit actions available from the same menu: copy hash, detached checkout, create branch/tag, cherry-pick, revert, reset, and compare with the current revision.
- Fixed the global text-selection menu so it does not replace the commit context menu with a Copy-only item.
- Consolidated the three reset menu entries into **Reset current branch to here…**, using the shared Soft/Mixed/Hard reset dialog.
- Selecting a changed file keeps the user in Git Graph, hides Source Control, collapses the graph list to roughly 20% of the viewport, and displays the commit-file diff in a pane on the right.
- Hydrated the Git Graph changed-file list from the selected commit instead of placeholder paths, so inline diffs resolve against the actual commit file.
- Added Esc to close the inline diff pane. In compact graph mode, author/date/commit-ID columns are hidden to prevent overlap and are available in the commit row tooltip.
- Constrained the compact Graph/Diff split layout so long intrinsic content cannot widen the view or create empty horizontal overflow.
- Made the inline diff pane vertically scrollable for long files and constrained the commit-diff backend output to the selected file's patch only.
- Consolidated the inline diff header into the shared DiffViewer toolbar and added an icon-only close action.
- Restored rounded active corners in shared segmented controls, including the DiffViewer's 2 Sides / 1 Side selector.
- Made an ordinary commit click select the commit and open its changed-file list immediately. Git Graph keeps one active selection, and opening a commit closes every other commit's changed-file list.
- Kept double-click aligned with the single-click behavior.

## Verification

- `npm run typecheck`
- `npm run lint`
