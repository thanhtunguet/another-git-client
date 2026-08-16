import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import { SegmentedControl } from './SegmentedControl';
import { useGitClient } from '../../context/GitClientContext';
import { isEditableTarget } from '../../hooks/useKeybindings';
import { MonacoDiffPane, monacoDiffPaneAvailable } from './MonacoDiffPane';

export interface DiffLine {
  text: string;
  type: 'hunk' | 'add' | 'del' | 'context';
  oldLine?: number;
  newLine?: number;
}

export function parseDiffText(raw: string): DiffLine[] {
  if (!raw || !raw.trim()) return [];
  const lines = raw.split('\n');
  const result: DiffLine[] = [];
  let oldN = 0;
  let newN = 0;
  let mergeNextRangeIntoFileHeader = false;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      result.push({ text: line, type: 'hunk' });
      mergeNextRangeIntoFileHeader = true;
      continue;
    }

    const isFileMetadata =
      /^(?:old mode|new mode|deleted file mode|new file mode|similarity index|dissimilarity index|rename from|rename to|copy from|copy to|Binary files |GIT binary patch|literal |delta )/.test(
        line
      );

    if (isFileMetadata) {
      continue;
    }
    if (line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
      continue;
    }
    if (line.startsWith('@@')) {
      const match = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      if (match) {
        oldN = parseInt(match[1], 10) - 1;
        newN = parseInt(match[2], 10) - 1;
      }
      const previousLine = result[result.length - 1];
      if (mergeNextRangeIntoFileHeader && previousLine?.type === 'hunk') {
        previousLine.text = `${previousLine.text} · ${line}`;
      } else {
        result.push({ text: line, type: 'hunk' });
      }
      mergeNextRangeIntoFileHeader = false;
    } else if (line.startsWith('+')) {
      newN++;
      mergeNextRangeIntoFileHeader = false;
      result.push({ text: line.slice(1), type: 'add', newLine: newN });
    } else if (line.startsWith('-')) {
      oldN++;
      mergeNextRangeIntoFileHeader = false;
      result.push({ text: line.slice(1), type: 'del', oldLine: oldN });
    } else {
      const content = line.startsWith(' ') ? line.slice(1) : line;
      oldN++;
      newN++;
      mergeNextRangeIntoFileHeader = false;
      result.push({ text: content, type: 'context', oldLine: oldN, newLine: newN });
    }
  }
  return result;
}

export interface SideCell {
  lineNumber?: number;
  text: string;
  type: 'add' | 'del' | 'context' | 'empty';
}

export interface SideBySideRow {
  id: string;
  type: 'hunk' | 'line';
  hunkText?: string;
  left?: SideCell;
  right?: SideCell;
}

export function parseSideBySideDiff(parsedLines: DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let rowId = 0;

  let pendingDels: DiffLine[] = [];
  let pendingAdds: DiffLine[] = [];

  const flushPending = () => {
    if (pendingDels.length === 0 && pendingAdds.length === 0) return;

    const maxLen = Math.max(pendingDels.length, pendingAdds.length);
    for (let i = 0; i < maxLen; i++) {
      const delItem = pendingDels[i];
      const addItem = pendingAdds[i];

      rows.push({
        id: `sbs-${rowId++}`,
        type: 'line',
        left: delItem
          ? { lineNumber: delItem.oldLine, text: delItem.text, type: 'del' }
          : { text: '', type: 'empty' },
        right: addItem
          ? { lineNumber: addItem.newLine, text: addItem.text, type: 'add' }
          : { text: '', type: 'empty' }
      });
    }

    pendingDels = [];
    pendingAdds = [];
  };

  for (const line of parsedLines) {
    if (line.type === 'hunk') {
      flushPending();
      rows.push({
        id: `sbs-${rowId++}`,
        type: 'hunk',
        hunkText: line.text
      });
    } else if (line.type === 'context') {
      flushPending();
      rows.push({
        id: `sbs-${rowId++}`,
        type: 'line',
        left: { lineNumber: line.oldLine, text: line.text, type: 'context' },
        right: { lineNumber: line.newLine, text: line.text, type: 'context' }
      });
    } else if (line.type === 'del') {
      if (pendingAdds.length > 0) {
        flushPending();
      }
      pendingDels.push(line);
    } else if (line.type === 'add') {
      pendingAdds.push(line);
    }
  }

  flushPending();
  return rows;
}

