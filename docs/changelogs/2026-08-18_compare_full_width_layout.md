# Compare view full-width layout

## Summary

- Made the side-by-side Compare panes an even 1:1 split, independent of previous resize settings.
- Prioritized commit subjects for the remaining row width; authors now shrink only when necessary
  (up to 120 px), while hashes and dates retain their intrinsic width.
- Made the Compare graph measure its viewport and distribute its two commit lanes across the
  available width.
- Preserved a 640 px minimum graph canvas so narrow windows remain readable with horizontal
  scrolling instead of clipped commit labels.

## Verification

- `npm run typecheck`
