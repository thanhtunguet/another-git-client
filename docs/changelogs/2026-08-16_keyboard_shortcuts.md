# Keyboard shortcuts registry, terminal chords, and a Settings tab

## Changes

### Terminal shortcuts (VS Code parity)

- `Ctrl+Shift+\`` creates a new terminal: reveals the bottom panel on the Terminal tab and appends a
  pane, matching the header's existing Split action.
- `` Ctrl+` `` toggles the terminal: opens and focuses it when hidden, switches to it when the panel
  is showing the Output tab, and hides the panel when the Terminal tab is already active.
- Both use literal `Ctrl` on every platform, including macOS, as VS Code does.

### Terminals now survive hiding the panel (behaviour change)

- The bottom panel is hidden with `display: none` instead of unmounting, and the teardown effect that
  cleared `terminalSessionIds` whenever `consoleOpen` went false has been removed.
- Previously, hiding the panel unmounted every `IntegratedTerminal`, whose cleanup calls
  `stopTerminal` — so a one-keystroke toggle would have killed whatever was running in the shell.
  This supersedes the "fresh-session cleanup after panel close" behaviour added in
  `2026-08-15_integrated_terminal_actions.md`. Sessions still end on `exit`, Kill Terminal, and app close.
- The first terminal session id is now minted lazily, on activation, rather than at mount. A
  pre-minted id would otherwise have become a stray second pane the first time a new terminal was created.

### Keybinding registry

- New `src/services/keybindings.ts`: command catalogue, canonical chord strings, conflict detection,
  and platform-aware formatting (`⌃⇧\`` on macOS, `Ctrl+Shift+\`` elsewhere).
- Chords resolve against `event.code`, not `event.key`. `Shift+Backquote` reports `~` on a US layout,
  which would otherwise make `Ctrl+Shift+\`` unmatchable. Bindings are therefore physical-key based.
- New `src/hooks/useKeybindings.ts`: one window-level listener plus `useKeybinding(id, handler)`.
  Handlers are stored as entry objects holding a latest-ref, so React StrictMode's double-mount and
  inline arrow handlers cannot corrupt the registry. Last-registered handler wins; returning `false`
  declines the chord and passes it on.
- The listener stays on the **bubble** phase. `DiffViewer` and `GraphView` register capture-phase
  listeners that `stopPropagation()` to pre-empt global handling; a capture-phase dispatcher would
  break split-diff `Cmd+A` and inline-diff `Escape`.
- Auto-repeat (`event.repeat`) and IME composition events are ignored, so holding `` Ctrl+` `` does
  not flap the panel.

### Shortcuts that were advertised but never bound

The Command Palette rendered hints for ten shortcuts that had no handler. They now work, and are
rebindable: `⌘1` Branches, `⌘2` Git Graph, `⌘4` Compare, `⌘6` Worktrees, `⌘7` Submodules,
`⌘,` Settings, `⌘B` Checkout branch, `⌘⇧F` Fetch all, `⌘↵` Commit staged, `⌘O` Open repository.
Added `⌘⇧U` for the Output panel; Pull and Push ship unassigned. Palette hints are now derived from
the registry, so they cannot drift from the real bindings again.

- View and git commands decline when no repository is open.
- `⌘↵` refuses while the palette, a dialog, or a context menu is open, and mirrors the Commit
  button's own disabled predicate — so a stray chord in a Settings or dialog field cannot commit.
  It is registered by `SourceControlDock` (amend-aware) with a provider-level fallback for when the
  dock is hidden.
- `⌘A` is declined outside the Compare view, so no `preventDefault()` runs and select-all still works
  as text selection everywhere else.

### Settings → Keyboard shortcuts

- New tab listing every command grouped by category, with search over labels, ids, and chords.
- Click a chord to record a new one. `Esc` cancels, `Backspace` clears the binding; with any modifier
  held, both record normally. Global dispatch is suspended while recording, so assigning `⌘O` does
  not also open a repository.
- Chords consumed by the OS/default macOS menu (`⌘Q`, `⌘W`, `⌘M`, `⌘H`, `⌘Space`, `Alt+F4`, …) are
  refused with a "reserved by the system" note rather than silently accepted and never fired.
- Duplicate chords badge both rows as conflicting. Per-row Reset and Reset all restore defaults.
- Only overrides are persisted (in `preferences.keybindings`), with `''` meaning explicitly
  unassigned and a missing entry meaning "use the default" — so future default changes reach
  existing users.

### Incidental fix

- The settings persistence effect built a `PersistedAppStore` with no `ai` field while
  `saveAppStore` replaces the record wholesale, so every preference write silently discarded the
  OpenAI key saved by `saveAIConfig`. Pre-existing, but rebinding shortcuts would have triggered it
  constantly. The effect now carries `ai: aiConfig`.

### Shared style

- Promoted the key-cap style (duplicated inline in `TopBar` and as `.gc-welcome-action-key`) into a
  shared `.gc-kbd` class in `_components.scss`.

## Verification

- `pnpm typecheck`
- `pnpm lint` (0 errors; 14 pre-existing warnings, unchanged)
- `pnpm build:tauri-frontend`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `git diff --check`
- Not yet exercised interactively: port 1420 was held by an already-running dev server, so the
  chords, the recorder, and PTY survival across `` Ctrl+` `` still need a manual pass in the app.
