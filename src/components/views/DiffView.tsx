import React, { useEffect, useState, useMemo } from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { tauriGitBackend } from '../../services/tauriGitBackend';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { ResizeHandle } from '../common/ResizeHandle';

export interface DiffLine {
  text: string;
  type: 'hunk' | 'add' | 'del' | 'context';
  oldLine?: number;
  newLine?: number;
}

export function parseDiffText(raw: string): DiffLine[] {
  if (!raw || !raw.trim()) return [];
  const lines = raw.split('\n');
  const result: DiffLine[] = [];
  let oldN = 0;
  let newN = 0;

  for (const line of lines) {
    if (
      line.startsWith('diff --git') ||
      line.startsWith('index ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ')
    ) {
      continue;
    }
    if (line.startsWith('@@')) {
      const match = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      if (match) {
        oldN = parseInt(match[1], 10) - 1;
        newN = parseInt(match[2], 10) - 1;
      }
      result.push({ text: line, type: 'hunk' });
    } else if (line.startsWith('+')) {
      newN++;
      result.push({ text: line.slice(1), type: 'add', newLine: newN });
    } else if (line.startsWith('-')) {
      oldN++;
      result.push({ text: line.slice(1), type: 'del', oldLine: oldN });
    } else {
      const content = line.startsWith(' ') ? line.slice(1) : line;
      oldN++;
      newN++;
      result.push({ text: content, type: 'context', oldLine: oldN, newLine: newN });
    }
  }
  return result;
}

