import React, { useEffect, useState } from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { useKeybinding } from '../../hooks/useKeybindings';
import { ResizeHandle } from '../common/ResizeHandle';
import { tauriGitBackend } from '../../services/tauriGitBackend';
import { IntegratedTerminal } from './IntegratedTerminal';

type BottomPanelTab = 'output' | 'terminal';

interface BottomPanelState {
  activeTab: BottomPanelTab;
  tabOrder: BottomPanelTab[];
}

const BOTTOM_PANEL_STATE_KEY = 'ag_bottom_panel_tabs';
const BOTTOM_PANEL_TABS: Array<{ id: BottomPanelTab; label: string }> = [
  { id: 'output', label: 'Output' },
  { id: 'terminal', label: 'Terminal' }
];
let terminalSessionSequence = 0;

function createTerminalSessionId() {
  terminalSessionSequence += 1;
  return `bottom-panel-terminal-${Date.now()}-${terminalSessionSequence}`;
}

function loadBottomPanelState(): BottomPanelState {
  const fallback: BottomPanelState = { activeTab: 'output', tabOrder: ['output', 'terminal'] };

  try {
    const raw = localStorage.getItem(BOTTOM_PANEL_STATE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<BottomPanelState>;
    const tabOrder = parsed.tabOrder;
    const isValidOrder =
      Array.isArray(tabOrder) &&
      tabOrder.length === BOTTOM_PANEL_TABS.length &&
      new Set(tabOrder).size === BOTTOM_PANEL_TABS.length &&
      tabOrder.every(tab => BOTTOM_PANEL_TABS.some(candidate => candidate.id === tab));
    const activeTab = parsed.activeTab;

    return {
      tabOrder: isValidOrder ? tabOrder : fallback.tabOrder,
      activeTab: activeTab === 'terminal' ? activeTab : 'output'
    };
  } catch {
    return fallback;
  }
}

export const ConsoleDrawer: React.FC = () => {
  const { consoleOpen, setConsoleOpen, consoleLines, clearConsole, toggleConsole, repoPath, confirm } =
    useGitClient();
  const [panelState, setPanelState] = useState<BottomPanelState>(loadBottomPanelState);
  const [focusSignal, setFocusSignal] = useState(0);
  const [terminalActivated, setTerminalActivated] = useState(
    () => loadBottomPanelState().activeTab === 'terminal'
  );
  // Created lazily: an id minted before the Terminal tab is ever shown would become a stray second
  // pane the first time "new terminal" appends to the list.
  const [terminalSessionIds, setTerminalSessionIds] = useState<string[]>(() =>
    loadBottomPanelState().activeTab === 'terminal' ? [createTerminalSessionId()] : []
  );
  const [draggedTab, setDraggedTab] = useState<BottomPanelTab | null>(null);
  const { activeTab, tabOrder } = panelState;

  useEffect(() => {
    try {
      localStorage.setItem(BOTTOM_PANEL_STATE_KEY, JSON.stringify(panelState));
    } catch {
      // Keep the panel usable if browser storage is unavailable.
    }
  }, [panelState]);

  useEffect(() => {
    if (consoleOpen && activeTab === 'terminal' && !terminalActivated) {
      setTerminalActivated(true);
      setTerminalSessionIds(previous =>
        previous.length ? previous : [createTerminalSessionId()]
      );
    }
  }, [activeTab, consoleOpen, terminalActivated]);

  // Terminals deliberately survive hiding the panel: Ctrl+` is a toggle, and tearing the panes down
  // would unmount IntegratedTerminal and stop the PTY, killing whatever is running in it.

  const consolePanel = useResizablePanel({
    storageKey: 'ag_panel_console_height',
    defaultSize: 200,
    minSize: 100,
    maxSize: 600,
    direction: 'vertical',
    reverse: true
  });

  const activateTerminal = () => {
    setTerminalActivated(true);
    setTerminalSessionIds(previous => (previous.length ? previous : [createTerminalSessionId()]));
  };

  const clearTerminal = (sessionId: string) => {
    const command = navigator.userAgent.includes('Windows') ? 'cls\r' : 'clear\r';
    void tauriGitBackend.writeTerminal(sessionId, command).catch(() => {});
  };

  const splitTerminal = () => {
    setTerminalSessionIds(previous => [...previous, createTerminalSessionId()]);
  };

  const removeTerminal = (sessionId: string) => {
    const isFinalTerminal = terminalSessionIds.length === 1;
    setTerminalSessionIds(previous => previous.filter(id => id !== sessionId));
    if (isFinalTerminal) {
      setTerminalActivated(false);
      toggleConsole();
    }
  };

  // Ctrl+` — VS Code parity: close when the Terminal tab is already showing, otherwise reveal it.
  useKeybinding('terminal.toggle', () => {
    if (consoleOpen && activeTab === 'terminal') {
      setConsoleOpen(false);
      return;
    }
    setPanelState(previous => ({ ...previous, activeTab: 'terminal' }));
    activateTerminal();
    setConsoleOpen(true);
    setFocusSignal(previous => previous + 1);
  });

  // Ctrl+Shift+` — always adds a pane, matching the header's Split action.
  useKeybinding('terminal.new', () => {
    setPanelState(previous => ({ ...previous, activeTab: 'terminal' }));
    setTerminalActivated(true);
    setTerminalSessionIds(previous => [...previous, createTerminalSessionId()]);
    setConsoleOpen(true);
  });

  const killTerminal = () => {
    const targetSessionId = terminalSessionIds[terminalSessionIds.length - 1];
    if (!targetSessionId) return;

    const isFinalTerminal = terminalSessionIds.length <= 1;
    confirm(
      isFinalTerminal ? 'Kill Terminal?' : 'Kill Terminal Pane?',
      isFinalTerminal
        ? 'This will terminate the active terminal session and close the bottom panel.'
        : 'This will terminate this terminal pane and close it.',
      'kill terminal',
      'Kill Terminal',
      () => {
        removeTerminal(targetSessionId);
      }
    );
  };

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
      {consoleOpen && (
        <ResizeHandle
          direction="vertical"
          isDragging={consolePanel.isDragging}
          onMouseDown={consolePanel.handleMouseDown}
          onDoubleClick={consolePanel.resetSize}
          title="Drag to resize console drawer (Double-click to reset)"
        />
      )}
      <div
        style={{
          flex: '0 0 auto',
          height: `${consolePanel.size}px`,
          borderTop: '1px solid var(--line)',
          background: 'var(--panel)',
          display: consoleOpen ? 'flex' : 'none',
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
          {tabOrder.map(tabId => {
            const tab = BOTTOM_PANEL_TABS.find(candidate => candidate.id === tabId)!;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                draggable
                onDragStart={event => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', tab.id);
                  setDraggedTab(tab.id);
                }}
                onDragOver={event => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={event => {
                  event.preventDefault();
                  const source = draggedTab || (event.dataTransfer.getData('text/plain') as BottomPanelTab);
                  if (!tabOrder.includes(source) || source === tab.id) return;

                  const bounds = event.currentTarget.getBoundingClientRect();
                  const insertAfterTarget = event.clientX > bounds.left + bounds.width / 2;

                  setPanelState(previous => {
                    const nextOrder = previous.tabOrder.filter(candidate => candidate !== source);
                    const targetIndex = nextOrder.indexOf(tab.id);
                    nextOrder.splice(targetIndex + (insertAfterTarget ? 1 : 0), 0, source);
                    return { ...previous, tabOrder: nextOrder };
                  });
                  setDraggedTab(null);
                }}
                onDragEnd={() => setDraggedTab(null)}
                onClick={() => {
                  setPanelState(previous => ({ ...previous, activeTab: tab.id }));
                  if (tab.id === 'terminal') activateTerminal();
                }}
                style={{
                  alignSelf: 'stretch',
                  padding: '0 var(--space-3)',
                  border: 0,
                  borderBottom: activeTab === tab.id ? '1px solid var(--color-accent)' : '1px solid transparent',
                  background: 'transparent',
                  color: activeTab === tab.id ? 'var(--fg)' : 'var(--fg3)',
                  cursor: draggedTab === tab.id ? 'grabbing' : 'grab',
                  fontFamily: 'var(--font-body)',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                {tab.label}
              </button>
            );
          })}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeTab === 'output' && (
              <Button
                variant="secondary"
                style={{ height: '20px', fontSize: '11px', padding: '0 6px' }}
                onClick={clearConsole}
              >
                Clear
              </Button>
            )}
            {activeTab === 'terminal' && (
              <>
                <Button
                  variant="secondary"
                  style={{
                    height: '20px',
                    fontSize: '11px',
                    padding: '0 6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Split Terminal"
                  aria-label="Split Terminal"
                  onClick={splitTerminal}
                >
                  <i className="ph ph-columns" style={{ fontSize: '12px' }} />
                  <span>Split</span>
                </Button>
                <Button
                  variant="secondary"
                  style={{
                    height: '20px',
                    fontSize: '11px',
                    padding: '0 6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Kill Terminal"
                  aria-label="Kill Terminal"
                  onClick={killTerminal}
                >
                  <i className="ph ph-trash" style={{ fontSize: '12px' }} />
                  <span>Kill</span>
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              style={{ height: '20px', fontSize: '11px', padding: '0 6px' }}
              onClick={toggleConsole}
            >
              Hide
            </Button>
          </div>
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
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${terminalSessionIds.length}, minmax(0, 1fr))`
            }}
          >
            {terminalSessionIds.map((sessionId, index) => (
              <div
                key={sessionId}
                style={{
                  display: 'flex',
                  minWidth: 0,
                  minHeight: 0,
                  borderLeft: index === 0 ? undefined : '1px solid var(--line)'
                }}
              >
                <IntegratedTerminal
                  repoPath={repoPath}
                  sessionId={sessionId}
                  focusSignal={index === terminalSessionIds.length - 1 ? focusSignal : 0}
                  onClear={() => clearTerminal(sessionId)}
                  onSplit={splitTerminal}
                  onExit={() => removeTerminal(sessionId)}
                  onKill={() => removeTerminal(sessionId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
