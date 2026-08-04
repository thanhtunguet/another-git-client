import React, { useState, useEffect, useMemo } from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { tauriGitBackend } from '../../services/tauriGitBackend';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { Button } from '../common/Button';
import { ResizeHandle } from '../common/ResizeHandle';
import { DiffViewer } from '../common/DiffViewer';
export { parseDiffText } from '../common/DiffViewer';
export type { DiffLine } from '../common/DiffViewer';

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
    toastRun
  } = useGitClient();

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

  const tabs: [id: 'work' | 'index' | 'parent' | 'refs', label: string][] = [
    ['work', 'Working tree ↔ HEAD'],
    ['index', 'Index ↔ HEAD'],
    ['parent', 'Commit ↔ parent'],
    ['refs', 'Selected commit diff']
  ];

  const renderDiffPane = () => {
    return (
      <DiffViewer
        filePath={targetPath}
        rawDiffText={rawDiffText}
        loading={loading}
        emptyMessage={
          targetPath
            ? `No diff output for ${targetPath}`
            : 'No changed files found in current workspace.'
        }
        onStageFile={() => void stageFile(targetPath)}
        onUnstageFile={() => void unstageFile(targetPath)}
        onCopyPatch={() => {
          void navigator.clipboard.writeText(rawDiffText);
          toastRun('Copied diff patch', targetPath || 'diff');
        }}
        isStaged={targetPath ? diffTab === 'index' : false}
        isUnstaged={targetPath ? diffTab === 'work' : false}
      />
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
