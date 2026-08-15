# Source Control file diff selection

## Summary

- Source Control now opens the exact staged, unstaged, or untracked file that the user clicks.
- The destination Diff tab matches the selected file state: staged files open in Index; unstaged and untracked files open in Working tree; conflicts open in Merge.
- Untracked files now render as a diff from `/dev/null`, matching the normal Git-client presentation for a new file.

## Root cause

- Source Control only navigated to Diff without passing the clicked path, causing the Diff view to select its first available file.
- `git diff -- <path>` does not output content for an untracked file.

## Verification

- `npm run typecheck` passes.
- `npm run lint` completes with 14 pre-existing warnings outside this change.
- `cargo check --manifest-path src-tauri/Cargo.toml` passes.
- Confirmed `git diff --no-index -- /dev/null <untracked-file>` returns a new-file patch.
