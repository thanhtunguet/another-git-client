import React, { useEffect, useState } from 'react';
import { Button } from './Button';

type ResetMode = 'soft' | 'mixed' | 'hard';

const RESET_OPTIONS: Array<{ mode: ResetMode; title: string; description: string }> = [
  {
    mode: 'soft',
    title: 'Soft',
    description: 'Moves HEAD only. Staged and working-tree changes are kept.'
  },
  {
    mode: 'mixed',
    title: 'Mixed',
    description: 'Moves HEAD and unstages changes. Working-tree changes are kept.'
  },
  {
    mode: 'hard',
    title: 'Hard',
    description: 'Moves HEAD and permanently discards all staged and working-tree changes.'
  }
];

export interface ResetDialogProps {
  reference: string | null;
  currentBranch: string;
  onClose: () => void;
  onReset: (reference: string, mode: ResetMode) => void;
}

export const ResetDialog: React.FC<ResetDialogProps> = ({
  reference,
  currentBranch,
  onClose,
  onReset
}) => {
  const [mode, setMode] = useState<ResetMode>('mixed');

  useEffect(() => {
    if (reference) {
      setMode('mixed');
    }
  }, [reference]);

  if (!reference) {
    return null;
  }

  const runReset = () => {
    onClose();
    onReset(reference, mode);
  };

  return (
    <div className="dialog-backdrop" style={{ zIndex: 90 }} onClick={onClose}>
      <div
        className="dialog"
        style={{ animation: 'popIn .1s ease-out' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-dialog-title"
        onClick={event => event.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <i
            className="ph ph-arrow-counter-clockwise"
            style={{ fontSize: '20px', color: 'var(--del)' }}
          />
          <div>
            <div id="reset-dialog-title" className="dialog-title" style={{ fontSize: '18px' }}>
              Reset {currentBranch || 'HEAD'} to {reference}?
            </div>
            <div
              className="dialog-body"
              style={{ marginTop: 'var(--space-2)', textWrap: 'pretty' }}
            >
              Choose how Git should preserve the current index and working tree.
            </div>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Reset mode"
          style={{ display: 'grid', gap: 'var(--space-2)' }}
        >
          {RESET_OPTIONS.map(option => {
            const selected = mode === option.mode;
            return (
              <label
                key={option.mode}
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  alignItems: 'flex-start',
                  padding: 'var(--space-3)',
                  border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--line)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: selected ? 'var(--sel)' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="reset-mode"
                  value={option.mode}
                  checked={selected}
                  onChange={() => setMode(option.mode)}
                  style={{ marginTop: '3px', accentColor: 'var(--color-accent)' }}
                />
                <span>
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      color: option.mode === 'hard' ? 'var(--del)' : 'var(--fg)'
                    }}
                  >
                    {option.title}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: '2px',
                      fontSize: '12px',
                      color: 'var(--fg2)',
                      lineHeight: 1.45
                    }}
                  >
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div
          style={{
            padding: 'var(--space-3)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            color: 'var(--fg2)'
          }}
        >
          git reset --{mode} {reference}
        </div>

        <div className="dialog-actions">
          <Button variant="secondary" style={{ height: '28px' }} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            style={
              mode === 'hard'
                ? { height: '28px', color: 'var(--del)', borderColor: 'var(--del)' }
                : { height: '28px' }
            }
            onClick={runReset}
          >
            Reset --{mode}
          </Button>
        </div>
      </div>
    </div>
  );
};
