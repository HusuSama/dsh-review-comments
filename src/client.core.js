/* dsh-review-comments — pure core helpers (client.core.js).
 *
 * This file is a plain-script FRAGMENT: `node --check src/client.core.js` must pass on
 * its own. The build concatenates it into one factory closure together with
 * client.ui.js and client.apply.js (see docs/CONTRACT.md), so it declares only
 * top-level `const`/`let`/`function` names that are unique across the three parts.
 *
 * Rules: no React, no DOM, no `ctx`, no timers, no top-level side effects. Everything
 * here is referentially transparent except the monotonically increasing comment id
 * counter `frCommentSeq` (and `Date.now()` for `createdAt`).
 */

const FR_TYPE_ID = 'dsh-review-comments';
const FR_NS = 'fileReview';
const FR_PAGE_LINES = 2000;
const FR_MAX_LINES = 20000;
const FR_QUOTE_LINES = 3;

/* Monotonic part of comment ids, so two comments created in the same millisecond
 * still receive distinct ids. */
let frCommentSeq = 0;

/* parent with any trailing / or \ removed, then '/' + name. Empty parent -> name. */
function frJoinPath(parent, name) {
  const base = parent == null ? '' : String(parent);
  const leaf = name == null ? '' : String(name);
  if (base === '') return leaf;
  const trimmed = base.replace(/[\\/]+$/, '');
  return trimmed + '/' + leaf;
}

/* Parent directory without a trailing slash; '' for a root such as '/' or 'C:\'. */
function frDirName(path) {
  const source = path == null ? '' : String(path);
  const index = Math.max(source.lastIndexOf('/'), source.lastIndexOf('\\'));
  if (index < 0) return '';
  let head = source.slice(0, index);
  head = head.replace(/[\\/]+$/, '');
  if (head === '') return '';
  if (/^[A-Za-z]:$/.test(head)) return '';
  return head;
}

/* Last path segment, '/' or '\' separated. Trailing separator -> ''. */
function frBaseName(path) {
  const source = path == null ? '' : String(path);
  if (source === '') return '';
  const parts = source.split(/[\\/]/);
  return parts[parts.length - 1];
}

/* path with the root prefix and one separator removed; '' when equal; path unchanged
 * when it is not under the root. Always '/' separated. */
function frRelativePath(root, path) {
  const full = (path == null ? '' : String(path)).replace(/\\/g, '/');
  const rootRaw = (root == null ? '' : String(root)).replace(/\\/g, '/');
  const base = rootRaw.replace(/\/+$/, '');
  if (base === '') {
    /* root '' (workspace root) or '/' (filesystem root) */
    return rootRaw === '' ? full : full.replace(/^\/+/, '');
  }
  if (full === base || full === base + '/') return '';
  if (full.indexOf(base + '/') === 0) return full.slice(base.length + 1);
  return full;
}

/* 'L12' for a single line, 'L12-L18' for a range. */
function frLineLabel(startLine, endLine) {
  const start = startLine;
  const end = endLine == null ? startLine : endLine;
  if (end === start) return 'L' + String(start);
  return 'L' + String(start) + '-L' + String(end);
}

/* Build one review comment. The quote array is copied (never aliased) and capped at
 * FR_QUOTE_LINES raw source lines. `text` is carried through because every rendered
 * comment (and frFormatReviewMessage) needs it; docs/CONTRACT.md's object listing
 * omits it, which is a doc omission. */
function frMakeComment(input) {
  const source = input || {};
  const startLine = source.startLine == null ? 0 : source.startLine;
  const endLine = source.endLine == null ? startLine : source.endLine;
  const rawQuote = Array.isArray(source.quote) ? source.quote : [];
  const quote = rawQuote.slice(0, FR_QUOTE_LINES);
  const now = Date.now();
  frCommentSeq += 1;
  return {
    id: 'c' + now.toString(36) + frCommentSeq.toString(36),
    path: source.path == null ? '' : String(source.path),
    startLine: startLine,
    endLine: endLine,
    text: source.text == null ? '' : String(source.text),
    quote: quote,
    createdAt: now,
  };
}

