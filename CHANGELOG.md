# Changelog

## 2026-08-17

- Replaced the Ubuntu-only GitHub Actions build with tag/manual semantic-version release builds for Ubuntu 22.04 amd64, Windows amd64, macOS Intel, and macOS Apple silicon. See `docs/changelogs/2026-08-17_cross_platform_release_builds.md`.

## 2026-08-16

- Made the Branches view recent-commits list interactive with Git Graph-equivalent commit actions,
  keyboard support, and focused commit-to-parent diffs that hide Source Control. See
  `docs/changelogs/2026-08-16_keyboard_shortcuts.md`.
- Added VS Code-style terminal shortcuts (`Ctrl+Shift+\`` new terminal, `` Ctrl+` `` toggle terminal, literal Ctrl on every platform) and a rebindable keybinding registry that also implements the ten Command Palette shortcuts that were previously advertised but never bound. Terminals now survive hiding the bottom panel instead of having their PTY stopped. Added a Settings → Keyboard shortcuts tab with search, chord recording, conflict detection, and reset. See `docs/changelogs/2026-08-16_keyboard_shortcuts.md`.

## 2026-08-15

- Fixed integrated terminal font rendering and letter spacing (`letterSpacing: 0`), and added `Split` and `Kill` (with confirmation modal) icon buttons to the bottom panel header bar when the Terminal tab is open. See `docs/changelogs/2026-08-15_terminal_font_spacing.md`.
- Added searchable multi-select Branch/Tag and Author pickers plus day-bounded From/To date pickers to Git Graph filtering. Branch/tag selections use OR matching, while filter categories combine with AND semantics. See `docs/changelogs/2026-08-15_git_graph_filter_multi_select.md`.
- Added the Git Graph commit context menu actions backed by the existing Git commands, including patch creation copied to the clipboard; a normal commit click now opens only that commit's changed-file list and keeps a single active selection. Selecting a changed file opens an inline diff alongside a compact graph list and hides Source Control. See `docs/changelogs/2026-08-15_git_graph_commit_actions.md`.
- Displayed changed files as collapsible folder trees in Diff/Merge, Source Control, Commit Detail, and Git Graph. See `docs/changelogs/2026-08-15_changed_files_tree.md`.
- Suppressed default browser context menus throughout the frontend while preserving item-specific custom menus; text selections now offer Copy. See `docs/changelogs/2026-08-15_frontend_context_menu_policy.md`.
- Fixed overlapping wrapped text in split Diff/Merge views for modified files by rendering each old/new pair in one shared-height row. See `docs/changelogs/2026-08-15_diff_merge_split_line_alignment.md`.
- Constrained Diff/Merge text selection to the clicked split pane: line-number gutters are excluded, and Cmd/Ctrl+A now selects only the previous or current change content. See `docs/changelogs/2026-08-15_diff_merge_content_selection.md`.
- Enhanced Quick Git Actions with fuzzy action search, branch/tag suggestions, and commit-ID selections. See `docs/changelogs/2026-08-15_quick_git_actions_lookup.md`.
- Added integrated-terminal context actions (Clear All, Split Terminal, Kill Terminal), multi-column split panes, and fresh-session cleanup after `exit` or panel close. See `docs/changelogs/2026-08-15_integrated_terminal_actions.md`.
- Fixed Source Control file selection so the Diff view opens the exact clicked file, including untracked files rendered as an add-from-empty diff. See `docs/changelogs/2026-08-15_source_control_file_diff.md`.
- Consolidated Branch and Tag reset actions into one mode-selecting dialog with Soft/Mixed/Hard explanations and command preview. See `docs/changelogs/2026-08-15_branch_tag_reset_dialog.md`.
- Sorted tags in the Branches view by time descending, including tag path folders ordered by their newest contained tag. See `docs/changelogs/2026-08-15_branches_tag_sorting.md`.
- Fixed the Branches view recent-commits pane by loading the selected branch's history directly from the Tauri Git backend. See `docs/changelogs/2026-08-15_branches_recent_commits.md`.
- Made tag clicks inspect the tag revision and show its recent commits instead of checking it out; added shared revision actions to the tag context menu. See `docs/changelogs/2026-08-15_branches_recent_commits.md`.

## 2026-08-14

- Added a VS Code-style bottom panel with reorderable, persistent `Output` and interactive integrated `Terminal` tabs (with default letter spacing). The terminal uses a Tauri PTY and starts in the active repository. See `docs/changelogs/2026-08-14_integrated_terminal_tabs.md`.
- Improved Git action responsiveness: progress now renders before shared Git actions start, and submodule commands run on Tauri blocking workers instead of the command thread. See `docs/changelogs/2026-08-14_git_command_responsiveness.md`.
- Fixed left navigation menubar to a fixed non-resizable width (82px) and removed "Components" item from navigation sidebar and view router. See `docs/changelogs/2026-08-14_nav_sidebar_fixed_width_remove_components.md`.
- Fixed TypeScript errors: added `totalCommitCount` to `GitClientContextType` interface in `src/context/GitClientContext.tsx` and removed unused `renderAIControl` function in `src/components/views/SettingsView.tsx`. See `docs/changelogs/2026-08-14_typecheck_fixes.md`.
- Fixed branch names displaying with `^{}` suffix in the branches view. The `git_get_branches` Rust command used `%(*refname:short)` which dereferences tags and appends `^{}`. Stripped the suffix during parsing in `src-tauri/src/git_backend.rs`. See `docs/changelogs/2026-08-14_branch_name_suffix_fix.md`.

## 2026-08-05

- Fixed empty view issues in Diff/Merge tab (DiffView.tsx) when opening clean repositories or inspecting commit diffs.
- Added live commit file hydration via fetchCommitFiles when viewing commit diffs ("parent" and "refs" modes).
- Added Merge Conflicts resolution tab ("merge") with conflict badge counters and interactive resolution controls (Keep Ours / Keep Theirs / Mark Resolved).
- Added structured empty state cards with contextual icons, explanations, and quick action buttons when working tree or staged list is clean.
- Preserved diff --git file boundary headers in DiffViewer.tsx for multi-file commit diff readability.
- Extended DiffFileStatus and porcelain status parser in GitClientContext.tsx to handle unmerged conflict status ("U").
- Documented session changes in docs/changelogs/2026-08-05_diff_merge_empty_page_fix.md.
- Fixed empty view issues in Diff/Merge tab () when opening clean repositories or inspecting commit diffs.
- Added live commit file hydration via when viewing commit diffs ( and modes).
- Added Merge Conflicts resolution tab () with conflict badge counters and interactive resolution controls (Keep Ours / Keep Theirs / Mark Resolved).
- Added structured empty state cards with contextual icons, explanations, and quick action buttons when working tree or staged list is clean.
- Preserved file boundary headers in for multi-file commit diff readability.
- Extended and porcelain status parser in to handle unmerged conflict status ().
- Documented session changes in .
- Audited all destructive git operations across the codebase and replaced all unconfirmed actions with the app standard custom modal dialog (`<Dialog />`).
- Routed commit reverting ("Revert selected" button in `CommitDetailsView` & "Revert commit" in `GraphView` context menu) through custom confirmation modals.
- Routed hard HEAD resetting ("Reset HEAD to here — hard" in `GraphView` context menu) through custom confirmation modal detailing lost uncommitted changes.
- Routed file change discarding ("Discard changes" in `SourceControlDock` file context menu) and stash dropping ("Drop" in `SourceControlDock` stash context menu) through custom confirmation modals.
- Eliminated native browser `window.confirm`, `window.alert`, and `window.prompt` calls in favor of custom modal dialogs (`confirm`, `prompt`) and non-blocking toast notifications.
- Added backdrop click cancellation to the custom `<Dialog />` overlay.
- Documented session changes in `docs/changelogs/2026-08-05_destructive_actions_confirmation_dialogs.md`.

## 2026-08-04

- Fixed Linux branch loading failures caused by Git < 2.38 `%(symref)` format atom incompatibility in `src-tauri/src/git_backend.rs`, added PATH discovery for Linux GUI desktop launchers, made path canonicalization non-breaking across mount boundaries, and added explicit error state UI feedback and retry control in `BranchesView.tsx`.
- Implemented 2-sided (two columns / side-by-side) diff viewer component (`<DiffViewer />`) with block-pairing algorithm (`parseSideBySideDiff`), dual line-number gutters, column header indicators, toolbar layout switcher (`2 Sides` / `1 Side`), and settings configuration.
- Integrated `<DiffViewer />` across `DiffView.tsx` and `CommitDetailsView.tsx`.
- Renamed desktop application to **Another Git** (`package.json`, `tauri.conf.json`, `index.html`, and bundle metadata).
- Implemented custom `useResizablePanel` hook and `<ResizeHandle />` component with `localStorage` state persistence, drag indicators, and double-click size reset.
- Made all layout panels resizable: Navigation Sidebar (`NavSidebar`), Source Control Dock (`SourceControlDock`), Console Drawer (`ConsoleDrawer`), Branch Tree (`BranchesView`), Commit Details (`CommitDetailsView`), Diff View (`DiffView`), and Compare View (`CompareView`).
- Documented session changes in `docs/changelogs/2026-08-04_app_rename_resizable_panels.md`.

## 2026-08-01

- Added Rust backend commands `git_get_compare`, `git_create_patch`, and `git_apply_patch`.
- Wired `CompareView.tsx` to live backend comparison, dynamic branch selection, side-by-side commit comparison, and export summary/patch.
- Wired `CommitDetailsView.tsx` and `DiffView.tsx` to real git diff parsing and line rendering for working tree, index, and commit files.
- Enhanced `SourceControlDock.tsx` with commit message templates, dynamic AI commit message generation based on staged/unstaged changes, and real stash/patch actions.
- Replaced dummy palette toasts in `CommandPalette.tsx` with real git action dispatchers (checkout, rebase, delete branch, stash push/pop, commit changes).
- Implemented Rust backend commands for Worktree operations (`git_worktree_lock`, `git_worktree_unlock`, `git_worktree_prune`, `git_open_path_in_file_manager`, `git_open_path_in_terminal`) and enriched worktree porcelain output with current status, dirty flags, and head commit subjects.
- Implemented Rust backend commands for Submodule operations (`git_submodule_init`, `git_submodule_pointer_diff`, `git_submodule_stage_pointer`, `git_submodule_checkout_recorded`, `git_submodule_pull_tracked`) and enriched submodule state with recorded SHA in index, dirty status, branch, and ahead/behind counters.
- Updated `tauriGitBackend.ts` and `GitClientContext.tsx` with `worktrees` and `submodules` live state, auto-snapshot rehydration, and action handlers for all worktree and submodule operations.
- Wired `WorktreesView.tsx` to live backend data with health section grouping (Current, Other worktrees, Locked, Prunable), context menu actions, and interactive dialogs for Add Worktree and Lock Worktree.
- Wired `SubmodulesView.tsx` to live backend data with health section grouping (Needs attention, Clean, Uninitialized), context menu actions (Init, Update, Sync, Checkout recorded commit, Pull tracked branch, Pointer diff, Stage pointer, Deinit, Open in workspace), and header action buttons.
- Wired header repository and branch actions to real Tauri backend Git operations.
- Added native dialog plugin support for repository folder selection and clone destination.
- Added backend clone/create-branch commands and action-lock hardening for reliable operation execution.
- Added clone dialog form with repository URL input and HTTPS-to-Git SSH conversion checkbox.
- Fixed Clone click flow to open dialog-based UX directly without relying on browser prompt.
- Replaced initial Linux placeholder in header with "Open a repository" neutral state.
- Added persistent app store for settings and selected/active repository restoration on app reopen.
- Added repository dropdown select options with persisted repository list and path visibility in open menu.
- Improved top toolbar Fetch/Pull/Push responsiveness with active-button spinner feedback and async completion flow.
- Prevented UI freeze during Fetch/Pull/Push by running Tauri git commands on a blocking runtime worker instead of the command thread.
- Ensured Fetch/Pull/Push loading indicator appears immediately by yielding one render frame before backend invoke.
- Removed Fetch confirmation to start remote fetch immediately on click with instant spinner feedback.
- Replaced branch action-only toolbar menu with IntelliJ-style branch tree access and live grouped branch hierarchy (Local/Remote/remote-name/path folders) in Branches view.
- Wired graph view to Tauri backend commits with initial 200-item load, virtualized rows, and infinite scroll pagination.
- Replaced Source Control mock change data with live backend grouping for Staged, Unstaged, and Not in VCS (untracked).
- Extended Rust changed-file API payload to include index/worktree status and staged/unstaged/untracked classification for UI grouping.
- Updated Source Control Stage all / Unstage all controls to VSCode-like icon-only actions with tooltip labels.
- Updated Stash tab create action to a VSCode-like icon-only header control with tooltip label.
- Added a current-branch fallback command so the toolbar branch label no longer stays stuck on "No branch" when the branch list fetch fails.
- Made the top-bar branch button open the existing Branches view instead of duplicating branch-list logic in the toolbar.
- Added a fallback branch loader in the VS Code extension so the branch/tag picker can still populate when the split local/remote refresh path yields no refs.
- Implemented Rust backend commands for branch actions (rename, delete, set-upstream, merge, rebase, reset).
- Implemented Rust backend commands for commit operations (commit files, diff retrieval, cherry-pick, revert, create/delete tag).
- Implemented Rust backend commands for file staging (stage, unstage, stage-all, unstage-all, discard, discard-all, commit with amend) and live stash list (`git stash list`).
- Extended frontend service `tauriGitBackend.ts` with strongly typed wrappers for all new Git commands.
- Updated `GitClientContext.tsx` with live stash state, full SHA access, and action handlers that automatically re-hydrate branch summary, working-tree changes, graph rows, and stashes.
- Wired `BranchesView.tsx` right-click context menu and toolbar buttons to live backend actions for checkout, create, rename, merge into current branch, rebase, soft/mixed/hard reset, set/untrack upstream, and local/remote branch deletion.
- Wired `GraphView.tsx` commit context menu to live detached checkout, branch/tag creation at commit, cherry-pick, revert, soft/mixed/hard reset, and clipboard hash copy.
- Updated `CommitDetailsView.tsx` to fetch live changed files for commits via `fetchCommitFiles` and wired Revert / Cherry-pick selected actions.
- Wired `SourceControlDock.tsx` file staging, unstaging, discard, commit (with amend), and live Stash list rendering with Create Stash, Apply, Pop, and Drop stash context menu actions.
