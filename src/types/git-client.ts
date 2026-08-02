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
  settingKey?: string;
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
  kind?: 'confirm' | 'clone' | 'add-remote' | 'edit-remote' | 'prompt';
  run?: (value?: string) => void;
  inputLabel?: string;
  inputRequired?: boolean;
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

export interface GitClientContextType {
  view: GitClientView;
  setView: (v: GitClientView) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  dock: boolean;
  setDock: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDock: () => void;
  consoleOpen: boolean;
  setConsoleOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleConsole: () => void;
  paletteOpen: boolean;
  setPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  paletteQ: string;
  setPaletteQ: (q: string) => void;
  openPalette: () => void;
  closePalette: () => void;
  menu: ContextMenuState | null;
  openMenu: (e: React.MouseEvent | MouseEvent, title: string, items: MenuItem[]) => void;
  closeMenu: (e?: React.MouseEvent | MouseEvent) => void;
  dialog: DialogState | null;
  confirm: (title: string, body: string, cmd: string, action: string, run?: () => void) => void;
  prompt: (title: string, body: string, action: string, defaultValue: string, run?: (value: string) => void) => void;
  closeDialog: () => void;
  confirmDialog: () => void;
  promptDialogValue: string;
  setPromptDialogValue: (value: string) => void;
  cloneDialogUrl: string;
  setCloneDialogUrl: (value: string) => void;
  cloneDialogUseGit: boolean;
  setCloneDialogUseGit: (value: boolean) => void;
  remoteDialogName: string;
  setRemoteDialogName: (value: string) => void;
  remoteDialogUrl: string;
  setRemoteDialogUrl: (value: string) => void;
  toast: ToastState | null;
  toastPct: number;
  toastRun: (title: string, detail: string, done?: () => void) => void;
  cancelToast: () => void;
  op: OperationState | null;
  setOp: React.Dispatch<React.SetStateAction<OperationState | null>>;
  opContinue: () => void;
  opSkip: () => void;
  opAbort: () => void;
  sel: number[];
  setSel: React.Dispatch<React.SetStateAction<number[]>>;
  toggleSelCommit: (i: number, isMulti: boolean) => void;
  expanded: Record<number, boolean>;
  toggleExpandCommit: (i: number) => void;
  graphLayout: 'rows' | 'grouped';
  setGraphLayout: (l: 'rows' | 'grouped') => void;
  compareMode: 'list' | 'graph';
  setCompareMode: (m: 'list' | 'graph') => void;
  compareLayout: 'side' | 'stack';
  setCompareLayout: (l: 'side' | 'stack') => void;
  filterOpen: boolean;
  setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  f: FilterState;
  setF: React.Dispatch<React.SetStateAction<FilterState>>;
  cf: CompareFilterState;
  setCf: React.Dispatch<React.SetStateAction<CompareFilterState>>;
  branchQ: string;
  setBranchQ: (q: string) => void;
  scTab: 'changes' | 'stash';
  setScTab: (t: 'changes' | 'stash') => void;
  diffTab: 'work' | 'index' | 'parent' | 'refs';
  setDiffTab: (t: 'work' | 'index' | 'parent' | 'refs') => void;
  consoleLines: LogEntry[];
  log: (lines: LogEntry[]) => void;
  clearConsole: () => void;
  commitMsg: string;
  setCommitMsg: (msg: string) => void;
  commits: CommitRaw[];
  getCommitHash: (i: number) => string;
  getCommitFullSha: (i: number) => string;
  graphData: GraphData;
  graphHasMore: boolean;
  graphLoading: boolean;
  graphLoadingMore: boolean;
  loadMoreGraph: () => void;
  getFileList: (i: number) => DiffFile[];
  stagedFiles: DiffFile[];
  unstagedFiles: DiffFile[];
  untrackedFiles: DiffFile[];
  stashes: StashItem[];
  worktrees: WorktreeItem[];
  submodules: SubmoduleItem[];
  refreshWorktrees: (targetPath?: string) => Promise<void>;
  refreshSubmodules: (targetPath?: string) => Promise<void>;
  addWorktree: (path: string, options?: { reference?: string; newBranch?: string; detach?: boolean }) => Promise<void>;
  removeWorktree: (path: string, force?: boolean) => Promise<void>;
  lockWorktree: (path: string, reason?: string) => Promise<void>;
  unlockWorktree: (path: string) => Promise<void>;
  pruneWorktrees: (dryRun?: boolean) => Promise<void>;
  openPathInFileManager: (path: string) => Promise<void>;
  openPathInTerminal: (path: string) => Promise<void>;
  initSubmodule: (path?: string) => Promise<void>;
  updateSubmodule: (options?: { path?: string; init?: boolean; recursive?: boolean }) => Promise<void>;
  syncSubmodule: (options?: { path?: string; recursive?: boolean }) => Promise<void>;
  deinitSubmodule: (path: string, force?: boolean) => Promise<void>;
  checkoutRecordedSubmoduleCommit: (path: string) => Promise<void>;
  pullSubmoduleTrackedBranch: (path: string) => Promise<void>;
  getSubmodulePointerDiff: (path: string) => Promise<string>;
  stageSubmodulePointer: (path: string) => Promise<void>;
  checkoutBranch: (branch: string) => Promise<void>;
  renameBranch: (oldName: string, newName: string) => Promise<void>;
  deleteBranch: (branch: string, isRemote?: boolean, force?: boolean) => Promise<void>;
  setUpstream: (branch?: string, upstream?: string) => Promise<void>;
  mergeBranch: (reference: string) => Promise<void>;
  rebaseBranch: (reference: string) => Promise<void>;
  resetToRef: (reference: string, mode?: "soft" | "mixed" | "hard") => Promise<void>;
  cherryPickCommit: (sha: string) => Promise<void>;
  revertCommit: (sha: string) => Promise<void>;
  createTag: (tagName: string, sha?: string) => Promise<void>;
  deleteTag: (tagName: string) => Promise<void>;
  stageFile: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageFile: (path: string) => Promise<void>;
  unstageAll: () => Promise<void>;
  discardChanges: (path: string, isUntracked?: boolean) => Promise<void>;
  discardAll: () => Promise<void>;
  commitChanges: (message?: string, amend?: boolean) => Promise<void>;
  createStash: (message?: string, includeUntracked?: boolean) => Promise<void>;
  applyStash: (stashRef: string, pop?: boolean) => Promise<void>;
  dropStash: (stashRef: string) => Promise<void>;
  fetchCommitFiles: (sha: string) => Promise<DiffFile[]>;
  matchesFilter: (i: number) => boolean;
  matchesCompareFilter: (i: number) => boolean;
  act: (label: string, extra?: string) => () => void;
  doFetch: () => void;
  doPull: () => void;
  doPush: () => void;
  createBranch: () => void;
  openRepository: () => void;
  cloneRepository: () => void;
  knownRepositories: Array<{ name: string; path: string }>;
  selectRepository: (path: string) => void;
  actionBusy: boolean;
  activeRemoteAction: 'fetch' | 'pull' | 'push' | null;
  aiMessage: () => void;
  updateAll: () => void;
  paletteAll: () => PaletteItem[];
  repoName: string;
  repoPath: string;
  currentBranch: string;
  aheadCount: number;
  behindCount: number;
  onFetchProp?: () => void;
  onPullProp?: () => void;
  onPushProp?: () => void;
  getCompare: (leftRef: string, rightRef: string) => Promise<any>;
  createPatch: (reference: string, filePath?: string) => Promise<string>;
  applyPatchText: (patchContent: string) => Promise<void>;
  addRemote: (name: string, url: string) => Promise<void>;
  setRemoteUrl: (name: string, url: string) => Promise<void>;
  deleteRemote: (name: string) => Promise<void>;
  getRemotes: () => Promise<any[]>;
  openAddRemoteDialog: () => void;
  openEditRemoteDialog: (name: string, currentUrl: string) => void;
  
  // Extra dynamic preferences
  preferences: Record<string, any>;
  updatePreference: (key: string, value: any) => void;
}
