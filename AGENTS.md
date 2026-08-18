## Project Context

- Project type: Git client desktop application.
- Platform: Tauri desktop app.
- Backend stack: Rust + Tauri.
- Frontend stack: React + TypeScript 7.0 + TailwindCSS + SCSS + Vite.

## Documentation And Reporting Rules

- Docs root folder: ./docs.
- Always write session changelogs in docs/changelogs/.
- Use one changelog file per session and keep updating that same file while the user is working in the session.
- Update a short summary of each session changelog in CHANGELOG.md.
- Every report or changelog filename must start with the session date prefix in this format: YYYY-MM-DD_.
- Project requirements live in docs/requirements/.
- Project conventions live in docs/conventions.
- Project plans live in docs/plans/.

## Response Style

- Keep responses concise, task-focused, and clear.
- Use bullet points for lists.
- Avoid unnecessary explanations.

## VS Code Extension Parity Source

- The folder `vscode-git-client/` is the feature baseline for this project.
- Treat the extension architecture as the reference behavior for all major git workflows.
- Primary extension entrypoints:
	- Activation and orchestration: `vscode-git-client/src/extension.ts`.
	- Command registration and handlers: `vscode-git-client/src/commands/commandController/`.
	- Git domain service: `vscode-git-client/src/services/gitService/`.
	- State refresh and view synchronization: `vscode-git-client/src/state/stateStore.ts`.
	- View providers: `vscode-git-client/src/providers/`.

## Feature Mirror Targets

Agents should mirror these extension feature groups into the Tauri app:

- Branches and tags:
	- checkout/create/rename/delete/track/untrack
	- merge/rebase/reset/compare
- Graph and commit workflows:
	- graph paging and filtering
	- commit details, range actions, patch creation/application
	- cherry-pick/revert/rebase-continue-or-abort flows
- Working tree and index workflows:
	- file stage/unstage/revert/patch stage
	- conflict detection and merge resolution actions
- Stashes:
	- create/apply/pop/drop/rename/preview patch
- Worktrees:
	- list/add/remove/force-remove/lock/unlock/prune/reveal/open terminal
- Submodules:
	- list with health grouping
	- init/update/sync/deinit
	- pointer diff and pointer staging
	- checkout recorded commit and tracked branch pull
- Compare and diff:
	- branch/tag/commit comparisons
	- compare-with-revision including working-tree comparison mode

## Rust Backend Integration Contract

The Tauri backend must own git execution and expose typed commands that mirror extension behavior.

- Rust git backend module location:
	- `src-tauri/src/git_backend.rs`
- Tauri invoke registration location:
	- `src-tauri/src/lib.rs`
- Frontend invoke wrapper location:
	- `src/services/tauriGitBackend.ts`

Current Rust command surface (phase 1 parity foundation):

- Read models:
	- `git_is_repo`
	- `git_get_branches`
	- `git_get_tags`
	- `git_get_graph`
	- `git_get_changed_files`
	- `git_get_worktrees`
	- `git_get_submodules`
- Core actions:
	- `git_checkout_branch`
	- `git_fetch`
	- `git_pull`
	- `git_push`
	- `git_create_stash`
	- `git_apply_stash`
	- `git_drop_stash`
	- `git_worktree_add`
	- `git_worktree_remove`
	- `git_submodule_update`
	- `git_submodule_sync`
	- `git_submodule_deinit`

Implementation rules:

- Keep command payloads strongly typed and serializable.
- Return structured command results including stdout/stderr/exit code for UI feedback.
- Normalize parsing in Rust, not UI components.
- Avoid shell-string execution; pass git args as arrays only.
- Do not silently swallow non-zero exits.

## Functional Gaps To Close First

Current UI in `src/` is mostly design/mock data driven and not yet wired to live git state.
Prioritize these gaps because they materially affect functionality:

- Data source gap:
	- Replace static arrays in views/context with backend-backed state hydration.
	- Evidence: seeded commits and fake logs in `src/context/GitClientContext.tsx`.
- Command execution gap:
	- Replace no-op/menu-only actions with real invoke calls and optimistic refresh.
	- Evidence: action handlers in UI currently trigger local toast/menu flows.
- Refresh/event gap:
	- Add repository watch + refresh scheduler equivalent to extension `StateStore` behavior.
- Operation-state gap:
	- Surface merge/rebase/cherry-pick/revert states and conflict resolution actions.
- Compare/graph gap:
	- Add true graph pagination/filtering and compare-with-revision workflows.
- Submodule/worktree fidelity gap:
	- Preserve grouped health states and context actions from extension providers.

## Delivery Strategy

- Build parity in slices, each slice end-to-end:
	- backend command
	- frontend state integration
	- view binding
	- action wiring
	- regression tests
- Start with: Branches + Graph + Worktree/Submodule read models, then action flows.
- Keep command names and DTOs close to extension naming to simplify cross-porting.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **git-client-design** (4226 symbols, 10138 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/git-client-design/context` | Codebase overview, check index freshness |
| `gitnexus://repo/git-client-design/clusters` | All functional areas |
| `gitnexus://repo/git-client-design/processes` | All execution flows |
| `gitnexus://repo/git-client-design/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
