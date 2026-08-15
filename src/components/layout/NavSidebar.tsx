import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { GitClientView } from '../../types/git-client';

interface NavItem {
  id: GitClientView;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'branches', label: 'Branches', icon: 'ph-git-branch' },
  { id: 'graph', label: 'Git Graph', icon: 'ph-git-commit' },
  { id: 'details', label: 'Commit Details', icon: 'ph-file-text' },
  { id: 'compare', label: 'Compare', icon: 'ph-git-diff' },
  { id: 'diff', label: 'Diff / Merge', icon: 'ph-git-merge' },
  { id: 'worktrees', label: 'Worktrees', icon: 'ph-tree-structure' },
  { id: 'submodules', label: 'Submodules', icon: 'ph-package' }
];

export const NavSidebar: React.FC<{ style?: React.CSSProperties; className?: string }> = ({
  style,
  className = ''
}) => {
  const { view, setView } = useGitClient();

  return (
    <div className={`gc-sidebar ${className}`.trim()} style={style}>
      {NAV_ITEMS.map(item => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            title={item.label}
            className={`gc-sidebar-item ${active ? 'active' : ''}`}
          >
            <i className={`ph ${item.icon}`} style={{ fontSize: '18px' }} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button
        onClick={() => setView('settings')}
        title="Settings"
        className={`gc-sidebar-item ${view === 'settings' ? 'active' : ''}`}
      >
        <i className="ph ph-gear" style={{ fontSize: '18px' }} />
        <span>Settings</span>
      </button>
    </div>
  );
};
