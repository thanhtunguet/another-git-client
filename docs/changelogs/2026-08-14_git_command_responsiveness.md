# Session Changelog: Git Command Responsiveness

**Date:** 2026-08-14  
**Scope:** Make Git action feedback immediate and prevent submodule operations from blocking the Tauri command thread.

## Changes

- Updated the shared frontend Git action lock to show an in-progress toast immediately, yield one animation frame for React to paint it, and keep progress active until the action completes.
- Made toast timers generation-safe so a finishing action cannot dismiss a newer operation's notification.
- Moved submodule state refresh, init, update, sync, deinit, pointer diff/staging, recorded-commit checkout, and tracked-branch pull onto Tauri's blocking worker runtime.

## Verification

- `npm run typecheck` passed.
- `cargo check --manifest-path src-tauri/Cargo.toml` passed.
