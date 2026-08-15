# Diff/Merge split line alignment

## Summary

- Fixed overlapping text in the split Diff/Merge view for modified files.
- Render each old/new pair inside one shared row so wrapped content on either side expands the same row height.
- New and deleted files retain their existing empty-side presentation.

## Verification

- `npm run typecheck`
- `npm run lint`
- Local Vite UI smoke test
