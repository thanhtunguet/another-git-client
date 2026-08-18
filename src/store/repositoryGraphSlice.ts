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
      if (
        state.rows === next.rows &&
        state.hasMore === next.hasMore &&
        state.loading === next.loading &&
        state.loadingMore === next.loadingMore &&
        state.totalCommitCount === next.totalCommitCount &&
        state.error === next.error
      ) {
        return;
      }
      return next;
    }
  }
});

export const { replaceGraph } = graphSlice.actions;
export const repositoryGraphReducer = graphSlice.reducer;
