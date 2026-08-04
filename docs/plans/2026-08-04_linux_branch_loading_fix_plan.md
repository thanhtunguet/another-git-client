# Implementation Plan — Linux Branch List Loading Fix

## Overview

Fix branch loading failures on Linux systems caused by Git version incompatibilities (`%(symref)` format atom supported only in Git 2.38.0+), silent error masking in the frontend, desktop GUI launcher PATH resolution, and strict canonicalization errors.

## Root Causes

1. **Git Format Atom Incompatibility (`%(symref)`)**: `git_get_branches` in `src-tauri/src/git_backend.rs` requests `%(symref)` from `git for-each-ref`. On Git < 2.38.0 (Ubuntu 20.04/22.04 LTS, Debian 11, RHEL 8/9), Git aborts with `fatal: unknown field name: symref` (exit status 128).
2. **Frontend Error Masking**: `BranchesView.tsx` catches backend rejection and sets `branches = []` without surfacing the error message.
3. **Desktop Launcher PATH**: On Linux desktop environments, GUI app launchers do not source login shell PATHs, causing `Command::new("git")` to fail if git is in `/usr/local/bin`, `~/.local/bin`, or Homebrew paths.
4. **Strict Canonicalization**: `canonical_repo_path` fails if `canonicalize()` fails across mount/container boundaries.

## Plan

### Step 1: Rust Backend Compatibility Hardening (`src-tauri/src/git_backend.rs`)
- Remove `%(symref)` from `git_get_branches` format string.
- Detect remote default symbolic refs (`origin/HEAD`) by matching `full_ref.starts_with("refs/remotes/") && full_ref.ends_with("/HEAD")`.
- Fall back to `PathBuf::from(repo_path)` in `canonical_repo_path` if `canonicalize()` fails but directory exists.
- Extend `run_git_allow_failure` on Linux to check common binary directories (`/usr/local/bin`, `~/.local/bin`, `/home/linuxbrew/.linuxbrew/bin`) if system `PATH` lookup fails.

### Step 2: Frontend Error State & UI Feedback (`src/components/views/BranchesView.tsx`)
- Store error message when `getBranches` fails.
- Render explicit error banner and retry button instead of a misleading empty list.

### Step 3: Verification
- Verify branch listing formatting against standard Git output.
- Verify error panel behavior when branch loading encounters a git error.
