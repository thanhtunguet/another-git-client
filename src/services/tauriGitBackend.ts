import { invoke } from "@tauri-apps/api/core";

export interface GitCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface TerminalDimensions {
  cols: number;
  rows: number;
}

export interface BranchRef {
  name: string;
  fullRef: string;
  upstream?: string;
  ahead: number;
  behind: number;
  current: boolean;
  kind: "local" | "remote" | string;
  lastCommitEpoch?: number;
}

export interface TagRef {
  name: string;
  fullRef: string;
  sha: string;
  lastCommitEpoch?: number;
}

export interface GraphCommitRow {
  graph: string;
  sha: string;
  shortSha: string;
  parents: string[];
  refs: string[];
  author: string;
  date: string;
  subject: string;
}

export interface ChangedFile {
  status: string;
  indexStatus: string;
  worktreeStatus: string;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  oldPath?: string;
  path: string;
}

export interface WorktreeEntry {
  path: string;
  head?: string;
  branch?: string;
  detached: boolean;
  bare: boolean;
  locked: boolean;
  lockReason?: string;
  prunableReason?: string;
  isCurrent: boolean;
  isDirty: boolean;
  headSubject?: string;
}

export interface SubmoduleEntry {
  path: string;
  name?: string;
  url?: string;
  branch?: string;
  sha?: string;
  recordedSha?: string;
  initialized: boolean;
  status: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
}

export interface StashEntry {
  index: number;
  stashRef: string;
  sha: string;
  message: string;
  branch: string;
  date: string;
}



export interface RemoteEntry {
  name: string;
  url: string;
  kind: string;
}

export interface GitCompareResult {
  leftRef: string;
  rightRef: string;
  mergeBase?: string;
  commitsOnlyLeft: GraphCommitRow[];
  commitsOnlyRight: GraphCommitRow[];
  changedFiles: ChangedFile[];
}

export interface CommitFileChange {
  path: string;
  status: string;
  additions: number;
  deletions: number;
}

