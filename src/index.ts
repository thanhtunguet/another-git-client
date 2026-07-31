import './styles/index.scss';

// Export main component
export { GitClient } from './components/GitClient';

// Export context & hooks
export {
  GitClientProvider,
  useGitClient,
  COLORS,
  RAW_COMMITS,
  getHash,
  statusColor,
  refBadge,
  buildGraphData,
  buildFiles,
  seedLog
} from './context/GitClientContext';

// Export common UI components
export { Button } from './components/common/Button';
export type { ButtonProps } from './components/common/Button';

export { Tag } from './components/common/Tag';
export type { TagProps } from './components/common/Tag';

export { Input, Textarea, Select, Checkbox } from './components/common/FormControls';
export type { InputProps, TextareaProps, SelectProps, CheckboxProps } from './components/common/FormControls';

export { SegmentedControl } from './components/common/SegmentedControl';
export type { SegmentedControlProps, SegmentOption } from './components/common/SegmentedControl';

export { Card } from './components/common/Card';
export type { CardProps } from './components/common/Card';

export { Dialog } from './components/common/Dialog';
export { ContextMenu } from './components/common/ContextMenu';
export { CommandPalette } from './components/common/CommandPalette';
export { ProgressToast } from './components/common/ProgressToast';

// Export layout components
export { TopBar } from './components/layout/TopBar';
export { NavSidebar } from './components/layout/NavSidebar';
export { StatusBar } from './components/layout/StatusBar';
export { ConsoleDrawer } from './components/layout/ConsoleDrawer';
export { SourceControlDock } from './components/layout/SourceControlDock';

// Export view components
export { BranchesView } from './components/views/BranchesView';
export { GraphView } from './components/views/GraphView';
export { CommitDetailsView } from './components/views/CommitDetailsView';
export { CompareView } from './components/views/CompareView';
export { DiffView } from './components/views/DiffView';
export { WorktreesView } from './components/views/WorktreesView';
export { SubmodulesView } from './components/views/SubmodulesView';
export { SettingsView } from './components/views/SettingsView';
export { ComponentsView } from './components/views/ComponentsView';

// Export types
export * from './types/git-client';
