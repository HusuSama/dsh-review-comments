// dsh-review-comments — client UI fragment (concatenated after src/client.core.js,
// before src/client.apply.js, inside one factory closure that already declares
// `React` and `h`). No imports, no JSX, no top-level side effects.

const FR_CSS = `
.dfr-root{--dfr-accent:var(--dsw-alias-link);--dfr-accent-row:color-mix(in srgb,var(--dsw-alias-link) 7%,transparent);--dfr-accent-fill:color-mix(in srgb,var(--dsw-alias-link) 7%,transparent);--dfr-accent-border:color-mix(in srgb,var(--dsw-alias-link) 38%,transparent);display:flex;flex-direction:column;height:100%;min-height:0;font-size:12px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);overflow:hidden}
.dfr-browse,.dfr-file{display:flex;flex-direction:column;flex:1 1 auto;min-height:0}
.dfr-header{display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;min-width:0}
.dfr-header-main{display:flex;flex-direction:column;flex:1 1 auto;min-width:0;overflow:hidden}
.dfr-title{font-size:12px;font-weight:600;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dfr-subtitle{font-size:11px;line-height:14px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dfr-header-actions{display:flex;align-items:center;gap:3px;flex:none}
.dfr-btn{appearance:none;display:inline-flex;align-items:center;gap:4px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;line-height:1;padding:4px 7px;cursor:pointer;white-space:nowrap}
.dfr-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-accent)}
.dfr-btn:disabled{opacity:.45;cursor:default}
.dfr-btn:focus-visible{outline:1px solid var(--dsw-alias-link);outline-offset:1px}
.dfr-btn-primary{border-color:var(--dsw-alias-button-info-fill);background:var(--dsw-alias-button-info-fill);color:var(--dsw-alias-label-primary-foreground)}
.dfr-btn-primary:hover:not(:disabled){border-color:var(--dsw-alias-button-info-hover);background:var(--dsw-alias-button-info-hover)}
.dfr-btn-ghost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.dfr-btn-ghost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dfr-icon-btn{padding:3px}
.dfr-icon{display:block;flex:none}
.dfr-danger{color:var(--dsw-alias-state-error-primary)}
.dfr-filter-row{flex:none;padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dfr-filter-input{box-sizing:border-box;width:100%;font:inherit;font-size:11px;line-height:16px;padding:4px 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.dfr-filter-input:focus{outline:none;border-color:var(--dsw-alias-link)}
.dfr-btn:focus-visible,.dfr-filter-input:focus,.dfr-popover-textarea:focus{outline-color:var(--dsw-alias-link);border-color:var(--dsw-alias-link)}
.dfr-filter-input::placeholder{color:var(--dsw-alias-label-secondary)}
.dfr-tree{flex:1 1 auto;min-height:0;overflow:auto;padding:2px 0}
.dfr-tree-row{display:flex;align-items:center;gap:4px;box-sizing:border-box;width:100%;text-align:left;background:transparent;border:0;font:inherit;font-size:12px;line-height:20px;padding:0 8px;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;min-width:0}
.dfr-tree-row:hover{background:var(--dsw-alias-interactive-bg-hover-accent)}
.dfr-tree-row-dir{font-weight:500}
.dfr-tree-row-file{color:var(--dsw-alias-label-primary)}
.dfr-tree-row-other{color:var(--dsw-alias-label-secondary);cursor:default}
.dfr-tree-row-other:hover{background:transparent}
.dfr-tree-chevron{display:flex;flex:none;align-items:center;justify-content:center;width:12px;height:12px;color:var(--dsw-alias-label-secondary);transition:transform .12s ease}
.dfr-tree-chevron-open{transform:rotate(90deg)}
.dfr-tree-chevron-spacer{display:block;width:12px;height:12px}
.dfr-tree-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
.dfr-tree-badge{flex:none;font-size:10px;line-height:14px;padding:0 5px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.dfr-status{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:2px 8px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.dfr-status-error{color:var(--dsw-alias-state-error-primary)}
.dfr-error-detail{opacity:.85}
.dfr-empty{padding:8px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.dfr-error-box{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:10px 8px;font-size:11px;line-height:16px;color:var(--dsw-alias-state-error-primary)}
.dfr-footer{flex:none;display:flex;align-items:center;gap:6px;padding:6px 8px;border-top:1px solid var(--dsw-alias-border-l1)}
.dfr-footer-count{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}
.dfr-file-body{flex:1 1 auto;min-height:0;overflow:auto;padding:2px 0 10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:20px}
.dfr-line{position:relative;display:flex;box-sizing:border-box;width:max-content;min-width:100%;white-space:pre;cursor:text}
.dfr-line:hover{background:var(--dsw-alias-interactive-bg-hover-accent)}
.dfr-line-no{position:relative;flex:none;width:46px;padding-right:8px;text-align:right;color:var(--dsw-alias-label-secondary);user-select:none}
.dfr-line-text{flex:1 0 auto;padding-right:12px;white-space:pre;color:var(--dsw-alias-label-primary)}
.dfr-line-selected,.dfr-line-selected:hover{background:var(--dsw-alias-bg-layer-2);background:var(--dfr-accent-row)}
.dfr-line-selected,.dfr-line-has-comment{box-shadow:inset 3px 0 0 var(--dfr-accent)}
.dfr-line-selected .dfr-line-text,.dfr-line-has-comment .dfr-line-text{background:var(--dfr-accent-fill);box-shadow:inset 1px 0 0 var(--dfr-accent-border),inset -1px 0 0 var(--dfr-accent-border)}
.dfr-line-selected .dfr-line-no,.dfr-line-has-comment .dfr-line-no{color:var(--dfr-accent);font-weight:600}
.dfr-line-selected.dfr-line-sel-first .dfr-line-text{box-shadow:inset 1px 0 0 var(--dfr-accent-border),inset -1px 0 0 var(--dfr-accent-border),inset 0 1px 0 var(--dfr-accent-border)}
.dfr-line-selected.dfr-line-sel-last .dfr-line-text{box-shadow:inset 1px 0 0 var(--dfr-accent-border),inset -1px 0 0 var(--dfr-accent-border),inset 0 -1px 0 var(--dfr-accent-border)}
.dfr-line-selected.dfr-line-sel-first.dfr-line-sel-last .dfr-line-text{box-shadow:inset 1px 0 0 var(--dfr-accent-border),inset -1px 0 0 var(--dfr-accent-border),inset 0 1px 0 var(--dfr-accent-border),inset 0 -1px 0 var(--dfr-accent-border)}
.dfr-tk-comment{color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));font-style:italic}
.dfr-tk-keyword{color:var(--dsw-alias-link)}
.dfr-tk-string{color:var(--dsw-alias-state-success-primary)}
.dfr-tk-number{color:var(--dsw-alias-state-warn-primary)}
.dfr-tk-func{color:var(--dsw-alias-label-primary);font-weight:600}
.dfr-tk-type{color:var(--dsw-alias-link);font-weight:600}
.dfr-tk-tag{color:var(--dsw-alias-link)}
.dfr-tk-attr{color:var(--dsw-alias-state-warn-primary)}
.dfr-tk-punct{color:var(--dsw-alias-label-secondary)}
.dfr-popover{position:sticky;left:0;box-sizing:border-box;width:auto;max-width:100%;margin:4px 6px 8px;padding:6px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-overlay);box-shadow:var(--dsw-elevation-prominent)}
.dfr-popover-label{margin-bottom:4px;font-size:11px;line-height:14px;color:var(--dsw-alias-link)}
.dfr-popover-textarea{box-sizing:border-box;display:block;width:100%;max-width:100%;min-height:54px;resize:vertical;font:inherit;font-size:12px;line-height:16px;padding:5px 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.dfr-popover-textarea:focus{outline:none;border-color:var(--dsw-alias-link)}
.dfr-popover-textarea::placeholder{color:var(--dsw-alias-label-secondary)}
.dfr-popover-hint{margin-top:4px;font-size:10px;line-height:14px;white-space:normal;overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary)}
.dfr-popover-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:6px}
.dfr-card{position:sticky;left:0;box-sizing:border-box;margin:5px 6px 7px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-left:3px solid var(--dfr-accent);border-radius:6px;background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-panel)}
.dfr-card-head{display:flex;align-items:center;gap:6px;padding:5px 7px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dfr-card-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;color:var(--dfr-accent);font-weight:600}
.dfr-card-text{padding:6px 7px;font-size:12px;line-height:17px;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-primary)}
.dfr-card-delete{padding:4px;min-width:22px;min-height:22px;border-radius:4px}
.dfr-card-delete svg{width:14px;height:14px}
.dfr-notice{flex:none;margin:4px 8px 0;padding:5px 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:var(--dsw-alias-bg-layer-2);font-size:11px;line-height:15px;color:var(--dsw-alias-label-primary)}
.dfr-notice-success{border-color:var(--dsw-alias-state-success-primary)}
.dfr-notice-error{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.dfr-file-meta{display:flex;align-items:center;gap:4px;min-width:0}
.dfr-file-meta .dfr-subtitle{flex:1 1 auto;min-width:0}
.dfr-git-added{color:var(--dsw-alias-state-success-primary)}
.dfr-git-modified{color:var(--dsw-alias-link)}
.dfr-git-deleted{color:var(--dsw-alias-state-error-primary)}
.dfr-git-conflicted{color:var(--dsw-alias-state-warn-primary)}
.dfr-tree-row.dfr-git-added .dfr-tree-name{color:var(--dsw-alias-state-success-primary)}
.dfr-tree-row.dfr-git-modified .dfr-tree-name{color:var(--dsw-alias-link)}
.dfr-tree-row.dfr-git-deleted .dfr-tree-name{color:var(--dsw-alias-state-error-primary);text-decoration:line-through}
.dfr-tree-row.dfr-git-conflicted .dfr-tree-name{color:var(--dsw-alias-state-warn-primary)}
.dfr-tree-row.dfr-git-dir-changed .dfr-tree-chevron{color:var(--dsw-alias-link)}
.dfr-git-badge{flex:none;font-size:10px;font-weight:700;line-height:14px;color:inherit}
.dfr-git-count{flex:none;font-size:10px;line-height:14px;color:var(--dsw-alias-label-secondary)}
.dfr-git-toggle{line-height:16px}
.dfr-git-toggle.is-on{color:var(--dsw-alias-link);background:var(--dsw-alias-bg-layer-2)}
.dfr-git-toggle-label{white-space:nowrap}
.dfr-git-group{flex:none;padding:4px 8px 2px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary);border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dfr-git-mark{flex:none;width:3px;border-radius:1px;align-self:stretch;margin-right:4px}
.dfr-git-mark.is-added{background:var(--dsw-alias-state-success-primary)}
.dfr-git-mark.is-modified{background:var(--dsw-alias-link)}
.dfr-git-mark.is-deleted{background:var(--dsw-alias-state-error-primary);align-self:flex-start;height:8px}
.dfr-git-mark.is-conflicted{background:var(--dsw-alias-state-warn-primary)}
.dfr-git-mark.dfr-git-spacer{background:transparent}
.dfr-search-status{padding:5px 8px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary);white-space:normal;overflow-wrap:anywhere}
.dfr-search-row{width:100%}
.dfr-search-empty{padding:8px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
@media (max-width:340px){.dfr-header{padding:5px 6px}.dfr-line-no{width:36px}.dfr-btn{padding:3px 5px}.dfr-tree-row{padding-right:6px}.dfr-popover,.dfr-card{margin-left:4px;margin-right:4px}}
`;

// UI constants for the recursive workspace search (pass 5).
const FR_SEARCH_DEBOUNCE_MS = 250;
const FR_SEARCH_MAX_DIRS = 400;
const FR_SEARCH_MAX_FILES = 4000;
const FR_SEARCH_MAX_RESULTS = 300;
const FR_SEARCH_BUDGET_MS = 4000;
const FR_SEARCH_CONCURRENCY = 4;

