# Integrated Terminal Font and Letter Spacing Fix

## Changes

- Fixed terminal font resolution in `IntegratedTerminal.tsx`: xterm canvas context cannot parse CSS variables directly (`var(--font-mono)`), which caused character measurement failure, oversized letter spacing, and fallback to browser default serif/proportional font.
- Resolved `--font-mono` via `getComputedStyle` with a fallback system monospace stack (`ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace`).
- Explicitly set `letterSpacing: 0` and adjusted `lineHeight: 1.2` for crisp, standard monospace terminal rendering.

## Verification

- `pnpm typecheck`
- `git diff --check`
