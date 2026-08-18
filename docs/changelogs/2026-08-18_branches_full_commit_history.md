# Branches view full commit history

## Summary

- Renamed the selected branch panel from the recent-commit preview to **Commits on this branch**.
- The Branches view now reads every commit reachable from the selected branch, fetching 100 commits
  at a time and progressively rendering each completed page.
- Added `skip` to the typed `git_get_ref_graph` payload so the Rust backend can page an explicit
  branch or tag history without using a shell command string.
- Tag selection remains supported and is labelled **Commits at this tag**.

## Verification

- `npm run typecheck` passes.
- `cargo check` passes.
- Added a Rust regression test covering two pages of the same branch history.
- `cargo fmt --check` reports pre-existing whole-project formatting differences; it was not applied to
  avoid a large unrelated reformat.
