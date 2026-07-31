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
    toggleTheme,
    theme,
    toggleDock,
    dock,
    openMenu,
    act
  } = useGitClient();

  const handleRepoMenu = (e: React.MouseEvent) => {
    openMenu(e, 'Recent repositories', [
      { label: `${repoName} — ${repoPath}`, run: act('Switch repo') },
      { label: 'llvm-project — ~/src/llvm', run: act('Switch repo') },
      { label: 'systemd — ~/src/systemd', run: act('Switch repo') },
      { sep: true },
      { label: 'Open repository…', hint: '⌘O', run: act('Open repository') },
      { label: 'Clone…', run: act('Clone') }
    ]);
  };

  const handleBranchMenu = (e: React.MouseEvent) => {
    openMenu(e, currentBranch, [
      { label: 'Checkout other branch…', hint: '⌘B', run: act('Checkout branch') },
      { label: `New branch from ${currentBranch}…`, run: act('Create branch') },
      { label: 'Set upstream…', run: act('Set upstream') },
      { sep: true },
      { label: 'Fetch with prune', run: doFetch },
      { label: `Pull — preview ${behindCount} incoming`, run: doPull },
      { label: `Push — preview ${aheadCount} outgoing`, run: doPush }
    ]);
  };

  const themeIcon = theme === 'light' ? 'ph-moon' : 'ph-sun';

  return (
    <div className="gc-topbar">
      <div className="gc-window-controls">
        <div className="gc-dot-close" />
        <div className="gc-dot-min" />
        <div className="gc-dot-max" />
      </div>

      <Button
        variant="secondary"
        onClick={handleRepoMenu}
        style={{ height: '28px', gap: '8px', fontSize: '12.5px' }}
      >
        <i className="ph ph-git-fork" style={{ fontSize: '14px', color: 'var(--color-accent)' }} />
        <span style={{ fontWeight: 500 }}>{repoName}</span>
        <span style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{repoPath}</span>
        <i className="ph ph-caret-down" style={{ fontSize: '11px', color: 'var(--fg3)' }} />
      </Button>

      <Button
        variant="secondary"
        onClick={handleBranchMenu}
        style={{ height: '28px', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
      >
        <i className="ph ph-git-branch" style={{ fontSize: '14px', color: 'var(--color-accent)' }} />
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
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', border: '1px solid var(--line2)', borderRadius: 'var(--radius-sm)', padding: '1px 5px' }}>
          ⌘K
        </span>
      </button>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <Button variant="ghost" style={{ height: '24px', padding: '0 8px', color: 'var(--fg2)' }} onClick={doFetch}>
          Fetch
        </Button>
        <Button variant="ghost" style={{ height: '24px', padding: '0 8px', color: 'var(--fg2)' }} onClick={doPull}>
          Pull ↓{behindCount}
        </Button>
        <Button variant="ghost" style={{ height: '24px', padding: '0 8px', color: 'var(--fg2)' }} onClick={doPush}>
          Push ↑{aheadCount}
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
