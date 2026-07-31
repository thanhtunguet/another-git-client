import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { WorktreeItem } from '../../types/git-client';

export const WorktreesView: React.FC = () => {
  const { act, confirm, openMenu } = useGitClient();

  const rawWorktrees: WorktreeItem[] = [
    {
      group: 'Current',
      branch: 'main',
      path: '~/src/torvalds/linux',
      state: 'clean',
      head: 'f3a9c21',
      dot: 'var(--add)',
      icon: 'ph-house',
      mark: 'var(--color-accent)'
    },
    {
      group: 'Other worktrees',
      branch: 'feature/mlx5-next',
      path: '~/src/wt/mlx5-next',
      state: '3 changes',
      head: '8be1c04',
      dot: 'var(--warn)',
      icon: 'ph-folder-open',
      mark: 'transparent'
    },
    {
      branch: 'release/6.18.y',
      path: '~/src/wt/6.18.y',
      state: 'clean',
      head: 'b0c4e83',
      dot: 'var(--add)',
      icon: 'ph-folder-open',
      mark: 'transparent'
    },
    {
      branch: '(detached at v6.19-rc2)',
      path: '~/src/wt/bisect',
      state: 'bisecting',
      head: '2d77a19',
      dot: 'var(--iris)',
      icon: 'ph-folder-open',
      mark: 'transparent'
    },
    {
      group: 'Locked',
      branch: 'feature/perf-tui',
      path: '/Volumes/ext/wt/perf-tui',
      state: 'locked — “ext disk offline”',
      head: '91ff2d6',
      dot: 'var(--color-accent)',
      icon: 'ph-lock',
      mark: 'transparent'
    },
    {
      group: 'Prunable / stale',
      branch: 'fix/kbuild-clang',
      path: '~/src/wt/kbuild (missing)',
      state: 'directory missing',
      head: '—',
      dot: 'var(--del)',
      icon: 'ph-warning',
      mark: 'transparent'
    }
  ];

  const handleMenu = (e: React.MouseEvent, w: WorktreeItem) => {
    openMenu(e, w.path, [
      { label: 'Open in this window', run: act('Open worktree') },
      { label: 'Open in new window', run: act('Open worktree in new window') },
      { label: 'Reveal in Finder', run: act('Reveal') },
      { label: 'Open terminal here', run: act('Open terminal') },
      { sep: true },
      { label: w.state.indexOf('locked') === 0 ? 'Unlock' : 'Lock…', run: act('Lock worktree') },
      { label: 'Add worktree from this branch…', run: act('Worktree add') },
      { sep: true },
      {
        label: 'Remove worktree',
        danger: true,
        run: () =>
          confirm(
            'Remove worktree?',
            `The directory ${w.path} is unregistered from the repository. Files stay on disk.`,
            `git worktree remove ${w.path}`,
            'Remove',
            act('Remove worktree')
          )
      },
      {
        label: 'Force remove (discard changes)',
        danger: true,
        run: () =>
          confirm(
            'Force remove worktree?',
            `3 uncommitted changes in this worktree will be destroyed. This cannot be undone.`,
            `git worktree remove --force ${w.path}`,
            'Force remove',
            act('Force remove')
          )
      }
    ]);
  };

  const handleAddWorktreeMenu = (e: React.MouseEvent) => {
    openMenu(e, 'Add worktree', [
      { label: 'From local branch…', run: act('Worktree add') },
      { label: 'From remote branch (create tracking)…', run: act('Worktree add') },
      { label: 'From tag…', run: act('Worktree add') },
      { label: 'From typed revision…', run: act('Worktree add') },
      { sep: true },
      { label: 'Also create new branch', run: act('Worktree add -b') },
      { label: 'Detached HEAD', run: act('Worktree add --detach') },
      { sep: true },
      { label: 'Destination: empty folder → use as-is', run: act('Pick destination') },
      { label: 'Destination: non-empty → auto-named child', run: act('Pick destination') }
    ]);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          height: '38px',
          padding: '0 var(--space-4)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)'
        }}
      >
        <span style={{ fontWeight: 500 }}>Worktrees</span>
        <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>
          5 registered · 1 locked · 1 prunable
        </span>
        <div style={{ flex: 1 }} />
        <Button
          variant="secondary"
          style={{ height: '25px' }}
          onClick={() =>
            confirm(
              'Prune 1 stale worktree?',
              '~/src/wt/kbuild is registered but its directory is missing. Pruning removes the administrative entry.',
              'git worktree prune --dry-run',
              'Prune',
              act('Prune worktrees')
            )
          }
        >
          Preview prune
        </Button>
        <Button variant="primary" style={{ height: '25px' }} onClick={handleAddWorktreeMenu}>
          <i className="ph ph-plus" style={{ fontSize: '13px' }} /> Add worktree…
        </Button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: 'var(--space-1) 0' }}>
        {rawWorktrees.map((w, i) => {
          const stateColor =
            w.state === 'clean'
              ? 'var(--fg3)'
              : w.dot === 'var(--del)'
                ? 'var(--del)'
                : 'var(--warn)';

          return (
            <div key={i}>
              {w.group && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    height: '26px',
                    padding: '0 var(--space-4)',
                    marginTop: 'var(--space-2)',
                    fontSize: '10.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    color: 'var(--fg3)'
                  }}
                >
                  <span>{w.group}</span>
                  <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
                </div>
              )}
              <div
                onClick={e => handleMenu(e, w)}
                onContextMenu={e => handleMenu(e, w)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  height: '44px',
                  padding: '0 var(--space-4)',
                  cursor: 'pointer',
                  borderLeft: `2px solid ${w.mark}`
                }}
                className="gc-hover-bg"
              >
                <i className={`ph ${w.icon}`} style={{ fontSize: '16px', color: w.dot }} />
                <span
                  style={{
                    width: '230px',
                    flex: '0 0 auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12.5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {w.branch}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    color: 'var(--fg3)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {w.path}
                </span>
                <span style={{ fontSize: '11px', color: stateColor }}>{w.state}</span>
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--iris)' }}
                >
                  {w.head}
                </span>
                <i className="ph ph-dots-three" style={{ fontSize: '15px', color: 'var(--fg3)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
