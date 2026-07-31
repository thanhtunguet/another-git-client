import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from './Button';

export const Dialog: React.FC = () => {
  const { dialog, closeDialog, confirmDialog } = useGitClient();

  if (!dialog) return null;

  return (
    <div className="dialog-backdrop" style={{ zIndex: 80 }}>
      <div className="dialog" style={{ animation: 'popIn .1s ease-out' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <i className="ph ph-warning-circle" style={{ fontSize: '20px', color: 'var(--del)' }} />
          <div>
            <div className="dialog-title" style={{ fontSize: '18px' }}>
              {dialog.title}
            </div>
            <div className="dialog-body" style={{ marginTop: 'var(--space-2)', textWrap: 'pretty' }}>
              {dialog.body}
            </div>
          </div>
        </div>
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
            style={{ height: '28px', color: 'var(--del)', borderColor: 'var(--del)' }}
            onClick={confirmDialog}
          >
            {dialog.action}
          </Button>
        </div>
      </div>
    </div>
  );
};