/* New array sorted by path (localeCompare), then startLine, then createdAt. */
function frSortComments(comments) {
  const list = Array.isArray(comments) ? comments.slice() : [];
  list.sort(function (a, b) {
    const pathA = a && a.path != null ? String(a.path) : '';
    const pathB = b && b.path != null ? String(b.path) : '';
    const byPath = pathA.localeCompare(pathB);
    if (byPath !== 0) return byPath;
    const lineA = a && a.startLine != null ? Number(a.startLine) : 0;
    const lineB = b && b.startLine != null ? Number(b.startLine) : 0;
    if (lineA !== lineB) return lineA - lineB;
    const createdA = a && a.createdAt != null ? Number(a.createdAt) : 0;
    const createdB = b && b.createdAt != null ? Number(b.createdAt) : 0;
    return createdA - createdB;
  });
  return list;
}

/* Plain object mapping path -> number of comments. */
function frCountByPath(comments) {
  const counts = {};
  const list = Array.isArray(comments) ? comments : [];
  for (let i = 0; i < list.length; i += 1) {
    const comment = list[i];
    const key = comment && comment.path != null ? String(comment.path) : '';
    const current = Object.prototype.hasOwnProperty.call(counts, key) ? counts[key] : 0;
    counts[key] = current + 1;
  }
  return counts;
}

/* Replace every '{name}' with String(vars[name]); unknown names stay literal. */
function frInterpolate(template, vars) {
  const text = template == null ? '' : String(template);
  const values = vars || {};
  return text.replace(/\{([^{}]+)\}/g, function (match, name) {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return match;
    return String(values[name]);
  });
}

/* Human/model friendly send-to-composer message (Optimization pass 2): an ordered
 * list of `path#line` references and NO source excerpts.
 *
 * Layout (byte shape checked against the sample in docs/CONTRACT.md):
 *   intro
 *   <blank>
 *   1. `/abs/path/src/a.ts#12` text
 *   2. `/abs/path/src/a.ts#20:24` text
 *   ...
 * Items are ordered by path (localeCompare), then startLine, then createdAt, i.e.
 * exactly frSortComments. The anchor is the only location data. Only the
 * 'send.intro' key is translated. Empty input -> ''.
 *
 * Comment text: CR stripped, trailing whitespace of the whole text trimmed,
 * embedded newlines kept with every continuation line prefixed by three spaces
 * so the markdown list item survives. Empty text -> the item ends after the
 * closing backtick. */
function frFormatReviewMessage(comments, tr) {
  const list = Array.isArray(comments) ? comments.slice() : [];
  if (list.length === 0) return '';

  const t = typeof tr === 'function' ? tr : function (key) { return key; };
  const intro = t('send.intro', { count: list.length });

  const sorted = frSortComments(list);
  const items = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const comment = sorted[i] || {};
    const path = comment.path == null ? '' : String(comment.path);
    const startLine = comment.startLine;
    const endLine = comment.endLine == null ? startLine : comment.endLine;
    const anchor = endLine === startLine
      ? String(startLine)
      : startLine + ':' + endLine;
    const text = comment.text == null
      ? ''
      : String(comment.text).replace(/\r/g, '').replace(/\s+$/, '');
    let item = (i + 1) + '. `' + path + '#' + anchor + '`';
    if (text) item += ' ' + text.replace(/\n/g, '\n   ');
    items.push(item);
  }

  return intro + '\n\n' + items.join('\n');
}

/* ==========================================================================
 * Optimization pass 7 — Prism-based syntax highlighting.
 * --------------------------------------------------------------------------
 * The vendored Prism build (src/vendor/prism.min.js) is concatenated into the
 * same factory scope before this fragment and exposes `FR_PRISM` (Prism 1.30.0
 * with a fixed language subset). frDetectLanguage maps paths to Prism language
 * ids; frHighlightLines tokenizes the whole file text and splits the Prism
 * tokens back into one `{ k, v }` array per source line. The UI relies on the
 * invariant tokens.map(t => t.v).join('') === originalLine; when that check
 * fails (or Prism is unavailable/throws) the plain fallback is returned.
 * ========================================================================== */

const FR_HL_MAX_LINES = 5000;

