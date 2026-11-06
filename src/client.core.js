/* dsh-file-review — pure core helpers (client.core.js).
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
 * Optimization pass 1 — lightweight syntax highlighting.
 * --------------------------------------------------------------------------
 * frDetectLanguage maps a path to a language id; frHighlightLines turns raw
 * source lines into one token array per line. The highlighter is lexical only
 * (no parsing) and guarantees the invariant the UI relies on:
 *
 *   tokens.map(t => t.v).join('') === originalLine
 *
 * It never throws on malformed input: unterminated strings stay inside their
 * string token to the end of the line, unterminated block comments / HTML
 * comments / Markdown fences keep their multi-line state.
 * ========================================================================== */

const FR_HL_MAX_LINES = 5000;

/* Language ids accepted by frHighlightLines (anything else falls back to plain). */
const FR_HL_LANGS = {
  js: 1, json: 1, css: 1, html: 1, md: 1, hash: 1, sql: 1, diff: 1, plain: 1,
};

/* Lower-cased basename extension -> language id. */
const FR_HL_LANG_BY_EXT = {
  js: 'js', jsx: 'js', ts: 'js', tsx: 'js', mjs: 'js', cjs: 'js', json5: 'js',
  json: 'json',
  css: 'css', scss: 'css', less: 'css', sass: 'css',
  html: 'html', htm: 'html', xml: 'html', svg: 'html', vue: 'html',
  md: 'md', markdown: 'md', mdx: 'md',
  py: 'hash', rb: 'hash', sh: 'hash', bash: 'hash', zsh: 'hash', fish: 'hash',
  yaml: 'hash', yml: 'hash', toml: 'hash', ini: 'hash', conf: 'hash', cfg: 'hash',
  dockerfile: 'hash', makefile: 'hash', mk: 'hash', gradle: 'hash',
  properties: 'hash', env: 'hash',
  sql: 'sql',
  diff: 'diff', patch: 'diff',
};

/* Keyword tables. */
const FR_HL_JS_KEYWORDS = {
  const: 1, let: 1, var: 1, function: 1, return: 1, if: 1, else: 1, for: 1, while: 1,
  class: 1, import: 1, from: 1, export: 1, new: 1, async: 1, await: 1, try: 1,
  catch: 1, throw: 1, switch: 1, case: 1, break: 1, continue: 1, typeof: 1,
  instanceof: 1, delete: 1, in: 1, of: 1, this: 1, super: 1, true: 1, false: 1,
  null: 1, undefined: 1, interface: 1, type: 1, enum: 1, implements: 1, extends: 1,
  readonly: 1, static: 1, public: 1, private: 1,
};

const FR_HL_HASH_KEYWORDS = {
  def: 1, class: 1, import: 1, from: 1, return: 1, if: 1, elif: 1, else: 1, for: 1,
  while: 1, in: 1, and: 1, or: 1, not: 1, None: 1, True: 1, False: 1, function: 1,
  echo: 1, export: 1, local: 1, then: 1, fi: 1, do: 1, done: 1, let: 1,
};

const FR_HL_SQL_KEYWORDS = {
  SELECT: 1, FROM: 1, WHERE: 1, INSERT: 1, INTO: 1, UPDATE: 1, DELETE: 1, JOIN: 1,
  GROUP: 1, BY: 1, ORDER: 1, HAVING: 1, LIMIT: 1, VALUES: 1, SET: 1, CREATE: 1,
  TABLE: 1, INDEX: 1, AND: 1, OR: 1, NOT: 1, NULL: 1, AS: 1, ON: 1,
};

/* Punctuation characters per language. */
const FR_HL_JS_PUNCT = '{}()[];,.:?=+-*/%<>!&|^~@#';
const FR_HL_CSS_PUNCT = '{}()[];,.:>+~*&=!@%^|/$#?<>';
const FR_HL_SQL_PUNCT = '{}()[];,.:?=+-*/%<>!&|^~@#';

/* Numeric literals (radix prefixes, decimals, exponents; no leading sign). */
const FR_HL_NUMBER_RE = /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d+)?|\.\d[\d_]*(?:[eE][+-]?\d+)?)/;

/* --------------------------------------------------------------------------
 * Small lexical helpers
 * -------------------------------------------------------------------------- */

function frHlIsDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function frHlIsIdentStart(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

function frHlIsIdentPart(ch) {
  return frHlIsIdentStart(ch) || frHlIsDigit(ch);
}

/* Append one token, merging into the previous token when it is also 'plain'. */
function frHlPush(out, kind, value) {
  if (!value) return;
  if (kind === 'plain' && out.length > 0 && out[out.length - 1].k === 'plain') {
    out[out.length - 1].v += value;
    return;
  }
  out.push({ k: kind, v: value });
}

/* Every line yields at least one token; an otherwise empty line stays one 'plain'. */
function frHlFinish(out, line) {
  if (out.length === 0) out.push({ k: 'plain', v: line });
  return out;
}

function frHlReadIdent(line, start, allowDash) {
  let i = start + 1;
  while (i < line.length) {
    const ch = line.charAt(i);
    if (frHlIsIdentPart(ch) || (allowDash && ch === '-')) i += 1;
    else break;
  }
  return i;
}

/* End index (exclusive) of a quoted run; an unterminated run ends with the line. */
function frHlReadString(line, start, quote, escapes) {
  let i = start + 1;
  while (i < line.length) {
    const ch = line.charAt(i);
    if (escapes && ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) return i + 1;
    i += 1;
  }
  return line.length;
}

function frHlReadNumber(line, start) {
  const match = FR_HL_NUMBER_RE.exec(line.slice(start));
  return match ? start + match[0].length : start + 1;
}

/* --------------------------------------------------------------------------
 * JavaScript / TypeScript
 * -------------------------------------------------------------------------- */

function frHlJsSpecial(ch) {
  if (ch === '"' || ch === "'" || ch === '`' || ch === '/') return true;
  if (frHlIsIdentStart(ch) || frHlIsDigit(ch)) return true;
  return FR_HL_JS_PUNCT.indexOf(ch) >= 0;
}

function frHlLineJs(line, state) {
  const out = [];
  let i = 0;

  if (state.block === 'js') {
    const close = line.indexOf('*/');
    if (close < 0) {
      out.push({ k: 'comment', v: line });
      return out;
    }
    frHlPush(out, 'comment', line.slice(0, close + 2));
    state.block = '';
    i = close + 2;
  }

  while (i < line.length) {
    const ch = line.charAt(i);
    const next = i + 1 < line.length ? line.charAt(i + 1) : '';
    if (ch === '/' && next === '/') {
      frHlPush(out, 'comment', line.slice(i));
      break;
    }
    if (ch === '/' && next === '*') {
      const close = line.indexOf('*/', i + 2);
      if (close < 0) {
        frHlPush(out, 'comment', line.slice(i));
        state.block = 'js';
        break;
      }
      frHlPush(out, 'comment', line.slice(i, close + 2));
      i = close + 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = frHlReadString(line, i, ch, true);
      frHlPush(out, 'string', line.slice(i, end));
      i = end;
      continue;
    }
    if (frHlIsDigit(ch) || (ch === '.' && frHlIsDigit(next))) {
      const end = frHlReadNumber(line, i);
      frHlPush(out, 'number', line.slice(i, end));
      i = end;
      continue;
    }
    if (frHlIsIdentStart(ch)) {
      const end = frHlReadIdent(line, i, false);
      const word = line.slice(i, end);
      const after = end < line.length ? line.charAt(end) : '';
      const head = word.charAt(0);
      if (FR_HL_JS_KEYWORDS[word] === 1) frHlPush(out, 'keyword', word);
      else if (head >= 'A' && head <= 'Z') frHlPush(out, 'type', word);
      else if (after === '(') frHlPush(out, 'func', word);
      else frHlPush(out, 'plain', word);
      i = end;
      continue;
    }
    if (FR_HL_JS_PUNCT.indexOf(ch) >= 0) {
      let end = i + 1;
      while (end < line.length) {
        const c = line.charAt(end);
        if (FR_HL_JS_PUNCT.indexOf(c) < 0) break;
        if (c === '/' && (line.charAt(end + 1) === '/' || line.charAt(end + 1) === '*')) break;
        end += 1;
      }
      frHlPush(out, 'punct', line.slice(i, end));
      i = end;
      continue;
    }
    let end = i + 1;
    while (end < line.length && !frHlJsSpecial(line.charAt(end))) end += 1;
    frHlPush(out, 'plain', line.slice(i, end));
    i = end;
  }

  return frHlFinish(out, line);
}

/* --------------------------------------------------------------------------
 * JSON
 * -------------------------------------------------------------------------- */

function frHlJsonSpecial(ch) {
  if (ch === '"' || ch === '-' || ch === '.' || ch === ':') return true;
  if (frHlIsIdentStart(ch) || frHlIsDigit(ch)) return true;
  return '{}[],'.indexOf(ch) >= 0;
}

function frHlLineJson(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    const ch = line.charAt(i);
    const next = i + 1 < line.length ? line.charAt(i + 1) : '';
    if (ch === '"') {
      const end = frHlReadString(line, i, '"', true);
      frHlPush(out, 'string', line.slice(i, end));
      i = end;
      continue;
    }
    if (frHlIsDigit(ch) || (ch === '-' && frHlIsDigit(next)) || (ch === '.' && frHlIsDigit(next))) {
      const start = ch === '-' ? i + 1 : i;
      const end = frHlReadNumber(line, start);
      frHlPush(out, 'number', line.slice(i, end));
      i = end;
      continue;
    }
    if (frHlIsIdentStart(ch)) {
      const end = frHlReadIdent(line, i, false);
      const word = line.slice(i, end);
      if (word === 'true' || word === 'false' || word === 'null') frHlPush(out, 'keyword', word);
      else frHlPush(out, 'plain', word);
      i = end;
      continue;
    }
    if ('{}[],:'.indexOf(ch) >= 0) {
      frHlPush(out, 'punct', ch);
      i += 1;
      continue;
    }
    let end = i + 1;
    while (end < line.length && !frHlJsonSpecial(line.charAt(end))) end += 1;
    frHlPush(out, 'plain', line.slice(i, end));
    i = end;
  }
  return frHlFinish(out, line);
}

