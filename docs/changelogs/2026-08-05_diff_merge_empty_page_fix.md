# Diff/Merge View & Empty Page Fixes

Date: 2026-08-05

## Summary

Investigated and resolved issues causing the "Diff / Merge" view (`DiffView.tsx`) to appear blank, empty, or fail to load commit and merge diffs.

## Root Causes Identified

1. **Commit Diff File List Gap**: When viewing commit diffs (`'parent'` or `'refs'` tabs), `availableFiles` was hardcoded to working tree uncommitted changes (`stagedFiles`/`unstagedFiles`/`untrackedFiles`). On clean repositories with no working-tree changes, `availableFiles` was empty (`[]`), causing the file list sidebar to hide and rendering an empty page with no diff context.
2. **Missing Commit File Hydration**: `DiffView` never invoked `fetchCommitFiles` for the selected commit SHA (`activeSha`), resulting in missing file trees for commit inspection.
3. **Empty Workspace UX Gap**: When the working tree had no changes, `availableFiles.length > 0` conditionally unmounted the left file sidebar and rendered a bare text message without navigation or contextual actions.
4. **Missing Merge Conflict Resolution Tab**: The navigation menu entry "Diff / Merge" lacked a dedicated tab for inspecting and resolving merge conflicts when files had unmerged status (`'U'`).

## Changes Made

- **DiffView (`src/components/views/DiffView.tsx`)**:
  - Added support for 5 tabs: Working tree ↔ HEAD (`'work'`), Index ↔ HEAD (`'index'`), Commit ↔ parent (`'parent'`), Selected commit diff (`'refs'`), and Merge conflicts (`'merge'`).
  - Added live commit file hydration via `fetchCommitFiles(activeSha)` when switching to `'parent'` or `'refs'` tabs.
  - Added conflict badge counter to the Merge conflicts tab when unmerged files exist.
  - Updated file sidebar to remain stably rendered with headers, counters, and file search filter (`filterQuery`).
  - Implemented responsive, styled Empty State views with contextual icons, titles, descriptions, and primary/secondary action buttons (e.g. "Go to Git Graph", "View Staged Changes").
  - Implemented a Merge Conflict Resolution banner with one-click actions: "Keep Ours (HEAD)", "Keep Theirs (Incoming)", and "Mark Resolved".
- **DiffViewer (`src/components/common/DiffViewer.tsx`)**:
  - Updated `parseDiffText` to preserve `diff --git` headers as hunk boundaries for multi-file commit diff readability.
- **GitClientContext & Types (`src/types/git-client.ts`, `src/context/GitClientContext.tsx`)**:
  - Extended `DiffFileStatus` to include `'U'` (unmerged/conflict) status.
  - Updated `mapStatus` and `statusColor` to correctly parse porcelain status flags for conflicts.
  - Updated `diffTab` state persistence to preserve `'merge'` tab selection.

## Verification

- Verified TypeScript compilation and bundling via `npm run build`.
- Ran GitNexus `detect_changes` analysis to verify symbol safety and execution flows.
