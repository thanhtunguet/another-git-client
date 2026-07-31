import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from './Button';

export const ProgressToast: React.FC = () => {
  const { toast, toastPct, cancelToast } = useGitClient();

  if (!toast) return null;

  return (
    <div className="card elev-md gc-progress-toast">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 500, flex: 1 }}>{toast.title}</span>
        <Button variant="secondary" style={{ height: '19px', fontSize: '10.5px' }} onClick={cancelToast}>
          Cancel
        </Button>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--fg3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {toast.detail}
      </div>
      <div style={{ height: '3px', borderRadius: '2px', background: 'var(--raised2)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${toastPct}%`,
            background: 'var(--color-accent)',
            transition: 'width .3s linear'
          }}
        />
      </div>
    </div>
  );
};
