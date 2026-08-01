# Changelog

## 2026-08-01
- Wired header repository and branch actions to real Tauri backend Git operations.
- Added native dialog plugin support for repository folder selection and clone destination.
- Added backend clone/create-branch commands and action-lock hardening for reliable operation execution.
- Added clone dialog form with repository URL input and HTTPS-to-Git SSH conversion checkbox.
- Fixed Clone click flow to open dialog-based UX directly without relying on browser prompt.
- Replaced initial Linux placeholder in header with "Open a repository" neutral state.
- Added persistent app store for settings and selected/active repository restoration on app reopen.
- Added repository dropdown select options with persisted repository list and path visibility in open menu.
- Improved top toolbar Fetch/Pull/Push responsiveness with active-button spinner feedback and async completion flow.
- Prevented UI freeze during Fetch/Pull/Push by running Tauri git commands on a blocking runtime worker instead of the command thread.
- Ensured Fetch/Pull/Push loading indicator appears immediately by yielding one render frame before backend invoke.
- Removed Fetch confirmation to start remote fetch immediately on click with instant spinner feedback.
