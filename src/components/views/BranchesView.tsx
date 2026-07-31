import React from 'react';
import { useGitClient, getHash } from '../../context/GitClientContext';
import { Input } from '../common/FormControls';
import { Button } from '../common/Button';
import { Tag } from '../common/Tag';
import { Card } from '../common/Card';
import { BranchTreeNode, RefBadge } from '../../types/git-client';

export const BranchesView: React.FC = () => {
  const { branchQ, setBranchQ, act, openMenu, confirm, setView, commits } = useGitClient();

  const rawTreeNodes: BranchTreeNode[] = [
    { g: 'Local' },
    { n: 'main', d: 1, cur: true, meta: '↓12 ↑3' },
    { n: 'feature/', d: 1, folder: true },
    { n: 'mlx5-next', d: 2, meta: '3 ahead', full: 'feature/mlx5-next' },
    { n: 'perf-tui', d: 2, meta: '1 ahead', full: 'feature/perf-tui' },
    { n: 'sched-ext-rework', d: 2, meta: '12 behind', full: 'feature/sched-ext-rework' },
    { n: 'release/', d: 1, folder: true },
    { n: '6.18.y', d: 2, meta: '', full: 'release/6.18.y' },
    { n: '6.17.y', d: 2, meta: 'stale', full: 'release/6.17.y' },
    { n: 'fix/kbuild-clang', d: 1, meta: '2 ahead' },
    { g: 'Remote' },
    { n: 'origin', d: 1, folder: true },
    { n: 'main', d: 2, full: 'origin/main', kind: 'remote' },
    { n: 'feature/mlx5-next', d: 2, full: 'origin/feature/mlx5-next', kind: 'remote' },
    { n: 'release/6.18.y', d: 2, full: 'origin/release/6.18.y', kind: 'remote' },
    { n: 'stable', d: 1, folder: true },
    { n: 'linux-6.18.y', d: 2, full: 'stable/linux-6.18.y', kind: 'remote' },
    { g: 'Tags' },
    { n: 'v6.19-rc4', d: 1, tag: true },
    { n: 'v6.19-rc3', d: 1, tag: true },
    { n: 'v6.19-rc2', d: 1, tag: true },
    { g: 'Recent' },
    { n: 'feature/mlx5-next', d: 1, meta: '4m ago' },
    { n: 'release/6.18.y', d: 1, meta: '2h ago' },
    { n: 'main', d: 1, meta: 'yesterday' }
  ];

  const q = branchQ.toLowerCase();
  const filteredNodes = rawTreeNodes.filter(
    r => !q || r.g || (r.full || r.n || '').toLowerCase().indexOf(q) >= 0
  );

  const handleBranchMenu = (e: React.MouseEvent, name: string, kind?: string) => {
    openMenu(e, name, [
      { label: 'Checkout', hint: '↵', run: act(`Checkout ${name}`, `checkout ${name}`) },
      { label: `New branch from ${name}…`, run: act('Create branch') },
      { label: 'Rename…', run: act('Rename branch') },
      { sep: true },
      { label: `Merge ${name} into main`, run: act('Merge', `merge ${name}`) },
      { label: `Rebase main onto ${name}`, run: act('Rebase') },
      { label: 'Compare with current', run: () => setView('compare') },
      { label: 'Open in Git Graph', run: () => setView('graph') },
      { sep: true },
      { label: 'Reset current to here — soft', run: act('Soft reset', `reset --soft ${name}`) },
      { label: 'Reset current to here — mixed', run: act('Mixed reset', `reset --mixed ${name}`) },
      {
        label: 'Reset current to here — hard',
        danger: true,
        run: () =>
          confirm(
            `Hard reset main to ${name}?`,
            'All uncommitted changes in the working tree and index are permanently discarded — 12 modified files will be lost.',
            `git reset --hard ${name}`,
            'Reset --hard',
            act('Hard reset')
          )
      },
      { sep: true },
      { label: kind === 'remote' ? 'Untrack upstream' : 'Set upstream…', run: act('Set upstream') },
      {
        label: `Delete ${name}`,
        danger: true,
        run: () =>
          confirm(
            `Delete branch ${name}?`,
            kind === 'remote'
              ? 'This deletes the branch on the remote for everyone.'
              : 'The branch has 3 commits not merged into main.',
            kind === 'remote'
              ? `git push origin --delete ${name.replace('origin/', '')}`
              : `git branch -D ${name}`,
            'Delete branch',
            act('Delete branch')
          )
      }
    ]);
  };

  const branchPreviewIndices = [6, 7, 8];

  const branchActionChips: { label: string; variant: RefBadge['variant'] }[] = [
    'Checkout',
    'Create',
    'Rename',
    'Track upstream',
    'Merge into current',
    'Rebase onto',
    'Compare',
    'Open in Git Graph',
    'Reset soft/mixed',
    'Reset hard',
    'Delete'
  ].map(l => ({
    label: l,
    variant: l === 'Reset hard' || l === 'Delete' ? 'outline' : 'neutral'
  }));

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div
        style={{
          flex: '0 0 340px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--line)',
          background: 'var(--panel)',
          minHeight: 0
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
            borderBottom: '1px solid var(--line)'
          }}
        >
          <Input
            value={branchQ}
            onChange={e => setBranchQ(e.target.value)}
            placeholder="Fuzzy find branch or tag…"
            style={{
              height: '25px',
              minHeight: 0,
              fontSize: '12px',
              fontFamily: 'var(--font-mono)'
            }}
          />
          <Button
            variant="secondary"
            onClick={act('Create branch')}
            title="New branch"
            style={{ width: '25px', height: '25px', padding: 0 }}
          >
            <i className="ph ph-plus" style={{ fontSize: '13px' }} />
          </Button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-2) 0', minHeight: 0 }}>
          {filteredNodes.map((b, i) => {
            if (b.g) {
              return (
                <div
                  key={i}
                  style={{
                    height: '26px',
                    paddingLeft: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--fg3)',
                    userSelect: 'none'
                  }}
                >
                  {b.g}
                </div>
              );
            }

            const full = b.full || b.n || '';
            const depth = b.d || 1;
            const padLeft = 10 + depth * 12;
            const iconColor = b.tag
              ? 'var(--warn)'
              : b.kind === 'remote'
                ? 'var(--fg3)'
                : 'var(--color-accent)';
            const glyph = b.folder ? 'ph-folder' : b.tag ? 'ph-tag' : 'ph-git-branch';
            const twisty = b.folder ? 'ph-caret-down' : '';

            return (
              <div
                key={i}
                onClick={b.folder ? undefined : () => setView('graph')}
                onContextMenu={b.folder ? undefined : e => handleBranchMenu(e, full, b.kind)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  height: b.folder ? '24px' : '24px',
                  paddingLeft: `${padLeft}px`,
                  paddingRight: 'var(--space-3)',
                  cursor: b.folder ? 'default' : 'pointer',
                  background: b.cur ? 'var(--sel)' : 'transparent',
                  color: 'var(--fg)',
                  fontSize: '12.5px',
                  fontWeight: b.cur ? 600 : 400,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <i
                  className={`ph ${twisty}`}
                  style={{ fontSize: '11px', color: 'var(--fg3)', width: '11px' }}
                />
                <i className={`ph ${glyph}`} style={{ fontSize: '13px', color: iconColor }} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {b.n}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10.5px',
                    color: 'var(--fg3)'
                  }}
                >
                  {b.meta}
                </span>
                {b.cur && (
                  <Tag
                    variant="outline"
                    style={{ fontSize: '9.5px', padding: '0 5px', letterSpacing: '.05em' }}
                  >
                    HEAD
                  </Tag>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            flex: '0 0 auto',
            borderTop: '1px solid var(--line)',
            padding: 'var(--space-2) var(--space-3)',
            display: 'flex',
            gap: '6px',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--fg3)', flex: 1 }}>3 remotes</span>
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11px' }}
            onClick={act('Add remote')}
          >
            Add remote…
          </Button>
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11px' }}
            onClick={act('Manage remotes')}
          >
            Manage
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: '38px',
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 var(--space-4)',
            borderBottom: '1px solid var(--line)',
            background: 'var(--panel)'
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>feature/mlx5-next</span>
          <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>
            tracking origin/feature/mlx5-next · 3 ahead, 1 behind
          </span>
          <div style={{ flex: 1 }} />
          <Button
            variant="secondary"
            style={{ height: '25px', padding: '0 10px' }}
            onClick={() => setView('compare')}
          >
            Compare with current
          </Button>
          <Button
            variant="primary"
            style={{ height: '25px', padding: '0 10px' }}
            onClick={act('Merge feature/mlx5-next into main', 'merge feature/mlx5-next')}
          >
            <i className="ph ph-git-merge" style={{ fontSize: '14px' }} /> Merge into main
          </Button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--space-6) var(--space-4)',
            minHeight: 0
          }}
        >
          <h6 style={{ margin: '0 0 var(--space-3)', color: 'var(--fg3)' }}>
            Recent commits on this branch
          </h6>
          {branchPreviewIndices.map(idx => {
            const c = commits[idx];
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'baseline',
                  padding: '7px 8px',
                  borderBottom: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--iris)',
                    fontSize: '11.5px'
                  }}
                >
                  {getHash(idx)}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c[0]}
                </span>
                <span style={{ color: 'var(--fg3)', fontSize: '11.5px' }}>{c[1]}</span>
                <span
                  style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                >
                  {c[2].slice(5, 10)}
                </span>
              </div>
            );
          })}

          <Card elevation="sm" style={{ marginTop: 'var(--space-8)' }}>
            <h6 style={{ margin: 0, color: 'var(--fg3)' }}>Right-click any row for</h6>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {branchActionChips.map((a, i) => (
                <Tag key={i} variant={a.variant}>
                  {a.label}
                </Tag>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
