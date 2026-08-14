import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Theme,
  GitClientView,
  CommitRaw,
  RefBadge,
  DiffFile,
  GraphData,
  GraphEdge,
  GraphRowData,
  LogEntry,
  OperationState,
  ContextMenuState,
  DialogState,
  ToastState,
  PaletteItem,
  FilterState,
  CompareFilterState,
  GitClientProps,
  MenuItem
} from '../types/git-client';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { loadAppStore, saveAppStore, loadAIConfig, saveAIConfig, AIConfig } from '../services/appStore';
import {
  tauriGitBackend,
  type ChangedFile as BackendChangedFile,
  type GitCommandResult,
  type GraphCommitRow as BackendGraphCommitRow,
  type StashEntry,
  type WorktreeEntry,
  type SubmoduleEntry
} from '../services/tauriGitBackend';
import { generateAICommitMessage } from '../services/aiCommitMessage';

export const COLORS = [
  'oklch(.70 .12 289)',
  'oklch(.70 .11 152)',
  'oklch(.72 .11 85)',
  'oklch(.68 .13 25)',
  'oklch(.70 .10 205)',
  'oklch(.70 .12 330)',
  'oklch(.70 .10 255)'
];


export const RAW_COMMITS: CommitRaw[] = [
  [
    "Merge branch 'mlx5-next' into net-next",
    'Jakub Kicinski',
    '2026-07-30 14:22',
    [1, 6],
    ['main', 'origin/main']
  ],
  [
    'mm/slub: fix kmalloc_nolock() vs kfree() race on cpu_slab',
    'Vlastimil Babka',
    '2026-07-30 11:04',
    [2],
    []
  ],
  [
    'sched/fair: prevent stale util_est after task migration',
    'Peter Zijlstra',
    '2026-07-29 18:47',
    [3],
    []
  ],
  [
    "Merge tag 'v6.19-rc4' into for-next",
    'Linus Torvalds',
    '2026-07-29 09:31',
    [4, 9],
    ['tag: v6.19-rc4']
  ],
  [
    'kbuild: drop -Wmaybe-uninitialized for clang builds',
    'Nathan Chancellor',
    '2026-07-28 21:15',
    [5],
    []
  ],
  ['io_uring: fix ring buffer accounting on resize', 'Jens Axboe', '2026-07-28 16:02', [11], []],
  [
    'net/mlx5e: add TX steering for tunneled traffic',
    'Saeed Mahameed',
    '2026-07-28 13:40',
    [7],
    ['feature/mlx5-next', 'origin/feature/mlx5-next']
  ],
  ['net/mlx5: split ESW offload init into helpers', 'Roi Dayan', '2026-07-27 19:58', [8], []],
  ['net/mlx5: introduce per-vport packet counters', 'Saeed Mahameed', '2026-07-27 10:12', [12], []],
  [
    'arm64: dts: qcom: enable UFS on sm8750',
    'Bjorn Andersson',
    '2026-07-27 08:44',
    [10],
    ['fix/kbuild-clang']
  ],
  [
    'arm64: errata: workaround for Cortex-A725 erratum 3699571',
    'Mark Rutland',
    '2026-07-26 15:20',
    [12],
    []
  ],
  ['block: fix nr_requests underflow on queue resize', 'Ming Lei', '2026-07-26 12:07', [12], []],
  ["Merge tag 'v6.19-rc3'", 'Linus Torvalds', '2026-07-25 17:33', [13], ['tag: v6.19-rc3']],
  ["Merge branch 'sched/core' into for-linus", 'Ingo Molnar', '2026-07-25 09:18', [14, 17], []],
  ['ext4: avoid inode reuse race in orphan cleanup', "Theodore Ts'o", '2026-07-24 22:41', [15], []],
  ['btrfs: zoned: reclaim unusable space earlier', 'David Sterba', '2026-07-24 14:09', [16], []],
  [
    'fs: rename lookup_one_len() callers to lookup_noperm()',
    'Al Viro',
    '2026-07-23 20:26',
    [20],
    []
  ],
  [
    'sched_ext: allow BPF schedulers to opt out of core sched',
    'Tejun Heo',
    '2026-07-23 11:55',
    [18],
    ['release/6.18.y', 'origin/release/6.18.y']
  ],
  [
    'sched_ext: document dispatch queue lifetime rules',
    'David Vernet',
    '2026-07-22 16:31',
    [19],
    []
  ],
  ['sched/core: tidy up nohz balance entry points', 'Peter Zijlstra', '2026-07-22 09:47', [20], []],
  ["Merge tag 'v6.19-rc2'", 'Linus Torvalds', '2026-07-21 18:12', [21], ['tag: v6.19-rc2']],
  [
    'drm/amdgpu: bump VCN firmware version for VCN 5.0',
    'Alex Deucher',
    '2026-07-21 13:26',
    [22],
    []
  ],
  ["Merge branch 'rust-next'", 'Miguel Ojeda', '2026-07-20 15:39', [23, 25], []],
  [
    'rust: alloc: implement Vec::try_with_capacity',
    'Danilo Krummrich',
    '2026-07-20 10:03',
    [24],
    []
  ],
  ['rust: kernel: add Pin<KBox<T>> conversions', 'Benno Lossin', '2026-07-19 19:48', [27], []],
  [
    'perf tools: fix build against libbpf 1.6',
    'Arnaldo Carvalho de Melo',
    '2026-07-19 12:22',
    [26],
    ['feature/perf-tui']
  ],
  ['perf report: add TUI column for cgroup id', 'Namhyung Kim', '2026-07-18 17:05', [27], []],
  ["Merge tag 'v6.19-rc1'", 'Linus Torvalds', '2026-07-18 08:50', [28], ['tag: v6.19-rc1']],
  [
    'cgroup: fix memcg stat flush deadlock under memory pressure',
    'Michal Hocko',
    '2026-07-17 21:14',
    [29],
    []
  ],
  [
    'x86/mm: relax LAM enablement check for 5-level paging',
    'Dave Hansen',
    '2026-07-17 11:38',
    [30],
    []
  ],
  ['Linux 6.19-rc1', 'Linus Torvalds', '2026-07-16 19:00', [], []]
];

export function getHash(i: number): string {
  const s = 'f3a9c218be1c042d77a19b0c4e8391ff2d64a7c0b15e93d17cc2a80e4b6d59f2';
  let h = '';
  for (let k = 0; k < 7; k++) h += s[(i * 7 + k * 3 + 11) % s.length];
  return h;
}

export function statusColor(s: string): string {
  return s === 'A'
    ? 'var(--add)'
    : s === 'D'
      ? 'var(--del)'
      : s === 'R'
        ? 'var(--iris)'
        : s === 'U'
          ? 'var(--del)'
          : 'var(--color-accent)';
}

export function refBadge(label: string): RefBadge {
  if (label.indexOf('tag: ') === 0)
    return { label: label.slice(5), cls: 'tag-outline', variant: 'outline' };
  if (label.indexOf('origin/') === 0) return { label, cls: 'tag-neutral', variant: 'neutral' };
  if (label === 'main') return { label: 'HEAD → ' + label, cls: 'tag-accent', variant: 'accent' };
  return { label, cls: 'tag-accent-2', variant: 'accent-2' };
}

export function buildGraphData(commits: CommitRaw[]): GraphData {
  const lanes: (number | null)[] = [];
  const rows: GraphRowData[] = [];

  commits.forEach((r, i) => {
    let L = lanes.indexOf(i);
    if (L < 0) {
      L = lanes.indexOf(null);
      if (L < 0) L = lanes.length;
      lanes[L] = i;
    }
    const before = lanes.slice();
    const edges: GraphEdge[] = [];
    lanes[L] = null;

    (r[3] || []).forEach((p, k) => {
      let pl = lanes.indexOf(p);
      if (pl < 0) {
        if (k === 0 && lanes[L] == null) pl = L;
        else {
          pl = lanes.indexOf(null);
          if (pl < 0) pl = lanes.length;
        }
        lanes[pl] = p;
      }
      edges.push({ from: L, to: pl, y0: 15, y1: 30, color: COLORS[pl % 7] });
    });

    before.forEach((id, l) => {
      if (id != null && l !== L) {
        edges.push({ from: l, to: l, y0: 0, y1: 30, color: COLORS[l % 7] });
      }
    });

    if (i > 0) {
      edges.unshift({ from: L, to: L, y0: 0, y1: 15, color: COLORS[L % 7] });
    }

    while (lanes.length && lanes[lanes.length - 1] == null) lanes.pop();
    const row: GraphRowData = {
      lane: L,
      edges,
      after: lanes.slice(),
      width: Math.max(before.length, lanes.length)
    };
    rows.push(row);
  });

  const max = rows.reduce((m, r) => Math.max(m, r.width), 1);
  return { rows, width: max * 15 + 18 };
}

export function buildFiles(i: number, commits: CommitRaw[]): DiffFile[] {
  const subj = commits[i][0];
  const dir = (subj.split(':')[0] || 'kernel').replace(/[^a-z0-9/_-]/gi, '').toLowerCase();
  const base = dir.indexOf('/') > 0 ? dir : dir + '/core';
  const names = ['main.c', 'core.c', 'Makefile', 'internal.h', 'params.c', 'debugfs.c', 'Kconfig'];
  const n = 2 + (i % 4);
  const out: DiffFile[] = [];

  for (let k = 0; k < n; k++) {
    out.push({
      path: base + '/' + names[(i + k) % names.length],
      status: k === 0 && i % 5 === 0 ? 'A' : i % 7 === 3 && k === n - 1 ? 'D' : 'M',
      add: 3 + ((i * 13 + k * 7) % 90),
      del: 1 + ((i * 5 + k * 3) % 40)
    });
  }
  return out;
}

export function seedLog(): LogEntry[] {
  return [
    { text: '$ git fetch --all --prune', type: 'cmd' },
    { text: 'Fetching origin', type: 'out' },
    { text: 'From github.com:torvalds/linux', type: 'out' },
    { text: '   4c1f9ab..f3a9c21  master     -> origin/master', type: 'out' },
    { text: ' * [new tag]         v6.19-rc4  -> v6.19-rc4', type: 'out' },
    { text: '$ git submodule update --init --recursive tools/lib/bpf', type: 'cmd' },
    { text: "Submodule path 'tools/lib/bpf': checked out '9b41ac2'", type: 'out' },
    { text: 'done in 4.2s', type: 'ok' }
  ];
}

