import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from './Button';
import { Checkbox, Input, Textarea } from './FormControls';

export const Dialog: React.FC = () => {
  const {
    dialog,
    closeDialog,
    confirmDialog,
    cloneDialogUrl,
    setCloneDialogUrl,
    cloneDialogUseGit,
    setCloneDialogUseGit,
    remoteDialogName,
    setRemoteDialogName,
    remoteDialogUrl,
    setRemoteDialogUrl,
    promptDialogValue,
    setPromptDialogValue,
    patchDialogContent,
    setPatchDialogContent
  } = useGitClient();

  if (!dialog) return null;

  const isCloneDialog = dialog.kind === 'clone';
  const isRemoteDialog = dialog.kind === 'add-remote' || dialog.kind === 'edit-remote';
  const isPromptDialog = dialog.kind === 'prompt';
  const isApplyPatchDialog = dialog.kind === 'apply-patch';
  const isEditing = dialog.kind === 'edit-remote';

  const canConfirm = isCloneDialog
    ? !!cloneDialogUrl.trim()
    : isRemoteDialog
    ? !!remoteDialogName.trim() && !!remoteDialogUrl.trim()
    : isPromptDialog && dialog.inputRequired !== false
    ? !!promptDialogValue.trim()
    : isApplyPatchDialog
    ? !!patchDialogContent.trim()
    : true;

  return (
    <div className="dialog-backdrop" style={{ zIndex: 80 }} onClick={closeDialog}>
      <div className="dialog" style={{ animation: 'popIn .1s ease-out' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <i
            className={
              isCloneDialog
                ? 'ph ph-download-simple'
                : isRemoteDialog
                ? 'ph ph-cloud-arrow-up'
                : isPromptDialog
                ? 'ph ph-cursor-text'
                : 'ph ph-warning-circle'
            }
            style={{
              fontSize: '20px',
              color: isCloneDialog || isRemoteDialog || isPromptDialog ? 'var(--color-accent)' : 'var(--del)'
            }}
          />
          <div>
            <div className="dialog-title" style={{ fontSize: '18px' }}>
              {dialog.title}
            </div>
            <div
              className="dialog-body"
              style={{ marginTop: 'var(--space-2)', textWrap: 'pretty' }}
            >
              {dialog.body}
            </div>
          </div>
        </div>
        {isCloneDialog && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Input
              label="Repository URL"
              value={cloneDialogUrl}
              onChange={e => setCloneDialogUrl(e.target.value)}
              placeholder="https://github.com/owner/repo.git or git@github.com:owner/repo.git"
              autoFocus
            />
            <Checkbox
              checked={cloneDialogUseGit}
              onChange={e => setCloneDialogUseGit(e.currentTarget.checked)}
              label="Replace HTTPS with Git SSH URL"
            />
          </div>
        )}
        {isRemoteDialog && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Input
              label="Remote Name"
              value={remoteDialogName}
              onChange={e => setRemoteDialogName(e.target.value)}
              placeholder="e.g. origin, upstream"
              autoFocus={!isEditing}
              readOnly={isEditing}
            />
            <Input
              label="Remote URL"
              value={remoteDialogUrl}
              onChange={e => setRemoteDialogUrl(e.target.value)}
              placeholder="e.g. https://github.com/owner/repo.git"
              autoFocus={isEditing}
            />
          </div>
        )}
        {isPromptDialog && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Input
              label={dialog.inputLabel || 'Value'}
              placeholder={dialog.inputLabel || 'Enter a value'}
              value={promptDialogValue}
              onChange={e => setPromptDialogValue(e.target.value)}
              autoFocus
            />
          </div>
        )}
        {isApplyPatchDialog && (
          <Textarea
            label="Unified patch"
            value={patchDialogContent}
            onChange={event => setPatchDialogContent(event.target.value)}
            placeholder="diff --git a/file b/file\n..."
            rows={12}
            autoFocus
            style={{ minHeight: '220px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
          />
        )}
        {dialog.cmd && (
          <div
            style={{
              padding: 'var(--space-3)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              color: 'var(--fg2)',
              whiteSpace: 'pre-wrap'
            }}
          >
            {dialog.cmd}
          </div>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" style={{ height: '28px' }} onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            variant="primary"
            style={
              isCloneDialog || isRemoteDialog || isPromptDialog
                ? { height: '28px' }
                : { height: '28px', color: 'var(--del)', borderColor: 'var(--del)' }
            }
            onClick={confirmDialog}
            disabled={!canConfirm}
            title={canConfirm ? undefined : 'Fill in the required field(s) to continue'}
          >
            {dialog.action}
          </Button>
        </div>
      </div>
    </div>
  );
};
