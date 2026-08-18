import type { RootState } from './store';

export const selectRepositoryGraph = (state: RootState) => state.repositoryGraph;
export const selectGraphRows = (state: RootState) => state.repositoryGraph.rows;
export const selectGraphHasMore = (state: RootState) => state.repositoryGraph.hasMore;
export const selectGraphLoading = (state: RootState) => state.repositoryGraph.loading;
export const selectGraphLoadingMore = (state: RootState) => state.repositoryGraph.loadingMore;
export const selectGraphTotalCommitCount = (state: RootState) =>
  state.repositoryGraph.totalCommitCount;
export const selectGraphError = (state: RootState) => state.repositoryGraph.error;
