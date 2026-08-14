# 2026-08-14 — Fixed Left Menubar Width & Removed Components Item

## Requirements & Scope
1. Remove resizing capability for the left navigation menubar (`NavSidebar`), fixing its dimensions to fit content cleanly.
2. Remove the "Components" navigation item and view routing now that the app is complete.

## Changes Made
- **Navigation Sidebar Fixed Width**:
  - Removed `useResizablePanel` hook instantiation for `ag_panel_nav_sidebar_width` in [GitClient.tsx](file:///Users/tungpt/Development/thanhtunguet/git-client-design/src/components/GitClient.tsx).
  - Removed `<ResizeHandle />` component attached to `NavSidebar` in [GitClient.tsx](file:///Users/tungpt/Development/thanhtunguet/git-client-design/src/components/GitClient.tsx).
  - Updated `.gc-sidebar` in [src/styles/_layout.scss](file:///Users/tungpt/Development/thanhtunguet/git-client-design/src/styles/_layout.scss) with `flex: 0 0 82px; width: 82px;` to ensure strict non-resizable sizing.
- **Removed Components View from Navigation & Routing**:
  - Removed `'components'` entry from `NAV_ITEMS` array in [NavSidebar.tsx](file:///Users/tungpt/Development/thanhtunguet/git-client-design/src/components/layout/NavSidebar.tsx).
  - Removed `ComponentsView` import and its `switch (view)` case branch in [GitClient.tsx](file:///Users/tungpt/Development/thanhtunguet/git-client-design/src/components/GitClient.tsx).
  - Removed `'components'` union member from `GitClientView` type in [git-client.ts](file:///Users/tungpt/Development/thanhtunguet/git-client-design/src/types/git-client.ts).

## Verification
- Ran `pnpm run typecheck` (`tsc --noEmit`): passed with 0 errors.
- Ran `pnpm run lint`: passed with 0 errors.
- Ran `gitnexus detect_changes()`: verified touches were strictly scoped to navigation sidebar layout and items.