export const DiffView: React.FC = () => {
  const {
    diffTab,
    setDiffTab,
    repoPath,
    stagedFiles,
    unstagedFiles,
    untrackedFiles,
    sel,
    getCommitFullSha,
    diffTargetSha,
    setDiffTargetSha,
    stageFile,
    unstageFile,
    toastRun,
    preferences
  } = useGitClient();

  const showGutterMarkers = preferences.gutterMarkers !== false;

  const [selectedPath, setSelectedPath] = useState<string>('');
  const [rawDiffText, setRawDiffText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const availableFiles = useMemo(() => {
    if (diffTab === 'index') return stagedFiles;
    if (diffTab === 'work') return [...unstagedFiles, ...untrackedFiles];
    return [...stagedFiles, ...unstagedFiles, ...untrackedFiles];
  }, [diffTab, stagedFiles, unstagedFiles, untrackedFiles]);

  useEffect(() => {
    if (availableFiles.length && !selectedPath) {
      setSelectedPath(availableFiles[0].path);
    }
  }, [availableFiles, selectedPath]);

  const targetPath = selectedPath || (availableFiles[0]?.path ?? '');

  useEffect(() => {
    if (!repoPath) return;
    let active = true;
    setLoading(true);

    void (async () => {
      try {
        let text = '';
        if (diffTab === 'work') {
          if (targetPath) {
            text = await tauriGitBackend.showFileDiff(repoPath, targetPath, false);
          }
        } else if (diffTab === 'index') {
          if (targetPath) {
            text = await tauriGitBackend.showFileDiff(repoPath, targetPath, true);
          }
        } else if (diffTab === 'parent' || diffTab === 'refs') {
          const sha = diffTargetSha || getCommitFullSha(sel[0] ?? 0);
          if (sha) {
            text = await tauriGitBackend.getCommitDiff(repoPath, sha, targetPath || undefined);
          }
        }
        if (active) {
          setRawDiffText(text || '');
          setLoading(false);
        }
      } catch {
        if (active) {
          setRawDiffText('');
          setLoading(false);
        }
      }
    })();

    return () => { active = false; };
  }, [repoPath, targetPath, diffTab, sel, getCommitFullSha, diffTargetSha]);

  const parsedLines = useMemo(() => parseDiffText(rawDiffText), [rawDiffText]);

  const tabs: [id: 'work' | 'index' | 'parent' | 'refs', label: string][] = [
    ['work', 'Working tree ↔ HEAD'],
    ['index', 'Index ↔ HEAD'],
    ['parent', 'Commit ↔ parent'],
    ['refs', 'Selected commit diff']
  ];

  const monoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11.8px',
    lineHeight: '18px'
  };

  const renderDiffPane = () => {
    if (loading) {
      return (
        <div style={{ flex: 1, padding: 'var(--space-4)', fontSize: '12px', color: 'var(--fg3)' }}>
          Loading diff…
        </div>
      );
    }

    if (!parsedLines.length) {
      return (
        <div style={{ flex: 1, padding: 'var(--space-4)', fontSize: '12px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
          {targetPath ? `No diff output for ${targetPath}` : 'No changed files found in current workspace.'}
        </div>
      );
    }

    const rows = parsedLines.map((line, i) => {
      const bg =
        line.type === 'add'
          ? 'var(--addbg)'
          : line.type === 'del'
            ? 'var(--delbg)'
            : line.type === 'hunk'
              ? 'var(--raised)'
              : 'transparent';
      const fg =
        line.type === 'add'
          ? 'var(--add)'
          : line.type === 'del'
            ? 'var(--del)'
            : line.type === 'hunk'
              ? 'var(--fg3)'
              : 'var(--fg)';

      return (
        <div key={i} style={{ display: 'flex', background: bg, ...monoStyle }}>
          {showGutterMarkers && (
            <>
              <span
                style={{
                  width: '46px',
                  flex: '0 0 auto',
                  textAlign: 'right',
                  paddingRight: '8px',
                  color: 'var(--fg3)',
                  userSelect: 'none'
                }}
              >
                {line.oldLine || ''}
              </span>
              <span
                style={{
                  width: '46px',
                  flex: '0 0 auto',
                  textAlign: 'right',
                  paddingRight: '10px',
                  color: 'var(--fg3)',
                  userSelect: 'none',
                  borderRight: '1px solid var(--line)'
                }}
              >
                {line.newLine || ''}
              </span>
            </>
          )}
          <span style={{ paddingLeft: '10px', whiteSpace: 'pre-wrap', color: fg, flex: 1 }}>
            {line.text}
          </span>
        </div>
      );
    });

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            flex: '0 0 auto',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 12px',
            background: 'var(--panel)',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            {targetPath || 'Repository diff'}
          </span>
          <div style={{ flex: 1 }} />
          {targetPath && diffTab === 'work' && (
            <Button
              variant="secondary"
              style={{ height: '22px', fontSize: '11.5px' }}
              onClick={() => void stageFile(targetPath)}
            >
              Stage file
            </Button>
          )}
          {targetPath && diffTab === 'index' && (
            <Button
              variant="secondary"
              style={{ height: '22px', fontSize: '11.5px' }}
              onClick={() => void unstageFile(targetPath)}
            >
              Unstage file
            </Button>
          )}
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11.5px' }}
            onClick={() => {
              void navigator.clipboard.writeText(rawDiffText);
              toastRun('Copied diff patch', targetPath || 'diff');
            }}
          >
            Copy patch
          </Button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            padding: '6px 0',
            background: 'var(--color-bg)'
          }}
        >
          {rows}
        </div>
      </div>
    );
  };

  const sidebarPanel = useResizablePanel({
    storageKey: 'ag_panel_diff_sidebar_width',
    defaultSize: 220,
    minSize: 140,
    maxSize: 500,
    direction: 'horizontal'
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Top tabs */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '38px',
          padding: '0 var(--space-3)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)',
          overflow: 'auto'
        }}
      >
        {tabs.map(t => {
          const active = diffTab === t[0];
          return (
            <Button
              key={t[0]}
              variant="secondary"
              aria-pressed={active}
              onClick={() => {
                setDiffTargetSha(null);
                setDiffTab(t[0]);
              }}
              style={{
                flex: '0 0 auto',
                height: '25px',
                fontSize: '11.5px',
                whiteSpace: 'nowrap',
                color: active ? 'var(--color-accent)' : 'var(--fg2)',
                boxShadow: active ? 'inset 0 0 0 1px var(--color-accent)' : 'none'
              }}
            >
              {t[1]}
            </Button>
          );
        })}
      </div>

      {/* Main split */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* File selector strip */}
        {availableFiles.length > 0 && (
          <div
            style={{
              width: `${sidebarPanel.size}px`,
              flex: '0 0 auto',
              borderRight: '1px solid var(--line)',
              background: 'var(--panel)',
              overflow: 'auto',
              padding: 'var(--space-2) 0'
            }}
          >
            <div style={{ padding: '0 var(--space-3) var(--space-2)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--fg3)' }}>
              Changed Files ({availableFiles.length})
            </div>
            {availableFiles.map(f => (
              <div
                key={f.path}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPath(f.path)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPath(f.path);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '24px',
                  padding: '0 var(--space-3)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  background: targetPath === f.path ? 'var(--sel)' : 'transparent'
                }}
                className="gc-hover-bg"
              >
                <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{f.status}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.path.split('/').pop()}
                </span>
              </div>
            ))}
          </div>
        )}

        {availableFiles.length > 0 && (
          <ResizeHandle
            direction="horizontal"
            isDragging={sidebarPanel.isDragging}
            onMouseDown={sidebarPanel.handleMouseDown}
            onDoubleClick={sidebarPanel.resetSize}
            title="Drag to resize file selector panel (Double-click to reset)"
          />
        )}

        {/* Diff content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {renderDiffPane()}
        </div>
      </div>
    </div>
  );
};
