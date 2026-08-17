import React, { useState } from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { ResetDialog } from '../common/ResetDialog';
import { tauriGitBackend } from '../../services/tauriGitBackend';
import { type BranchNode, normalizeBranchRef, buildBranchMenuItems } from '../../utils/branchMenu';

export const TopBar: React.FC = () => {
  const {
    repoName,
    repoPath,
    knownRepositories,
    currentBranch,
    aheadCount,
    behindCount,
    setView,
    openPalette,
    doFetch,
    doPull,
    doPush,
    openRepository,
    cloneRepository,
    closeRepository,
    selectRepository,
    actionBusy,
    activeRemoteAction,
    toggleTheme,
    theme,
    toggleDock,
    dock,
    openMenu,
    recentBranches,
    checkoutBranch,
    checkoutTrackingBranch,
    renameBranch,
    mergeBranch,
    rebaseBranch,
    resetToRef,
    setUpstream,
    deleteBranch,
    setCompareSeedRef,
    prompt,
    confirm,
  } = useGitClient();

  const [branchPickerAnchor, setBranchPickerAnchor] = useState<{ left: number; top: number } | null>(
    null
  );
  const [branchPickerLoading, setBranchPickerLoading] = useState(false);
  const [pickerBranches, setPickerBranches] = useState<BranchNode[]>([]);
  const [resetReference, setResetReference] = useState<string | null>(null);

  const closeBranchPicker = () => setBranchPickerAnchor(null);

  const handleBranchFieldClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (branchPickerAnchor) {
      closeBranchPicker();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setBranchPickerAnchor({ left: rect.left, top: rect.bottom + 4 });
    if (!repoPath) return;
    setBranchPickerLoading(true);
    void tauriGitBackend
      .getBranches(repoPath)
      .then(refs => setPickerBranches(refs.map(normalizeBranchRef)))
      .catch(() => setPickerBranches([]))
      .finally(() => setBranchPickerLoading(false));
  };

  const branchMenuActions = {
    repoPath,
    currentBranch,
    checkoutBranch,
    checkoutTrackingBranch,
    renameBranch,
    mergeBranch,
    rebaseBranch,
    openResetDialog: setResetReference,
    setUpstream,
    deleteBranch,
    setCompareSeedRef,
    setView,
    prompt,
    confirm,
  };

  const recentBranchNodes = recentBranches
    .map(name => pickerBranches.find(b => b.name === name))
    .filter((b): b is BranchNode => !!b && !b.current);
  const currentBranchNode = pickerBranches.find(b => b.current);
  const quickPickBranches = [
    ...(currentBranchNode ? [currentBranchNode] : []),
    ...recentBranchNodes
  ].slice(0, 8);

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
      { label: 'Clone…', run: cloneRepository },
      ...(repoPath
        ? [{ sep: true } as const, { label: 'Close Repository', run: closeRepository }]
        : [])
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
        onClick={handleBranchFieldClick}
        disabled={actionBusy}
        style={{ height: '28px', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
        title="Switch branch"
        aria-haspopup="menu"
        aria-expanded={!!branchPickerAnchor}
      >
        <i
          className="ph ph-git-branch"
          style={{ fontSize: '14px', color: 'var(--color-accent)' }}
        />
        <span>{currentBranch}</span>
        <span style={{ color: 'var(--add)' }}>↓{behindCount}</span>
        <span style={{ color: 'var(--warn)' }}>↑{aheadCount}</span>
        <i className="ph ph-caret-down" style={{ fontSize: '10px', color: 'var(--fg3)' }} />
      </Button>

      {branchPickerAnchor && (
        <div
          className="gc-context-menu-overlay"
          onClick={closeBranchPicker}
          onContextMenu={closeBranchPicker}
        >
          <div
            className="gc-context-menu gc-branch-picker"
            role="menu"
            style={{ left: `${branchPickerAnchor.left}px`, top: `${branchPickerAnchor.top}px` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="gc-branch-picker-title">Recent branches</div>
            {branchPickerLoading ? (
              <div className="gc-branch-picker-empty">Loading branches…</div>
            ) : quickPickBranches.length === 0 ? (
              <div className="gc-branch-picker-empty">No recent branches yet</div>
            ) : (
              quickPickBranches.map(branch => (
                <div
                  key={branch.name}
                  role="menuitem"
                  tabIndex={-1}
                  className="gc-menu-item gc-branch-picker-item"
                  onClick={() => {
                    closeBranchPicker();
                    if (!branch.current) void checkoutBranch(branch.name);
                  }}
                  onContextMenu={e => {
                    e.preventDefault();
                    closeBranchPicker();
                    openMenu(e, branch.name, buildBranchMenuItems(branch, branchMenuActions));
                  }}
                >
                  <i
                    className="ph ph-git-branch"
                    style={{
                      fontSize: '12px',
                      color: branch.current ? 'var(--color-accent)' : 'var(--fg3)'
                    }}
                  />
                  <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{branch.name}</span>
                  {branch.current && <span className="gc-branch-picker-hint">current</span>}
                </div>
              ))
            )}
            <div className="gc-branch-picker-sep" />
            <div
              role="menuitem"
              tabIndex={-1}
              className="gc-menu-item gc-branch-picker-item"
              onClick={() => {
                closeBranchPicker();
                setView('branches');
              }}
            >
              <i className="ph ph-list-bullets" style={{ fontSize: '12px', color: 'var(--fg3)' }} />
              <span style={{ flex: 1 }}>View all branches</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={openPalette}
        title="Open the command palette to search branches, commits, and commands"
        aria-label="Open command palette"
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
          cursor: 'pointer',
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
        aria-label="Toggle theme"
        style={{ width: '28px', height: '28px', padding: 0 }}
      >
        <i className={`ph ${themeIcon}`} style={{ fontSize: '15px' }} />
      </Button>

      <Button
        variant="secondary"
        onClick={toggleDock}
        aria-pressed={dock}
        title={dock ? 'Hide source control panel' : 'Show source control panel'}
        style={{ height: '28px', background: dock ? 'var(--sel)' : 'transparent' }}
      >
        Source Control
      </Button>
      <ResetDialog
        reference={resetReference}
        currentBranch={currentBranch}
        onClose={() => setResetReference(null)}
        onReset={(reference, mode) => void resetToRef(reference, mode)}
      />
    </div>
  );
};
