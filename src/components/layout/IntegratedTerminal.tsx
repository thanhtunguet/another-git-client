import React, { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { tauriGitBackend } from '../../services/tauriGitBackend';

interface TerminalOutput {
  sessionId: string;
  data: string;
}

interface IntegratedTerminalProps {
  repoPath: string;
}

const TERMINAL_SESSION_ID = 'bottom-panel-terminal';

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({ repoPath }) => {
  const hostRef = useRef<HTMLDivElement>(null);

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
        void tauriGitBackend.resizeTerminal(TERMINAL_SESSION_ID, { cols, rows }).catch(() => {});
      } catch {
        // Ignore dimensions while the panel is hidden or detached.
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const inputSubscription = terminal.onData(data => {
      void tauriGitBackend.writeTerminal(TERMINAL_SESSION_ID, data).catch(error => {
        terminal.writeln(`\r\nTerminal input failed: ${String(error)}`);
      });
    });
    const unlisten = listen<TerminalOutput>('terminal-output', event => {
      if (event.payload.sessionId === TERMINAL_SESSION_ID) {
        terminal.write(event.payload.data);
      }
    });

    void tauriGitBackend
      .startTerminal(TERMINAL_SESSION_ID, repoPath, { cols: terminal.cols, rows: terminal.rows })
      .then(() => {
        resize();
        terminal.focus();
      })
      .catch(error => {
        terminal.writeln(`Terminal could not start: ${String(error)}`);
      });

    return () => {
      resizeObserver.disconnect();
      inputSubscription.dispose();
      void unlisten.then(stopListening => stopListening());
      terminal.dispose();
    };
  }, [repoPath]);

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
      style={{ flex: 1, minHeight: 0, padding: 'var(--space-2) var(--space-3)' }}
    />
  );
};
