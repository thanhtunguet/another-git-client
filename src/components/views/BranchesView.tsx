import React, { useEffect, useMemo, useState } from 'react';
import { useGitClient, getHash } from '../../context/GitClientContext';
import { Input } from '../common/FormControls';
import { Button } from '../common/Button';
import { Tag } from '../common/Tag';
import { Card } from '../common/Card';
import { RefBadge } from '../../types/git-client';
import { tauriGitBackend, type BranchRef } from '../../services/tauriGitBackend';

type BranchKind = 'local' | 'remote';

type BranchNode = {
  name: string;
  fullRef: string;
  upstream?: string;
  ahead: number;
  behind: number;
  current: boolean;
  kind: BranchKind;
  remoteName?: string;
  shortName: string;
};

type TreeRow =
  | { type: 'group'; id: string; label: string; count: number }
  | { type: 'folder'; id: string; label: string; depth: number }
  | { type: 'branch'; id: string; depth: number; label: string; branch: BranchNode };

type PathMode = 'name' | 'shortName';

function normalizeBranchRef(branch: BranchRef): BranchNode {
  const isRemote = branch.kind === 'remote';
  const remoteName = isRemote ? branch.name.split('/')[0] || 'remote' : undefined;
  const shortName =
    isRemote && branch.name.includes('/') ? branch.name.split('/').slice(1).join('/') : branch.name;

  return {
    name: branch.name,
    fullRef: branch.fullRef,
    upstream: branch.upstream,
    ahead: branch.ahead,
    behind: branch.behind,
    current: branch.current,
    kind: isRemote ? 'remote' : 'local',
    remoteName,
    shortName
  };
}

function buildPathRows(
  branches: BranchNode[],
  basePath: string,
  pathMode: PathMode,
  idPrefix: string,
  depth: number,
  expandedFolders: Record<string, boolean>
): TreeRow[] {
  const groups = new Map<string, BranchNode[]>();
  const leaves: TreeRow[] = [];

  for (const branch of branches) {
    const branchPath = pathMode === 'name' ? branch.name : branch.shortName;
    const relativeName = basePath ? branchPath.slice(basePath.length + 1) : branchPath;

    if (!relativeName) {
      leaves.push({
        type: 'branch',
        id: `branch:${idPrefix}:${branch.name}`,
        depth,
        label: branchPath.split('/').at(-1) ?? branchPath,
        branch
      });
      continue;
    }

    const parts = relativeName.split('/');
    if (parts.length === 1) {
      leaves.push({
        type: 'branch',
        id: `branch:${idPrefix}:${branch.name}`,
        depth,
        label: relativeName,
        branch
      });
      continue;
    }

    const segment = parts[0];
    const childPath = basePath ? `${basePath}/${segment}` : segment;
    const list = groups.get(childPath) ?? [];
    list.push(branch);
    groups.set(childPath, list);
  }

  const rows: TreeRow[] = [];

  const groupEntries = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  for (const [fullPath, groupBranches] of groupEntries) {
    const folderId = `folder:${idPrefix}:${fullPath}`;
    rows.push({
      type: 'folder',
      id: folderId,
      depth,
      label: fullPath.split('/').at(-1) ?? fullPath
    });

    const isExpanded = expandedFolders[folderId] !== false;
    if (isExpanded) {
      rows.push(
        ...buildPathRows(groupBranches, fullPath, pathMode, idPrefix, depth + 1, expandedFolders)
      );
    }
  }

  leaves.sort((left, right) => {
    if (left.type !== 'branch' || right.type !== 'branch') {
      return 0;
    }
    if (left.branch.current) {
      return -1;
    }
    if (right.branch.current) {
      return 1;
    }
    const leftPath = pathMode === 'name' ? left.branch.name : left.branch.shortName;
    const rightPath = pathMode === 'name' ? right.branch.name : right.branch.shortName;
    return leftPath.localeCompare(rightPath);
  });

  rows.push(...leaves);
  return rows;
}

function formatBranchMeta(branch: BranchNode): string {
  const parts: string[] = [];
  if (branch.upstream) {
    parts.push(branch.upstream);
  }
  if (branch.ahead || branch.behind) {
    parts.push(`↑${branch.ahead} ↓${branch.behind}`);
  }
  return parts.join(' · ');
}

