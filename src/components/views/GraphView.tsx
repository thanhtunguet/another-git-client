import { tauriGitBackend } from '../../services/tauriGitBackend';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useGitGraphInteractions,
  refBadge,
  statusColor,
  COLORS,
  buildGraphData
} from '../../context/GitClientContext';
import { Input } from '../common/FormControls';
import { Button } from '../common/Button';
import { Tag } from '../common/Tag';
import { SegmentedControl } from '../common/SegmentedControl';
import { FileTree } from '../common/FileTree';
import { ResetDialog } from '../common/ResetDialog';
import { DiffViewer } from '../common/DiffViewer';
import { isEditableTarget } from '../../hooks/useKeybindings';
import { useDiffContent, DiffContentSource } from '../../hooks/useDiffContent';
import { CommitRaw, DiffFile, GraphRowData } from '../../types/git-client';
import { useAppSelector } from '../../store/hooks';
import {
  selectGraphHasMore,
  selectGraphLoading,
  selectGraphLoadingMore,
  selectGraphRows
} from '../../store/selectors';

interface GraphFilterOption {
  value: string;
  label: string;
  detail?: string;
}

const GRAPH_ROW_HEIGHT = 30;
const GRAPH_ROW_OVERSCAN = 16;

interface GraphFilterMultiSelectProps {
  label: string;
  options: GraphFilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  mono?: boolean;
}

