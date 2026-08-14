# Integrated terminal bottom panel

## Changes

- Converted the existing bottom Output drawer into a tabbed panel with `Output` and `Terminal` tabs.
- Kept Output's git command log, clear action, hide control, persisted height, and resize handle unchanged.
- Added an interactive xterm-based terminal that starts in the currently active repository directory.
- Added Tauri PTY commands for terminal start, input, resize, and stop; terminal output is streamed to the frontend through Tauri events.
- Updated the status-bar control label from `Output` to `Panel` because it now opens both bottom-panel tabs.
- Reset letter spacing on the bottom terminal panel tab buttons (`Output` / `Terminal`) to default.

## Verification

- `pnpm typecheck`
- `cargo check --manifest-path src-tauri/Cargo.toml`