interface GitClientContextType {
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
  prompt: (
    title: string,
    body: string,
    action: string,
    defaultValue: string,
    run?: (value: string) => void,
    inputLabel?: string,
    inputRequired?: boolean
  ) => void;
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
  diffTargetSha: string | null;
  setDiffTargetSha: (sha: string | null) => void;
  compareSeedRef: string | null;
  setCompareSeedRef: (ref: string | null) => void;
  findCommitIndexBySha: (sha: string) => number;
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
  diffTab: 'work' | 'index' | 'parent' | 'refs' | 'merge';
  setDiffTab: (t: 'work' | 'index' | 'parent' | 'refs' | 'merge') => void;
  consoleLines: LogEntry[];
  log: (lines: LogEntry[]) => void;
  clearConsole: () => void;
  commitMsg: string;
  setCommitMsg: (msg: string) => void;
  commits: CommitRaw[];
  totalCommitCount: number;
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
  stashes: StashEntry[];
  worktrees: WorktreeEntry[];
  submodules: SubmoduleEntry[];
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
  doFetch: () => void;
  doPull: () => void;
  doPush: () => void;
  createBranch: () => void;
  openRepository: () => void;
  cloneRepository: () => void;
  closeRepository: () => void;
  knownRepositories: Array<{ name: string; path: string }>;
  selectRepository: (path: string) => void;
  forgetRepository: (path: string) => void;
  actionBusy: boolean;
  activeRemoteAction: 'fetch' | 'pull' | 'push' | null;
  aiMessage: () => void;
  aiBusy: boolean;
  aiConfig: AIConfig;
  updateAIConfig: (config: AIConfig) => void;
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
  getCompare: (leftRef: string, rightRef: string) => Promise<import("../services/tauriGitBackend").GitCompareResult>;
  createPatch: (reference: string, filePath?: string) => Promise<string>;
  applyPatchText: (patchContent: string) => Promise<void>;
  addRemote: (name: string, url: string) => Promise<void>;
  setRemoteUrl: (name: string, url: string) => Promise<void>;
  deleteRemote: (name: string) => Promise<void>;
  getRemotes: () => Promise<import("../services/tauriGitBackend").RemoteEntry[]>;
  openAddRemoteDialog: () => void;
  openEditRemoteDialog: (name: string, currentUrl: string) => void;
  preferences: Record<string, any>;
  updatePreference: (key: string, value: any) => void;
}

const GitClientContext = createContext<GitClientContextType | null>(null);

