import React, { useState, useEffect, useMemo } from 'react';
import { useGitClient, statusColor } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { DiffFile } from '../../types/git-client';
import { tauriGitBackend } from '../../services/tauriGitBackend';

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

export const CommitDetailsView: React.FC = () => {
  const {
    sel,
    commits,
    getCommitHash,
    getCommitFullSha,
    getFileList,
    fetchCommitFiles,
    cherryPickCommit,
    revertCommit,
    createPatch,
        setView,
    openMenu,
            repoPath,
    toastRun,
    setDiffTargetSha,
    setDiffTab,
    setCompareSeedRef,
    preferences
  } = useGitClient();

  const showGutterMarkers = preferences.gutterMarkers !== false;

  const detailIdx = sel[0] !== undefined ? sel[0] : 0;
  const isMulti = sel.length > 1;

  const [realFiles, setRealFiles] = useState<DiffFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [rawDiffText, setRawDiffText] = useState<string>('');
  const [loadingDiff, setLoadingDiff] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const sha = getCommitFullSha(detailIdx);
    if (!sha) {
      setRealFiles([]);
      return;
    }
    void fetchCommitFiles(sha).then(files => {
      if (active) {
        setRealFiles(files);
        if (files.length > 0) {
          setSelectedFile(files[0].path);
        }
      }
    });
    return () => { active = false; };
  }, [detailIdx, getCommitFullSha, fetchCommitFiles]);

  const dfiles: DiffFile[] = useMemo(() => {
    return realFiles.length
      ? realFiles
      : isMulti
      ? sel.slice(0, 4).flatMap(i => getFileList(i))
      : getFileList(detailIdx);
  }, [realFiles, isMulti, sel, detailIdx, getFileList]);

  const currentFilePath = selectedFile || (dfiles[0]?.path ?? '');

  useEffect(() => {
    let active = true;
    const sha = getCommitFullSha(detailIdx);
    if (!sha || !currentFilePath) {
      setRawDiffText('');
      return;
    }
    setLoadingDiff(true);
    void tauriGitBackend.getCommitDiff(repoPath, sha, currentFilePath).then(diffText => {
      if (active) {
        setRawDiffText(diffText || '');
        setLoadingDiff(false);
      }
    }).catch(() => {
      if (active) {
        setRawDiffText('');
        setLoadingDiff(false);
      }
    });
    return () => { active = false; };
  }, [detailIdx, currentFilePath, getCommitFullSha, repoPath]);

  const parsedDiffLines = useMemo(() => parseDiffText(rawDiffText), [rawDiffText]);

  const dirs: Record<string, DiffFile[]> = {};
  dfiles.forEach(f => {
    const d = f.path.split('/').slice(0, -1).join('/') || '.';
    if (!dirs[d]) dirs[d] = [];
    dirs[d].push(f);
  });

  const detailKicker = isMulti ? `Merged range — ${sel.length} commits, net changes` : 'Commit';
  const detailSubject = isMulti
    ? `${commits[sel[sel.length - 1]][0]}  …  ${commits[sel[0]][0]}`
    : commits[detailIdx]?.[0] || 'No commit selected';
  const detailAuthor = isMulti
    ? `${new Set(sel.map(i => commits[i][1])).size} authors`
    : commits[detailIdx]?.[1] || '';
  const detailDate = commits[detailIdx]?.[2] || '';
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

  const monoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11.8px',
    lineHeight: '18px'
  };

  const renderDiffPane = () => {
    if (loadingDiff) {
      return (
        <div style={{ flex: 1, padding: 'var(--space-4)', fontSize: '12px', color: 'var(--fg3)' }}>
          Loading file diff…
        </div>
      );
    }

    if (!parsedDiffLines.length) {
      return (
        <div style={{ flex: 1, padding: 'var(--space-4)', fontSize: '12px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
          {currentFilePath ? `No diff details for ${currentFilePath}` : 'Select a file to view diff details.'}
        </div>
      );
    }

    const rows = parsedDiffLines.map((line, i) => {
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
            {currentFilePath}
          </span>
          <div style={{ flex: 1 }} />
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11.5px' }}
            onClick={() => {
              void createPatch(getCommitFullSha(detailIdx), currentFilePath).then(p => {
                if (p) void navigator.clipboard.writeText(p);
              });
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

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* Left panel */}
      <div
        style={{
          flex: '0 0 380px',
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
            onClick={() => void revertCommit(getCommitFullSha(detailIdx))}
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
            title={isMulti ? 'Select a single commit to create a patch' : 'Create a patch for this commit'}
          >
            Create patch…
          </Button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-2) 0', minHeight: 0 }}>
          {Object.keys(dirs).map(d => (
            <React.Fragment key={d}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  height: '23px',
                  paddingLeft: '10px',
                  paddingRight: 'var(--space-4)',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--fg2)'
                }}
              >
                <i
                  className="ph ph-caret-down"
                  style={{ fontSize: '11px', color: 'var(--fg3)', width: '10px' }}
                />
                <span>{d}/</span>
              </div>
              {dirs[d].map((f, k) => {
                const isSelected = selectedFile === f.path;
                return (
                  <div
                    key={k}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedFile(f.path)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedFile(f.path);
                      }
                    }}
                    onContextMenu={e => handleFileMenu(e, f.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      height: '23px',
                      paddingLeft: '28px',
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
                        color: statusColor(f.status),
                        fontWeight: 600
                      }}
                    >
                      {f.status}
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
                      {f.path.split('/').pop()}
                    </span>
                    <span style={{ color: 'var(--add)', fontSize: '11px' }}>+{f.add}</span>
                    <span style={{ color: 'var(--del)', fontSize: '11px' }}>−{f.del}</span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right diff pane */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {renderDiffPane()}
      </div>
    </div>
  );
};
