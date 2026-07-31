import React from 'react';
import { GitClientProps } from '../types/git-client';
import { GitClientProvider, useGitClient } from '../context/GitClientContext';
import { TopBar } from './layout/TopBar';
import { NavSidebar } from './layout/NavSidebar';
import { StatusBar } from './layout/StatusBar';
import { ConsoleDrawer } from './layout/ConsoleDrawer';
import { SourceControlDock } from './layout/SourceControlDock';

import { BranchesView } from './views/BranchesView';
import { GraphView } from './views/GraphView';
import { CommitDetailsView } from './views/CommitDetailsView';
import { CompareView } from './views/CompareView';
import { DiffView } from './views/DiffView';
import { WorktreesView } from './views/WorktreesView';
import { SubmodulesView } from './views/SubmodulesView';
import { SettingsView } from './views/SettingsView';
import { ComponentsView } from './views/ComponentsView';

import { ContextMenu } from './common/ContextMenu';
import { CommandPalette } from './common/CommandPalette';
import { Dialog } from './common/Dialog';
import { ProgressToast } from './common/ProgressToast';

const GitClientInner: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style
}) => {
  const { view } = useGitClient();

  const renderActiveView = () => {
    switch (view) {
      case 'branches':
        return <BranchesView />;
      case 'graph':
        return <GraphView />;
      case 'details':
        return <CommitDetailsView />;
      case 'compare':
        return <CompareView />;
      case 'diff':
        return <DiffView />;
      case 'worktrees':
        return <WorktreesView />;
      case 'submodules':
        return <SubmodulesView />;
      case 'settings':
        return <SettingsView />;
      case 'components':
        return <ComponentsView />;
      default:
        return <GraphView />;
    }
  };

  return (
    <div className={`gc-container ${className}`.trim()} style={style}>
      <TopBar />
      <div className="gc-main-row">
        <NavSidebar />
        <div className="gc-view-container">
          {renderActiveView()}
          <ConsoleDrawer />
        </div>
        <SourceControlDock />
      </div>
      <StatusBar />

      {/* Global Overlays */}
      <ContextMenu />
      <CommandPalette />
      <Dialog />
      <ProgressToast />
    </div>
  );
};

export const GitClient: React.FC<GitClientProps> = props => {
  return (
    <GitClientProvider props={props}>
      <GitClientInner className={props.className} style={props.style} />
    </GitClientProvider>
  );
};
