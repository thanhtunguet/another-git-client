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
