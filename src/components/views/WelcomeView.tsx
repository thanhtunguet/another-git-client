import React from 'react';
import { useGitClient } from '../../context/GitClientContext';

export const WelcomeView: React.FC = () => {
  const {
    openRepository,
    cloneRepository,
    knownRepositories,
    selectRepository,
    forgetRepository,
    openMenu,
    toggleTheme,
    theme
  } = useGitClient();

  const themeIcon = theme === 'light' ? 'ph-moon' : 'ph-sun';

  const handleRecentContextMenu = (
    e: React.MouseEvent,
    item: { name: string; path: string }
  ) => {
    openMenu(e, item.name, [
      { label: 'Open Repository', run: () => selectRepository(item.path) },
      { sep: true },
      { label: 'Remove from Recent', danger: true, run: () => forgetRepository(item.path) }
    ]);
  };

  return (
    <div className="gc-welcome">
      <button
        className="gc-welcome-theme-toggle"
        onClick={toggleTheme}
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        <i className={`ph ${themeIcon}`} />
      </button>

      <div className="gc-welcome-inner">
        <section className="gc-welcome-start">
          <div className="gc-welcome-brand">
            <i className="ph ph-git-fork" />
            <div>
              <h1>Another Git</h1>
              <p>A fast, focused Git client for branches, graphs, and everyday workflows.</p>
            </div>
          </div>

          <div className="gc-welcome-actions">
            <button className="gc-welcome-action" onClick={openRepository}>
              <i className="ph ph-folder-open" />
              <span className="gc-welcome-action-text">
                <span className="gc-welcome-action-label">Open Folder…</span>
                <span className="gc-welcome-action-hint">Open a local Git repository</span>
              </span>
              <span className="gc-welcome-action-key">⌘O</span>
            </button>
            <button className="gc-welcome-action" onClick={cloneRepository}>
              <i className="ph ph-cloud-arrow-down" />
              <span className="gc-welcome-action-text">
                <span className="gc-welcome-action-label">Clone Repository…</span>
                <span className="gc-welcome-action-hint">Clone a repository from a URL</span>
              </span>
            </button>
          </div>
        </section>

        <section className="gc-welcome-recent">
          <h2>Recent</h2>
          {knownRepositories.length === 0 ? (
            <p className="gc-welcome-empty">
              No repositories yet — open a folder or clone one to get started.
            </p>
          ) : (
            <div className="gc-welcome-recent-list">
              {knownRepositories.map(item => (
                <button
                  key={item.path}
                  className="gc-welcome-recent-row"
                  onClick={() => selectRepository(item.path)}
                  onContextMenu={e => handleRecentContextMenu(e, item)}
                  title={item.path}
                >
                  <i className="ph ph-folder-simple" />
                  <span className="gc-welcome-recent-text">
                    <span className="gc-welcome-recent-name">{item.name}</span>
                    <span className="gc-welcome-recent-path">{item.path}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