// ---------------------------------------------------------------------------
// Module-level persistence. The sidebar unmounts a tab body when another tab is
// shown, so per-tab browsing state (open file, comments, expansion, levels) is
// kept here and restored on the next mount.
// ---------------------------------------------------------------------------
const frTabCache = new Map();

function frCacheEntry(tabId) {
  const key = typeof tabId === 'string' && tabId ? tabId : '__fileReview';
  let entry = frTabCache.get(key);
  if (!entry || typeof entry !== 'object') {
    entry = { openPath: null, comments: [], expanded: {}, levels: {}, gitOnly: false };
    frTabCache.set(key, entry);
  }
  if (!Array.isArray(entry.comments)) entry.comments = [];
  if (!entry.expanded || typeof entry.expanded !== 'object') entry.expanded = {};
  if (!entry.levels || typeof entry.levels !== 'object') entry.levels = {};
  if (typeof entry.openPath !== 'string' || !entry.openPath) entry.openPath = null;
  if (typeof entry.gitOnly !== 'boolean') entry.gitOnly = false;
  return entry;
}

// ---------------------------------------------------------------------------
// Defensive fallbacks for optional Harness props and for core helpers. The core
// fragment is always present in a real build; these wrappers only keep the
// body from throwing (a throw would blank the plugin's sidebar seat).
// ---------------------------------------------------------------------------
function frUseNoTabInfo() {
  return { sidebar: null, panel: null, tab: null };
}

function frUseNoSessions() {
  return null;
}

function frUseNoInput() {
  return '';
}

function frTranslate(key) {
  return typeof key === 'string' ? key : '';
}

function frSelectCwd(sessionId) {
  return function frCwdSelector(state) {
    if (!state || typeof state !== 'object') return null;
    const byId = state.byId;
    if (!byId || typeof byId !== 'object') return null;
    const session = byId[sessionId];
    if (!session || typeof session !== 'object') return null;
    return typeof session.cwd === 'string' && session.cwd ? session.cwd : null;
  };
}

function frSelectDraft(state) {
  if (!state || typeof state !== 'object') return '';
  return typeof state.draft === 'string' ? state.draft : '';
}

function frSafeJoin(parent, name) {
  try {
    if (typeof frJoinPath === 'function') {
      const joined = frJoinPath(parent, name);
      if (typeof joined === 'string') return joined;
    }
  } catch (err) { /* fall through */ }
  const base = typeof parent === 'string' ? parent : '';
  const clean = base.replace(/[\\/]+$/, '');
  const segment = name === undefined || name === null ? '' : String(name);
  return clean ? clean + '/' + segment : segment;
}

function frSafeBaseName(path) {
  try {
    if (typeof frBaseName === 'function') {
      const name = frBaseName(path);
      if (typeof name === 'string') return name;
    }
  } catch (err) { /* fall through */ }
  const text = typeof path === 'string' ? path : '';
  const normalized = text.replace(/[\\/]+$/, '');
  const index = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  return index >= 0 ? normalized.slice(index + 1) : normalized;
}

function frSafeRelativePath(root, path) {
  try {
    if (typeof frRelativePath === 'function') {
      const relative = frRelativePath(root, path);
      if (typeof relative === 'string') return relative;
    }
  } catch (err) { /* fall through */ }
  if (typeof root !== 'string' || !root) return typeof path === 'string' ? path : '';
  if (typeof path !== 'string' || !path) return '';
  if (path === root) return '';
  const prefix = root.replace(/[\\/]+$/, '') + '/';
  if (path.indexOf(prefix) === 0) return path.slice(prefix.length);
  return path;
}

function frSafeLineLabel(startLine, endLine) {
  try {
    if (typeof frLineLabel === 'function') {
      const label = frLineLabel(startLine, endLine);
      if (typeof label === 'string' && label) return label;
    }
  } catch (err) { /* fall through */ }
  const start = typeof startLine === 'number' && isFinite(startLine) ? Math.floor(startLine) : 0;
  const end = typeof endLine === 'number' && isFinite(endLine) ? Math.floor(endLine) : start;
  return start === end ? 'L' + start : 'L' + start + '-L' + end;
}

function frRangeLabel(startLine, endLine, tr) {
  const first = typeof startLine === 'number' && isFinite(startLine) ? Math.floor(startLine) : 1;
  const second = typeof endLine === 'number' && isFinite(endLine) ? Math.floor(endLine) : first;
  const from = Math.max(1, Math.min(first, second));
  const to = Math.max(from, Math.max(first, second));
  const translate = typeof tr === 'function' ? tr : frTranslate;
  try {
    if (from === to) return translate('comment.line', { line: from });
    return translate('comment.range', { start: from, end: to });
  } catch (err) {
    return from === to ? 'L' + from : 'L' + from + '-L' + to;
  }
}

function frSafeCountByPath(comments) {
  try {
    if (typeof frCountByPath === 'function') {
      const counts = frCountByPath(comments);
      if (counts && typeof counts === 'object') return counts;
    }
  } catch (err) { /* fall through */ }
  const counts = {};
  if (Array.isArray(comments)) {
    comments.forEach(function (comment) {
      if (!comment || typeof comment !== 'object' || typeof comment.path !== 'string') return;
      counts[comment.path] = (counts[comment.path] || 0) + 1;
    });
  }
  return counts;
}

function frSafeMakeComment(fields) {
  try {
    if (typeof frMakeComment === 'function') {
      const comment = frMakeComment(fields);
      if (comment && typeof comment === 'object') return comment;
    }
  } catch (err) { /* fall through */ }
  return null;
}

function frSafeFormat(comments, tr) {
  try {
    if (typeof frFormatReviewMessage === 'function') {
      const message = frFormatReviewMessage(comments, tr);
      if (typeof message === 'string' && message) return message;
    }
  } catch (err) { /* fall through */ }
  const rows = [];
  if (Array.isArray(comments)) {
    comments.forEach(function (comment) {
      if (!comment || typeof comment !== 'object') return;
      const text = typeof comment.text === 'string' ? comment.text.replace(/\r/g, '') : '';
      rows.push('- ' + frSafeLineLabel(comment.startLine, comment.endLine) + ' ' + text);
    });
  }
  return rows.join('\n');
}

// ---------------------------------------------------------------------------
// Syntax highlighting (optimization pass 1). The core fragment owns language
// detection and tokenizing; these wrappers only make their absence or a total
// failure harmless — the body always falls back to plain text.
// ---------------------------------------------------------------------------
function frSafeHighlightLimit() {
  const raw = typeof FR_HL_MAX_LINES === 'number' ? FR_HL_MAX_LINES : 0;
  return raw > 0 ? Math.floor(raw) : 5000;
}

function frSafeDetectLanguage(path) {
  try {
    if (typeof frDetectLanguage === 'function') {
      const language = frDetectLanguage(path);
      if (typeof language === 'string' && language) return language;
    }
  } catch (err) { /* fall through */ }
  return 'plain';
}

function frSafeHighlightLines(lines, language) {
  try {
    if (typeof frHighlightLines === 'function' && Array.isArray(lines)) {
      const tokens = frHighlightLines(lines, language);
      if (Array.isArray(tokens) && tokens.length === lines.length) return tokens;
    }
  } catch (err) { /* fall through */ }
  return null;
}

// ---------------------------------------------------------------------------
// Git status (optimization pass 4). Core owns normalization, status mapping,
// line-run lookup and directory grouping; these wrappers keep the body safe when
// a helper is missing, returns garbage, or throws.
// ---------------------------------------------------------------------------
function frSafeDirName(path) {
  try {
    if (typeof frDirName === 'function') {
      const dir = frDirName(path);
      if (typeof dir === 'string') return dir;
    }
  } catch (err) { /* fall through */ }
  const text = typeof path === 'string' ? path : '';
  const normalized = text.replace(/[\\/]+$/, '');
  const index = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  if (index < 0) return '';
  const head = normalized.slice(0, index).replace(/[\\/]+$/, '');
  return /^[A-Za-z]:$/.test(head) ? '' : head;
}

function frSafeNormalizeGitStatus(raw) {
  try {
    if (typeof frNormalizeGitStatus === 'function') {
      const normalized = frNormalizeGitStatus(raw);
      if (normalized && typeof normalized === 'object') return normalized;
    }
  } catch (err) { /* fall through */ }
  return null;
}

const frGitStatuses = ['added', 'modified', 'deleted', 'renamed', 'conflicted'];

function frSafeGitKind(status) {
  try {
    if (typeof frGitKind === 'function') {
      const kind = frGitKind(status);
      if (typeof kind === 'string') return kind;
    }
  } catch (err) { /* fall through */ }
  if (status === 'added') return 'added';
  if (status === 'modified' || status === 'renamed') return 'modified';
  if (status === 'deleted') return 'deleted';
  if (status === 'conflicted') return 'conflicted';
  return '';
}

function frGitStatusKey(status) {
  return typeof status === 'string' && frGitStatuses.indexOf(status) >= 0 ? status : '';
}

function frGitLetter(status) {
  if (status === 'added') return 'A';
  if (status === 'modified') return 'M';
  if (status === 'deleted') return 'D';
  if (status === 'renamed') return 'R';
  if (status === 'conflicted') return 'U';
  return '';
}

function frSafeGitMarkKind(runs, lineNumber) {
  try {
    if (typeof frGitMarkKind === 'function') {
      const kind = frGitMarkKind(runs, lineNumber);
      if (typeof kind === 'string') return kind;
    }
  } catch (err) { /* fall through */ }
  if (!Array.isArray(runs)) return '';
  const line = typeof lineNumber === 'number' && isFinite(lineNumber) ? Math.floor(lineNumber) : 0;
  if (line <= 0) return '';
  for (let index = 0; index < runs.length; index++) {
    const run = runs[index];
    if (!run || typeof run !== 'object') continue;
    const start = typeof run.start === 'number' && isFinite(run.start) ? Math.floor(run.start) : 0;
    const end = typeof run.end === 'number' && isFinite(run.end) ? Math.floor(run.end) : start;
    const kind = run.kind === 'added' || run.kind === 'modified' || run.kind === 'deleted' ? run.kind : '';
    if (!kind) continue;
    if (kind === 'deleted') {
      if (line === start) return 'deleted';
      continue;
    }
    if (line >= start && line <= end) return kind;
  }
  return '';
}

function frSafeGroupChangedFiles(files) {
  try {
    if (typeof frGroupChangedFiles === 'function') {
      const groups = frGroupChangedFiles(files);
      if (Array.isArray(groups)) return groups;
    }
  } catch (err) { /* fall through */ }
  const list = Array.isArray(files) ? files : [];
  const byDir = Object.create(null);
  const groups = [];
  list.forEach(function frFallbackGroup(file) {
    if (!file || typeof file !== 'object') return;
    const path = typeof file.path === 'string' ? file.path : '';
    const slash = path.lastIndexOf('/');
    const dir = slash >= 0 ? path.slice(0, slash) : '';
    let group = byDir[dir];
    if (!group) {
      group = { dir: dir, files: [] };
      byDir[dir] = group;
      groups.push(group);
    }
    group.files.push(file);
  });
  groups.sort(function frGroupOrder(left, right) {
    if (left.dir === right.dir) return 0;
    if (left.dir === '') return -1;
    if (right.dir === '') return 1;
    return left.dir.localeCompare(right.dir);
  });
  groups.forEach(function frSortGroupFiles(group) {
    group.files.sort(function frFileOrder(left, right) {
      return String(left && left.path ? left.path : '').localeCompare(String(right && right.path ? right.path : ''));
    });
  });
  return groups;
}

// ---------------------------------------------------------------------------
// Recursive workspace search (pass 5/6). Core owns normalization, scoring and
// grouping; these wrappers stay safe if a helper is missing or throws.
// ---------------------------------------------------------------------------
function frSafeSearchNormalize(query) {
  try {
    if (typeof frSearchNormalize === 'function') {
      const normalized = frSearchNormalize(query);
      if (typeof normalized === 'string') return normalized;
    }
  } catch (err) { /* fall through */ }
  return typeof query === 'string' ? query.trim().toLowerCase() : '';
}