export const BranchesView: React.FC = () => {
  const {
    branchQ,
    setBranchQ,
    act,
    openMenu,
    confirm,
    setView,
    commits,
    repoPath,
    currentBranch,
    checkoutBranch,
    renameBranch,
    deleteBranch,
    setUpstream,
    mergeBranch,
    rebaseBranch,
    resetToRef,
    createBranch
  } = useGitClient();

  const [branches, setBranches] = useState<BranchNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');

  useEffect(() => {
    if (!repoPath) {
      setBranches([]);
      setSelectedBranchName('');
      return;
    }

    let disposed = false;
    setIsLoading(true);

    void (async () => {
      try {
        const refs = await tauriGitBackend.getBranches(repoPath);
        if (disposed) {
          return;
        }
        setBranches(refs.map(normalizeBranchRef));
      } catch {
        if (!disposed) {
          setBranches([]);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
    };
  }, [repoPath]);

  useEffect(() => {
    if (!branches.length) {
      setSelectedBranchName('');
      return;
    }

    const selectedStillExists = branches.some(branch => branch.name === selectedBranchName);
    if (selectedStillExists) {
      return;
    }

    const current = branches.find(branch => branch.current) ?? branches[0];
    setSelectedBranchName(current.name);
  }, [branches, selectedBranchName]);

  const filteredBranches = useMemo(() => {
    const q = branchQ.trim().toLowerCase();
    if (!q) {
      return branches;
    }

    return branches.filter(branch => {
      return (
        branch.name.toLowerCase().includes(q) ||
        branch.shortName.toLowerCase().includes(q) ||
        branch.fullRef.toLowerCase().includes(q) ||
        (branch.upstream || '').toLowerCase().includes(q)
      );
    });
  }, [branchQ, branches]);

  const localBranches = useMemo(
    () => filteredBranches.filter(branch => branch.kind === 'local'),
    [filteredBranches]
  );
  const remoteBranches = useMemo(
    () => filteredBranches.filter(branch => branch.kind === 'remote'),
    [filteredBranches]
  );

  const remoteGroups = useMemo(() => {
    const byRemote = new Map<string, BranchNode[]>();
    for (const branch of remoteBranches) {
      const remoteName = branch.remoteName || 'remote';
      const list = byRemote.get(remoteName) ?? [];
      list.push(branch);
      byRemote.set(remoteName, list);
    }

    return Array.from(byRemote.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [remoteBranches]);

  const treeRows = useMemo(() => {
    const rows: TreeRow[] = [];

    rows.push({ type: 'group', id: 'group:local', label: 'Local', count: localBranches.length });
    rows.push(...buildPathRows(localBranches, '', 'name', 'local', 1, expandedFolders));

    rows.push({ type: 'group', id: 'group:remote', label: 'Remote', count: remoteBranches.length });
    for (const [remoteName, groupBranches] of remoteGroups) {
      const remoteFolderId = `folder:remote:${remoteName}`;
      rows.push({ type: 'folder', id: remoteFolderId, label: remoteName, depth: 1 });
      if (expandedFolders[remoteFolderId] !== false) {
        rows.push(
          ...buildPathRows(
            groupBranches,
            '',
            'shortName',
            `remote:${remoteName}`,
            2,
            expandedFolders
          )
        );
      }
    }

    return rows;
  }, [expandedFolders, localBranches, remoteBranches, remoteGroups]);

  const selectedBranch = useMemo(
    () => branches.find(branch => branch.name === selectedBranchName),
    [branches, selectedBranchName]
  );

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: prev[folderId] === false
    }));
  };

  const handleBranchMenu = (e: React.MouseEvent, branch: BranchNode) => {
    const name = branch.name;
    const remoteName = branch.remoteName || "origin";
    const remoteShort = branch.shortName;

    openMenu(e, name, [
      { label: "Checkout", hint: "↵", run: () => checkoutBranch(name) },
      {
        label: `New branch from '${name}'…`,
        run: () => {
          const newBranch = window.prompt(`Create new branch from ${name}`, `${name}-copy`);
          if (newBranch && newBranch.trim()) {
            void tauriGitBackend.createBranch(repoPath, newBranch.trim(), name).then(() => {
              void checkoutBranch(newBranch.trim());
            });
          }
        }
      },
      {
        label: "Rename…",
        run: () => {
          const newName = window.prompt(`Rename branch ${name}`, name);
          if (newName && newName.trim() && newName.trim() !== name) {
            void renameBranch(name, newName.trim());
          }
        }
      },
      { sep: true },
      { label: `Merge ${name} into ${currentBranch}`, run: () => mergeBranch(name) },
      { label: `Rebase ${currentBranch} onto ${name}`, run: () => rebaseBranch(name) },
      { label: "Compare with current", run: () => setView("compare") },
      { label: "Open in Git Graph", run: () => setView("graph") },
      { sep: true },
      { label: "Reset current to here — soft", run: () => resetToRef(name, "soft") },
      { label: "Reset current to here — mixed", run: () => resetToRef(name, "mixed") },
      {
        label: "Reset current to here — hard",
        danger: true,
        run: () =>
          confirm(
            `Hard reset ${currentBranch} to ${name}?`,
            "All uncommitted changes in the working tree and index will be permanently discarded.",
            `git reset --hard ${name}`,
            "Reset --hard",
            () => void resetToRef(name, "hard")
          )
      },
      { sep: true },
      {
        label: branch.kind === "remote" ? "Untrack upstream" : "Set upstream…",
        run: () => {
          if (branch.kind === "remote") {
            void setUpstream(currentBranch, undefined);
          } else {
            const upstream = window.prompt(`Set upstream for ${name}`, `origin/${name}`);
            if (upstream !== null) {
              void setUpstream(name, upstream.trim() || undefined);
            }
          }
        }
      },
      {
        label: `Delete ${name}`,
        danger: true,
        run: () =>
          confirm(
            `Delete branch ${name}?`,
            branch.kind === "remote"
              ? "This deletes the branch on the remote server."
              : "This branch will be deleted from your local repository.",
            branch.kind === "remote"
              ? `git push ${remoteName} --delete ${remoteShort}`
              : `git branch -D ${name}`,
            "Delete branch",
            () => void deleteBranch(name, branch.kind === "remote", true)
          )
      }
    ]);
  };

  const branchPreviewIndices = [6, 7, 8];

  const branchActionChips: { label: string; variant: RefBadge['variant'] }[] = [
    'Checkout',
    'Create',
    'Rename',
    'Track upstream',
    'Merge into current',
    'Rebase onto',
    'Compare',
    'Open in Git Graph',
    'Reset soft/mixed',
    'Reset hard',
    'Delete'
  ].map(l => ({
    label: l,
    variant: l === 'Reset hard' || l === 'Delete' ? 'outline' : 'neutral'
  }));

  const remoteCount = useMemo(() => {
    return new Set(
      branches.filter(branch => branch.kind === 'remote').map(branch => branch.remoteName || 'remote')
    ).size;
  }, [branches]);

  const selectedBranchMeta = selectedBranch ? formatBranchMeta(selectedBranch) : '';

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div
        style={{
          flex: '0 0 340px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--line)',
          background: 'var(--panel)',
          minHeight: 0
        }}
      >
        <div
          style={{
            height: '38px',
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '0 var(--space-3)',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <Input
            value={branchQ}
            onChange={e => setBranchQ(e.target.value)}
            placeholder="Fuzzy find branch or tag…"
            style={{
              height: '25px',
              minHeight: 0,
              fontSize: '12px',
              fontFamily: 'var(--font-mono)'
            }}
          />
          <Button
            variant="secondary"
            onClick={() => createBranch()}
            title="New branch"
            style={{ width: '25px', height: '25px', padding: 0 }}
          >
            <i className="ph ph-plus" style={{ fontSize: '13px' }} />
          </Button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-2) 0', minHeight: 0 }}>
          {treeRows.map(row => {
            if (row.type === 'group') {
              return (
                <div
                  key={row.id}
                  style={{
                    height: '26px',
                    padding: '0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--fg3)',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ flex: 1 }}>{row.label}</span>
                  <span>{row.count}</span>
                </div>
              );
            }

            if (row.type === 'folder') {
              const padLeft = 10 + row.depth * 12;
              const isExpanded = expandedFolders[row.id] !== false;

              return (
                <div
                  key={row.id}
                  onClick={() => toggleFolder(row.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    height: '24px',
                    paddingLeft: `${padLeft}px`,
                    paddingRight: 'var(--space-3)',
                    cursor: 'pointer',
                    color: 'var(--fg2)',
                    fontSize: '12.5px',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <i
                    className={`ph ${isExpanded ? 'ph-caret-down' : 'ph-caret-right'}`}
                    style={{ fontSize: '11px', color: 'var(--fg3)', width: '11px' }}
                  />
                  <i className="ph ph-folder" style={{ fontSize: '13px', color: 'var(--fg3)' }} />
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {row.label}
                  </span>
                </div>
              );
            }

            const branch = row.branch;
            const padLeft = 10 + row.depth * 12;
            const isSelected = selectedBranchName === branch.name;
            const iconColor = branch.kind === 'remote' ? 'var(--fg3)' : 'var(--color-accent)';
            const meta = formatBranchMeta(branch);

            return (
              <div
                key={row.id}
                onClick={() => setSelectedBranchName(branch.name)}
                onContextMenu={e => handleBranchMenu(e, branch)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  height: '24px',
                  paddingLeft: `${padLeft}px`,
                  paddingRight: 'var(--space-3)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--sel)' : 'transparent',
                  color: 'var(--fg)',
                  fontSize: '12.5px',
                  fontWeight: branch.current ? 600 : 400,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <i className="ph ph-git-branch" style={{ fontSize: '13px', color: iconColor }} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10.5px',
                    color: 'var(--fg3)'
                  }}
                >
                  {meta}
                </span>
                {branch.current && (
                  <Tag
                    variant="outline"
                    style={{ fontSize: '9.5px', padding: '0 5px', letterSpacing: '.05em' }}
                  >
                    HEAD
                  </Tag>
                )}
              </div>
            );
          })}
          {!treeRows.length && !isLoading && (
            <div
              style={{
                padding: '12px',
                color: 'var(--fg3)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px'
              }}
            >
              No branches match the current filter.
            </div>
          )}
          {isLoading && (
            <div
              style={{
                padding: '12px',
                color: 'var(--fg3)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px'
              }}
            >
              Loading branches…
            </div>
          )}
        </div>

        <div
          style={{
            flex: '0 0 auto',
            borderTop: '1px solid var(--line)',
            padding: 'var(--space-2) var(--space-3)',
            display: 'flex',
            gap: '6px',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--fg3)', flex: 1 }}>
            {remoteCount} remote{remoteCount === 1 ? '' : 's'}
          </span>
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11px' }}
            onClick={act('Add remote')}
          >
            Add remote…
          </Button>
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11px' }}
            onClick={act('Manage remotes')}
          >
            Manage
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: '38px',
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 var(--space-4)',
            borderBottom: '1px solid var(--line)',
            background: 'var(--panel)'
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {selectedBranch?.name || 'No branch selected'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>
            {selectedBranchMeta || 'Select a branch to inspect details'}
          </span>
          <div style={{ flex: 1 }} />
          <Button
            variant="secondary"
            style={{ height: '25px', padding: '0 10px' }}
            onClick={() => setView('compare')}
          >
            Compare with current
          </Button>
          <Button
            variant="primary"
            style={{ height: "25px", padding: "0 10px" }}
            onClick={
              selectedBranch
                ? () => void mergeBranch(selectedBranch.name)
                : undefined
            }
            disabled={!selectedBranch}
          >
            <i className="ph ph-git-merge" style={{ fontSize: "14px" }} /> Merge into {currentBranch}
          </Button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--space-6) var(--space-4)',
            minHeight: 0
          }}
        >
          <h6 style={{ margin: '0 0 var(--space-3)', color: 'var(--fg3)' }}>
            Recent commits on this branch
          </h6>
          {branchPreviewIndices.map(idx => {
            const c = commits[idx];
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'baseline',
                  padding: '7px 8px',
                  borderBottom: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--iris)',
                    fontSize: '11.5px'
                  }}
                >
                  {getHash(idx)}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c[0]}
                </span>
                <span style={{ color: 'var(--fg3)', fontSize: '11.5px' }}>{c[1]}</span>
                <span
                  style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                >
                  {c[2].slice(5, 10)}
                </span>
              </div>
            );
          })}

          <Card elevation="sm" style={{ marginTop: 'var(--space-8)' }}>
            <h6 style={{ margin: 0, color: 'var(--fg3)' }}>Right-click any row for</h6>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {branchActionChips.map((a, i) => (
                <Tag key={i} variant={a.variant}>
                  {a.label}
                </Tag>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
