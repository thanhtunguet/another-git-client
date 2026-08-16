/**
 * Props for the Monaco diff pane.
 *
 * Kept in its own module, and deliberately free of any Monaco type, so that
 * both the real pane and the library-build stub share one definition and no
 * `import("monaco-editor")` can leak into the emitted `.d.ts`.
 */
export interface MonacoDiffPaneProps {
  /** Repo-relative path; drives syntax highlighting and identifies the buffer. */
  filePath: string;
  /** Left-hand side. Always read-only. */
  originalText: string;
  /** Right-hand side, i.e. the "current state". */
  modifiedText: string;
  /** When false the right-hand side is read-only too. */
  editable: boolean;
  theme: 'dark' | 'light';
  showGutterMarkers?: boolean;
  /** Persist the buffer. Called debounced while typing, and on blur. */
  onSave?: (filePath: string, content: string) => Promise<void> | void;
  onDirtyChange?: (dirty: boolean) => void;
  /** Lets the host fall back to the patch renderer if Monaco cannot start. */
  onInitError?: (error: unknown) => void;
}
