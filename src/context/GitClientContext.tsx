import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import { tauriGitBackend, type GitCommandResult } from '../services/tauriGitBackend';

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
  closeDialog: () => void;
  confirmDialog: () => void;
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
  diffTab: 'work' | 'index' | 'parent' | 'refs' | 'merge' | 'sources';
  setDiffTab: (t: 'work' | 'index' | 'parent' | 'refs' | 'merge' | 'sources') => void;
  consoleLines: LogEntry[];
  log: (lines: LogEntry[]) => void;
  clearConsole: () => void;
  commitMsg: string;
  setCommitMsg: (msg: string) => void;
  commits: CommitRaw[];
  graphData: GraphData;
  getFileList: (i: number) => DiffFile[];
  matchesFilter: (i: number) => boolean;
  matchesCompareFilter: (i: number) => boolean;
  act: (label: string, extra?: string) => () => void;
  doFetch: () => void;
  doPull: () => void;
  doPush: () => void;
  createBranch: () => void;
  openRepository: () => void;
  cloneRepository: () => void;
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
}

const GitClientContext = createContext<GitClientContextType | null>(null);

export const GitClientProvider: React.FC<{
  props?: GitClientProps;
  children: React.ReactNode;
}> = ({ props = {}, children }) => {
  const [view, setView] = useState<GitClientView>(props.initialView || 'graph');
  const [theme, setThemeState] = useState<Theme>(props.initialTheme || 'dark');
  const [dock, setDock] = useState<boolean>(true);
  const [consoleOpen, setConsoleOpen] = useState<boolean>(false);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [paletteQ, setPaletteQ] = useState<string>('');
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [toastPct, setToastPct] = useState<number>(0);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [op, setOp] = useState<OperationState | null>(null);
  const [sel, setSel] = useState<number[]>([0]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const [graphLayout, setGraphLayout] = useState<'rows' | 'grouped'>('rows');
  const [compareMode, setCompareMode] = useState<'list' | 'graph'>('list');
  const [compareLayout, setCompareLayout] = useState<'side' | 'stack'>('side');
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
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
  const [scTab, setScTab] = useState<'changes' | 'stash'>('changes');
  const [diffTab, setDiffTab] = useState<
    'work' | 'index' | 'parent' | 'refs' | 'merge' | 'sources'
  >('work');
  const [consoleLines, setConsoleLines] = useState<LogEntry[]>(seedLog());
  const [commitMsg, setCommitMsg] = useState<string>(
    'net/mlx5e: add TX steering for tunneled traffic\n\nSteer tunneled TX traffic to the dedicated SQ set so encapsulated\nflows keep their hardware offload.\n\nSigned-off-by: '
  );

  const commits = RAW_COMMITS;
  const [repoPath, setRepoPath] = useState<string>(props.repoPath || '~/src/torvalds/linux');
  const [repoName, setRepoName] = useState<string>(props.repoName || 'linux');
  const [currentBranch, setCurrentBranch] = useState<string>(props.currentBranch || 'main');
  const [aheadCount, setAheadCount] = useState<number>(props.aheadCount !== undefined ? props.aheadCount : 3);
  const [behindCount, setBehindCount] = useState<number>(props.behindCount !== undefined ? props.behindCount : 12);

  const graphData = useMemo(() => buildGraphData(commits), [commits]);

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

  const refreshBranchSummary = useCallback(async (pathValue: string) => {
    try {
      const branches = await tauriGitBackend.getBranches(pathValue);
      const current = branches.find(b => b.current) || branches.find(b => b.kind === 'local');
      if (current) {
        setCurrentBranch(current.name);
        setAheadCount(current.ahead || 0);
        setBehindCount(current.behind || 0);
      }
    } catch {
      // Ignore until a valid repo is selected.
    }
  }, []);

  const setActiveRepository = useCallback(async (pathValue: string) => {
    setRepoPath(pathValue);
    setRepoName(getRepoNameFromPath(pathValue));
    await refreshBranchSummary(pathValue);
  }, [getRepoNameFromPath, refreshBranchSummary]);

  const toastRun = useCallback(
    (title: string, detail: string, done?: () => void) => {
      if (toastTimer) clearInterval(toastTimer);
      setToast({ title, detail });
      setToastPct(6);
      let p = 6;
      const interval = setInterval(() => {
        p += 11;
        if (p >= 100) {
          clearInterval(interval);
          setToastPct(100);
          setTimeout(() => setToast(null), 700);
          if (done) done();
        } else {
          setToastPct(p);
        }
      }, 220);
      setToastTimer(interval);
    },
    [toastTimer]
  );

  const cancelToast = useCallback(() => {
    if (toastTimer) clearInterval(toastTimer);
    setToast(null);
    log([{ text: '^C  operation cancelled by user', type: 'warn' }]);
  }, [toastTimer, log]);

  const confirm = useCallback(
    (title: string, body: string, cmd: string, action: string, run?: () => void) => {
      setDialog({ title, body, cmd, action, run });
      setMenu(null);
    },
    []
  );

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const confirmDialog = useCallback(() => {
    const d = dialog;
    setDialog(null);
    if (d && d.run) d.run();
  }, [dialog]);

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
    setSel(prev => {
      if (isMulti) {
        return prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i];
      }
      return [i];
    });
  }, []);

  const toggleExpandCommit = useCallback((i: number) => {
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }));
  }, []);

  const act = useCallback(
    (label: string, extra?: string) => {
      return () => {
        setMenu(null);
        setPaletteOpen(false);
        const cmdStr =
          extra ||
          label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
        log([
          { text: '$ git ' + cmdStr, type: 'cmd' },
          { text: 'ok', type: 'ok' }
        ]);
        toastRun(label, 'running ' + (extra || 'git command') + '…');
      };
    },
    [log, toastRun]
  );

  const openRepository = useCallback(() => {
    const pickedPath = window.prompt('Open repository path', repoPath);
    if (!pickedPath || !pickedPath.trim()) {
      return;
    }
    const nextPath = pickedPath.trim();
    void (async () => {
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
    })();
  }, [repoPath, log, setActiveRepository, toastRun]);

  const cloneRepository = useCallback(() => {
    const cloneUrl = window.prompt('Clone URL', '');
    if (!cloneUrl || !cloneUrl.trim()) {
      return;
    }
    const destination = window.prompt('Clone destination path', '');
    if (!destination || !destination.trim()) {
      return;
    }
    const url = cloneUrl.trim();
    const destinationPath = destination.trim();
    confirm(
      `Clone ${url}?`,
      `This will clone into ${destinationPath}.`,
      `git clone ${url} ${destinationPath}`,
      'Clone',
      () => {
        void (async () => {
          try {
            log([{ text: `$ git clone ${url} ${destinationPath}`, type: 'cmd' }]);
            const result = await tauriGitBackend.cloneRepo(url, destinationPath);
            appendCommandResult(result);
            await setActiveRepository(destinationPath);
            toastRun('Clone complete', destinationPath);
          } catch (error) {
            log([{ text: `Clone failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
          }
        })();
      }
    );
  }, [confirm, log, appendCommandResult, setActiveRepository, toastRun]);

  const createBranch = useCallback(() => {
    const branchName = window.prompt('Create new branch', 'feature/new-branch');
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
          try {
            log([{ text: `$ git branch ${nextBranch} ${currentBranch}`, type: 'cmd' }]);
            const createResult = await tauriGitBackend.createBranch(repoPath, nextBranch, currentBranch);
            appendCommandResult(createResult);
            log([{ text: `$ git checkout ${nextBranch}`, type: 'cmd' }]);
            const checkoutResult = await tauriGitBackend.checkoutBranch(repoPath, nextBranch);
            appendCommandResult(checkoutResult);
            await refreshBranchSummary(repoPath);
            toastRun('Branch created', nextBranch);
          } catch (error) {
            log([{ text: `Create branch failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
          }
        })();
      }
    );
  }, [confirm, currentBranch, repoPath, log, appendCommandResult, refreshBranchSummary, toastRun]);

  useEffect(() => {
    void refreshBranchSummary(repoPath);
  }, [repoPath, refreshBranchSummary]);

  const doFetch = useCallback(() => {
    confirm(
      'Fetch all remotes with prune?',
      'This updates all remote tracking refs and prunes refs that no longer exist on the remote.',
      'git fetch --prune',
      'Fetch',
      () => {
        void (async () => {
          try {
            setPaletteOpen(false);
            log([{ text: '$ git fetch --prune', type: 'cmd' }]);
            const result = await tauriGitBackend.fetch(repoPath, { prune: true });
            appendCommandResult(result);
            await refreshBranchSummary(repoPath);
            toastRun('Fetch complete', 'Fetched with prune');
            if (props.onFetch) props.onFetch();
          } catch (error) {
            log([{ text: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
          }
        })();
      }
    );
  }, [confirm, log, toastRun, props, repoPath, appendCommandResult, refreshBranchSummary]);

  const doPull = useCallback(() => {
    confirm(
      'Pull latest changes?',
      `Incoming preview: ${behindCount} commits. This updates ${currentBranch} from its upstream branch.`,
      'git pull',
      'Pull',
      () => {
        void (async () => {
          try {
            log([{ text: '$ git pull', type: 'cmd' }]);
            const result = await tauriGitBackend.pull(repoPath);
            appendCommandResult(result);
            await refreshBranchSummary(repoPath);
            toastRun('Pull complete', 'Local branch updated from remote');
            if (props.onPull) props.onPull();
          } catch (error) {
            log([{ text: `Pull failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
          }
        })();
      }
    );
  }, [confirm, log, toastRun, props, repoPath, appendCommandResult, refreshBranchSummary, behindCount, currentBranch]);

  const doPush = useCallback(() => {
    confirm(
      `Push ${aheadCount} commits from ${currentBranch}?`,
      `Outgoing preview: ${aheadCount} commits. Remote branch is ${behindCount} commits ahead.`,
      'git push',
      'Push',
      () => {
        void (async () => {
          try {
            log([{ text: '$ git push', type: 'cmd' }]);
            const result = await tauriGitBackend.push(repoPath);
            appendCommandResult(result);
            await refreshBranchSummary(repoPath);
            toastRun('Push complete', `${currentBranch} updated on remote`);
            if (props.onPush) props.onPush();
          } catch (error) {
            log([{ text: `Push failed: ${error instanceof Error ? error.message : String(error)}`, type: 'err' }]);
          }
        })();
      }
    );
  }, [confirm, props, repoPath, appendCommandResult, refreshBranchSummary, currentBranch, aheadCount, behindCount, log, toastRun]);

  const aiMessage = useCallback(() => {
    setPaletteOpen(false);
    toastRun(
      'Generating commit message',
      'analysing staged diff — 4 files, 212 lines (timeout 20s)'
    );
  }, [toastRun]);

  const updateAll = useCallback(() => {
    setPaletteOpen(false);
    log([
      { text: '$ git submodule update --init --recursive', type: 'cmd' },
      { text: "Cloning into 'tools/lib/bpf'…", type: 'out' },
      { text: "Submodule path 'tools/lib/bpf': checked out '2f8a1c4'", type: 'out' }
    ]);
    toastRun('Updating 7 submodules', 'tools/lib/bpf — receiving objects 42%');
  }, [log, toastRun]);

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
        toastRun('Rebase aborted', 'HEAD restored to f3a9c21');
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
      { group: 'Branch', label: 'Checkout branch…', hint: '⌘B', run: act('Checkout branch') },
      { group: 'Branch', label: 'Create branch from HEAD…', run: () => createBranch() },
      { group: 'Branch', label: 'Rebase current onto…', run: act('Rebase') },
      { group: 'Branch', label: 'Delete branch…', run: act('Delete branch') },
      { group: 'Remote', label: 'Fetch all with prune', hint: '⌘⇧F', run: () => doFetch() },
      { group: 'Remote', label: 'Pull', run: () => doPull() },
      { group: 'Remote', label: 'Push', run: () => doPush() },
      { group: 'Remote', label: 'Add remote…', run: act('Add remote') },
      { group: 'Commit', label: 'Commit staged changes', hint: '⌘↵', run: act('Commit') },
      { group: 'Commit', label: 'Amend last commit', run: act('Amend') },
      { group: 'Commit', label: 'Generate commit message with AI', run: () => aiMessage() },
      { group: 'Stash', label: 'Stash all changes…', run: act('Stash push') },
      { group: 'Stash', label: 'Pop latest stash', run: act('Stash pop') },
      { group: 'Worktree', label: 'Add worktree…', run: act('Worktree add') },
      { group: 'Submodule', label: 'Update all submodules --recursive', run: () => updateAll() },
      { group: 'Diff', label: 'Compare any two text sources…', run: nav('diff') },
      { group: 'Diff', label: 'Compare file with revision…', run: act('Compare with revision') },
      { group: 'Repo', label: 'Open repository…', hint: '⌘O', run: () => openRepository() },
      { group: 'Repo', label: 'Clone repository…', run: () => cloneRepository() },
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
  }, [act, doFetch, doPull, doPush, createBranch, aiMessage, updateAll, openRepository, cloneRepository, toggleTheme]);

  // Keyboard navigation hotkeys
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const k = (e.key || '').toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        setPaletteQ('');
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
        setMenu(null);
        setDialog(null);
        setSel([0]);
      } else if ((e.metaKey || e.ctrlKey) && k === 'a' && view === 'compare') {
        e.preventDefault();
        setSel(commits.map((_, i) => i));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [view, commits]);

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
        closeDialog,
        confirmDialog,
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
        graphData,
        getFileList,
        matchesFilter,
        matchesCompareFilter,
        act,
        doFetch,
        doPull,
        doPush,
        createBranch,
        openRepository,
        cloneRepository,
        aiMessage,
        updateAll,
        paletteAll,
        repoName,
        repoPath,
        currentBranch,
        aheadCount,
        behindCount,
        onFetchProp: props.onFetch,
        onPullProp: props.onPull,
        onPushProp: props.onPush
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
