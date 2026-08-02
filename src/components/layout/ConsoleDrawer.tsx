import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';

export const ConsoleDrawer: React.FC = () => {
  const { consoleOpen, consoleLines, clearConsole, toggleConsole } = useGitClient();

  if (!consoleOpen) return null;

  const lastLine = consoleLines[consoleLines.length - 1];
  const lastStatus = lastLine
    ? lastLine.type === 'err'
      ? 'last command failed'
      : lastLine.type === 'warn'
      ? 'last command: warning'
      : 'last command ok'
    : 'no output yet';

  const getColor = (type: string) => {
    switch (type) {
      case 'cmd':
        return 'var(--color-accent)';
      case 'err':
        return 'var(--del)';
      case 'warn':
        return 'var(--warn)';
      case 'ok':
        return 'var(--add)';
      default:
        return 'var(--fg2)';
    }
  };

  return (
    <div
      style={{
        flex: '0 0 auto',
        height: '200px',
        borderTop: '1px solid var(--line)',
        background: 'var(--panel)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          flex: '0 0 auto',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 var(--space-3)',
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
          Output — git
        </span>
        <span style={{ fontSize: '11px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
          {lastStatus}
        </span>
        <div style={{ flex: 1 }} />
        <Button
          variant="secondary"
          style={{ height: '20px', fontSize: '11px' }}
          onClick={clearConsole}
        >
          Clear
        </Button>
        <Button
          variant="secondary"
          style={{ height: '20px', fontSize: '11px' }}
          onClick={toggleConsole}
        >
          Hide
        </Button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-2) var(--space-3)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11.5px',
          lineHeight: 1.6
        }}
      >
        {consoleLines.map((l, i) => (
          <div key={i} style={{ color: getColor(l.type), whiteSpace: 'pre-wrap' }}>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
};
