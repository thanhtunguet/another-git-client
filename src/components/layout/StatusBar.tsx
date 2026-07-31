import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { Tag } from '../common/Tag';

export const StatusBar: React.FC = () => {
  const {
    op,
    opContinue,
    opSkip,
    opAbort,
    currentBranch,
    behindCount,
    aheadCount,
    consoleOpen,
    toggleConsole
  } = useGitClient();

  const consoleChevron = consoleOpen ? 'ph-caret-down' : 'ph-caret-up';

  return (
    <div
      className="gc-statusbar"
      style={{
        background: op ? 'var(--raised)' : 'var(--panel)'
      }}
    >
      {op ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Tag
            variant="outline"
            style={{
              fontSize: '10px',
              padding: '0 6px',
              letterSpacing: '.06em',
              color: 'var(--warn)',
              borderColor: 'var(--warn)'
            }}
          >
            {op.name}
          </Tag>
          <span style={{ color: 'var(--fg2)' }}>{`Step ${op.step} of ${op.total}`}</span>
          <span style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>{op.detail}</span>
          <Button
            variant="primary"
            style={{ height: '18px', fontSize: '10.5px', padding: '0 8px' }}
            onClick={opContinue}
          >
            Continue
          </Button>
          <Button
            variant="secondary"
            style={{ height: '18px', fontSize: '10.5px', padding: '0 8px' }}
            onClick={opSkip}
          >
            Skip
          </Button>
          <Button
            variant="secondary"
            style={{
              height: '18px',
              fontSize: '10.5px',
              padding: '0 8px',
              color: 'var(--del)',
              borderColor: 'var(--del)'
            }}
            onClick={opAbort}
          >
            Abort
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--fg2)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <i
            className="ph ph-git-branch"
            style={{ fontSize: '13px', color: 'var(--color-accent)' }}
          />
          <span>{currentBranch}</span>
          <span style={{ color: 'var(--add)' }}>↓{behindCount}</span>
          <span style={{ color: 'var(--warn)' }}>↑{aheadCount}</span>
          <span style={{ color: 'var(--fg3)' }}>·</span>
          <span>12 changed, 4 staged</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <Button
        variant="ghost"
        style={{ height: '18px', fontSize: '10.5px', color: 'var(--fg3)' }}
        onClick={toggleConsole}
      >
        Output
        <i className={`ph ${consoleChevron}`} style={{ fontSize: '10px' }} />
      </Button>

      <span style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>git 2.51.0</span>
      <span style={{ color: 'var(--fg3)' }}>·</span>
      <span style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>1,284,930 commits</span>
    </div>
  );
};