const GraphFilterMultiSelect = React.memo<GraphFilterMultiSelectProps>(
  ({ label, options, selected, onChange, placeholder, mono = false }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputId = React.useId();
    const listId = React.useId();

    useEffect(() => {
      const closeWhenOutside = (event: MouseEvent) => {
        if (!containerRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', closeWhenOutside);
      return () => document.removeEventListener('mousedown', closeWhenOutside);
    }, []);

    const selectedOptions = useMemo(
      () =>
        selected
          .map(value => options.find(option => option.value === value))
          .filter(Boolean) as GraphFilterOption[],
      [options, selected]
    );
    const filteredOptions = useMemo(() => {
      const normalizedQuery = query.trim().toLowerCase();
      return options.filter(option => {
        return (
          !normalizedQuery ||
          `${option.label} ${option.detail || ''}`.toLowerCase().includes(normalizedQuery)
        );
      });
    }, [options, query]);
    const toggleOption = (value: string) => {
      onChange(
        selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]
      );
    };

    return (
      <div ref={containerRef} className="field" style={{ position: 'relative', minWidth: 0 }}>
        <label htmlFor={inputId}>{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            id={inputId}
            className="input"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={event => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={event => {
              if (event.key === 'Escape') setOpen(false);
            }}
            placeholder={
              selected.length ? `${selected.length} selected — search to add` : placeholder
            }
            aria-label={label}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            style={{
              height: '26px',
              minHeight: 0,
              fontSize: '12px',
              fontFamily: mono ? 'var(--font-mono)' : undefined,
              paddingRight: '24px'
            }}
          />
          <i
            className="ph ph-caret-down"
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              pointerEvents: 'none',
              color: 'var(--fg3)'
            }}
          />
        </div>
        {selectedOptions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
            {selectedOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                title={`Remove ${option.label}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  maxWidth: '100%',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--sel)',
                  color: 'var(--fg)',
                  padding: '1px 5px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontFamily: mono ? 'var(--font-mono)' : undefined
                }}
              >
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {option.label}
                </span>
                <i className="ph ph-x" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        {open && (
          <div
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            style={{
              position: 'absolute',
              zIndex: 12,
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '200px',
              overflowY: 'auto',
              marginTop: '4px',
              padding: '4px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--panel)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.22)'
            }}
          >
            {filteredOptions.length ? (
              filteredOptions.map(option => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleOption(option.value)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 0,
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--sel)' : 'transparent',
                      color: 'var(--fg)',
                      padding: '5px 6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: mono ? 'var(--font-mono)' : undefined
                    }}
                  >
                    <i
                      className={isSelected ? 'ph ph-check-square' : 'ph ph-square'}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {option.label}
                    </span>
                    {option.detail && (
                      <span style={{ marginLeft: 'auto', color: 'var(--fg3)', fontSize: '10px' }}>
                        {option.detail}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <span
                style={{ display: 'block', padding: '6px', color: 'var(--fg3)', fontSize: '12px' }}
              >
                No matches
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

GraphFilterMultiSelect.displayName = 'GraphFilterMultiSelect';

function laneX(l: number): number {
  return 12 + l * 15;
}

function renderRowSvg(row: GraphRowData, isMerge: boolean, width: number): React.ReactNode {
  const ch: React.ReactNode[] = [];
  row.edges.forEach((e, i) => {
    const x1 = laneX(e.from);
    const x2 = laneX(e.to);
    const d =
      x1 === x2
        ? `M${x1} ${e.y0}L${x1} ${e.y1}`
        : `M${x1} ${e.y0}C${x1} ${(e.y0 + e.y1) / 2},${x2} ${(e.y0 + e.y1) / 2},${x2} ${e.y1}`;

    ch.push(
      <path key={i} d={d} stroke={e.color} strokeWidth={1.7} fill="none" strokeLinecap="round" />
    );
  });

  const c = COLORS[row.lane % 7];
  ch.push(
    <circle
      key="dot"
      cx={laneX(row.lane)}
      cy={15}
      r={isMerge ? 4.4 : 4}
      fill={isMerge ? 'var(--color-bg)' : c}
      stroke={c}
      strokeWidth={1.9}
    />
  );

  return (
    <svg width={width} height={30} style={{ display: 'block', flex: '0 0 auto' }}>
      {ch}
    </svg>
  );
}

function renderGutterSvg(row: GraphRowData, width: number): React.ReactNode {
  const ch: React.ReactNode[] = [];
  row.after.forEach((id, l) => {
    if (id != null) {
      ch.push(
        <line
          key={l}
          x1={laneX(l)}
          x2={laneX(l)}
          y1={0}
          y2="100%"
          stroke={COLORS[l % 7]}
          strokeWidth={1.7}
        />
      );
    }
  });

  return (
    <svg width={width} height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
      {ch}
    </svg>
  );
}

export const GraphView: React.FC = () => {
  const {
    repoPath,
    filterOpen,
    setFilterOpen,
    graphLayout,
    setGraphLayout,
    f,
    setF,
    checkoutBranch,
    createTag,
    cherryPickCommit,
    revertCommit,
    resetToRef,
    createPatch,
    confirm,
    currentBranch,
    toastRun,
    loadMoreGraph,
    repositoryError,
    refreshRepository,
    sel,
    toggleSelCommit,
    setDock,
    setDiffTargetSha,
    setCompareSeedRef,
    expanded,
    toggleExpandCommit,
    fetchCommitFiles,
    openMenu,
    prompt,
    setView,
    setDiffTab,
    preferences
  } = useGitGraphInteractions();
  const graphRows = useAppSelector(selectGraphRows);
  const graphHasMore = useAppSelector(selectGraphHasMore);
  const graphLoading = useAppSelector(selectGraphLoading);
  const graphLoadingMore = useAppSelector(selectGraphLoadingMore);
  const commits = useMemo<CommitRaw[]>(() => {
    const indexBySha = new Map(graphRows.map((row, index) => [row.sha, index]));
    return graphRows.map(row => {
      const parentIndexes = row.parents
        .map(parent => indexBySha.get(parent))
        .filter((index): index is number => index !== undefined);
      return [
        row.subject,
        row.author,
        row.date.replace('T', ' ').replace('Z', '').slice(0, 16),
        parentIndexes,
        row.refs
      ];
    });
  }, [graphRows]);
  const graphData = useMemo(() => buildGraphData(commits), [commits]);
  const getCommitHash = useCallback(
    (index: number) => graphRows[index]?.shortSha || '',
    [graphRows]
  );
  const getCommitFullSha = useCallback((index: number) => graphRows[index]?.sha || '', [graphRows]);
  const matchesFilter = useCallback(
    (index: number) => {
      const commit = commits[index];
      if (!commit) return false;
      if (f.authors.length && !f.authors.some(author => commit[1] === author)) return false;
      if (f.msg && !commit[0].toLowerCase().includes(f.msg.toLowerCase())) return false;
      if (f.from && commit[2] < `${f.from} 00:00`) return false;
      if (f.to && commit[2] > `${f.to} 23:59`) return false;
      if (
        f.refs.length &&
        !f.refs.some(ref => (commit[4] || []).some(item => item.includes(ref)))
      ) {
        return false;
      }
      return true;
    },
    [commits, f]
  );

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const graphScrollRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const pendingScrollMetricsRef = useRef<{ scrollTop: number; viewportHeight: number } | null>(
    null
  );
  const expandedDetailRef = useRef<HTMLDivElement>(null);
  const [expandedDetailHeight, setExpandedDetailHeight] = useState(0);
  const [resetReference, setResetReference] = useState<string | null>(null);
  const [inlineDiff, setInlineDiff] = useState<{ sha: string; path: string } | null>(null);
  const [inlineDiffText, setInlineDiffText] = useState('');
  const [inlineDiffLoading, setInlineDiffLoading] = useState(false);
  const [commitFilesBySha, setCommitFilesBySha] = useState<Record<string, DiffFile[]>>({});
  const [commitFilesLoading, setCommitFilesLoading] = useState<Record<string, boolean>>({});
  const [graphRefOptions, setGraphRefOptions] = useState<GraphFilterOption[]>([]);

  const updateReferenceFilter = useCallback(
    (refs: string[]) => {
      setF(current => ({ ...current, refs }));
    },
    [setF]
  );

  const updateAuthorFilter = useCallback(
    (authors: string[]) => {
      setF(current => ({ ...current, authors }));
    },
    [setF]
  );

  useEffect(() => {
    if (!repoPath) {
      setGraphRefOptions([]);
      return;
    }

    let active = true;
    void Promise.all([tauriGitBackend.getBranches(repoPath), tauriGitBackend.getTags(repoPath)])
      .then(([branches, tags]) => {
        if (!active) return;
        setGraphRefOptions([
          ...branches.map(branch => ({
            value: branch.fullRef,
            label: branch.name,
            detail: branch.kind === 'remote' ? 'remote branch' : 'branch'
          })),
          ...tags.map(tag => ({ value: tag.fullRef, label: tag.name, detail: 'tag' }))
        ]);
      })
      .catch(() => {
        if (active) setGraphRefOptions([]);
      });

    return () => {
      active = false;
    };
  }, [repoPath]);

  const graphAuthorOptions = useMemo<GraphFilterOption[]>(() => {
    return Array.from(new Set(commits.map(commit => commit[1]).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right))
      .map(author => ({ value: author, label: author }));
  }, [commits]);

  const expandedIndex = useMemo(() => {
    const index = Object.keys(expanded).find(key => expanded[Number(key)]);
    return index === undefined ? null : Number(index);
  }, [expanded]);
  const virtualizeEnabled = preferences.virtualizeCommitList !== false;
  const enableVirtualRows = graphLayout === 'rows' && virtualizeEnabled;

  const getOffsetForIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, commits.length));
      const detailHeight =
        expandedIndex !== null && clampedIndex > expandedIndex ? expandedDetailHeight : 0;
      return clampedIndex * GRAPH_ROW_HEIGHT + detailHeight;
    },
    [commits.length, expandedDetailHeight, expandedIndex]
  );

  const getIndexAtOffset = useCallback(
    (offset: number) => {
      if (!commits.length) return 0;
      if (expandedIndex === null) {
        return Math.max(0, Math.min(commits.length - 1, Math.floor(offset / GRAPH_ROW_HEIGHT)));
      }

      const expandedRowTop = expandedIndex * GRAPH_ROW_HEIGHT;
      const expandedRowEnd = expandedRowTop + GRAPH_ROW_HEIGHT + expandedDetailHeight;
      if (offset < expandedRowTop) {
        return Math.max(0, Math.floor(offset / GRAPH_ROW_HEIGHT));
      }
      if (offset < expandedRowEnd) return expandedIndex;
      return Math.min(
        commits.length - 1,
        Math.max(0, Math.floor((offset - expandedDetailHeight) / GRAPH_ROW_HEIGHT))
      );
    },
    [commits.length, expandedDetailHeight, expandedIndex]
  );

  const startIndex = enableVirtualRows
    ? Math.max(0, getIndexAtOffset(scrollTop) - GRAPH_ROW_OVERSCAN)
    : 0;
  const endIndex = enableVirtualRows
    ? Math.min(
        commits.length,
        getIndexAtOffset(scrollTop + Math.max(viewportHeight, GRAPH_ROW_HEIGHT)) +
          GRAPH_ROW_OVERSCAN +
          1
      )
    : commits.length;
  const visibleIndexes = useMemo(() => {
    const count = Math.max(0, endIndex - startIndex);
    return Array.from({ length: count }, (_, index) => startIndex + index);
  }, [endIndex, startIndex]);

  const topSpacerHeight = enableVirtualRows ? getOffsetForIndex(startIndex) : 0;
  const bottomSpacerHeight = enableVirtualRows
    ? Math.max(0, getOffsetForIndex(commits.length) - getOffsetForIndex(endIndex))
    : 0;

  const handleGraphScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      pendingScrollMetricsRef.current = {
        scrollTop: target.scrollTop,
        viewportHeight: target.clientHeight
      };

      if (scrollFrameRef.current === null) {
        scrollFrameRef.current = window.requestAnimationFrame(() => {
          scrollFrameRef.current = null;
          const next = pendingScrollMetricsRef.current;
          if (!next) return;

          setScrollTop(previous =>
            Math.floor(previous / GRAPH_ROW_HEIGHT) ===
            Math.floor(next.scrollTop / GRAPH_ROW_HEIGHT)
              ? previous
              : next.scrollTop
          );
          setViewportHeight(previous =>
            previous === next.viewportHeight ? previous : next.viewportHeight
          );
        });
      }

      const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (distanceToBottom < 320 && graphHasMore && !graphLoading && !graphLoadingMore) {
        loadMoreGraph();
      }
    },
    [graphHasMore, graphLoading, graphLoadingMore, loadMoreGraph]
  );

  useEffect(() => {
    const container = graphScrollRef.current;
    if (!container) {
      return;
    }

    const updateViewportHeight = () => {
      setViewportHeight(previous =>
        previous === container.clientHeight ? previous : container.clientHeight
      );
    };
    updateViewportHeight();

    const observer = new ResizeObserver(updateViewportHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!inlineDiff || !repoPath) {
      setInlineDiffText('');
      setInlineDiffLoading(false);
      return;
    }

    let active = true;
    setInlineDiffLoading(true);
    void tauriGitBackend
      .getCommitDiff(repoPath, inlineDiff.sha, inlineDiff.path)
      .then(diff => {
        if (active) setInlineDiffText(diff || '');
      })
      .catch(() => {
        if (active) setInlineDiffText('');
      })
      .finally(() => {
        if (active) setInlineDiffLoading(false);
      });

    return () => {
      active = false;
    };
  }, [inlineDiff, repoPath]);

  const inlineDiffSource: DiffContentSource | null = useMemo(
    () => (inlineDiff ? { kind: 'commit', path: inlineDiff.path, sha: inlineDiff.sha } : null),
    [inlineDiff]
  );

  const {
    originalText: inlineOriginalText,
    modifiedText: inlineModifiedText,
    contentUnavailable: inlineContentUnavailable,
    loading: inlineContentLoading
  } = useDiffContent(repoPath, inlineDiffSource);

  useEffect(() => {
    if (!inlineDiff) {
      return;
    }

    const closeInlineDiff = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // The diff pane hosts a real editor; there Escape belongs to it (closing
      // the find widget, clearing multi-cursor) rather than to this panel.
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setInlineDiff(null);
    };

    window.addEventListener('keydown', closeInlineDiff, true);
    return () => window.removeEventListener('keydown', closeInlineDiff, true);
  }, [inlineDiff]);

  const expandedCommitSha = useMemo(
    () => (expandedIndex === null ? null : getCommitFullSha(expandedIndex)),
    [expandedIndex, getCommitFullSha]
  );

  useEffect(() => {
    const detail = expandedDetailRef.current;
    if (!detail) {
      setExpandedDetailHeight(previous => (previous === 0 ? previous : 0));
      return;
    }

    const updateDetailHeight = () => {
      const nextHeight = Math.ceil(detail.getBoundingClientRect().height);
      setExpandedDetailHeight(previous => (previous === nextHeight ? previous : nextHeight));
    };
    updateDetailHeight();

    const observer = new ResizeObserver(updateDetailHeight);
    observer.observe(detail);
    return () => observer.disconnect();
  }, [expandedCommitSha]);

  useEffect(() => {
    if (!expandedCommitSha || commitFilesBySha[expandedCommitSha]) {
      return;
    }

    let active = true;
    setCommitFilesLoading(previous => ({ ...previous, [expandedCommitSha]: true }));
    void fetchCommitFiles(expandedCommitSha)
      .then(files => {
        if (active) {
          setCommitFilesBySha(previous => ({ ...previous, [expandedCommitSha]: files }));
        }
      })
      .finally(() => {
        if (active) {
          setCommitFilesLoading(previous => ({ ...previous, [expandedCommitSha]: false }));
        }
      });

    return () => {
      active = false;
    };
  }, [commitFilesBySha, expandedCommitSha, fetchCommitFiles]);

  const openInlineDiff = useCallback(
    (commitIndex: number, path: string) => {
      toggleSelCommit(commitIndex, false);
      setDock(false);
      setInlineDiff({ sha: getCommitFullSha(commitIndex), path });
    },
    [getCommitFullSha, setDock, toggleSelCommit]
  );

  const handleCommitMenu = (e: React.MouseEvent, i: number) => {
    const hash = getCommitHash(i);
    const fullSha = getCommitFullSha(i);
    const title = `${hash}  ${commits[i][0].slice(0, 32)}`;
    openMenu(e, title, [
      {
        label: 'Open in Commit Details',
        hint: '↵',
        run: () => {
          setView('details');
          toggleSelCommit(i, false);
        }
      },
      {
        label: 'Diff vs parent',
        run: () => {
          toggleSelCommit(i, false);
          setDiffTargetSha(fullSha);
          setDiffTab('parent');
          setView('diff');
        }
      },
      { sep: true },
      { label: 'Checkout (detached)', run: () => void checkoutBranch(fullSha) },
      {
        label: 'Create branch here…',
        run: () => {
          prompt(
            'Create branch',
            `Create branch at commit ${hash}.`,
            'Create branch',
            'branch-' + hash,
            (name?: string) => {
              if (name && name.trim()) {
                void tauriGitBackend.createBranch(repoPath, name.trim(), fullSha).then(() => {
                  void checkoutBranch(name.trim());
                });
              }
            }
          );
        }
      },
      {
        label: 'Create tag here…',
        run: () => {
          prompt(
            'Create tag',
            `Tag name for commit ${hash}.`,
            'Create tag',
            'v1.0.0',
            (tagName?: string) => {
              if (tagName && tagName.trim()) {
                void createTag(tagName.trim(), fullSha);
              }
            }
          );
        }
      },
      { sep: true },
      { label: 'Cherry-pick', run: () => void cherryPickCommit(fullSha) },
      {
        label: 'Revert commit',
        run: () => {
          const commit = commits[i];
          const subject = commit?.[0] ? ` ("${commit[0]}")` : '';
          confirm(
            'Revert Commit?',
            `Revert commit ${hash}${subject}? A new commit will be created to invert the changes.`,
            `git revert --no-edit ${fullSha}`,
            'Revert',
            () => void revertCommit(fullSha)
          );
        }
      },
      { sep: true },
      {
        label: 'Reset current branch to here…',
        run: () => setResetReference(fullSha)
      },
      {
        sep: true
      },
      {
        label: 'Compare with current',
        run: () => {
          setCompareSeedRef(fullSha);
          setView('compare');
        }
      },
      {
        label: 'Create patch…',
        run: () => {
          void createPatch(fullSha).then(patch => {
            if (patch) {
              void navigator.clipboard.writeText(patch);
              toastRun('Patch copied to clipboard', hash);
            }
          });
        }
      },
      {
        label: 'Copy hash',
        hint: '⌘C',
        run: () => {
          void navigator.clipboard.writeText(fullSha);
          toastRun('Copied hash', hash);
        }
      }
    ]);
  };

  const activeFilterCount = [f.refs.length, f.authors.length, f.msg, f.from, f.to].filter(
    Boolean
  ).length;
  const matchCount = useMemo(
    () => commits.filter((_, index) => matchesFilter(index)).length,
    [commits, matchesFilter]
  );
  let lastDay: string | null = null;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          height: '38px',
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '0 var(--space-3)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)'
        }}
      >
        <Button
          variant="secondary"
          onClick={() => setFilterOpen(prev => !prev)}
          style={{ height: '25px', background: filterOpen ? 'var(--sel)' : 'transparent' }}
        >
          <i className="ph ph-funnel" style={{ fontSize: '14px' }} />
          Filter Graph {activeFilterCount ? `(${activeFilterCount})` : ''}
        </Button>
        <span style={{ fontSize: '11px', color: 'var(--fg3)', paddingLeft: 'var(--space-2)' }}>
          Layout
        </span>
        <SegmentedControl
          options={[
            { value: 'rows', label: 'Rows' },
            { value: 'grouped', label: 'Grouped by day' }
          ]}
          value={graphLayout}
          onChange={setGraphLayout}
          style={{ height: '25px' }}
        />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
          {`${matchCount} of ${commits.length} match`}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>·</span>
        <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>
          {sel.length === 1 ? '1 selected' : 'No selection'}
        </span>
      </div>

      {filterOpen && (
        <div
          style={{
            flex: '0 0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--panel)',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <GraphFilterMultiSelect
            label="Branch / tag"
            options={graphRefOptions}
            selected={f.refs}
            onChange={updateReferenceFilter}
            placeholder="Search branches and tags"
            mono
          />
          <GraphFilterMultiSelect
            label="Author"
            options={graphAuthorOptions}
            selected={f.authors}
            onChange={updateAuthorFilter}
            placeholder="Search authors"
          />
          <Input
            label="Message contains"
            value={f.msg}
            onChange={e => setF({ ...f, msg: e.target.value })}
            placeholder="fix, sched…"
            style={{ height: '26px', minHeight: 0, fontSize: '12px' }}
          />
          <Input
            label="From"
            type="date"
            value={f.from}
            onChange={e => setF({ ...f, from: e.target.value })}
            style={{
              height: '26px',
              minHeight: 0,
              fontSize: '12px',
              fontFamily: 'var(--font-mono)'
            }}
          />
          <Input
            label="To"
            type="date"
            value={f.to}
            onChange={e => setF({ ...f, to: e.target.value })}
            style={{
              height: '26px',
              minHeight: 0,
              fontSize: '12px',
              fontFamily: 'var(--font-mono)'
            }}
          />
        </div>
      )}

      {repositoryError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            color: 'var(--del)',
            background: 'var(--delbg)',
            borderBottom: '1px solid var(--line)',
            fontSize: '12px'
          }}
        >
          <span style={{ flex: 1 }}>Could not load repository state: {repositoryError}</span>
          <Button
            variant="secondary"
            style={{ height: '24px' }}
            onClick={() => void refreshRepository()}
          >
            Retry
          </Button>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            flex: inlineDiff ? '0 0 20%' : 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: inlineDiff ? '1px solid var(--line)' : 'none'
          }}
        >
          <div
            id="gc-graph-scroll"
            ref={graphScrollRef}
            style={{ flex: 1, minWidth: 0, minHeight: 0, overflowX: 'hidden', overflowY: 'auto' }}
            onScroll={handleGraphScroll}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '26px',
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: 'var(--panel)',
                borderBottom: '1px solid var(--line)',
                fontSize: '11px',
                textTransform: 'uppercase',
                color: 'var(--fg3)',
                paddingRight: 'var(--space-4)'
              }}
            >
              <span style={{ width: `${graphData.width}px`, flex: '0 0 auto' }} />
              <span style={{ flex: 1, paddingLeft: '6px' }}>Subject</span>
              {!inlineDiff && (
                <>
                  <span style={{ width: '150px', flex: '0 0 auto' }}>Author</span>
                  <span style={{ width: '104px', flex: '0 0 auto' }}>Date</span>
                  <span style={{ width: '74px', flex: '0 0 auto', textAlign: 'right' }}>
                    Commit
                  </span>
                </>
              )}
            </div>

            {topSpacerHeight > 0 ? <div style={{ height: `${topSpacerHeight}px` }} /> : null}

            {visibleIndexes.map(i => {
              const r = commits[i];
              const day = r[2].slice(0, 10);
              const showHeader = !enableVirtualRows && graphLayout === 'grouped' && day !== lastDay;
              if (graphLayout === 'grouped') lastDay = day;

              const isSelected = sel.includes(i);
              const isMatch = matchesFilter(i);
              const rowData = graphData.rows[i];
              const isMerge = (r[3] || []).length > 1;
              const isExpanded = !!expanded[i];
              const refs = (r[4] || []).map(refBadge);
              const rowFullSha = getCommitFullSha(i);
              const files = commitFilesBySha[rowFullSha] || [];
              const filesLoading = !!commitFilesLoading[rowFullSha];

              return (
                <div key={i}>
                  {showHeader && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '24px',
                        paddingLeft: 'var(--space-3)',
                        background: 'var(--raised)',
                        borderTop: '1px solid var(--line)',
                        borderBottom: '1px solid var(--line)',
                        fontSize: '10.5px',
                        textTransform: 'uppercase',
                        color: 'var(--fg2)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {day}
                    </div>
                  )}
                  <div
                    role="button"
                    tabIndex={0}
                    data-gc-context-menu="commit"
                    aria-selected={isSelected}
                    title={`${r[1]} · ${r[2]} · ${getCommitHash(i)}`}
                    onClick={e => {
                      e.preventDefault();
                      toggleSelCommit(i, false);
                      toggleExpandCommit(i);
                    }}
                    onDoubleClick={() => toggleExpandCommit(i)}
                    onContextMenu={e => handleCommitMenu(e, i)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSelCommit(i, false);
                        toggleExpandCommit(i);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '30px',
                      paddingRight: 'var(--space-4)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--sel)' : 'transparent',
                      boxShadow: isSelected ? 'inset 2px 0 0 var(--color-accent)' : 'none',
                      opacity: isMatch ? 1 : 0.3
                    }}
                  >
                    <span
                      style={{
                        width: `${graphData.width}px`,
                        flex: '0 0 auto',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {renderRowSvg(rowData, isMerge, graphData.width)}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        paddingLeft: '6px'
                      }}
                    >
                      {refs.map((rf, rIdx) => (
                        <Tag
                          key={rIdx}
                          variant={rf.variant}
                          style={{
                            flex: '0 0 auto',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10.5px',
                            padding: '1px 6px'
                          }}
                        >
                          {rf.label}
                        </Tag>
                      ))}
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: isMerge ? 400 : 500
                        }}
                      >
                        {r[0]}
                      </span>
                    </span>
                    {!inlineDiff && (
                      <>
                        <span
                          style={{
                            width: '150px',
                            flex: '0 0 auto',
                            color: 'var(--fg2)',
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {r[1]}
                        </span>
                        <span
                          style={{
                            width: '104px',
                            flex: '0 0 auto',
                            color: 'var(--fg3)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px'
                          }}
                        >
                          {r[2].slice(5)}
                        </span>
                        <span
                          style={{
                            width: '74px',
                            flex: '0 0 auto',
                            textAlign: 'right',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11.5px',
                            color: 'var(--iris)'
                          }}
                        >
                          {getCommitHash(i)}
                        </span>
                      </>
                    )}
                  </div>

                  {isExpanded && (
                    <div
                      ref={expandedDetailRef}
                      style={{
                        display: 'flex',
                        background: 'var(--panel)',
                        borderTop: '1px solid var(--line)',
                        borderBottom: '1px solid var(--line)'
                      }}
                    >
                      <div
                        style={{ width: `${graphData.width}px`, flex: '0 0 auto', display: 'flex' }}
                      >
                        {renderGutterSvg(rowData, graphData.width)}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          padding: 'var(--space-2) var(--space-4) var(--space-3) 6px',
                          minWidth: 0
                        }}
                      >
                        <h6 style={{ margin: '0 0 6px', color: 'var(--fg3)' }}>
                          {filesLoading
                            ? 'Loading changed files…'
                            : `${files.length} files changed`}
                        </h6>
                        <FileTree
                          files={files}
                          renderFile={(file, depth) => (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => openInlineDiff(i, file.path)}
                              onKeyDown={event => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  openInlineDiff(i, file.path);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                height: '22px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '11.5px',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-sm)',
                                paddingLeft: `${6 + depth * 14}px`,
                                paddingRight: '6px'
                              }}
                            >
                              <span
                                style={{
                                  width: '12px',
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
                                  color: 'var(--fg2)'
                                }}
                              >
                                {file.path.split('/').pop()}
                              </span>
                              <span style={{ color: 'var(--add)' }}>+{file.add}</span>
                              <span style={{ color: 'var(--del)' }}>−{file.del}</span>
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {bottomSpacerHeight > 0 ? <div style={{ height: `${bottomSpacerHeight}px` }} /> : null}

            {(graphLoading || graphLoadingMore || graphHasMore) && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-5)' }}>
                {graphLoading ? (
                  <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>Loading commits…</span>
                ) : graphLoadingMore ? (
                  <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>
                    Loading more commits…
                  </span>
                ) : (
                  <Button variant="secondary" style={{ height: '28px' }} onClick={loadMoreGraph}>
                    Load more commits
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {inlineDiff && (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'var(--panel)'
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <DiffViewer
                filePath={inlineDiff.path}
                rawDiffText={inlineDiffText}
                loading={inlineDiffLoading || inlineContentLoading}
                emptyMessage="No diff output found for this file in the selected commit."
                onClose={() => setInlineDiff(null)}
                originalText={inlineOriginalText}
                modifiedText={inlineModifiedText}
                contentUnavailable={inlineContentUnavailable}
                editable={false}
              />
            </div>
          </div>
        )}
      </div>
      <ResetDialog
        reference={resetReference}
        currentBranch={currentBranch}
        onClose={() => setResetReference(null)}
        onReset={(reference, mode) => void resetToRef(reference, mode)}
      />
    </div>
  );
};
