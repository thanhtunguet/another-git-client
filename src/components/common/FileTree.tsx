import React, { useMemo, useState } from 'react';
import { DiffFile } from '../../types/git-client';

interface FolderNode {
  name: string;
  path: string;
  folders: Map<string, FolderNode>;
  files: Array<{ file: DiffFile; index: number }>;
}

type TreeRow =
  | { type: 'folder'; name: string; path: string; depth: number }
  | { type: 'file'; file: DiffFile; index: number; depth: number };

interface FileTreeProps {
  files: DiffFile[];
  forceExpand?: boolean;
  renderFile: (file: DiffFile, depth: number) => React.ReactNode;
}

const createRoot = (): FolderNode => ({ name: '', path: '', folders: new Map(), files: [] });

const buildRows = (
  files: DiffFile[],
  expandedFolders: Record<string, boolean>,
  forceExpand: boolean
): TreeRow[] => {
  const root = createRoot();

  files.forEach((file, index) => {
    const parts = file.path.split('/').filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) return;

    let parent = root;
    parts.forEach(part => {
      const folderPath = parent.path ? `${parent.path}/${part}` : part;
      let folder = parent.folders.get(part);
      if (!folder) {
        folder = { name: part, path: folderPath, folders: new Map(), files: [] };
        parent.folders.set(part, folder);
      }
      parent = folder;
    });
    parent.files.push({ file, index });
  });

  const rows: TreeRow[] = [];
  const appendChildren = (folder: FolderNode, depth: number) => {
    [...folder.folders.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(child => {
        rows.push({ type: 'folder', name: child.name, path: child.path, depth });
        if (forceExpand || expandedFolders[child.path] !== false) {
          appendChildren(child, depth + 1);
        }
      });

    folder.files
      .sort((a, b) => a.file.path.localeCompare(b.file.path))
      .forEach(({ file, index }) => rows.push({ type: 'file', file, index, depth }));
  };

  appendChildren(root, 0);
  return rows;
};

export const FileTree: React.FC<FileTreeProps> = ({ files, forceExpand = false, renderFile }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const rows = useMemo(
    () => buildRows(files, expandedFolders, forceExpand),
    [files, expandedFolders, forceExpand]
  );

  const toggleFolder = (path: string) => {
    setExpandedFolders(previous => ({ ...previous, [path]: previous[path] === false }));
  };

  return (
    <>
      {rows.map(row => {
        if (row.type === 'file') {
          return (
            <React.Fragment key={`${row.file.path}:${row.index}`}>
              {renderFile(row.file, row.depth)}
            </React.Fragment>
          );
        }

        const isExpanded = forceExpand || expandedFolders[row.path] !== false;
        return (
          <div
            key={row.path}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            onClick={() => toggleFolder(row.path)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleFolder(row.path);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '24px',
              paddingLeft: `${12 + row.depth * 14}px`,
              paddingRight: 'var(--space-3)',
              cursor: 'pointer',
              color: 'var(--fg2)',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              userSelect: 'none'
            }}
            className="gc-hover-bg"
          >
            <i
              className={`ph ${isExpanded ? 'ph-caret-down' : 'ph-caret-right'}`}
              style={{ width: '10px', fontSize: '10px', color: 'var(--fg3)' }}
            />
            <i className="ph ph-folder" style={{ fontSize: '13px', color: 'var(--fg3)' }} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {row.name}
            </span>
          </div>
        );
      })}
    </>
  );
};
