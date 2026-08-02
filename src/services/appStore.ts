import { GitClientView, Theme } from '../types/git-client';

const APP_STORE_KEY = 'git-client-design.app-store.v1';

export interface PersistedSettings {
  theme: Theme;
  dock: boolean;
  view: GitClientView;
  graphLayout: 'rows' | 'grouped';
  compareMode: 'list' | 'graph';
  compareLayout: 'side' | 'stack';
  filterOpen: boolean;
  scTab: 'changes' | 'stash';
  diffTab: 'work' | 'index' | 'parent' | 'refs' | 'merge' | 'sources';
  preferences?: Record<string, any>;
}

export interface PersistedRepositories {
  selectedRepoPath: string;
  activeRepoPath: string;
  repoName: string;
  repositoryList: Array<{ name: string; path: string }>;
}

export interface PersistedAppStore {
  version: 1;
  settings: PersistedSettings;
  repositories: PersistedRepositories;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadAppStore(): PersistedAppStore | null {
  if (!canUseStorage()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(APP_STORE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedAppStore;
    if (!parsed || parsed.version !== 1) {
      return null;
    }
    if (!Array.isArray(parsed.repositories.repositoryList)) {
      parsed.repositories.repositoryList = [];
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAppStore(value: PersistedAppStore): void {
  if (!canUseStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(APP_STORE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures so UI is never blocked by persistence.
  }
}
