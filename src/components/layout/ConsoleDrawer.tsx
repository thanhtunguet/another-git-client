import React, { useState } from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { ResizeHandle } from '../common/ResizeHandle';
import { IntegratedTerminal } from './IntegratedTerminal';

export const ConsoleDrawer: React.FC = () => {
  const { consoleOpen, consoleLines, clearConsole, toggleConsole, repoPath } = useGitClient();
  const [activeTab, setActiveTab] = useState<'output' | 'terminal'>('output');
  const [terminalActivated, setTerminalActivated] = useState(false);

  const consolePanel = useResizablePanel({
    storageKey: 'ag_panel_console_height',
    defaultSize: 200,
    minSize: 100,
    maxSize: 600,
    direction: 'vertical',
    reverse: true
  });

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
    <>
      <ResizeHandle
        direction="vertical"
        isDragging={consolePanel.isDragging}
        onMouseDown={consolePanel.handleMouseDown}
        onDoubleClick={consolePanel.resetSize}
        title="Drag to resize console drawer (Double-click to reset)"
      />
      <div
        style={{
          flex: '0 0 auto',
          height: `${consolePanel.size}px`,
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
            padding: '0 var(--space-3)',
            borderBottom: '1px solid var(--line)'
          }}
        >
          {[
            { id: 'output' as const, label: 'Output' },
            { id: 'terminal' as const, label: 'Terminal' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'terminal') setTerminalActivated(true);
            }}
              style={{
                alignSelf: 'stretch',
                padding: '0 var(--space-3)',
                border: 0,
                borderBottom:
                  activeTab === tab.id ? '1px solid var(--color-accent)' : '1px solid transparent',
                background: 'transparent',
                color: activeTab === tab.id ? 'var(--fg)' : 'var(--fg3)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '10.5px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              {tab.label}
            </button>
          ))}
          <span
            style={{
              marginLeft: 'var(--space-2)',
              fontSize: '11px',
              color: 'var(--fg3)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {activeTab === 'output' ? lastStatus : repoPath || 'no repository open'}
          </span>
          <div style={{ flex: 1 }} />
          {activeTab === 'output' && (
            <Button
              variant="secondary"
              style={{ height: '20px', fontSize: '11px' }}
              onClick={clearConsole}
            >
              Clear
            </Button>
          )}
          <Button
            variant="secondary"
            style={{ height: '20px', fontSize: '11px' }}
            onClick={toggleConsole}
          >
            Hide
          </Button>
        </div>
      <div
        role="tabpanel"
        hidden={activeTab !== 'output'}
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
      {terminalActivated && (
        <div
          role="tabpanel"
          hidden={activeTab !== 'terminal'}
          style={{ flex: 1, minHeight: 0, display: 'flex' }}
        >
          <IntegratedTerminal repoPath={repoPath} />
        </div>
      )}
      </div>
    </>
  );
};
