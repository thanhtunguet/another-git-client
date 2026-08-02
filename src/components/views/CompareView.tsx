import React, { useEffect, useState, useMemo } from 'react';
import { useGitClient, COLORS } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { Input, Select } from '../common/FormControls';
import { SegmentedControl } from '../common/SegmentedControl';
import { tauriGitBackend, type BranchRef, type GitCompareResult, type GraphCommitRow } from '../../services/tauriGitBackend';

export const CompareView: React.FC = () => {
  const {
    compareMode,
    setCompareMode,
    compareLayout,
    setCompareLayout,
    cf,
    setCf,
    repoPath,
                    openMenu,
    setView,
    getCompare,
    createPatch,
    toastRun,
    checkoutBranch,
    cherryPickCommit,
    prompt,
    compareSeedRef,
    setCompareSeedRef,
    setDiffTargetSha,
    setDiffTab,
    toggleSelCommit,
    findCommitIndexBySha,
    preferences
  } = useGitClient();

  const [branches, setBranches] = useState<BranchRef[]>([]);
  const [leftRef, setLeftRef] = useState<string>('');
  const [rightRef, setRightRef] = useState<string>('');
  const [compareResult, setCompareResult] = useState<GitCompareResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!repoPath) {
      setBranches([]);
      return;
    }
    let active = true;
    void tauriGitBackend.getBranches(repoPath).then(bList => {
      if (!active) return;
      setBranches(bList);
      if (bList.length) {
        const curName = bList.find(b => b.current)?.name || bList[0].name;
        if (compareSeedRef) {
          const revisionOnLeft = (preferences.compareDirection || 'Revision → working tree') === 'Revision → working tree';
          setLeftRef(revisionOnLeft ? compareSeedRef : curName);
          setRightRef(revisionOnLeft ? curName : compareSeedRef);
          setCompareSeedRef(null);
        } else {
          const otherName = bList.find(b => b.name !== curName)?.name || curName;
          setLeftRef(prev => prev || curName);
          setRightRef(prev => prev || otherName);
        }
      }
    }).catch(() => {
      if (active) setBranches([]);
    });
    return () => { active = false; };
  }, [repoPath, compareSeedRef, setCompareSeedRef, preferences.compareDirection]);

  useEffect(() => {
    if (!repoPath || !leftRef || !rightRef) return;
    let active = true;
    setIsLoading(true);
    void getCompare(leftRef, rightRef).then(res => {
      if (!active) return;
      setCompareResult(res);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [repoPath, leftRef, rightRef, getCompare]);

  const branchOptions = useMemo(() => {
    if (!branches.length) return [leftRef || 'main', rightRef || 'HEAD'].filter(Boolean);
    const names = branches.map(b => b.name);
    const extras = [leftRef, rightRef].filter(ref => ref && !names.includes(ref));
    return [...names, ...extras];
  }, [branches, leftRef, rightRef]);

  const openCommitDetails = (commit: GraphCommitRow) => {
    const idx = findCommitIndexBySha(commit.sha);
    if (idx >= 0) {
      toggleSelCommit(idx, false);
      setView('details');
    } else {
      toastRun('Commit not loaded in Git Graph', 'Load more commits in Git Graph to open its details');
    }
  };

  const handleCommitMenu = (e: React.MouseEvent, commit: GraphCommitRow) => {
    const hash = commit.shortSha;
    openMenu(e, `${hash}  ${commit.subject.slice(0, 32)}`, [
      { label: 'Open in Commit Details', hint: '↵', run: () => openCommitDetails(commit) },
      {
        label: 'Diff vs parent',
        run: () => {
          setDiffTargetSha(commit.sha);
          setDiffTab('parent');
          setView('diff');
        }
      },
      { sep: true },
      { label: 'Checkout (detached)', run: () => void checkoutBranch(commit.sha) },
      {
        label: 'Create branch here…',
        run: () => {
          prompt(
            'Create branch',
            `Create branch at commit ${hash}.`,
            'Create branch',
            `branch-${hash}`,
            (name?: string) => {
              if (name && name.trim()) {
                void tauriGitBackend.createBranch(repoPath, name.trim(), commit.sha).then(() => {
                  void checkoutBranch(name.trim());
                });
              }
            }
          );
        }
      },
      { sep: true },
      { label: 'Cherry-pick', run: () => void cherryPickCommit(commit.sha) },
      {
        label: 'Create patch…',
        run: () => {
          void createPatch(commit.sha).then(p => {
            if (p) void navigator.clipboard.writeText(p);
          });
        }
      }
    ]);
  };

  const handleExportMenu = (e: React.MouseEvent) => {
    openMenu(e, 'Export comparison', [
      {
        label: 'Copy summary to clipboard',
        run: () => {
          const leftCount = compareResult?.commitsOnlyLeft.length ?? 0;
          const rightCount = compareResult?.commitsOnlyRight.length ?? 0;
          const filesCount = compareResult?.changedFiles.length ?? 0;
          const summary = `Comparison: ${leftRef} ↔ ${rightRef}\nMerge Base: ${compareResult?.mergeBase || 'None'}\nCommits unique to ${leftRef}: ${leftCount}\nCommits unique to ${rightRef}: ${rightCount}\nFiles changed: ${filesCount}`;
          void navigator.clipboard.writeText(summary);
          toastRun('Copied summary to clipboard', `${leftRef} ↔ ${rightRef}`);
        }
      },
      {
        label: 'Copy diff patch to clipboard',
        run: () => {
          void createPatch(`${leftRef}...${rightRef}`).then(p => {
            if (p) {
              void navigator.clipboard.writeText(p);
              toastRun('Copied patch to clipboard', `${leftRef}...${rightRef}`);
            }
          });
        }
      }
    ]);
  };

  const handleSwap = () => {
    const tmp = leftRef;
    setLeftRef(rightRef);
    setRightRef(tmp);
  };

  const commitsOnlyLeft = compareResult?.commitsOnlyLeft || [];
  const commitsOnlyRight = compareResult?.commitsOnlyRight || [];

  const renderCompareGraphSvg = () => {
    const A = commitsOnlyLeft.slice(0, 10);
    const B = commitsOnlyRight.slice(0, 10);
    const maxLen = Math.max(A.length, B.length, 1);
    const y = (i: number) => 34 + i * 44;
    const xA = 100;
    const xB = 360;

    const msgW = (x: number) => (x === xA ? xB - xA - 92 : 920 - xB - 34);

    const nodes: React.ReactNode[] = [];

    if (A.length > 0 && B.length > 0) {
      nodes.push(
        <path
          key="base"
          d={`M${xA} ${y(A.length - 1)}C${xA} ${y(A.length - 1) + 46},${xB} ${y(B.length - 1) + 66},${xB} ${y(B.length - 1)}`}
          stroke="var(--line2)"
          strokeWidth={2}
          fill="none"
        />
      );
    }

    if (A.length > 0) {
      nodes.push(
        <line
          key="la"
          x1={xA}
          x2={xA}
          y1={y(0)}
          y2={y(A.length - 1)}
          stroke={COLORS[0]}
          strokeWidth={2}
        />
      );
    }

    if (B.length > 0) {
      nodes.push(
        <line
          key="lb"
          x1={xB}
          x2={xB}
          y1={y(0)}
          y2={y(B.length - 1)}
          stroke={COLORS[1]}
          strokeWidth={2}
        />
      );
    }

    const renderNode = (c: GraphCommitRow, i: number, x: number, yy: number, color: string) => [
      <circle
        key={`c${x}${i}`}
        cx={x}
        cy={yy}
        r={5}
        fill="var(--color-bg)"
        stroke={color}
        strokeWidth={2}
      />,
      <text
        key={`h${x}${i}`}
        x={x - 14}
        y={yy + 4}
        textAnchor="end"
        fill="var(--iris)"
        fontSize={11}
        fontFamily="var(--font-mono)"
      >
        {c.shortSha}
      </text>,
      <foreignObject key={`t${x}${i}`} x={x + 14} y={yy - 9} width={msgW(x)} height={16}>
        <div
          style={{
            fontSize: '12.5px',
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)'
          }}
        >
          {c.subject}
        </div>
      </foreignObject>,
      <foreignObject key={`a${x}${i}`} x={x + 14} y={yy + 10} width={msgW(x)} height={14}>
        <div
          style={{
            fontSize: '10.5px',
            color: 'var(--fg3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {`${c.author} · ${c.date.slice(0, 10)}`}
        </div>
      </foreignObject>
    ];

    A.forEach((c, k) => nodes.push(...renderNode(c, k, xA, y(k), COLORS[0])));
    B.forEach((c, k) => nodes.push(...renderNode(c, k, xB, y(k), COLORS[1])));

    nodes.push(
      <text
        key="mb"
        x={xA - 66}
        y={y(maxLen - 1) + 62}
        fill="var(--fg3)"
        fontSize={11}
        fontFamily="var(--font-mono)"
      >
        merge-base {compareResult?.mergeBase ? compareResult.mergeBase.slice(0, 7) : '—'}
      </text>
    );
    nodes.push(
      <text
        key="ha"
        x={xA - 66}
        y={y(0) - 18}
        fill={COLORS[0]}
        fontSize={11.5}
        fontFamily="var(--font-mono)"
      >
        {leftRef}
      </text>
    );
    nodes.push(
      <text
        key="hb"
        x={xB - 66}
        y={y(0) - 18}
        fill={COLORS[1]}
        fontSize={11.5}
        fontFamily="var(--font-mono)"
      >
        {rightRef}
      </text>
    );

    return (
      <svg
        width={920}
        height={y(maxLen - 1) + 96}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {nodes}
      </svg>
    );
  };

  const cmpCols = compareLayout === 'side' ? '1fr 1fr' : '1fr';
  const cmpRows = compareLayout === 'side' ? '1fr' : '1fr 1fr';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Top Bar */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          height: '40px',
          padding: '0 var(--space-3)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)'
        }}
      >
        <Select
          value={leftRef}
          onChange={e => setLeftRef(e.target.value)}
          options={branchOptions}
          style={{
            width: 'auto',
            height: '26px',
            minHeight: 0,
            fontSize: '12px',
            fontFamily: 'var(--font-mono)'
          }}
        />
        <Button
          variant="secondary"
          title="Swap direction"
          onClick={handleSwap}
          style={{ width: '26px', height: '26px', padding: 0 }}
        >
          <i className="ph ph-arrows-left-right" style={{ fontSize: '13px' }} />
        </Button>
        <Select
          value={rightRef}
          onChange={e => setRightRef(e.target.value)}
          options={branchOptions}
          style={{
            width: 'auto',
            height: '26px',
            minHeight: 0,
            fontSize: '12px',
            fontFamily: 'var(--font-mono)'
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
          merge-base {compareResult?.mergeBase ? compareResult.mergeBase.slice(0, 7) : '—'}
        </span>

        <div style={{ flex: 1 }} />

        <SegmentedControl
          options={[
            { value: 'list', label: 'List' },
            { value: 'graph', label: 'Graph' }
          ]}
          value={compareMode}
          onChange={setCompareMode}
          style={{ height: '26px' }}
        />

        {compareMode === 'list' && (
          <SegmentedControl
            options={[
              { value: 'side', label: 'Side by side' },
              { value: 'stack', label: 'Stacked' }
            ]}
            value={compareLayout}
            onChange={setCompareLayout}
            style={{ height: '26px' }}
          />
        )}

        <Button variant="secondary" onClick={handleExportMenu} style={{ height: '26px' }}>
          Export
          <i className="ph ph-caret-down" style={{ fontSize: '11px' }} />
        </Button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'var(--space-3)',
          padding: 'var(--space-3)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)',
          flexWrap: 'wrap'
        }}
      >
        <Input
          label="Fuzzy message"
          value={cf.msg}
          onChange={e => setCf({ ...cf, msg: e.target.value })}
          placeholder="filter commit subject…"
          fieldClassName="w-150"
          style={{ height: '25px', minHeight: 0, fontSize: '12px' }}
        />
        <Input
          label="Author"
          value={cf.author}
          onChange={e => setCf({ ...cf, author: e.target.value })}
          placeholder="author name…"
          fieldClassName="w-130"
          style={{ height: '25px', minHeight: 0, fontSize: '12px' }}
        />
        <Button
          variant="secondary"
          onClick={() => setCf({ ...cf, noMerges: !cf.noMerges })}
          aria-pressed={cf.noMerges}
          style={{
            height: '25px',
            fontSize: '11.5px',
            boxShadow: cf.noMerges ? 'inset 0 0 0 1px var(--color-accent)' : 'none'
          }}
        >
          Ignore merges
        </Button>

        <div style={{ flex: 1 }} />
        {isLoading && <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>Comparing…</span>}
      </div>

      {compareMode === 'list' ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: cmpCols,
            gridTemplateRows: cmpRows,
            gap: '1px',
            background: 'var(--line)'
          }}
        >
          {/* Side A */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              minWidth: 0,
              background: 'var(--color-bg)'
            }}
          >
            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                height: '30px',
                padding: '0 var(--space-3)',
                background: 'var(--panel)',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '2px',
                  background: 'var(--color-accent)'
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
                {leftRef} .. {rightRef}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>
                {commitsOnlyLeft.length} commits
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {commitsOnlyLeft.map((c, i) => {
                const matchesMsg = !cf.msg || c.subject.toLowerCase().includes(cf.msg.toLowerCase());
                const matchesAuthor = !cf.author || c.author.toLowerCase().includes(cf.author.toLowerCase());
                const isMerge = c.parents.length > 1;
                if ((cf.noMerges && isMerge) || !matchesMsg || !matchesAuthor) return null;

                return (
                  <div
                    key={c.sha || i}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCommitDetails(c)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openCommitDetails(c);
                      }
                    }}
                    onContextMenu={e => handleCommitMenu(e, c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      height: '26px',
                      padding: '0 var(--space-3)',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    className="gc-hover-bg"
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--iris)'
                      }}
                    >
                      {c.shortSha}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {c.subject}
                    </span>
                    <span
                      style={{
                        width: '120px',
                        color: 'var(--fg3)',
                        fontSize: '11.5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {c.author}
                    </span>
                    <span
                      style={{
                        color: 'var(--fg3)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px'
                      }}
                    >
                      {c.date.slice(5, 10)}
                    </span>
                  </div>
                );
              })}
              {!commitsOnlyLeft.length && !isLoading && (
                <div style={{ padding: '12px', fontSize: '11.5px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
                  No unique commits in {leftRef} compared to {rightRef}.
                </div>
              )}
            </div>
          </div>

          {/* Side B */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              minWidth: 0,
              background: 'var(--color-bg)'
            }}
          >
            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                height: '30px',
                padding: '0 var(--space-3)',
                background: 'var(--panel)',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '2px',
                  background: 'var(--add)'
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
                {rightRef} .. {leftRef}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>
                {commitsOnlyRight.length} commits
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {commitsOnlyRight.map((c, i) => {
                const matchesMsg = !cf.msg || c.subject.toLowerCase().includes(cf.msg.toLowerCase());
                const matchesAuthor = !cf.author || c.author.toLowerCase().includes(cf.author.toLowerCase());
                const isMerge = c.parents.length > 1;
                if ((cf.noMerges && isMerge) || !matchesMsg || !matchesAuthor) return null;

                return (
                  <div
                    key={c.sha || i}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCommitDetails(c)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openCommitDetails(c);
                      }
                    }}
                    onContextMenu={e => handleCommitMenu(e, c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      height: '26px',
                      padding: '0 var(--space-3)',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    className="gc-hover-bg"
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--iris)'
                      }}
                    >
                      {c.shortSha}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {c.subject}
                    </span>
                    <span
                      style={{
                        width: '120px',
                        color: 'var(--fg3)',
                        fontSize: '11.5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {c.author}
                    </span>
                    <span
                      style={{
                        color: 'var(--fg3)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px'
                      }}
                    >
                      {c.date.slice(5, 10)}
                    </span>
                  </div>
                );
              })}
              {!commitsOnlyRight.length && !isLoading && (
                <div style={{ padding: '12px', fontSize: '11.5px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
                  No unique commits in {rightRef} compared to {leftRef}.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            padding: 'var(--space-8)',
            background: 'var(--color-bg)'
          }}
        >
          {renderCompareGraphSvg()}
        </div>
      )}
    </div>
  );
};
