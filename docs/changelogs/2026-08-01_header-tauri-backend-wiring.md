# 2026-08-01 Header Tauri Backend Wiring

## Summary
- Replaced header mock actions with real Tauri-backed Git operations.
- Implemented native folder dialog support for repository selection and clone destination.
- Added backend commands and invoke wiring for branch creation and repository clone.

## Changes
- Updated header menus and actions to use live handlers:
  - Repository: Open Repository, Clone
  - Branch: Create new branch, Fetch with prune, Pull, Push
  - Direct actions: Fetch, Pull, Push
- Wired frontend service methods in src/services/tauriGitBackend.ts:
  - git_create_branch
  - git_clone_repo
- Added Rust commands in src-tauri/src/git_backend.rs:
  - git_create_branch(repo_path, branch, base)
  - git_clone_repo(url, destination)
- Registered commands in src-tauri/src/lib.rs invoke handler.
- Added dialog plugin runtime wiring in src-tauri/src/lib.rs:
  - tauri_plugin_dialog::init()
- Added dialog permissions in src-tauri/capabilities/default.json:
  - dialog:default
- Added Rust dependency in src-tauri/Cargo.toml:
  - tauri-plugin-dialog = "2"
- Replaced prompt-based repository path selection with native directory picker fallback logic.
- Added action lock state to prevent concurrent Git operations and disabled header action controls during active operations.
- Added robust command result logging (stdout/stderr/exit) to console output.

## Validation
- npm run typecheck: pass
- cargo check: pass

## Follow-up (Clone UX)
- Replaced prompt-based clone URL entry with an in-app dialog form.
- Added repository URL input field in the clone dialog.
- Added checkbox: Replace HTTPS with Git SSH URL.
- Added URL conversion logic:
  - https://host/owner/repo(.git) -> git@host:owner/repo.git (when checked)
  - Existing SSH URLs are kept unchanged.
- Kept support for both HTTPS and Git/SSH clone URLs.
- Clone action now starts directly from the menu click (no browser prompt dependency), then opens the clone form.
- Default header repository state now shows "Open a repository" with no Linux placeholder path.
- Clone flow order updated: enter repository URL first in dialog, then select destination folder after pressing Clone.

## Follow-up (Persistent Store)
- Added a new app store module at src/services/appStore.ts using localStorage.
- Persisted settings across app restarts:
  - theme
  - dock visibility
  - active view
  - graph layout
  - compare mode/layout
  - filter panel open state
  - source-control tab
  - diff tab
- Persisted repository context across app restarts:
  - selected repository path
  - active repository path
  - active repository name
- Wired GitClientContext initialization from persisted values, with props still overriding when provided.
- Updated repository activation flow to keep selected and active repository paths in sync.

## Follow-up (Repository Dropdown Options)
- Repository dropdown now lists persisted repositories as selectable options.
- Repository toggler now displays repository name only.
- Repository path is displayed only when dropdown is open:
  - In dropdown header as the current path.
  - In each option hint for quick path visibility.
- Selecting a repository option switches the active repository and refreshes branch summary.
- Persisted repository store now includes `repositoryList` to retain dropdown options across app restarts.
- Dropdown header now shows the current repository directly (replacing generic Repository placeholder).
- Current repository is removed from selectable options list.
- The separator above actions is rendered only when there are other repositories available to select.

## Follow-up (Remote Toolbar Responsiveness)
- Improved Fetch/Pull/Push responsiveness in the top toolbar by making command execution fire-and-forget from the UI callback path.
- Added explicit remote operation state tracking in Git client context:
  - `activeRemoteAction: 'fetch' | 'pull' | 'push' | null`
- Added per-action spinner feedback in the toolbar buttons:
  - active action now renders a rotating spinner icon beside the label
  - buttons remain lock-protected against concurrent operations
- Kept completion notification behavior via existing toast system while preserving command output logs in the console.
- Added shared `spin` keyframes and reusable `.gc-spin` style for loading indicators.
- Moved Tauri backend `git_fetch`, `git_pull`, and `git_push` execution onto `tauri::async_runtime::spawn_blocking` to prevent blocking the app/UI thread during long-running git network commands.
- Added a one-frame UI flush (`requestAnimationFrame`) before invoking remote commands so spinner/progress state paints immediately after click/confirm.
- Removed confirmation step for `Fetch` so the top-bar fetch action starts immediately and shows running state without dialog latency.

## Follow-up (IntelliJ-style Branch Tree)
- Replaced static branch mock rows in the Branches view with live branch data from the Tauri backend (`git_get_branches`).
- Implemented hierarchical branch rendering with grouping rules:
  - Top-level groups: `Local`, `Remote`
  - Remote branches grouped by remote name (`origin`, etc.)
  - Branches inside each group further grouped by slash-separated folder path segments.
- Added expandable/collapsible folder nodes across both local and remote trees.
- Preserved per-branch context menu actions and adapted remote delete command generation to use the actual remote name and branch short name.
- Added branch filtering over name/short name/full ref/upstream while preserving grouped tree output.
- Added selected-branch details in the right pane and dynamic remote count in the footer.
- Updated top-bar branch button behavior to open the Branches view (tree) instead of showing the old 4-item action-only menu.

## Follow-up (Graph + Changes Live Wiring)
- Extended Rust changed-file payload in src-tauri/src/git_backend.rs (`git_get_changed_files`) to expose:
  - `indexStatus`, `worktreeStatus`
  - `staged`, `unstaged`, `untracked`
  - rename origin path (`oldPath`) when available
- Updated frontend Tauri DTOs in src/services/tauriGitBackend.ts for the new changed-file shape.
- Replaced graph mock seeding in src/context/GitClientContext.tsx with backend graph hydration:
  - Initial graph page load via `git_get_graph` with `maxCount=200`
  - Added paging state (`graphHasMore`, `graphLoading`, `graphLoadingMore`)
  - Added incremental loader (`loadMoreGraph`) for infinite scrolling
  - Kept commit row compatibility by mapping backend commits to existing `CommitRaw` view model
- Wired repository refresh paths (open/select/clone/fetch/pull/push/create-branch) to refresh both:
  - branch summary
  - graph page and working-tree changes
- Updated Graph view (src/components/views/GraphView.tsx):
  - Uses backend short hashes from context (`getCommitHash`) instead of synthetic hash generation
  - Added virtualized row rendering in rows layout
  - Added near-bottom auto-load for infinite pagination and manual fallback button
- Updated Commit Details view to use live commit hashes from graph data.
- Replaced hardcoded Source Control change lists with live grouped sections from backend:
  - Staged
  - Unstaged
  - Not in VCS (untracked)
- Updated status bar counts to show live changed/staged totals and currently loaded commit count.

## Validation (Graph + Changes)
- `npx tsc -p tsconfig.json --noEmit`: pass
- `cargo check --manifest-path src-tauri/Cargo.toml`: pass

## Follow-up (VSCode-like Stage/Unstage Icons)
- Updated Source Control section header actions in src/components/layout/SourceControlDock.tsx:
  - Replaced text buttons (`Stage all`, `Unstage all`) with icon-only buttons.
  - Moved action text to tooltips (`title`) and accessibility labels (`aria-label`).
  - Kept existing action handlers/commands unchanged.
  - Replaced stash tab create action with icon-only header button (`Create stash`) and tooltip text.
