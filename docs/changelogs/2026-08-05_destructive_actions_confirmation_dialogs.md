# Destructive Actions Confirmation Dialog Fixes

Date: 2026-08-05

## Summary

Audited all destructive git actions across the application and routed unconfirmed operations through the custom `<Dialog />` modal component (`confirm(...)` and `prompt(...)`). Native browser `window.confirm`, `window.alert`, and `window.prompt` calls were eliminated to ensure consistent modal styling across desktop and Web viewports.

## Changes Made

- **CommitDetailsView** (`src/components/views/CommitDetailsView.tsx`):
  - Wrapped "Revert selected" button click handler in custom `confirm(...)` dialog modal detailing the commit SHA, subject, and command preview (`git revert --no-edit <sha>`).
- **GraphView** (`src/components/views/GraphView.tsx`):
  - Wrapped "Revert commit" context menu action in custom `confirm(...)` modal.
  - Wrapped "Reset HEAD to here — hard" context menu action in custom `confirm(...)` modal explaining that uncommitted changes will be permanently discarded.
- **SourceControlDock** (`src/components/layout/SourceControlDock.tsx`):
  - Wrapped "Discard changes" in file context menu in custom `confirm(...)` modal.
  - Wrapped "Drop" in stash context menu in custom `confirm(...)` modal.
- **BranchesView** (`src/components/views/BranchesView.tsx`):
  - Replaced native `window.confirm` for deleting remotes with custom `confirm(...)` modal.
  - Replaced native `window.alert` with non-blocking toast notification (`toastRun`).
- **GitClientContext** (`src/context/GitClientContext.tsx`):
  - Replaced non-Tauri `window.prompt` fallbacks for cloning and opening repositories with custom input `prompt(...)` modals.
- **Dialog** (`src/components/common/Dialog.tsx`):
  - Added backdrop click handler to cancel dialog when clicking outside the modal box.

## Verification

- Ran `npm run build` to verify TypeScript compilation, declaration generation, and Vite bundle compilation.
- Confirmed zero occurrences of native browser dialog calls (`window.confirm`, `window.alert`, `window.prompt`) remain in the codebase (`rg` clean).
