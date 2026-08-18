import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGitGraphInteractions, statusColor } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { DiffFile } from '../../types/git-client';
import { tauriGitBackend } from '../../services/tauriGitBackend';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { ResizeHandle } from '../common/ResizeHandle';
import { DiffViewer } from '../common/DiffViewer';
import { FileTree } from '../common/FileTree';
import { useDiffContent, DiffContentSource } from '../../hooks/useDiffContent';
import { useAppSelector } from '../../store/hooks';
import { selectGraphRows } from '../../store/selectors';

export { parseDiffText } from '../common/DiffViewer';
export type { DiffLine } from '../common/DiffViewer';

export const CommitDetailsView: React.FC = () => {
  const {
    sel,
    fetchCommitFiles,
    cherryPickCommit,
    revertCommit,
    confirm,
    createPatch,
    setView,
    openMenu,
    repoPath,
    toastRun,
    setDiffTargetSha,
    setDiffTab,
    setCompareSeedRef
  } = useGitGraphInteractions();
  const graphRows = useAppSelector(selectGraphRows);
  const getCommitHash = useCallback(
    (index: number) => graphRows[index]?.shortSha || '',
    [graphRows]
  );
  const getCommitFullSha = useCallback((index: number) => graphRows[index]?.sha || '', [graphRows]);

  const detailIdx = sel[0] !== undefined ? sel[0] : 0;
  const isMulti = sel.length > 1;

  const [realFiles, setRealFiles] = useState<DiffFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [rawDiffText, setRawDiffText] = useState<string>('');
  const [loadingDiff, setLoadingDiff] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const sha = getCommitFullSha(detailIdx);
    if (!sha) {
      setRealFiles([]);
      return;
    }
    setDetailError(null);
    void fetchCommitFiles(sha)
      .then(files => {
        if (active) {
          setRealFiles(files);
          if (files.length > 0) {
            setSelectedFile(files[0].path);
          }
        }
      })
      .catch(error => {
        if (active) {
          setRealFiles([]);
          setDetailError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      active = false;
    };
  }, [detailIdx, getCommitFullSha, fetchCommitFiles]);

  const dfiles: DiffFile[] = realFiles;

  const currentFilePath = selectedFile || (dfiles[0]?.path ?? '');

  useEffect(() => {
    let active = true;
    const sha = getCommitFullSha(detailIdx);
    if (!sha || !currentFilePath) {
      setRawDiffText('');
      return;
    }
    setLoadingDiff(true);
    void tauriGitBackend
      .getCommitDiff(repoPath, sha, currentFilePath)
      .then(diffText => {
        if (active) {
          setRawDiffText(diffText || '');
          setLoadingDiff(false);
        }
      })
      .catch(() => {
        if (active) {
          setRawDiffText('');
          setLoadingDiff(false);
        }
      });
    return () => {
      active = false;
    };
  }, [detailIdx, currentFilePath, getCommitFullSha, repoPath]);

  const diffContentSource: DiffContentSource | null = useMemo(() => {
    const sha = getCommitFullSha(detailIdx);
    if (!sha || !currentFilePath) return null;
    return { kind: 'commit', path: currentFilePath, sha };
  }, [detailIdx, currentFilePath, getCommitFullSha]);

  const {
    originalText,
    modifiedText,
    contentUnavailable,
    loading: contentLoading
  } = useDiffContent(repoPath, diffContentSource);

  const detailKicker = isMulti ? `Merged range — ${sel.length} commits, net changes` : 'Commit';
  const detailSubject = isMulti
    ? `${graphRows[sel[sel.length - 1]]?.subject || ''}  …  ${graphRows[sel[0]]?.subject || ''}`
    : graphRows[detailIdx]?.subject || 'No commit selected';
  const detailAuthor = isMulti
    ? `${new Set(sel.map(i => graphRows[i]?.author)).size} authors`
    : graphRows[detailIdx]?.author || '';
  const detailDate =
    graphRows[detailIdx]?.date.replace('T', ' ').replace('Z', '').slice(0, 16) || '';
  const detailHash = isMulti
    ? `${getCommitHash(sel[sel.length - 1])}..${getCommitHash(sel[0])}`
    : getCommitHash(detailIdx);

  const handleFileMenu = (e: React.MouseEvent, path: string) => {
    const fullSha = getCommitFullSha(detailIdx);
    openMenu(e, path, [
      {
        label: 'Open diff',
        run: () => {
          setDiffTargetSha(fullSha);
          setDiffTab('refs');
          setView('diff');
        }
      },
      {
        label: 'Compare with Revision…',
        run: () => {
          setCompareSeedRef(fullSha);
          setView('compare');
        }
      },
      {
        label: 'Create patch for file…',
        run: () => {
          void createPatch(fullSha, path).then(p => {
            if (p) void navigator.clipboard.writeText(p);
          });
        }
      },
      {
        label: 'Copy path to clipboard',
        run: () => {
          void navigator.clipboard.writeText(path);
          toastRun('Copied path', path);
        }
      }
    ]);
  };

  const renderDiffPane = () => {
    return (
      <DiffViewer
        filePath={currentFilePath}
        rawDiffText={rawDiffText}
        loading={loadingDiff || contentLoading}
        emptyMessage={
          detailError
            ? `Could not load commit details: ${detailError}`
            : currentFilePath
              ? `No diff details for ${currentFilePath}`
              : 'Select a file to view diff details.'
        }
        onCopyPatch={() => {
          void createPatch(getCommitFullSha(detailIdx), currentFilePath).then(p => {
            if (p) void navigator.clipboard.writeText(p);
          });
        }}
        originalText={originalText}
        modifiedText={modifiedText}
        contentUnavailable={contentUnavailable}
        editable={false}
      />
    );
  };

  const leftPanel = useResizablePanel({
    storageKey: 'ag_panel_commit_details_width',
    defaultSize: 380,
    minSize: 220,
    maxSize: 700,
    direction: 'horizontal'
  });

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* Left panel */}
      <div
        style={{
          width: `${leftPanel.size}px`,
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--line)',
          background: 'var(--panel)',
          minHeight: 0
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <h6 style={{ margin: '0 0 6px', color: 'var(--color-accent)' }}>{detailKicker}</h6>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
              textWrap: 'pretty'
            }}
          >
            {detailSubject}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              fontSize: '11.5px',
              color: 'var(--fg2)'
            }}
          >
            <span>{detailAuthor}</span>
            <span style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
              {detailDate}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--iris)' }}>
              {detailHash}
            </span>
          </div>
        </div>

        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            gap: '6px',
            padding: 'var(--space-2) var(--space-3)',
            borderBottom: '1px solid var(--line)',
            flexWrap: 'wrap'
          }}
        >
          <Button
            variant="secondary"
            style={{ height: '23px', fontSize: '11.5px' }}
            onClick={() => {
              setDiffTargetSha(getCommitFullSha(detailIdx));
              setDiffTab('refs');
              setView('diff');
            }}
          >
            {`Open diffs (${dfiles.length})`}
          </Button>
          <Button
            variant="secondary"
            style={{ height: '23px', fontSize: '11.5px' }}
            onClick={() => {
              const fullSha = getCommitFullSha(detailIdx);
              const shortSha = getCommitHash(detailIdx);
              const commit = graphRows[detailIdx];
              const subject = commit?.subject ? ` ("${commit.subject}")` : '';
              confirm(
                'Revert Commit?',
                `Revert commit ${shortSha}${subject}? A new commit will be created to invert the changes.`,
                `git revert --no-edit ${fullSha}`,
                'Revert',
                () => void revertCommit(fullSha)
              );
            }}
            disabled={isMulti}
            title={isMulti ? 'Select a single commit to revert' : 'Revert this commit'}
          >
            Revert{isMulti ? '' : ' selected'}
          </Button>
          <Button
            variant="secondary"
            style={{ height: '23px', fontSize: '11.5px' }}
            onClick={() => void cherryPickCommit(getCommitFullSha(detailIdx))}
            disabled={isMulti}
            title={isMulti ? 'Select a single commit to cherry-pick' : 'Cherry-pick this commit'}
          >
            Cherry-pick{isMulti ? '' : ' selected'}
          </Button>
          <Button
            variant="secondary"
            style={{ height: '23px', fontSize: '11.5px' }}
            onClick={() => {
              void createPatch(getCommitFullSha(detailIdx)).then(p => {
                if (p) void navigator.clipboard.writeText(p);
              });
            }}
            disabled={isMulti}
            title={
              isMulti
                ? 'Select a single commit to create a patch'
                : 'Create a patch for this commit'
            }
          >
            Create patch…
          </Button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-2) 0', minHeight: 0 }}>
          <FileTree
            files={dfiles}
            renderFile={(file, depth) => {
              const isSelected = selectedFile === file.path;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedFile(file.path)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedFile(file.path);
                    }
                  }}
                  onContextMenu={event => handleFileMenu(event, file.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    height: '23px',
                    paddingLeft: `${12 + depth * 14}px`,
                    paddingRight: 'var(--space-4)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    background: isSelected ? 'var(--sel)' : 'transparent'
                  }}
                >
                  <span
                    style={{
                      width: '11px',
                      textAlign: 'center',
                      color: statusColor(file.status),
                      fontWeight: 600
                    }}
                  >
                    {file.status}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--fg)'
                    }}
                  >
                    {file.path.split('/').pop()}
                  </span>
                  <span style={{ color: 'var(--add)', fontSize: '11px' }}>+{file.add}</span>
                  <span style={{ color: 'var(--del)', fontSize: '11px' }}>−{file.del}</span>
                </div>
              );
            }}
          />
        </div>
      </div>

      <ResizeHandle
        direction="horizontal"
        isDragging={leftPanel.isDragging}
        onMouseDown={leftPanel.handleMouseDown}
        onDoubleClick={leftPanel.resetSize}
        title="Drag to resize file list panel (Double-click to reset)"
      />

      {/* Right diff pane */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {renderDiffPane()}
      </div>
    </div>
  );
};
