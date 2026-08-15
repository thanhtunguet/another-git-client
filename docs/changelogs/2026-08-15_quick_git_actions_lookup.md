# 2026-08-15 Quick Git Actions lookup

- Implemented Quick Git Actions input resolution and fuzzy suggestions.
- Actions, branch names, and tag names are now fuzzy-matched while the user types.
- Branch selections check out the selected branch; tag selections open their commit details.
- A 4–40 character hexadecimal commit ID is always resolved in the background; otherwise a commit lookup is attempted when no action, branch, or tag matches.
- Added an empty-search hint and updated keyboard help for the selection workflow.
