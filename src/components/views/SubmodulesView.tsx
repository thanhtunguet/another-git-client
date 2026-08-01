import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { SubmoduleEntry } from '../../services/tauriGitBackend';

export const SubmodulesView: React.FC = () => {
  const {
    submodules,
    initSubmodule,
    updateSubmodule,
    syncSubmodule,
    deinitSubmodule,
    checkoutRecordedSubmoduleCommit,
    pullSubmoduleTrackedBranch,
    getSubmodulePointerDiff,
    stageSubmodulePointer,
    openPathInFileManager,
    openPathInTerminal,
    selectRepository,
    confirm,
    openMenu
  } = useGitClient();

  const totalCount = submodules.length;
  const needsAttentionCount = submodules.filter(
    s => s.status === 'out-of-sync' || s.status === 'pointer-mismatch' || s.status === 'modified-content' || s.status === 'merge-conflict' || s.isDirty
  ).length;

  const handleMenu = (e: React.MouseEvent, m: SubmoduleEntry) => {
    openMenu(e, m.path, [
      { label: 'Init', run: () => initSubmodule(m.path) },
      { label: 'Update', run: () => updateSubmodule({ path: m.path, init: true }) },
      { label: 'Update --recursive', run: () => updateSubmodule({ path: m.path, init: true, recursive: true }) },
      { label: 'Sync URL', run: () => syncSubmodule({ path: m.path }) },
      { sep: true },
      { label: 'Checkout recorded commit', run: () => checkoutRecordedSubmoduleCommit(m.path) },
      { label: 'Pull tracked branch', run: () => pullSubmoduleTrackedBranch(m.path) },
      { label: 'Show pointer diff', run: () => getSubmodulePointerDiff(m.path) },
      { label: 'Stage pointer change', run: () => stageSubmodulePointer(m.path) },
      { sep: true },
      { label: 'Reveal in Finder', run: () => openPathInFileManager(m.path) },
      { label: 'Open terminal here', run: () => openPathInTerminal(m.path) },
      { label: 'Open as workspace repository', run: () => selectRepository(m.path) },
      { sep: true },
      {
        label: 'Deinit submodule',
        danger: true,
        run: () =>
          confirm(
            'Deinit submodule?',
            `Unregister submodule at ${m.path} from git configuration. Submodule directory worktree files will be removed.`,
            `git submodule deinit --force -- ${m.path}`,
            'Deinit',
            () => deinitSubmodule(m.path, true)
          )
      }
    ]);
  };

  // Group submodules into Attention, Clean, Uninitialized
  const groups: Array<{ name: string; color: string; items: SubmoduleEntry[] }> = [];

  const attentionItems = submodules.filter(
    s => s.status === 'out-of-sync' || s.status === 'pointer-mismatch' || s.status === 'modified-content' || s.status === 'merge-conflict' || s.isDirty
  );
  if (attentionItems.length > 0) {
    groups.push({ name: 'Needs attention', color: 'var(--warn)', items: attentionItems });
  }

  const cleanItems = submodules.filter(
    s => s.status === 'clean' && !s.isDirty
  );
  if (cleanItems.length > 0) {
    groups.push({ name: 'Clean', color: 'var(--fg3)', items: cleanItems });
  }

  const uninitializedItems = submodules.filter(
    s => s.status === 'uninitialized' || !s.initialized
  );
  if (uninitializedItems.length > 0) {
    groups.push({ name: 'Uninitialized', color: 'var(--fg3)', items: uninitializedItems });
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
        <span style={{ fontWeight: 500 }}>Submodules</span>
        <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>
          {totalCount} total · {needsAttentionCount} need attention
        </span>
        <div style={{ flex: 1 }} />
        <Button
          variant="secondary"
          style={{ height: '25px' }}
          onClick={() => initSubmodule()}
        >
          Init all
        </Button>
        <Button
          variant="secondary"
          style={{ height: '25px' }}
          onClick={() => syncSubmodule({ recursive: true })}
        >
          Sync URLs
        </Button>
        <Button
          variant="primary"
          style={{ height: '25px' }}
          onClick={() => updateSubmodule({ init: true, recursive: true })}
        >
          Update all --recursive
        </Button>
      </div>

      {/* Submodule List View */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: 'var(--space-1) 0' }}>
        {submodules.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--fg3)', fontSize: '13px' }}>
            No submodules registered in .gitmodules.
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
                  letterSpacing: '.07em',
                  color: g.color
                }}
              >
                <span>{g.name}</span>
                <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              </div>
              {g.items.map((s, i) => {
                const isAttention = s.status === 'out-of-sync' || s.status === 'pointer-mismatch' || s.status === 'modified-content' || s.status === 'merge-conflict' || s.isDirty;
                const icon = isAttention ? 'ph-warning-circle' : 'ph-package';
                const dot = isAttention ? 'var(--warn)' : !s.initialized ? 'var(--fg3)' : 'var(--add)';
                const mark = isAttention ? 'var(--warn)' : 'transparent';

                const stateText = !s.initialized || s.status === 'uninitialized'
                  ? 'not initialized'
                  : s.status === 'out-of-sync' || s.status === 'pointer-mismatch'
                  ? `out of sync — recorded ${s.recordedSha ? s.recordedSha.slice(0, 7) : '—'}`
                  : s.isDirty || s.status === 'modified-content'
                  ? 'modified content'
                  : s.status === 'merge-conflict'
                  ? 'merge conflict'
                  : 'up to date';

                const stateColor = isAttention ? 'var(--warn)' : 'var(--fg3)';
                const shaDisplay = s.sha ? s.sha.slice(0, 7) : '—';

                return (
                  <div
                    key={i}
                    onClick={e => handleMenu(e, s)}
                    onContextMenu={e => handleMenu(e, s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-4)',
                      height: '42px',
                      paddingRight: 'var(--space-4)',
                      paddingLeft: '14px',
                      cursor: 'pointer',
                      borderLeft: `2px solid ${mark}`
                    }}
                    className="gc-hover-bg"
                  >
                    <i className={`ph ${icon}`} style={{ fontSize: '16px', color: dot }} />
                    <span
                      style={{
                        width: '210px',
                        flex: '0 0 auto',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12.5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {s.path}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: '11.5px',
                        color: 'var(--fg3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {s.url || '—'}
                    </span>
                    <span style={{ fontSize: '11px', color: stateColor }}>{stateText}</span>
                    <span
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--iris)' }}
                    >
                      {shaDisplay}
                    </span>
                    <i className="ph ph-dots-three" style={{ fontSize: '15px', color: 'var(--fg3)' }} />
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
