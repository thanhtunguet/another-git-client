import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';

export const TopBar: React.FC = () => {
  const {
    repoName,
    repoPath,
    currentBranch,
    aheadCount,
    behindCount,
    openPalette,
    doFetch,
    doPull,
    doPush,
    createBranch,
    openRepository,
    cloneRepository,
    toggleTheme,
    theme,
    toggleDock,
    dock,
    openMenu
  } = useGitClient();

  const handleRepoMenu = (e: React.MouseEvent) => {
    openMenu(e, 'Repository', [
      { label: 'Open Repository…', hint: '⌘O', run: openRepository },
      { label: 'Clone…', run: cloneRepository }
    ]);
  };

  const handleBranchMenu = (e: React.MouseEvent) => {
    openMenu(e, currentBranch, [
      { label: 'Create new branch…', run: createBranch },
      { label: 'Fetch with prune', run: doFetch },
      { label: 'Pull', run: doPull },
      { label: 'Push', run: doPush }
    ]);
  };

  const themeIcon = theme === 'light' ? 'ph-moon' : 'ph-sun';

  return (
    <div className="gc-topbar">
      <Button
        variant="secondary"
        onClick={handleRepoMenu}
        style={{ height: '28px', gap: '8px', fontSize: '12.5px' }}
      >
        <i className="ph ph-git-fork" style={{ fontSize: '14px', color: 'var(--color-accent)' }} />
        <span style={{ fontWeight: 500 }}>{repoName}</span>
        <span style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          {repoPath}
        </span>
        <i className="ph ph-caret-down" style={{ fontSize: '11px', color: 'var(--fg3)' }} />
      </Button>

      <Button
        variant="secondary"
        onClick={handleBranchMenu}
        style={{ height: '28px', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
      >
        <i
          className="ph ph-git-branch"
          style={{ fontSize: '14px', color: 'var(--color-accent)' }}
        />
        <span>{currentBranch}</span>
        <span style={{ color: 'var(--add)' }}>↓{behindCount}</span>
        <span style={{ color: 'var(--warn)' }}>↑{aheadCount}</span>
      </Button>

      <button
        onClick={openPalette}
        style={{
          flex: '1 1 auto',
          maxWidth: '520px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 10px',
          background: 'var(--raised)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--fg3)',
          cursor: 'text',
          fontFamily: 'inherit',
          fontSize: '12.5px',
          textAlign: 'left'
        }}
      >
        <i className="ph ph-magnifying-glass" style={{ fontSize: '13px' }} />
        <span style={{ flex: 1 }}>Quick Git Actions — search branches, commits, commands…</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10.5px',
            border: '1px solid var(--line2)',
            borderRadius: 'var(--radius-sm)',
            padding: '1px 5px'
          }}
        >
          ⌘K
        </span>
      </button>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <Button
          variant="ghost"
          style={{ height: '24px', padding: '0 8px', color: 'var(--fg2)' }}
          onClick={doFetch}
        >
          Fetch
        </Button>
        <Button
          variant="ghost"
          style={{ height: '24px', padding: '0 8px', color: 'var(--fg2)' }}
          onClick={doPull}
        >
          Pull
        </Button>
        <Button
          variant="ghost"
          style={{ height: '24px', padding: '0 8px', color: 'var(--fg2)' }}
          onClick={doPush}
        >
          Push
        </Button>
      </div>

      <Button
        variant="secondary"
        onClick={toggleTheme}
        title="Toggle theme"
        style={{ width: '28px', height: '28px', padding: 0 }}
      >
        <i className={`ph ${themeIcon}`} style={{ fontSize: '15px' }} />
      </Button>

      <Button
        variant="secondary"
        onClick={toggleDock}
        style={{ height: '28px', background: dock ? 'var(--sel)' : 'transparent' }}
      >
        Source Control
      </Button>
    </div>
  );
};