export const tauriGitBackend = {
  isRepo(repoPath: string) {
    return invoke<boolean>("git_is_repo", { repoPath });
  },

  getBranches(repoPath: string) {
    return invoke<BranchRef[]>("git_get_branches", { repoPath });
  },

  getCurrentBranch(repoPath: string) {
    return invoke<string>("git_get_current_branch", { repoPath });
  },

  getTags(repoPath: string) {
    return invoke<TagRef[]>("git_get_tags", { repoPath });
  },

  getCommitCount(repoPath: string, options?: { allRefs?: boolean }) {
    return invoke<number>("git_get_commit_count", {
      repoPath,
      allRefs: options?.allRefs
    });
  },

  getGraph(repoPath: string, options?: { maxCount?: number; skip?: number; allRefs?: boolean }) {
    return invoke<GraphCommitRow[]>("git_get_graph", {
      repoPath,
      maxCount: options?.maxCount,
      skip: options?.skip,
      allRefs: options?.allRefs
    });
  },

  getRefGraph(repoPath: string, reference: string, options?: { maxCount?: number }) {
    return invoke<GraphCommitRow[]>("git_get_ref_graph", {
      repoPath,
      reference,
      maxCount: options?.maxCount
    });
  },

  getChangedFiles(repoPath: string) {
    return invoke<ChangedFile[]>("git_get_changed_files", { repoPath });
  },

  getWorktrees(repoPath: string) {
    return invoke<WorktreeEntry[]>("git_get_worktrees", { repoPath });
  },

  getSubmodules(repoPath: string, recursive = true) {
    return invoke<SubmoduleEntry[]>("git_get_submodules", { repoPath, recursive });
  },

  checkoutBranch(repoPath: string, branch: string) {
    return invoke<GitCommandResult>("git_checkout_branch", { repoPath, branch });
  },

  createBranch(repoPath: string, branch: string, base?: string) {
    return invoke<GitCommandResult>("git_create_branch", { repoPath, branch, base });
  },

  renameBranch(repoPath: string, newName: string, oldName?: string) {
    return invoke<GitCommandResult>("git_rename_branch", { repoPath, oldName, newName });
  },

  deleteBranch(repoPath: string, branch: string, isRemote = false, force = true) {
    return invoke<GitCommandResult>("git_delete_branch", { repoPath, branch, isRemote, force });
  },

  setUpstream(repoPath: string, options?: { branch?: string; upstream?: string }) {
    return invoke<GitCommandResult>("git_set_upstream", {
      repoPath,
      branch: options?.branch,
      upstream: options?.upstream
    });
  },

  mergeBranch(repoPath: string, reference: string) {
    return invoke<GitCommandResult>("git_merge_branch", { repoPath, reference });
  },

  rebaseBranch(repoPath: string, reference: string) {
    return invoke<GitCommandResult>("git_rebase_branch", { repoPath, reference });
  },

  resetHead(repoPath: string, reference: string, mode: "soft" | "mixed" | "hard" = "mixed") {
    return invoke<GitCommandResult>("git_reset", { repoPath, reference, mode });
  },

  cloneRepo(url: string, destination: string) {
    return invoke<GitCommandResult>("git_clone_repo", { url, destination });
  },

  fetch(repoPath: string, options?: { remote?: string; prune?: boolean }) {
    return invoke<GitCommandResult>("git_fetch", {
      repoPath,
      remote: options?.remote,
      prune: options?.prune
    });
  },

  pull(repoPath: string, options?: { remote?: string; branch?: string }) {
    return invoke<GitCommandResult>("git_pull", {
      repoPath,
      remote: options?.remote,
      branch: options?.branch
    });
  },

  push(repoPath: string, options?: { remote?: string; branch?: string; setUpstream?: boolean }) {
    return invoke<GitCommandResult>("git_push", {
      repoPath,
      remote: options?.remote,
      branch: options?.branch,
      setUpstream: options?.setUpstream
    });
  },

  getCommitFiles(repoPath: string, sha: string) {
    return invoke<CommitFileChange[]>("git_get_commit_files", { repoPath, sha });
  },

  getCommitDiff(repoPath: string, sha: string, filePath?: string) {
    return invoke<string>("git_get_commit_diff", { repoPath, sha, filePath });
  },

  cherryPick(repoPath: string, sha: string) {
    return invoke<GitCommandResult>("git_cherry_pick", { repoPath, sha });
  },

  revertCommit(repoPath: string, sha: string) {
    return invoke<GitCommandResult>("git_revert_commit", { repoPath, sha });
  },

  createTag(repoPath: string, tagName: string, sha?: string) {
    return invoke<GitCommandResult>("git_create_tag", { repoPath, tagName, sha });
  },

  deleteTag(repoPath: string, tagName: string) {
    return invoke<GitCommandResult>("git_delete_tag", { repoPath, tagName });
  },

  stageFile(repoPath: string, path: string) {
    return invoke<GitCommandResult>("git_stage_file", { repoPath, path });
  },

  stageAll(repoPath: string) {
    return invoke<GitCommandResult>("git_stage_all", { repoPath });
  },

  unstageFile(repoPath: string, path: string) {
    return invoke<GitCommandResult>("git_unstage_file", { repoPath, path });
  },

  unstageAll(repoPath: string) {
    return invoke<GitCommandResult>("git_unstage_all", { repoPath });
  },

  discardChanges(repoPath: string, path: string, isUntracked = false) {
    return invoke<GitCommandResult>("git_discard_changes", { repoPath, path, isUntracked });
  },

  discardAll(repoPath: string) {
    return invoke<GitCommandResult>("git_discard_all", { repoPath });
  },

  commit(repoPath: string, message: string, amend = false) {
    return invoke<GitCommandResult>("git_commit", { repoPath, message, amend });
  },

  getStashes(repoPath: string) {
    return invoke<StashEntry[]>("git_get_stashes", { repoPath });
  },

  createStash(repoPath: string, options?: { message?: string; includeUntracked?: boolean }) {
    return invoke<GitCommandResult>("git_create_stash", {
      repoPath,
      message: options?.message,
      includeUntracked: options?.includeUntracked
    });
  },

  applyStash(repoPath: string, stashRef: string, pop = false) {
    return invoke<GitCommandResult>("git_apply_stash", { repoPath, stashRef, pop });
  },

  dropStash(repoPath: string, stashRef: string) {
    return invoke<GitCommandResult>("git_drop_stash", { repoPath, stashRef });
  },

  showFileDiff(repoPath: string, path: string, staged = false, untracked = false) {
    return invoke<string>("git_show_file_diff", { repoPath, path, staged, untracked });
  },

  addWorktree(
    repoPath: string,
    path: string,
    options?: { reference?: string; newBranch?: string; detach?: boolean }
  ) {
    return invoke<GitCommandResult>("git_worktree_add", {
      repoPath,
      path,
      reference: options?.reference,
      newBranch: options?.newBranch,
      detach: options?.detach
    });
  },

  removeWorktree(repoPath: string, path: string, force = false) {
    return invoke<GitCommandResult>("git_worktree_remove", { repoPath, path, force });
  },

  updateSubmodule(
    repoPath: string,
    options?: { path?: string; init?: boolean; recursive?: boolean }
  ) {
    return invoke<GitCommandResult>("git_submodule_update", {
      repoPath,
      path: options?.path,
      init: options?.init,
      recursive: options?.recursive
    });
  },

  syncSubmodule(repoPath: string, options?: { path?: string; recursive?: boolean }) {
    return invoke<GitCommandResult>("git_submodule_sync", {
      repoPath,
      path: options?.path,
      recursive: options?.recursive
    });
  },

  deinitSubmodule(repoPath: string, path: string, force = false) {
    return invoke<GitCommandResult>("git_submodule_deinit", { repoPath, path, force });
  },

  lockWorktree(repoPath: string, path: string, reason?: string) {
    return invoke<GitCommandResult>("git_worktree_lock", { repoPath, path, reason });
  },

  unlockWorktree(repoPath: string, path: string) {
    return invoke<GitCommandResult>("git_worktree_unlock", { repoPath, path });
  },

  pruneWorktrees(repoPath: string, dryRun = false) {
    return invoke<GitCommandResult>("git_worktree_prune", { repoPath, dryRun });
  },

  openPathInFileManager(path: string) {
    return invoke<GitCommandResult>("git_open_path_in_file_manager", { path });
  },

  openPathInTerminal(path: string) {
    return invoke<GitCommandResult>("git_open_path_in_terminal", { path });
  },

  startTerminal(sessionId: string, cwd: string, dimensions?: TerminalDimensions) {
    return invoke<void>("terminal_start", {
      sessionId,
      cwd,
      cols: dimensions?.cols,
      rows: dimensions?.rows
    });
  },

  writeTerminal(sessionId: string, data: string) {
    return invoke<void>("terminal_write", { sessionId, data });
  },

  resizeTerminal(sessionId: string, dimensions: TerminalDimensions) {
    return invoke<void>("terminal_resize", { sessionId, ...dimensions });
  },

  stopTerminal(sessionId: string) {
    return invoke<void>("terminal_stop", { sessionId });
  },

  initSubmodule(repoPath: string, path?: string) {
    return invoke<GitCommandResult>("git_submodule_init", { repoPath, path });
  },

  getSubmodulePointerDiff(repoPath: string, path: string) {
    return invoke<string>("git_submodule_pointer_diff", { repoPath, path });
  },

  stageSubmodulePointer(repoPath: string, path: string) {
    return invoke<GitCommandResult>("git_submodule_stage_pointer", { repoPath, path });
  },

  checkoutRecordedSubmoduleCommit(repoPath: string, path: string) {
    return invoke<GitCommandResult>("git_submodule_checkout_recorded", { repoPath, path });
  },  pullSubmoduleTrackedBranch(repoPath: string, path: string) {
    return invoke<GitCommandResult>("git_submodule_pull_tracked", { repoPath, path });
  },

  getCompare(repoPath: string, leftRef: string, rightRef: string) {
    return invoke<GitCompareResult>("git_get_compare", { repoPath, leftRef, rightRef });
  },

  createPatch(repoPath: string, reference: string, filePath?: string) {
    return invoke<string>("git_create_patch", { repoPath, reference, filePath });
  },  applyPatch(repoPath: string, patchContent: string) {
    return invoke<GitCommandResult>("git_apply_patch", { repoPath, patchContent });
  },

  addRemote(repoPath: string, name: string, url: string) {
    return invoke<GitCommandResult>("git_add_remote", { repoPath, name, url });
  },

  setRemoteUrl(repoPath: string, name: string, url: string) {
    return invoke<GitCommandResult>("git_set_remote_url", { repoPath, name, url });
  },

  deleteRemote(repoPath: string, name: string) {
    return invoke<GitCommandResult>("git_delete_remote", { repoPath, name });
  },

  getRemotes(repoPath: string) {
    return invoke<RemoteEntry[]>("git_get_remotes", { repoPath });
  },

  getStagedDiff(repoPath: string, maxBytes?: number) {
    return invoke<string>("git_get_staged_diff", { repoPath, maxBytes });
  },
};