function frSafeSearchSkipDir(name) {
  try {
    if (typeof frSearchSkipDir === 'function') {
      const skip = frSearchSkipDir(name);
      if (typeof skip === 'boolean') return skip;
    }
  } catch (err) { /* fall through */ }
  const lower = typeof name === 'string' ? name.toLowerCase() : '';
  return lower === 'node_modules' || lower === '.git' || lower === '.svn' || lower === '.hg';
}

// Fuzzy match score (pass 6). A missing or throwing core helper degrades safely
// to 0 ("no match"), exactly like a non-matching path.
function frSafeSearchScore(relPath, query) {
  try {
    if (typeof frSearchScore === 'function') {
      const score = frSearchScore(relPath, query);
      if (typeof score === 'number' && isFinite(score)) return score > 0 ? score : 0;
    }
  } catch (err) { /* fall through */ }
  return 0;
}

// Score descending, then path (the contract's ranking for both the result list
// and the order inside each directory group).
function frSortSearchResults(results) {
  const list = Array.isArray(results) ? results.slice() : [];
  list.sort(function frSearchScoreOrder(left, right) {
    const leftScore = left && typeof left.score === 'number' && isFinite(left.score) ? left.score : 0;
    const rightScore = right && typeof right.score === 'number' && isFinite(right.score) ? right.score : 0;
    if (leftScore !== rightScore) return rightScore - leftScore;
    return String(left && typeof left.path === 'string' ? left.path : '')
      .localeCompare(String(right && typeof right.path === 'string' ? right.path : ''));
  });
  return list;
}

// Sort, then enforce the result cap; reports whether the cap cut the set.
function frRankSearchResults(results) {
  const sorted = frSortSearchResults(results);
  const limit = FR_SEARCH_MAX_RESULTS;
  return {
    results: sorted.length > limit ? sorted.slice(0, limit) : sorted,
    truncated: sorted.length > limit,
  };
}

function frSafeGroupSearchResults(results) {
  try {
    if (typeof frGroupSearchResults === 'function') {
      const groups = frGroupSearchResults(results);
      if (Array.isArray(groups)) return groups;
    }
  } catch (err) { /* fall through */ }
  const list = Array.isArray(results) ? results : [];
  const byDir = Object.create(null);
  const groups = [];
  list.forEach(function frFallbackSearchGroup(result) {
    if (!result || typeof result !== 'object') return;
    const path = typeof result.path === 'string' ? result.path : '';
    const slash = path.lastIndexOf('/');
    const dir = slash >= 0 ? path.slice(0, slash) : '';
    let group = byDir[dir];
    if (!group) {
      group = { dir: dir, files: [] };
      byDir[dir] = group;
      groups.push(group);
    }
    group.files.push(result);
  });
  groups.sort(function frSearchGroupOrder(left, right) {
    if (left.dir === right.dir) return 0;
    if (left.dir === '') return -1;
    if (right.dir === '') return 1;
    return left.dir.localeCompare(right.dir);
  });
  groups.forEach(function frSortSearchGroupFiles(group) {
    group.files = frSortSearchResults(group.files);
  });
  return groups;
}

const frErrorKeys = {
  'workspace-file/not-found': 'error.notFound',
  'workspace-file/outside-workspace': 'error.outside',
  'workspace-file/not-directory': 'error.notDirectory',
};

function frErrorDetail(error, tr) {
  if (!error || typeof error !== 'object' || typeof tr !== 'function') return '';
  const code = typeof error.code === 'string' ? error.code : '';
  if (!code || !Object.prototype.hasOwnProperty.call(frErrorKeys, code)) return '';
  try {
    const text = tr(frErrorKeys[code]);
    return typeof text === 'string' && text !== frErrorKeys[code] ? text : '';
  } catch (err) {
    return '';
  }
}

function frEntryOrder(left, right) {
  const leftDirectory = left && left.type === 'directory' ? 0 : 1;
  const rightDirectory = right && right.type === 'directory' ? 0 : 1;
  if (leftDirectory !== rightDirectory) return leftDirectory - rightDirectory;
  const leftName = left && typeof left.name === 'string' ? left.name : '';
  const rightName = right && typeof right.name === 'string' ? right.name : '';
  const leftLower = leftName.toLowerCase();
  const rightLower = rightName.toLowerCase();
  if (leftLower < rightLower) return -1;
  if (leftLower > rightLower) return 1;
  if (leftName < rightName) return -1;
  if (leftName > rightName) return 1;
  return 0;
}

// Flatten the loaded/expanded part of the tree into render rows. Missing levels
// become loading rows so that root and newly expanded directories always show
// a state instead of silently nothing.
function frBuildTreeRows(root, expanded, levels) {
  const rows = [];
  if (typeof root !== 'string' || !root || !levels || typeof levels !== 'object') return rows;
  const visited = {};
  function walk(dirPath, depth) {
    if (!dirPath || visited[dirPath] || depth > 32) return;
    visited[dirPath] = true;
    const level = levels[dirPath];
    if (!level || level.status === 'loading' || level.status === 'pending') {
      rows.push({ kind: 'status', status: 'loading', depth: depth, path: dirPath });
      return;
    }
    if (level.status === 'error') {
      rows.push({ kind: 'status', status: 'error', depth: depth, path: dirPath, error: level.error });
      return;
    }
    const entries = Array.isArray(level.entries) ? level.entries.slice() : [];
    entries.sort(frEntryOrder);
    if (!entries.length) rows.push({ kind: 'status', status: 'empty', depth: depth, path: dirPath });
    entries.forEach(function (entry) {
      if (!entry || typeof entry !== 'object' || typeof entry.name !== 'string' || !entry.name) return;
      const entryPath = frSafeJoin(dirPath, entry.name);
      const type = entry.type === 'directory' || entry.type === 'file' ? entry.type : 'other';
      rows.push({
        kind: 'entry',
        type: type,
        name: entry.name,
        depth: depth,
        path: entryPath,
        relPath: frSafeRelativePath(root, entryPath),
      });
      if (type === 'directory' && expanded && expanded[entryPath]) walk(entryPath, depth + 1);
    });
    if (level.truncated) rows.push({ kind: 'status', status: 'truncated', depth: depth, path: dirPath });
  }
  walk(root, 0);
  return rows;
}

function frLinkSignal(tabSignal, controller) {
  if (!controller || !tabSignal || typeof tabSignal.addEventListener !== 'function') {
    return function frNoUnlink() {};
  }
  if (tabSignal.aborted) {
    try { controller.abort(); } catch (err) { /* ignore */ }
    return function frNoUnlink() {};
  }
  function onAbort() {
    try { controller.abort(); } catch (err) { /* ignore */ }
  }
  try {
    tabSignal.addEventListener('abort', onAbort, { once: true });
  } catch (err) {
    return function frNoUnlink() {};
  }
  return function frUnlink() {
    try { tabSignal.removeEventListener('abort', onAbort); } catch (err) { /* ignore */ }
  };
}

function frCopyText(text) {
  return new Promise(function (resolve) {
    let pending = null;
    try {
      if (typeof navigator === 'undefined' || !navigator || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        resolve(false);
        return;
      }
      pending = navigator.clipboard.writeText(String(text === undefined || text === null ? '' : text));
    } catch (err) {
      resolve(false);
      return;
    }
    if (!pending || typeof pending.then !== 'function') {
      resolve(false);
      return;
    }
    pending.then(function () { resolve(true); }, function () { resolve(false); });
  });
}

function frClosestLineRow(target) {
  let node = target;
  if (!node) return null;
  if (node.nodeType !== 1) node = node.parentElement || null;
  while (node && node.nodeType === 1) {
    if (typeof node.getAttribute === 'function' && node.getAttribute('data-line') !== null) return node;
    node = node.parentElement;
  }
  return null;
}

function frLineNumberOfRow(row) {
  if (!row || typeof row.getAttribute !== 'function') return 0;
  const value = parseInt(row.getAttribute('data-line'), 10);
  if (!isFinite(value) || value <= 0) return 0;
  return value;
}

// ---------------------------------------------------------------------------
// Small presentational helpers (inline SVG icons; no external assets).
// ---------------------------------------------------------------------------
const frIconPaths = {
  chevron: 'M6 4l4 4-4 4',
  refresh: 'M13 8a5 5 0 1 1-2-4.6 M13.5 2.6v3h-3',
  back: 'M10 3.5L5.5 8l4.5 4.5',
  send: 'M2.8 8L14 2.8 8.6 14l-1.7-4.6z',
  trash: 'M3.5 4.5h9 M6.2 4.5V2.8h3.6v1.7 M4.6 4.5l.6 8h4.6l.6-8',
};

function frIcon(name, size) {
  const dimension = typeof size === 'number' && size > 0 ? size : 14;
  const path = Object.prototype.hasOwnProperty.call(frIconPaths, name) ? frIconPaths[name] : '';
  return h('svg', {
    className: 'dfr-icon',
    viewBox: '0 0 16 16',
    width: dimension,
    height: dimension,
    'aria-hidden': 'true',
    focusable: 'false',
  }, h('path', {
    d: path,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }));
}

function frIconButton(label, name, onClick, options) {
  const settings = options && typeof options === 'object' ? options : {};
  return h('button', {
    type: 'button',
    className: 'dfr-btn dfr-btn-ghost dfr-icon-btn' + (settings.className ? ' ' + settings.className : ''),
    title: label,
    'aria-label': label,
    disabled: settings.disabled === true,
    onClick: typeof onClick === 'function' ? onClick : undefined,
  }, frIcon(name, settings.size));
}

// Render one highlighted line. `plainText` is the exact source line and the
// fallback: the helper never returns anything that would not concatenate back to
// it (tokens from core are validated against the raw line).
function frRenderTokens(tokens, plainText) {
  const text = typeof plainText === 'string' ? plainText : '';
  if (!text) return ' ';
  if (!Array.isArray(tokens) || !tokens.length) return text;
  const nodes = [];
  let joined = '';
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (!token || typeof token !== 'object') return text;
    const value = typeof token.v === 'string' ? token.v : '';
    const kind = typeof token.k === 'string' && token.k ? token.k : 'plain';
    joined += value;
    if (!value) continue;
    if (kind === 'plain') nodes.push(value);
    else nodes.push(h('span', { className: 'dfr-tk-' + kind, key: index }, value));
  }
  if (joined !== text) return text;
  return nodes.length ? nodes : text;
}

function frCommentCard(props) {
  const settings = props && typeof props === 'object' ? props : {};
  const comment = settings.comment && typeof settings.comment === 'object' ? settings.comment : null;
  if (!comment) return null;
  const tr = typeof settings.tr === 'function' ? settings.tr : frTranslate;
  const onDelete = typeof settings.onDelete === 'function' ? settings.onDelete : null;
  const start = typeof comment.startLine === 'number' && isFinite(comment.startLine) ? Math.floor(comment.startLine) : 1;
  const end = typeof comment.endLine === 'number' && isFinite(comment.endLine) ? Math.floor(comment.endLine) : start;
  const from = Math.max(1, Math.min(start, end));
  const to = Math.max(from, Math.max(start, end));
  const labelText = frSafeLineLabel(from, to);
  const vars = {
    line: from,
    lineNumber: from,
    start: from,
    end: to,
    startLine: from,
    endLine: to,
    label: labelText,
    lines: labelText,
    count: to - from + 1,
  };
  const label = from === to ? tr('comment.line', vars) : tr('comment.range', vars);
  const commentId = typeof comment.id === 'string' ? comment.id : '';
  const text = typeof comment.text === 'string'
    ? comment.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    : '';
  return h('div', { className: 'dfr-card', 'data-comment-id': commentId },
    h('div', { className: 'dfr-card-head' },
      h('span', { className: 'dfr-card-label', title: labelText }, label),
      h('button', {
        type: 'button',
        className: 'dfr-btn dfr-btn-ghost dfr-icon-btn dfr-danger dfr-card-delete',
        title: tr('comment.delete'),
        'aria-label': tr('comment.delete'),
        onClick: function frDeleteClick() {
          if (onDelete && commentId) onDelete(commentId);
        },
      }, frIcon('trash', 14))
    ),
    h('div', { className: 'dfr-card-text' }, text)
  );
}

