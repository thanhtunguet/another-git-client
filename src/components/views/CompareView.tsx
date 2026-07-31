import React from 'react';
import { useGitClient, getHash, COLORS } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { Input, Select } from '../common/FormControls';
import { SegmentedControl } from '../common/SegmentedControl';
import { Tag } from '../common/Tag';

export const CompareView: React.FC = () => {
  const {
    compareMode,
    setCompareMode,
    compareLayout,
    setCompareLayout,
    cf,
    setCf,
    commits,
    sel,
    toggleSelCommit,
    matchesCompareFilter,
    act,
    openMenu,
    setView
  } = useGitClient();

  const handleCommitMenu = (e: React.MouseEvent, i: number) => {
    const hash = getHash(i);
    openMenu(e, `${hash}  ${commits[i][0].slice(0, 32)}`, [
      { label: 'Open in Commit Details', hint: '↵', run: () => setView('details') },
      { label: 'Diff vs parent', run: () => setView('diff') },
      { sep: true },
      { label: 'Checkout (detached)', run: act(`Checkout ${hash}`) },
      { label: 'Create branch here…', run: act('Create branch') },
      { sep: true },
      { label: 'Cherry-pick', run: act('Cherry-pick') }
    ]);
  };

  const handleExportMenu = (e: React.MouseEvent) => {
    openMenu(e, 'Export comparison', [
      { label: 'Two CSV files (A→B, B→A)', run: act('Export CSV') },
      { label: 'Excel workbook — two sheets', run: act('Export XLSX') },
      { label: 'Copy summary to clipboard', run: act('Copy summary') },
      { sep: true },
      { label: 'Recent pair: main ↔ release/6.18.y', run: act('Open recent pair') },
      { label: 'Recent pair: main ↔ origin/main', run: act('Open recent pair') }
    ]);
  };

  const sideA = [6, 7, 8];
  const sideB = [1, 2, 4, 5, 9, 10, 11];

  const renderCompareGraphSvg = () => {
    const A = [0, 1, 2, 3, 4, 5];
    const B = [6, 7, 8];
    const y = (i: number) => 34 + i * 44;
    const xA = 100;
    const xB = 360;

    const dim = (i: number) => (matchesCompareFilter(i) ? 1 : 0.26);

    const msgW = (x: number) => (x === xA ? xB - xA - 92 : 920 - xB - 34);

    const nodes: React.ReactNode[] = [];

    nodes.push(
      <path
        key="base"
        d={`M${xA} ${y(A.length - 1)}C${xA} ${y(A.length - 1) + 46},${xB} ${y(B.length - 1) + 66},${xB} ${y(B.length - 1)}`}
        stroke="var(--line2)"
        strokeWidth={2}
        fill="none"
      />
    );
    nodes.push(<line key="la" x1={xA} x2={xA} y1={y(0)} y2={y(A.length - 1)} stroke={COLORS[0]} strokeWidth={2} />);
    nodes.push(<line key="lb" x1={xB} x2={xB} y1={y(0)} y2={y(B.length - 1)} stroke={COLORS[1]} strokeWidth={2} />);

    const renderNode = (i: number, x: number, yy: number, color: string) => [
      <circle key={`c${x}${i}`} cx={x} cy={yy} r={5} fill="var(--color-bg)" stroke={color} strokeWidth={2} opacity={dim(i)} />,
      <text key={`h${x}${i}`} x={x - 14} y={yy + 4} textAnchor="end" fill="var(--iris)" fontSize={11} fontFamily="var(--font-mono)" opacity={dim(i)}>
        {getHash(i)}
      </text>,
      <foreignObject key={`t${x}${i}`} x={x + 14} y={yy - 9} width={msgW(x)} height={16}>
        <div style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: dim(i), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
          {commits[i][0]}
        </div>
      </foreignObject>,
      <foreignObject key={`a${x}${i}`} x={x + 14} y={yy + 10} width={msgW(x)} height={14}>
        <div style={{ fontSize: '10.5px', color: 'var(--fg3)', opacity: dim(i), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
          {`${commits[i][1]} · ${commits[i][2]}`}
        </div>
      </foreignObject>
    ];

    A.forEach((i, k) => nodes.push(...renderNode(i, xA, y(k), COLORS[0])));
    B.forEach((i, k) => nodes.push(...renderNode(i, xB, y(k), COLORS[1])));

    nodes.push(
      <text key="mb" x={xA - 66} y={y(A.length - 1) + 62} fill="var(--fg3)" fontSize={11} fontFamily="var(--font-mono)">
        merge-base 4c1f9ab
      </text>
    );
    nodes.push(
      <text key="ha" x={xA - 66} y={y(0) - 18} fill={COLORS[0]} fontSize={11.5} fontFamily="var(--font-mono)">
        main
      </text>
    );
    nodes.push(
      <text key="hb" x={xB - 66} y={y(0) - 18} fill={COLORS[1]} fontSize={11.5} fontFamily="var(--font-mono)">
        feature/mlx5-next
      </text>
    );

    return (
      <svg width={920} height={y(A.length - 1) + 96} style={{ display: 'block', overflow: 'visible' }}>
        {nodes}
      </svg>
    );
  };

  const cmpCols = compareLayout === 'side' ? '1fr 1fr' : '1fr';
  const cmpRows = compareLayout === 'side' ? '1fr' : '1fr 1fr';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', height: '40px', padding: '0 var(--space-3)', borderBottom: '1px solid var(--line)', background: 'var(--panel)' }}>
        <Select options={['main', 'release/6.18.y']} style={{ width: 'auto', height: '26px', minHeight: 0, fontSize: '12px', fontFamily: 'var(--font-mono)' }} />
        <Button variant="secondary" title="Swap direction" onClick={act('Swap compare direction')} style={{ width: '26px', height: '26px', padding: 0 }}>
          <i className="ph ph-arrows-left-right" style={{ fontSize: '13px' }} />
        </Button>
        <Select options={['feature/mlx5-next', 'origin/main']} style={{ width: 'auto', height: '26px', minHeight: 0, fontSize: '12px', fontFamily: 'var(--font-mono)' }} />
        <span style={{ fontSize: '11px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>merge-base 4c1f9ab</span>

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
          Export<i className="ph ph-caret-down" style={{ fontSize: '11px' }} />
        </Button>
      </div>

      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', padding: 'var(--space-3)', borderBottom: '1px solid var(--line)', background: 'var(--panel)', flexWrap: 'wrap' }}>
        <Input label="Fuzzy message" value={cf.msg} onChange={e => setCf({ ...cf, msg: e.target.value })} placeholder="mlx5" fieldClassName="w-150" style={{ height: '25px', minHeight: 0, fontSize: '12px' }} />
        <Input label="Author" value={cf.author} onChange={e => setCf({ ...cf, author: e.target.value })} placeholder="saeed" fieldClassName="w-130" style={{ height: '25px', minHeight: 0, fontSize: '12px' }} />
        <Input label="Exclude (regex)" value={cf.excl} onChange={e => setCf({ ...cf, excl: e.target.value })} placeholder="^Merge" fieldClassName="w-130" style={{ height: '25px', minHeight: 0, fontSize: '12px', fontFamily: 'var(--font-mono)' }} />
        <Input label="From" value={cf.from} onChange={e => setCf({ ...cf, from: e.target.value })} placeholder="2026-07-16" fieldClassName="w-112" style={{ height: '25px', minHeight: 0, fontSize: '12px', fontFamily: 'var(--font-mono)' }} />
        <Input label="To" value={cf.to} onChange={e => setCf({ ...cf, to: e.target.value })} placeholder="2026-07-31" fieldClassName="w-112" style={{ height: '25px', minHeight: 0, fontSize: '12px', fontFamily: 'var(--font-mono)' }} />

        <Button
          variant="secondary"
          onClick={() => setCf({ ...cf, noMerges: !cf.noMerges })}
          style={{ height: '25px', fontSize: '11.5px', boxShadow: cf.noMerges ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }}
        >
          Ignore merges
        </Button>
        <Button
          variant="secondary"
          onClick={() => setCf({ ...cf, matching: !cf.matching })}
          style={{ height: '25px', fontSize: '11.5px', boxShadow: cf.matching ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }}
        >
          Detect matching-message cherry-picks
        </Button>

        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>Esc clears · ⌘A selects all</span>
      </div>

      {compareMode === 'list' ? (
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: cmpCols, gridTemplateRows: cmpRows, gap: '1px', background: 'var(--line)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, background: 'var(--color-bg)' }}>
            <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', height: '30px', padding: '0 var(--space-3)', background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'var(--color-accent)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>main .. feature/mlx5-next</span>
              <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>3 commits · 34 files · +1,204 −318</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {sideA.map(i => {
                const c = commits[i];
                const isMatch = matchesCompareFilter(i);
                const isSelected = sel.includes(i);
                const isPicked = cf.matching && (i === 7 || i === 2);

                return (
                  <div
                    key={i}
                    onClick={e => toggleSelCommit(i, e.shiftKey || e.metaKey || e.ctrlKey)}
                    onContextMenu={e => handleCommitMenu(e, i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      height: '26px',
                      padding: '0 var(--space-3)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      background: isSelected ? 'var(--sel)' : 'transparent',
                      opacity: isMatch ? 1 : 0.26
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--iris)' }}>{getHash(i)}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c[0]}</span>
                    {isPicked && <Tag variant="accent" style={{ fontSize: '9.5px', padding: '0 6px' }}>MATCHED</Tag>}
                    <span style={{ width: '120px', color: 'var(--fg3)', fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c[1]}</span>
                    <span style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{c[2].slice(5, 10)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, background: 'var(--color-bg)' }}>
            <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', height: '30px', padding: '0 var(--space-3)', background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'var(--add)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>feature/mlx5-next .. main</span>
              <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>12 commits · 96 files · +3,881 −1,022</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {sideB.map(i => {
                const c = commits[i];
                const isMatch = matchesCompareFilter(i);
                const isSelected = sel.includes(i);
                const isPicked = cf.matching && (i === 7 || i === 2);

                return (
                  <div
                    key={i}
                    onClick={e => toggleSelCommit(i, e.shiftKey || e.metaKey || e.ctrlKey)}
                    onContextMenu={e => handleCommitMenu(e, i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      height: '26px',
                      padding: '0 var(--space-3)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      background: isSelected ? 'var(--sel)' : 'transparent',
                      opacity: isMatch ? 1 : 0.26
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--iris)' }}>{getHash(i)}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c[0]}</span>
                    {isPicked && <Tag variant="accent" style={{ fontSize: '9.5px', padding: '0 6px' }}>MATCHED</Tag>}
                    <span style={{ width: '120px', color: 'var(--fg3)', fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c[1]}</span>
                    <span style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{c[2].slice(5, 10)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 'var(--space-8)', background: 'var(--color-bg)' }}>
          {renderCompareGraphSvg()}
        </div>
      )}
    </div>
  );
};
