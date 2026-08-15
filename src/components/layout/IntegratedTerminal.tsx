import React, { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useGitClient } from '../../context/GitClientContext';
import { tauriGitBackend } from '../../services/tauriGitBackend';

interface TerminalOutput {
  sessionId: string;
  data: string;
}

interface IntegratedTerminalProps {
  repoPath: string;
  sessionId: string;
  onClearAll: () => void;
  onSplit: () => void;
  onExit: () => void;
  onKill: () => void;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  repoPath,
  sessionId,
  onClearAll,
  onSplit,
  onExit,
  onKill
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const onExitRef = useRef(onExit);
  const { openMenu } = useGitClient();

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !repoPath) return;

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      lineHeight: 1.25,
      theme: {
        background: '#00000000',
        foreground: '#d6d8de',
        cursor: '#69b7ff',
        selectionBackground: '#69b7ff44'
      }
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(host);

    const resize = () => {
      try {
        fitAddon.fit();
        const { cols, rows } = terminal;
        void tauriGitBackend.resizeTerminal(sessionId, { cols, rows }).catch(() => {});
      } catch {
        // Ignore dimensions while the panel is hidden or detached.
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    let command = '';
    let disposed = false;
    const inputSubscription = terminal.onData(data => {
      if (data === '\r') {
        if (command.trim() === 'exit') {
          void tauriGitBackend.stopTerminal(sessionId).finally(() => onExitRef.current());
          return;
        }
        command = '';
      } else if (data === '\u007f' || data === '\b') {
        command = command.slice(0, -1);
      } else if (data === '\u0003' || data === '\u000c') {
        command = '';
      } else if (!data.includes('\u001b')) {
        command += data;
      }

      void tauriGitBackend.writeTerminal(sessionId, data).catch(error => {
        terminal.writeln(`\r\nTerminal input failed: ${String(error)}`);
      });
    });
    const unlisten = listen<TerminalOutput>('terminal-output', event => {
      if (event.payload.sessionId === sessionId) {
        terminal.write(event.payload.data);
      }
    });

    void tauriGitBackend
      .startTerminal(sessionId, repoPath, { cols: terminal.cols, rows: terminal.rows })
      .then(() => {
        if (disposed) {
          void tauriGitBackend.stopTerminal(sessionId).catch(() => {});
          return;
        }
        resize();
        terminal.focus();
      })
      .catch(error => {
        if (!disposed) terminal.writeln(`Terminal could not start: ${String(error)}`);
      });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      inputSubscription.dispose();
      void unlisten.then(stopListening => stopListening());
      void tauriGitBackend.stopTerminal(sessionId).catch(() => {});
      terminal.dispose();
    };
  }, [repoPath, sessionId]);

  if (!repoPath) {
    return (
      <div
        style={{ padding: 'var(--space-3)', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}
      >
        Open a repository to start an integrated terminal.
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      aria-label="Integrated terminal"
      onContextMenu={event => {
        event.preventDefault();
        openMenu(event, 'Terminal', [
          { label: 'Clear All', run: onClearAll },
          { label: 'Split Terminal', run: onSplit },
          { sep: true },
          { label: 'Kill Terminal', danger: true, run: onKill }
        ]);
      }}
      style={{ flex: 1, minWidth: 0, minHeight: 0, padding: 'var(--space-2) var(--space-3)' }}
    />
  );
};
