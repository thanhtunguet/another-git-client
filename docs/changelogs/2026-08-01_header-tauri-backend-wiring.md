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