/* Lower-cased basename extension -> Prism language id. */
const FR_PRISM_LANG_BY_EXT = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', json5: 'javascript',
  jsx: 'jsx',
  ts: 'typescript', mts: 'typescript', cts: 'typescript',
  tsx: 'tsx',
  json: 'json',
  css: 'css', scss: 'css', less: 'css', sass: 'css',
  html: 'markup', htm: 'markup', xml: 'markup', svg: 'markup', vue: 'markup',
  svelte: 'markup',
  md: 'markdown', markdown: 'markdown', mdx: 'markdown',
  py: 'python', pyw: 'python',
  sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash',
  yaml: 'yaml', yml: 'yaml',
  toml: 'toml',
  ini: 'ini', conf: 'ini', cfg: 'ini', properties: 'ini', env: 'ini',
  sql: 'sql',
  diff: 'diff', patch: 'diff',
  go: 'go',
  rs: 'rust',
  java: 'java',
};

/* Language ids this module accepts (everything else falls back to plain, even if
 * the vendored Prism happens to expose an alias grammar such as 'text'). */
const FR_PRISM_LANG_IDS = {
  javascript: 1, jsx: 1, typescript: 1, tsx: 1, json: 1, css: 1, markup: 1,
  markdown: 1, python: 1, bash: 1, yaml: 1, toml: 1, ini: 1, sql: 1, diff: 1,
  go: 1, rust: 1, java: 1,
};

/* Prism token type -> UI kind (case-insensitive; first recognised hit wins). */
const FR_PRISM_KINDS = {
  keyword: 'keyword', important: 'keyword', atrule: 'keyword', title: 'keyword',
  string: 'string', char: 'string', regex: 'string', 'template-string': 'string',
  'attr-value': 'string', url: 'string', code: 'string',
  comment: 'comment', prolog: 'comment', doctype: 'comment', cdata: 'comment',
  number: 'number', boolean: 'number', constant: 'number', symbol: 'number',
  unit: 'number', hexcode: 'number',
  function: 'func', method: 'func',
  'class-name': 'type', builtin: 'type', namespace: 'type', type: 'type',
  annotation: 'type', bold: 'type', italic: 'type',
  tag: 'tag', selector: 'tag',
  'attr-name': 'attr', property: 'attr', 'property-access': 'attr',
  punctuation: 'punct', operator: 'punct', 'interpolation-punctuation': 'punct',
  hr: 'punct', list: 'punct', blockquote: 'punct',
  /* Prism's diff grammar uses marker types that the shared table does not list;
   * map them so diff output stays readable (deviation reported to the Lead). */
  coord: 'keyword',
  inserted: 'string', 'inserted-sign': 'string',
  deleted: 'comment', 'deleted-sign': 'comment',
};

/* One plain token per line: fallback for plain/unknown/absent output. */
function frHighlightPlain(textLines) {
  const result = [];
  for (let i = 0; i < textLines.length; i += 1) {
    result.push([{ k: 'plain', v: textLines[i] }]);
  }
  return result;
}

/* Our kind for a Prism type/alias name; '' when it is not mapped. */
function frPrismTypeKind(name) {
  if (typeof name !== 'string') return '';
  const key = name.toLowerCase();
  return Object.prototype.hasOwnProperty.call(FR_PRISM_KINDS, key)
    ? FR_PRISM_KINDS[key]
    : '';
}

/* Kind of one Prism Token: recognised alias first, then its own type; an
 * unknown nested token keeps the enclosing token's kind. */
function frPrismTokenKind(token, inheritedKind) {
  const alias = token.alias;
  if (typeof alias === 'string') {
    const byAlias = frPrismTypeKind(alias);
    if (byAlias) return byAlias;
  } else if (Array.isArray(alias)) {
    for (let i = 0; i < alias.length; i += 1) {
      const byAlias = frPrismTypeKind(alias[i]);
      if (byAlias) return byAlias;
    }
  }
  const byType = frPrismTypeKind(token.type);
  return byType || inheritedKind;
}

/* Flatten Prism's nested tokens into flat { k, v } segments; strings take the
 * enclosing token's kind. */
function frPrismFlatten(node, inheritedKind, out) {
  if (typeof node === 'string') {
    if (node !== '') out.push({ k: inheritedKind, v: node });
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      frPrismFlatten(node[i], inheritedKind, out);
    }
    return;
  }
  if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;
  const kind = frPrismTokenKind(node, inheritedKind);
  const content = node.content;
  if (typeof content === 'string') {
    if (content !== '') out.push({ k: kind, v: content });
    return;
  }
  if (content && typeof content === 'object') frPrismFlatten(content, kind, out);
}