function frCommentPopover(props) {
  const settings = props && typeof props === 'object' ? props : {};
  const tr = typeof settings.tr === 'function' ? settings.tr : frTranslate;
  const onAdd = typeof settings.onAdd === 'function' ? settings.onAdd : null;
  const onCancel = typeof settings.onCancel === 'function' ? settings.onCancel : null;
  const onSend = typeof settings.onSend === 'function' ? settings.onSend : null;
  const startLine = typeof settings.startLine === 'number' && isFinite(settings.startLine) ? Math.floor(settings.startLine) : 1;
  const endLine = typeof settings.endLine === 'number' && isFinite(settings.endLine) ? Math.floor(settings.endLine) : startLine;
  const [text, setText] = React.useState('');
  const textRef = React.useRef(null);

  React.useEffect(function frFocusPopover() {
    const node = textRef.current;
    if (!node || typeof node.focus !== 'function') return;
    try { node.focus(); } catch (err) { /* ignore */ }
  }, []);

  function frCancel() {
    if (!onCancel) return;
    try { onCancel(); } catch (err) { /* ignore */ }
  }

  function frCommit() {
    const value = typeof text === 'string' ? text : '';
    if (!value.trim() || !onAdd) return null;
    try { return onAdd(startLine, endLine, value); } catch (err) { return null; }
  }

  function frSubmitAll() {
    if (!onSend) return;
    try { onSend(); } catch (err) { /* ignore */ }
  }

  function frHandleKeyDown(event) {
    if (!event || typeof event !== 'object') return;
    // Never treat the Enter that confirms an IME composition as "add comment".
    if (event.isComposing === true || event.keyCode === 229) return;
    if (event.nativeEvent && event.nativeEvent.isComposing === true) return;
    const key = event.key;
    if (key === 'Escape') {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      frCancel();
      return;
    }
    if (key !== 'Enter') return;
    if (event.ctrlKey || event.metaKey) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      frCommit();
      frCancel();
      frSubmitAll();
      return;
    }
    if (event.shiftKey || event.altKey) return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    const created = frCommit();
    if (created) frCancel();
  }

  function frHandleAddClick() {
    const created = frCommit();
    if (created) frCancel();
  }

  const canAdd = typeof text === 'string' && text.trim().length > 0;
  return h('div', { className: 'dfr-popover' },
    h('div', { className: 'dfr-popover-label' }, frRangeLabel(startLine, endLine, tr)),
    h('textarea', {
      ref: textRef,
      className: 'dfr-popover-textarea',
      value: text,
      rows: 3,
      spellCheck: false,
      placeholder: tr('comment.placeholder'),
      'aria-label': tr('comment.placeholder'),
      onChange: function frTextChange(event) {
        setText(event && event.target ? String(event.target.value) : '');
      },
      onKeyDown: frHandleKeyDown,
    }),
    h('div', { className: 'dfr-popover-hint' }, tr('comment.enterHint')),
    h('div', { className: 'dfr-popover-actions' },
      h('button', { type: 'button', className: 'dfr-btn dfr-btn-ghost', onClick: frCancel }, tr('comment.cancel')),
      h('button', { type: 'button', className: 'dfr-btn dfr-btn-primary', disabled: !canAdd, onClick: frHandleAddClick }, tr('comment.add'))
    )
  );
}