export interface DiffViewerProps {
  filePath?: string;
  rawDiffText: string;
  loading?: boolean;
  emptyMessage?: string;
  onStageFile?: () => void;
  onUnstageFile?: () => void;
  onCopyPatch?: () => void;
  onClose?: () => void;
  isStaged?: boolean;
  isUnstaged?: boolean;
  /**
   * Full text of the left-hand side. When both this and `modifiedText` are
   * supplied, the "2 Sides" view renders through Monaco instead of the
   * hunk-based renderer, showing the whole file rather than just the hunks.
   */
  originalText?: string | null;
  /** Full text of the right-hand ("current state") side. */
  modifiedText?: string | null;
  /**
   * Allows typing in the right-hand pane. Only meaningful when that side is a
   * real file on disk — never for index or historical content.
   */
  editable?: boolean;
  /** Set when the content is binary or too large to load as text. */
  contentUnavailable?: boolean;
  onSaveFile?: (filePath: string, content: string) => Promise<void> | void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  filePath,
  rawDiffText,
  loading = false,
  emptyMessage = 'No diff output found.',
  onStageFile,
  onUnstageFile,
  onCopyPatch,
  onClose,
  isStaged,
  isUnstaged,
  originalText,
  modifiedText,
  editable = false,
  contentUnavailable = false,
  onSaveFile
}) => {
  const { preferences, updatePreference, toastRun, theme } = useGitClient();
  const [dirty, setDirty] = useState(false);
  const [monacoFailed, setMonacoFailed] = useState(false);

  const showGutterMarkers = preferences.gutterMarkers !== false;
  // Default to 'split' (2 sides) unless explicitly set to 'inline'
  const diffMode: 'split' | 'inline' = preferences.diffMode === 'inline' ? 'inline' : 'split';

  const parsedLines = useMemo(() => parseDiffText(rawDiffText), [rawDiffText]);
  const sideBySideRows = useMemo(() => parseSideBySideDiff(parsedLines), [parsedLines]);
  const splitContentRef = useRef<HTMLDivElement>(null);
  const activeSplitSideRef = useRef<'left' | 'right' | null>(null);

  const monoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11.8px',
    lineHeight: '18px'
  };

  /**
   * Monaco needs whole-file text on both sides. Where the caller could not
   * supply it — binary or oversized content, or a Monaco that failed to
   * start — we keep rendering the hunk-based patch view.
   */
  const useMonacoSplit =
    diffMode === 'split' &&
    monacoDiffPaneAvailable &&
    !monacoFailed &&
    !contentUnavailable &&
    typeof originalText === 'string' &&
    typeof modifiedText === 'string';

  const handleCopyPatch = () => {
    if (onCopyPatch) {
      onCopyPatch();
    } else if (rawDiffText) {
      void navigator.clipboard.writeText(rawDiffText);
      toastRun('Copied diff patch', filePath || 'diff');
    }
  };

  const clearSplitSelectionRestrictions = () => {
    splitContentRef.current
      ?.querySelectorAll<HTMLElement>('[data-diff-side], [data-diff-hunk]')
      .forEach(element => {
        element.style.removeProperty('user-select');
        element.style.removeProperty('-webkit-user-select');
      });
  };

  const activateSplitSide = (event: React.PointerEvent<HTMLDivElement>) => {
    const side = (event.target as HTMLElement).closest<HTMLElement>('[data-diff-side]')?.dataset
      .diffSide;
    if (side !== 'left' && side !== 'right') return;

    clearSplitSelectionRestrictions();
    activeSplitSideRef.current = side;
    splitContentRef.current?.focus({ preventScroll: true });
  };

  const deactivateSplitSide = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      activeSplitSideRef.current = null;
    }
  };

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'a') return;
      // Never hijack select-all from a real editing surface (Monaco's input is
      // a textarea, the commit box, filter inputs, …).
      if (isEditableTarget(event.target)) return;

      const activeSide = activeSplitSideRef.current;
      const content = splitContentRef.current;
      const selection = window.getSelection();
      if ((activeSide !== 'left' && activeSide !== 'right') || !content || !selection) return;

      event.preventDefault();
      event.stopPropagation();

      content.querySelectorAll<HTMLElement>('[data-diff-side]').forEach(element => {
        if (element.dataset.diffSide === activeSide) return;
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
      });
      content.querySelectorAll<HTMLElement>('[data-diff-hunk]').forEach(element => {
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
      });

      const range = document.createRange();
      range.selectNodeContents(content);
      selection.removeAllRanges();
      selection.addRange(range);
    };

    window.addEventListener('keydown', handleWindowKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleWindowKeyDown, { capture: true });
  }, []);

  const renderHeaderBar = () => (
    <div
      style={{
        flex: '0 0 auto',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 12px',
        background: 'var(--panel)',
        borderBottom: '1px solid var(--line)'
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          fontWeight: 600
        }}
      >
        {filePath || 'Repository diff'}
      </span>

      {useMonacoSplit && editable && (
        <span
          title={
            dirty
              ? 'Unsaved edits — saved automatically'
              : 'Editing the working tree file; changes save automatically'
          }
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            color: dirty ? 'var(--warn)' : 'var(--fg3)'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: dirty ? 'var(--warn)' : 'var(--add)'
            }}
          />
          {dirty ? 'Saving…' : 'Editable'}
        </span>
      )}

      <SegmentedControl
        options={[
          { value: 'split', label: '2 Sides' },
          { value: 'inline', label: '1 Side' }
        ]}
        value={diffMode}
        onChange={mode => updatePreference('diffMode', mode)}
        style={{ height: '23px', fontSize: '11px' }}
      />

      {isUnstaged && onStageFile && (
        <Button
          variant="secondary"
          style={{ height: '22px', fontSize: '11.5px' }}
          onClick={onStageFile}
        >
          Stage file
        </Button>
      )}
      {isStaged && onUnstageFile && (
        <Button
          variant="secondary"
          style={{ height: '22px', fontSize: '11.5px' }}
          onClick={onUnstageFile}
        >
          Unstage file
        </Button>
      )}
      {rawDiffText && (
        <Button
          variant="secondary"
          style={{ height: '22px', fontSize: '11.5px' }}
          onClick={handleCopyPatch}
        >
          Copy patch
        </Button>
      )}
      {onClose && (
        <Button
          variant="secondary"
          style={{ width: '24px', height: '22px', padding: 0 }}
          onClick={onClose}
          title="Close diff (Esc)"
          aria-label="Close diff"
        >
          <i className="ph ph-x" />
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {renderHeaderBar()}
        <div style={{ flex: 1, padding: 'var(--space-4)', fontSize: '12px', color: 'var(--fg3)' }}>
          Loading diff…
        </div>
      </div>
    );
  }

  // Monaco renders whole files, so an unmodified working-tree file is still
  // worth opening — the empty state below would otherwise hide an editable file.
  if (useMonacoSplit) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {renderHeaderBar()}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', background: 'var(--color-bg)' }}>
          <MonacoDiffPane
            filePath={filePath || ''}
            originalText={originalText as string}
            modifiedText={modifiedText as string}
            editable={Boolean(editable && onSaveFile)}
            theme={theme === 'light' ? 'light' : 'dark'}
            showGutterMarkers={showGutterMarkers}
            onSave={onSaveFile}
            onDirtyChange={setDirty}
            onInitError={() => setMonacoFailed(true)}
          />
        </div>
      </div>
    );
  }

  if (!parsedLines.length) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {renderHeaderBar()}
        <div
          style={{
            flex: 1,
            padding: 'var(--space-4)',
            fontSize: '12px',
            color: 'var(--fg3)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {contentUnavailable && editable
            ? 'This file cannot be edited here — it is binary or too large.'
            : emptyMessage}
        </div>
      </div>
    );
  }

  // 2-Sides (Split / Two Columns) View
  if (diffMode === 'split') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {renderHeaderBar()}

        {/* Side-by-side Column Headers */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            borderBottom: '1px solid var(--line)',
            background: 'var(--panel)',
            fontSize: '11px',
            color: 'var(--fg3)',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)'
          }}
        >
          <div
            style={{
              flex: '1 1 0%',
              padding: '3px 12px',
              borderRight: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--del)' }}
            />
            Original (Old)
          </div>
          <div
            style={{
              flex: '1 1 0%',
              padding: '3px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--add)' }}
            />
            Modified (New)
          </div>
        </div>

        {/* Side-by-side Diff Content */}
        <div
          ref={splitContentRef}
          tabIndex={-1}
          onPointerDown={activateSplitSide}
          onBlur={deactivateSplitSide}
          style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            background: 'var(--color-bg)'
          }}
        >
          {sideBySideRows.map(row => {
            if (row.type === 'hunk') {
              return (
                <div
                  key={row.id}
                  data-diff-hunk
                  style={{
                    display: 'flex',
                    background: 'var(--raised)',
                    color: 'var(--fg3)',
                    padding: '3px 12px',
                    borderTop: '1px solid var(--line)',
                    borderBottom: '1px solid var(--line)',
                    fontWeight: 500,
                    ...monoStyle
                  }}
                >
                  {row.hunkText}
                </div>
              );
            }

            const left = row.left;
            const right = row.right;
            const leftBg = left?.type === 'del' ? 'var(--delbg)' : 'transparent';
            const leftFg =
              left?.type === 'del'
                ? 'var(--del)'
                : left?.type === 'context'
                  ? 'var(--fg)'
                  : 'transparent';
            const rightBg = right?.type === 'add' ? 'var(--addbg)' : 'transparent';
            const rightFg =
              right?.type === 'add'
                ? 'var(--add)'
                : right?.type === 'context'
                  ? 'var(--fg)'
                  : 'transparent';

            return (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  minHeight: '19px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                  ...monoStyle
                }}
              >
                <div
                  data-diff-side="left"
                  style={{
                    flex: '1 1 0%',
                    minWidth: 0,
                    display: 'flex',
                    background: leftBg,
                    borderRight: '1px solid var(--line)'
                  }}
                >
                  {showGutterMarkers && (
                    <span
                      aria-hidden="true"
                      onMouseDown={event => event.preventDefault()}
                      style={{
                        width: '46px',
                        flex: '0 0 46px',
                        textAlign: 'right',
                        paddingRight: '8px',
                        color: 'var(--fg3)',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        borderRight: '1px solid var(--line)'
                      }}
                    >
                      {left?.lineNumber || ''}
                    </span>
                  )}
                  <span
                    style={{
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      color: leftFg,
                      flex: 1
                    }}
                  >
                    {left?.text || ''}
                  </span>
                </div>

                <div
                  data-diff-side="right"
                  style={{
                    flex: '1 1 0%',
                    minWidth: 0,
                    display: 'flex',
                    background: rightBg
                  }}
                >
                  {showGutterMarkers && (
                    <span
                      aria-hidden="true"
                      onMouseDown={event => event.preventDefault()}
                      style={{
                        width: '46px',
                        flex: '0 0 46px',
                        textAlign: 'right',
                        paddingRight: '8px',
                        color: 'var(--fg3)',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        borderRight: '1px solid var(--line)'
                      }}
                    >
                      {right?.lineNumber || ''}
                    </span>
                  )}
                  <span
                    style={{
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      color: rightFg,
                      flex: 1
                    }}
                  >
                    {right?.text || ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 1-Side (Inline / Unified) View
  const inlineRows = parsedLines.map((line, i) => {
    const bg =
      line.type === 'add'
        ? 'var(--addbg)'
        : line.type === 'del'
          ? 'var(--delbg)'
          : line.type === 'hunk'
            ? 'var(--raised)'
            : 'transparent';
    const fg =
      line.type === 'add'
        ? 'var(--add)'
        : line.type === 'del'
          ? 'var(--del)'
          : line.type === 'hunk'
            ? 'var(--fg3)'
            : 'var(--fg)';

    return (
      <div key={i} style={{ display: 'flex', background: bg, ...monoStyle }}>
        {showGutterMarkers && (
          <>
            <span
              style={{
                width: '46px',
                flex: '0 0 46px',
                textAlign: 'right',
                paddingRight: '8px',
                color: 'var(--fg3)',
                userSelect: 'none'
              }}
            >
              {line.oldLine || ''}
            </span>
            <span
              style={{
                width: '46px',
                flex: '0 0 46px',
                textAlign: 'right',
                paddingRight: '10px',
                color: 'var(--fg3)',
                userSelect: 'none',
                borderRight: '1px solid var(--line)'
              }}
            >
              {line.newLine || ''}
            </span>
          </>
        )}
        <span style={{ paddingLeft: '10px', whiteSpace: 'pre-wrap', color: fg, flex: 1 }}>
          {line.text}
        </span>
      </div>
    );
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {renderHeaderBar()}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          padding: '6px 0',
          background: 'var(--color-bg)'
        }}
      >
        {inlineRows}
      </div>
    </div>
  );
};
