/**
 * `edcore.main` ships no declarations of its own. It re-exports exactly the
 * surface declared by `editor.api` (both funnel through `editor.api2.js`)
 * while additionally registering the editor contributions — including the diff
 * editor — that `editor.api` alone leaves out.
 *
 * Declaring it untyped here keeps the module resolvable; `services/monacoSetup.ts`
 * casts it to `editor.api`'s declared surface exactly once, and everything
 * downstream uses that typed value.
 */
declare module 'monaco-editor/esm/vs/editor/edcore.main.js';
