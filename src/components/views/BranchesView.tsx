import React, { useEffect, useMemo, useState } from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Input } from '../common/FormControls';
import { Button } from '../common/Button';
import { Tag } from '../common/Tag';
import {
  tauriGitBackend,
  type GraphCommitRow,
  type TagRef
} from '../../services/tauriGitBackend';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { ResizeHandle } from '../common/ResizeHandle';
import { ResetDialog } from '../common/ResetDialog';
import { type BranchNode, normalizeBranchRef, buildBranchMenuItems } from '../../utils/branchMenu';

type TagNode = {
  name: string;
  fullRef: string;
  sha: string;
  lastCommitEpoch?: number;
};

type SelectedRevision =
  | { kind: 'branch'; name: string; fullRef: string; branch: BranchNode }
  | { kind: 'tag'; name: string; fullRef: string; tag: TagNode };

type TreeRow =
  | { type: 'group'; id: string; label: string; count: number }
  | { type: 'folder'; id: string; label: string; depth: number }
  | { type: 'branch'; id: string; depth: number; label: string; branch: BranchNode }
  | { type: 'tag'; id: string; depth: number; label: string; tag: TagNode };

type PathMode = 'name' | 'shortName';

// Subsequence fuzzy match: every character of `query` must appear in `text`,
// in order, but not necessarily contiguously (e.g. "mstr" matches "main-restore").
function fuzzyMatch(query: string, text: string): boolean {
  if (!query) {
    return true;
  }
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) {
      qi++;
    }
  }
  return qi === query.length;
}

function normalizeTagRef(tag: TagRef): TagNode {
  return {
    name: tag.name,
    fullRef: tag.fullRef,
    sha: tag.sha,
    lastCommitEpoch: tag.lastCommitEpoch
  };
}

function branchRevisionId(branch: BranchNode): string {
  return `branch:${branch.fullRef}`;
}

