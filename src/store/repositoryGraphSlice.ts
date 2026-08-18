import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GraphCommitRow } from '../services/tauriGitBackend';

export interface RepositoryGraphState {
  rows: GraphCommitRow[];
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  totalCommitCount: number;
  error: string | null;
}

const initialState: RepositoryGraphState = {
  rows: [],
  hasMore: false,
  loading: false,
  loadingMore: false,
  totalCommitCount: 0,
  error: null
};

const graphSlice = createSlice({
  name: 'repositoryGraph',
  initialState,
  reducers: {
    replaceGraph: (state, action: PayloadAction<RepositoryGraphState>) => {
      const next = action.payload;
      if (JSON.stringify(state) === JSON.stringify(next)) {
        return;
      }
      return next;
    }
  }
});

export const { replaceGraph } = graphSlice.actions;
export const repositoryGraphReducer = graphSlice.reducer;