/* Split flat segments on newlines into one token array per source line;
 * empty values are dropped and adjacent same-kind tokens are merged. */
function frPrismSplitLines(segments, lineCount) {
  const perLine = [];
  for (let i = 0; i < lineCount; i += 1) perLine.push([]);
  let lineIndex = 0;
  for (let s = 0; s < segments.length; s += 1) {
    const segment = segments[s];
    const parts = segment.v.split('\n');
    for (let p = 0; p < parts.length; p += 1) {
      if (p > 0) lineIndex += 1;
      const value = parts[p];
      if (value === '') continue;
      if (lineIndex >= lineCount || lineIndex < 0) return perLine;
      const tokens = perLine[lineIndex];
      const last = tokens.length > 0 ? tokens[tokens.length - 1] : null;
      if (last && last.k === segment.k) last.v += value;
      else tokens.push({ k: segment.k, v: value });
    }
  }
  return perLine;
}

/* Safe String() for one source line (hostile values become ''). */
function frHighlightLineText(value) {
  if (value == null) return '';
  try {
    return String(value);
  } catch (err) {
    return '';
  }
}

/* One token array per input line, using the vendored Prism when available. */
function frHighlightLines(lines, lang) {
  const input = Array.isArray(lines) ? lines : [];
  const textLines = [];
  for (let i = 0; i < input.length; i += 1) {
    textLines.push(frHighlightLineText(input[i]));
  }
  try {
    if (textLines.length === 0) return [];
    if (typeof FR_PRISM !== 'object' || !FR_PRISM || !FR_PRISM.languages) {
      return frHighlightPlain(textLines);
    }
    if (
      typeof lang !== 'string'
      || lang === 'plain'
      || !Object.prototype.hasOwnProperty.call(FR_PRISM_LANG_IDS, lang)
      || !Object.prototype.hasOwnProperty.call(FR_PRISM.languages, lang)
    ) {
      return frHighlightPlain(textLines);
    }
    const tokens = FR_PRISM.tokenize(
      textLines.join('\n'),
      FR_PRISM.languages[lang],
    );
    const segments = [];
    frPrismFlatten(tokens, 'plain', segments);
    const perLine = frPrismSplitLines(segments, textLines.length);
    if (perLine.length !== textLines.length) return frHighlightPlain(textLines);
    for (let i = 0; i < textLines.length; i += 1) {
      let joined = '';
      const lineTokens = perLine[i];
      for (let t = 0; t < lineTokens.length; t += 1) joined += lineTokens[t].v;
      if (joined !== textLines[i]) return frHighlightPlain(textLines);
    }
    return perLine;
  } catch (err) {
    return frHighlightPlain(textLines);
  }
}

/* Lower-case the basename's extension and map it to a Prism language id. */
function frDetectLanguage(path) {
  const source = path == null ? '' : String(path);
  const cut = Math.max(source.lastIndexOf('/'), source.lastIndexOf('\\'));
  const base = (cut >= 0 ? source.slice(cut + 1) : source).toLowerCase();
  const dot = base.lastIndexOf('.');
  const ext = dot >= 0 ? base.slice(dot + 1) : base;
  return Object.prototype.hasOwnProperty.call(FR_PRISM_LANG_BY_EXT, ext)
    ? FR_PRISM_LANG_BY_EXT[ext]
    : 'plain';
}

/* ==========================================================================
 * Optimization pass 4 — git status helpers.
 * --------------------------------------------------------------------------
 * The Host writes one compact JSON document per Session (schema in
 * docs/CONTRACT.md). frNormalizeGitStatus validates and sanitizes it into a
 * stable shape; the remaining helpers map statuses to UI kinds, look up per-line
 * markers, and group changed files for the browse-only list. All of them are
 * total functions: garbage input yields empty results and nothing throws.
 * ========================================================================== */

const FR_GIT_STATUSES = { added: 1, modified: 1, deleted: 1, renamed: 1, conflicted: 1 };
const FR_GIT_RUN_KINDS = { added: 1, modified: 1, deleted: 1 };

