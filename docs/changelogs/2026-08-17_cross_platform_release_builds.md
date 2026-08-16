# Cross-platform release builds

## Changes

- Replaced the Ubuntu-only GitHub Actions workflow with native release builds for Ubuntu 22.04 amd64, Windows amd64, macOS Intel, and macOS Apple silicon.
- The workflow runs when any tag is pushed, or manually from the Actions tab with a required semantic-version input. A leading `v` is accepted and removed for package metadata.
- Each target publishes its installers as a separately named GitHub Actions artifact for 14 days.

## Notes

- Builds are unsigned. Platform-specific signing and notarization secrets can be added later without changing the build matrix.

## Verification

- Reviewed workflow syntax and target-specific bundle artifact paths.
- `git diff --check`
