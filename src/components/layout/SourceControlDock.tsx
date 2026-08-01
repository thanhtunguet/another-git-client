import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { Textarea, Checkbox } from '../common/FormControls';
import { Card } from '../common/Card';
import { statusColor } from '../../context/GitClientContext';
import { DiffFile } from '../../types/git-client';

export const SourceControlDock: React.FC = () => {
  const {
    dock,
    scTab,
    setScTab,
    setView,
    openMenu,
    toastRun,
    commitMsg,
    setCommitMsg,
    act,
    aiMessage,
    stagedFiles,
    unstagedFiles,
    untrackedFiles
  } = useGitClient();

  if (!dock) return null;

  const stashes = [
    {
      ref: 'stash@{0}',
      msg: 'WIP on feature/mlx5-next: tunnel steering spike',
      branch: 'feature/mlx5-next',
      files: '6 files',
      when: '2h ago'
    },
    {
      ref: 'stash@{1}',
      msg: 'sched: util_est experiment (keep-index)',
      branch: 'main',
      files: '3 files',
      when: 'yesterday'
    },
    {
      ref: 'stash@{2}',
      msg: 'shelved: kernel/sched/fair.c',
      branch: 'main',
      files: '1 file',
      when: '2 days ago'
    },
    {
      ref: 'stash@{3}',
      msg: 'WIP: bisect scratch (untracked included)',
      branch: 'detached',
      files: '11 files',
      when: '5 days ago'
    }
  ];

  const handleFileMenu = (e: React.MouseEvent, f: DiffFile, isStaged: boolean) => {
    openMenu(e, f.path, [
      { label: isStaged ? 'Unstage file' : 'Stage file', run: act('Stage') },
      { label: 'Stage selected hunks…', run: act('Stage hunks') },
      { label: 'Open diff', run: () => setView('diff') },
      { label: 'Compare with Revision…', run: act('Compare with revision') },
      { label: 'Shelve this file', run: act('Shelve file') },
      { sep: true },
      {
        label: 'Discard changes',
        danger: true,
        run: act('Discard')
      }
    ]);
  };

  const handleStashMenu = (e: React.MouseEvent, st: (typeof stashes)[0]) => {
    openMenu(e, st.ref, [
      { label: 'Apply', run: act('Stash apply') },
      { label: 'Pop', run: act('Stash pop') },
      { label: 'Unshelve into working tree', run: act('Unshelve') },
      { label: 'Preview patch', run: () => setView('diff') },
      { label: 'Rename…', run: act('Rename stash') },
      { sep: true },
      { label: 'Drop', danger: true, run: act('Drop stash') }
    ]);
  };

  const handleTemplateMenu = (e: React.MouseEvent) => {
    openMenu(e, 'Message templates', [
      { label: '{scope}: {cursor}', hint: 'kernel', run: act('Apply template') },
      {
        label: 'fix({scope}): {cursor} — Refs {ticket}',
        hint: 'conventional',
        run: act('Apply template')
      },
      { label: '[{branch}] {cursor}', hint: 'branch-tagged', run: act('Apply template') },
      { sep: true },
      { label: 'Edit templates…', run: () => setView('settings') }
    ]);
  };

  return (
    <div className="gc-dock">
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          gap: 'var(--space-2)',
          padding: 'var(--space-2)'
        }}
      >
        <Button
          variant="secondary"
          onClick={() => setScTab('changes')}
          style={{
            flex: 1,
            height: '25px',
            fontSize: '11.5px',
            color: scTab === 'changes' ? 'var(--color-accent)' : 'var(--fg2)',
            boxShadow: scTab === 'changes' ? 'inset 0 0 0 1px var(--color-accent)' : 'none'
          }}
        >
          Changes {stagedFiles.length + unstagedFiles.length + untrackedFiles.length}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setScTab('stash')}
          style={{
            flex: 1,
            height: '25px',
            fontSize: '11.5px',
            color: scTab === 'stash' ? 'var(--color-accent)' : 'var(--fg2)',
            boxShadow: scTab === 'stash' ? 'inset 0 0 0 1px var(--color-accent)' : 'none'
          }}
        >
          Stash 4
        </Button>
      </div>

      {scTab === 'changes' ? (
        <>
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                height: '26px',
                padding: '0 var(--space-3)',
                background: 'var(--raised)',
                borderTop: '1px solid var(--line)',
                borderBottom: '1px solid var(--line)',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}
            >
              <span
                style={{
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: 'var(--fg2)'
                }}
              >
                Staged ({stagedFiles.length})
              </span>
              <div style={{ flex: 1 }} />
              <Button
                variant="ghost"
                style={{ height: '18px', width: '20px', padding: 0 }}
                onClick={act('Unstage all', 'reset HEAD')}
                title="Unstage all"
                aria-label="Unstage all"
              >
                <i className="ph ph-minus-square" style={{ fontSize: '12px' }} />
              </Button>
            </div>
            {stagedFiles.map((f, i) => (
              <div
                key={i}
                onClick={() => setView('diff')}
                onContextMenu={e => handleFileMenu(e, f, true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  height: '24px',
                  padding: '0 var(--space-3)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px'
                }}
                className="gc-hover-bg"
              >
                <span
                  style={{
                    width: '11px',
                    textAlign: 'center',
                    color: statusColor(f.status),
                    fontWeight: 600
                  }}
                >
                  {f.status}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    direction: 'rtl',
                    textAlign: 'left'
                  }}
                >
                  {f.path}
                </span>
                <span
                  style={{ color: 'var(--fg3)', fontSize: '11px' }}
                >{`+${f.add} −${f.del}`}</span>
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                height: '26px',
                padding: '0 var(--space-3)',
                background: 'var(--raised)',
                borderTop: '1px solid var(--line)',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <span
                style={{
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: 'var(--fg2)'
                }}
              >
                Unstaged ({unstagedFiles.length})
              </span>
              <div style={{ flex: 1 }} />
              <Button
                variant="ghost"
                style={{ height: '18px', width: '20px', padding: 0 }}
                onClick={act('Stage all', 'add -A')}
                title="Stage all"
                aria-label="Stage all"
              >
                <i className="ph ph-plus-square" style={{ fontSize: '12px' }} />
              </Button>
            </div>
            {unstagedFiles.map((f, i) => (
              <div
                key={i}
                onClick={() => setView('diff')}
                onContextMenu={e => handleFileMenu(e, f, false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  height: '24px',
                  padding: '0 var(--space-3)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px'
                }}
                className="gc-hover-bg"
              >
                <span
                  style={{
                    width: '11px',
                    textAlign: 'center',
                    color: statusColor(f.status === '?' ? 'A' : f.status),
                    fontWeight: 600
                  }}
                >
                  {f.status}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    direction: 'rtl',
                    textAlign: 'left'
                  }}
                >
                  {f.path}
                </span>
                <Button
                  variant="ghost"
                  style={{ height: '17px', fontSize: '10px', padding: '0 4px' }}
                  onClick={e => {
                    e.stopPropagation();
                    toastRun('Shelving file', f.path.split('/').pop() || '');
                  }}
                  title="Shelve this file"
                >
                  shelve
                </Button>
                <span
                  style={{ color: 'var(--fg3)', fontSize: '11px' }}
                >{`+${f.add} −${f.del}`}</span>
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                height: '26px',
                padding: '0 var(--space-3)',
                background: 'var(--raised)',
                borderTop: '1px solid var(--line)',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <span
                style={{
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: 'var(--fg2)'
                }}
              >
                Not in VCS ({untrackedFiles.length})
              </span>
              <div style={{ flex: 1 }} />
              <Button
                variant="ghost"
                style={{ height: '18px', width: '20px', padding: 0 }}
                onClick={act('Stage untracked', 'add .')}
                title="Stage all"
                aria-label="Stage all"
              >
                <i className="ph ph-plus-square" style={{ fontSize: '12px' }} />
              </Button>
            </div>
            {untrackedFiles.map((f, i) => (
              <div
                key={`untracked-${i}`}
                onClick={() => setView('diff')}
                onContextMenu={e => handleFileMenu(e, f, false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  height: '24px',
                  padding: '0 var(--space-3)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px'
                }}
                className="gc-hover-bg"
              >
                <span
                  style={{
                    width: '11px',
                    textAlign: 'center',
                    color: statusColor('A'),
                    fontWeight: 600
                  }}
                >
                  ?
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    direction: 'rtl',
                    textAlign: 'left'
                  }}
                >
                  {f.path}
                </span>
                <span
                  style={{ color: 'var(--fg3)', fontSize: '11px' }}
                >{`+${f.add} −${f.del}`}</span>
              </div>
            ))}

            <div
              style={{
                padding: 'var(--space-3)',
                borderTop: '1px solid var(--line)',
                marginTop: 'var(--space-2)'
              }}
            >
              <h6 style={{ margin: '0 0 6px', color: 'var(--fg3)' }}>Partial staging</h6>
              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: '4px 8px',
                    background: 'var(--raised)',
                    borderBottom: '1px solid var(--line)'
                  }}
                >
                  <span style={{ color: 'var(--fg3)' }}>@@ -412,7 +412,9 @@</span>
                  <div style={{ flex: 1 }} />
                  <Button
                    variant="ghost"
                    style={{ height: '17px', fontSize: '10px', padding: '0 4px' }}
                    onClick={act('Stage hunk')}
                  >
                    Stage hunk
                  </Button>
                </div>
                <div style={{ padding: '3px 8px', color: 'var(--fg3)', whiteSpace: 'pre' }}>
                  {' '}
                  mlx5e_tx_reporter_err_cqe(sq);
                </div>
                <div
                  style={{
                    padding: '3px 8px',
                    background: 'var(--delbg)',
                    color: 'var(--del)',
                    whiteSpace: 'pre'
                  }}
                >
                  - if (unlikely(!priv-&gt;channels.num))
                </div>
                <div
                  style={{
                    padding: '3px 8px',
                    background: 'var(--addbg)',
                    color: 'var(--add)',
                    whiteSpace: 'pre'
                  }}
                >
                  + if (unlikely(!priv-&gt;channels.num ||
                </div>
                <div
                  style={{
                    padding: '3px 8px',
                    background: 'var(--addbg)',
                    color: 'var(--add)',
                    whiteSpace: 'pre'
                  }}
                >
                  + !test_bit(MLX5E_STATE_OPENED)))
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              flex: '0 0 auto',
              borderTop: '1px solid var(--line)',
              padding: 'var(--space-3)'
            }}
          >
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <Button
                variant="secondary"
                style={{ flex: 1, height: '22px', fontSize: '11px' }}
                onClick={handleTemplateMenu}
              >
                Template <i className="ph ph-caret-down" style={{ fontSize: '10px' }} />
              </Button>
              <Button
                variant="secondary"
                style={{ flex: 1, height: '22px', fontSize: '11px' }}
                onClick={aiMessage}
              >
                <i
                  className="ph ph-sparkle"
                  style={{ fontSize: '12px', color: 'var(--color-accent)' }}
                />{' '}
                Generate
              </Button>
            </div>
            <Textarea
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              rows={4}
              placeholder="Commit message… ⌘↵ to commit"
              style={{ minHeight: '78px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-2)'
              }}
            >
              <Checkbox label="Amend" style={{ fontSize: '11px', color: 'var(--fg2)' }} />
              <div style={{ flex: 1 }} />
              <Button
                variant="primary"
                style={{ height: '26px' }}
                onClick={act('Commit staged changes', 'commit')}
              >
                Commit ⌘↵
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: 'var(--space-2)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              height: '26px',
              padding: '0 var(--space-1)',
              background: 'var(--raised)',
              borderTop: '1px solid var(--line)',
              borderBottom: '1px solid var(--line)',
              marginBottom: 'var(--space-2)'
            }}
          >
            <span
              style={{
                fontSize: '10.5px',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: 'var(--fg2)'
              }}
            >
              Stashes ({stashes.length})
            </span>
            <div style={{ flex: 1 }} />
            <Button
              variant="ghost"
              style={{ height: '18px', width: '20px', padding: 0 }}
              onClick={act('Create stash', 'stash push -u')}
              title="Create stash"
              aria-label="Create stash"
            >
              <i className="ph ph-archive-box" style={{ fontSize: '12px' }} />
            </Button>
          </div>
          {stashes.map((st, i) => (
            <Card
              key={i}
              onClick={e => handleStashMenu(e, st)}
              onContextMenu={e => handleStashMenu(e, st)}
              style={{
                padding: 'var(--space-3)',
                marginBottom: '6px',
                cursor: 'pointer',
                gap: '5px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--color-accent)'
                  }}
                >
                  {st.ref}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {st.msg}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  fontSize: '10.5px',
                  color: 'var(--fg3)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span>{st.branch}</span>
                <span>·</span>
                <span>{st.files}</span>
                <span>·</span>
                <span>{st.when}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
