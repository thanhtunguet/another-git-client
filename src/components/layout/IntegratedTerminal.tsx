import React, { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useGitClient } from '../../context/GitClientContext';
import { isAppKeybindingEvent } from '../../hooks/useKeybindings';
import { tauriGitBackend } from '../../services/tauriGitBackend';

interface TerminalOutput {
  sessionId: string;
  data: string;
}

interface IntegratedTerminalProps {
  repoPath: string;
  sessionId: string;
  /** Any change to this counter (other than the initial 0) pulls focus into this pane. */
  focusSignal?: number;
  onClear: () => void;
  onSplit: () => void;
  onExit: () => void;
  onKill: () => void;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  repoPath,
  sessionId,
  focusSignal = 0,
  onClear,
  onSplit,
  onExit,
  onKill
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const onExitRef = useRef(onExit);
  const terminalRef = useRef<Terminal | null>(null);
  const lifecycleVersionRef = useRef(0);
  const { openMenu } = useGitClient();

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !repoPath) return;

    const computedFont =
      getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() ||
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace';

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: computedFont,
      fontSize: 12,
      lineHeight: 1.2,
      letterSpacing: 0,
      theme: {
        background: '#00000000',
        foreground: '#d6d8de',
        cursor: '#69b7ff',
        selectionBackground: '#69b7ff44'
      }
    });
    // Let app chords (Ctrl+Shift+`, ⌘K, …) reach the window handler instead of the PTY.
    terminal.attachCustomKeyEventHandler(event => {
      if (event.type !== 'keydown') return true;
      return !isAppKeybindingEvent(event);
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(host);
    terminalRef.current = terminal;

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
    const lifecycleVersion = lifecycleVersionRef.current + 1;
    lifecycleVersionRef.current = lifecycleVersion;
    const ownsLifecycle = () => lifecycleVersionRef.current === lifecycleVersion;
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
          if (ownsLifecycle()) void tauriGitBackend.stopTerminal(sessionId).catch(() => {});
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
      void Promise.resolve().then(() => {
        if (ownsLifecycle()) return tauriGitBackend.stopTerminal(sessionId).catch(() => {});
      });
      if (terminalRef.current === terminal) terminalRef.current = null;
      terminal.dispose();
    };
  }, [repoPath, sessionId]);

  useEffect(() => {
    if (!focusSignal) return;
    // The panel may still be laying out when the shortcut fires.
    const frame = requestAnimationFrame(() => terminalRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [focusSignal]);

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
          { label: 'Clear All', run: onClear },
          { label: 'Split Terminal', run: onSplit },
          { sep: true },
          { label: 'Kill Terminal', danger: true, run: onKill }
        ]);
      }}
      style={{ flex: 1, minWidth: 0, minHeight: 0, padding: 'var(--space-2) var(--space-3)' }}
    />
  );
};
