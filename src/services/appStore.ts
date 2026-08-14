import { GitClientView, Theme } from '../types/git-client';

const APP_STORE_KEY = 'git-client-design.app-store.v1';

export interface AIConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
}

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
  ai?: AIConfig;
}

export interface PersistedRepositories {
  selectedRepoPath: string;
  activeRepoPath: string;
  repoName: string;
  repositoryList: Array<{ name: string; path: string }>;
  recentBranches?: Record<string, string[]>;
}

export interface PersistedAppStore {
  version: 1;
  settings: PersistedSettings;
  repositories: PersistedRepositories;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  baseUrl: '',
  apiKey: '',
  model: 'gpt-4o-mini'
};

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
    if (!parsed.repositories.recentBranches || typeof parsed.repositories.recentBranches !== 'object') {
      parsed.repositories.recentBranches = {};
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadAIConfig(): AIConfig {
  const store = loadAppStore();
  const ai = store?.settings.ai;
  if (!ai) return { ...DEFAULT_AI_CONFIG };
  return {
    enabled: ai.enabled ?? false,
    baseUrl: ai.baseUrl ?? '',
    apiKey: ai.apiKey ?? '',
    model: ai.model || 'gpt-4o-mini'
  };
}

export function saveAIConfig(config: AIConfig): void {
  const store = loadAppStore() ?? {
    version: 1 as const,
    settings: {
      theme: 'dark' as Theme,
      dock: true,
      view: 'graph' as GitClientView,
      graphLayout: 'rows' as const,
      compareMode: 'list' as const,
      compareLayout: 'side' as const,
      filterOpen: false,
      scTab: 'changes' as const,
      diffTab: 'work' as const,
      preferences: {}
    },
    repositories: {
      selectedRepoPath: '',
      activeRepoPath: '',
      repoName: '',
      repositoryList: []
    }
  };
  store.settings.ai = { ...config };
  saveAppStore(store);
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
