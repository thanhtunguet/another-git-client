/**
 * Monaco bootstrap for the diff panes.
 *
 * Two deliberate choices here:
 *
 * 1. We import `edcore.main`, not the package root. `edcore.main` is the full
 *    editor — including the diff editor, find widget, folding and bracket
 *    matching — but with no language *services*. The root entry additionally
 *    registers the css/html/json/typescript clients, each of which spawns its
 *    own worker and would decorate a read-only diff with squiggles. Syntax
 *    colouring instead comes from the Monarch grammars imported below, which
 *    run on the main thread.
 *
 * 2. The worker is inlined (`?worker&inline`). Monaco's diff is computed in a
 *    worker with no main-thread fallback — `EditorWorkerService.computeDiff`
 *    awaits it unconditionally — so a worker that fails to load renders both
 *    panes with zero diff decorations and reports nothing. Inlining emits a
 *    Blob worker that inherits the document origin, which sidesteps module
 *    resolution against Tauri's `tauri://localhost` custom scheme.
 */
import type * as MonacoApi from 'monaco-editor/esm/vs/editor/editor.api.js';
import * as edcoreMain from 'monaco-editor/esm/vs/editor/edcore.main.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker&inline';

// Monarch grammars: main-thread tokenizers, no workers. Each contribution is
// tiny and lazy-loads its own tokenizer chunk on first use.
import 'monaco-editor/esm/vs/basic-languages/bat/bat.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/clojure/clojure.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/coffee/coffee.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/dart/dart.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/dockerfile/dockerfile.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/elixir/elixir.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/fsharp/fsharp.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/handlebars/handlebars.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/hcl/hcl.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/ini/ini.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/julia/julia.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/less/less.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/lua/lua.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/mdx/mdx.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/mysql/mysql.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/objective-c/objective-c.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/perl/perl.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/pgsql/pgsql.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/powershell/powershell.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/protobuf/protobuf.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/pug/pug.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/r/r.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/restructuredtext/restructuredtext.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/scala/scala.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/scss/scss.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/shell/shell.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/solidity/solidity.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/swift/swift.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';

/**
 * Only `editor.api` ships declarations, so this is the one place where the
 * untyped `edcore.main` value is given its (identical) declared surface.
 */
const monaco = edcoreMain as unknown as typeof MonacoApi;

export type MonacoNamespace = typeof MonacoApi;
export type MonacoDiffEditor = MonacoApi.editor.IStandaloneDiffEditor;
export type MonacoTextModel = MonacoApi.editor.ITextModel;

export const DARK_THEME = 'another-git-dark';
export const LIGHT_THEME = 'another-git-light';

/**
 * Hex equivalents of the design tokens in `styles/_tokens.scss`.
 *
 * Monaco only accepts hex, while the tokens are authored as `oklch()` and
 * `color-mix()`. Resolving them at runtime would mean reading computed styles
 * and hoping the webview reports sRGB, so they are converted once, here.
 * Keep this table in sync when the tokens change.
 */
const DARK = {
  bg: '#161826',
  panel: '#232532',
  raised: '#2f313d',
  fg: '#e9e9ed',
  fg3: '#e9e9ed75',
  line: '#e9e9ed29',
  accent: '#9184d9',
  selection: '#9184d933',
  add: '#79bd8c',
  del: '#e6857e',
  addLine: '#79bd8c21',
  delLine: '#e6857e21',
  addText: '#79bd8c42',
  delText: '#e6857e42'
};

const LIGHT = {
  bg: '#f3f3f6',
  panel: '#ffffff',
  raised: '#f1f1f2',
  fg: '#1b1c26',
  fg3: '#1b1c2675',
  line: '#1b1c2626',
  accent: '#5f52a8',
  selection: '#5f52a833',
  add: '#2d7b48',
  del: '#b2403d',
  addLine: '#2d7b481f',
  delLine: '#b2403d1f',
  addText: '#2d7b4840',
  delText: '#b2403d40'
};

type Palette = typeof DARK;