/* A fresh, unavailable status payload (also the fallback for bad input). */
function frGitEmptyStatus() {
  return {
    available: false,
    isRepo: false,
    branch: '',
    repoRoot: '',
    cwd: '',
    truncated: false,
    generatedAt: 0,
    files: [],
    byAbs: {},
    lineChanges: {},
    counts: { added: 0, modified: 0, deleted: 0, renamed: 0, conflicted: 0 },
  };
}

/* Plain-object assignment that also survives an own '__proto__' key. */
function frGitSet(target, key, value) {
  Object.defineProperty(target, String(key), {
    value: value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

/* Coerce to an integer >= 1, else fall back. */
function frGitPositiveInt(value, fallback) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!isFinite(number)) return fallback;
  const floored = Math.floor(number);
  return floored >= 1 ? floored : fallback;
}

/* Sanitize one raw lineChanges run array: known kinds only, ints >= 1,
 * end >= start, deleted count >= 1 for deleted runs, sorted by start then end. */
function frGitSanitizeRuns(rawRuns) {
  if (!Array.isArray(rawRuns)) return [];
  const runs = [];
  for (let i = 0; i < rawRuns.length; i += 1) {
    const raw = rawRuns[i];
    if (!raw || typeof raw !== 'object') continue;
    const kind = raw.kind;
    if (FR_GIT_RUN_KINDS[kind] !== 1) continue;
    const start = frGitPositiveInt(raw.start, 1);
    let end = frGitPositiveInt(raw.end, start);
    if (end < start) end = start;
    const deleted = kind === 'deleted' ? frGitPositiveInt(raw.deleted, 1) : 0;
    runs.push({ start: start, end: end, kind: kind, deleted: deleted });
  }
  runs.sort(function (a, b) {
    if (a.start !== b.start) return a.start - b.start;
    return a.end - b.end;
  });
  return runs;
}

/* Validate and sanitize the Host's JSON payload. Never throws. */
function frNormalizeGitStatus(raw) {
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return frGitEmptyStatus();
    if (raw.v !== 1) return frGitEmptyStatus();

    const status = frGitEmptyStatus();
    status.available = true;
    status.isRepo = raw.isRepo === true;
    status.branch = typeof raw.branch === 'string' ? raw.branch : '';
    status.repoRoot = typeof raw.repoRoot === 'string' ? raw.repoRoot : '';
    status.cwd = typeof raw.cwd === 'string' ? raw.cwd : '';
    status.truncated = raw.truncated === true;
    status.generatedAt = typeof raw.generatedAt === 'number' && isFinite(raw.generatedAt)
      ? raw.generatedAt
      : 0;

    const rawFiles = Array.isArray(raw.files) ? raw.files : [];
    for (let i = 0; i < rawFiles.length; i += 1) {
      const entry = rawFiles[i];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      const entryStatus = entry.status;
      if (FR_GIT_STATUSES[entryStatus] !== 1) continue;
      const file = {
        path: typeof entry.path === 'string' ? entry.path : '',
        abs: typeof entry.abs === 'string' ? entry.abs : '',
        status: entryStatus,
        oldPath: typeof entry.oldPath === 'string' ? entry.oldPath : '',
      };
      status.files.push(file);
      frGitSet(status.byAbs, file.abs, {
        path: file.path,
        status: file.status,
        oldPath: file.oldPath,
      });
      status.counts[entryStatus] += 1;
    }

    const rawChanges = raw.lineChanges;
    if (rawChanges && typeof rawChanges === 'object' && !Array.isArray(rawChanges)) {
      const keys = Object.keys(rawChanges);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        const runs = frGitSanitizeRuns(rawChanges[key]);
        if (runs.length > 0) frGitSet(status.lineChanges, key, runs);
      }
    }

    return status;
  } catch (err) {
    return frGitEmptyStatus();
  }
}

/* UI kind for a raw status: renamed maps to modified, unknown to ''. */
function frGitKind(status) {
  if (status === 'added') return 'added';
  if (status === 'modified' || status === 'renamed') return 'modified';
  if (status === 'deleted') return 'deleted';
  if (status === 'conflicted') return 'conflicted';
  return '';
}

