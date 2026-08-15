# 2026-08-01 Branches, Git Graph / Commits, and Changes Backend Wiring

## Summary
- Implemented Rust backend commands for branch management, commit actions, file staging, commit inspection, diff retrieval, and stashes.
- Extended `tauriGitBackend.ts` with strongly typed wrappers for all new backend commands.
- Updated `GitClientContext.tsx` with live state management for stashes, commit details, and branch/commit/staging operations with automatic snapshot re-hydration.
- Wired UI components (`BranchesView`, `GraphView`, `CommitDetailsView`, `SourceControlDock`) to live backend operations instead of mock toast handlers.

## Changes
- Rust backend additions in `src-tauri/src/git_backend.rs`:
  - `git_rename_branch(repo_path, old_name, new_name)`: `git branch -m [old] <new>`
  - `git_delete_branch(repo_path, branch, is_remote, force)`: `git branch -D <branch>` or `git push <remote> --delete <branch>`
  - `git_set_upstream(repo_path, branch, upstream)`: `git branch --set-upstream-to=<upstream> [branch]` / `--unset-upstream`
  - `git_merge_branch(repo_path, reference)`: `git merge <reference>`
  - `git_rebase_branch(repo_path, reference)`: `git rebase <reference>`
  - `git_reset(repo_path, reference, mode)`: `git reset [--soft|--mixed|--hard] <reference>`
  - `git_get_commit_files(repo_path, sha)`: `git show --numstat --format= <sha>`
  - `git_get_commit_diff(repo_path, sha, file_path)`: `git show <sha> [-- <path>]`
  - `git_cherry_pick(repo_path, sha)`: `git cherry-pick <sha>`
  - `git_revert_commit(repo_path, sha)`: `git revert --no-edit <sha>`
  - `git_create_tag(repo_path, tag_name, sha)`: `git tag <tag_name> [sha]`
  - `git_delete_tag(repo_path, tag_name)`: `git tag -d <tag_name>`
  - `git_stage_file(repo_path, path)`: `git add -- <path>`
  - `git_stage_all(repo_path)`: `git add -A`
  - `git_unstage_file(repo_path, path)`: `git restore --staged -- <path>`
  - `git_unstage_all(repo_path)`: `git restore --staged .`
  - `git_discard_changes(repo_path, path, is_untracked)`: `git restore -- <path>` or `git clean -fd -- <path>`
  - `git_discard_all(repo_path)`: `git restore . && git clean -fd`
  - `git_commit(repo_path, message, amend)`: `git commit -m <message> [--amend]`
  - `git_get_stashes(repo_path)`: `git stash list --format="%gd%x1f%H%x1f%gs%x1f%cr"`
  - `git_show_file_diff(repo_path, path, staged)`: `git diff [--staged] -- <path>`
- Registered all commands in `src-tauri/src/lib.rs` invoke handler.
- Service wrappers in `src/services/tauriGitBackend.ts`:
  - Added DTO interfaces `StashEntry` and `CommitFileChange`.
  - Added typed wrappers for all new branch, commit, staging, tag, and stash operations.
- State hydration and context in `src/context/GitClientContext.tsx`:
  - Added live `stashes` state and auto-fetching in `refreshRepositorySnapshot`.
  - Added helper `getCommitFullSha(i)` for complete commit SHA retrieval.
  - Implemented async action handlers with auto re-hydration of branch summary, working-tree changes, graph, and stashes.
- Views & Docks updated:
  - `BranchesView.tsx`: Context menu and top buttons now execute real backend operations for checkout, create, rename, merge into current branch, rebase, soft/mixed/hard reset, set/untrack upstream, and delete (local and remote).
  - `GraphView.tsx`: Commit context menu now executes real detached checkout, branch creation at commit, tag creation, cherry-pick, revert commit, soft/mixed/hard reset, and clipboard hash copying.
  - `CommitDetailsView.tsx`: Hydrates real commit changed files via `fetchCommitFiles`, and wires Revert selected / Cherry-pick selected actions.
  - `SourceControlDock.tsx`: Stage, Unstage, Discard actions for staged, unstaged, and untracked files; icon-only Unstage All / Stage All header buttons; Commit button with Amend checkbox option; Stash tab rendering live backend stashes with Create Stash, Apply, Pop, and Drop stash context menu actions.

## Validation
- `cargo check --manifest-path src-tauri/Cargo.toml`: pass (0 errors)
- `npx tsc -p tsconfig.json --noEmit`: pass (0 errors)
- `npm run build`: pass (0 errors)
