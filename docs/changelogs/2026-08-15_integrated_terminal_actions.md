# Integrated terminal lifecycle and split panes

## Changes

- Added a terminal context menu with Clear All, Split Terminal, and Kill Terminal actions.
- Clear All writes `clear` on Linux/macOS and `cls` on Windows to every terminal session.
- Split Terminal creates independent PTY sessions in an equal-width, multi-column terminal layout.
- Typing `exit` and pressing Enter stops the active PTY and removes its terminal pane; closing the final pane closes the bottom panel.
- Stopping, killing, or hiding terminal panes now disposes their backend PTY sessions, so reopening the terminal starts a fresh shell session.

## Verification

- `pnpm typecheck`
- `pnpm lint` (passes with 14 existing warnings outside this change)
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `git diff --check`
