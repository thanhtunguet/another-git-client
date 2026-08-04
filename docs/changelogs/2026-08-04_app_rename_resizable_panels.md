# Session Changelog — 2026-08-04: App Rename & Resizable Persistent Panels

## Summary

- Renamed desktop app to **Another Git** across package metadata (`package.json`), Tauri configuration (`tauri.conf.json`), bundle identifier (`com.anothergit.app`), and HTML title (`index.html`).
- Built custom `useResizablePanel` hook and `<ResizeHandle />` UI component supporting horizontal and vertical panel splitters, hover states, dragging feedback, double-click size reset, and local storage (`localStorage`) state persistence.
- Made all application panels resizable:
  - **Navigation Sidebar** (`NavSidebar`): Horizontal width resizing with persistence (`ag_panel_nav_sidebar_width`).
  - **Source Control Dock** (`SourceControlDock`): Horizontal width resizing with persistence (`ag_panel_sc_dock_width`).
  - **Console Drawer** (`ConsoleDrawer`): Vertical height resizing with persistence (`ag_panel_console_height`).
  - **Branch Tree Panel** (`BranchesView`): Splitter between branch tree and branch inspector with persistence (`ag_panel_branches_tree_width`).
  - **Commit Details Panel** (`CommitDetailsView`): Splitter between commit file list and diff viewer with persistence (`ag_panel_commit_details_width`).
  - **Diff View Sidebar** (`DiffView`): Splitter between changed files panel and diff viewer with persistence (`ag_panel_diff_sidebar_width`).
  - **Compare View Split** (`CompareView`): Splitter between Side A and Side B in side-by-side or stacked layout with persistence (`ag_panel_compare_side_a_width` / `ag_panel_compare_side_a_height`).

## Detailed Changes

- `package.json`: Updated `"name"` to `"another-git"`, description to `"Another Git desktop application"`.
- `src-tauri/tauri.conf.json`: Updated `"productName"` to `"Another Git"`, `"title"` to `"Another Git"`, `"identifier"` to `"com.anothergit.app"`.
- `index.html`: Updated `<title>` to `"Another Git"`.
- `src/hooks/useResizablePanel.ts`: Created custom hook to manage panel dimensions, drag handlers, bounds clamping, and `localStorage` synchronization.
- `src/components/common/ResizeHandle.tsx`: Created visual splitter bar component for horizontal/vertical dragging and reset action.
- `src/components/layout/NavSidebar.tsx`: Added `style` and `className` props for variable width.
- `src/components/layout/SourceControlDock.tsx`: Added `style` and `className` props for variable width.
- `src/components/GitClient.tsx`: Integrated resizable layout handles for `NavSidebar` and `SourceControlDock`.
- `src/components/layout/ConsoleDrawer.tsx`: Integrated vertical resizable handle for bottom console output.
- `src/components/views/BranchesView.tsx`: Added horizontal splitter between branch/tag tree and branch inspector.
- `src/components/views/CommitDetailsView.tsx`: Added horizontal splitter between commit files list and diff pane.
- `src/components/views/DiffView.tsx`: Added horizontal splitter between changed files list and diff content pane.
- `src/components/views/CompareView.tsx`: Converted grid layout to flexible resizable split supporting horizontal/vertical modes.

## Verification

- `npm run typecheck`: Passed clean with zero TypeScript errors.