// ---------------------------------------------------------------------------
// The body factory. `api` is the only data access:
//   api.list(sessionId, absolutePath, signal) -> RemoteResult<{entries,truncated}>
//   api.read(sessionId, path, offset, signal) -> RemoteResult<{text,lines,eof,version}>
// ---------------------------------------------------------------------------
function frCreateBody(api) {
  const apiList = api && typeof api.list === 'function' ? api.list : null;
  const apiRead = api && typeof api.read === 'function' ? api.read : null;

  function FileReviewBody(props) {
    const safeProps = props && typeof props === 'object' ? props : {};
    const sessionId = typeof safeProps.sessionId === 'string' ? safeProps.sessionId : '';
    const tr = typeof safeProps.t === 'function' ? safeProps.t : frTranslate;
    const inputActions = safeProps.inputActions && typeof safeProps.inputActions === 'object' ? safeProps.inputActions : null;

    // Optional Harness props: never call them conditionally, fall back instead.
    const useTabInfoFn = typeof safeProps.useTabInfo === 'function' ? safeProps.useTabInfo : frUseNoTabInfo;
    const useSessionsFn = typeof safeProps.useSessions === 'function' ? safeProps.useSessions : frUseNoSessions;
    const useInputFn = typeof safeProps.useInput === 'function' ? safeProps.useInput : frUseNoInput;

    const tabInfo = useTabInfoFn();
    const tab = tabInfo && typeof tabInfo === 'object' && tabInfo.tab && typeof tabInfo.tab === 'object' ? tabInfo.tab : null;
    const tabSignal = tab && tab.signal ? tab.signal : null;
    const tabKey = tab && typeof tab.id === 'string' && tab.id
      ? tab.id
      : (sessionId ? 'session:' + sessionId : 'file-review');
    const cwdValue = useSessionsFn(frSelectCwd(sessionId));
    const cwd = typeof cwdValue === 'string' && cwdValue ? cwdValue : null;
    const draftValue = useInputFn(frSelectDraft);
    const draft = typeof draftValue === 'string' ? draftValue : '';

    const initialState = frCacheEntry(tabKey);

    const [openPath, setOpenPathState] = React.useState(function frInitOpenPath() {
      return typeof initialState.openPath === 'string' && initialState.openPath ? initialState.openPath : null;
    });
    const [comments, setCommentsState] = React.useState(function frInitComments() {
      return Array.isArray(initialState.comments) ? initialState.comments.slice() : [];
    });
    const [expanded, setExpanded] = React.useState(function frInitExpanded() {
      return Object.assign({}, initialState.expanded);
    });
    const [levels, setLevels] = React.useState(function frInitLevels() {
      return Object.assign({}, initialState.levels);
    });
    const [filter, setFilter] = React.useState('');
    const [fileState, setFileState] = React.useState({ status: 'idle', lines: [], error: null, truncated: false });
    const [selection, setSelection] = React.useState(null);
    const [popover, setPopover] = React.useState(null);
    const [notice, setNotice] = React.useState(null);
    const [reloadNonce, setReloadNonce] = React.useState(0);
    const [gitStatus, setGitStatus] = React.useState(null);
    const [gitOnly, setGitOnly] = React.useState(function frInitGitOnly() {
      return initialState.gitOnly === true;
    });
    const [searchState, setSearchState] = React.useState({
      status: 'idle',
      query: '',
      results: [],
      dirs: 0,
      truncated: false,
    });

    const mountedRef = React.useRef(true);
    const commentsRef = React.useRef(comments);
    const levelsRef = React.useRef(levels);
    const fileLinesRef = React.useRef([]);
    const noticeTimerRef = React.useRef(null);
    const submitTimerRef = React.useRef(null);
    const fileControllerRef = React.useRef(null);
    const treeControllersRef = React.useRef([]);
    const dragRef = React.useRef(null);
    const openPopoverRef = React.useRef(null);
    const sendAllRef = React.useRef(null);
    const fileBodyRef = React.useRef(null);

    const setComments = React.useCallback(function frSetComments(next) {
      const value = Array.isArray(next) ? next : [];
      commentsRef.current = value;
      setCommentsState(value);
    }, []);

    const setOpenPath = React.useCallback(function frSetOpenPath(nextPath) {
      const value = typeof nextPath === 'string' && nextPath ? nextPath : null;
      setPopover(null);
      dragRef.current = null;
      setSelection(null);
      setFileState({ status: value ? 'loading' : 'idle', lines: [], error: null, truncated: false });
      setOpenPathState(value);
    }, []);

    const showNotice = React.useCallback(function frShowNotice(key, vars) {
      if (typeof key !== 'string' || !key) return;
      setNotice({ key: key, vars: vars && typeof vars === 'object' ? vars : null });
      if (noticeTimerRef.current !== null) {
        try { clearTimeout(noticeTimerRef.current); } catch (err) { /* ignore */ }
        noticeTimerRef.current = null;
      }
      try {
        noticeTimerRef.current = setTimeout(function frHideNotice() {
          noticeTimerRef.current = null;
          if (!mountedRef.current) return;
          setNotice(null);
        }, 3000);
      } catch (err) {
        noticeTimerRef.current = null;
      }
    }, []);

    // Load one directory level; keeps the previous entries visible while it runs.
    const ensureLevel = React.useCallback(function frEnsureLevel(absPath) {
      if (!apiList || typeof absPath !== 'string' || !absPath) return;
      const current = levelsRef.current ? levelsRef.current[absPath] : null;
      if (current && (current.status === 'loading' || current.status === 'ready' || current.status === 'error')) return;
      let controller = null;
      try {
        controller = new AbortController();
      } catch (err) {
        controller = null;
      }
      if (!controller) return;
      treeControllersRef.current.push(controller);
      const unlink = frLinkSignal(tabSignal, controller);
      const previousEntries = current && Array.isArray(current.entries) ? current.entries : [];
      const wasTruncated = !!(current && current.truncated);
      setLevels(function frLevelLoading(prev) {
        const next = Object.assign({}, prev);
        next[absPath] = { status: 'loading', entries: previousEntries, truncated: wasTruncated };
        return next;
      });
      function frFinishRequest() {
        const held = treeControllersRef.current;
        const index = held.indexOf(controller);
        if (index >= 0) held.splice(index, 1);
        unlink();
      }
      function frApplyLevelError(error) {
        if (!mountedRef.current || controller.signal.aborted) return;
        setLevels(function frLevelError(prev) {
          const next = Object.assign({}, prev);
          next[absPath] = {
            status: 'error',
            entries: [],
            truncated: false,
            error: error && typeof error === 'object' ? error : { code: '', message: '' },
          };
          return next;
        });
      }
      let request = null;
      try {
        request = apiList(sessionId, absPath, controller.signal);
      } catch (err) {
        frFinishRequest();
        frApplyLevelError({ code: '', message: String(err && err.message ? err.message : err) });
        return;
      }
      try {
        Promise.resolve(request).then(function frLevelSettled(result) {
          frFinishRequest();
          if (!mountedRef.current || controller.signal.aborted) return;
          if (!result || result.ok !== true) {
            frApplyLevelError(result ? result.error : null);
            return;
          }
          const value = result.value && typeof result.value === 'object' ? result.value : {};
          const entries = Array.isArray(value.entries) ? value.entries : [];
          setLevels(function frLevelReady(prev) {
            const next = Object.assign({}, prev);
            next[absPath] = { status: 'ready', entries: entries, truncated: value.truncated === true };
            return next;
          });
        }, function frLevelFailed(error) {
          frFinishRequest();
          frApplyLevelError({ code: '', message: String(error && error.message ? error.message : error) });
        });
      } catch (err) {
        frFinishRequest();
        frApplyLevelError(null);
      }
    }, [apiList, sessionId, tabSignal]);

    const toggleDir = React.useCallback(function frToggleDir(dirPath) {
      if (typeof dirPath !== 'string' || !dirPath) return;
      setExpanded(function frToggleExpanded(prev) {
        const next = Object.assign({}, prev);
        if (next[dirPath]) delete next[dirPath];
        else next[dirPath] = true;
        return next;
      });
    }, []);

    const retryLevel = React.useCallback(function frRetryLevel(dirPath) {
      if (typeof dirPath !== 'string' || !dirPath) return;
      setLevels(function frDropLevel(prev) {
        const next = Object.assign({}, prev);
        delete next[dirPath];
        return next;
      });
    }, []);

    const refreshTree = React.useCallback(function frRefreshTree() {
      const held = treeControllersRef.current;
      for (let index = 0; index < held.length; index++) {
        try { held[index].abort(); } catch (err) { /* ignore */ }
      }
      treeControllersRef.current = [];
      setLevels({});
    }, []);

    const openFile = React.useCallback(function frOpenFile(filePath) {
      if (typeof filePath !== 'string' || !filePath) return;
      setOpenPath(filePath);
    }, [setOpenPath]);

    const backToTree = React.useCallback(function frBackToTree() {
      setOpenPath(null);
    }, [setOpenPath]);

    const reloadFile = React.useCallback(function frReloadFile() {
      dragRef.current = null;
      setSelection(null);
      setPopover(null);
      setReloadNonce(function frNextReload(prev) { return prev + 1; });
    }, []);

    const openPopoverFor = React.useCallback(function frOpenPopoverFor(startLine, endLine) {
      const first = typeof startLine === 'number' && isFinite(startLine) ? Math.floor(startLine) : 1;
      const second = typeof endLine === 'number' && isFinite(endLine) ? Math.floor(endLine) : first;
      const from = Math.max(1, Math.min(first, second));
      const to = Math.max(from, Math.max(first, second));
      setPopover({ startLine: from, endLine: to, anchorLine: to });
    }, []);

    React.useEffect(function frSyncOpenPopover() {
      openPopoverRef.current = openPopoverFor;
    }, [openPopoverFor]);

    const closePopover = React.useCallback(function frClosePopover() {
      setPopover(null);
    }, []);

    const addComment = React.useCallback(function frAddComment(startLine, endLine, text) {
      if (!openPath) return null;
      const raw = typeof text === 'string' ? text.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : '';
      const trimmed = raw.replace(/^\s+/, '').replace(/\s+$/, '');
      if (!trimmed) return null;
      const from = typeof startLine === 'number' && isFinite(startLine) ? Math.max(1, Math.floor(startLine)) : 1;
      const rawEnd = typeof endLine === 'number' && isFinite(endLine) ? Math.max(from, Math.floor(endLine)) : from;
      const to = Math.max(from, rawEnd);
      const quoteLimit = typeof FR_QUOTE_LINES === 'number' && FR_QUOTE_LINES > 0 ? Math.floor(FR_QUOTE_LINES) : 3;
      const lines = Array.isArray(fileLinesRef.current) ? fileLinesRef.current : [];
      const quote = [];
      for (let lineNumber = from; lineNumber <= to && quote.length < quoteLimit; lineNumber++) {
        const index = lineNumber - 1;
        if (index >= 0 && index < lines.length) quote.push(String(lines[index]));
      }
      const built = frSafeMakeComment({
        path: openPath,
        startLine: from,
        endLine: to,
        quote: quote.slice(),
        text: trimmed,
      });
      const candidate = built && typeof built === 'object' ? built : {};
      const quoteValue = Array.isArray(candidate.quote) ? candidate.quote.slice() : quote.slice();
      const comment = {
        id: typeof candidate.id === 'string' && candidate.id
          ? candidate.id
          : ('c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)),
        path: typeof candidate.path === 'string' && candidate.path ? candidate.path : openPath,
        startLine: typeof candidate.startLine === 'number' ? candidate.startLine : from,
        endLine: typeof candidate.endLine === 'number' ? candidate.endLine : to,
        quote: quoteValue,
        createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : Date.now(),
        text: typeof candidate.text === 'string' ? candidate.text : trimmed,
      };
      const current = Array.isArray(commentsRef.current) ? commentsRef.current : [];
      setComments(current.concat([comment]));
      return comment;
    }, [openPath, setComments]);

    const deleteComment = React.useCallback(function frDeleteComment(commentId) {
      if (typeof commentId !== 'string' || !commentId) return;
      const current = Array.isArray(commentsRef.current) ? commentsRef.current : [];
      setComments(current.filter(function frKeepComment(comment) {
        return comment && comment.id !== commentId;
      }));
    }, [setComments]);

    const sendAll = React.useCallback(function frSendAll() {
      const current = Array.isArray(commentsRef.current) ? commentsRef.current.slice() : [];
      if (!current.length) {
        showNotice('send.none');
        return;
      }
      const block = frSafeFormat(current, tr);
      if (!block) {
        showNotice('send.failed');
        return;
      }
      const count = current.length;
      const actions = inputActions;
      const canCompose = !!(actions && typeof actions.setDraft === 'function' && typeof actions.submit === 'function');
      if (canCompose) {
        const existing = typeof draft === 'string' ? draft : '';
        const composed = existing ? existing + '\n\n' + block : block;
        let wrote = false;
        try {
          actions.setDraft(composed);
          wrote = true;
        } catch (err) {
          wrote = false;
        }
        if (wrote) {
          setComments([]);
          showNotice('send.done', { count: count });
          if (submitTimerRef.current !== null) {
            try { clearTimeout(submitTimerRef.current); } catch (err) { /* ignore */ }
            submitTimerRef.current = null;
          }
          try {
            submitTimerRef.current = setTimeout(function frSubmitComposer() {
              submitTimerRef.current = null;
              try {
                if (typeof actions.submit === 'function') actions.submit();
              } catch (err) { /* ignore */ }
            }, 60);
          } catch (err) {
            submitTimerRef.current = null;
          }
          return;
        }
      }
      frCopyText(block).then(function frCopySettled(copied) {
        if (!mountedRef.current) return;
        if (copied) {
          setComments([]);
          showNotice('send.copied', { count: count });
        } else {
          showNotice('send.failed');
        }
      }, function frCopyFailed() {
        if (mountedRef.current) showNotice('send.failed');
      });
    }, [draft, inputActions, showNotice, setComments, tr]);

    React.useEffect(function frSyncSendAll() {
      sendAllRef.current = sendAll;
    }, [sendAll]);

    const handleSend = React.useCallback(function frHandleSend() {
      if (sendAllRef.current) sendAllRef.current();
    }, []);

    const handleRowMouseDown = React.useCallback(function frRowMouseDown(event) {
      if (!event || typeof event !== 'object') return;
      if (typeof event.button === 'number' && event.button !== 0) return;
      const row = frClosestLineRow(event.target);
      if (!row) return;
      const lineNumber = frLineNumberOfRow(row);
      if (!lineNumber) return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      dragRef.current = { anchor: lineNumber, current: lineNumber, moved: false };
      setSelection({ start: lineNumber, end: lineNumber });
    }, []);

    const handleBodyMouseMove = React.useCallback(function frBodyMouseMove(event) {
      const drag = dragRef.current;
      if (!drag || !event) return;
      const row = frClosestLineRow(event.target);
      if (!row) return;
      const lineNumber = frLineNumberOfRow(row);
      if (!lineNumber || lineNumber === drag.current) return;
      drag.current = lineNumber;
      drag.moved = true;
      setSelection({
        start: Math.min(drag.anchor, lineNumber),
        end: Math.max(drag.anchor, lineNumber),
      });
    }, []);

    const handleRowDoubleClick = React.useCallback(function frRowDoubleClick(event) {
      if (!event) return;
      const row = frClosestLineRow(event.target);
      if (!row) return;
      const lineNumber = frLineNumberOfRow(row);
      if (!lineNumber) return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      dragRef.current = null;
      setSelection(null);
      openPopoverFor(lineNumber, lineNumber);
    }, [openPopoverFor]);

    // ---- effects -----------------------------------------------------------

    React.useEffect(function frMountLifecycle() {
      mountedRef.current = true;
      return function frUnmountCleanup() {
        mountedRef.current = false;
        if (noticeTimerRef.current !== null) {
          try { clearTimeout(noticeTimerRef.current); } catch (err) { /* ignore */ }
          noticeTimerRef.current = null;
        }
        if (submitTimerRef.current !== null) {
          try { clearTimeout(submitTimerRef.current); } catch (err) { /* ignore */ }
          submitTimerRef.current = null;
        }
        if (fileControllerRef.current) {
          try { fileControllerRef.current.abort(); } catch (err) { /* ignore */ }
          fileControllerRef.current = null;
        }
        const held = treeControllersRef.current;
        for (let index = 0; index < held.length; index++) {
          try { held[index].abort(); } catch (err) { /* ignore */ }
        }
        treeControllersRef.current = [];
        dragRef.current = null;
      };
    }, []);

    React.useEffect(function frSyncCommentsRef() {
      commentsRef.current = comments;
    }, [comments]);

    React.useEffect(function frSyncLevelsRef() {
      levelsRef.current = levels;
    }, [levels]);

    React.useEffect(function frSyncFileLinesRef() {
      fileLinesRef.current = Array.isArray(fileState.lines) ? fileState.lines : [];
    }, [fileState]);

    React.useEffect(function frPersistTabState() {
      const entry = frCacheEntry(tabKey);
      entry.openPath = openPath;
      entry.comments = comments;
      entry.expanded = expanded;
      entry.gitOnly = gitOnly;
      const persisted = {};
      Object.keys(levels || {}).forEach(function frPersistLevel(key) {
        const value = levels[key];
        if (value && value.status === 'loading') {
          persisted[key] = {
            status: 'pending',
            entries: Array.isArray(value.entries) ? value.entries : [],
            truncated: value.truncated === true,
          };
        } else {
          persisted[key] = value;
        }
      });
      entry.levels = persisted;
    }, [tabKey, openPath, comments, expanded, levels, gitOnly]);

    React.useEffect(function frDragMouseUp() {
      if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return undefined;
      function frMouseUp() {
        const drag = dragRef.current;
        if (!drag) return;
        dragRef.current = null;
        setSelection(null);
        if (drag.moved && drag.anchor !== drag.current) {
          const from = Math.min(drag.anchor, drag.current);
          const to = Math.max(drag.anchor, drag.current);
          if (openPopoverRef.current) openPopoverRef.current(from, to);
        }
      }
      window.addEventListener('mouseup', frMouseUp);
      return function frRemoveMouseUp() {
        try { window.removeEventListener('mouseup', frMouseUp); } catch (err) { /* ignore */ }
      };
    }, []);

    // Ensure the root and every expanded directory that has no level gets one.
    React.useEffect(function frLoadExpandedLevels() {
      if (!apiList || !cwd) return;
      const visited = {};
      function walk(dirPath, depth) {
        if (!dirPath || visited[dirPath] || depth > 32) return;
        visited[dirPath] = true;
        const level = levels[dirPath];
        if (!level || level.status === 'pending') {
          ensureLevel(dirPath);
          return;
        }
        if (level.status !== 'ready') return;
        const entries = Array.isArray(level.entries) ? level.entries : [];
        entries.forEach(function frWalkEntry(entry) {
          if (!entry || typeof entry !== 'object' || entry.type !== 'directory') return;
          if (typeof entry.name !== 'string' || !entry.name) return;
          const childPath = frSafeJoin(dirPath, entry.name);
          if (expanded && expanded[childPath]) walk(childPath, depth + 1);
        });
      }
      walk(cwd, 0);
    }, [levels, expanded, cwd, apiList, ensureLevel]);

    // Paged read of the open file: loop until eof / FR_MAX_LINES; abortable.
    React.useEffect(function frLoadFile() {
      if (!openPath) {
        setFileState({ status: 'idle', lines: [], error: null, truncated: false });
        return undefined;
      }
      if (!apiRead) {
        setFileState({ status: 'error', lines: [], error: { code: '', message: '' }, truncated: false });
        return undefined;
      }
      let controller = null;
      try {
        controller = new AbortController();
      } catch (err) {
        controller = null;
      }
      if (!controller) {
        setFileState({ status: 'error', lines: [], error: { code: '', message: '' }, truncated: false });
        return undefined;
      }
      fileControllerRef.current = controller;
      const unlink = frLinkSignal(tabSignal, controller);
      setFileState({ status: 'loading', lines: [], error: null, truncated: false });
      const maxLines = typeof FR_MAX_LINES === 'number' && FR_MAX_LINES > 0 ? Math.floor(FR_MAX_LINES) : 20000;
      let stopped = false;

      function frReleaseFile() {
        unlink();
        if (fileControllerRef.current === controller) fileControllerRef.current = null;
      }

      function frFailFile(error) {
        if (stopped || !mountedRef.current || controller.signal.aborted) return;
        setFileState({
          status: 'error',
          lines: [],
          error: error && typeof error === 'object' ? error : { code: '', message: '' },
          truncated: false,
        });
      }

      async function frReadPages() {
        const collected = [];
        let offset = 1;
        let truncated = false;
        let eof = false;
        let pageCount = 0;
        while (!controller.signal.aborted) {
          pageCount++;
          if (pageCount > 400) {
            truncated = true;
            break;
          }
          let result = null;
          try {
            result = await apiRead(sessionId, openPath, offset, controller.signal);
          } catch (error) {
            frFailFile({ code: '', message: String(error && error.message ? error.message : error) });
            return;
          }
          if (stopped || !mountedRef.current || controller.signal.aborted) return;
          if (!result || result.ok !== true) {
            frFailFile(result ? result.error : null);
            return;
          }
          const value = result.value && typeof result.value === 'object' ? result.value : {};
          const text = typeof value.text === 'string' ? value.text : '';
          const page = text === '' ? [] : text.split('\n');
          for (let index = 0; index < page.length; index++) {
            if (collected.length >= maxLines) {
              truncated = true;
              break;
            }
            collected.push(page[index]);
          }
          eof = value.eof === true;
          const count = typeof value.lines === 'number' && value.lines > 0 ? Math.floor(value.lines) : page.length;
          if (truncated || eof || count <= 0) {
            if (!eof && collected.length >= maxLines) truncated = true;
            break;
          }
          offset += count;
        }
        if (stopped || !mountedRef.current || controller.signal.aborted) return;
        setFileState({ status: 'ready', lines: collected, error: null, truncated: truncated });
      }

      frReadPages().then(function frReadDone() {}, function frReadRejected() {});
      return function frCancelFileRead() {
        stopped = true;
        frReleaseFile();
        try { controller.abort(); } catch (err) { /* ignore */ }
      };
    }, [openPath, reloadNonce, sessionId, apiRead, tabSignal]);

    React.useEffect(function frResetFileScroll() {
      const node = fileBodyRef.current;
      if (!node || typeof node !== 'object' || typeof node.scrollTop !== 'number') return;
      node.scrollTop = 0;
    }, [openPath, reloadNonce, fileState.status]);

    // Poll this session's git status file (written by the Host half). The path is
    // outside the workspace, which api.read permits. Failures keep the last good
    // snapshot; non-repo/missing leaves git UI unavailable.
    React.useEffect(function frPollGitStatus() {
      if (!apiRead || !sessionId) return undefined;
      // The Host writes status JSON into a fixed OS-temp directory (it cannot know
      // this package's install path, and the browser cannot call the host directly).
      const statusDirs = Array.isArray(FR_STATUS_DIRS)
        ? FR_STATUS_DIRS.filter(function frStatusDirOk(value) { return typeof value === 'string' && value; })
            .map(function frStatusDirTrim(value) { return value.replace(/[\\/]+$/, ''); })
        : [];
      if (!statusDirs.length) return undefined;
      // The Host sanitizes the session id into a portable file name; mirror it.
      const safeSession = String(sessionId).replace(/[^A-Za-z0-9._-]/g, '_');
      let stopped = false;
      let timer = null;
      let controller = null;
      let unlink = function frNoUnlink() {};

      function frReleasePoll() {
        const currentUnlink = unlink;
        unlink = function frNoUnlink() {};
        try { currentUnlink(); } catch (err) { /* ignore */ }
        controller = null;
      }

      async function frReadStatusFile(statusPath, signal) {
        let offset = 1;
        let text = '';
        let pages = 0;
        let eof = false;
        while (!eof && pages < 3) {
          pages += 1;
          const result = await apiRead(sessionId, statusPath, offset, signal);
          if (!result || result.ok !== true) return null;
          const value = result.value && typeof result.value === 'object' ? result.value : {};
          const chunk = typeof value.text === 'string' ? value.text : '';
          if (text && chunk) text += '\n';
          text += chunk;
          eof = value.eof === true;
          const count = typeof value.lines === 'number' && value.lines > 0
            ? Math.floor(value.lines)
            : (chunk === '' ? 0 : chunk.split('\n').length);
          if (count <= 0) break;
          offset += count;
        }
        return text;
      }

      function frSchedulePoll() {
        if (stopped) return;
        if (tabSignal && tabSignal.aborted) return;
        try {
          timer = setTimeout(function frGitTick() {
            timer = null;
            if (stopped) return;
            Promise.resolve(frPoll()).then(frSchedulePoll, frSchedulePoll);
          }, 2500);
        } catch (err) {
          timer = null;
        }
      }

      async function frPoll() {
        if (stopped) return;
        let nextController = null;
        try { nextController = new AbortController(); } catch (err) { nextController = null; }
        if (!nextController) return;
        controller = nextController;
        unlink = frLinkSignal(tabSignal, nextController);
        let raw = null;
        for (let dirIndex = 0; dirIndex < statusDirs.length && !raw; dirIndex += 1) {
          const statusPath = statusDirs[dirIndex] + '/' + safeSession + '.json';
          try { raw = await frReadStatusFile(statusPath, nextController.signal); } catch (err) { raw = null; }
          if (nextController.signal.aborted) break;
        }
        const aborted = nextController.signal.aborted;
        frReleasePoll();
        if (stopped || aborted) return;
        if (typeof raw !== 'string' || !raw) return;
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (err) { parsed = null; }
        if (!parsed || typeof parsed !== 'object') return;
        const normalized = frSafeNormalizeGitStatus(parsed);
        if (!normalized || !mountedRef.current) return;
        setGitStatus(normalized);
      }

      Promise.resolve(frPoll()).then(frSchedulePoll, frSchedulePoll);
      return function frStopGitPoll() {
        stopped = true;
        if (timer !== null) {
          try { clearTimeout(timer); } catch (err) { /* ignore */ }
          timer = null;
        }
        const held = controller;
        frReleasePoll();
        if (held) {
          try { held.abort(); } catch (err) { /* ignore */ }
        }
      };
    }, [apiRead, sessionId, tabSignal]);

    // Recursive workspace search (pass 5): debounced BFS over the whole session
    // root, independent of the tree's expanded state. Caps + a time budget keep
    // pathological workspaces bounded; query changes abort the running walk.
    React.useEffect(function frSearchEffect() {
      if (!cwd || !apiList) {
        setSearchState({ status: 'idle', query: '', results: [], dirs: 0, truncated: false });
        return undefined;
      }
      const normalized = frSafeSearchNormalize(filter);
      if (!normalized) {
        setSearchState({ status: 'idle', query: '', results: [], dirs: 0, truncated: false });
        return undefined;
      }
      let stopped = false;
      let controller = null;
      try { controller = new AbortController(); } catch (err) { controller = null; }
      if (!controller) return undefined;
      const signal = controller.signal;
      const unlink = frLinkSignal(tabSignal, controller);
      const startedAt = Date.now();
      const maxDirs = FR_SEARCH_MAX_DIRS;
      const maxFiles = FR_SEARCH_MAX_FILES;
      const budget = FR_SEARCH_BUDGET_MS;
      const concurrency = FR_SEARCH_CONCURRENCY;
      setSearchState({ status: 'searching', query: normalized, results: [], dirs: 0, truncated: false });

      async function frRunSearch() {
        const queue = [cwd];
        const seenDirs = Object.create(null);
        seenDirs[cwd] = true;
        const results = [];
        let dirs = 0;
        let files = 0;
        let truncated = false;
        searchLoop: while (queue.length) {
          if (signal.aborted || stopped) return null;
          if (Date.now() - startedAt > budget) { truncated = true; break; }
          if (dirs >= maxDirs) { truncated = true; break; }
          const batch = [];
          while (queue.length && batch.length < concurrency && dirs + batch.length < maxDirs) {
            batch.push(queue.shift());
          }
          dirs += batch.length;
          const listings = await Promise.all(batch.map(function frListSearchDir(dirPath) {
            let request = null;
            try { request = apiList(sessionId, dirPath, signal); } catch (err) { request = null; }
            return Promise.resolve(request).then(function frSearchListingDone(result) {
              return { dir: dirPath, result: result };
            }, function frSearchListingFailed() {
              return { dir: dirPath, result: null };
            });
          }));
          if (signal.aborted || stopped) return null;
          for (let listingIndex = 0; listingIndex < listings.length; listingIndex++) {
            const listing = listings[listingIndex];
            const result = listing && listing.result;
            if (!result || result.ok !== true) continue;
            const value = result.value && typeof result.value === 'object' ? result.value : {};
            const entries = Array.isArray(value.entries) ? value.entries : [];
            for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
              if (signal.aborted || stopped) return null;
              const entry = entries[entryIndex];
              if (!entry || typeof entry !== 'object' || typeof entry.name !== 'string' || !entry.name) continue;
              const entryPath = frSafeJoin(listing.dir, entry.name);
              if (entry.type === 'directory') {
                if (frSafeSearchSkipDir(entry.name)) continue;
                if (seenDirs[entryPath]) continue;
                seenDirs[entryPath] = true;
                queue.push(entryPath);
                continue;
              }
              if (entry.type !== 'file') continue;
              files += 1;
              if (files > maxFiles) { truncated = true; break searchLoop; }
              const relative = frSafeRelativePath(cwd, entryPath);
              const score = frSafeSearchScore(relative, normalized);
              if (score > 0) results.push({ abs: entryPath, path: relative, score: score });
            }
          }
          if (Date.now() - startedAt > budget) { truncated = true; break; }
          if (signal.aborted || stopped) return null;
          if (mountedRef.current) {
            const live = frRankSearchResults(results);
            setSearchState({
              status: 'searching',
              query: normalized,
              results: live.results,
              dirs: dirs,
              truncated: false,
            });
          }
        }
        return { results: results, dirs: dirs, truncated: truncated };
      }

      const timer = setTimeout(function frStartSearch() {
        if (stopped || signal.aborted) return;
        frRunSearch().then(function frSearchDone(outcome) {
          if (stopped || signal.aborted || !mountedRef.current) return;
          if (!outcome) return;
          const ranked = frRankSearchResults(outcome.results);
          setSearchState({
            status: 'done',
            query: normalized,
            results: ranked.results,
            dirs: outcome.dirs,
            truncated: outcome.truncated === true || ranked.truncated,
          });
        }, function frSearchRejected() {
          if (stopped || signal.aborted || !mountedRef.current) return;
          setSearchState({ status: 'done', query: normalized, results: [], dirs: 0, truncated: false });
        });
      }, FR_SEARCH_DEBOUNCE_MS);

      return function frStopSearchEffect() {
        stopped = true;
        try { clearTimeout(timer); } catch (err) { /* ignore */ }
        unlink();
        try { controller.abort(); } catch (err) { /* ignore */ }
      };
    }, [cwd, filter, apiList, sessionId, tabSignal]);

    // ---- derived data ------------------------------------------------------

    const commentList = Array.isArray(comments) ? comments : [];
    const commentCount = commentList.length;

    // Syntax highlighting: computed once per file read, skipped above the core cap.
    const highlightedLines = React.useMemo(function frHighlightedLines() {
      if (!openPath || fileState.status !== 'ready' || !Array.isArray(fileState.lines)) return null;
      const lines = fileState.lines;
      if (lines.length > frSafeHighlightLimit()) return null;
      const language = frSafeDetectLanguage(openPath);
      const tokens = frSafeHighlightLines(lines, language);
      if (!Array.isArray(tokens) || tokens.length !== lines.length) return null;
      return tokens;
    }, [openPath, fileState.status, fileState.lines]);

    // The selection stays on screen while commenting: an open popover owns its range.
    const activeRange = React.useMemo(function frActiveRange() {
      if (popover && typeof popover === 'object') {
        return { start: popover.startLine, end: popover.endLine };
      }
      if (selection && typeof selection === 'object') {
        return { start: selection.start, end: selection.end };
      }
      return null;
    }, [popover, selection]);

    // ---- git status (pass 4): absent snapshot means the git UI stays off ------
    const git = gitStatus && gitStatus.available === true && gitStatus.isRepo === true ? gitStatus : null;
    const gitAvailable = !!git;
    const gitFiles = git && Array.isArray(git.files) ? git.files : [];
    const gitChangedCount = gitFiles.length;
    const gitByAbs = git && git.byAbs && typeof git.byAbs === 'object' ? git.byAbs : {};
    const gitLineChanges = git && git.lineChanges && typeof git.lineChanges === 'object' ? git.lineChanges : {};

    const gitDirCounts = React.useMemo(function frGitDirCounts() {
      const counts = {};
      if (!git || !gitFiles.length) return counts;
      const stop = typeof git.cwd === 'string' && git.cwd
        ? git.cwd.replace(/[\\/]+$/, '')
        : (typeof git.repoRoot === 'string' ? git.repoRoot.replace(/[\\/]+$/, '') : '');
      gitFiles.forEach(function frCountChangedFile(file) {
        const abs = file && typeof file.abs === 'string' ? file.abs : '';
        if (!abs) return;
        let dir = frSafeDirName(abs);
        let depth = 0;
        while (dir && depth < 64 && (stop === '' || dir.length >= stop.length)) {
          counts[dir] = (counts[dir] || 0) + 1;
          const parent = frSafeDirName(dir);
          if (!parent || parent === dir) break;
          dir = parent;
          depth += 1;
        }
      });
      return counts;
    }, [git, gitFiles]);

    const gitGroups = React.useMemo(function frGitGroups() {
      if (!gitOnly || !gitAvailable || !git) return [];
      try { return frSafeGroupChangedFiles(gitFiles) || []; } catch (err) { return []; }
    }, [gitOnly, gitAvailable, git, gitFiles]);

    const openGitEntry = openPath && gitByAbs[openPath] && typeof gitByAbs[openPath] === 'object'
      ? gitByAbs[openPath]
      : null;
    const openGitKind = openGitEntry ? frSafeGitKind(openGitEntry.status) : '';
    const openGitStatusKey = openGitEntry ? frGitStatusKey(openGitEntry.status) : '';

    const gitMarks = React.useMemo(function frGitMarks() {
      if (!openPath || !git) return null;
      if (fileState.status !== 'ready' || !Array.isArray(fileState.lines) || !fileState.lines.length) return null;
      const entry = gitByAbs[openPath] && typeof gitByAbs[openPath] === 'object' ? gitByAbs[openPath] : null;
      const status = entry && typeof entry.status === 'string' ? entry.status : '';
      const runs = gitLineChanges[openPath];
      const runList = Array.isArray(runs) ? runs : null;
      const allAdded = status === 'added' && (!runList || !runList.length);
      if (!runList && !allAdded) return null;
      const total = fileState.lines.length;
      const marks = [];
      let any = false;
      for (let lineNumber = 1; lineNumber <= total; lineNumber++) {
        const kind = allAdded ? 'added' : frSafeGitMarkKind(runList, lineNumber);
        marks.push(kind || '');
        if (kind) any = true;
      }
      return any ? marks : null;
    }, [openPath, git, gitByAbs, gitLineChanges, fileState.status, fileState.lines]);

    // ---- recursive workspace search results (pass 5) -----------------------
    const searchQuery = frSafeSearchNormalize(filter);
    const searchActive = !!cwd && searchQuery !== '';
    const searchRestrictToChanged = gitOnly && gitAvailable;

    const searchResults = React.useMemo(function frSearchVisibleResults() {
      const raw = searchState && Array.isArray(searchState.results) ? searchState.results : [];
      if (!raw.length) return [];
      return raw.filter(function frSearchResultVisible(result) {
        if (!result || typeof result.abs !== 'string' || typeof result.path !== 'string') return false;
        if (!searchRestrictToChanged) return true;
        const entry = gitByAbs[result.abs];
        return !!(entry && typeof entry === 'object' && entry.status !== 'deleted');
      });
    }, [searchState, searchRestrictToChanged, gitByAbs]);

    const searchGroups = React.useMemo(function frSearchGroups() {
      if (!searchResults.length) return [];
      try { return frSafeGroupSearchResults(searchResults) || []; } catch (err) { return []; }
    }, [searchResults]);

    const countsByPath = React.useMemo(function frCountsByPath() {
      try {
        return frSafeCountByPath(commentList);
      } catch (err) {
        return {};
      }
    }, [commentList]);

    const openComments = React.useMemo(function frOpenComments() {
      if (!openPath) return [];
      return commentList.filter(function frSameFile(comment) {
        return comment && comment.path === openPath;
      });
    }, [commentList, openPath]);

    const commentLines = React.useMemo(function frCommentLines() {
      const marked = {};
      openComments.forEach(function frMarkComment(comment) {
        const start = typeof comment.startLine === 'number' && isFinite(comment.startLine) ? Math.max(1, Math.floor(comment.startLine)) : 1;
        const end = typeof comment.endLine === 'number' && isFinite(comment.endLine) ? Math.max(start, Math.floor(comment.endLine)) : start;
        const stop = Math.min(end, start + 5000);
        for (let lineNumber = start; lineNumber <= stop; lineNumber++) marked[lineNumber] = true;
      });
      return marked;
    }, [openComments]);

    // Cards are anchored under the last line of their range (the same anchor the
    // popover used), stacked in creation order.
    const cardsByLine = React.useMemo(function frCardsByLine() {
      const grouped = {};
      openComments.forEach(function frGroupComment(comment, order) {
        const start = typeof comment.startLine === 'number' && isFinite(comment.startLine) ? Math.max(1, Math.floor(comment.startLine)) : 1;
        const end = typeof comment.endLine === 'number' && isFinite(comment.endLine) ? Math.max(start, Math.floor(comment.endLine)) : start;
        const key = String(end);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({ comment: comment, order: order });
      });
      return grouped;
    }, [openComments]);

    const treeRows = React.useMemo(function frTreeRows() {
      try {
        return frBuildTreeRows(cwd, expanded, levels);
      } catch (err) {
        return [];
      }
    }, [cwd, expanded, levels]);

    const lineElements = React.useMemo(function frLineElements() {
      const nodes = [];
      const lines = fileState.status === 'ready' && Array.isArray(fileState.lines) ? fileState.lines : [];
      if (fileState.truncated) {
        const cap = typeof FR_MAX_LINES === 'number' && FR_MAX_LINES > 0 ? Math.floor(FR_MAX_LINES) : lines.length;
        nodes.push(h('div', { key: 'file-truncated', className: 'dfr-status' }, tr('file.truncated', { count: cap })));
      }
      const range = activeRange && typeof activeRange === 'object'
        ? {
            start: Math.max(1, Math.min(activeRange.start, activeRange.end)),
            end: Math.max(1, Math.max(activeRange.start, activeRange.end)),
          }
        : null;
      for (let lineNumber = 1; lineNumber <= lines.length; lineNumber++) {
        const value = lines[lineNumber - 1];
        const raw = typeof value === 'string' ? value : (value === undefined || value === null ? '' : String(value));
        const hasComment = commentLines[lineNumber] === true;
        let className = 'dfr-line';
        if (hasComment) className += ' dfr-line-has-comment';
        if (range && lineNumber >= range.start && lineNumber <= range.end) {
          className += ' dfr-line-selected';
          if (lineNumber === range.start) className += ' dfr-line-sel-first';
          if (lineNumber === range.end) className += ' dfr-line-sel-last';
        }
        const tokenLine = Array.isArray(highlightedLines) ? highlightedLines[lineNumber - 1] : null;
        const markKind = gitMarks ? gitMarks[lineNumber - 1] || '' : '';
        const rowChildren = [
          h('span', { className: 'dfr-line-no', 'aria-hidden': 'true', key: 'no' }, String(lineNumber)),
        ];
        if (gitMarks) {
          rowChildren.push(h('span', {
            className: 'dfr-git-mark' + (markKind ? ' is-' + markKind : ' dfr-git-spacer'),
            'aria-hidden': 'true',
            key: 'gitmark',
          }));
        }
        rowChildren.push(h('span', { className: 'dfr-line-text', key: 'text' }, frRenderTokens(tokenLine, raw)));
        nodes.push(h('div', {
          key: 'line-' + lineNumber,
          className: className,
          'data-line': lineNumber,
          onMouseDown: handleRowMouseDown,
          onDoubleClick: handleRowDoubleClick,
        }, rowChildren));
        const cards = cardsByLine[lineNumber];
        if (cards && cards.length) {
          cards.forEach(function frPushCard(entry) {
            if (!entry || !entry.comment) return;
            const comment = entry.comment;
            const key = 'card-' + (typeof comment.id === 'string' ? comment.id : 'x') + '-' + String(entry.order);
            nodes.push(h(frCommentCard, {
              key: key,
              comment: comment,
              tr: tr,
              onDelete: deleteComment,
            }));
          });
        }
        if (popover && popover.anchorLine === lineNumber) {
          nodes.push(h(frCommentPopover, {
            key: 'popover-' + lineNumber,
            tr: tr,
            startLine: popover.startLine,
            endLine: popover.endLine,
            onAdd: addComment,
            onCancel: closePopover,
            onSend: handleSend,
          }));
        }
      }
      return nodes;
    }, [
      fileState,
      highlightedLines,
      commentLines,
      cardsByLine,
      activeRange,
      gitMarks,
      popover,
      tr,
      handleRowMouseDown,
      handleRowDoubleClick,
      addComment,
      closePopover,
      handleSend,
      deleteComment,
    ]);

    // ---- render ------------------------------------------------------------

    const sendButton = function frSendButton() {
      return h('button', {
        type: 'button',
        className: 'dfr-btn dfr-btn-primary',
        disabled: commentCount === 0,
        onClick: function frSendClick() { sendAll(); },
      }, frIcon('send', 12), h('span', null, tr('send.sendAll')));
    };

    function frRenderTreeRow(row) {
      if (!row || typeof row !== 'object') return null;
      const depth = typeof row.depth === 'number' && isFinite(row.depth) ? Math.max(0, Math.min(Math.floor(row.depth), 30)) : 0;
      const indent = 8 + depth * 12;
      if (row.kind === 'status') {
        const key = 'status-' + String(row.path || '') + '-' + String(row.status || '') + '-' + String(depth);
        if (row.status === 'error') {
          const detail = frErrorDetail(row.error, tr);
          return h('div', { key: key, className: 'dfr-status dfr-status-error', style: { paddingLeft: indent + 'px' } },
            h('span', null, tr('error.generic')),
            detail ? h('span', { className: 'dfr-error-detail' }, detail) : null,
            h('button', {
              type: 'button',
              className: 'dfr-btn dfr-btn-ghost',
              onClick: function frTreeRetry() { retryLevel(row.path); },
            }, tr('tree.retry'))
          );
        }
        const statusKey = row.status === 'empty'
          ? 'tree.empty'
          : (row.status === 'truncated' ? 'tree.truncated' : 'tree.loading');
        return h('div', { key: key, className: 'dfr-status', style: { paddingLeft: indent + 'px' } }, tr(statusKey));
      }
      if (row.kind !== 'entry') return null;
      const rowPath = typeof row.path === 'string' ? row.path : '';
      const name = typeof row.name === 'string' && row.name ? row.name : frSafeBaseName(rowPath);
      const title = typeof row.relPath === 'string' && row.relPath ? row.relPath : name;
      const key = 'entry-' + rowPath;
      const spacer = h('span', { className: 'dfr-tree-chevron' }, h('span', { className: 'dfr-tree-chevron-spacer' }));
      if (row.type === 'directory') {
        const open = !!(expanded && expanded[rowPath]);
        const dirChanged = !!(gitDirCounts && gitDirCounts[rowPath]);
        return h('button', {
          key: key,
          type: 'button',
          className: 'dfr-tree-row dfr-tree-row-dir' + (dirChanged ? ' dfr-git-dir-changed' : ''),
          style: { paddingLeft: indent + 'px' },
          title: title,
          'aria-expanded': open ? 'true' : 'false',
          onClick: function frToggleDirClick() { toggleDir(rowPath); },
        },
          h('span', { className: 'dfr-tree-chevron' + (open ? ' dfr-tree-chevron-open' : '') }, frIcon('chevron', 12)),
          h('span', { className: 'dfr-tree-name' }, name)
        );
      }
      if (row.type === 'file') {
        const count = countsByPath && countsByPath[rowPath] ? countsByPath[rowPath] : 0;
        const gitEntry = git && gitByAbs[rowPath] && typeof gitByAbs[rowPath] === 'object' ? gitByAbs[rowPath] : null;
        const gitKind = gitEntry ? frSafeGitKind(gitEntry.status) : '';
        const gitLetter = gitEntry ? frGitLetter(gitEntry.status) : '';
        return h('button', {
          key: key,
          type: 'button',
          className: 'dfr-tree-row dfr-tree-row-file' + (gitKind ? ' dfr-git-' + gitKind : ''),
          style: { paddingLeft: indent + 'px' },
          title: title,
          onClick: function frOpenFileClick() { openFile(rowPath); },
        },
          spacer,
          h('span', { className: 'dfr-tree-name' }, name),
          gitLetter ? h('span', { className: 'dfr-git-badge' }, gitLetter) : null,
          count > 0 ? h('span', { className: 'dfr-tree-badge' }, String(count)) : null
        );
      }
      return h('div', {
        key: key,
        className: 'dfr-tree-row dfr-tree-row-other',
        style: { paddingLeft: indent + 'px' },
        title: title,
      }, spacer, h('span', { className: 'dfr-tree-name' }, name));
    }

    const rootLabel = cwd ? (frSafeBaseName(cwd) || cwd) : '';

    const treeContent = !cwd
      ? h('div', { className: 'dfr-empty' }, tr('tree.noWorkspace'))
      : (!apiList
        ? h('div', { className: 'dfr-empty' }, tr('error.generic'))
        : (treeRows.length
          ? treeRows.map(frRenderTreeRow)
          : h('div', { className: 'dfr-empty' }, tr('tree.empty'))));

    const gitToggleButton = function frGitToggleButton() {
      const hint = gitAvailable
        ? (gitOnly ? tr('git.toggleOn') : tr('git.toggle'))
        : tr('git.noRepo');
      return h('button', {
        type: 'button',
        className: 'dfr-btn dfr-btn-ghost dfr-git-toggle' + (gitOnly && gitAvailable ? ' is-on' : ''),
        role: 'switch',
        'aria-checked': gitOnly && gitAvailable ? 'true' : 'false',
        'aria-label': hint,
        title: hint,
        disabled: !gitAvailable,
        onClick: function frToggleGitOnly() {
          if (!gitAvailable) return;
          setGitOnly(function frFlipGitOnly(prev) { return !prev; });
        },
      },
        h('span', { className: 'dfr-git-toggle-label' }, tr('git.toggle')),
        gitAvailable && gitChangedCount > 0
          ? h('span', { className: 'dfr-git-count' }, tr('git.count', { count: gitChangedCount }))
          : null
      );
    };

    function frRenderGitChangedList() {
      if (!gitGroups.length) return h('div', { className: 'dfr-empty' }, tr('git.noChanges'));
      const nodes = [];
      gitGroups.forEach(function frPushGitGroup(group) {
        if (!group || typeof group !== 'object') return;
        const dir = typeof group.dir === 'string' ? group.dir : '';
        nodes.push(h('div', {
          key: 'git-group-' + (dir || '.'),
          className: 'dfr-git-group',
          title: dir,
        }, dir || '.'));
        (Array.isArray(group.files) ? group.files : []).forEach(function frPushGitFile(file) {
          if (!file || typeof file !== 'object') return;
          const filePath = typeof file.path === 'string' ? file.path : '';
          const fileAbs = typeof file.abs === 'string' ? file.abs : '';
          const status = typeof file.status === 'string' ? file.status : '';
          const kind = frSafeGitKind(status);
          const letter = frGitLetter(status);
          const deleted = status === 'deleted';
          nodes.push(h('button', {
            key: 'git-file-' + fileAbs + '|' + filePath,
            type: 'button',
            className: 'dfr-tree-row dfr-tree-row-file' + (kind ? ' dfr-git-' + kind : ''),
            title: fileAbs || filePath,
            onClick: function frGitFileClick() {
              if (deleted) {
                showNotice('git.deletedHint');
                return;
              }
              if (fileAbs) openFile(fileAbs);
            },
          },
            h('span', { className: 'dfr-tree-name' }, filePath),
            letter ? h('span', { className: 'dfr-git-badge' }, letter) : null
          ));
        });
      });
      return nodes;
    }

    function frSearchStatusText() {
      const state = searchState && typeof searchState === 'object' ? searchState : {};
      const current = state.query === searchQuery && searchQuery !== '';
      const status = current ? state.status : 'searching';
      const dirs = current && typeof state.dirs === 'number' && state.dirs > 0 ? state.dirs : 0;
      const parts = [];
      if (status === 'searching') {
        parts.push(tr('search.searching'));
      } else if (status === 'done') {
        const count = searchResults.length;
        if (count > 0) parts.push(tr('search.results', { count: count }));
        if (state.truncated === true) parts.push(tr('search.truncated'));
      }
      if (dirs > 0) parts.push(tr('search.scanned', { dirs: dirs }));
      return parts.filter(function frKeepSearchPart(part) {
        return typeof part === 'string' && part;
      }).join(' · ');
    }

    function frRenderSearchResultRow(result) {
      if (!result || typeof result !== 'object') return null;
      const abs = typeof result.abs === 'string' ? result.abs : '';
      if (!abs) return null;
      const rel = typeof result.path === 'string' && result.path
        ? result.path
        : frSafeRelativePath(cwd || '', abs);
      const entry = gitByAbs && gitByAbs[abs] && typeof gitByAbs[abs] === 'object' ? gitByAbs[abs] : null;
      const status = entry && typeof entry.status === 'string' ? entry.status : '';
      if (status === 'deleted') return null;
      const kind = status ? frSafeGitKind(status) : '';
      const letter = status ? frGitLetter(status) : '';
      return h('button', {
        key: 'search-row-' + abs,
        type: 'button',
        className: 'dfr-tree-row dfr-tree-row-file dfr-search-row' + (kind ? ' dfr-git-' + kind : ''),
        title: abs,
        onClick: function frOpenSearchResult() { openFile(abs); },
      },
        h('span', { className: 'dfr-tree-name' }, rel),
        letter ? h('span', { className: 'dfr-git-badge' }, letter) : null
      );
    }

    function frRenderSearchList() {
      const nodes = [];
      const statusText = frSearchStatusText();
      const finished = searchState && searchState.query === searchQuery && searchState.status === 'done';
      if (statusText) nodes.push(h('div', { key: 'search-status', className: 'dfr-search-status' }, statusText));
      if (searchGroups.length) {
        searchGroups.forEach(function frPushSearchGroup(group) {
          if (!group || typeof group !== 'object') return;
          const dir = typeof group.dir === 'string' ? group.dir : '';
          nodes.push(h('div', {
            key: 'search-group-' + (dir || '.'),
            className: 'dfr-git-group',
            title: dir,
          }, dir || '.'));
          (Array.isArray(group.files) ? group.files : []).forEach(function frPushSearchRow(result) {
            const row = frRenderSearchResultRow(result);
            if (row) nodes.push(row);
          });
        });
      } else if (finished) {
        nodes.push(h('div', { key: 'search-empty', className: 'dfr-search-empty' }, tr('search.empty')));
      }
      return nodes;
    }

    const browseElement = h('div', { className: 'dfr-browse' },
      h('div', { className: 'dfr-header' },
        h('div', { className: 'dfr-header-main' },
          h('div', { className: 'dfr-title' }, tr('tree.title')),
          h('div', { className: 'dfr-subtitle', title: cwd || '' }, rootLabel)
        ),
        h('div', { className: 'dfr-header-actions' },
          gitToggleButton(),
          frIconButton(tr('tree.refresh'), 'refresh', function frRefreshClick() { refreshTree(); })
        )
      ),
      cwd ? h('div', { className: 'dfr-filter-row' },
        h('input', {
          className: 'dfr-filter-input',
          type: 'text',
          value: filter,
          spellCheck: false,
          placeholder: tr('tree.filter'),
          'aria-label': tr('tree.filter'),
          title: tr('search.hint'),
          onChange: function frFilterChange(event) {
            setFilter(event && event.target ? String(event.target.value || '') : '');
          },
        })
      ) : null,
      h('div', { className: 'dfr-tree' },
        searchActive
          ? frRenderSearchList()
          : (gitOnly && gitAvailable ? frRenderGitChangedList() : treeContent)
      ),
      commentCount > 0 ? h('div', { className: 'dfr-footer' },
        h('span', { className: 'dfr-footer-count' }, tr('comment.count', { count: commentCount })),
        sendButton()
      ) : null
    );

    const displayPath = openPath
      ? (frSafeRelativePath(cwd || '', openPath) || frSafeBaseName(openPath) || openPath)
      : '';

    let fileContent = null;
    if (fileState.status === 'error') {
      const error = fileState.error && typeof fileState.error === 'object' ? fileState.error : null;
      const errorCode = error && typeof error.code === 'string' ? error.code : '';
      const detail = frErrorDetail(error, tr);
      fileContent = h('div', { className: 'dfr-error-box' },
        h('div', null, tr('file.error')),
        errorCode === 'workspace-file/not-text' ? h('div', null, tr('file.notText')) : null,
        detail ? h('div', { className: 'dfr-error-detail' }, detail) : null,
        h('button', {
          type: 'button',
          className: 'dfr-btn dfr-btn-ghost',
          onClick: function frFileRetry() { reloadFile(); },
        }, tr('tree.retry'))
      );
    } else if (fileState.status === 'ready') {
      fileContent = h('div', {
        className: 'dfr-file-body',
        ref: fileBodyRef,
        onMouseMove: handleBodyMouseMove,
      }, lineElements);
    } else {
      fileContent = h('div', { className: 'dfr-empty' }, tr('file.loading'));
    }

    // Header subtitle priority: live range > comment count > usage hint.
    let fileSubtitle = '';
    if (activeRange && typeof activeRange === 'object') {
      fileSubtitle = frRangeLabel(activeRange.start, activeRange.end, tr);
    } else if (commentCount > 0) {
      fileSubtitle = tr('comment.count', { count: commentCount });
    } else {
      fileSubtitle = tr('file.hint');
    }

    const fileElement = h('div', { className: 'dfr-file' },
      h('div', { className: 'dfr-header' },
        frIconButton(tr('tree.back'), 'back', function frBackClick() { backToTree(); }),
        h('div', { className: 'dfr-header-main' },
          h('div', { className: 'dfr-title', title: openPath || '' }, displayPath),
          h('div', { className: 'dfr-file-meta' },
            openGitEntry && openGitStatusKey
              ? h('span', { className: 'dfr-git-badge dfr-git-' + openGitKind }, tr('git.' + openGitStatusKey))
              : null,
            h('div', { className: 'dfr-subtitle' }, fileSubtitle)
          )
        ),
        h('div', { className: 'dfr-header-actions' },
          frIconButton(tr('file.reload'), 'refresh', function frReloadClick() { reloadFile(); }),
          sendButton()
        )
      ),
      fileContent
    );

    const noticeElement = notice && typeof notice === 'object' && typeof notice.key === 'string'
      ? h('div', {
          className: 'dfr-notice ' + (notice.key === 'send.failed' ? 'dfr-notice-error' : 'dfr-notice-success'),
          role: 'status',
        }, tr(notice.key, notice.vars || undefined))
      : null;

    return h('div', {
      className: 'dfr-root',
    }, noticeElement, openPath ? fileElement : browseElement);
  }

  return FileReviewBody;
}
