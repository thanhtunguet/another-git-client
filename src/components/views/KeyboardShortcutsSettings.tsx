import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { setKeybindingCaptureActive } from '../../hooks/useKeybindings';
import { Input } from '../common/FormControls';
import { Button } from '../common/Button';
import {
  KEYBINDING_COMMANDS,
  bindingFromEvent,
  findConflicts,
  formatBinding,
  isBlockedBinding,
  isMacPlatform,
  normalizeBinding,
  type KeybindingCommand
} from '../../services/keybindings';

const MODIFIER_ONLY_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'CapsLock', 'AltGraph']);

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="gc-kbd">{children}</span>
);

export const KeyboardShortcutsSettings: React.FC = () => {
  const { keybindings, setKeybinding, resetKeybinding, resetAllKeybindings } = useGitClient();
  const [query, setQuery] = useState('');
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [pendingBinding, setPendingBinding] = useState('');
  const [rejected, setRejected] = useState('');
  const recorderRef = useRef<HTMLButtonElement>(null);
  const isMac = useMemo(() => isMacPlatform(), []);

  const conflicts = useMemo(() => findConflicts(keybindings), [keybindings]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = KEYBINDING_COMMANDS.filter(command => {
      if (!needle) return true;
      const binding = formatBinding(keybindings[command.id] || '', isMac).toLowerCase();
      return (
        command.label.toLowerCase().includes(needle) ||
        command.category.toLowerCase().includes(needle) ||
        command.id.toLowerCase().includes(needle) ||
        binding.includes(needle)
      );
    });

    const byCategory = new Map<string, KeybindingCommand[]>();
    matches.forEach(command => {
      const existing = byCategory.get(command.category);
      if (existing) existing.push(command);
      else byCategory.set(command.category, [command]);
    });
    return [...byCategory.entries()];
  }, [query, keybindings, isMac]);

  // Global chords must stay inert while a chord is being recorded.
  useEffect(() => {
    setKeybindingCaptureActive(recordingId !== null);
    return () => setKeybindingCaptureActive(false);
  }, [recordingId]);

  useEffect(() => {
    if (recordingId) recorderRef.current?.focus();
  }, [recordingId]);

  const stopRecording = () => {
    setRecordingId(null);
    setPendingBinding('');
    setRejected('');
  };

  const handleRecorderKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!recordingId) return;

    const nativeEvent = event.nativeEvent;

    // Escape cancels and Backspace unassigns, but only on their own — as part of a chord they bind.
    const isBare = !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey;
    if (isBare && event.key === 'Escape') {
      stopRecording();
      return;
    }
    if (isBare && event.key === 'Backspace') {
      setKeybinding(recordingId, '');
      stopRecording();
      return;
    }

    if (MODIFIER_ONLY_KEYS.has(event.key)) {
      // Show the modifiers as they accumulate, but wait for a real key.
      const modifiers = [
        event.ctrlKey ? 'ctrl' : '',
        event.altKey ? 'alt' : '',
        event.shiftKey ? 'shift' : '',
        event.metaKey ? 'meta' : ''
      ].filter(Boolean);
      setPendingBinding(modifiers.join('+'));
      return;
    }

    const binding = bindingFromEvent(nativeEvent);
    if (!binding) return;

    if (isBlockedBinding(binding)) {
      // Keep recording — the user simply cannot have this one.
      setRejected(formatBinding(binding, isMac));
      setPendingBinding('');
      return;
    }

    setKeybinding(recordingId, binding);
    stopRecording();
  };

  const renderBindingCell = (command: KeybindingCommand) => {
    const binding = keybindings[command.id] || '';
    const isRecording = recordingId === command.id;
    const hasConflict = conflicts.has(command.id);
    const isCustom = binding !== normalizeBinding(command.defaultBinding);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button
          ref={isRecording ? recorderRef : undefined}
          type="button"
          onClick={() => {
            if (isRecording) {
              stopRecording();
              return;
            }
            setRejected('');
            setPendingBinding('');
            setRecordingId(command.id);
          }}
          onKeyDown={isRecording ? handleRecorderKeyDown : undefined}
          onBlur={isRecording ? stopRecording : undefined}
          title={isRecording ? 'Press a chord — Esc cancels, Backspace unassigns' : 'Click to rebind'}
          style={{
            minWidth: '132px',
            height: '24px',
            padding: '0 var(--space-2)',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            color: isRecording ? 'var(--fg)' : binding ? 'var(--fg2)' : 'var(--fg3)',
            background: isRecording ? 'var(--raised2)' : 'transparent',
            border: `1px solid ${
              isRecording ? 'var(--color-accent)' : hasConflict ? 'var(--warn)' : 'var(--line2)'
            }`,
            borderRadius: 'var(--radius-sm)'
          }}
        >
          {isRecording
            ? pendingBinding
              ? `${formatBinding(`${pendingBinding}+…`, isMac)}`
              : 'Press a chord…'
            : binding
              ? formatBinding(binding, isMac)
              : 'Unassigned'}
        </button>

        {isRecording && rejected && (
          <span style={{ fontSize: '11px', color: 'var(--warn)' }}>
            {rejected} is reserved by the system
          </span>
        )}

        {hasConflict && !isRecording && (
          <span
            title="Another command uses this chord"
            style={{ fontSize: '11px', color: 'var(--warn)' }}
          >
            conflict
          </span>
        )}

        {isCustom && !isRecording && (
          <Button
            variant="ghost"
            style={{ height: '22px', fontSize: '11px', padding: '0 6px' }}
            title="Restore default"
            onClick={() => resetKeybinding(command.id)}
          >
            Reset
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <Input
          id="keybinding-search"
          value={query}
          placeholder="Search commands or chords"
          onChange={event => setQuery(event.target.value)}
          style={{ flex: 1, minHeight: 0, height: '26px', fontSize: '12px' }}
        />
        <Button
          variant="secondary"
          style={{ height: '26px', fontSize: '11.5px', padding: '0 var(--space-3)' }}
          onClick={resetAllKeybindings}
        >
          Reset all
        </Button>
      </div>

      <p style={{ fontSize: '11px', color: 'var(--fg3)', marginBottom: 'var(--space-4)' }}>
        Click a chord to rebind it. <Kbd>Esc</Kbd> cancels, <Kbd>⌫</Kbd> clears the binding. Terminal
        shortcuts use <Kbd>Ctrl</Kbd> on every platform, matching VS Code.
      </p>

      {groups.map(([category, commands]) => (
        <div key={category} style={{ marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--fg3)',
              marginBottom: 'var(--space-2)'
            }}
          >
            {category}
          </div>
          {commands.map(command => (
            <div
              key={command.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: 'var(--space-6)',
                alignItems: 'center',
                padding: 'var(--space-1) 0'
              }}
            >
              <div>
                <div style={{ fontSize: '12.5px' }}>{command.label}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
                  {command.id}
                </div>
              </div>
              {renderBindingCell(command)}
            </div>
          ))}
        </div>
      ))}

      {!groups.length && (
        <div style={{ fontSize: '12px', color: 'var(--fg3)' }}>No commands match “{query}”.</div>
      )}
    </div>
  );
};