function tagRevisionId(tag: TagNode): string {
  return `tag:${tag.fullRef}`;
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

function buildTagRows(
  tags: TagNode[],
  basePath: string,
  idPrefix: string,
  depth: number,
  expandedFolders: Record<string, boolean>
): TreeRow[] {
  const groups = new Map<string, TagNode[]>();
  const leaves: TreeRow[] = [];

  for (const tag of tags) {
    const relativeName = basePath ? tag.name.slice(basePath.length + 1) : tag.name;
    const parts = relativeName.split('/');

    if (parts.length === 1) {
      leaves.push({
        type: 'tag',
        id: `tag:${idPrefix}:${tag.name}`,
        depth,
        label: relativeName,
        tag
      });
      continue;
    }

    const segment = parts[0];
    const childPath = basePath ? `${basePath}/${segment}` : segment;
    const list = groups.get(childPath) ?? [];
    list.push(tag);
    groups.set(childPath, list);
  }

  const rows: TreeRow[] = [];

  const groupEntries = Array.from(groups.entries()).sort(([a, leftTags], [b, rightTags]) => {
    const leftLatest = Math.max(0, ...leftTags.map(tag => tag.lastCommitEpoch ?? 0));
    const rightLatest = Math.max(0, ...rightTags.map(tag => tag.lastCommitEpoch ?? 0));
    if (leftLatest !== rightLatest) {
      return rightLatest - leftLatest;
    }
    return a.localeCompare(b);
  });
  for (const [fullPath, groupTags] of groupEntries) {
    const folderId = `folder:${idPrefix}:${fullPath}`;
    rows.push({
      type: 'folder',
      id: folderId,
      depth,
      label: fullPath.split('/').at(-1) ?? fullPath
    });

    const isExpanded = expandedFolders[folderId] !== false;
    if (isExpanded) {
      rows.push(...buildTagRows(groupTags, fullPath, idPrefix, depth + 1, expandedFolders));
    }
  }

  leaves.sort((left, right) => {
    if (left.type !== 'tag' || right.type !== 'tag') {
      return 0;
    }
    const leftEpoch = left.tag.lastCommitEpoch ?? 0;
    const rightEpoch = right.tag.lastCommitEpoch ?? 0;
    if (leftEpoch !== rightEpoch) {
      return rightEpoch - leftEpoch;
    }
    return left.tag.name.localeCompare(right.tag.name);
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
    prompt,
    openMenu,
    confirm,
    setView,
    repoPath,
    currentBranch,
    checkoutBranch,
    createTag,
    cherryPickCommit,
    revertCommit,
    renameBranch,
    deleteBranch,
    setUpstream,
    mergeBranch,
    rebaseBranch,
    resetToRef,
    createBranch,
    deleteRemote,
    getRemotes,
    deleteTag,
    doFetch,
    toastRun,
    openAddRemoteDialog,
    openEditRemoteDialog,
    setCompareSeedRef,
    setDiffTargetSha,
    setDiffTab,
    findCommitIndexBySha,
    toggleSelCommit,
    createPatch
  } = useGitClient();

  const [branches, setBranches] = useState<BranchNode[]>([]);
  const [tags, setTags] = useState<TagNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>('');
  const [selectedRevisionCommits, setSelectedRevisionCommits] = useState<GraphCommitRow[]>([]);
  const [revisionCommitsLoading, setRevisionCommitsLoading] = useState(false);
  const [revisionCommitsError, setRevisionCommitsError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resetReference, setResetReference] = useState<string | null>(null);

  const openCommitDetails = (commit: GraphCommitRow) => {
    const commitIndex = findCommitIndexBySha(commit.sha);
    if (commitIndex >= 0) {
      toggleSelCommit(commitIndex, false);
      setView('details');
      return;
    }

    toastRun('Commit not loaded in Git Graph', 'Load more commits in Git Graph to open its details');
  };

  const handleRecentCommitMenu = (event: React.MouseEvent, commit: GraphCommitRow) => {
    const hash = commit.shortSha;
    openMenu(event, `${hash}  ${commit.subject.slice(0, 32)}`, [
      { label: 'Open in Commit Details', hint: 'Enter', run: () => openCommitDetails(commit) },
      {
        label: 'Diff vs parent',
        run: () => {
          setDiffTargetSha(commit.sha);
          setDiffTab('parent');
          setView('diff');
        }
      },
      { sep: true },
      { label: 'Checkout (detached)', run: () => void checkoutBranch(commit.sha) },
      {
        label: 'Create branch here…',
        run: () => {
          prompt(
            'Create branch',
            `Create branch at commit ${hash}.`,
            'Create branch',
            `branch-${hash}`,
            (name?: string) => {
              if (name?.trim()) {
                void tauriGitBackend.createBranch(repoPath, name.trim(), commit.sha).then(() => {
                  void checkoutBranch(name.trim());
                });
              }
            }
          );
        }
      },
      {
        label: 'Create tag here…',
        run: () => {
          prompt(
            'Create tag',
            `Tag name for commit ${hash}.`,
            'Create tag',
            'v1.0.0',
            (tagName?: string) => {
              if (tagName?.trim()) {
                void createTag(tagName.trim(), commit.sha);
              }
            }
          );
        }
      },
      { sep: true },
      { label: 'Cherry-pick', run: () => void cherryPickCommit(commit.sha) },
      {
        label: 'Revert commit',
        run: () => {
          const subject = commit.subject ? ` (\"${commit.subject}\")` : '';
          confirm(
            'Revert Commit?',
            `Revert commit ${hash}${subject}? A new commit will be created to invert the changes.`,
            `git revert --no-edit ${commit.sha}`,
            'Revert',
            () => void revertCommit(commit.sha)
          );
        }
      },
      { sep: true },
      { label: 'Reset current branch to here…', run: () => setResetReference(commit.sha) },
      { sep: true },
      {
        label: 'Compare with current',
        run: () => {
          setCompareSeedRef(commit.sha);
          setView('compare');
        }
      },
      {
        label: 'Create patch…',
        run: () => {
          void createPatch(commit.sha).then(patch => {
            if (patch) {
              void navigator.clipboard.writeText(patch);
              toastRun('Patch copied to clipboard', hash);
            }
          });
        }
      },
      {
        label: 'Copy hash',
        hint: '⌘C',
        run: () => {
          void navigator.clipboard.writeText(commit.sha);
          toastRun('Copied hash', hash);
        }
      }
    ]);
  };

  useEffect(() => {
    if (!repoPath) {
      setBranches([]);
      setTags([]);
      setSelectedRevisionId('');
      return;
    }

    let disposed = false;
    setIsLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        const [branchRefs, tagRefs] = await Promise.all([
          tauriGitBackend.getBranches(repoPath),
          tauriGitBackend.getTags(repoPath)
        ]);
        if (disposed) {
          return;
        }
        setBranches(branchRefs.map(normalizeBranchRef));
        setTags(tagRefs.map(normalizeTagRef));
        setLoadError(null);
      } catch (error) {
        if (!disposed) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error('Failed to load branches/tags', error);
          setBranches([]);
          setTags([]);
          setLoadError(msg);
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
    const selectedStillExists = [
      ...branches.map(branchRevisionId),
      ...tags.map(tagRevisionId)
    ].includes(selectedRevisionId);
    if (selectedStillExists) {
      return;
    }

    const current = branches.find(branch => branch.current) ?? branches[0];
    setSelectedRevisionId(current ? branchRevisionId(current) : tags[0] ? tagRevisionId(tags[0]) : '');
  }, [branches, tags, selectedRevisionId]);

  const filteredBranches = useMemo(() => {
    const q = branchQ.trim().toLowerCase();
    if (!q) {
      return branches;
    }

    return branches.filter(branch => {
      return (
        fuzzyMatch(q, branch.name.toLowerCase()) ||
        fuzzyMatch(q, branch.shortName.toLowerCase()) ||
        fuzzyMatch(q, branch.fullRef.toLowerCase()) ||
        fuzzyMatch(q, (branch.upstream || '').toLowerCase())
      );
    });
  }, [branchQ, branches]);

  const filteredTags = useMemo(() => {
    const q = branchQ.trim().toLowerCase();
    if (!q) {
      return tags;
    }

    return tags.filter(tag => {
      return fuzzyMatch(q, tag.name.toLowerCase()) || fuzzyMatch(q, tag.fullRef.toLowerCase());
    });
  }, [branchQ, tags]);

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

    rows.push({ type: 'group', id: 'group:tags', label: 'Tags', count: filteredTags.length });
    rows.push(...buildTagRows(filteredTags, '', 'tag', 1, expandedFolders));

    return rows;
  }, [expandedFolders, localBranches, remoteBranches, remoteGroups, filteredTags]);

  const selectedRevision = useMemo<SelectedRevision | null>(() => {
    const branch = branches.find(item => branchRevisionId(item) === selectedRevisionId);
    if (branch) {
      return { kind: 'branch', name: branch.name, fullRef: branch.fullRef, branch };
    }

    const tag = tags.find(item => tagRevisionId(item) === selectedRevisionId);
    return tag ? { kind: 'tag', name: tag.name, fullRef: tag.fullRef, tag } : null;
  }, [branches, tags, selectedRevisionId]);

  useEffect(() => {
    if (!repoPath || !selectedRevision) {
      setSelectedRevisionCommits([]);
      setRevisionCommitsError(null);
      setRevisionCommitsLoading(false);
      return;
    }

    let disposed = false;
    setRevisionCommitsLoading(true);
    setRevisionCommitsError(null);

    void tauriGitBackend
      .getRefGraph(repoPath, selectedRevision.fullRef, { maxCount: 3 })
      .then(rows => {
        if (!disposed) {
          setSelectedRevisionCommits(rows);
        }
      })
      .catch(error => {
        if (!disposed) {
          setSelectedRevisionCommits([]);
          setRevisionCommitsError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!disposed) {
          setRevisionCommitsLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, [repoPath, selectedRevision]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: prev[folderId] === false
    }));
  };

  const openResetDialog = (reference: string) => {
    setResetReference(reference);
  };

  const handleBranchMenu = (e: React.MouseEvent, branch: BranchNode) => {
    openMenu(
      e,
      branch.name,
      buildBranchMenuItems(branch, {
        repoPath,
        currentBranch,
        checkoutBranch,
        renameBranch,
        mergeBranch,
        rebaseBranch,
        openResetDialog,
        setUpstream,
        deleteBranch,
        setCompareSeedRef,
        setView,
        prompt,
        confirm
      })
    );
  };

  const handleTagMenu = (e: React.MouseEvent, tag: TagNode) => {
    openMenu(e, tag.name, [
      { label: 'Checkout', hint: '↵', run: () => checkoutBranch(tag.name) },
      {
        label: `New branch from '${tag.name}'…`,
        run: () => {
          prompt(
            `Create new branch from ${tag.name}`,
            `Enter a name for the new branch based on tag ${tag.name}.`,
            'Create branch',
            `${tag.name}-branch`,
            (newBranch?: string) => {
              const name = newBranch?.trim();
              if (!name) {
                return;
              }
              void tauriGitBackend
                .createBranch(repoPath, name, tag.name)
                .then(() => checkoutBranch(name))
                .catch(error => toastRun('Create branch failed', String(error)));
            }
          );
        }
      },
      { sep: true },
      { label: `Merge ${tag.name} into ${currentBranch}`, run: () => mergeBranch(tag.name) },
      { label: `Rebase ${currentBranch} onto ${tag.name}`, run: () => rebaseBranch(tag.name) },
      {
        label: 'Compare with current',
        run: () => {
          setCompareSeedRef(tag.name);
          setView('compare');
        }
      },
      { label: 'Open in Git Graph', run: () => setView('graph') },
      { sep: true },
      {
        label: 'Reset current to here…',
        run: () => openResetDialog(tag.name)
      },
      { sep: true },
      {
        label: `Delete ${tag.name}`,
        danger: true,
        run: () =>
          confirm(
            `Delete tag ${tag.name}?`,
            'This tag will be deleted from your local repository.',
            `git tag -d ${tag.name}`,
            'Delete tag',
            () => void deleteTag(tag.name)
          )
      }
    ]);
  };

  const remoteCount = useMemo(() => {
    return new Set(
      branches
        .filter(branch => branch.kind === 'remote')
        .map(branch => branch.remoteName || 'remote')
    ).size;
  }, [branches]);

  const handleAddRemote = () => {
    openAddRemoteDialog();
  };

  const handleManageRemotes = (e: React.MouseEvent) => {
    void getRemotes().then(list => {
      const items = list.map(r => ({
        label: `${r.name} (${r.kind})`,
        hint: r.url,
        run: () => {
          confirm(
            `Delete remote ${r.name}?`,
            'This will remove the remote server reference from your repository configuration.',
            `git remote remove ${r.name}`,
            'Delete Remote',
            () => void deleteRemote(r.name)
          );
        }
      }));
      openMenu(
        e,
        'Configured Remotes (click to remove)',
        items.length ? items : [{ label: 'No remotes configured' }]
      );
    });
  };

  const handleRemoteGroupMenu = (e: React.MouseEvent) => {
    openMenu(e, 'Remotes', [
      { label: 'Fetch all', run: () => doFetch() },
      { label: 'Add new remote…', run: handleAddRemote }
    ]);
  };

  const handleRemoteFolderMenu = (e: React.MouseEvent, remoteName: string) => {
    openMenu(e, `Remote: ${remoteName}`, [
      {
        label: `Fetch ${remoteName}`,
        run: () => {
          toastRun('Fetching', `Fetching from remote ${remoteName}…`);
          void tauriGitBackend
            .fetch(repoPath, { remote: remoteName, prune: true })
            .then(() => {
              toastRun('Fetch complete', `Fetched remote ${remoteName}`);
            })
            .catch(err => {
              console.error(err);
              toastRun('Fetch failed', String(err));
            });
        }
      },
      {
        label: 'Change remote URL…',
        run: () => {
          void getRemotes().then(remotes => {
            const remote = remotes.find(r => r.name === remoteName);
            const currentUrl = remote ? remote.url : '';
            openEditRemoteDialog(remoteName, currentUrl);
          });
        }
      }
    ]);
  };

  const selectedRevisionMeta = selectedRevision
    ? selectedRevision.kind === 'branch'
      ? formatBranchMeta(selectedRevision.branch)
      : `tag · ${selectedRevision.tag.sha.slice(0, 7)}`
    : '';

  const treePanel = useResizablePanel({
    storageKey: 'ag_panel_branches_tree_width',
    defaultSize: 340,
    minSize: 200,
    maxSize: 600,
    direction: 'horizontal'
  });

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div
        style={{
          width: `${treePanel.size}px`,
          flex: '0 0 auto',
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
                  onContextMenu={row.id === 'group:remote' ? handleRemoteGroupMenu : undefined}
                  style={{
                    height: '26px',
                    padding: '0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--fg3)',
                    userSelect: 'none',
                    cursor: row.id === 'group:remote' ? 'pointer' : 'default'
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
              const isRemoteFolder = row.id.startsWith('folder:remote:');

              return (
                <div
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onClick={() => toggleFolder(row.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFolder(row.id);
                    }
                  }}
                  onContextMenu={
                    isRemoteFolder ? e => handleRemoteFolderMenu(e, row.label) : undefined
                  }
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

            if (row.type === 'tag') {
              const padLeft = 10 + row.depth * 12;
              const isSelected = selectedRevisionId === tagRevisionId(row.tag);

              return (
                <div
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => setSelectedRevisionId(tagRevisionId(row.tag))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedRevisionId(tagRevisionId(row.tag));
                    }
                  }}
                  onContextMenu={e => handleTagMenu(e, row.tag)}
                  title={`Inspect tag ${row.tag.name}`}
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
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <i className="ph ph-tag" style={{ fontSize: '13px', color: 'var(--fg3)' }} />
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
                    {row.tag.sha.slice(0, 7)}
                  </span>
                </div>
              );
            }

            const branch = row.branch;
            const padLeft = 10 + row.depth * 12;
            const isSelected = selectedRevisionId === branchRevisionId(branch);
            const iconColor = branch.kind === 'remote' ? 'var(--fg3)' : 'var(--color-accent)';
            const meta = formatBranchMeta(branch);

            return (
              <div
                key={row.id}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => setSelectedRevisionId(branchRevisionId(branch))}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedRevisionId(branchRevisionId(branch));
                  }
                }}
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
          {loadError && !isLoading && (
            <div
              style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                margin: '12px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)' }}>
                Failed to load branches
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--fg2)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}
              >
                {loadError}
              </div>
              <Button
                variant="secondary"
                style={{ alignSelf: 'flex-start', height: '24px', fontSize: '11px' }}
                onClick={() => {
                  setIsLoading(true);
                  setLoadError(null);
                  void (async () => {
                    try {
                      const [branchRefs, tagRefs] = await Promise.all([
                        tauriGitBackend.getBranches(repoPath),
                        tauriGitBackend.getTags(repoPath)
                      ]);
                      setBranches(branchRefs.map(normalizeBranchRef));
                      setTags(tagRefs.map(normalizeTagRef));
                      setLoadError(null);
                    } catch (err) {
                      setLoadError(err instanceof Error ? err.message : String(err));
                    } finally {
                      setIsLoading(false);
                    }
                  })();
                }}
              >
                Retry
              </Button>
            </div>
          )}
          {!treeRows.length && !isLoading && !loadError && (
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
            onClick={handleAddRemote}
          >
            Add remote…
          </Button>
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11px' }}
            onClick={handleManageRemotes}
          >
            Manage
          </Button>
        </div>
      </div>

      <ResizeHandle
        direction="horizontal"
        isDragging={treePanel.isDragging}
        onMouseDown={treePanel.handleMouseDown}
        onDoubleClick={treePanel.resetSize}
        title="Drag to resize branch tree panel (Double-click to reset)"
      />

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
            {selectedRevision?.name || 'No revision selected'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>
            {selectedRevisionMeta || 'Select a branch or tag to inspect details'}
          </span>
          <div style={{ flex: 1 }} />
          <Button
            variant="secondary"
            style={{ height: '25px', padding: '0 10px' }}
            onClick={() => {
              if (selectedRevision) setCompareSeedRef(selectedRevision.name);
              setView('compare');
            }}
            disabled={!selectedRevision}
          >
            Compare with current
          </Button>
          <Button
            variant="primary"
            style={{ height: '25px', padding: '0 10px' }}
            onClick={selectedRevision ? () => void mergeBranch(selectedRevision.name) : undefined}
            disabled={!selectedRevision}
          >
            <i className="ph ph-git-merge" style={{ fontSize: '14px' }} /> Merge into{' '}
            {currentBranch}
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
            Recent commits on this revision
          </h6>
          {revisionCommitsLoading && (
            <div style={{ color: 'var(--fg3)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              Loading recent commits…
            </div>
          )}
          {!revisionCommitsLoading && revisionCommitsError && (
            <div style={{ color: 'var(--danger)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              Failed to load commits: {revisionCommitsError}
            </div>
          )}
          {!revisionCommitsLoading && !revisionCommitsError && selectedRevision && !selectedRevisionCommits.length && (
            <div style={{ color: 'var(--fg3)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              This revision has no commits yet.
            </div>
          )}
          {!revisionCommitsLoading && !revisionCommitsError && !selectedRevision && (
            <div style={{ color: 'var(--fg3)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              Select a branch or tag to see its recent commits.
            </div>
          )}
          {selectedRevisionCommits.map(commit => {
            return (
              <div
                key={commit.sha}
                role="button"
                tabIndex={0}
                data-gc-context-menu="commit"
                title={`${commit.author} · ${commit.date} · ${commit.shortSha}`}
                onClick={() => openCommitDetails(commit)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCommitDetails(commit);
                  }
                }}
                onContextMenu={event => handleRecentCommitMenu(event, commit)}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'baseline',
                  padding: '7px 8px',
                  borderBottom: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
                className="gc-hover-bg"
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--iris)',
                    fontSize: '11.5px'
                  }}
                >
                  {commit.shortSha}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {commit.subject}
                </span>
                <span style={{ color: 'var(--fg3)', fontSize: '11.5px' }}>{commit.author}</span>
                <span
                  style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                >
                  {commit.date.replace('T', ' ').replace('Z', '').slice(5, 10)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <ResetDialog
        reference={resetReference}
        currentBranch={currentBranch}
        onClose={() => setResetReference(null)}
        onReset={(reference, mode) => void resetToRef(reference, mode)}
      />
    </div>
  );
};
