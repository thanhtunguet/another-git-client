import type { GitClientView, MenuItem } from '../types/git-client';
import { tauriGitBackend, type BranchRef } from '../services/tauriGitBackend';

export type BranchKind = 'local' | 'remote';

export type BranchNode = {
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

export function normalizeBranchRef(branch: BranchRef): BranchNode {
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

export interface BranchMenuActions {
  repoPath: string;
  currentBranch: string;
  checkoutBranch: (branchName: string) => void | Promise<void>;
  checkoutTrackingBranch: (branchName: string) => void | Promise<void>;
  renameBranch: (oldName: string, newName: string) => void | Promise<void>;
  mergeBranch: (reference: string) => void | Promise<void>;
  rebaseBranch: (reference: string) => void | Promise<void>;
  openResetDialog: (reference: string) => void;
  setUpstream: (branchName?: string, upstreamName?: string) => void | Promise<void>;
  deleteBranch: (branchName: string, isRemote?: boolean, force?: boolean) => void | Promise<void>;
  setCompareSeedRef: (ref: string | null) => void;
  setView: (view: GitClientView) => void;
  prompt: (
    title: string,
    body: string,
    action: string,
    defaultValue: string,
    run?: (value: string) => void,
    inputLabel?: string,
    inputRequired?: boolean
  ) => void;
  confirm: (title: string, body: string, cmd: string, action: string, run?: () => void) => void;
}

export function buildBranchMenuItems(branch: BranchNode, ctx: BranchMenuActions): MenuItem[] {
  const name = branch.name;
  const remoteName = branch.remoteName || 'origin';
  const remoteShort = branch.shortName;

  return [
    branch.kind === 'remote'
      ? { label: 'Checkout as local tracking branch', hint: '↵', run: () => ctx.checkoutTrackingBranch(name) }
      : { label: 'Checkout', hint: '↵', run: () => ctx.checkoutBranch(name) },
    {
      label: `New branch from '${name}'…`,
      run: () => {
        ctx.prompt(
          `Create new branch from ${name}`,
          `Enter a name for the new branch based on ${name}.`,
          'Create branch',
          `${name}-copy`,
          (newBranch?: string) => {
            if (newBranch && newBranch.trim()) {
              void tauriGitBackend.createBranch(ctx.repoPath, newBranch.trim(), name).then(() => {
                void ctx.checkoutBranch(newBranch.trim());
              });
            }
          }
        );
      }
    },
    {
      label: 'Rename…',
      run: () => {
        ctx.prompt(
          `Rename branch ${name}`,
          `Enter a new name for branch ${name}.`,
          'Rename branch',
          name,
          (newName?: string) => {
            if (newName && newName.trim() && newName.trim() !== name) {
              void ctx.renameBranch(name, newName.trim());
            }
          }
        );
      }
    },
    { sep: true },
    { label: `Merge ${name} into ${ctx.currentBranch}`, run: () => ctx.mergeBranch(name) },
    { label: `Rebase ${ctx.currentBranch} onto ${name}`, run: () => ctx.rebaseBranch(name) },
    {
      label: 'Compare with current',
      run: () => {
        ctx.setCompareSeedRef(name);
        ctx.setView('compare');
      }
    },
    { label: 'Open in Git Graph', run: () => ctx.setView('graph') },
    { sep: true },
    {
      label: 'Reset current to here…',
      run: () => ctx.openResetDialog(name)
    },
    { sep: true },
    {
      label: branch.kind === 'remote' ? 'Untrack upstream' : 'Set upstream…',
      run: () => {
        if (branch.kind === 'remote') {
          void ctx.setUpstream(ctx.currentBranch, undefined);
        } else {
          ctx.prompt(
            `Set upstream for ${name}`,
            `Enter the upstream branch name (e.g. origin/${name}).`,
            'Set upstream',
            `origin/${name}`,
            (upstream?: string) => {
              if (upstream !== undefined && upstream !== null) {
                void ctx.setUpstream(name, upstream.trim() || undefined);
              }
            }
          );
        }
      }
    },
    {
      label: `Delete ${name}`,
      danger: true,
      run: () =>
        ctx.confirm(
          `Delete branch ${name}?`,
          branch.kind === 'remote'
            ? 'This deletes the branch on the remote server.'
            : 'This branch will be deleted from your local repository.',
          branch.kind === 'remote'
            ? `git push ${remoteName} --delete ${remoteShort}`
            : `git branch -D ${name}`,
          'Delete branch',
          () => void ctx.deleteBranch(name, branch.kind === 'remote', true)
        )
    }
  ];
}