export const GitClientProvider: React.FC<{
  props?: GitClientProps;
  children: React.ReactNode;
}> = ({ props = {}, children }) => {
  const persistedStore = useMemo(() => loadAppStore(), []);

  const [view, setView] = useState<GitClientView>(
    props.initialView || persistedStore?.settings.view || 'graph'
  );
  const [theme, setThemeState] = useState<Theme>(
    props.initialTheme || persistedStore?.settings.theme || 'dark'
  );
  const [dock, setDock] = useState<boolean>(
    persistedStore?.settings.dock !== undefined ? persistedStore.settings.dock : true
  );
  const [consoleOpen, setConsoleOpen] = useState<boolean>(false);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [paletteQ, setPaletteQ] = useState<string>('');
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [toastPct, setToastPct] = useState<number>(0);
  const toastTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastGenerationRef = useRef(0);
  const [cloneDialogUrl, setCloneDialogUrl] = useState<string>('');
  const [cloneDialogUseGit, setCloneDialogUseGit] = useState<boolean>(false);
  const [remoteDialogName, setRemoteDialogName] = useState<string>('');
  const [remoteDialogUrl, setRemoteDialogUrl] = useState<string>('');
  const [promptDialogValue, setPromptDialogValue] = useState<string>('');
  const [op, setOp] = useState<OperationState | null>(null);
  const [sel, setSel] = useState<number[]>([0]);
  const [diffTargetSha, setDiffTargetSha] = useState<string | null>(null);
  const [compareSeedRef, setCompareSeedRef] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const [graphLayout, setGraphLayout] = useState<'rows' | 'grouped'>(
    persistedStore?.settings.graphLayout || 'rows'
  );
  const [compareMode, setCompareMode] = useState<'list' | 'graph'>(
    persistedStore?.settings.compareMode || 'list'
  );
  const [compareLayout, setCompareLayout] = useState<'side' | 'stack'>(
    persistedStore?.settings.compareLayout || 'side'
  );
  const [filterOpen, setFilterOpen] = useState<boolean>(
    persistedStore?.settings.filterOpen || false
  );
  const [f, setF] = useState<FilterState>({ ref: '', author: '', msg: '', from: '', to: '' });
  const [cf, setCf] = useState<CompareFilterState>({
    msg: '',
    author: '',
    excl: '',
    from: '',
    to: '',
    noMerges: false,
    matching: true
  });
  const [branchQ, setBranchQ] = useState<string>('');
  const [scTab, setScTab] = useState<'changes' | 'stash'>(
    persistedStore?.settings.scTab || 'changes'
  );
  const [diffTab, setDiffTab] = useState<'work' | 'index' | 'parent' | 'refs' | 'merge'>(
    persistedStore?.settings.diffTab === 'sources'
      ? 'work'
      : persistedStore?.settings.diffTab || 'work'
  );
  const [consoleLines, setConsoleLines] = useState<LogEntry[]>(seedLog());
  const [commitMsg, setCommitMsg] = useState<string>(
    'net/mlx5e: add TX steering for tunneled traffic\n\nSteer tunneled TX traffic to the dedicated SQ set so encapsulated\nflows keep their hardware offload.\n\nSigned-off-by: '
  );
  const [graphRows, setGraphRows] = useState<BackendGraphCommitRow[]>([]);
  const [graphHasMore, setGraphHasMore] = useState<boolean>(false);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);
  const [graphLoadingMore, setGraphLoadingMore] = useState<boolean>(false);
  const [stagedFiles, setStagedFiles] = useState<DiffFile[]>([]);
  const [unstagedFiles, setUnstagedFiles] = useState<DiffFile[]>([]);
  const [untrackedFiles, setUntrackedFiles] = useState<DiffFile[]>([]);
  const [stashes, setStashes] = useState<StashEntry[]>([]);
  const [worktrees, setWorktrees] = useState<WorktreeEntry[]>([]);
  const [submodules, setSubmodules] = useState<SubmoduleEntry[]>([]);
  const [selectedRepoPath, setSelectedRepoPath] = useState<string>(
    props.repoPath || persistedStore?.repositories.selectedRepoPath || ''
  );
  const [repoPath, setRepoPath] = useState<string>(
    props.repoPath || persistedStore?.repositories.activeRepoPath || ''
  );
  const [totalCommitCount, setTotalCommitCount] = useState<number>(0);
  const [repoName, setRepoName] = useState<string>(
    props.repoName || persistedStore?.repositories.repoName || 'Open a repository'
  );
  const [knownRepositories, setKnownRepositories] = useState<Array<{ name: string; path: string }>>(
    () => {
      const persisted = persistedStore?.repositories.repositoryList || [];
      const initialPath = props.repoPath || persistedStore?.repositories.activeRepoPath || '';
      const initialName =
        props.repoName || persistedStore?.repositories.repoName || 'Open a repository';
      const deduped = persisted.filter((item, idx, arr) => {
        return !!item.path && idx === arr.findIndex(candidate => candidate.path === item.path);
      });
      if (initialPath && !deduped.some(item => item.path === initialPath)) {
        deduped.unshift({ name: initialName, path: initialPath });
      }
      return deduped.slice(0, 20);
    }
  );
  const [currentBranch, setCurrentBranch] = useState<string>(props.currentBranch || 'No branch');
  const [aheadCount, setAheadCount] = useState<number>(props.aheadCount !== undefined ? props.aheadCount : 0);
  const [behindCount, setBehindCount] = useState<number>(props.behindCount !== undefined ? props.behindCount : 0);
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [activeRemoteAction, setActiveRemoteAction] = useState<'fetch' | 'pull' | 'push' | null>(null);

  const [preferences, setPreferences] = useState<Record<string, any>>(
    persistedStore?.settings.preferences || {}
  );

  const [aiConfig, setAIConfig] = useState<AIConfig>(() => loadAIConfig());
  const [aiBusy, setAIBusy] = useState(false);

  const updatePreference = useCallback((key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAIConfig = useCallback((config: AIConfig) => {
    setAIConfig(config);
    saveAIConfig(config);
  }, []);

  const graphPageSizePref = useMemo(() => {
    const raw = parseInt(String(preferences.graphPageSize ?? '100'), 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 100;
  }, [preferences.graphPageSize]);

  const commits = useMemo<CommitRaw[]>(() => {
    if (!graphRows.length) {
      return RAW_COMMITS;
    }

    const indexBySha = new Map<string, number>();
    graphRows.forEach((row, index) => {
      indexBySha.set(row.sha, index);
    });

    return graphRows.map(row => {
      const parentIndexes = row.parents
        .map(parent => indexBySha.get(parent))
        .filter((index): index is number => index !== undefined);
      const renderedDate = row.date.replace('T', ' ').replace('Z', '').slice(0, 16);
      return [row.subject, row.author, renderedDate, parentIndexes, row.refs];
    });
  }, [graphRows]);

  const graphData = useMemo(() => buildGraphData(commits), [commits]);
  const getCommitHash = useCallback(
    (i: number): string => graphRows[i]?.shortSha || getHash(i),
    [graphRows]
  );

  const getCommitFullSha = useCallback(
    (i: number): string => graphRows[i]?.sha || getHash(i),
    [graphRows]
  );

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  }, [theme, setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (props.accent) {
      document.documentElement.style.setProperty('--color-accent', props.accent);
    }
  }, [theme, props.accent]);

  useEffect(() => {
    saveAppStore({
      version: 1,
      settings: {
        theme,
        dock,
        view,
        graphLayout,
        compareMode,
        compareLayout,
        filterOpen,
        scTab,
        diffTab,
        preferences
      },
      repositories: {
        selectedRepoPath,
        activeRepoPath: repoPath,
        repoName,
        repositoryList: knownRepositories
      }
    });
  }, [
    theme,
    dock,
    view,
    graphLayout,
    compareMode,
    compareLayout,
    filterOpen,
    scTab,
    diffTab,
    preferences,
    selectedRepoPath,
    repoPath,
    repoName,
    knownRepositories
  ]);

  const log = useCallback((lines: LogEntry[]) => {
    setConsoleLines(prev => prev.concat(lines).slice(-120));
    setConsoleOpen(true);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleLines([]);
  }, []);

  const getRepoNameFromPath = useCallback((pathValue: string): string => {
    const cleaned = pathValue.replace(/\\+$/g, '').replace(/\/+$/g, '');
    const parts = cleaned.split(/[\\/]/).filter(Boolean);
    return parts[parts.length - 1] || pathValue;
  }, []);

  const getRepoDirNameFromUrl = useCallback((urlValue: string): string => {
    const normalized = urlValue.trim().replace(/\/+$/g, '');
    const slashSegment = normalized.split('/').pop() || normalized;
    const colonSegment = slashSegment.split(':').pop() || slashSegment;
    const name = colonSegment.endsWith('.git') ? colonSegment.slice(0, -4) : colonSegment;
    return name || 'repository';
  }, []);

  const joinPath = useCallback((basePath: string, child: string): string => {
    const sep = basePath.includes('\\') ? '\\' : '/';
    const cleaned = basePath.replace(/[\\/]+$/g, '');
    return `${cleaned}${sep}${child}`;
  }, []);

  const toGitSshUrl = useCallback((urlValue: string): string => {
    const value = urlValue.trim();
    if (!value) {
      return value;
    }
    if (value.startsWith('git@') || value.startsWith('ssh://')) {
      return value;
    }
    if (!(value.startsWith('https://') || value.startsWith('http://'))) {
      return value;
    }
    try {
      const parsed = new URL(value);
      const host = parsed.host;
      let path = parsed.pathname.replace(/^\/+/, '').replace(/\/+$/g, '');
      if (path.endsWith('.git')) {
        path = path.slice(0, -4);
      }
      if (!path) {
        return value;
      }
      return `git@${host}:${path}.git`;
    } catch {
      return value;
    }
  }, []);

  const waitForNextPaint = useCallback(async () => {
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => resolve());
    });
  }, []);

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearInterval(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const startProgressToast = useCallback(
    (title = 'Git operation in progress', detail = 'Running command…') => {
      clearToastTimer();
      const generation = ++toastGenerationRef.current;
      setToast({ title, detail });
      setToastPct(8);

      let pct = 8;
      toastTimerRef.current = setInterval(() => {
        pct = Math.min(90, pct + 4);
        setToastPct(pct);
      }, 240);

      return generation;
    },
    [clearToastTimer]
  );

  const finishProgressToast = useCallback(
    (generation: number) => {
      if (toastGenerationRef.current !== generation) {
        return;
      }
      clearToastTimer();
      setToastPct(100);
      setTimeout(() => {
        if (toastGenerationRef.current === generation) {
          setToast(null);
        }
      }, 700);
    },
    [clearToastTimer]
  );

  const runWithActionLock = useCallback(
    async (task: () => Promise<void>) => {
      if (actionBusy) {
        return;
      }

      setActionBusy(true);
      const toastGeneration = startProgressToast();
      try {
        // Let React paint the busy state and progress toast before a native invoke starts.
        await waitForNextPaint();
        await task();
      } finally {
        setActionBusy(false);
        finishProgressToast(toastGeneration);
      }
    },
    [actionBusy, finishProgressToast, startProgressToast, waitForNextPaint]
  );

  const appendCommandResult = useCallback((result: GitCommandResult) => {
    const lines: LogEntry[] = [];
    const trimmedOut = result.stdout.trim();
    const trimmedErr = result.stderr.trim();
    if (trimmedOut) {
      for (const line of trimmedOut.split(/\r?\n/)) {
        lines.push({ text: line, type: 'out' });
      }
    }
    if (trimmedErr) {
      for (const line of trimmedErr.split(/\r?\n/)) {
        lines.push({ text: line, type: result.exitCode === 0 ? 'warn' : 'err' });
      }
    }
    lines.push({ text: result.exitCode === 0 ? 'done' : `exit ${result.exitCode}`, type: result.exitCode === 0 ? 'ok' : 'err' });
    log(lines);
  }, [log]);

  const applyChangedFiles = useCallback((entries: BackendChangedFile[]) => {
    const mapStatus = (entry: BackendChangedFile): DiffFile['status'] => {
      if (entry.untracked) {
        return '?';
      }
      if (entry.indexStatus === 'U' || entry.worktreeStatus === 'U' || entry.status.includes('U')) {
        return 'U';
      }
      const resolved = (entry.indexStatus || entry.worktreeStatus || 'M').trim() || 'M';
      const primary = resolved[0] || 'M';
      if (primary === 'A' || primary === 'D' || primary === 'M' || primary === 'R' || primary === '?' || primary === 'U') {
        return primary;
      }
      return 'M';
    };

    const toDiffFile = (entry: BackendChangedFile): DiffFile => ({
      path: entry.path,
      status: mapStatus(entry),
      add: 0,
      del: 0
    });

    const nextStaged = entries.filter(entry => entry.staged).map(toDiffFile);
    const nextUnstaged = entries.filter(entry => entry.unstaged && !entry.untracked).map(toDiffFile);
    const nextUntracked = entries.filter(entry => entry.untracked).map(toDiffFile);

    setStagedFiles(nextStaged);
    setUnstagedFiles(nextUnstaged);
    setUntrackedFiles(nextUntracked);
  }, []);

  const refreshRepositorySnapshot = useCallback(
    async (pathValue: string) => {
      if (!pathValue) {
        setGraphRows([]);
        setGraphHasMore(false);
        applyChangedFiles([]);
        setStashes([]);
        setTotalCommitCount(0);
        return;
      }

      setGraphLoading(true);
      try {
        const [rows, changed, stashList, wtList, subList, commitCount] = await Promise.all([
          tauriGitBackend.getGraph(pathValue, { maxCount: graphPageSizePref, skip: 0, allRefs: true }),
          tauriGitBackend.getChangedFiles(pathValue),
          tauriGitBackend.getStashes(pathValue).catch(() => []),
          tauriGitBackend.getWorktrees(pathValue).catch(() => []),
          tauriGitBackend.getSubmodules(pathValue, true).catch(() => []),
          tauriGitBackend.getCommitCount(pathValue, { allRefs: true }).catch(() => 0)
        ]);
        setGraphRows(rows);
        setGraphHasMore(rows.length === graphPageSizePref);
        applyChangedFiles(changed);
        setStashes(stashList);
        setWorktrees(wtList);
        setSubmodules(subList);
        setTotalCommitCount(commitCount);
      } catch {
        setGraphRows([]);
        setGraphHasMore(false);
        applyChangedFiles([]);
        setStashes([]);
        setWorktrees([]);
        setSubmodules([]);
        setTotalCommitCount(0);
      } finally {
        setGraphLoading(false);
      }
    },
    [applyChangedFiles, graphPageSizePref]
  );

  useEffect(() => {
    if (!repoPath) return;
    const raw = parseInt(String(preferences.statusPollInterval ?? '2000'), 10);
    const intervalMs = Number.isFinite(raw) && raw >= 500 ? raw : 2000;
    const id = setInterval(() => {
      void tauriGitBackend.getChangedFiles(repoPath).then(applyChangedFiles).catch(() => {});
    }, intervalMs);
    return () => clearInterval(id);
  }, [repoPath, preferences.statusPollInterval, applyChangedFiles]);

  const loadMoreGraph = useCallback(() => {
    if (!repoPath || graphLoading || graphLoadingMore || !graphHasMore) {
      return;
    }

    void (async () => {
      setGraphLoadingMore(true);
      try {
        const page = await tauriGitBackend.getGraph(repoPath, {
          maxCount: graphPageSizePref,
          skip: graphRows.length,
          allRefs: true
        });
        setGraphRows(prev => prev.concat(page));
        setGraphHasMore(page.length === graphPageSizePref);
      } catch {
        setGraphHasMore(false);
      } finally {
        setGraphLoadingMore(false);
      }
    })();
  }, [repoPath, graphLoading, graphLoadingMore, graphHasMore, graphRows.length, graphPageSizePref]);

  const refreshBranchSummary = useCallback(async (pathValue: string) => {
    if (!pathValue) {
      return;
    }
    let currentBranchName = '';
    try {
      const branches = await tauriGitBackend.getBranches(pathValue);
      const current = branches.find(b => b.current) || branches.find(b => b.kind === 'local');
      if (current) {
        currentBranchName = current.name;
        setAheadCount(current.ahead || 0);
        setBehindCount(current.behind || 0);
      }
    } catch (error) {
      log([
        {
          text: `Failed to load branches: ${error instanceof Error ? error.message : String(error)}`,
          type: 'warn'
        }
      ]);
    }

    if (!currentBranchName) {
      try {
        currentBranchName = (await tauriGitBackend.getCurrentBranch(pathValue)).trim();
      } catch (error) {
        log([
          {
            text: `Failed to load current branch: ${error instanceof Error ? error.message : String(error)}`,
            type: 'warn'
          }
        ]);
      }
    }

    if (currentBranchName) {
      setCurrentBranch(currentBranchName);
    }
  }, [log]);

  const rememberRepository = useCallback((pathValue: string, nameValue: string) => {
    if (!pathValue) {
      return;
    }
    setKnownRepositories(prev => {
      const trimmedPath = pathValue.trim();
      const trimmedName = (nameValue || 'repository').trim();
      const remaining = prev.filter(item => item.path !== trimmedPath);
      return [{ name: trimmedName, path: trimmedPath }, ...remaining].slice(0, 20);
    });
  }, []);

  const forgetRepository = useCallback((pathValue: string) => {
    setKnownRepositories(prev => prev.filter(item => item.path !== pathValue));
  }, []);

  const setActiveRepository = useCallback(async (pathValue: string) => {
    setRepoPath(pathValue);
    setSelectedRepoPath(pathValue);
    const nextName = getRepoNameFromPath(pathValue);
    setRepoName(nextName);
    rememberRepository(pathValue, nextName);
    await Promise.all([refreshBranchSummary(pathValue), refreshRepositorySnapshot(pathValue)]);
  }, [getRepoNameFromPath, refreshBranchSummary, refreshRepositorySnapshot, rememberRepository]);

  const selectRepository = useCallback(
    (path: string) => {
      if (!path) {
        return;
      }
      void (async () => {
        await runWithActionLock(async () => {
          try {
            const isRepo = await tauriGitBackend.isRepo(path);
            if (!isRepo) {
              log([{ text: `Not a git repository: ${path}`, type: 'err' }]);
              return;
            }
            await setActiveRepository(path);
            log([{ text: `Repository selected: ${path}`, type: 'ok' }]);
          } catch (error) {
            log([
              {
                text: `Switch repository failed: ${error instanceof Error ? error.message : String(error)}`,
                type: 'err'
              }
            ]);
          }
        });
      })();
    },
    [runWithActionLock, log, setActiveRepository]
  );

  const toastRun = useCallback(
    (title: string, detail: string, done?: () => void) => {
      clearToastTimer();
      const generation = ++toastGenerationRef.current;
      setToast({ title, detail });
      setToastPct(6);
      let p = 6;
      const interval = setInterval(() => {
        p += 11;
        if (p >= 100) {
          clearInterval(interval);
          setToastPct(100);
          toastTimerRef.current = null;
          setTimeout(() => {
            if (toastGenerationRef.current === generation) {
              setToast(null);
            }
          }, 700);
          if (done) done();
        } else {
          setToastPct(p);
        }
      }, 220);
      toastTimerRef.current = interval;
    },
    [clearToastTimer]
  );

  const cancelToast = useCallback(() => {
    clearToastTimer();
    ++toastGenerationRef.current;
    setToast(null);
  }, [clearToastTimer]);

  const confirm = useCallback(
    (title: string, body: string, cmd: string, action: string, run?: () => void) => {
      setDialog({ title, body, cmd, action, kind: 'confirm', run });
      setMenu(null);
    },
    []
  );

  const prompt = useCallback(
    (
      title: string,
      body: string,
      action: string,
      defaultValue: string,
      run?: (value: string) => void,
      inputLabel?: string,
      inputRequired: boolean = true
    ) => {
      setPromptDialogValue(defaultValue);
      setDialog({ title, body, cmd: '', action, kind: 'prompt', run: run as any, inputLabel, inputRequired });
      setMenu(null);
    },
    []
  );

  const closeDialog = useCallback(() => {
    setDialog(null);
    setCloneDialogUrl('');
    setCloneDialogUseGit(false);
    setRemoteDialogName('');
    setRemoteDialogUrl('');
    setPromptDialogValue('');
  }, []);

  const runCloneFromDialog = useCallback(() => {
    const rawUrl = cloneDialogUrl.trim();
    if (!rawUrl) {
      log([{ text: 'Clone URL is required', type: 'err' }]);
      return;
    }
    const cloneUrl = cloneDialogUseGit ? toGitSshUrl(rawUrl) : rawUrl;

    void (async () => {
      let destinationBase = '';
      try {
        const selected = await openDialog({
          directory: true,
          multiple: false,
          title: 'Select Destination Folder'
        });
        if (typeof selected === 'string') {
          destinationBase = selected.trim();
        }
      } catch {
        // Fallback to text prompt in non-tauri contexts.
      }

      if (!destinationBase) {
        prompt(
          'Clone Destination',
          'Enter the absolute parent folder path where the repository should be cloned.',
          'Clone',
          '',
          (val?: string) => {
            const fallbackPath = (val || '').trim();
            if (!fallbackPath) return;
            const repoDirName = getRepoDirNameFromUrl(cloneUrl);
            const destinationPath = joinPath(fallbackPath, repoDirName);
            void (async () => {
              try {
                toastRun('Cloning', `Cloning ${cloneUrl}...`);
                log([{ text: `$ git clone ${cloneUrl} ${destinationPath}`, type: 'cmd' }]);
                const result = await tauriGitBackend.cloneRepo(cloneUrl, destinationPath);
                appendCommandResult(result);
                if (result.exitCode === 0) {
                  await setActiveRepository(destinationPath);
                  toastRun('Cloned repository', repoDirName);
                } else {
                  log([{ text: `Clone failed: ${result.stderr || 'Unknown error'}`, type: 'err' }]);
                }
              } catch (error) {
                log([{ text: `Clone failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
              }
            })();
          },
          'Destination parent folder'
        );
        return;
      }

      const repoDirName = getRepoDirNameFromUrl(cloneUrl);
      const destinationPath = joinPath(destinationBase, repoDirName);
      setDialog(null);

      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git clone ${cloneUrl} ${destinationPath}`, type: 'cmd' }]);
          const result = await tauriGitBackend.cloneRepo(cloneUrl, destinationPath);
          appendCommandResult(result);
          await setActiveRepository(destinationPath);
          toastRun('Clone complete', destinationPath);
        } catch (error) {
          log([{ text: `Clone failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        } finally {
          setCloneDialogUrl('');
          setCloneDialogUseGit(false);
        }
      });
    })();
  }, [cloneDialogUrl, cloneDialogUseGit, log, toGitSshUrl, getRepoDirNameFromUrl, joinPath, runWithActionLock, appendCommandResult, setActiveRepository, toastRun]);



  const confirmDialog = useCallback(() => {
    if (!dialog) return;
    const d = dialog;
    
    if (d.kind === 'clone') {
      runCloneFromDialog();
      return;
    }
    setDialog(null);
    if (d.kind === 'prompt') {
      if (d.run) d.run(promptDialogValue);
    } else if (d.kind === 'add-remote') {
      if (d.run) d.run();
    } else if (d.kind === 'edit-remote') {
      if (d.run) d.run();
    } else if (d.run) {
      d.run();
    }
  }, [dialog, runCloneFromDialog, promptDialogValue]);

  const openMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, title: string, items: MenuItem[]) => {
      if (e && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
      const x = Math.min((e as React.MouseEvent).clientX || 100, window.innerWidth - 290);
      const y = Math.min(
        (e as React.MouseEvent).clientY || 100,
        Math.max(60, window.innerHeight - Math.min(items.length * 27 + 60, 470))
      );
      setMenu({ x, y, title, items });
    },
    []
  );

  const closeMenu = useCallback((e?: React.MouseEvent | MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setMenu(null);
  }, []);

  const openPalette = useCallback(() => {
    setPaletteOpen(true);
    setPaletteQ('');
  }, []);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
  }, []);

  const toggleDock = useCallback(() => {
    setDock(prev => !prev);
  }, []);

  const toggleConsole = useCallback(() => {
    setConsoleOpen(prev => !prev);
  }, []);

  const toggleSelCommit = useCallback((i: number, isMulti: boolean) => {
    setDiffTargetSha(null);
    setSel(prev => {
      if (isMulti) {
        return prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i];
      }
      return [i];
    });
  }, []);

  const findCommitIndexBySha = useCallback(
    (sha: string): number => graphRows.findIndex(r => r.sha === sha),
    [graphRows]
  );

  const toggleExpandCommit = useCallback((i: number) => {
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }));
  }, []);

  const openRepository = useCallback(() => {
    void (async () => {
      await runWithActionLock(async () => {
        let nextPath = '';
        try {
          const selected = await openDialog({
            directory: true,
            multiple: false,
            title: 'Open Repository'
          });
          if (typeof selected === 'string') {
            nextPath = selected.trim();
          }
        } catch {
          // Fallback to text prompt in non-tauri contexts.
        }

        if (!nextPath) {
          prompt(
            'Open Repository',
            'Enter the path of the repository to open.',
            'Open',
            repoPath,
            (val?: string) => {
              const fallbackPath = (val || '').trim();
              if (fallbackPath) void selectRepository(fallbackPath);
            },
            'Repository path'
          );
          return;
        }

        try {
          const isRepo = await tauriGitBackend.isRepo(nextPath);
          if (!isRepo) {
            log([{ text: `Not a git repository: ${nextPath}`, type: 'err' }]);
            return;
          }
          await setActiveRepository(nextPath);
          toastRun('Repository opened', nextPath);
        } catch (error) {
          log([{ text: `Open repository failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    })();
  }, [repoPath, log, setActiveRepository, toastRun, runWithActionLock]);

  const cloneRepository = useCallback(() => {
    setPaletteOpen(false);
    setDialog({
      title: 'Clone Repository',
      body: 'Enter the URL of the Git repository you want to clone.',
      cmd: '',
      action: 'Clone',
      kind: 'clone',
      run: runCloneFromDialog
    });
  }, [runCloneFromDialog]);

  const closeRepository = useCallback(() => {
    if (actionBusy || !repoPath) {
      return;
    }
    setRepoPath('');
    setSelectedRepoPath('');
    setRepoName('Open a repository');
    setCurrentBranch('No branch');
    setAheadCount(0);
    setBehindCount(0);
    log([{ text: 'Repository closed', type: 'ok' }]);
  }, [actionBusy, repoPath, log]);



  const createBranch = useCallback(() => {
    if (actionBusy) {
      return;
    }
    setPromptDialogValue('feature/new-branch');
    setDialog({
      title: 'Create new branch',
      body: 'Enter a name for the new branch.',
      cmd: '',
      action: 'Create branch',
      kind: 'prompt',
      run: (branchName?: string) => {
        if (!branchName || !branchName.trim()) {
          return;
        }
        const nextBranch = branchName.trim();
        confirm(
          `Create branch ${nextBranch}?`,
          `This creates ${nextBranch} from ${currentBranch} and checks it out.`,
          `git branch ${nextBranch} ${currentBranch}\ngit checkout ${nextBranch}`,
          'Create branch',
          () => {
            void (async () => {
              await runWithActionLock(async () => {
                try {
                  log([{ text: `$ git branch ${nextBranch} ${currentBranch}`, type: 'cmd' }]);
                  const createResult = await tauriGitBackend.createBranch(repoPath, nextBranch, currentBranch);
                  appendCommandResult(createResult);
                  log([{ text: `$ git checkout ${nextBranch}`, type: 'cmd' }]);
                  const checkoutResult = await tauriGitBackend.checkoutBranch(repoPath, nextBranch);
                  appendCommandResult(checkoutResult);
                  await refreshBranchSummary(repoPath);
                  await refreshRepositorySnapshot(repoPath);
                  toastRun('Branch created', nextBranch);
                } catch (error) {
                  log([{ text: `Create branch failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
                }
              });
            })();
          }
        );
      }
    });
  }, [actionBusy, confirm, currentBranch, repoPath, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun, runWithActionLock]);

  useEffect(() => {
    void refreshBranchSummary(repoPath);
    void refreshRepositorySnapshot(repoPath);
  }, [repoPath, refreshBranchSummary, refreshRepositorySnapshot]);

  const doFetch = useCallback(() => {
    if (actionBusy) {
      return;
    }
    setPaletteOpen(false);
    setActionBusy(true);
    setActiveRemoteAction('fetch');
    log([{ text: '$ git fetch --prune', type: 'cmd' }]);
    void (async () => {
      try {
        await waitForNextPaint();
        const result = await tauriGitBackend.fetch(repoPath, { prune: true });
        appendCommandResult(result);
        await refreshBranchSummary(repoPath);
        await refreshRepositorySnapshot(repoPath);
        toastRun('Fetch complete', 'Fetched with prune');
        if (props.onFetch) props.onFetch();
      } catch (error) {
        log([{ text: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
      } finally {
        setActiveRemoteAction(null);
        setActionBusy(false);
      }
    })();
  }, [actionBusy, log, toastRun, props, repoPath, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, waitForNextPaint]);

  const doPull = useCallback(() => {
    if (actionBusy) {
      return;
    }
    confirm(
      'Pull latest changes?',
      `Incoming preview: ${behindCount} commits. This updates ${currentBranch} from its upstream branch.`,
      'git pull',
      'Pull',
      () => {
        setPaletteOpen(false);
        setActionBusy(true);
        setActiveRemoteAction('pull');
        log([{ text: '$ git pull', type: 'cmd' }]);
        void (async () => {
          try {
            await waitForNextPaint();
            const result = await tauriGitBackend.pull(repoPath);
            appendCommandResult(result);
            await refreshBranchSummary(repoPath);
            await refreshRepositorySnapshot(repoPath);
            toastRun('Pull complete', 'Local branch updated from remote');
            if (props.onPull) props.onPull();
          } catch (error) {
            log([{ text: `Pull failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
          } finally {
            setActiveRemoteAction(null);
            setActionBusy(false);
          }
        })();
      }
    );
  }, [actionBusy, confirm, log, toastRun, props, repoPath, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, behindCount, currentBranch, waitForNextPaint]);

  const doPush = useCallback(() => {
    if (actionBusy) {
      return;
    }
    confirm(
      `Push ${aheadCount} commits from ${currentBranch}?`,
      `Outgoing preview: ${aheadCount} commits. Remote branch is ${behindCount} commits ahead.`,
      'git push',
      'Push',
      () => {
        setPaletteOpen(false);
        setActionBusy(true);
        setActiveRemoteAction('push');
        log([{ text: '$ git push', type: 'cmd' }]);
        void (async () => {
          try {
            await waitForNextPaint();
            const result = await tauriGitBackend.push(repoPath);
            appendCommandResult(result);
            await refreshBranchSummary(repoPath);
            await refreshRepositorySnapshot(repoPath);
            toastRun('Push complete', `${currentBranch} updated on remote`);
            if (props.onPush) props.onPush();
          } catch (error) {
            log([{ text: `Push failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
          } finally {
            setActiveRemoteAction(null);
            setActionBusy(false);
          }
        })();
      }
    );
  }, [actionBusy, confirm, props, repoPath, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, currentBranch, aheadCount, behindCount, log, toastRun, waitForNextPaint]);


  const getCompare = useCallback(
    async (leftRef: string, rightRef: string) => {
      try {
        return await tauriGitBackend.getCompare(repoPath, leftRef, rightRef);
      } catch (error) {
        log([{ text: `Compare failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        return {
          leftRef,
          rightRef,
          commitsOnlyLeft: [],
          commitsOnlyRight: [],
          changedFiles: []
        };
      }
    },
    [repoPath, log]
  );

  const createPatch = useCallback(
    async (reference: string, filePath?: string) => {
      try {
        log([{ text: `$ git format-patch --stdout ${reference}${filePath ? ` -- ${filePath}` : ""}`, type: "cmd" }]);
        const patch = await tauriGitBackend.createPatch(repoPath, reference, filePath);
        toastRun("Patch created", reference);
        return patch;
      } catch (error) {
        log([{ text: `Create patch failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        return "";
      }
    },
    [repoPath, log, toastRun]
  );


  const addRemote = useCallback(
    async (name: string, url: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git remote add ${name} ${url}`, type: "cmd" }]);
          const result = await tauriGitBackend.addRemote(repoPath, name, url);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Remote added", name);
        } catch (error) {
          log([{ text: `Add remote failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot, toastRun]
  );

  const setRemoteUrl = useCallback(
    async (name: string, url: string) => {
      await tauriGitBackend.setRemoteUrl(repoPath, name, url);
      await refreshRepositorySnapshot(repoPath);
    },
    [repoPath, refreshRepositorySnapshot]
  );

  const runAddRemoteFromDialog = useCallback(() => {
    const name = remoteDialogName.trim();
    const url = remoteDialogUrl.trim();
    if (name && url) {
      void addRemote(name, url);
    }
  }, [remoteDialogName, remoteDialogUrl, addRemote]);

  const runEditRemoteFromDialog = useCallback(() => {
    const name = remoteDialogName.trim();
    const url = remoteDialogUrl.trim();
    if (name && url) {
      void setRemoteUrl(name, url);
    }
  }, [remoteDialogName, remoteDialogUrl, setRemoteUrl]);

  const openAddRemoteDialog = useCallback(() => {
    setRemoteDialogName('');
    setRemoteDialogUrl('');
    setDialog({
      title: 'Add Remote',
      body: 'Configure a new remote for this repository.',
      cmd: '',
      action: 'Add Remote',
      kind: 'add-remote',
      run: runAddRemoteFromDialog
    });
  }, [runAddRemoteFromDialog]);

  const openEditRemoteDialog = useCallback((name: string, currentUrl: string) => {
    setRemoteDialogName(name);
    setRemoteDialogUrl(currentUrl);
    setDialog({
      title: 'Edit Remote URL',
      body: `Change the URL for remote '${name}'.`,
      cmd: '',
      action: 'Save changes',
      kind: 'edit-remote',
      run: runEditRemoteFromDialog
    });
  }, [runEditRemoteFromDialog]);

  const deleteRemote = useCallback(
    async (name: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git remote remove ${name}`, type: "cmd" }]);
          const result = await tauriGitBackend.deleteRemote(repoPath, name);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Remote removed", name);
        } catch (error) {
          log([{ text: `Remove remote failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot, toastRun]
  );

  const getRemotes = useCallback(async () => {
    try {
      return await tauriGitBackend.getRemotes(repoPath);
    } catch {
      return [];
    }
  }, [repoPath]);

  const applyPatchText = useCallback(
    async (patchContent: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: "$ git apply -", type: "cmd" }]);
          const result = await tauriGitBackend.applyPatch(repoPath, patchContent);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Applied patch", "Working tree updated");
        } catch (error) {
          log([{ text: `Apply patch failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot, toastRun]
  );

  const aiMessage = useCallback(async () => {
    setPaletteOpen(false);
    if (stagedFiles.length === 0) {
      log([{ text: 'No staged changes to summarize into a commit message', type: 'warn' }]);
      return;
    }

    if (!aiConfig.enabled) {
      log([{ text: 'AI commit message generation is disabled. Enable it in Settings → AI', type: 'warn' }]);
      return;
    }

    setAIBusy(true);
    log([{ text: 'Generating commit message with AI...', type: 'cmd' }]);

    try {
      const response = await generateAICommitMessage({
        repoPath,
        stagedFiles: stagedFiles.map(f => ({
          path: f.path,
          status: f.status,
          additions: f.add,
          deletions: f.del
        }))
      });

      setCommitMsg(response.message);
      toastRun('Commit message generated', 'by AI');
      log([{ text: '✓ Commit message generated successfully', type: 'ok' }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log([{ text: `✗ AI commit message generation failed: ${errorMessage}`, type: 'err' }]);

      // Fallback to simple generation
      const verbFor = (status: DiffFile['status']) =>
        status === 'A' ? 'Add' : status === 'D' ? 'Remove' : status === 'R' ? 'Rename' : 'Update';
      let generated: string;
      if (stagedFiles.length === 1) {
        const f = stagedFiles[0];
        generated = `${verbFor(f.status)} ${f.path}`;
      } else {
        const names = stagedFiles.slice(0, 3).map(f => f.path.split('/').pop());
        const suffix = stagedFiles.length > 3 ? ` and ${stagedFiles.length - 3} more` : '';
        generated = `Update ${stagedFiles.length} files: ${names.join(', ')}${suffix}`;
      }
      setCommitMsg(generated);
      toastRun('Commit message generated', `from ${stagedFiles.length} staged file${stagedFiles.length === 1 ? '' : 's'} (fallback)`);
    } finally {
      setAIBusy(false);
    }
  }, [repoPath, stagedFiles, log, toastRun, aiConfig]);

  const opContinue = useCallback(() => {
    if (!op) return;
    const n = op.step + 1;
    if (n > op.total) {
      setOp(null);
      toastRun('Rebase complete', '5 commits replayed onto main');
    } else {
      setOp({ ...op, step: n });
    }
  }, [op, toastRun]);

  const opSkip = useCallback(() => {
    if (op) setOp({ ...op, step: Math.min(op.step + 1, op.total) });
  }, [op]);

  const opAbort = useCallback(() => {
    confirm(
      'Abort rebase?',
      'The rebase is aborted and the branch reset to its pre-rebase state. Conflict resolutions made so far are discarded.',
      'git rebase --abort',
      'Abort rebase',
      () => {
        setOp(null);
        setDialog(null);
        toastRun('Rebase aborted', 'HEAD restored to its pre-rebase state');
      }
    );
  }, [confirm, toastRun]);

  const getFileList = useCallback((i: number) => buildFiles(i, commits), [commits]);

  const matchesFilter = useCallback(
    (i: number) => {
      const r = commits[i];
      if (f.author && r[1].toLowerCase().indexOf(f.author.toLowerCase()) < 0) return false;
      if (f.msg && r[0].toLowerCase().indexOf(f.msg.toLowerCase()) < 0) return false;
      if (f.from && r[2].slice(0, 10) < f.from) return false;
      if (f.to && r[2].slice(0, 10) > f.to) return false;
      if (f.ref) {
        const q = f.ref.replace('*', '').toLowerCase();
        if (!(r[4] || []).some(x => x.toLowerCase().indexOf(q) >= 0)) return false;
      }
      return true;
    },
    [commits, f]
  );

  const matchesCompareFilter = useCallback(
    (i: number) => {
      const r = commits[i];
      if (cf.msg && r[0].toLowerCase().indexOf(cf.msg.toLowerCase()) < 0) return false;
      if (cf.author && r[1].toLowerCase().indexOf(cf.author.toLowerCase()) < 0) return false;
      if (cf.noMerges && r[0].indexOf('Merge ') === 0) return false;
      if (cf.excl) {
        try {
          if (new RegExp(cf.excl, 'i').test(r[0])) return false;
        } catch {}
      }
      if (cf.from && r[2].slice(0, 10) < cf.from) return false;
      if (cf.to && r[2].slice(0, 10) > cf.to) return false;
      return true;
    },
    [commits, cf]
  );

  // Keyboard navigation hotkeys
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };
    const handleKey = (e: KeyboardEvent) => {
      const k = (e.key || '').toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        setPaletteQ('');
      } else if (e.key === 'Escape') {
        const hadOverlayOpen = paletteOpen || menu !== null || dialog !== null;
        setPaletteOpen(false);
        setMenu(null);
        setDialog(null);
        if (!hadOverlayOpen) {
          setSel([0]);
        }
      } else if ((e.metaKey || e.ctrlKey) && k === 'a' && view === 'compare' && !isEditableTarget(e.target)) {
        e.preventDefault();
        setSel(commits.map((_, i) => i));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [view, commits, paletteOpen, menu, dialog]);

  const fetchCommitFiles = useCallback(
    async (sha: string): Promise<DiffFile[]> => {
      if (!repoPath || !sha) return [];
      try {
        const files = await tauriGitBackend.getCommitFiles(repoPath, sha);
        return files.map(f => ({
          path: f.path,
          status: (f.status === "A" || f.status === "D" || f.status === "M" || f.status === "R" ? f.status : "M") as DiffFile["status"],
          add: f.additions,
          del: f.deletions
        }));
      } catch {
        return [];
      }
    },
    [repoPath]
  );

  const checkoutBranch = useCallback(
    async (branchName: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git checkout ${branchName}`, type: "cmd" }]);
          const result = await tauriGitBackend.checkoutBranch(repoPath, branchName);
          appendCommandResult(result);
          await refreshBranchSummary(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Checked out branch", branchName);
        } catch (error) {
          log([{ text: `Checkout branch failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun]
  );

  const renameBranch = useCallback(
    async (oldName: string, newName: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git branch -m ${oldName} ${newName}`, type: "cmd" }]);
          const result = await tauriGitBackend.renameBranch(repoPath, newName, oldName);
          appendCommandResult(result);
          await refreshBranchSummary(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Branch renamed", `${oldName} → ${newName}`);
        } catch (error) {
          log([{ text: `Rename branch failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun]
  );

  const deleteBranch = useCallback(
    async (branchName: string, isRemote = false, force = true) => {
      await runWithActionLock(async () => {
        try {
          const cmdStr = isRemote
            ? `git push ${branchName.split("/")[0]} --delete ${branchName.split("/").slice(1).join("/")}`
            : `git branch ${force ? "-D" : "-d"} ${branchName}`;
          log([{ text: `$ ${cmdStr}`, type: "cmd" }]);
          const result = await tauriGitBackend.deleteBranch(repoPath, branchName, isRemote, force);
          appendCommandResult(result);
          await refreshBranchSummary(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Branch deleted", branchName);
        } catch (error) {
          log([{ text: `Delete branch failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun]
  );

  const setUpstream = useCallback(
    async (branchName?: string, upstreamName?: string) => {
      await runWithActionLock(async () => {
        try {
          const target = branchName || currentBranch;
          const cmdStr = upstreamName ? `git branch --set-upstream-to=${upstreamName} ${target}` : `git branch --unset-upstream ${target}`;
          log([{ text: `$ ${cmdStr}`, type: "cmd" }]);
          const result = await tauriGitBackend.setUpstream(repoPath, { branch: branchName, upstream: upstreamName });
          appendCommandResult(result);
          await refreshBranchSummary(repoPath);
          toastRun("Upstream updated", upstreamName || "Unset upstream");
        } catch (error) {
          log([{ text: `Set upstream failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, currentBranch, runWithActionLock, log, appendCommandResult, refreshBranchSummary, toastRun]
  );

  const mergeBranch = useCallback(
    async (reference: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git merge ${reference}`, type: "cmd" }]);
          const result = await tauriGitBackend.mergeBranch(repoPath, reference);
          appendCommandResult(result);
          await refreshBranchSummary(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Merged branch", reference);
        } catch (error) {
          log([{ text: `Merge failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun]
  );

  const rebaseBranch = useCallback(
    async (reference: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git rebase ${reference}`, type: "cmd" }]);
          const result = await tauriGitBackend.rebaseBranch(repoPath, reference);
          appendCommandResult(result);
          await refreshBranchSummary(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Rebased onto", reference);
        } catch (error) {
          log([{ text: `Rebase failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun]
  );

  const resetToRef = useCallback(
    async (reference: string, mode: "soft" | "mixed" | "hard" = "mixed") => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git reset --${mode} ${reference}`, type: "cmd" }]);
          const result = await tauriGitBackend.resetHead(repoPath, reference, mode);
          appendCommandResult(result);
          await refreshBranchSummary(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun(`Reset (${mode})`, reference);
        } catch (error) {
          log([{ text: `Reset failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun]
  );

  const cherryPickCommit = useCallback(
    async (sha: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git cherry-pick ${sha}`, type: "cmd" }]);
          const result = await tauriGitBackend.cherryPick(repoPath, sha);
          appendCommandResult(result);
          await refreshBranchSummary(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Cherry-picked commit", sha.slice(0, 7));
        } catch (error) {
          log([{ text: `Cherry-pick failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun]
  );

  const revertCommit = useCallback(
    async (sha: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git revert --no-edit ${sha}`, type: "cmd" }]);
          const result = await tauriGitBackend.revertCommit(repoPath, sha);
          appendCommandResult(result);
          await refreshBranchSummary(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Reverted commit", sha.slice(0, 7));
        } catch (error) {
          log([{ text: `Revert failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun]
  );

  const createTag = useCallback(
    async (tagName: string, sha?: string) => {
      await runWithActionLock(async () => {
        try {
          const cmdStr = sha ? `git tag ${tagName} ${sha}` : `git tag ${tagName}`;
          log([{ text: `$ ${cmdStr}`, type: "cmd" }]);
          const result = await tauriGitBackend.createTag(repoPath, tagName, sha);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Tag created", tagName);
        } catch (error) {
          log([{ text: `Create tag failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot, toastRun]
  );

  const deleteTag = useCallback(
    async (tagName: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git tag -d ${tagName}`, type: "cmd" }]);
          const result = await tauriGitBackend.deleteTag(repoPath, tagName);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Tag deleted", tagName);
        } catch (error) {
          log([{ text: `Delete tag failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot, toastRun]
  );

  const stageFile = useCallback(
    async (path: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git add -- ${path}`, type: "cmd" }]);
          const result = await tauriGitBackend.stageFile(repoPath, path);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
        } catch (error) {
          log([{ text: `Stage file failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot]
  );

  const stageAll = useCallback(
    async () => {
      await runWithActionLock(async () => {
        try {
          log([{ text: "$ git add -A", type: "cmd" }]);
          const result = await tauriGitBackend.stageAll(repoPath);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
        } catch (error) {
          log([{ text: `Stage all failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot]
  );

  const unstageFile = useCallback(
    async (path: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git restore --staged -- ${path}`, type: "cmd" }]);
          const result = await tauriGitBackend.unstageFile(repoPath, path);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
        } catch (error) {
          log([{ text: `Unstage file failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot]
  );

  const unstageAll = useCallback(
    async () => {
      await runWithActionLock(async () => {
        try {
          log([{ text: "$ git restore --staged .", type: "cmd" }]);
          const result = await tauriGitBackend.unstageAll(repoPath);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
        } catch (error) {
          log([{ text: `Unstage all failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot]
  );

  const discardChanges = useCallback(
    async (path: string, isUntracked = false) => {
      await runWithActionLock(async () => {
        try {
          const cmdStr = isUntracked ? `git clean -fd -- ${path}` : `git restore -- ${path}`;
          log([{ text: `$ ${cmdStr}`, type: "cmd" }]);
          const result = await tauriGitBackend.discardChanges(repoPath, path, isUntracked);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
        } catch (error) {
          log([{ text: `Discard failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot]
  );

  const discardAll = useCallback(
    async () => {
      await runWithActionLock(async () => {
        try {
          log([{ text: "$ git restore . && git clean -fd", type: "cmd" }]);
          const result = await tauriGitBackend.discardAll(repoPath);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
        } catch (error) {
          log([{ text: `Discard all failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot]
  );

  const commitChanges = useCallback(
    async (message?: string, amend = false) => {
      const msgToUse = message !== undefined ? message : commitMsg;
      if (!msgToUse || !msgToUse.trim()) {
        log([{ text: "Commit message cannot be empty", type: "warn" }]);
        return;
      }
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git commit -m "${msgToUse.trim()}"${amend ? " --amend" : ""}`, type: "cmd" }]);
          const result = await tauriGitBackend.commit(repoPath, msgToUse.trim(), amend);
          appendCommandResult(result);
          if (result.exitCode === 0) {
            setCommitMsg("");
          }
          await refreshBranchSummary(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Committed changes", msgToUse.slice(0, 30));
        } catch (error) {
          log([{ text: `Commit failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, commitMsg, runWithActionLock, log, appendCommandResult, refreshBranchSummary, refreshRepositorySnapshot, toastRun]
  );

  const createStash = useCallback(
    async (message?: string, includeUntracked = true) => {
      await runWithActionLock(async () => {
        try {
          const cmdStr = message ? `git stash push -m "${message}"` : "git stash push";
          log([{ text: `$ ${cmdStr}`, type: "cmd" }]);
          const result = await tauriGitBackend.createStash(repoPath, { message, includeUntracked });
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Stash created", message || "WIP");
        } catch (error) {
          log([{ text: `Create stash failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot, toastRun]
  );

  const applyStash = useCallback(
    async (stashRef: string, pop = false) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git stash ${pop ? "pop" : "apply"} ${stashRef}`, type: "cmd" }]);
          const result = await tauriGitBackend.applyStash(repoPath, stashRef, pop);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
          toastRun(`Stash ${pop ? "popped" : "applied"}`, stashRef);
        } catch (error) {
          log([{ text: `Apply stash failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot, toastRun]
  );

  const dropStash = useCallback(
    async (stashRef: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git stash drop ${stashRef}`, type: "cmd" }]);
          const result = await tauriGitBackend.dropStash(repoPath, stashRef);
          appendCommandResult(result);
          await refreshRepositorySnapshot(repoPath);
          toastRun("Stash dropped", stashRef);
        } catch (error) {
          log([{ text: `Drop stash failed: ${error instanceof Error ? error.message : String(error)}`, type: "err" }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshRepositorySnapshot, toastRun]
  );


  const refreshWorktrees = useCallback(
    async (pathValue?: string) => {
      const target = pathValue || repoPath;
      if (!target) {
        setWorktrees([]);
        return;
      }
      try {
        const list = await tauriGitBackend.getWorktrees(target);
        setWorktrees(list);
      } catch {
        setWorktrees([]);
      }
    },
    [repoPath]
  );

  const refreshSubmodules = useCallback(
    async (pathValue?: string) => {
      const target = pathValue || repoPath;
      if (!target) {
        setSubmodules([]);
        return;
      }
      try {
        const list = await tauriGitBackend.getSubmodules(target, true);
        setSubmodules(list);
      } catch {
        setSubmodules([]);
      }
    },
    [repoPath]
  );

  const addWorktree = useCallback(
    async (path: string, options?: { reference?: string; newBranch?: string; detach?: boolean }) => {
      await runWithActionLock(async () => {
        try {
          let cmdStr = `git worktree add ${path}`;
          if (options?.newBranch) cmdStr = `git worktree add -b ${options.newBranch} ${path}`;
          if (options?.reference) cmdStr += ` ${options.reference}`;
          log([{ text: `$ ${cmdStr}`, type: 'cmd' }]);
          const result = await tauriGitBackend.addWorktree(repoPath, path, options);
          appendCommandResult(result);
          await refreshWorktrees(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun('Worktree added', path);
        } catch (error) {
          log([{ text: `Add worktree failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshWorktrees, refreshRepositorySnapshot, toastRun]
  );

  const removeWorktree = useCallback(
    async (path: string, force = false) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git worktree remove${force ? ' --force' : ''} ${path}`, type: 'cmd' }]);
          const result = await tauriGitBackend.removeWorktree(repoPath, path, force);
          appendCommandResult(result);
          await refreshWorktrees(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun('Worktree removed', path);
        } catch (error) {
          log([{ text: `Remove worktree failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshWorktrees, refreshRepositorySnapshot, toastRun]
  );

  const lockWorktree = useCallback(
    async (path: string, reason?: string) => {
      await runWithActionLock(async () => {
        try {
          const cmdStr = reason ? `git worktree lock --reason "${reason}" ${path}` : `git worktree lock ${path}`;
          log([{ text: `$ ${cmdStr}`, type: 'cmd' }]);
          const result = await tauriGitBackend.lockWorktree(repoPath, path, reason);
          appendCommandResult(result);
          await refreshWorktrees(repoPath);
          toastRun('Worktree locked', path);
        } catch (error) {
          log([{ text: `Lock worktree failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshWorktrees, toastRun]
  );

  const unlockWorktree = useCallback(
    async (path: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git worktree unlock ${path}`, type: 'cmd' }]);
          const result = await tauriGitBackend.unlockWorktree(repoPath, path);
          appendCommandResult(result);
          await refreshWorktrees(repoPath);
          toastRun('Worktree unlocked', path);
        } catch (error) {
          log([{ text: `Unlock worktree failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshWorktrees, toastRun]
  );

  const pruneWorktrees = useCallback(
    async (dryRun = false) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git worktree prune${dryRun ? ' --dry-run' : ''}`, type: 'cmd' }]);
          const result = await tauriGitBackend.pruneWorktrees(repoPath, dryRun);
          appendCommandResult(result);
          await refreshWorktrees(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun(dryRun ? 'Prune previewed' : 'Worktrees pruned', result.stdout.trim() || 'Done');
        } catch (error) {
          log([{ text: `Prune worktrees failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshWorktrees, refreshRepositorySnapshot, toastRun]
  );

  const openPathInFileManager = useCallback(
    async (path: string) => {
      try {
        await tauriGitBackend.openPathInFileManager(path);
      } catch (error) {
        log([{ text: `Open file manager failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
      }
    },
    [log]
  );

  const openPathInTerminal = useCallback(
    async (path: string) => {
      try {
        await tauriGitBackend.openPathInTerminal(path);
      } catch (error) {
        log([{ text: `Open terminal failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
      }
    },
    [log]
  );

  const initSubmodule = useCallback(
    async (path?: string) => {
      await runWithActionLock(async () => {
        try {
          const cmdStr = path ? `git submodule init -- ${path}` : 'git submodule init';
          log([{ text: `$ ${cmdStr}`, type: 'cmd' }]);
          const result = await tauriGitBackend.initSubmodule(repoPath, path);
          appendCommandResult(result);
          await refreshSubmodules(repoPath);
          toastRun('Submodule initialized', path || 'All submodules');
        } catch (error) {
          log([{ text: `Submodule init failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshSubmodules, toastRun]
  );

  const updateSubmodule = useCallback(
    async (options?: { path?: string; init?: boolean; recursive?: boolean }) => {
      await runWithActionLock(async () => {
        try {
          const pathArg = options?.path ? ` -- ${options.path}` : '';
          const recArg = options?.recursive ? ' --recursive' : '';
          log([{ text: `$ git submodule update --init${recArg}${pathArg}`, type: 'cmd' }]);
          const result = await tauriGitBackend.updateSubmodule(repoPath, options);
          appendCommandResult(result);
          await refreshSubmodules(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun('Submodules updated', options?.path || 'All submodules');
        } catch (error) {
          log([{ text: `Submodule update failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshSubmodules, refreshRepositorySnapshot, toastRun]
  );

  const updateAll = useCallback(() => {
    setPaletteOpen(false);
    void updateSubmodule({ init: true, recursive: true });
  }, [updateSubmodule]);

  const syncSubmodule = useCallback(
    async (options?: { path?: string; recursive?: boolean }) => {
      await runWithActionLock(async () => {
        try {
          const pathArg = options?.path ? ` -- ${options.path}` : '';
          const recArg = options?.recursive ? ' --recursive' : '';
          log([{ text: `$ git submodule sync${recArg}${pathArg}`, type: 'cmd' }]);
          const result = await tauriGitBackend.syncSubmodule(repoPath, options);
          appendCommandResult(result);
          await refreshSubmodules(repoPath);
          toastRun('Submodule synced', options?.path || 'All submodules');
        } catch (error) {
          log([{ text: `Submodule sync failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshSubmodules, toastRun]
  );

  const deinitSubmodule = useCallback(
    async (path: string, force = false) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git submodule deinit${force ? ' --force' : ''} -- ${path}`, type: 'cmd' }]);
          const result = await tauriGitBackend.deinitSubmodule(repoPath, path, force);
          appendCommandResult(result);
          await refreshSubmodules(repoPath);
          toastRun('Submodule deinitialized', path);
        } catch (error) {
          log([{ text: `Submodule deinit failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshSubmodules, toastRun]
  );

  const checkoutRecordedSubmoduleCommit = useCallback(
    async (path: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git submodule update -- ${path}`, type: 'cmd' }]);
          const result = await tauriGitBackend.checkoutRecordedSubmoduleCommit(repoPath, path);
          appendCommandResult(result);
          await refreshSubmodules(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun('Submodule checked out recorded commit', path);
        } catch (error) {
          log([{ text: `Submodule checkout recorded commit failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshSubmodules, refreshRepositorySnapshot, toastRun]
  );

  const pullSubmoduleTrackedBranch = useCallback(
    async (path: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git -C ${path} pull`, type: 'cmd' }]);
          const result = await tauriGitBackend.pullSubmoduleTrackedBranch(repoPath, path);
          appendCommandResult(result);
          await refreshSubmodules(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun('Submodule pulled tracked branch', path);
        } catch (error) {
          log([{ text: `Submodule pull tracked branch failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshSubmodules, refreshRepositorySnapshot, toastRun]
  );

  const getSubmodulePointerDiff = useCallback(
    async (path: string): Promise<string> => {
      try {
        log([{ text: `$ git diff --submodule=log -- ${path}`, type: 'cmd' }]);
        const diff = await tauriGitBackend.getSubmodulePointerDiff(repoPath, path);
        log([{ text: diff || 'No submodule pointer diff', type: 'out' }]);
        return diff;
      } catch (error) {
        log([{ text: `Submodule pointer diff failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        return '';
      }
    },
    [repoPath, log]
  );

  const stageSubmodulePointer = useCallback(
    async (path: string) => {
      await runWithActionLock(async () => {
        try {
          log([{ text: `$ git add -- ${path}`, type: 'cmd' }]);
          const result = await tauriGitBackend.stageSubmodulePointer(repoPath, path);
          appendCommandResult(result);
          await refreshSubmodules(repoPath);
          await refreshRepositorySnapshot(repoPath);
          toastRun('Staged submodule pointer', path);
        } catch (error) {
          log([{ text: `Stage submodule pointer failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
        }
      });
    },
    [repoPath, runWithActionLock, log, appendCommandResult, refreshSubmodules, refreshRepositorySnapshot, toastRun]
  );

  const paletteCheckoutBranch = useCallback(() => {
    setPaletteOpen(false);
    prompt(
      'Checkout Branch',
      'Enter the name of the local branch to check out.',
      'Checkout',
      currentBranch,
      value => {
        const name = value.trim();
        if (name) void checkoutBranch(name);
      },
      'Branch name'
    );
  }, [prompt, currentBranch, checkoutBranch]);

  const paletteRebase = useCallback(() => {
    setPaletteOpen(false);
    prompt(
      'Rebase Onto',
      `Enter the branch or reference to rebase "${currentBranch}" onto.`,
      'Rebase',
      '',
      value => {
        const ref = value.trim();
        if (ref) void rebaseBranch(ref);
      },
      'Branch or reference'
    );
  }, [prompt, currentBranch, rebaseBranch]);

  const paletteDeleteBranch = useCallback(() => {
    setPaletteOpen(false);
    prompt(
      'Delete Branch',
      'Enter the name of the local branch to delete. This cannot be undone.',
      'Delete',
      '',
      value => {
        const name = value.trim();
        if (name) void deleteBranch(name);
      },
      'Branch name'
    );
  }, [prompt, deleteBranch]);

  const paletteStashPush = useCallback(() => {
    setPaletteOpen(false);
    prompt(
      'Stash Changes',
      'Optional message describing this stash. All tracked changes will be stashed.',
      'Stash',
      '',
      value => {
        void createStash(value.trim() || undefined);
      },
      'Stash message (optional)',
      false
    );
  }, [prompt, createStash]);

  const paletteStashPop = useCallback(() => {
    setPaletteOpen(false);
    if (stashes.length === 0) {
      log([{ text: 'No stashes to pop', type: 'warn' }]);
      return;
    }
    void applyStash(stashes[0].stashRef, true);
  }, [stashes, applyStash, log]);

  const paletteAddWorktree = useCallback(() => {
    setPaletteOpen(false);
    prompt(
      'Add Worktree',
      'Enter the absolute path for the new worktree.',
      'Add',
      '',
      value => {
        const path = value.trim();
        if (path) void addWorktree(path);
      },
      'Worktree path'
    );
  }, [prompt, addWorktree]);

  const paletteAll = useCallback((): PaletteItem[] => {
    const nav = (v: GitClientView) => () => {
      setView(v);
      setPaletteOpen(false);
    };
    return [
      { group: 'Go to', label: 'Git Graph', hint: '⌘2', run: nav('graph') },
      { group: 'Go to', label: 'Branches', hint: '⌘1', run: nav('branches') },
      { group: 'Go to', label: 'Compare Branches', hint: '⌘4', run: nav('compare') },
      { group: 'Go to', label: 'Worktrees', hint: '⌘6', run: nav('worktrees') },
      { group: 'Go to', label: 'Submodules', hint: '⌘7', run: nav('submodules') },
      { group: 'Go to', label: 'Settings', hint: '⌘,', run: nav('settings') },
      { group: 'Branch', label: 'Checkout branch…', hint: '⌘B', run: paletteCheckoutBranch },
      { group: 'Branch', label: 'Create branch from HEAD…', run: () => createBranch() },
      { group: 'Branch', label: 'Rebase current onto…', run: paletteRebase },
      { group: 'Branch', label: 'Delete branch…', run: paletteDeleteBranch },
      { group: 'Remote', label: 'Fetch all with prune', hint: '⌘⇧F', run: () => doFetch() },
      { group: 'Remote', label: 'Pull', run: () => doPull() },
      { group: 'Remote', label: 'Push', run: () => doPush() },
      { group: 'Remote', label: 'Add remote…', run: () => openAddRemoteDialog() },
      { group: 'Commit', label: 'Commit staged changes', hint: '⌘↵', run: () => { setPaletteOpen(false); void commitChanges(); } },
      { group: 'Commit', label: 'Amend last commit', run: () => { setPaletteOpen(false); void commitChanges(undefined, true); } },
      { group: 'Commit', label: 'Generate commit message from staged changes', run: () => aiMessage() },
      { group: 'Stash', label: 'Stash all changes…', run: paletteStashPush },
      { group: 'Stash', label: 'Pop latest stash', run: paletteStashPop },
      { group: 'Worktree', label: 'Add worktree…', run: paletteAddWorktree },
      { group: 'Submodule', label: 'Update all submodules --recursive', run: () => updateAll() },
      { group: 'Diff', label: 'Compare any two text sources…', run: nav('diff') },
      {
        group: 'Diff',
        label: "Open selected commit's diff",
        run: () => {
          setDiffTab('refs');
          setView('diff');
          setPaletteOpen(false);
        }
      },
      { group: 'Repo', label: 'Open repository…', hint: '⌘O', run: () => openRepository() },
      { group: 'Repo', label: 'Clone repository…', run: () => cloneRepository() },
      ...(repoPath
        ? [{ group: 'Repo', label: 'Close repository', run: () => { setPaletteOpen(false); closeRepository(); } }]
        : []),
      { group: 'View', label: 'Toggle theme', run: () => toggleTheme() },
      {
        group: 'View',
        label: 'Toggle output console',
        run: () => {
          setConsoleOpen(prev => !prev);
          setPaletteOpen(false);
        }
      }
    ];
  }, [
    paletteCheckoutBranch,
    paletteRebase,
    paletteDeleteBranch,
    paletteStashPush,
    paletteStashPop,
    paletteAddWorktree,
    doFetch,
    doPull,
    doPush,
    createBranch,
    openAddRemoteDialog,
    commitChanges,
    aiMessage,
    updateAll,
    openRepository,
    cloneRepository,
    closeRepository,
    repoPath,
    toggleTheme
  ]);

  return (
    <GitClientContext.Provider
      value={{
        view,
        setView,
        theme,
        setTheme,
        toggleTheme,
        dock,
        setDock,
        toggleDock,
        consoleOpen,
        setConsoleOpen,
        toggleConsole,
        paletteOpen,
        setPaletteOpen,
        paletteQ,
        setPaletteQ,
        openPalette,
        closePalette,
        menu,
        openMenu,
        closeMenu,
        dialog,
        confirm,
        prompt,
        closeDialog,
        confirmDialog,
        promptDialogValue,
        setPromptDialogValue,
        cloneDialogUrl,
        setCloneDialogUrl,
        cloneDialogUseGit,
        setCloneDialogUseGit,
        remoteDialogName,
        setRemoteDialogName,
        remoteDialogUrl,
        setRemoteDialogUrl,
        toast,
        toastPct,
        toastRun,
        cancelToast,
        op,
        setOp,
        opContinue,
        opSkip,
        opAbort,
        sel,
        setSel,
        toggleSelCommit,
        diffTargetSha,
        setDiffTargetSha,
        compareSeedRef,
        setCompareSeedRef,
        findCommitIndexBySha,
        expanded,
        toggleExpandCommit,
        graphLayout,
        setGraphLayout,
        compareMode,
        setCompareMode,
        compareLayout,
        setCompareLayout,
        filterOpen,
        setFilterOpen,
        f,
        setF,
        cf,
        setCf,
        branchQ,
        setBranchQ,
        scTab,
        setScTab,
        diffTab,
        setDiffTab,
        consoleLines,
        log,
        clearConsole,
        commitMsg,
        setCommitMsg,
        commits,
        totalCommitCount,
        getCommitHash,
        getCommitFullSha,
        graphData,
        graphHasMore,
        graphLoading,
        graphLoadingMore,
        loadMoreGraph,
        getFileList,
        stagedFiles,
        unstagedFiles,
        untrackedFiles,
        stashes,
        worktrees,
        submodules,
        refreshWorktrees,
        refreshSubmodules,
        addWorktree,
        removeWorktree,
        lockWorktree,
        unlockWorktree,
        pruneWorktrees,
        openPathInFileManager,
        openPathInTerminal,
        initSubmodule,
        updateSubmodule,
        syncSubmodule,
        deinitSubmodule,
        checkoutRecordedSubmoduleCommit,
        pullSubmoduleTrackedBranch,
        getSubmodulePointerDiff,
        stageSubmodulePointer,
        checkoutBranch,
        renameBranch,
        deleteBranch,
        setUpstream,
        mergeBranch,
        rebaseBranch,
        resetToRef,
        cherryPickCommit,
        revertCommit,
        createTag,
        deleteTag,
        stageFile,
        stageAll,
        unstageFile,
        unstageAll,
        discardChanges,
        discardAll,
        commitChanges,
        createStash,
        applyStash,
        dropStash,
        fetchCommitFiles,
        matchesFilter,
        matchesCompareFilter,
        doFetch,
        doPull,
        doPush,
        createBranch,
        openRepository,
        cloneRepository,
        closeRepository,
        knownRepositories,
        selectRepository,
        forgetRepository,
        actionBusy,
        activeRemoteAction,
        aiMessage,
        aiBusy,
        aiConfig,
        updateAIConfig,
        updateAll,
        paletteAll,
        repoName,
        repoPath,
        currentBranch,
        aheadCount,
        behindCount,
        onFetchProp: props.onFetch,
        onPullProp: props.onPull,
        onPushProp: props.onPush,
        getCompare,
        createPatch,
        applyPatchText,
        addRemote,
        setRemoteUrl,
        deleteRemote,
        getRemotes,
        openAddRemoteDialog,
        openEditRemoteDialog,
        preferences,
        updatePreference
      }}
    >
      {children}
    </GitClientContext.Provider>
  );
};

export const useGitClient = (): GitClientContextType => {
  const ctx = useContext(GitClientContext);
  if (!ctx) {
    throw new Error('useGitClient must be used within a GitClientProvider');
  }
  return ctx;
};
