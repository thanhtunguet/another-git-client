import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';

export const TopBar: React.FC = () => {
  const {
    repoName,
    repoPath,
    knownRepositories,
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
    selectRepository,
    actionBusy,
    activeRemoteAction,
    toggleTheme,
    theme,
    toggleDock,
    dock,
    openMenu
  } = useGitClient();

  const handleRepoMenu = (e: React.MouseEvent) => {
    const selectableRepoItems = knownRepositories
      .filter(item => item.path && item.path !== repoPath)
      .map(item => ({
      label: item.name,
      hint: item.path,
      run: () => selectRepository(item.path)
    }));

    const menuTitle = repoPath ? `${repoName} (current) — ${repoPath}` : 'Open a repository';

    openMenu(e, menuTitle, [
      ...selectableRepoItems,
      ...(selectableRepoItems.length ? [{ sep: true } as const] : []),
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
  const renderRemoteButton = (
    label: 'Fetch' | 'Pull' | 'Push',
    onClick: () => void,
    actionKey: 'fetch' | 'pull' | 'push'
  ) => {
    const isRunning = activeRemoteAction === actionKey;
    return (
      <Button
        variant="ghost"
        style={{ height: '24px', padding: '0 8px', color: 'var(--fg2)' }}
        onClick={onClick}
        disabled={actionBusy}
        aria-busy={isRunning}
      >
        {isRunning ? (
          <i className="ph ph-spinner-gap gc-spin" style={{ fontSize: '13px' }} />
        ) : null}
        {label}
      </Button>
    );
  };

  return (
    <div className="gc-topbar">
      <Button
        variant="secondary"
        onClick={handleRepoMenu}
        disabled={actionBusy}
        style={{ height: '28px', gap: '8px', fontSize: '12.5px' }}
      >
        <i className="ph ph-git-fork" style={{ fontSize: '14px', color: 'var(--color-accent)' }} />
        <span style={{ fontWeight: 500 }}>{repoName}</span>
        <i className="ph ph-caret-down" style={{ fontSize: '11px', color: 'var(--fg3)' }} />
      </Button>

      <Button
        variant="secondary"
        onClick={handleBranchMenu}
        disabled={actionBusy}
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
        {renderRemoteButton('Fetch', doFetch, 'fetch')}
        {renderRemoteButton('Pull', doPull, 'pull')}
        {renderRemoteButton('Push', doPush, 'push')}
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
