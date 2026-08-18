# Compare view full-width layout

## Summary

- Made the right-hand commit pane grow to fill all remaining horizontal space in the side-by-side
  Compare layout.
- Made the Compare graph measure its viewport and distribute its two commit lanes across the
  available width.
- Preserved a 640 px minimum graph canvas so narrow windows remain readable with horizontal
  scrolling instead of clipped commit labels.

## Verification

- `npm run typecheck`
