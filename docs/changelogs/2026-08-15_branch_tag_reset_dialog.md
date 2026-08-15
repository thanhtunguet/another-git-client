# Branch and Tag Reset Dialog

## Changes

- Consolidated the Soft, Mixed, and Hard reset menu entries into one `Reset current to here…` action for Branch and Tag context menus.
- Added a shared reset dialog that provides Soft, Mixed, and Hard radio choices with a concise explanation of how each option affects `HEAD`, the index, and the working tree.
- Shows the exact `git reset --<mode> <reference>` command before execution and highlights the destructive Hard mode.
- Applied the same dialog to the Top Bar's branch quick-menu so all branch reset entry points remain consistent.

## Verification

- `npm run typecheck`
- `npm run lint` (passes with 14 pre-existing warnings)