const buildColors = (palette: Palette): Record<string, string> => ({
  'editor.background': palette.bg,
  'editor.foreground': palette.fg,
  'editorGutter.background': palette.bg,
  'editorLineNumber.foreground': palette.fg3,
  'editorLineNumber.activeForeground': palette.fg,
  'editorCursor.foreground': palette.accent,
  'editor.selectionBackground': palette.selection,
  'editor.inactiveSelectionBackground': palette.selection,
  'editor.lineHighlightBorder': '#00000000',
  'editorIndentGuide.background1': palette.line,
  'editorWhitespace.foreground': palette.line,
  'editorWidget.background': palette.panel,
  'editorWidget.border': palette.line,
  'editorWidget.foreground': palette.fg,
  'input.background': palette.raised,
  'input.foreground': palette.fg,
  'input.border': palette.line,
  'focusBorder': palette.accent,
  'scrollbarSlider.background': palette.line,
  'scrollbarSlider.hoverBackground': palette.fg3,
  'scrollbarSlider.activeBackground': palette.fg3,
  'diffEditor.border': palette.line,
  'diffEditor.insertedLineBackground': palette.addLine,
  'diffEditor.removedLineBackground': palette.delLine,
  'diffEditor.insertedTextBackground': palette.addText,
  'diffEditor.removedTextBackground': palette.delText,
  'diffEditorGutter.insertedLineBackground': palette.addLine,
  'diffEditorGutter.removedLineBackground': palette.delLine,
  'diffEditorOverview.insertedForeground': palette.add,
  'diffEditorOverview.removedForeground': palette.del
});

let initialized = false;

/**
 * Idempotently wires the worker factory and registers both themes.
 * Safe to call on every render; the work happens once.
 */
export function ensureMonaco(): MonacoNamespace {
  if (initialized) return monaco;

  const scope = self as typeof self & { MonacoEnvironment?: MonacoApi.Environment };
  if (!scope.MonacoEnvironment) {
    scope.MonacoEnvironment = {
      // Deliberately a default branch rather than `label === ''`: the label
      // Monaco passes for the diff worker is an implementation detail that has
      // changed between releases, and returning nothing yields a silently
      // decoration-free diff.
      getWorker: () => new EditorWorker()
    };
  }

  monaco.editor.defineTheme(DARK_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: buildColors(DARK)
  });

  monaco.editor.defineTheme(LIGHT_THEME, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: buildColors(LIGHT)
  });

  initialized = true;
  return monaco;
}

export function themeNameFor(theme: string): string {
  return theme === 'light' ? LIGHT_THEME : DARK_THEME;
}

/**
 * Filenames that identify a language on their own, before extensions apply.
 */
const FILENAME_LANGUAGES: Record<string, string> = {
  dockerfile: 'dockerfile',
  makefile: 'shell',
  gemfile: 'ruby',
  rakefile: 'ruby',
  '.gitignore': 'ini',
  '.gitattributes': 'ini',
  '.env': 'ini',
  '.bashrc': 'shell',
  '.zshrc': 'shell'
};

/**
 * JSON deliberately maps to `javascript`: Monaco's JSON support lives in the
 * worker-backed language service we exclude, and the JS Monarch grammar
 * tokenizes JSON (and JSONC comments) correctly.
 */
const EXTENSION_LANGUAGES: Record<string, string> = {
  bat: 'bat', c: 'cpp', cc: 'cpp', cjs: 'javascript', clj: 'clojure',
  coffee: 'coffeescript', conf: 'ini', cpp: 'cpp', cs: 'csharp', css: 'css',
  cts: 'typescript', dart: 'dart', ex: 'elixir', exs: 'elixir', fs: 'fsharp',
  gemspec: 'ruby', go: 'go', gradle: 'java', graphql: 'graphql', gql: 'graphql',
  h: 'cpp', hbs: 'handlebars', hcl: 'hcl', hpp: 'cpp', htm: 'html',
  html: 'html', ini: 'ini', java: 'java', jl: 'julia', js: 'javascript',
  json: 'javascript', json5: 'javascript', jsonc: 'javascript', jsx: 'javascript',
  kt: 'kotlin', kts: 'kotlin', less: 'less', lua: 'lua', m: 'objective-c',
  md: 'markdown', mdx: 'mdx', mjs: 'javascript', mts: 'typescript',
  mm: 'objective-c', pl: 'perl', pgsql: 'pgsql', php: 'php', pm: 'perl',
  ps1: 'powershell', proto: 'protobuf', pug: 'pug', py: 'python', r: 'r',
  rb: 'ruby', rs: 'rust', rst: 'restructuredtext', scala: 'scala', scss: 'scss',
  sh: 'shell', sol: 'solidity', sql: 'sql', svg: 'xml', swift: 'swift',
  tf: 'hcl', toml: 'ini', ts: 'typescript', tsx: 'typescript', vue: 'html',
  xml: 'xml', yaml: 'yaml', yml: 'yaml', zsh: 'shell'
};

export function languageForPath(filePath: string): string {
  const name = (filePath.split('/').pop() || '').toLowerCase();
  if (FILENAME_LANGUAGES[name]) return FILENAME_LANGUAGES[name];

  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return 'plaintext';

  return EXTENSION_LANGUAGES[name.slice(dot + 1)] || 'plaintext';
}
