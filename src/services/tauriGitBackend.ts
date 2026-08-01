import { invoke } from '@tauri-apps/api/core';

export interface GitCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface BranchRef {
  name: string;
  fullRef: string;
  upstream?: string;
  ahead: number;
  behind: number;
  current: boolean;
  kind: 'local' | 'remote' | string;
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
}

export interface SubmoduleEntry {
  path: string;
  name?: string;
  url?: string;
  sha?: string;
  initialized: boolean;
  status: string;
}

export const tauriGitBackend = {
  isRepo(repoPath: string) {
    return invoke<boolean>('git_is_repo', { repoPath });
  },

  getBranches(repoPath: string) {
    return invoke<BranchRef[]>('git_get_branches', { repoPath });
  },

  getTags(repoPath: string) {
    return invoke<TagRef[]>('git_get_tags', { repoPath });
  },

  getGraph(repoPath: string, options?: { maxCount?: number; skip?: number; allRefs?: boolean }) {
    return invoke<GraphCommitRow[]>('git_get_graph', {
      repoPath,
      maxCount: options?.maxCount,
      skip: options?.skip,
      allRefs: options?.allRefs
    });
  },

  getChangedFiles(repoPath: string) {
    return invoke<ChangedFile[]>('git_get_changed_files', { repoPath });
  },

  getWorktrees(repoPath: string) {
    return invoke<WorktreeEntry[]>('git_get_worktrees', { repoPath });
  },

  getSubmodules(repoPath: string, recursive = true) {
    return invoke<SubmoduleEntry[]>('git_get_submodules', { repoPath, recursive });
  },

  checkoutBranch(repoPath: string, branch: string) {
    return invoke<GitCommandResult>('git_checkout_branch', { repoPath, branch });
  },

  createBranch(repoPath: string, branch: string, base?: string) {
    return invoke<GitCommandResult>('git_create_branch', { repoPath, branch, base });
  },

  cloneRepo(url: string, destination: string) {
    return invoke<GitCommandResult>('git_clone_repo', { url, destination });
  },

  fetch(repoPath: string, options?: { remote?: string; prune?: boolean }) {
    return invoke<GitCommandResult>('git_fetch', {
      repoPath,
      remote: options?.remote,
      prune: options?.prune
    });
  },

  pull(repoPath: string, options?: { remote?: string; branch?: string }) {
    return invoke<GitCommandResult>('git_pull', {
      repoPath,
      remote: options?.remote,
      branch: options?.branch
    });
  },

  push(repoPath: string, options?: { remote?: string; branch?: string; setUpstream?: boolean }) {
    return invoke<GitCommandResult>('git_push', {
      repoPath,
      remote: options?.remote,
      branch: options?.branch,
      setUpstream: options?.setUpstream
    });
  },

  createStash(repoPath: string, options?: { message?: string; includeUntracked?: boolean }) {
    return invoke<GitCommandResult>('git_create_stash', {
      repoPath,
      message: options?.message,
      includeUntracked: options?.includeUntracked
    });
  },

  applyStash(repoPath: string, stashRef: string, pop = false) {
    return invoke<GitCommandResult>('git_apply_stash', { repoPath, stashRef, pop });
  },

  dropStash(repoPath: string, stashRef: string) {
    return invoke<GitCommandResult>('git_drop_stash', { repoPath, stashRef });
  },

  addWorktree(
    repoPath: string,
    path: string,
    options?: { reference?: string; newBranch?: string; detach?: boolean }
  ) {
    return invoke<GitCommandResult>('git_worktree_add', {
      repoPath,
      path,
      reference: options?.reference,
      newBranch: options?.newBranch,
      detach: options?.detach
    });
  },

  removeWorktree(repoPath: string, path: string, force = false) {
    return invoke<GitCommandResult>('git_worktree_remove', { repoPath, path, force });
  },

  updateSubmodule(
    repoPath: string,
    options?: { path?: string; init?: boolean; recursive?: boolean }
  ) {
    return invoke<GitCommandResult>('git_submodule_update', {
      repoPath,
      path: options?.path,
      init: options?.init,
      recursive: options?.recursive
    });
  },

  syncSubmodule(repoPath: string, options?: { path?: string; recursive?: boolean }) {
    return invoke<GitCommandResult>('git_submodule_sync', {
      repoPath,
      path: options?.path,
      recursive: options?.recursive
    });
  },

  deinitSubmodule(repoPath: string, path: string, force = false) {
    return invoke<GitCommandResult>('git_submodule_deinit', { repoPath, path, force });
  }
};
