import React from 'react';
import type { MonacoDiffPaneProps } from './monacoDiffPaneTypes';

export type { MonacoDiffPaneProps } from './monacoDiffPaneTypes';

/**
 * Stand-in used by the library build (see the `resolve.alias` in
 * `vite.config.ts`), which must not bundle Monaco: it is ~2.5MB, and Vite
 * would rewrite its worker and `codicon.ttf` URLs to root-absolute paths that
 * break for any consumer not served from the web root.
 *
 * `monacoDiffPaneAvailable` is false here, so DiffViewer keeps using the
 * read-only patch renderer and this component is never mounted.
 */
export const monacoDiffPaneAvailable = false;

export const MonacoDiffPane: React.FC<MonacoDiffPaneProps> = () => null;
