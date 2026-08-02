export type Theme = 'dark' | 'light';

export type GitClientView =
  | 'branches'
  | 'graph'
  | 'details'
  | 'compare'
  | 'diff'
  | 'worktrees'
  | 'submodules'
  | 'settings'
  | 'components';

export type CommitRaw = [
  subject: string,
  author: string,
  date: string,
  parents: number[],
  refs: string[]
];

export interface Commit {
  id: number;
  hash: string;
  subject: string;
  author: string;
  date: string;
  parents: number[];
  refs: string[];
}

export interface RefBadge {
  label: string;
  cls: 'tag-accent' | 'tag-accent-2' | 'tag-neutral' | 'tag-outline';
  variant: 'accent' | 'accent-2' | 'neutral' | 'outline';
}

export type DiffFileStatus = 'A' | 'D' | 'M' | 'R' | '?';

export interface DiffFile {
  path: string;
  status: DiffFileStatus;
  add: number;
  del: number;
}

export interface GraphEdge {
  from: number;
  to: number;
  y0: number;
  y1: number;
  color: string;
}

export interface GraphRowData {
  lane: number;
  edges: GraphEdge[];
  after: (number | null)[];
  width: number;
}

export interface GraphData {
  rows: GraphRowData[];
  width: number;
}

export interface BranchTreeNode {
  g?: string;
  n?: string;
  d?: number;
  cur?: boolean;
  folder?: boolean;
  tag?: boolean;
  meta?: string;
  full?: string;
  kind?: 'local' | 'remote';
}

export interface WorktreeItem {
  group?: string;
  branch: string;
  path: string;
  state: string;
  head: string;
  dot: string;
  icon: string;
  mark: string;
}

export interface SubmoduleItem {
  group?: string;
  groupColor?: string;
  path: string;
  url: string;
  state: string;
  sha: string;
  dot: string;
  icon: string;
  mark: string;
  pad?: number;
}

export interface StashItem {
  ref: string;
  msg: string;
  branch: string;
  files: string;
  when: string;
}

export type SettingControlType = 'input' | 'select' | 'checkbox' | 'textarea';

export interface SettingRow {
  label: string;
  hint: string;
  control: SettingControlType;
  defaultValue?: string | boolean;
  options?: string[];
  width?: number;
}

export interface SettingsSection {
  id: string;
  title: string;
  rows: SettingRow[];
}

export type LogLineType = 'cmd' | 'out' | 'ok' | 'err' | 'warn';

export interface LogEntry {
  text: string;
  type: LogLineType;
}

export interface OperationState {
  name: string;
  step: number;
  total: number;
  detail: string;
}

export interface MenuItem {
  label?: string;
  hint?: string;
  danger?: boolean;
  sep?: boolean;
  run?: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  title: string;
  items: MenuItem[];
}

export interface DialogState {
  title: string;
  body: string;
  cmd: string;
  action: string;
  kind?: 'confirm' | 'clone' | 'add-remote' | 'edit-remote';
  run?: () => void;
}

export interface ToastState {
  title: string;
  detail: string;
}

export interface PaletteItem {
  group: string;
  label: string;
  hint?: string;
  run: () => void;
}

export interface FilterState {
  ref: string;
  author: string;
  msg: string;
  from: string;
  to: string;
}

export interface CompareFilterState {
  msg: string;
  author: string;
  excl: string;
  from: string;
  to: string;
  noMerges: boolean;
  matching: boolean;
}

export interface GitClientProps {
  initialTheme?: Theme;
  accent?: string;
  initialView?: GitClientView;
  repoName?: string;
  repoPath?: string;
  currentBranch?: string;
  aheadCount?: number;
  behindCount?: number;
  onFetch?: () => void;
  onPull?: () => void;
  onPush?: () => void;
  className?: string;
  style?: React.CSSProperties;
}
