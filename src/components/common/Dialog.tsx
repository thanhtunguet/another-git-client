import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from './Button';
import { Checkbox, Input } from './FormControls';

export const Dialog: React.FC = () => {
  const {
    dialog,
    closeDialog,
    confirmDialog,
    cloneDialogUrl,
    setCloneDialogUrl,
    cloneDialogUseGit,
    setCloneDialogUseGit
  } = useGitClient();

  if (!dialog) return null;

  const isCloneDialog = dialog.kind === 'clone';

  return (
    <div className="dialog-backdrop" style={{ zIndex: 80 }}>
      <div className="dialog" style={{ animation: 'popIn .1s ease-out' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <i
            className={isCloneDialog ? 'ph ph-download-simple' : 'ph ph-warning-circle'}
            style={{ fontSize: '20px', color: isCloneDialog ? 'var(--color-accent)' : 'var(--del)' }}
          />
          <div>
            <div className="dialog-title" style={{ fontSize: '18px' }}>
              {dialog.title}
            </div>
            <div
              className="dialog-body"
              style={{ marginTop: 'var(--space-2)', textWrap: 'pretty' }}
            >
              {dialog.body}
            </div>
          </div>
        </div>
        {isCloneDialog && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Input
              label="Repository URL"
              value={cloneDialogUrl}
              onChange={e => setCloneDialogUrl(e.target.value)}
              placeholder="https://github.com/owner/repo.git or git@github.com:owner/repo.git"
              autoFocus
            />
            <Checkbox
              checked={cloneDialogUseGit}
              onChange={e => setCloneDialogUseGit(e.currentTarget.checked)}
              label="Replace HTTPS with Git SSH URL"
            />
          </div>
        )}
        {dialog.cmd && (
          <div
            style={{
              padding: 'var(--space-3)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              color: 'var(--fg2)',
              whiteSpace: 'pre-wrap'
            }}
          >
            {dialog.cmd}
          </div>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" style={{ height: '28px' }} onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            variant="primary"
            style={
              isCloneDialog
                ? { height: '28px' }
                : { height: '28px', color: 'var(--del)', borderColor: 'var(--del)' }
            }
            onClick={confirmDialog}
          >
            {dialog.action}
          </Button>
        </div>
      </div>
    </div>
  );
};