/* Marker kind for one 1-based line. A deleted run marks only its anchor (start)
 * line, since it has no new content line of its own. */
function frGitMarkKind(lineChangesForFile, lineNumber) {
  try {
    if (!Array.isArray(lineChangesForFile)) return '';
    const rawLine = typeof lineNumber === 'number' ? lineNumber : Number(lineNumber);
    if (!isFinite(rawLine)) return '';
    const line = Math.floor(rawLine);
    if (line < 1) return '';
    for (let i = 0; i < lineChangesForFile.length; i += 1) {
      const run = lineChangesForFile[i];
      if (!run || typeof run !== 'object') continue;
      const kind = run.kind;
      if (FR_GIT_RUN_KINDS[kind] !== 1) continue;
      const start = frGitPositiveInt(run.start, 0);
      if (start < 1) continue;
      const endRaw = frGitPositiveInt(run.end, start);
      const end = endRaw < start ? start : endRaw;
      if (kind === 'deleted') {
        if (line === start) return 'deleted';
      } else if (line >= start && line <= end) {
        return kind;
      }
    }
    return '';
  } catch (err) {
    return '';
  }
}

/* Group changed files by repo-relative directory: '' (root) first, then
 * localeCompare; files inside each group sorted by path. */
function frGroupChangedFiles(files) {
  try {
    const list = Array.isArray(files) ? files : [];
    const groups = Object.create(null);
    const dirs = [];
    for (let i = 0; i < list.length; i += 1) {
      const file = list[i];
      if (!file || typeof file !== 'object' || Array.isArray(file)) continue;
      const path = typeof file.path === 'string' ? file.path : '';
      const cut = path.lastIndexOf('/');
      const dir = cut >= 0 ? path.slice(0, cut) : '';
      let group = groups[dir];
      if (!group) {
        group = { dir: dir, files: [] };
        groups[dir] = group;
        dirs.push(dir);
      }
      group.files.push(file);
    }
    dirs.sort(function (a, b) {
      if (a === b) return 0;
      if (a === '') return -1;
      if (b === '') return 1;
      return a.localeCompare(b);
    });
    const result = [];
    for (let i = 0; i < dirs.length; i += 1) {
      const group = groups[dirs[i]];
      group.files.sort(function (a, b) {
        const pathA = a && typeof a.path === 'string' ? a.path : '';
        const pathB = b && typeof b.path === 'string' ? b.path : '';
        return pathA.localeCompare(pathB);
      });
      result.push({ dir: group.dir, files: group.files });
    }
    return result;
  } catch (err) {
    return [];
  }
}

/* ==========================================================================
 * Optimization pass 5 + 6 — recursive fuzzy file search helpers.
 * ========================================================================== */

/* Directories the recursive walk never enters (read-only). */
const FR_SEARCH_SKIP_DIRS = Object.freeze(['node_modules', '.git', '.svn', '.hg']);

/* Trimmed, lower-cased query; '' for non-strings and empty/whitespace queries. */
function frSearchNormalize(query) {
  if (typeof query !== 'string') return '';
  return query.trim().toLowerCase();
}

/* Remove every character that is not a Unicode letter or digit. */
function frSearchStrip(value) {
  return value.replace(/[^\p{L}\p{N}]+/gu, '');
}

/* Greedy subsequence check: -1 when `needle` does not appear in order inside
 * `haystack`; otherwise the number of skipped (non-matched) haystack characters
 * before the last matched one (leading and inter-match gaps). */
function frSearchSubsequenceGaps(haystack, needle) {
  let cursor = 0;
  let gaps = 0;
  for (let i = 0; i < needle.length; i += 1) {
    const ch = needle.charAt(i);
    while (cursor < haystack.length && haystack.charAt(cursor) !== ch) {
      cursor += 1;
      gaps += 1;
    }
    if (cursor >= haystack.length) return -1;
    cursor += 1;
  }
  return gaps;
}

/* Fuzzy score for one path/query pair; 0 means no match, higher is better.
 * Classes (strongest first): exact basename, basename prefix, basename
 * substring, full-path substring, stripped basename substring, stripped path
 * substring, stripped basename subsequence, stripped path subsequence. */
