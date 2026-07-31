import React from 'react';
import { useGitClient, getHash, refBadge, statusColor, COLORS } from '../../context/GitClientContext';
import { Input } from '../common/FormControls';
import { Button } from '../common/Button';
import { Tag } from '../common/Tag';
import { SegmentedControl } from '../common/SegmentedControl';
import { GraphRowData } from '../../types/git-client';

function laneX(l: number): number {
  return 12 + l * 15;
}

function renderRowSvg(row: GraphRowData, isMerge: boolean, width: number): React.ReactNode {
  const ch: React.ReactNode[] = [];
  row.edges.forEach((e, i) => {
    const x1 = laneX(e.from);
    const x2 = laneX(e.to);
    const d = x1 === x2
      ? `M${x1} ${e.y0}L${x1} ${e.y1}`
      : `M${x1} ${e.y0}C${x1} ${(e.y0 + e.y1) / 2},${x2} ${(e.y0 + e.y1) / 2},${x2} ${e.y1}`;

    ch.push(
      <path
        key={i}
        d={d}
        stroke={e.color}
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
      />
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
    filterOpen,
    setFilterOpen,
    graphLayout,
    setGraphLayout,
    f,
    setF,
    commits,
    graphData,
    sel,
    toggleSelCommit,
    expanded,
    toggleExpandCommit,
    getFileList,
    matchesFilter,
    act,
    openMenu,
    setView,
    setOp,
    log
  } = useGitClient();

  const handleCommitMenu = (e: React.MouseEvent, i: number) => {
    const hash = getHash(i);
    const title = `${hash}  ${commits[i][0].slice(0, 32)}`;
    openMenu(e, title, [
      { label: 'Open in Commit Details', hint: '↵', run: () => { setView('details'); toggleSelCommit(i, false); } },
      { label: 'Diff vs parent', run: () => setView('diff') },
      { sep: true },
      { label: 'Checkout (detached)', run: act(`Checkout ${hash}`, `checkout ${hash}`) },
      { label: 'Create branch here…', run: act('Create branch') },
      { label: 'Create tag here…', run: act('Create tag') },
      { sep: true },
      { label: 'Cherry-pick', run: act('Cherry-pick', `cherry-pick ${hash}`) },
      { label: 'Revert', run: act('Revert', `revert ${hash}`) },
      { label: 'Create patch…', run: act('Create patch') },
      {
        label: 'Start interactive rebase from here',
        run: () => {
          setOp({ name: 'REBASING', step: 2, total: 5, detail: 'pick 8be1c04 mm/slub: fix kmalloc_nolock()' });
          log([
            { text: `$ git rebase -i ${hash}^`, type: 'cmd' },
            { text: `Stopped at ${hash}... edit`, type: 'warn' }
          ]);
        }
      },
      { sep: true },
      { label: 'Compare with current', run: () => setView('compare') },
      { label: 'Directory timeline for this path…', run: act('Directory timeline') },
      { label: 'Jump to first parent', hint: '⌥↑', run: act('Jump to parent') },
      { label: 'Copy hash', hint: '⌘C', run: act('Copy hash') }
    ]);
  };

  const activeFilterCount = Object.keys(f).filter(k => (f as any)[k]).length;
  const matchCount = commits.filter((_, i) => matchesFilter(i)).length;
  let lastDay: string | null = null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: '38px', flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0 var(--space-3)', borderBottom: '1px solid var(--line)', background: 'var(--panel)' }}>
        <Button
          variant="secondary"
          onClick={() => setFilterOpen(prev => !prev)}
          style={{ height: '25px', background: filterOpen ? 'var(--sel)' : 'transparent' }}
        >
          <i className="ph ph-funnel" style={{ fontSize: '14px' }} />
          Filter Graph {activeFilterCount ? `(${activeFilterCount})` : ''}
        </Button>
        <span style={{ fontSize: '11px', color: 'var(--fg3)', paddingLeft: 'var(--space-2)' }}>Layout</span>
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
          {sel.length > 1 ? `${sel.length} commits selected — range details` : '1 selected'}
        </span>
      </div>

      {filterOpen && (
        <div style={{ flex: '0 0 auto', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
          <Input label="Branch / ref" value={f.ref} onChange={e => setF({ ...f, ref: e.target.value })} placeholder="main, feature/*" style={{ height: '26px', minHeight: 0, fontSize: '12px', fontFamily: 'var(--font-mono)' }} />
          <Input label="Author" value={f.author} onChange={e => setF({ ...f, author: e.target.value })} placeholder="torvalds" style={{ height: '26px', minHeight: 0, fontSize: '12px' }} />
          <Input label="Message contains" value={f.msg} onChange={e => setF({ ...f, msg: e.target.value })} placeholder="fix, sched…" style={{ height: '26px', minHeight: 0, fontSize: '12px' }} />
          <Input label="From" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} placeholder="2026-07-20" style={{ height: '26px', minHeight: 0, fontSize: '12px', fontFamily: 'var(--font-mono)' }} />
          <Input label="To" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} placeholder="2026-07-31" style={{ height: '26px', minHeight: 0, fontSize: '12px', fontFamily: 'var(--font-mono)' }} />
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '26px', position: 'sticky', top: 0, zIndex: 2, background: 'var(--panel)', borderBottom: '1px solid var(--line)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--fg3)', paddingRight: 'var(--space-4)' }}>
          <span style={{ width: `${graphData.width}px`, flex: '0 0 auto' }} />
          <span style={{ flex: 1, paddingLeft: '6px' }}>Subject</span>
          <span style={{ width: '150px', flex: '0 0 auto' }}>Author</span>
          <span style={{ width: '104px', flex: '0 0 auto' }}>Date</span>
          <span style={{ width: '74px', flex: '0 0 auto', textAlign: 'right' }}>Commit</span>
        </div>

        {commits.map((r, i) => {
          const day = r[2].slice(0, 10);
          const showHeader = graphLayout === 'grouped' && day !== lastDay;
          if (graphLayout === 'grouped') lastDay = day;

          const isSelected = sel.includes(i);
          const isMatch = matchesFilter(i);
          const rowData = graphData.rows[i];
          const isMerge = (r[3] || []).length > 1;
          const files = getFileList(i);
          const isExpanded = !!expanded[i];
          const refs = (r[4] || []).map(refBadge);

          return (
            <div key={i}>
              {showHeader && (
                <div style={{ display: 'flex', alignItems: 'center', height: '24px', paddingLeft: 'var(--space-3)', background: 'var(--raised)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', fontSize: '10.5px', letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--fg2)', fontFamily: 'var(--font-mono)' }}>
                  {day}
                </div>
              )}
              <div
                onClick={e => toggleSelCommit(i, e.shiftKey || e.metaKey || e.ctrlKey)}
                onDoubleClick={() => toggleExpandCommit(i)}
                onContextMenu={e => handleCommitMenu(e, i)}
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
                <span style={{ width: `${graphData.width}px`, flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
                  {renderRowSvg(rowData, isMerge, graphData.width)}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '6px' }}>
                  {refs.map((rf, rIdx) => (
                    <Tag key={rIdx} variant={rf.cls as any} style={{ flex: '0 0 auto', fontFamily: 'var(--font-mono)', fontSize: '10.5px', padding: '1px 6px' }}>
                      {rf.label}
                    </Tag>
                  ))}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isMerge ? 400 : 500 }}>
                    {r[0]}
                  </span>
                </span>
                <span style={{ width: '150px', flex: '0 0 auto', color: 'var(--fg2)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r[1]}
                </span>
                <span style={{ width: '104px', flex: '0 0 auto', color: 'var(--fg3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  {r[2].slice(5)}
                </span>
                <span style={{ width: '74px', flex: '0 0 auto', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--iris)' }}>
                  {getHash(i)}
                </span>
              </div>

              {isExpanded && (
                <div style={{ display: 'flex', background: 'var(--panel)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: `${graphData.width}px`, flex: '0 0 auto', display: 'flex' }}>
                    {renderGutterSvg(rowData, graphData.width)}
                  </div>
                  <div style={{ flex: 1, padding: 'var(--space-2) var(--space-4) var(--space-3) 6px', minWidth: 0 }}>
                    <h6 style={{ margin: '0 0 6px', color: 'var(--fg3)' }}>{files.length} files changed</h6>
                    {files.map((fl, fIdx) => (
                      <div
                        key={fIdx}
                        onClick={() => setView('diff')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '22px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '0 6px' }}
                      >
                        <span style={{ width: '12px', textAlign: 'center', color: statusColor(fl.status), fontWeight: 600 }}>{fl.status}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg2)' }}>{fl.path}</span>
                        <span style={{ color: 'var(--add)' }}>+{fl.add}</span>
                        <span style={{ color: 'var(--del)' }}>−{fl.del}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
          <Button variant="secondary" style={{ height: '28px' }} onClick={act('Load more commits', 'log --skip=31 -n 250')}>
            {`Load 250 more commits — showing ${commits.length} of 1,284,930`}
          </Button>
        </div>
      </div>
    </div>
  );
};
