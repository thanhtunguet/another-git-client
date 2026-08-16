export type KeybindingCommandId =
  | 'palette.open'
  | 'settings.open'
  | 'terminal.new'
  | 'terminal.toggle'
  | 'panel.toggleOutput'
  | 'view.branches'
  | 'view.graph'
  | 'view.compare'
  | 'view.worktrees'
  | 'view.submodules'
  | 'branch.checkout'
  | 'git.fetch'
  | 'git.pull'
  | 'git.push'
  | 'commit.staged'
  | 'repo.open'
  | 'compare.selectAll';

export interface KeybindingCommand {
  id: KeybindingCommandId;
  label: string;
  category: string;
  /** Canonical binding string, or '' to ship the command unassigned. */
  defaultBinding: string;
  /** Allow the chord to fire while an input, textarea, or contenteditable has focus. */
  allowInEditable?: boolean;
}

/**
 * `mod` resolves to Cmd on macOS and Ctrl elsewhere. Literal `ctrl` stays Ctrl on every platform,
 * which is what the terminal chords need to match VS Code.
 */
export const KEYBINDING_COMMANDS: KeybindingCommand[] = [
  {
    id: 'palette.open',
    label: 'Quick Git actions',
    category: 'General',
    defaultBinding: 'mod+k',
    allowInEditable: true
  },
  { id: 'settings.open', label: 'Open settings', category: 'General', defaultBinding: 'mod+,' },
  {
    id: 'terminal.new',
    label: 'Create new terminal',
    category: 'Panel',
    defaultBinding: 'ctrl+shift+`',
    allowInEditable: true
  },
  {
    id: 'terminal.toggle',
    label: 'Toggle terminal',
    category: 'Panel',
    defaultBinding: 'ctrl+`',
    allowInEditable: true
  },
  {
    id: 'panel.toggleOutput',
    label: 'Toggle output panel',
    category: 'Panel',
    defaultBinding: 'mod+shift+u'
  },
  { id: 'view.branches', label: 'Go to Branches', category: 'Navigation', defaultBinding: 'mod+1' },
  { id: 'view.graph', label: 'Go to Git Graph', category: 'Navigation', defaultBinding: 'mod+2' },
  {
    id: 'view.compare',
    label: 'Go to Compare Branches',
    category: 'Navigation',
    defaultBinding: 'mod+4'
  },
  {
    id: 'view.worktrees',
    label: 'Go to Worktrees',
    category: 'Navigation',
    defaultBinding: 'mod+6'
  },
  {
    id: 'view.submodules',
    label: 'Go to Submodules',
    category: 'Navigation',
    defaultBinding: 'mod+7'
  },
  { id: 'branch.checkout', label: 'Checkout branch…', category: 'Git', defaultBinding: 'mod+b' },
  { id: 'git.fetch', label: 'Fetch all with prune', category: 'Git', defaultBinding: 'mod+shift+f' },
  { id: 'git.pull', label: 'Pull', category: 'Git', defaultBinding: '' },
  { id: 'git.push', label: 'Push', category: 'Git', defaultBinding: '' },
  {
    id: 'commit.staged',
    label: 'Commit staged changes',
    category: 'Git',
    defaultBinding: 'mod+enter',
    allowInEditable: true
  },
  { id: 'repo.open', label: 'Open repository…', category: 'Repository', defaultBinding: 'mod+o' },
  {
    id: 'compare.selectAll',
    label: 'Select all commits (Compare view)',
    category: 'Compare',
    defaultBinding: 'mod+a'
  }
];

const COMMANDS_BY_ID = new Map<string, KeybindingCommand>(
  KEYBINDING_COMMANDS.map(command => [command.id, command])
);

export function getKeybindingCommand(id: string): KeybindingCommand | undefined {
  return COMMANDS_BY_ID.get(id);
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
}

/** Fixed order so two spellings of the same chord compare equal. */
const MODIFIER_ORDER = ['mod', 'ctrl', 'alt', 'shift', 'meta'] as const;
type Modifier = (typeof MODIFIER_ORDER)[number];