function frSearchScore(relPath, query) {
  try {
    const needle = frSearchNormalize(query);
    if (needle === '') return 0;
    const rawPath = relPath == null ? '' : String(relPath);
    const path = rawPath.replace(/\\/g, '/').toLowerCase();
    if (path === '') return 0;

    const cut = path.lastIndexOf('/');
    const base = cut >= 0 ? path.slice(cut + 1) : path;

    if (base === needle) return 1200;
    if (base.indexOf(needle) === 0) {
      return 1000 + Math.max(0, 100 - base.length);
    }

    let index = base.indexOf(needle);
    if (index >= 0) {
      const delta = Math.min(50, base.length - needle.length);
      return 800 + Math.max(0, 100 - index) - delta;
    }

    index = path.indexOf(needle);
    if (index >= 0) {
      const delta = Math.min(50, path.length - needle.length);
      return 650 + Math.max(0, 100 - index) - delta;
    }

    const strippedNeedle = frSearchStrip(needle);
    /* A query made only of punctuation has no meaningful fuzzy form. */
    if (strippedNeedle === '') return 0;
    const strippedBase = frSearchStrip(base);
    if (strippedBase.indexOf(strippedNeedle) >= 0) {
      return 500 + Math.max(0, 80 - strippedBase.length);
    }
    const strippedPath = frSearchStrip(path);
    if (strippedPath.indexOf(strippedNeedle) >= 0) {
      return 420 + Math.max(0, 80 - strippedPath.length);
    }

    const baseGaps = frSearchSubsequenceGaps(strippedBase, strippedNeedle);
    if (baseGaps >= 0) return 300 + Math.max(0, 100 - baseGaps);
    const pathGaps = frSearchSubsequenceGaps(strippedPath, strippedNeedle);
    if (pathGaps >= 0) return 200 + Math.max(0, 100 - pathGaps);
    return 0;
  } catch (err) {
    return 0;
  }
}

/* Boolean form of frSearchScore, kept for backward compatibility. */
function frSearchMatches(relPath, query) {
  return frSearchScore(relPath, query) > 0;
}

/* Case-insensitive membership in FR_SEARCH_SKIP_DIRS. */
function frSearchSkipDir(name) {
  if (typeof name !== 'string' || name === '') return false;
  const lower = name.toLowerCase();
  for (let i = 0; i < FR_SEARCH_SKIP_DIRS.length; i += 1) {
    if (FR_SEARCH_SKIP_DIRS[i] === lower) return true;
  }
  return false;
}

/* Numeric score of one search result; missing/garbage counts as 0. */
function frSearchResultScore(entry) {
  const score = entry && typeof entry === 'object' ? entry.score : 0;
  return typeof score === 'number' && isFinite(score) && score > 0 ? score : 0;
}

/* Workspace-relative path of one search result. */
function frSearchResultPath(entry) {
  const value = entry && typeof entry === 'object' ? entry.path : '';
  return typeof value === 'string' ? value : '';
}

/* Group search results like frGroupChangedFiles but with the best score first:
 * dirs '' first then localeCompare; inside a group score descending, then path.
 * The input array/objects are never mutated. */
function frGroupSearchResults(results) {
  try {
    const list = Array.isArray(results) ? results : [];
    const groups = Object.create(null);
    const dirs = [];
    for (let i = 0; i < list.length; i += 1) {
      const entry = list[i];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      const path = frSearchResultPath(entry);
      const cut = path.lastIndexOf('/');
      const dir = cut >= 0 ? path.slice(0, cut) : '';
      let group = groups[dir];
      if (!group) {
        group = { dir: dir, files: [] };
        groups[dir] = group;
        dirs.push(dir);
      }
      group.files.push(entry);
    }
    dirs.sort(function (a, b) {
      if (a === b) return 0;
      if (a === '') return -1;
      if (b === '') return 1;
      return a.localeCompare(b);
    });
    const result = [];
    for (let i = 0; i < dirs.length; i += 1) {
      const group = groups[dirs[i]];
      group.files.sort(function (a, b) {
        const scoreA = frSearchResultScore(a);
        const scoreB = frSearchResultScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return frSearchResultPath(a).localeCompare(frSearchResultPath(b));
      });
      result.push({ dir: group.dir, files: group.files });
    }
    return result;
  } catch (err) {
    return [];
  }
}
