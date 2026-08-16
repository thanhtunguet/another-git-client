import { useEffect, useRef } from 'react';
import {
  getKeybindingCommand,
  resolveBindings,
  resolveCommandForEvent,
  type KeybindingCommandId,
  type KeybindingMap
} from '../services/keybindings';

/**
 * Returning `false` declines the chord: the next registered handler gets a turn and, if none
 * handles it, the browser default is left alone.
 */
export type KeybindingHandler = (event: KeyboardEvent) => void | boolean;

interface HandlerEntry {
  handler: KeybindingHandler;
}

// Module-level so non-React callers (the xterm key filter) can consult the same state.
const handlerEntries = new Map<string, HandlerEntry[]>();
let activeBindings: KeybindingMap = resolveBindings();
let captureActive = false;

export function getActiveKeybindings(): KeybindingMap {
  return activeBindings;
}

/**
 * Suspends global dispatch while the settings tab is recording a chord, so pressing e.g. Cmd+O to
 * assign it does not also open a repository.
 */
export function setKeybindingCaptureActive(active: boolean): void {
  captureActive = active;
}

export function isKeybindingCaptureActive(): boolean {
  return captureActive;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}

/** True when the event maps to an app command that would run right now. */
export function isAppKeybindingEvent(event: KeyboardEvent): boolean {
  if (captureActive) return false;
  const commandId = resolveCommandForEvent(event, activeBindings);
  if (!commandId) return false;
  const command = getKeybindingCommand(commandId);
  if (!command) return false;
  if (!command.allowInEditable && isEditableTarget(event.target)) return false;
  return (handlerEntries.get(commandId)?.length ?? 0) > 0;
}

function dispatch(event: KeyboardEvent): void {
  if (captureActive || event.defaultPrevented) return;
  // Auto-repeat would flap toggles while a chord is held; IME composition isn't a chord.
  if (event.repeat || event.isComposing || event.keyCode === 229) return;

  const commandId = resolveCommandForEvent(event, activeBindings);
  if (!commandId) return;

  const command = getKeybindingCommand(commandId);
  if (!command) return;
  if (!command.allowInEditable && isEditableTarget(event.target)) return;

  const entries = handlerEntries.get(commandId);
  if (!entries?.length) return;

  // Most recently mounted handler wins, so a focused view can shadow a provider-level default.
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index].handler(event) !== false) {
      event.preventDefault();
      return;
    }
  }
}

/**
 * Installs the single window-level listener and keeps the module's binding map in sync. Call once,
 * from the provider.
 */
export function useKeybindingRoot(bindings: KeybindingMap): void {
  activeBindings = bindings;

  useEffect(() => {
    activeBindings = bindings;
  }, [bindings]);

  useEffect(() => {
    // Bubble phase, deliberately. DiffViewer and GraphView register *capture* listeners on window
    // that stopPropagation() to pre-empt global handling (split-diff Cmd+A, inline-diff Escape).
    // Moving this dispatcher to capture would run it before them and break both.
    window.addEventListener('keydown', dispatch);
    return () => window.removeEventListener('keydown', dispatch);
  }, []);
}

/** Registers `handler` for a command for as long as the component is mounted. */
export function useKeybinding(
  commandId: KeybindingCommandId,
  handler: KeybindingHandler,
  enabled: boolean = true
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    // Stable entry whose handler always reads the latest render's closure.
    const entry: HandlerEntry = { handler: event => handlerRef.current(event) };
    const entries = handlerEntries.get(commandId) || [];
    entries.push(entry);
    handlerEntries.set(commandId, entries);

    return () => {
      const current = handlerEntries.get(commandId);
      if (!current) return;
      const index = current.indexOf(entry);
      if (index >= 0) current.splice(index, 1);
      if (!current.length) handlerEntries.delete(commandId);
    };
  }, [commandId, enabled]);
}
