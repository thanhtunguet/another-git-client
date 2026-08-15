# 2026-08-14 — Branch name `^{}` suffix fix

## Problem
All branches were displayed with a `^{}` suffix (e.g. `origin/dev^{}`) in the branches view.

## Root Cause
The `git_get_branches` Rust command used `%(*refname:short)` in the `git for-each-ref` format string. The `*` prefix dereferences the ref (useful for annotated tags), and git appends `^{}` to the short name to indicate the dereferenced object. The suffix was passed through to the frontend unchanged.

## Fix
Strip the `^{}` suffix during parsing in `src-tauri/src/git_backend.rs` using `trim_end_matches("^{}")` on the parsed branch name.

## Files Changed
- `src-tauri/src/git_backend.rs` — strip `^{}` from parsed branch name.
