import React, { useState, useEffect, useMemo } from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { tauriGitBackend } from '../../services/tauriGitBackend';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { Button } from '../common/Button';
import { ResizeHandle } from '../common/ResizeHandle';
import { DiffViewer } from '../common/DiffViewer';
import { DiffFile } from '../../types/git-client';
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
    fetchCommitFiles,
    stageFile,
    unstageFile,
    setView,
    setDock,
    toastRun,
    log
  } = useGitClient();

  const [selectedPath, setSelectedPath] = useState<string>('');
  const [rawDiffText, setRawDiffText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fileQuery, setFileQuery] = useState<string>('');

  const [commitFiles, setCommitFiles] = useState<DiffFile[]>([]);
  const [commitLoading, setCommitLoading] = useState<boolean>(false);

  const activeSha = diffTargetSha || (sel.length > 0 ? getCommitFullSha(sel[0]) : '');

  // Fetch commit files when viewing commit diffs
  useEffect(() => {
    if ((diffTab === 'parent' || diffTab === 'refs') && activeSha && repoPath) {
      let active = true;
      setCommitLoading(true);
      void (async () => {
        try {
          const files = await fetchCommitFiles(activeSha);
          if (active) {
            setCommitFiles(files);
            setCommitLoading(false);
          }
        } catch {
          if (active) {
            setCommitFiles([]);
            setCommitLoading(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }
  }, [diffTab, activeSha, repoPath, fetchCommitFiles]);

  const conflictedFiles = useMemo(
    () => [...stagedFiles, ...unstagedFiles].filter(f => f.status === 'U'),
    [stagedFiles, unstagedFiles]
  );

  const availableFiles = useMemo(() => {
    if (diffTab === 'index') return stagedFiles;
    if (diffTab === 'work') return [...unstagedFiles, ...untrackedFiles];
    if (diffTab === 'merge') return conflictedFiles;
    if (diffTab === 'parent' || diffTab === 'refs') return commitFiles;
    return [...stagedFiles, ...unstagedFiles, ...untrackedFiles];
  }, [diffTab, stagedFiles, unstagedFiles, untrackedFiles, conflictedFiles, commitFiles]);

  const filteredFiles = useMemo(() => {
    if (!fileQuery.trim()) return availableFiles;
    const q = fileQuery.toLowerCase();
    return availableFiles.filter(f => f.path.toLowerCase().includes(q));
  }, [availableFiles, fileQuery]);

  useEffect(() => {
    if (availableFiles.length > 0) {
      if (!selectedPath || !availableFiles.some(f => f.path === selectedPath)) {
        setSelectedPath(availableFiles[0].path);
      }
    } else {
      setSelectedPath('');
    }
  }, [availableFiles, selectedPath]);

  const targetPath = selectedPath || (availableFiles[0]?.path ?? '');

  useEffect(() => {
    if (!repoPath) {
      setRawDiffText('');
      setLoading(false);
      return;
    }
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
        } else if (diffTab === 'merge') {
          if (targetPath) {
            text = await tauriGitBackend.showFileDiff(repoPath, targetPath, false);
          }
        } else if (diffTab === 'parent' || diffTab === 'refs') {
          if (activeSha) {
            text = await tauriGitBackend.getCommitDiff(
              repoPath,
              activeSha,
              targetPath || undefined
            );
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

    return () => {
      active = false;
    };
  }, [repoPath, targetPath, diffTab, activeSha]);

  const handleCheckoutSide = async (side: 'ours' | 'theirs') => {
    if (!targetPath || !repoPath) return;
    try {
      log([{ text: `$ git checkout --${side} -- ${targetPath}`, type: 'cmd' }]);
      const res = await tauriGitBackend.checkoutBranch(repoPath, `--${side} -- ${targetPath}`);
      if (res.exitCode === 0) {
        toastRun(`Checked out ${side} version`, targetPath);
        await stageFile(targetPath);
      }
    } catch (e) {
      log([{ text: `Checkout ${side} failed: ${String(e)}`, type: 'err' }]);
    }
  };

  const tabs: [
    id: 'work' | 'index' | 'parent' | 'refs' | 'merge',
    label: string,
    badge?: number
  ][] = [
    ['work', 'Working tree ↔ HEAD'],
    ['index', 'Index ↔ HEAD'],
    ['parent', 'Commit ↔ parent'],
    ['refs', 'Selected commit diff'],
    ['merge', 'Merge conflicts', conflictedFiles.length > 0 ? conflictedFiles.length : undefined]
  ];

  const renderEmptyState = () => {
    let icon = 'ph-git-diff';
    let title = 'No diff to display';
    let description = 'Select a file or commit to inspect differences.';
    let primaryAction: { label: string; run: () => void } | null = null;
    let secondaryAction: { label: string; run: () => void } | null = null;

    if (diffTab === 'work') {
      icon = 'ph-check-circle';
      title = 'Working tree is clean';
      description = 'There are no uncommitted changes in your workspace.';
      primaryAction = { label: 'Go to Git Graph', run: () => setView('graph') };
      if (stagedFiles.length > 0) {
        secondaryAction = { label: 'View Staged Changes', run: () => setDiffTab('index') };
      }
    } else if (diffTab === 'index') {
      icon = 'ph-stack';
      title = 'No staged changes';
      description = 'No files have been staged for commit yet.';
      if (unstagedFiles.length > 0) {
        primaryAction = { label: 'View Working Tree Changes', run: () => setDiffTab('work') };
      } else {
        primaryAction = { label: 'Go to Git Graph', run: () => setView('graph') };
      }
      secondaryAction = { label: 'Open Source Control Dock', run: () => setDock(true) };
    } else if (diffTab === 'merge') {
      icon = 'ph-git-merge';
      title = 'No merge conflicts';
      description = 'The workspace has no conflicted files to resolve.';
      primaryAction = { label: 'Go to Working Tree Diff', run: () => setDiffTab('work') };
    } else if (diffTab === 'parent' || diffTab === 'refs') {
      icon = 'ph-git-commit';
      title = activeSha ? `Commit ${activeSha.slice(0, 7)}` : 'No commit selected';
      description = activeSha
        ? commitLoading
          ? 'Loading commit files…'
          : 'This commit has no file changes or patch output.'
        : 'Select a commit in Git Graph or Commit Details to view its changes.';
      primaryAction = { label: 'Select Commit in Git Graph', run: () => setView('graph') };
    }

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          textAlign: 'center',
          background: 'var(--color-bg)'
        }}
      >
        <i
          className={`ph ${icon}`}
          style={{ fontSize: '42px', color: 'var(--fg3)', marginBottom: '12px' }}
        />
        <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: 'var(--fg)' }}>
          {title}
        </h3>
        <p
          style={{
            margin: '0 0 16px',
            fontSize: '12.5px',
            color: 'var(--fg3)',
            maxWidth: '420px',
            lineHeight: '1.5'
          }}
        >
          {description}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {primaryAction && (
            <Button
              variant="primary"
              style={{ height: '28px', fontSize: '12px' }}
              onClick={primaryAction.run}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              style={{ height: '28px', fontSize: '12px' }}
              onClick={secondaryAction.run}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderDiffPane = () => {
    if (!targetPath && availableFiles.length === 0) {
      return renderEmptyState();
    }

    const currentFileStatus = availableFiles.find(f => f.path === targetPath)?.status;
    const isConflict = diffTab === 'merge' || currentFileStatus === 'U';

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {isConflict && targetPath && (
          <div
            style={{
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              background: 'var(--delbg)',
              borderBottom: '1px solid var(--line)',
              fontSize: '12px'
            }}
          >
            <span style={{ color: 'var(--del)', fontWeight: 600 }}>Merge Conflict:</span>
            <span style={{ flex: 1, color: 'var(--fg2)', fontFamily: 'var(--font-mono)' }}>
              {targetPath}
            </span>
            <Button
              variant="secondary"
              style={{ height: '22px', fontSize: '11px' }}
              onClick={() => handleCheckoutSide('ours')}
            >
              Keep Ours (HEAD)
            </Button>
            <Button
              variant="secondary"
              style={{ height: '22px', fontSize: '11px' }}
              onClick={() => handleCheckoutSide('theirs')}
            >
              Keep Theirs (Incoming)
            </Button>
            <Button
              variant="primary"
              style={{ height: '22px', fontSize: '11px' }}
              onClick={() => void stageFile(targetPath)}
            >
              Mark Resolved
            </Button>
          </div>
        )}

        <DiffViewer
          filePath={targetPath}
          rawDiffText={rawDiffText}
          loading={loading || commitLoading}
          emptyMessage={targetPath ? `No diff output found for ${targetPath}` : 'No file selected.'}
          onStageFile={() => void stageFile(targetPath)}
          onUnstageFile={() => void unstageFile(targetPath)}
          onCopyPatch={() => {
            void navigator.clipboard.writeText(rawDiffText);
            toastRun('Copied diff patch', targetPath || 'diff');
          }}
          isStaged={targetPath ? diffTab === 'index' : false}
          isUnstaged={targetPath ? diffTab === 'work' : false}
        />
      </div>
    );
  };

  const sidebarPanel = useResizablePanel({
    storageKey: 'ag_panel_diff_sidebar_width',
    defaultSize: 240,
    minSize: 160,
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
                if (t[0] !== 'parent' && t[0] !== 'refs') {
                  setDiffTargetSha(null);
                }
                setDiffTab(t[0]);
              }}
              style={{
                flex: '0 0 auto',
                height: '25px',
                fontSize: '11.5px',
                whiteSpace: 'nowrap',
                color: active ? 'var(--color-accent)' : 'var(--fg2)',
                boxShadow: active ? 'inset 0 0 0 1px var(--color-accent)' : 'none',
                position: 'relative'
              }}
            >
              {t[1]}
              {t[2] !== undefined && t[2] > 0 && (
                <span
                  style={{
                    marginLeft: '5px',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    background: 'var(--del)',
                    color: '#fff'
                  }}
                >
                  {t[2]}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Main split */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* File selector strip */}
        <div
          style={{
            width: `${sidebarPanel.size}px`,
            flex: '0 0 auto',
            borderRight: '1px solid var(--line)',
            background: 'var(--panel)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              fontSize: '10.5px',
              textTransform: 'uppercase',
              color: 'var(--fg3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--line)'
            }}
          >
            <span>
              {diffTab === 'parent' || diffTab === 'refs' ? 'Commit Files' : 'Changed Files'} (
              {availableFiles.length})
            </span>
          </div>

          {availableFiles.length > 5 && (
            <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--line)' }}>
              <input
                type="text"
                value={fileQuery}
                onChange={e => setFileQuery(e.target.value)}
                placeholder="Filter files…"
                style={{
                  width: '100%',
                  height: '22px',
                  fontSize: '11px',
                  padding: '0 6px',
                  borderRadius: '3px',
                  border: '1px solid var(--line)',
                  background: 'var(--color-bg)',
                  color: 'var(--fg)'
                }}
              />
            </div>
          )}

          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-1) 0' }}>
            {filteredFiles.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-3)',
                  fontSize: '11.5px',
                  color: 'var(--fg3)',
                  fontStyle: 'italic'
                }}
              >
                {availableFiles.length === 0 ? 'No files' : 'No matching files'}
              </div>
            ) : (
              filteredFiles.map(f => (
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
                  <span
                    style={{
                      fontWeight: 600,
                      color: f.status === 'U' ? 'var(--del)' : 'var(--color-accent)',
                      fontSize: '11px'
                    }}
                  >
                    {f.status}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {f.path.split('/').pop()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <ResizeHandle
          direction="horizontal"
          isDragging={sidebarPanel.isDragging}
          onMouseDown={sidebarPanel.handleMouseDown}
          onDoubleClick={sidebarPanel.resetSize}
          title="Drag to resize file selector panel (Double-click to reset)"
        />

        {/* Diff content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {renderDiffPane()}
        </div>
      </div>
    </div>
  );
};
