import React, { useState } from 'react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { WorktreeEntry } from '../../services/tauriGitBackend';

export const WorktreesView: React.FC = () => {
  const {
    worktrees,
    addWorktree,
    removeWorktree,
    lockWorktree,
    unlockWorktree,
    pruneWorktrees,
    openPathInFileManager,
    openPathInTerminal,
    selectRepository,
    confirm,
    openMenu,
    actionBusy
  } = useGitClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addPath, setAddPath] = useState('');
  const [addBranch, setAddBranch] = useState('');
  const [addNewBranch, setAddNewBranch] = useState('');
  const [addDetach, setAddDetach] = useState(false);

  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockTarget, setLockTarget] = useState('');
  const [lockReason, setLockReason] = useState('');

  const registeredCount = worktrees.length;
  const lockedCount = worktrees.filter(w => w.locked).length;
  const prunableCount = worktrees.filter(w => Boolean(w.prunableReason)).length;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPath.trim()) return;
    await addWorktree(addPath.trim(), {
      reference: addBranch.trim() || undefined,
      newBranch: addNewBranch.trim() || undefined,
      detach: addDetach
    });
    setShowAddDialog(false);
    setAddPath('');
    setAddBranch('');
    setAddNewBranch('');
    setAddDetach(false);
  };

  const handleLockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockTarget) return;
    await lockWorktree(lockTarget, lockReason.trim() || undefined);
    setShowLockDialog(false);
    setLockTarget('');
    setLockReason('');
  };

  const handleMenu = (e: React.MouseEvent, w: WorktreeEntry) => {
    openMenu(e, w.path, [
      { label: 'Open in this window', run: () => selectRepository(w.path) },
      { label: 'Reveal in file manager', run: () => openPathInFileManager(w.path) },
      { label: 'Open terminal here', run: () => openPathInTerminal(w.path) },
      { sep: true },
      {
        label: w.locked ? 'Unlock worktree' : 'Lock worktree…',
        run: () => {
          if (w.locked) {
            unlockWorktree(w.path);
          } else {
            setLockTarget(w.path);
            setLockReason('');
            setShowLockDialog(true);
          }
        }
      },
      {
        label: 'Add worktree from this branch…',
        run: () => {
          setAddPath('');
          setAddBranch(w.branch || '');
          setAddNewBranch('');
          setAddDetach(false);
          setShowAddDialog(true);
        }
      },
      { sep: true },
      {
        label: 'Remove worktree',
        danger: true,
        run: () =>
          confirm(
            'Remove worktree?',
            `Unregister directory ${w.path} from repository.`,
            `git worktree remove ${w.path}`,
            'Remove',
            () => removeWorktree(w.path, false)
          )
      },
      {
        label: 'Force remove (discard changes)',
        danger: true,
        run: () =>
          confirm(
            'Force remove worktree?',
            `Unregister directory ${w.path} and force discard uncommitted changes.`,
            `git worktree remove --force ${w.path}`,
            'Force remove',
            () => removeWorktree(w.path, true)
          )
      }
    ]);
  };

  // Group worktrees cleanly
  const groups: Array<{ name: string; items: WorktreeEntry[] }> = [];

  const currentItems = worktrees.filter(w => w.isCurrent);
  if (currentItems.length > 0) {
    groups.push({ name: 'Current', items: currentItems });
  }

  const otherItems = worktrees.filter(w => !w.isCurrent && !w.locked && !w.prunableReason);
  if (otherItems.length > 0) {
    groups.push({ name: 'Other worktrees', items: otherItems });
  }

  const lockedItems = worktrees.filter(w => !w.isCurrent && w.locked && !w.prunableReason);
  if (lockedItems.length > 0) {
    groups.push({ name: 'Locked', items: lockedItems });
  }

  const prunableItems = worktrees.filter(w => Boolean(w.prunableReason));
  if (prunableItems.length > 0) {
    groups.push({ name: 'Prunable / stale', items: prunableItems });
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header toolbar */}
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
          {registeredCount} registered · {lockedCount} locked · {prunableCount} prunable
        </span>
        <div style={{ flex: 1 }} />
        <Button
          variant="secondary"
          style={{ height: '25px' }}
          disabled={actionBusy}
          onClick={() =>
            confirm(
              'Prune stale worktrees?',
              'Unregister all stale worktrees whose target directory no longer exists on disk.',
              'git worktree prune',
              'Prune',
              () => pruneWorktrees(false)
            )
          }
        >
          Prune worktrees
        </Button>
        <Button
          variant="primary"
          style={{ height: '25px' }}
          disabled={actionBusy}
          onClick={() => {
            setAddPath('');
            setAddBranch('');
            setAddNewBranch('');
            setAddDetach(false);
            setShowAddDialog(true);
          }}
        >
          <i className="ph ph-plus" style={{ fontSize: '13px' }} /> Add worktree…
        </Button>
      </div>

      {/* Add Worktree Dialog Modal */}
      {showAddDialog && (
        <div className="dialog-backdrop" style={{ zIndex: 100 }}>
          <form
            onSubmit={handleAddSubmit}
            className="dialog"
            style={{ width: '420px', animation: 'popIn .1s ease-out' }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
              Add Worktree
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="worktree-add-path"
                  style={{
                    fontSize: '12px',
                    color: 'var(--fg2)',
                    display: 'block',
                    marginBottom: '4px'
                  }}
                >
                  Target Directory Path *
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    id="worktree-add-path"
                    type="text"
                    value={addPath}
                    onChange={e => setAddPath(e.target.value)}
                    placeholder="/path/to/new-worktree"
                    style={{
                      flex: 1,
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      background: 'var(--color-bg)',
                      color: 'var(--fg)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px'
                    }}
                    autoFocus
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      void openDialog({
                        directory: true,
                        multiple: false,
                        title: 'Select Worktree Directory'
                      }).then(selected => {
                        if (typeof selected === 'string') setAddPath(selected);
                      });
                    }}
                  >
                    Browse…
                  </Button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="worktree-add-branch"
                  style={{
                    fontSize: '12px',
                    color: 'var(--fg2)',
                    display: 'block',
                    marginBottom: '4px'
                  }}
                >
                  Base Branch / Revision (Optional)
                </label>
                <input
                  id="worktree-add-branch"
                  type="text"
                  value={addBranch}
                  onChange={e => setAddBranch(e.target.value)}
                  placeholder="main, HEAD, tag, or commit SHA"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)',
                    background: 'var(--color-bg)',
                    color: 'var(--fg)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="worktree-add-new-branch"
                  style={{
                    fontSize: '12px',
                    color: 'var(--fg2)',
                    display: 'block',
                    marginBottom: '4px'
                  }}
                >
                  Create New Branch Name (-b, Optional)
                </label>
                <input
                  id="worktree-add-new-branch"
                  type="text"
                  value={addNewBranch}
                  onChange={e => setAddNewBranch(e.target.value)}
                  placeholder="feature/new-worktree-branch"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)',
                    background: 'var(--color-bg)',
                    color: 'var(--fg)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px'
                  }}
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={addDetach}
                  onChange={e => setAddDetach(e.target.checked)}
                />
                Detach HEAD (--detach)
              </label>
            </div>
            <div className="dialog-actions" style={{ marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="secondary" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add Worktree
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lock Worktree Dialog Modal */}
      {showLockDialog && (
        <div className="dialog-backdrop" style={{ zIndex: 100 }}>
          <form
            onSubmit={handleLockSubmit}
            className="dialog"
            style={{ width: '400px', animation: 'popIn .1s ease-out' }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
              Lock Worktree
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg3)', marginBottom: 'var(--space-3)' }}>
              Locking prevents git from pruning or deleting this worktree.
            </div>
            <div>
              <label
                htmlFor="worktree-lock-reason"
                style={{
                  fontSize: '12px',
                  color: 'var(--fg2)',
                  display: 'block',
                  marginBottom: '4px'
                }}
              >
                Lock Reason (Optional)
              </label>
              <input
                id="worktree-lock-reason"
                type="text"
                value={lockReason}
                onChange={e => setLockReason(e.target.value)}
                placeholder="Disk offline, temporary backup, etc."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  background: 'var(--color-bg)',
                  color: 'var(--fg)',
                  fontSize: '12px'
                }}
                autoFocus
              />
            </div>
            <div className="dialog-actions" style={{ marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="secondary" onClick={() => setShowLockDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Lock Worktree
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Worktree List View */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: 'var(--space-1) 0' }}>
        {worktrees.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: 'var(--fg3)',
              fontSize: '13px'
            }}
          >
            No worktrees found in this repository.
          </div>
        ) : (
          groups.map((g, gi) => (
            <div key={gi}>
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
                  color: 'var(--fg3)'
                }}
              >
                <span>{g.name}</span>
                <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              </div>
              {g.items.map((w, i) => {
                const icon = w.isCurrent
                  ? 'ph-house'
                  : w.locked
                    ? 'ph-lock'
                    : w.prunableReason
                      ? 'ph-warning'
                      : 'ph-folder-open';

                const dot = w.prunableReason
                  ? 'var(--del)'
                  : w.isCurrent
                    ? 'var(--add)'
                    : w.isDirty
                      ? 'var(--warn)'
                      : w.locked
                        ? 'var(--color-accent)'
                        : 'var(--add)';

                const mark = w.isCurrent ? 'var(--color-accent)' : 'transparent';

                const stateText = w.prunableReason
                  ? w.prunableReason
                  : w.locked
                    ? `locked${w.lockReason ? ` — “${w.lockReason}”` : ''}`
                    : w.isDirty
                      ? 'uncommitted changes'
                      : 'clean';

                const stateColor = w.prunableReason
                  ? 'var(--del)'
                  : w.isDirty
                    ? 'var(--warn)'
                    : 'var(--fg3)';

                const branchLabel = w.branch
                  ? w.branch
                  : w.detached
                    ? `(detached at ${w.head ? w.head.slice(0, 7) : 'HEAD'})`
                    : '—';

                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={e => handleMenu(e, w)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleMenu(e as unknown as React.MouseEvent, w);
                      }
                    }}
                    onContextMenu={e => handleMenu(e, w)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-4)',
                      height: '44px',
                      padding: '0 var(--space-4)',
                      cursor: 'pointer',
                      borderLeft: `2px solid ${mark}`
                    }}
                    className="gc-hover-bg"
                  >
                    <i className={`ph ${icon}`} style={{ fontSize: '16px', color: dot }} />
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
                      {branchLabel}
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
                    <span style={{ fontSize: '11px', color: stateColor }}>{stateText}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--iris)'
                      }}
                    >
                      {w.head ? w.head.slice(0, 7) : '—'}
                    </span>
                    <i
                      className="ph ph-dots-three"
                      style={{ fontSize: '15px', color: 'var(--fg3)' }}
                    />
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