const MODIFIER_ALIASES: Record<string, Modifier> = {
  mod: 'mod',
  cmdorctrl: 'mod',
  commandorcontrol: 'mod',
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
  win: 'meta'
};

/**
 * Physical-key lookup. Matching on `event.code` rather than `event.key` keeps chords stable across
 * modifier states — Shift+Backquote reports `event.key === '~'` on a US layout, which would
 * otherwise stop Ctrl+Shift+` from ever matching.
 */
const CODE_TO_KEY: Record<string, string> = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Space: 'space',
  Enter: 'enter',
  NumpadEnter: 'enter',
  Escape: 'escape',
  Backspace: 'backspace',
  Delete: 'delete',
  Tab: 'tab',
  ArrowUp: 'arrowup',
  ArrowDown: 'arrowdown',
  ArrowLeft: 'arrowleft',
  ArrowRight: 'arrowright',
  Home: 'home',
  End: 'end',
  PageUp: 'pageup',
  PageDown: 'pagedown'
};

const MODIFIER_KEY_NAMES = new Set([
  'control',
  'shift',
  'alt',
  'meta',
  'altgraph',
  'capslock',
  'dead'
]);

export function keyFromEvent(event: KeyboardEvent): string | null {
  const code = event.code || '';

  if (code.startsWith('Key') && code.length === 4) return code.slice(3).toLowerCase();
  if (code.startsWith('Digit') && code.length === 6) return code.slice(5);
  if (code.startsWith('Numpad') && /^Numpad\d$/.test(code)) return code.slice(6);
  if (/^F\d{1,2}$/.test(code)) return code.toLowerCase();
  if (CODE_TO_KEY[code]) return CODE_TO_KEY[code];

  // Unmapped code (non-US layouts, media keys): fall back to the produced character.
  const key = (event.key || '').toLowerCase();
  if (!key || MODIFIER_KEY_NAMES.has(key)) return null;
  return key === ' ' ? 'space' : key;
}

/** Parse any spelling of a chord into `{modifiers, key}`, or null if it has no key. */
function parseBinding(binding: string): { modifiers: Set<Modifier>; key: string } | null {
  const raw = (binding || '').trim().toLowerCase();
  if (!raw) return null;

  // Split on '+' but keep a trailing '+' key (e.g. 'mod++').
  const parts = raw.split('+').filter((part, index, all) => part !== '' || index === all.length - 1);
  if (!parts.length) return null;

  const modifiers = new Set<Modifier>();
  let key = '';

  parts.forEach((part, index) => {
    const token = part === '' ? '+' : part;
    const modifier = MODIFIER_ALIASES[token];
    if (modifier && index < parts.length - 1) {
      modifiers.add(modifier);
      return;
    }
    key = token;
  });

  return key ? { modifiers, key } : null;
}

export function normalizeBinding(binding: string): string {
  const parsed = parseBinding(binding);
  if (!parsed) return '';
  const modifiers = MODIFIER_ORDER.filter(modifier => parsed.modifiers.has(modifier));
  return [...modifiers, parsed.key].join('+');
}

/** Build the canonical chord for a keydown event, using literal ctrl/meta (never `mod`). */
export function bindingFromEvent(event: KeyboardEvent): string {
  const key = keyFromEvent(event);
  if (!key) return '';

  const modifiers: Modifier[] = [];
  if (event.ctrlKey) modifiers.push('ctrl');
  if (event.altKey) modifiers.push('alt');
  if (event.shiftKey) modifiers.push('shift');
  if (event.metaKey) modifiers.push('meta');

  return [...MODIFIER_ORDER.filter(modifier => modifiers.includes(modifier)), key].join('+');
}

export function matchesBinding(event: KeyboardEvent, binding: string): boolean {
  const parsed = parseBinding(binding);
  if (!parsed) return false;

  const key = keyFromEvent(event);
  if (!key || key !== parsed.key) return false;

  const isMac = isMacPlatform();
  const wantsMod = parsed.modifiers.has('mod');
  const wantsCtrl = parsed.modifiers.has('ctrl') || (wantsMod && !isMac);
  const wantsMeta = parsed.modifiers.has('meta') || (wantsMod && isMac);

  return (
    event.ctrlKey === wantsCtrl &&
    event.metaKey === wantsMeta &&
    event.altKey === parsed.modifiers.has('alt') &&
    event.shiftKey === parsed.modifiers.has('shift')
  );
}

