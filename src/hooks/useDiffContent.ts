import { useEffect, useState } from 'react';
import { tauriGitBackend, WorkspaceFile } from '../services/tauriGitBackend';

/**
 * Which two things a diff pane is comparing.
 *
 * The `worktree` and `merge` sources are the only ones whose right-hand side
 * is a real file on disk, and therefore the only ones that can be edited.
 */
export type DiffContentSource =
  | { kind: 'worktree'; path: string; status?: string }
  | { kind: 'merge'; path: string }
  | { kind: 'index'; path: string }
  | { kind: 'commit'; path: string; sha: string };

export interface DiffContent {
  originalText: string | null;
  modifiedText: string | null;
  /** True when either side is binary or past the size limit. */
  contentUnavailable: boolean;
  loading: boolean;
}

const EMPTY: DiffContent = {
  originalText: null,
  modifiedText: null,
  contentUnavailable: false,
  loading: false
};

/** Missing content is an empty pane, not an error — a file added in this commit has no left side. */
function textOf(file: WorkspaceFile): string | null {
  if (file.isBinary || file.tooLarge) return null;
  return file.text ?? '';
}

/**
 * Loads whole-file text for both sides of a diff.
 *
 * Monaco needs full documents rather than a patch, so each side is fetched as
 * a blob (`git cat-file`) or read from the working tree.
 */
export function useDiffContent(repoPath: string, source: DiffContentSource | null): DiffContent {
  const [content, setContent] = useState<DiffContent>(EMPTY);

  // Destructured so the effect keys on primitives; `source` is rebuilt on
  // every render by callers and would otherwise refetch continuously.
  const kind = source?.kind ?? null;
  const path = source?.path ?? '';
  const sha = source && source.kind === 'commit' ? source.sha : '';
  const status = source && source.kind === 'worktree' ? (source.status ?? '') : '';

  useEffect(() => {
    if (!repoPath || !kind || !path) {
      setContent(EMPTY);
      return;
    }

    let active = true;
    setContent(previous => ({ ...previous, loading: true }));

    void (async () => {
      try {
        let original: string | null;
        let modified: string | null;

        if (kind === 'worktree' || kind === 'merge') {
          // Untracked files have no index entry; conflicted files diff against
          // stage 2 ("ours"), which is what git itself shows as the left side.
          const originalRev = kind === 'merge' ? ':2' : '';
          const originalFile =
            kind === 'worktree' && status === '?'
              ? null
              : await tauriGitBackend.showBlob(repoPath, originalRev, path);

          const modifiedFile = await tauriGitBackend.readWorkspaceFile(repoPath, path);

          original = originalFile ? textOf(originalFile) : '';
          modified = textOf(modifiedFile);
        } else if (kind === 'index') {
          // Left is HEAD, right is the staged blob — deliberately not the file
          // on disk, which is why this pane is never editable.
          const [head, staged] = await Promise.all([
            tauriGitBackend.showBlob(repoPath, 'HEAD', path),
            tauriGitBackend.showBlob(repoPath, '', path)
          ]);
          original = textOf(head);
          modified = textOf(staged);
        } else {
          const [parent, commit] = await Promise.all([
            tauriGitBackend.showBlob(repoPath, `${sha}^`, path),
            tauriGitBackend.showBlob(repoPath, sha, path)
          ]);
          original = textOf(parent);
          modified = textOf(commit);
        }

        if (!active) return;
        setContent({
          originalText: original,
          modifiedText: modified,
          contentUnavailable: original === null || modified === null,
          loading: false
        });
      } catch {
        // Fall back to the patch renderer rather than surfacing an error here.
        if (active) setContent(EMPTY);
      }
    })();

    return () => {
      active = false;
    };
  }, [repoPath, kind, path, sha, status]);

  return content;
}