/* --------------------------------------------------------------------------
 * CSS
 * -------------------------------------------------------------------------- */

function frHlCssIdentStart(ch) {
  return ch === '-' || ch === '_' || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function frHlCssSpecial(ch) {
  if (ch === '"' || ch === "'" || ch === '/') return true;
  if (frHlCssIdentStart(ch) || frHlIsDigit(ch)) return true;
  return FR_HL_CSS_PUNCT.indexOf(ch) >= 0;
}

function frHlReadCssIdent(line, start) {
  let i = start;
  while (i < line.length) {
    const ch = line.charAt(i);
    if (frHlIsIdentPart(ch) || ch === '-') i += 1;
    else break;
  }
  return i > start ? i : start + 1;
}

function frHlLineCss(line, state) {
  const out = [];
  let i = 0;

  if (state.block === 'css') {
    const close = line.indexOf('*/');
    if (close < 0) {
      out.push({ k: 'comment', v: line });
      return out;
    }
    frHlPush(out, 'comment', line.slice(0, close + 2));
    state.block = '';
    i = close + 2;
  }

  while (i < line.length) {
    const ch = line.charAt(i);
    const next = i + 1 < line.length ? line.charAt(i + 1) : '';
    if (ch === '/' && next === '*') {
      const close = line.indexOf('*/', i + 2);
      if (close < 0) {
        frHlPush(out, 'comment', line.slice(i));
        state.block = 'css';
        break;
      }
      frHlPush(out, 'comment', line.slice(i, close + 2));
      i = close + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const end = frHlReadString(line, i, ch, true);
      frHlPush(out, 'string', line.slice(i, end));
      i = end;
      continue;
    }
    if (
      frHlIsDigit(ch)
      || (ch === '-' && frHlIsDigit(next))
      || (ch === '+' && frHlIsDigit(next))
      || (ch === '.' && frHlIsDigit(next))
    ) {
      const start = ch === '-' || ch === '+' ? i + 1 : i;
      const end = frHlReadNumber(line, start);
      frHlPush(out, 'number', line.slice(i, end));
      i = end;
      continue;
    }
    if (frHlCssIdentStart(ch)) {
      const end = frHlReadCssIdent(line, i);
      const word = line.slice(i, end);
      if (line.charAt(end) === ':') frHlPush(out, 'attr', word);
      else frHlPush(out, 'plain', word);
      i = end;
      continue;
    }
    if (FR_HL_CSS_PUNCT.indexOf(ch) >= 0) {
      let end = i + 1;
      while (end < line.length) {
        const c = line.charAt(end);
        if (FR_HL_CSS_PUNCT.indexOf(c) < 0) break;
        if (c === '/' && line.charAt(end + 1) === '*') break;
        end += 1;
      }
      frHlPush(out, 'punct', line.slice(i, end));
      i = end;
      continue;
    }
    let end = i + 1;
    while (end < line.length && !frHlCssSpecial(line.charAt(end))) end += 1;
    frHlPush(out, 'plain', line.slice(i, end));
    i = end;
  }

  return frHlFinish(out, line);
}

/* --------------------------------------------------------------------------
 * HTML / XML / SVG / Vue
 * -------------------------------------------------------------------------- */

function frHlHtmlTagSpecial(ch) {
  if (ch === '>' || ch === '=' || ch === '<' || ch === '/' || ch === '"' || ch === "'") return true;
  return frHlIsIdentStart(ch) || ch === '-' || ch === ':' || ch === '@';
}

function frHlReadHtmlName(line, start) {
  let i = start;
  while (i < line.length) {
    const ch = line.charAt(i);
    if (frHlIsIdentPart(ch) || ch === '-' || ch === ':' || ch === '.' || ch === '@') i += 1;
    else break;
  }
  return i > start ? i : start + 1;
}

function frHlLineHtml(line, state) {
  const out = [];
  let i = 0;

  if (state.block === 'html') {
    const close = line.indexOf('-->');
    if (close < 0) {
      out.push({ k: 'comment', v: line });
      return out;
    }
    frHlPush(out, 'comment', line.slice(0, close + 3));
    state.block = '';
    i = close + 3;
  }

  let inTag = false;
  while (i < line.length) {
    if (line.startsWith('<!--', i)) {
      const close = line.indexOf('-->', i + 4);
      if (close < 0) {
        frHlPush(out, 'comment', line.slice(i));
        state.block = 'html';
        break;
      }
      frHlPush(out, 'comment', line.slice(i, close + 3));
      i = close + 3;
      continue;
    }
    const ch = line.charAt(i);
    if (ch === '<') {
      const tag = /^<\/?[A-Za-z][A-Za-z0-9:._-]*/.exec(line.slice(i));
      if (tag) {
        frHlPush(out, 'tag', tag[0]);
        i += tag[0].length;
        inTag = true;
        continue;
      }
      frHlPush(out, 'punct', ch);
      i += 1;
      continue;
    }
    if (inTag) {
      if (ch === '>') {
        frHlPush(out, 'punct', ch);
        i += 1;
        inTag = false;
        continue;
      }
      if (ch === '/' && i + 1 < line.length && line.charAt(i + 1) === '>') {
        frHlPush(out, 'punct', '/>');
        i += 2;
        inTag = false;
        continue;
      }
      if (ch === '=') {
        frHlPush(out, 'punct', ch);
        i += 1;
        continue;
      }
      if (ch === '"' || ch === "'") {
        const end = frHlReadString(line, i, ch, false);
        frHlPush(out, 'string', line.slice(i, end));
        i = end;
        continue;
      }
      if (frHlIsIdentStart(ch) || ch === '-' || ch === ':' || ch === '@') {
        const end = frHlReadHtmlName(line, i);
        const name = line.slice(i, end);
        let k = end;
        while (k < line.length && (line.charAt(k) === ' ' || line.charAt(k) === '\t')) k += 1;
        if (line.charAt(k) === '=') frHlPush(out, 'attr', name);
        else frHlPush(out, 'plain', name);
        i = end;
        continue;
      }
      let end = i + 1;
      while (end < line.length && !frHlHtmlTagSpecial(line.charAt(end))) end += 1;
      frHlPush(out, 'plain', line.slice(i, end));
      i = end;
      continue;
    }
    let end = i + 1;
    while (end < line.length && line.charAt(end) !== '<') end += 1;
    frHlPush(out, 'plain', line.slice(i, end));
    i = end;
  }

  return frHlFinish(out, line);
}

/* --------------------------------------------------------------------------
 * Markdown
 * -------------------------------------------------------------------------- */

function frHlScanMdInline(out, line, start) {
  let i = start;
  while (i < line.length) {
    const ch = line.charAt(i);
    if (ch === '`') {
      const close = line.indexOf('`', i + 1);
      if (close < 0) {
        frHlPush(out, 'string', line.slice(i));
        return;
      }
      frHlPush(out, 'string', line.slice(i, close + 1));
      i = close + 1;
      continue;
    }
    if ((ch === '*' && line.charAt(i + 1) === '*') || (ch === '_' && line.charAt(i + 1) === '_')) {
      const marker = ch + ch;
      const close = line.indexOf(marker, i + 2);
      if (close < 0) {
        frHlPush(out, 'punct', marker);
        i += 2;
        continue;
      }
      frHlPush(out, 'punct', marker);
      frHlPush(out, 'type', line.slice(i + 2, close));
      frHlPush(out, 'punct', marker);
      i = close + 2;
      continue;
    }
    let end = i + 1;
    while (
      end < line.length
      && line.charAt(end) !== '`'
      && line.charAt(end) !== '*'
      && line.charAt(end) !== '_'
    ) {
      end += 1;
    }
    frHlPush(out, 'plain', line.slice(i, end));
    i = end;
  }
}

function frHlLineMd(line, state) {
  const fence = /^ {0,3}(?:```|~~~)/;
  if (state.fence) {
    if (fence.test(line)) {
      state.fence = false;
      return [{ k: 'punct', v: line }];
    }
    return [{ k: 'comment', v: line }];
  }
  if (fence.test(line)) {
    state.fence = true;
    return [{ k: 'punct', v: line }];
  }

  const heading = /^( {0,3})(#{1,6}) /.exec(line);
  if (heading) {
    const out = [];
    frHlPush(out, 'plain', heading[1]);
    frHlPush(out, 'punct', heading[2]);
    /* The heading keyword starts at the space right after the '#' run. */
    frHlPush(out, 'keyword', line.slice(heading[1].length + heading[2].length));
    return frHlFinish(out, line);
  }

  const bullet = /^( {0,3})([-*+]|\d{1,3}[.)]) /.exec(line);
  if (bullet) {
    const out = [];
    frHlPush(out, 'plain', bullet[1]);
    frHlPush(out, 'punct', bullet[2] + ' ');
    frHlScanMdInline(out, line, bullet[0].length);
    return frHlFinish(out, line);
  }

  const out = [];
  frHlScanMdInline(out, line, 0);
  return frHlFinish(out, line);
}

/* --------------------------------------------------------------------------
 * Hash-comment languages (Python, Ruby, shell, YAML, TOML, INI, ...)
 * -------------------------------------------------------------------------- */

function frHlHashSpecial(ch) {
  if (ch === '#' || ch === '"' || ch === "'" || ch === '.' || ch === '-') return true;
  return frHlIsIdentStart(ch) || frHlIsDigit(ch);
}

function frHlLineHash(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    const ch = line.charAt(i);
    const next = i + 1 < line.length ? line.charAt(i + 1) : '';
    if (ch === '#') {
      frHlPush(out, 'comment', line.slice(i));
      break;
    }
    if (ch === '"' || ch === "'") {
      const end = frHlReadString(line, i, ch, true);
      frHlPush(out, 'string', line.slice(i, end));
      i = end;
      continue;
    }
    if (frHlIsDigit(ch) || (ch === '.' && frHlIsDigit(next))) {
      const end = frHlReadNumber(line, i);
      frHlPush(out, 'number', line.slice(i, end));
      i = end;
      continue;
    }
    if (frHlIsIdentStart(ch)) {
      const end = frHlReadIdent(line, i, true);
      const word = line.slice(i, end);
      if (FR_HL_HASH_KEYWORDS[word] === 1) frHlPush(out, 'keyword', word);
      else if (line.charAt(end) === ':') frHlPush(out, 'attr', word);
      else frHlPush(out, 'plain', word);
      i = end;
      continue;
    }
    let end = i + 1;
    while (end < line.length && !frHlHashSpecial(line.charAt(end))) end += 1;
    frHlPush(out, 'plain', line.slice(i, end));
    i = end;
  }
  return frHlFinish(out, line);
}

/* --------------------------------------------------------------------------
 * SQL
 * -------------------------------------------------------------------------- */

function frHlSqlSpecial(ch) {
  if (ch === '"' || ch === "'" || ch === '`' || ch === '-' || ch === '/') return true;
  if (frHlIsIdentStart(ch) || frHlIsDigit(ch)) return true;
  return FR_HL_SQL_PUNCT.indexOf(ch) >= 0;
}

function frHlLineSql(line, state) {
  const out = [];
  let i = 0;

  if (state.block === 'sql') {
    const close = line.indexOf('*/');
    if (close < 0) {
      out.push({ k: 'comment', v: line });
      return out;
    }
    frHlPush(out, 'comment', line.slice(0, close + 2));
    state.block = '';
    i = close + 2;
  }

  while (i < line.length) {
    const ch = line.charAt(i);
    const next = i + 1 < line.length ? line.charAt(i + 1) : '';
    if (ch === '-' && next === '-') {
      frHlPush(out, 'comment', line.slice(i));
      break;
    }
    if (ch === '/' && next === '*') {
      const close = line.indexOf('*/', i + 2);
      if (close < 0) {
        frHlPush(out, 'comment', line.slice(i));
        state.block = 'sql';
        break;
      }
      frHlPush(out, 'comment', line.slice(i, close + 2));
      i = close + 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = frHlReadString(line, i, ch, true);
      frHlPush(out, 'string', line.slice(i, end));
      i = end;
      continue;
    }
    if (frHlIsDigit(ch) || (ch === '.' && frHlIsDigit(next))) {
      const end = frHlReadNumber(line, i);
      frHlPush(out, 'number', line.slice(i, end));
      i = end;
      continue;
    }
    if (frHlIsIdentStart(ch)) {
      const end = frHlReadIdent(line, i, false);
      const word = line.slice(i, end);
      if (FR_HL_SQL_KEYWORDS[word.toUpperCase()] === 1) frHlPush(out, 'keyword', word);
      else frHlPush(out, 'plain', word);
      i = end;
      continue;
    }
    if (FR_HL_SQL_PUNCT.indexOf(ch) >= 0) {
      let end = i + 1;
      while (end < line.length) {
        const c = line.charAt(end);
        if (FR_HL_SQL_PUNCT.indexOf(c) < 0) break;
        if (c === '-' && line.charAt(end + 1) === '-') break;
        if (c === '/' && line.charAt(end + 1) === '*') break;
        end += 1;
      }
      frHlPush(out, 'punct', line.slice(i, end));
      i = end;
      continue;
    }
    let end = i + 1;
    while (end < line.length && !frHlSqlSpecial(line.charAt(end))) end += 1;
    frHlPush(out, 'plain', line.slice(i, end));
    i = end;
  }

  return frHlFinish(out, line);
}

/* --------------------------------------------------------------------------
 * Unified diff
 * -------------------------------------------------------------------------- */

function frHlLineDiff(line) {
  if (/^(?:\+\+\+|---|@@)/.test(line)) return [{ k: 'keyword', v: line }];
  const head = line.charAt(0);
  if (head === '+') return [{ k: 'string', v: line }];
  if (head === '-') return [{ k: 'comment', v: line }];
  return [{ k: 'plain', v: line }];
}

/* --------------------------------------------------------------------------
 * Public entry points
 * -------------------------------------------------------------------------- */

/* Lower-case the basename's extension and map it to a language id. */
function frDetectLanguage(path) {
  const source = path == null ? '' : String(path);
  const cut = Math.max(source.lastIndexOf('/'), source.lastIndexOf('\\'));
  const base = (cut >= 0 ? source.slice(cut + 1) : source).toLowerCase();
  const dot = base.lastIndexOf('.');
  const ext = dot >= 0 ? base.slice(dot + 1) : base;
  const language = FR_HL_LANG_BY_EXT[ext];
  return typeof language === 'string' ? language : 'plain';
}

/* One token array per input line (same order and length). */
function frHighlightLines(lines, lang) {
  const input = Array.isArray(lines) ? lines : [];
  const key = typeof lang === 'string' ? lang.toLowerCase() : '';
  const language = FR_HL_LANGS[key] === 1 ? key : 'plain';
  const state = { block: '', fence: false };
  const result = [];
  for (let i = 0; i < input.length; i += 1) {
    const line = input[i] == null ? '' : String(input[i]);
    let tokens;
    if (language === 'js') tokens = frHlLineJs(line, state);
    else if (language === 'json') tokens = frHlLineJson(line);
    else if (language === 'css') tokens = frHlLineCss(line, state);
    else if (language === 'html') tokens = frHlLineHtml(line, state);
    else if (language === 'md') tokens = frHlLineMd(line, state);
    else if (language === 'hash') tokens = frHlLineHash(line);
    else if (language === 'sql') tokens = frHlLineSql(line, state);
    else if (language === 'diff') tokens = frHlLineDiff(line);
    else tokens = [{ k: 'plain', v: line }];
    result.push(tokens);
  }
  return result;
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
