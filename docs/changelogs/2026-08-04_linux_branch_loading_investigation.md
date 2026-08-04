# Session Changelog — 2026-08-04: Linux Branch Loading Fix & Error Handling Hardening

## Summary

- Fixed branch listing failures on Linux systems caused by Git < 2.38.0 format atom incompatibilities (`%(symref)`).
- Updated `git_get_branches` in `src-tauri/src/git_backend.rs` to use standard format string compatible across all Git versions and filter symbolic refs (`refs/remotes/*/HEAD`).
- Hardened `run_git_allow_failure` on Unix/Linux to ensure standard binary locations (`/usr/local/bin`, `~/.local/bin`, `/home/linuxbrew/.linuxbrew/bin`) are searched when launched from GUI desktop launchers.
- Hardened `canonical_repo_path` to fall back to `PathBuf::from(repo_path)` if canonicalization fails across mount/container boundaries.
- Enhanced `src/components/views/BranchesView.tsx` with error state capture (`loadError`), rendering an explicit error feedback panel and retry control.

## Detailed Changes

- `src-tauri/src/git_backend.rs`:
  - `git_get_branches`: Removed `%(symref)` atom from `for-each-ref` format string; added pattern check `full_ref.starts_with("refs/remotes/") && full_ref.ends_with("/HEAD")` for filtering remote HEAD symrefs.
  - `run_git_allow_failure`: Extended PATH environment variable on Unix/Linux with missing binary paths if missing.
  - `canonical_repo_path`: Made canonicalization non-breaking with `unwrap_or(path)`.
- `src/components/views/BranchesView.tsx`:
  - Added `loadError` state.
  - Rendered error panel with red background banner, scrollable error message, and a Retry button when branch loading fails.

## Verification

- `cargo check --manifest-path src-tauri/Cargo.toml`: Passed cleanly.
- `npm run build:tauri-frontend`: Passed clean build in 775ms.
