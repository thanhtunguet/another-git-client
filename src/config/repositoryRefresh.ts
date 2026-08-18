/**
 * Minimum delay between passive filesystem-triggered repository refreshes.
 * Explicit Git actions continue to refresh immediately after completion.
 */
export const REPOSITORY_WATCHER_REFRESH_INTERVAL_MS = 10_000;
