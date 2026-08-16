import React, { useEffect, useRef } from 'react';
import { ensureMonaco, languageForPath, themeNameFor } from '../../services/monacoSetup';
import type { MonacoDiffEditor, MonacoTextModel } from '../../services/monacoSetup';
import type { MonacoDiffPaneProps } from './monacoDiffPaneTypes';

export type { MonacoDiffPaneProps } from './monacoDiffPaneTypes';

/** Tells DiffViewer whether the real pane is present or the build stubbed it. */
export const monacoDiffPaneAvailable = true;

const AUTOSAVE_DELAY_MS = 800;

type DiffEditor = MonacoDiffEditor;
type TextModel = MonacoTextModel;

/**
 * Side-by-side diff backed by Monaco's diff editor.
 *
 * The modified (right) model is the source of truth while the pane is open:
 * incoming `modifiedText` is only applied when the buffer is clean, so neither
 * the 2s status poller nor a post-save refresh can clobber what the user is
 * typing.
 */
export const MonacoDiffPane: React.FC<MonacoDiffPaneProps> = ({
  filePath,
  originalText,
  modifiedText,
  editable,
  theme,
  showGutterMarkers = true,
  onSave,
  onDirtyChange,
  onInitError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<DiffEditor | null>(null);
  const originalModelRef = useRef<TextModel | null>(null);
  const modifiedModelRef = useRef<TextModel | null>(null);

  // Latest values, so the debounce timer and the unmount flush always persist
  // what is on screen rather than what was current when they were scheduled.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Path the *current models* belong to.
   *
   * Deliberately not the `filePath` prop: that updates during render, so a
   * flush triggered while switching files would write the outgoing buffer to
   * the incoming file's path. This is only advanced once new models are in
   * place.
   */
  const openPathRef = useRef(filePath);
  const editableRef = useRef(editable);
  const onSaveRef = useRef(onSave);
  const onDirtyChangeRef = useRef(onDirtyChange);
  /** Content last loaded from, or written to, disk — the clean baseline. */
  const baselineRef = useRef(modifiedText);
  const dirtyRef = useRef(false);

  editableRef.current = editable;
  onSaveRef.current = onSave;
  onDirtyChangeRef.current = onDirtyChange;

  const setDirty = (next: boolean) => {
    if (dirtyRef.current === next) return;
    dirtyRef.current = next;
    onDirtyChangeRef.current?.(next);
  };

  const flushSave = useRef(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!dirtyRef.current || !editableRef.current) return;

    const model = modifiedModelRef.current;
    const save = onSaveRef.current;
    if (!model || model.isDisposed() || !save) return;

    // Read synchronously: callers flush immediately before disposing models.
    const content = model.getValue();
    const path = openPathRef.current;

    try {
      await save(path, content);
      baselineRef.current = content;
      setDirty(false);
    } catch {
      // Stay dirty so blur or the next edit retries, and so an incoming
      // refresh cannot overwrite edits that never reached disk.
    }
  }).current;

  const scheduleSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void flushSave(), AUTOSAVE_DELAY_MS);
  };

  // Create the editor once; models and options are updated in the effects below.
  useEffect(() => {
    if (!containerRef.current) return;

    let editor: DiffEditor;
    try {
      const monaco = ensureMonaco();
      editor = monaco.editor.createDiffEditor(containerRef.current, {
        automaticLayout: true,
        renderSideBySide: true,
        originalEditable: false,
        readOnly: !editableRef.current,
        theme: themeNameFor(theme),
        fontFamily: 'var(--font-mono)',
        fontSize: 11.8,
        lineHeight: 18,
        lineNumbers: showGutterMarkers ? 'on' : 'off',
        renderOverviewRuler: false,
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        scrollbar: { useShadows: false },
        renderLineHighlight: 'none',
        smoothScrolling: true,
        contextmenu: true
      });
    } catch (error) {
      onInitError?.(error);
      return;
    }

    editorRef.current = editor;

    const blurListener = editor.getModifiedEditor().onDidBlurEditorWidget(() => {
      void flushSave();
    });

    return () => {
      // Persist before tearing down, then dispose models we own.
      void flushSave();
      blurListener.dispose();
      editor.dispose();
      originalModelRef.current?.dispose();
      modifiedModelRef.current?.dispose();
      editorRef.current = null;
      originalModelRef.current = null;
      modifiedModelRef.current = null;
    };
    // Mount-only: subsequent prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap models when the file changes.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const monaco = ensureMonaco();
    const language = languageForPath(filePath);

    // Flush edits belonging to the file we are leaving before replacing models.
    void flushSave();

    const previousOriginal = originalModelRef.current;
    const previousModified = modifiedModelRef.current;

    const original = monaco.editor.createModel(originalText, language);
    const modified = monaco.editor.createModel(modifiedText, language);

    originalModelRef.current = original;
    modifiedModelRef.current = modified;
    openPathRef.current = filePath;
    baselineRef.current = modifiedText;
    setDirty(false);

    editor.setModel({ original, modified });

    const changeListener = modified.onDidChangeContent(() => {
      if (!editableRef.current) return;
      setDirty(modified.getValue() !== baselineRef.current);
      if (dirtyRef.current) scheduleSave();
    });

    previousOriginal?.dispose();
    previousModified?.dispose();

    return () => changeListener.dispose();
    // `originalText`/`modifiedText` are intentionally excluded: re-creating
    // models on every content refresh would drop undo history and the caret.
    // The effect below reconciles content for the current file instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

  // Reconcile incoming content for the file already open.
  useEffect(() => {
    const original = originalModelRef.current;
    const modified = modifiedModelRef.current;
    if (!original || !modified || original.isDisposed() || modified.isDisposed()) return;

    if (original.getValue() !== originalText) {
      original.setValue(originalText);
    }

    // Never overwrite unsaved edits, and ignore the echo of our own write.
    if (dirtyRef.current || modified.getValue() === modifiedText) return;

    // pushEditOperations rather than setValue: it keeps the undo stack and the
    // view state intact, so a background refresh does not jump the caret.
    modified.pushEditOperations(
      null,
      [{ range: modified.getFullModelRange(), text: modifiedText }],
      () => null
    );
    baselineRef.current = modifiedText;
    setDirty(false);
  }, [originalText, modifiedText]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: !editable, originalEditable: false });
  }, [editable]);

  useEffect(() => {
    ensureMonaco().editor.setTheme(themeNameFor(theme));
  }, [theme]);

  useEffect(() => {
    editorRef.current?.updateOptions({ lineNumbers: showGutterMarkers ? 'on' : 'off' });
  }, [showGutterMarkers]);

  return <div ref={containerRef} style={{ flex: 1, minHeight: 0, minWidth: 0 }} />;
};