const MAC_MODIFIER_GLYPHS: Record<Modifier, string> = {
  mod: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
  meta: '⌘'
};

const MODIFIER_LABELS: Record<Modifier, string> = {
  mod: 'Ctrl',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Win'
};

const MAC_KEY_GLYPHS: Record<string, string> = {
  enter: '↵',
  escape: '⎋',
  backspace: '⌫',
  delete: '⌦',
  tab: '⇥',
  space: '␣',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→'
};

const KEY_LABELS: Record<string, string> = {
  enter: 'Enter',
  escape: 'Esc',
  backspace: 'Backspace',
  delete: 'Delete',
  tab: 'Tab',
  space: 'Space',
  arrowup: 'Up',
  arrowdown: 'Down',
  arrowleft: 'Left',
  arrowright: 'Right',
  pageup: 'PageUp',
  pagedown: 'PageDown'
};

/** Human-readable chord: `⌃⇧\`` on macOS, `Ctrl+Shift+\`` elsewhere. */
export function formatBinding(binding: string, isMac: boolean = isMacPlatform()): string {
  const parsed = parseBinding(binding);
  if (!parsed) return '';

  const modifiers = MODIFIER_ORDER.filter(modifier => parsed.modifiers.has(modifier));
  const key = parsed.key;
  const keyLabel = isMac
    ? MAC_KEY_GLYPHS[key] || (key.length === 1 ? key.toUpperCase() : capitalize(key))
    : KEY_LABELS[key] || (key.length === 1 ? key.toUpperCase() : capitalize(key));

  if (isMac) {
    return [...modifiers.map(modifier => MAC_MODIFIER_GLYPHS[modifier]), keyLabel].join('');
  }
  return [...modifiers.map(modifier => MODIFIER_LABELS[modifier]), keyLabel].join('+');
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Chords the OS or the webview's default menu consumes before the page sees them. Tauri installs
 * the stock macOS menu (src-tauri sets no custom one), so these can never be captured or overridden.
 */
const BLOCKED_BINDINGS = new Set([
  'meta+q',
  'meta+w',
  'meta+m',
  'meta+h',
  'meta+tab',
  'meta+space',
  'alt+meta+h',
  'ctrl+meta+f',
  'alt+f4'
]);

export function isBlockedBinding(binding: string): boolean {
  return BLOCKED_BINDINGS.has(normalizeBinding(binding));
}

export type KeybindingMap = Record<string, string>;

/** Defaults merged with the user's overrides; `''` means deliberately unassigned. */
export function resolveBindings(overrides?: KeybindingMap | null): KeybindingMap {
  const resolved: KeybindingMap = {};
  KEYBINDING_COMMANDS.forEach(command => {
    const override = overrides?.[command.id];
    resolved[command.id] =
      override === undefined ? normalizeBinding(command.defaultBinding) : normalizeBinding(override);
  });
  return resolved;
}

/** Command ids that share a chord with at least one other command. */
export function findConflicts(bindings: KeybindingMap): Set<string> {
  const byBinding = new Map<string, string[]>();
  Object.entries(bindings).forEach(([id, binding]) => {
    if (!binding) return;
    const existing = byBinding.get(binding);
    if (existing) existing.push(id);
    else byBinding.set(binding, [id]);
  });

  const conflicting = new Set<string>();
  byBinding.forEach(ids => {
    if (ids.length > 1) ids.forEach(id => conflicting.add(id));
  });
  return conflicting;
}

export function resolveCommandForEvent(
  event: KeyboardEvent,
  bindings: KeybindingMap
): KeybindingCommandId | null {
  for (const command of KEYBINDING_COMMANDS) {
    const binding = bindings[command.id];
    if (binding && matchesBinding(event, binding)) return command.id;
  }
  return null;
}
