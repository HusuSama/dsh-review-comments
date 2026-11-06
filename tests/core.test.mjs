/* dsh-file-review — unit tests for src/client.core.js.
 *
 * Run from the plugin directory:
 *   node --test tests/core.test.mjs
 *
 * The core module is a plain-script fragment that the build concatenates into one
 * factory closure, so the tests read it as text and evaluate it with `new Function`
 * (no bundler, no dependencies).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORE_PATH = path.join(HERE, '..', 'src', 'client.core.js');
const VENDOR_PATH = path.join(HERE, '..', 'src', 'vendor', 'prism.min.js');
const CORE_SOURCE = readFileSync(CORE_PATH, 'utf8');
const VENDOR_SOURCE = readFileSync(VENDOR_PATH, 'utf8');

const CORE_NAMES = [
  'FR_TYPE_ID',
  'FR_NS',
  'FR_PAGE_LINES',
  'FR_MAX_LINES',
  'FR_QUOTE_LINES',
  'frJoinPath',
  'frDirName',
  'frBaseName',
  'frRelativePath',
  'frLineLabel',
  'frMakeComment',
  'frSortComments',
  'frCountByPath',
  'frFormatReviewMessage',
  'frInterpolate',
  'FR_HL_MAX_LINES',
  'frDetectLanguage',
  'frHighlightLines',
  'frNormalizeGitStatus',
  'frGitKind',
  'frGitMarkKind',
  'frGroupChangedFiles',
  'FR_SEARCH_SKIP_DIRS',
  'frSearchNormalize',
  'frSearchScore',
  'frSearchMatches',
  'frSearchSkipDir',
  'frGroupSearchResults',
];

/* The core fragment now depends on the vendored Prism const (FR_PRISM), which the
 * build concatenates into the same factory scope before the fragment, so the test
 * harness evaluates the vendor source first. */
const CORE_RETURN = '\nreturn { ' + CORE_NAMES.join(', ') + ' };\n';
const core = new Function(VENDOR_SOURCE + '\n' + CORE_SOURCE + CORE_RETURN)();
/* Core without the vendor proves the absent-FR_PRISM fallback path. */
const coreWithoutVendor = new Function(CORE_SOURCE + CORE_RETURN)();
/* The vendored Prism itself, for grammar-existence checks. */
const FR_PRISM_REF = new Function(VENDOR_SOURCE + '\nreturn FR_PRISM;\n')();

/* ------------------------------------------------------------------------- */
/* Locale stub                                                                */
/* ------------------------------------------------------------------------- */

/* The formatter only knows the shared locale key 'send.intro' (Optimization pass 2
 * removed the quote/heading keys); the real dictionaries live in locale/*.json. */
const ZH = {
  'send.intro': '我在文件中留了 {count} 条评审评论，请按文件与行号逐条处理。',
};

function makeTr(calls) {
  return function tr(key, vars) {
    if (calls) calls.push({ key: key, vars: vars });
    const template = Object.prototype.hasOwnProperty.call(ZH, key) ? ZH[key] : key;
    return core.frInterpolate(template, vars || {});
  };
}

/* ------------------------------------------------------------------------- */
/* Contract sample (docs/CONTRACT.md, "Optimization pass 2" section A)        */
/* ------------------------------------------------------------------------- */

const SAMPLE_INTRO = '我在文件中留了 3 条评审评论，请按文件与行号逐条处理。';

function introFor(count) {
  return core.frInterpolate(ZH['send.intro'], { count });
}

/* Each list item exactly as written in the contract sample (path#anchor + text).
 * The full message sorts items by path (frSortComments), so README.md's item is
 * emitted first; see the ordering note in the core-lib report. */
const CONTRACT_SAMPLE_ITEMS = [
  '`/abs/path/src/a.ts#12` 这里没有处理 null 情况',
  '`/abs/path/src/a.ts#20:24` 这段逻辑可以提取为函数',
  '`/abs/path/README.md#5` 标题需要说明用途',
];

const SAMPLE_MESSAGE = SAMPLE_INTRO + '\n\n' + [
  '1. `/abs/path/README.md#5` 标题需要说明用途',
  '2. `/abs/path/src/a.ts#12` 这里没有处理 null 情况',
  '3. `/abs/path/src/a.ts#20:24` 这段逻辑可以提取为函数',
].join('\n');

function sampleComments() {
  return [
    {
      id: 's1',
      path: '/abs/path/src/a.ts',
      startLine: 12,
      endLine: 12,
      text: '这里没有处理 null 情况',
      quote: ['const value = parse(input)'],
      createdAt: 1,
    },
    {
      id: 's2',
      path: '/abs/path/src/a.ts',
      startLine: 20,
      endLine: 24,
      text: '这段逻辑可以提取为函数',
      quote: ['if (a) {', '  b()', '}', '  c()', '}'],
      createdAt: 2,
    },
    {
      id: 's3',
      path: '/abs/path/README.md',
      startLine: 5,
      endLine: 5,
      text: '标题需要说明用途',
      quote: [],
      createdAt: 3,
    },
  ];
}

/* ------------------------------------------------------------------------- */
/* 0. Module shape                                                            */
/* ------------------------------------------------------------------------- */

describe('module contract', () => {
  test('exposes every required constant with the specified value', () => {
    assert.equal(core.FR_TYPE_ID, 'dsh-review-comments');
    assert.equal(core.FR_NS, 'fileReview');
    assert.equal(core.FR_PAGE_LINES, 2000);
    assert.equal(core.FR_MAX_LINES, 20000);
    assert.equal(core.FR_QUOTE_LINES, 3);
    assert.equal(core.FR_HL_MAX_LINES, 5000);
    assert.deepEqual(core.FR_SEARCH_SKIP_DIRS, ['node_modules', '.git', '.svn', '.hg']);
    assert.ok(Object.isFrozen(core.FR_SEARCH_SKIP_DIRS));
  });

  test('exposes every required helper as a function', () => {
    const helpers = [
      'frJoinPath',
      'frDirName',
      'frBaseName',
      'frRelativePath',
      'frLineLabel',
      'frMakeComment',
      'frSortComments',
      'frCountByPath',
      'frFormatReviewMessage',
      'frInterpolate',
      'frDetectLanguage',
      'frHighlightLines',
      'frNormalizeGitStatus',
      'frGitKind',
      'frGitMarkKind',
      'frGroupChangedFiles',
      'frSearchNormalize',
      'frSearchScore',
      'frSearchMatches',
      'frSearchSkipDir',
      'frGroupSearchResults',
    ];
    for (const name of helpers) {
      assert.equal(typeof core[name], 'function', name + ' must be a function');
    }
  });

  test('source is a plain-script fragment (no module syntax / React / DOM)', () => {
    assert.doesNotMatch(CORE_SOURCE, /^\s*(?:import|export)\b/m);
    assert.doesNotMatch(CORE_SOURCE, /^return\b/m);
    assert.doesNotMatch(CORE_SOURCE, /\b(?:document|window|React|createElement)\s*[.(]/);
  });
});

/* ------------------------------------------------------------------------- */
/* 1. Path helpers                                                            */
/* ------------------------------------------------------------------------- */

describe('path helpers', () => {
  test('frJoinPath joins with / and strips trailing separators', () => {
    assert.equal(core.frJoinPath('', 'a'), 'a');
    assert.equal(core.frJoinPath(null, 'a'), 'a');
    assert.equal(core.frJoinPath(undefined, 'a'), 'a');
    assert.equal(core.frJoinPath('a', 'b'), 'a/b');
    assert.equal(core.frJoinPath('a/b', 'c'), 'a/b/c');
    assert.equal(core.frJoinPath('a/', 'b'), 'a/b');
    assert.equal(core.frJoinPath('a\\', 'b'), 'a/b');
    assert.equal(core.frJoinPath('a\\\\', 'b'), 'a/b');
    assert.equal(core.frJoinPath('a/b/', 'c'), 'a/b/c');
    assert.equal(core.frJoinPath('/', 'a'), '/a');
    assert.equal(core.frJoinPath('///', 'a'), '/a');
    assert.equal(core.frJoinPath('C:\\', 'a'), 'C:/a');
    // Only trailing separators are stripped; interior separators are kept as-is and
    // the join separator is always '/'.
    assert.equal(core.frJoinPath('C:\\Users', 'a.txt'), 'C:\\Users/a.txt');
    assert.equal(core.frJoinPath(core.frJoinPath('a', 'b'), 'c'), 'a/b/c');
  });

  test('frJoinPath with an empty name keeps the trailing separator', () => {
    assert.equal(core.frJoinPath('a/b', ''), 'a/b/');
    assert.equal(core.frJoinPath('', ''), '');
  });

  test('frDirName returns the parent directory', () => {
    assert.equal(core.frDirName('a/b/c'), 'a/b');
    assert.equal(core.frDirName('a/b/'), 'a/b');
    assert.equal(core.frDirName('a//b'), 'a');
    assert.equal(core.frDirName('/a/b'), '/a');
    assert.equal(core.frDirName('a'), '');
    assert.equal(core.frDirName(''), '');
    assert.equal(core.frDirName(null), '');
    assert.equal(core.frDirName('C:\\Users\\a.txt'), 'C:\\Users');
    assert.equal(core.frDirName('C:\\Users\\a\\b.ts'), 'C:\\Users\\a');
  });

  test('frDirName returns "" for roots', () => {
    assert.equal(core.frDirName('/'), '');
    assert.equal(core.frDirName('/a'), '');
    assert.equal(core.frDirName('C:\\'), '');
    assert.equal(core.frDirName('C:'), '');
    assert.equal(core.frDirName('C:/'), '');
  });

  test('frBaseName returns the last segment', () => {
    assert.equal(core.frBaseName('a/b/c'), 'c');
    assert.equal(core.frBaseName('/a'), 'a');
    assert.equal(core.frBaseName('C:\\Users\\a.txt'), 'a.txt');
    assert.equal(core.frBaseName('a'), 'a');
    assert.equal(core.frBaseName(''), '');
    assert.equal(core.frBaseName(null), '');
    assert.equal(core.frBaseName('/'), '');
    assert.equal(core.frBaseName('C:\\'), '');
    // A trailing separator means the last segment is empty (split semantics).
    assert.equal(core.frBaseName('a/b/'), '');
  });

  test('frRelativePath strips the root and always returns / separators', () => {
    assert.equal(core.frRelativePath('', 'src/a.ts'), 'src/a.ts');
    assert.equal(core.frRelativePath('', ''), '');
    assert.equal(core.frRelativePath('/ws', '/ws'), '');
    assert.equal(core.frRelativePath('/ws', '/ws/'), '');
    assert.equal(core.frRelativePath('/ws/', '/ws/src/a.ts'), 'src/a.ts');
    assert.equal(core.frRelativePath('/ws', '/ws/src/a.ts'), 'src/a.ts');
    assert.equal(core.frRelativePath('C:\\ws', 'C:\\ws\\a\\b.txt'), 'a/b.txt');
    assert.equal(core.frRelativePath('C:\\ws\\', 'C:\\ws\\a'), 'a');
    assert.equal(core.frRelativePath('src', 'src\\a\\b'), 'a/b');
    assert.equal(core.frRelativePath('/', '/a/b'), 'a/b');
    assert.equal(core.frRelativePath('', 'a\\b'), 'a/b');
  });

  test('frRelativePath leaves paths outside the root unchanged', () => {
    assert.equal(core.frRelativePath('/ws', '/wsx/a.ts'), '/wsx/a.ts');
    assert.equal(core.frRelativePath('/ws', 'src/a.ts'), 'src/a.ts');
    assert.equal(core.frRelativePath('/ws', '/other/ws/a.ts'), '/other/ws/a.ts');
    assert.equal(core.frRelativePath('C:\\ws', 'D:\\ws\\a'), 'D:/ws/a');
    // A prefix that is not on a path boundary is not "under" the root.
    assert.equal(core.frRelativePath('/work', '/workspace/a'), '/workspace/a');
  });
});

/* ------------------------------------------------------------------------- */
/* 2. frLineLabel                                                             */
/* ------------------------------------------------------------------------- */

describe('frLineLabel', () => {
  test('single line and ranges', () => {
    assert.equal(core.frLineLabel(12, 12), 'L12');
    assert.equal(core.frLineLabel(20, 24), 'L20-L24');
    assert.equal(core.frLineLabel(1, 1), 'L1');
    assert.equal(core.frLineLabel(7, 8), 'L7-L8');
  });

  test('missing end line means a single line', () => {
    assert.equal(core.frLineLabel(12), 'L12');
    assert.equal(core.frLineLabel(12, null), 'L12');
    assert.equal(core.frLineLabel(12, undefined), 'L12');
  });
});

/* ------------------------------------------------------------------------- */
/* 3. frMakeComment                                                           */
/* ------------------------------------------------------------------------- */

describe('frMakeComment', () => {
  test('returns the documented comment shape', () => {
    const comment = core.frMakeComment({
      path: 'src/a.ts',
      startLine: 4,
      endLine: 9,
      text: 'needs a guard',
      quote: ['one', 'two'],
    });
    assert.equal(typeof comment.id, 'string');
    assert.ok(comment.id.startsWith('c'));
    assert.equal(comment.path, 'src/a.ts');
    assert.equal(comment.startLine, 4);
    assert.equal(comment.endLine, 9);
    assert.equal(comment.text, 'needs a guard');
    assert.deepEqual(comment.quote, ['one', 'two']);
    assert.equal(typeof comment.createdAt, 'number');
    assert.ok(comment.createdAt > 0);
  });

  test('endLine defaults to startLine and quote defaults to []', () => {
    const comment = core.frMakeComment({ path: 'a.ts', startLine: 3 });
    assert.equal(comment.endLine, 3);
    assert.deepEqual(comment.quote, []);
    assert.equal(comment.text, '');
  });

  test('copies the quote array (no aliasing)', () => {
    const quote = ['alpha', 'beta'];
    const comment = core.frMakeComment({ path: 'a.ts', startLine: 1, endLine: 2, quote });
    assert.notStrictEqual(comment.quote, quote);
    quote.push('gamma');
    quote[0] = 'changed';
    assert.deepEqual(comment.quote, ['alpha', 'beta']);
  });

  test('caps the quote at FR_QUOTE_LINES raw lines', () => {
    const quote = ['1', '2', '3', '4', '5'];
    const comment = core.frMakeComment({ path: 'a.ts', startLine: 1, endLine: 5, quote });
    assert.equal(comment.quote.length, core.FR_QUOTE_LINES);
    assert.deepEqual(comment.quote, ['1', '2', '3']);
  });

  test('ids are unique even for many comments in a tight loop', () => {
    const ids = new Set();
    for (let i = 0; i < 300; i += 1) {
      ids.add(core.frMakeComment({ path: 'a.ts', startLine: i + 1 }).id);
    }
    assert.equal(ids.size, 300);
  });
});

/* ------------------------------------------------------------------------- */
/* 4. frSortComments                                                          */
/* ------------------------------------------------------------------------- */

describe('frSortComments', () => {
  test('orders by path, then startLine, then createdAt', () => {
    const comments = [
      { id: 'd', path: 'b.ts', startLine: 1, createdAt: 1 },
      { id: 'c', path: 'a.ts', startLine: 20, createdAt: 1 },
      { id: 'b', path: 'a.ts', startLine: 3, createdAt: 2 },
      { id: 'a', path: 'a.ts', startLine: 3, createdAt: 1 },
    ];
    const sorted = core.frSortComments(comments);
    assert.deepEqual(sorted.map((c) => c.id), ['a', 'b', 'c', 'd']);
  });

  test('sorts lines numerically, not lexicographically', () => {
    const sorted = core.frSortComments([
      { id: 'ten', path: 'a.ts', startLine: 10, createdAt: 1 },
      { id: 'two', path: 'a.ts', startLine: 2, createdAt: 1 },
    ]);
    assert.deepEqual(sorted.map((c) => c.id), ['two', 'ten']);
  });

  test('returns a new array and does not mutate the input', () => {
    const comments = [
      { id: 'b', path: 'b.ts', startLine: 1, createdAt: 1 },
      { id: 'a', path: 'a.ts', startLine: 1, createdAt: 1 },
    ];
    const sorted = core.frSortComments(comments);
    assert.notStrictEqual(sorted, comments);
    assert.deepEqual(comments.map((c) => c.id), ['b', 'a']);
    assert.deepEqual(sorted.map((c) => c.id), ['a', 'b']);
  });

  test('handles empty and non-array input', () => {
    assert.deepEqual(core.frSortComments([]), []);
    assert.deepEqual(core.frSortComments(null), []);
    assert.deepEqual(core.frSortComments(undefined), []);
  });
});

/* ------------------------------------------------------------------------- */
/* 5. frCountByPath                                                           */
/* ------------------------------------------------------------------------- */

describe('frCountByPath', () => {
  test('counts comments per path in a plain object', () => {
    const counts = core.frCountByPath([
      { path: 'a.ts' },
      { path: 'b.ts' },
      { path: 'a.ts' },
      { path: 'a.ts' },
    ]);
    assert.deepEqual(counts, { 'a.ts': 3, 'b.ts': 1 });
    assert.equal(Object.getPrototypeOf(counts), Object.prototype);
  });

  test('empty and non-array input yield {}', () => {
    assert.deepEqual(core.frCountByPath([]), {});
    assert.deepEqual(core.frCountByPath(null), {});
  });

  test('does not mutate the comments array', () => {
    const comments = [{ path: 'a.ts' }, { path: 'a.ts' }];
    core.frCountByPath(comments);
    assert.deepEqual(comments, [{ path: 'a.ts' }, { path: 'a.ts' }]);
  });
});

/* ------------------------------------------------------------------------- */
/* 6. frInterpolate                                                           */
/* ------------------------------------------------------------------------- */

describe('frInterpolate', () => {
  test('replaces named placeholders', () => {
    assert.equal(core.frInterpolate('hello {name}!', { name: 'world' }), 'hello world!');
    assert.equal(core.frInterpolate('{a} + {b} = {a}', { a: 1, b: 2 }), '1 + 2 = 1');
    assert.equal(core.frInterpolate('{count} files', { count: 0 }), '0 files');
    assert.equal(core.frInterpolate('{value}', { value: 42 }), '42');
  });

  test('leaves unknown placeholders literal', () => {
    assert.equal(core.frInterpolate('hi {name}', {}), 'hi {name}');
    assert.equal(core.frInterpolate('{a} and {missing}', { a: 'x' }), 'x and {missing}');
    assert.equal(core.frInterpolate('no placeholders', { a: 'x' }), 'no placeholders');
  });

  test('tolerates missing vars and special replacement characters', () => {
    assert.equal(core.frInterpolate('{a}', null), '{a}');
    assert.equal(core.frInterpolate('$& {a}', { a: '$&' }), '$& $&');
    assert.equal(core.frInterpolate('{a}', { a: '' }), '');
    assert.equal(core.frInterpolate(null, { a: 1 }), '');
  });
});

/* ------------------------------------------------------------------------- */
/* 7. frFormatReviewMessage                                                   */
/* ------------------------------------------------------------------------- */

describe('frFormatReviewMessage', () => {
  test('empty input formats to the empty string', () => {
    assert.equal(core.frFormatReviewMessage([], makeTr()), '');
    assert.equal(core.frFormatReviewMessage(null, makeTr()), '');
    assert.equal(core.frFormatReviewMessage(undefined, makeTr()), '');
  });

  test('formats the contract 3-comment / 2-file sample exactly', () => {
    const message = core.frFormatReviewMessage(sampleComments(), makeTr());
    assert.equal(message, SAMPLE_MESSAGE);
    // Intro, one blank line, then the ordered list; no trailing newline.
    assert.ok(message.startsWith(SAMPLE_INTRO + '\n\n'));
    assert.equal(message.split('\n\n').length, 2);
    assert.equal((message.match(/^\d+\. /gm) || []).length, 3);
    assert.ok(!message.endsWith('\n'));
    // Each list item is byte-identical to the contract sample's items (only the
    // order differs: frSortComments sorts by path, so README.md's item is first).
    for (const item of CONTRACT_SAMPLE_ITEMS) {
      assert.ok(message.includes(item), item);
    }
  });

  test('single-line anchor is #line, range anchor is #start:end', () => {
    assert.equal(
      core.frFormatReviewMessage([
        { path: '/p/a.ts', startLine: 7, endLine: 7, text: 'single' },
      ], makeTr()),
      introFor(1) + '\n\n1. `/p/a.ts#7` single',
    );
    assert.equal(
      core.frFormatReviewMessage([
        { path: '/p/a.ts', startLine: 20, endLine: 24, text: 'range' },
      ], makeTr()),
      introFor(1) + '\n\n1. `/p/a.ts#20:24` range',
    );
  });

  test('a missing endLine is a single-line anchor', () => {
    const message = core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 9, text: 'no end' },
    ], makeTr());
    assert.ok(message.endsWith('1. `/p/a.ts#9` no end'));
  });

  test('orders items by path, then startLine, then createdAt', () => {
    const message = core.frFormatReviewMessage([
      { path: '/p/b.ts', startLine: 9, endLine: 9, text: 'b9', createdAt: 3 },
      { path: '/p/a.ts', startLine: 20, endLine: 20, text: 'a20', createdAt: 2 },
      { path: '/p/a.ts', startLine: 3, endLine: 4, text: 'a3', createdAt: 1 },
      { path: '/p/a.ts', startLine: 3, endLine: 4, text: 'a3-later', createdAt: 5 },
    ], makeTr());
    assert.equal(message, introFor(4) + '\n\n' + [
      '1. `/p/a.ts#3:4` a3',
      '2. `/p/a.ts#3:4` a3-later',
      '3. `/p/a.ts#20` a20',
      '4. `/p/b.ts#9` b9',
    ].join('\n'));
  });

  test('orders by createdAt when path and line are equal', () => {
    const message = core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 1, endLine: 1, text: 'later', createdAt: 20 },
      { path: '/p/a.ts', startLine: 1, endLine: 1, text: 'earlier', createdAt: 10 },
    ], makeTr());
    assert.ok(message.indexOf('earlier') < message.indexOf('later'));
  });

  test('multi-line comment text keeps newlines and indents continuations by three spaces', () => {
    const message = core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 4, endLine: 4, text: 'first\nsecond\nthird' },
    ], makeTr());
    assert.equal(message, introFor(1) + '\n\n1. `/p/a.ts#4` first\n   second\n   third');
    // Existing leading whitespace on a continuation is kept after the indent.
    const indented = core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 1, endLine: 1, text: 'first\n  indented' },
    ], makeTr());
    assert.ok(indented.endsWith('` first\n     indented'));
    // Blank continuation lines are still prefixed (literal "every continuation line").
    const blank = core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 1, endLine: 1, text: 'first\n\nthird' },
    ], makeTr());
    assert.ok(blank.endsWith('` first\n   \n   third'));
  });

  test('CR is stripped from the comment text', () => {
    const message = core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 1, endLine: 1, text: 'first\r\nsecond\r' },
    ], makeTr());
    assert.equal(message, introFor(1) + '\n\n1. `/p/a.ts#1` first\n   second');
    assert.ok(!message.includes('\r'));
  });

  test('trailing whitespace of the whole text is trimmed', () => {
    assert.ok(core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 1, endLine: 1, text: 'note   ' },
    ], makeTr()).endsWith('1. `/p/a.ts#1` note'));
    assert.ok(core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 1, endLine: 1, text: 'note\n\n' },
    ], makeTr()).endsWith('1. `/p/a.ts#1` note'));
    // All-whitespace text becomes empty: the item ends after the closing backtick.
    assert.ok(core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 1, endLine: 1, text: '   ' },
    ], makeTr()).endsWith('1. `/p/a.ts#1`'));
  });

  test('empty text ends the item after the closing backtick', () => {
    const message = core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 3, endLine: 3, text: '' },
    ], makeTr());
    assert.equal(message, introFor(1) + '\n\n1. `/p/a.ts#3`');
  });

  test('the stored absolute path is emitted unchanged', () => {
    const message = core.frFormatReviewMessage([
      { path: 'C:\\work dir\\a.ts', startLine: 7, endLine: 7, text: 'win' },
    ], makeTr());
    assert.ok(message.includes('`C:\\work dir\\a.ts#7` win'));
  });

  test('only send.intro is translated (no excerpt/heading keys)', () => {
    const calls = [];
    core.frFormatReviewMessage(sampleComments(), makeTr(calls));
    assert.deepEqual(calls.map((call) => call.key), ['send.intro']);
    assert.deepEqual(calls[0].vars, { count: 3 });
  });

  test('no source excerpts, fences or old headings leak into the message', () => {
    const message = core.frFormatReviewMessage(sampleComments(), makeTr());
    // Quote lines stored on the comments must never appear.
    for (const excerpt of [
      'const value = parse(input)',
      'if (a) {',
      '  b()',
      '引用',
      '引用（',
      '…',
      '```',
      '**文件',
      'L12',
      'L20-L24',
    ]) {
      assert.ok(!message.includes(excerpt), 'must not include excerpt: ' + excerpt);
    }
    assert.ok(!/^- /m.test(message), 'old bullet format must be gone');
    // Only the path#anchor reference is code-formatted (3 items -> 6 backticks).
    assert.equal((message.match(/`/g) || []).length, 6);
  });

  test('does not mutate the comments or their quotes', () => {
    const comments = sampleComments();
    const snapshot = JSON.stringify(comments);
    const message = core.frFormatReviewMessage(comments, makeTr());
    assert.ok(message.length > 0);
    assert.equal(JSON.stringify(comments), snapshot);
  });

  test('falls back to the raw intro key when no translator is supplied', () => {
    const message = core.frFormatReviewMessage([
      { path: '/p/a.ts', startLine: 1, endLine: 1, text: 'x' },
    ]);
    assert.ok(message.startsWith('send.intro'));
    assert.ok(message.includes('1. `/p/a.ts#1` x'));
  });
});

/* ========================================================================= */
/* Optimization pass 7: Prism-based syntax highlighting                       */
/* ========================================================================= */

const TOKEN_KINDS = [
  'plain',
  'comment',
  'string',
  'number',
  'keyword',
  'func',
  'type',
  'punct',
  'tag',
  'attr',
];

/* Prism language ids used by the detection table (all present in the vendor). */
const PRISM_IDS = [
  'javascript',
  'jsx',
  'typescript',
  'tsx',
  'json',
  'css',
  'markup',
  'markdown',
  'python',
  'bash',
  'yaml',
  'toml',
  'ini',
  'sql',
  'diff',
  'go',
  'rust',
  'java',
];

function joinTokens(tokens) {
  return tokens.map((token) => token.v).join('');
}

function tok(line, lang) {
  return core.frHighlightLines([line], lang)[0];
}

function kindValues(tokens, kind) {
  return tokens.filter((token) => token.k === kind).map((token) => token.v);
}

function lineText(value) {
  return value == null ? '' : String(value);
}

/* Assert the highlighter invariant: token shape/kinds, exact per-line text,
 * non-empty values and merged adjacent same-kind tokens. */
function assertHighlightInvariant(lines, lang, impl) {
  const target = impl || core;
  const tokens = target.frHighlightLines(lines, lang);
  assert.equal(tokens.length, lines.length, lang + ': one array per line');
  for (let index = 0; index < lines.length; index += 1) {
    const expected = lineText(lines[index]);
    const lineTokens = tokens[index];
    assert.ok(Array.isArray(lineTokens), lang + ' line ' + (index + 1) + ': token array');
    let joined = '';
    for (let t = 0; t < lineTokens.length; t += 1) {
      const token = lineTokens[t];
      assert.deepEqual(Object.keys(token).sort(), ['k', 'v'], 'token has exactly { k, v }');
      assert.ok(TOKEN_KINDS.includes(token.k), 'allowed token kind: ' + token.k);
      assert.equal(typeof token.v, 'string');
      assert.ok(
        token.v.length > 0 || (lineTokens.length === 1 && expected === ''),
        'empty token value only for a single-token empty line',
      );
      if (t > 0) {
        assert.notEqual(lineTokens[t - 1].k, token.k, 'adjacent same-kind tokens merged');
      }
      joined += token.v;
    }
    assert.equal(joined, expected, lang + ' line ' + (index + 1) + ': exact source text');
  }
  return tokens;
}

/* Realistic multi-line samples for every language id the UI can produce. */
const HL_SAMPLES = {
  javascript: [
    'const value = parse("x", 42); // note',
    '/* block comment',
    'still inside',
    'ends */ class Foo extends Bar {',
    '  static readonly MAX = 0xFF;',
    '  async load(input = null) {',
    '    return `template ${input}`;',
    '  }',
    '}',
    '',
    'function make(id) {',
    '  if (!id) throw new Error("missing");',
    '  return id;',
    '}',
    'const broken = "unterminated',
  ],
  jsx: [
    'const App = () => (',
    '  <div className="app">',
    '    {items.map((item) => <span key={item.id}>{item.name}</span>)}',
    '  </div>',
    ');',
    'export default App;',
  ],
  typescript: [
    'import type { X } from "./x";',
    'export interface User { id: number; name?: string; }',
    'type Id = string | number;',
    'const user: User = { id: 1 };',
    '@Component({ selector: "app", template: "<div></div>" })',
    'export class Foo<T> implements Bar { private x: T; }',
    'enum Color { Red = 1, Green = 2 }',
    '/* open',
    'still',
  ],
  tsx: [
    'const App = () => (',
    '  <div className="app">',
    '    {items.map((item) => <span key={item.id}>{item.name}</span>)}',
    '  </div>',
    ');',
    'const n: number = 1;',
  ],
  json: [
    '{',
    '  "a": 1,',
    '  "b": [true, false, null],',
    '  "c": "x",',
    '  "url": "http://x",',
    '  "nested": { "k": -2.5e3 }',
    '}',
  ],
  css: [
    '/* comment',
    'still inside */',
    '.a-b, #id {',
    '  color: #fff;',
    '  margin: 0 auto;',
    '  content: "x";',
    '}',
    ':root { --custom-prop: 1px; }',
  ],
  markup: [
    '<!-- comment',
    'still',
    '-->',
    '<!DOCTYPE html>',
    '<div class="x" data-y=\'z\'>text</div>',
    '<input disabled>',
    '<br/>',
    '<script>var a = 1;</script>',
  ],
  markdown: [
    '# Title',
    '',
    '## Sub heading',
    '- item with `code` and **bold**',
    '1. numbered',
    '```js',
    'const x = 1;',
    '```',
    '> quote',
    '[link](https://x)',
    '<div>html</div>',
    'plain *italic*',
  ],
  python: [
    '#!/usr/bin/env python',
    '# comment',
    'def f(x):',
    '    return "s#not" # tail',
    'class Foo:',
    '    pass',
    '@decorator',
    'x = [1, 2]',
  ],
  bash: [
    '#!/bin/bash',
    '# comment',
    'echo "$VAR" ${Y}',
    'export PATH=/usr/bin',
    'if [ -f x ]; then',
    '  echo ok',
    'fi',
  ],
  yaml: [
    '# comment',
    'name: value',
    'list:',
    '  - one',
    '  - two',
    'nested:',
    '  key: "x"',
  ],
  toml: [
    '# comment',
    '[section]',
    'name = "value"',
    'count = 42',
    'enabled = true',
  ],
  ini: [
    '; comment',
    '[section]',
    'name=value',
    'flag=true',
  ],
  sql: [
    'SELECT * FROM t; -- note',
    '/* block',
    'still',
    '*/',
    "INSERT INTO t VALUES ('a', 2);",
    'SeLeCt id FROM users WHERE id = 1 ORDER BY id;',
  ],
  diff: [
    '--- a/file',
    '+++ b/file',
    '@@ -1 +1 @@',
    '-removed',
    '+added',
    ' context',
  ],
  go: [
    'package main',
    'import "fmt"',
    'func main() {',
    'fmt.Println("hi")',
    '}',
  ],
  rust: [
    'fn main() {',
    '    let x: i32 = 1;',
    '    println!("{}", x);',
    '}',
  ],
  java: [
    'import java.util.List;',
    'public class Foo {',
    '    private int x = 1;',
    '    public static void main(String[] a) {',
    '        System.out.println("hi");',
    '    }',
    '}',
  ],
  plain: ['anything <> {} // /**/', 'iVBORw0KGgo=', ''],
};

describe('frDetectLanguage (Prism ids)', () => {
  test('maps every documented extension to its Prism language id', () => {
    const table = {
      'a.js': 'javascript', 'a.mjs': 'javascript', 'a.cjs': 'javascript', 'a.json5': 'javascript',
      'a.jsx': 'jsx',
      'a.ts': 'typescript', 'a.mts': 'typescript', 'a.cts': 'typescript',
      'a.tsx': 'tsx',
      'a.json': 'json',
      'a.css': 'css', 'a.scss': 'css', 'a.less': 'css', 'a.sass': 'css',
      'a.html': 'markup', 'a.htm': 'markup', 'a.xml': 'markup', 'a.svg': 'markup',
      'a.vue': 'markup', 'a.svelte': 'markup',
      'a.md': 'markdown', 'a.markdown': 'markdown', 'a.mdx': 'markdown',
      'a.py': 'python', 'a.pyw': 'python',
      'a.sh': 'bash', 'a.bash': 'bash', 'a.zsh': 'bash', 'a.fish': 'bash',
      'a.yaml': 'yaml', 'a.yml': 'yaml',
      'a.toml': 'toml',
      'a.ini': 'ini', 'a.conf': 'ini', 'a.cfg': 'ini', 'a.properties': 'ini', 'a.env': 'ini',
      'a.sql': 'sql',
      'a.diff': 'diff', 'a.patch': 'diff',
      'a.go': 'go',
      'a.rs': 'rust',
      'a.java': 'java',
      'a.txt': 'plain', 'a.rb': 'plain', 'a.php': 'plain', 'a.tsv': 'plain',
      'README': 'plain', 'a': 'plain', 'a.': 'plain',
    };
    for (const name of Object.keys(table)) {
      assert.equal(core.frDetectLanguage(name), table[name], name);
    }
  });

  test('uses the basename and is case-insensitive', () => {
    assert.equal(core.frDetectLanguage('src/App.TSX'), 'tsx');
    assert.equal(core.frDetectLanguage('C:\\work\\a.CSS'), 'css');
    assert.equal(core.frDetectLanguage('/tmp/x.MD'), 'markdown');
    assert.equal(core.frDetectLanguage('dir.js/README'), 'plain');
    assert.equal(core.frDetectLanguage('dir/a.b/file.ts'), 'typescript');
    assert.equal(core.frDetectLanguage('.env'), 'ini');
    assert.equal(core.frDetectLanguage('conf/.env'), 'ini');
    assert.equal(core.frDetectLanguage('Dockerfile'), 'plain');
    assert.equal(core.frDetectLanguage('Makefile'), 'plain');
  });

  test('unknown, empty and hostile inputs fall back to plain', () => {
    for (const value of ['', null, undefined, 42, {}, [], 'a.constructor', 'a.__proto__', 'a.toString']) {
      assert.equal(core.frDetectLanguage(value), 'plain');
    }
  });

  test('every non-plain id has a grammar in the vendored Prism', () => {
    for (const id of PRISM_IDS) {
      assert.ok(FR_PRISM_REF.languages[id], 'missing Prism grammar: ' + id);
    }
  });
});

describe('frHighlightLines — Prism invariant', () => {
  for (const lang of Object.keys(HL_SAMPLES)) {
    test('keeps every line byte-for-byte: ' + lang, () => {
      assertHighlightInvariant(HL_SAMPLES[lang], lang);
    });
  }

  test('keeps oddly shaped lines for every Prism language', () => {
    const weird = [
      '',
      ' ',
      '\t',
      '"',
      "'",
      '`',
      '/*',
      '*/',
      '//',
      '--',
      '#',
      '```',
      '~~~',
      '---',
      '@@',
      '<',
      '>',
      '&',
      '\\',
      '${x}',
      '中文注释 // ok',
      'a\r',
    ];
    for (const lang of PRISM_IDS) assertHighlightInvariant(weird, lang);
  });

  test('preserves CRLF characters exactly', () => {
    assertHighlightInvariant(['const x = 1;\r', '// c\r', '\r', '/*\r'], 'javascript');
    const tokens = core.frHighlightLines(['const x = 1;\r'], 'javascript');
    assert.equal(joinTokens(tokens[0]), 'const x = 1;\r');
  });

  test('returns [] for empty and non-array input', () => {
    assert.deepEqual(core.frHighlightLines([], 'javascript'), []);
    assert.deepEqual(core.frHighlightLines(null, 'javascript'), []);
    assert.deepEqual(core.frHighlightLines(undefined, 'javascript'), []);
    assert.deepEqual(core.frHighlightLines('x', 'javascript'), []);
    assert.deepEqual(core.frHighlightLines(42, 'javascript'), []);
  });

  test('does not mutate the input lines array', () => {
    const lines = ['const x = 1;', '// c', '', 'let y = 2;'];
    const snapshot = lines.slice();
    core.frHighlightLines(lines, 'javascript');
    assert.deepEqual(lines, snapshot);
  });
});

describe('Prism kind mapping', () => {
  test('javascript: keyword, string, number, comment, func, type, punctuation', () => {
    const tokens = tok('const value = parse("x", 42); // note', 'javascript');
    assert.deepEqual(kindValues(tokens, 'keyword'), ['const']);
    assert.deepEqual(kindValues(tokens, 'func'), ['parse']);
    assert.deepEqual(kindValues(tokens, 'string'), ['"x"']);
    assert.deepEqual(kindValues(tokens, 'number'), ['42']);
    assert.deepEqual(kindValues(tokens, 'comment'), ['// note']);
    assert.ok(kindValues(tokens, 'punct').join('').includes(';'));
    assert.equal(joinTokens(tokens), 'const value = parse("x", 42); // note');

    const cls = tok('class Foo extends Bar {}', 'javascript');
    assert.deepEqual(kindValues(cls, 'type'), ['Foo', 'Bar']);
    assert.deepEqual(kindValues(cls, 'keyword'), ['class', 'extends']);

    const fn = tok('function load() { return 1; }', 'javascript');
    assert.deepEqual(kindValues(fn, 'keyword'), ['function', 'return']);
    assert.deepEqual(kindValues(fn, 'func'), ['load']);

    const twoLines = core.frHighlightLines(['/* start', 'middle', 'end */ const x = 1;'], 'javascript');
    assert.deepEqual(kindValues(twoLines[0], 'comment'), ['/* start']);
    assert.deepEqual(twoLines[1], [{ k: 'comment', v: 'middle' }]);
    assert.deepEqual(kindValues(twoLines[2], 'comment'), ['end */']);
    assert.deepEqual(kindValues(twoLines[2], 'keyword'), ['const']);
  });

  test('typescript and tsx', () => {
    const tokens = tok('interface User { id: number; }', 'typescript');
    assert.ok(kindValues(tokens, 'keyword').includes('interface'));
    assert.ok(kindValues(tokens, 'type').includes('User'));
    assert.ok(kindValues(tokens, 'type').includes('number'));
    assert.deepEqual(kindValues(tok('const x = 1;', 'tsx'), 'keyword'), ['const']);
  });

  test('json: property names are attr, booleans are numbers', () => {
    const tokens = tok('{"a": 1, "b": true}', 'json');
    assert.deepEqual(kindValues(tokens, 'attr'), ['"a"', '"b"']);
    assert.deepEqual(kindValues(tokens, 'number'), ['1', 'true']);
    assert.equal(kindValues(tokens, 'punct').join(''), '{:,:}');
  });

  test('css: selectors are tag, properties are attr', () => {
    const tokens = tok('.btn { color: red; }', 'css');
    assert.deepEqual(kindValues(tokens, 'attr'), ['color']);
    assert.deepEqual(kindValues(tokens, 'tag'), ['.btn']);
  });

  test('markup: tags, attributes and quoted values', () => {
    const tokens = tok('<div class="x">text</div>', 'markup');
    assert.ok(kindValues(tokens, 'tag').join('').includes('div'));
    assert.deepEqual(kindValues(tokens, 'attr'), ['class']);
    assert.deepEqual(kindValues(tokens, 'string'), ['x']);
    const comment = core.frHighlightLines(['<!-- comment', 'still -->'], 'markup');
    assert.deepEqual(kindValues(comment[0], 'comment'), ['<!-- comment']);
    assert.deepEqual(kindValues(comment[1], 'comment'), ['still -->']);
  });

  test('markdown: headings are keyword, fenced code is string-ish', () => {
    const heading = tok('## Sub heading', 'markdown');
    assert.deepEqual(kindValues(heading, 'punct'), ['##']);
    assert.deepEqual(kindValues(heading, 'keyword'), [' Sub heading']);
    const fence = core.frHighlightLines(['```js', 'const x = 1;', '```'], 'markdown');
    const fenceStrings = fence[1].filter((token) => token.k === 'string').map((token) => token.v).join('');
    assert.ok(fenceStrings.includes('const x = 1;'), 'fenced code content is string-ish');
    assert.equal(fence[0][0].k, 'punct', 'opening fence marker is punct');
    assert.equal(fence[0][0].v, '```');
    assert.ok(fence[2].every((token) => token.k === 'punct'), 'closing fence marker is punct');
  });

  test('python and bash', () => {
    const py = tok('def f(x):', 'python');
    assert.deepEqual(kindValues(py, 'keyword'), ['def']);
    assert.deepEqual(kindValues(py, 'func'), ['f']);
    const pyLine = tok('    return "s#not" # tail', 'python');
    assert.deepEqual(kindValues(pyLine, 'keyword'), ['return']);
    assert.deepEqual(kindValues(pyLine, 'string'), ['"s#not"']);
    assert.deepEqual(kindValues(pyLine, 'comment'), ['# tail']);
    const bash = tok('echo "$VAR" # c', 'bash');
    assert.deepEqual(kindValues(bash, 'string'), ['"$VAR"']);
    assert.deepEqual(kindValues(bash, 'comment'), ['# c']);
  });

  test('sql keywords are case-insensitive, numbers are numbers', () => {
    const tokens = tok('SELECT id FROM users WHERE id = 1;', 'sql');
    const keywords = kindValues(tokens, 'keyword').map((word) => word.toLowerCase());
    for (const word of ['select', 'from', 'where']) assert.ok(keywords.includes(word), word);
    assert.deepEqual(kindValues(tokens, 'number'), ['1']);
  });

  test('diff markers are keyword, removals comment and additions string', () => {
    assert.equal(kindValues(tok('+++ b/file', 'diff'), 'keyword').join(''), '+++ b/file');
    const tokens = core.frHighlightLines(
      ['--- a/file', '@@ -1 +1 @@', '-removed', '+added'],
      'diff',
    );
    assert.equal(kindValues(tokens[0], 'keyword').join(''), '--- a/file');
    assert.equal(kindValues(tokens[1], 'keyword').join(''), '@@ -1 +1 @@');
    assert.equal(kindValues(tokens[2], 'comment').join(''), '-removed');
    assert.equal(kindValues(tokens[3], 'string').join(''), '+added');
  });
});

describe('frHighlightLines — fallbacks', () => {
  test('plain, unknown, absent and non-string languages yield one plain token per line', () => {
    const expected = [[{ k: 'plain', v: 'x // y' }], [{ k: 'plain', v: '' }]];
    for (const lang of ['plain', 'klingon', 'text', '', undefined, null, 42, {}]) {
      assert.deepEqual(core.frHighlightLines(['x // y', ''], lang), expected);
    }
  });

  test('works without the vendored Prism (absent FR_PRISM)', () => {
    assert.deepEqual(
      coreWithoutVendor.frHighlightLines(['const x = 1;', 'let y = 2;'], 'javascript'),
      [[{ k: 'plain', v: 'const x = 1;' }], [{ k: 'plain', v: 'let y = 2;' }]],
    );
    assert.equal(coreWithoutVendor.frDetectLanguage('a.js'), 'javascript');
    assertHighlightInvariant(['console.log(1);', ''], 'javascript', coreWithoutVendor);
  });

  test('garbage line values are coerced and never throw', () => {
    const inputs = [null, 42, undefined, 'x', true];
    const expected = inputs.map(lineText);
    const tokens = core.frHighlightLines(inputs, 'javascript');
    assert.equal(tokens.length, inputs.length);
    tokens.forEach((lineTokens, index) => {
      assert.equal(joinTokens(lineTokens), expected[index]);
    });
    assert.deepEqual(
      core.frHighlightLines(inputs, 'plain'),
      expected.map((value) => [{ k: 'plain', v: value }]),
    );
    const hostile = { toString() { throw new Error('boom'); } };
    const hostileTokens = core.frHighlightLines([hostile], 'javascript');
    assert.equal(hostileTokens.length, 1);
    assert.equal(joinTokens(hostileTokens[0]), '');
  });
});

/* ========================================================================= */
/* Optimization pass 4: git status helpers                                    */
/* ========================================================================= */

const GIT_SAMPLE_RAW = {
  v: 1,
  generatedAt: 1750000000000,
  isRepo: true,
  repoRoot: '/abs/repo',
  cwd: '/abs/session/cwd',
  branch: 'main',
  truncated: false,
  files: [
    { path: 'src/a.ts', abs: '/abs/repo/src/a.ts', status: 'modified', oldPath: '' },
  ],
  lineChanges: {
    '/abs/repo/src/a.ts': [
      { start: 2, end: 2, kind: 'modified' },
      { start: 4, end: 4, kind: 'added' },
      { start: 7, end: 7, kind: 'deleted', deleted: 2 },
    ],
  },
};

const GIT_EMPTY_STATUS = {
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

describe('frNormalizeGitStatus', () => {
  test('normalizes the contract sample', () => {
    assert.deepEqual(core.frNormalizeGitStatus(GIT_SAMPLE_RAW), {
      available: true,
      isRepo: true,
      branch: 'main',
      repoRoot: '/abs/repo',
      cwd: '/abs/session/cwd',
      truncated: false,
      generatedAt: 1750000000000,
      files: [{ path: 'src/a.ts', abs: '/abs/repo/src/a.ts', status: 'modified', oldPath: '' }],
      byAbs: {
        '/abs/repo/src/a.ts': { path: 'src/a.ts', status: 'modified', oldPath: '' },
      },
      lineChanges: {
        '/abs/repo/src/a.ts': [
          { start: 2, end: 2, kind: 'modified', deleted: 0 },
          { start: 4, end: 4, kind: 'added', deleted: 0 },
          { start: 7, end: 7, kind: 'deleted', deleted: 2 },
        ],
      },
      counts: { added: 0, modified: 1, deleted: 0, renamed: 0, conflicted: 0 },
    });
  });

  test('a non-repo document is available but isRepo false', () => {
    const status = core.frNormalizeGitStatus({ v: 1, isRepo: false });
    assert.equal(status.available, true);
    assert.equal(status.isRepo, false);
    assert.equal(status.branch, '');
    assert.deepEqual(status.files, []);
    assert.deepEqual(status.counts, { added: 0, modified: 0, deleted: 0, renamed: 0, conflicted: 0 });
  });

  test('garbage input yields the unavailable default shape', () => {
    const inputs = [
      null,
      undefined,
      'string',
      42,
      true,
      [],
      [GIT_SAMPLE_RAW],
      {},
      { v: 2 },
      { v: '1' },
      { v: 0 },
      { v: 1.5 },
      { version: 1 },
    ];
    for (const input of inputs) {
      assert.deepEqual(core.frNormalizeGitStatus(input), GIT_EMPTY_STATUS);
    }
  });

  test('never throws on hostile objects', () => {
    const hostile = {};
    Object.defineProperty(hostile, 'v', {
      get() { throw new Error('boom'); },
    });
    assert.deepEqual(core.frNormalizeGitStatus(hostile), GIT_EMPTY_STATUS);
    const hostileFiles = {
      v: 1,
      get files() { throw new Error('boom'); },
    };
    assert.deepEqual(core.frNormalizeGitStatus(hostileFiles), GIT_EMPTY_STATUS);
    const hostileRuns = {
      v: 1,
      get lineChanges() { throw new Error('boom'); },
    };
    assert.deepEqual(core.frNormalizeGitStatus(hostileRuns), GIT_EMPTY_STATUS);
  });

  test('missing optional fields fall back to defaults', () => {
    const status = core.frNormalizeGitStatus({ v: 1, files: [], lineChanges: {} });
    assert.equal(status.isRepo, false);
    assert.equal(status.branch, '');
    assert.equal(status.repoRoot, '');
    assert.equal(status.cwd, '');
    assert.equal(status.truncated, false);
    assert.equal(status.generatedAt, 0);
    assert.deepEqual(status.files, []);
    assert.deepEqual(status.byAbs, {});
    assert.deepEqual(status.lineChanges, {});
  });

  test('field types are coerced strictly', () => {
    const status = core.frNormalizeGitStatus({
      v: 1,
      branch: 7,
      repoRoot: null,
      cwd: undefined,
      truncated: 'yes',
      generatedAt: '1750',
    });
    assert.equal(status.branch, '');
    assert.equal(status.repoRoot, '');
    assert.equal(status.cwd, '');
    assert.equal(status.truncated, false);
    assert.equal(status.generatedAt, 0);
    const ok = core.frNormalizeGitStatus({ v: 1, branch: 'dev', cwd: '/w', truncated: true, generatedAt: 42 });
    assert.equal(ok.branch, 'dev');
    assert.equal(ok.cwd, '/w');
    assert.equal(ok.truncated, true);
    assert.equal(ok.generatedAt, 42);
  });

  test('keeps only known statuses, in input order, building byAbs and counts', () => {
    const status = core.frNormalizeGitStatus({
      v: 1,
      files: [
        { path: 'z.txt', abs: '/r/z.txt', status: 'added', oldPath: '' },
        { path: 'a.ts', abs: '/r/a.ts', status: 'renamed', oldPath: 'old.ts' },
        { path: 'b.ts', abs: '/r/b.ts', status: 'deleted', oldPath: '' },
        { path: 'c.ts', abs: '/r/c.ts', status: 'conflicted', oldPath: '' },
        { path: 'd.ts', abs: '/r/d.ts', status: 'weird', oldPath: '' },
        { path: 'e.ts', abs: '/r/e.ts', status: 'modified', oldPath: '' },
        null,
        'x',
        [],
      ],
    });
    assert.deepEqual(
      status.files.map((file) => file.path),
      ['z.txt', 'a.ts', 'b.ts', 'c.ts', 'e.ts'],
    );
    assert.deepEqual(status.files[1], {
      path: 'a.ts',
      abs: '/r/a.ts',
      status: 'renamed',
      oldPath: 'old.ts',
    });
    assert.deepEqual(status.byAbs['/r/a.ts'], {
      path: 'a.ts',
      status: 'renamed',
      oldPath: 'old.ts',
    });
    assert.equal(Object.keys(status.byAbs).length, 5);
    assert.deepEqual(status.counts, {
      added: 1,
      modified: 1,
      deleted: 1,
      renamed: 1,
      conflicted: 1,
    });
  });

  test('coerces missing file fields to empty strings', () => {
    const status = core.frNormalizeGitStatus({ v: 1, files: [{ status: 'added' }] });
    assert.deepEqual(status.files, [{ path: '', abs: '', status: 'added', oldPath: '' }]);
    assert.deepEqual(status.byAbs[''], { path: '', status: 'added', oldPath: '' });
    assert.equal(status.counts.added, 1);
  });

  test('sanitizes lineChanges runs', () => {
    const status = core.frNormalizeGitStatus({
      v: 1,
      lineChanges: {
        '/a.ts': [
          { start: 12, end: 4, kind: 'added' },
          { start: 0, end: 3, kind: 'modified' },
          { start: 2.7, end: 2.2, kind: 'deleted', deleted: 0 },
          { start: 1, end: 2, kind: 'removed' },
          { start: 'x', end: 4, kind: 'modified' },
          'oops',
          null,
          [],
          { start: 7, end: 7, kind: 'deleted', deleted: 3 },
        ],
        '/b.ts': [],
        '/c.ts': 'not-an-array',
        '/d.ts': [{ start: 3, end: 6, kind: 'added' }],
      },
    });
    assert.deepEqual(status.lineChanges['/a.ts'], [
      { start: 1, end: 3, kind: 'modified', deleted: 0 },
      { start: 1, end: 4, kind: 'modified', deleted: 0 },
      { start: 2, end: 2, kind: 'deleted', deleted: 1 },
      { start: 7, end: 7, kind: 'deleted', deleted: 3 },
      { start: 12, end: 12, kind: 'added', deleted: 0 },
    ]);
    // Keys whose sanitized run list is empty are dropped.
    assert.equal(status.lineChanges['/b.ts'], undefined);
    assert.equal(status.lineChanges['/c.ts'], undefined);
    assert.deepEqual(status.lineChanges['/d.ts'], [
      { start: 3, end: 6, kind: 'added', deleted: 0 },
    ]);
  });

  test('lineChanges values that are not objects/arrays are ignored', () => {
    const status = core.frNormalizeGitStatus({
      v: 1,
      lineChanges: ['nope', 'also-nope'],
    });
    assert.deepEqual(status.lineChanges, {});
  });
});

describe('frGitKind', () => {
  test('maps statuses to UI kinds', () => {
    assert.equal(core.frGitKind('added'), 'added');
    assert.equal(core.frGitKind('modified'), 'modified');
    assert.equal(core.frGitKind('renamed'), 'modified');
    assert.equal(core.frGitKind('deleted'), 'deleted');
    assert.equal(core.frGitKind('conflicted'), 'conflicted');
  });

  test('unknown input maps to the empty string', () => {
    for (const value of ['', 'weird', 'ADDED', 'Modified', null, undefined, 42, {}, []]) {
      assert.equal(core.frGitKind(value), '');
    }
  });
});

describe('frGitMarkKind', () => {
  const runs = [
    { start: 2, end: 2, kind: 'modified', deleted: 0 },
    { start: 4, end: 6, kind: 'added', deleted: 0 },
    { start: 9, end: 9, kind: 'deleted', deleted: 2 },
  ];

  test('a run marks every line it covers', () => {
    assert.equal(core.frGitMarkKind(runs, 1), '');
    assert.equal(core.frGitMarkKind(runs, 2), 'modified');
    assert.equal(core.frGitMarkKind(runs, 3), '');
    assert.equal(core.frGitMarkKind(runs, 4), 'added');
    assert.equal(core.frGitMarkKind(runs, 6), 'added');
    assert.equal(core.frGitMarkKind(runs, 7), '');
    assert.equal(core.frGitMarkKind(runs, 9), 'deleted');
    assert.equal(core.frGitMarkKind(runs, 10), '');
  });

  test('a deleted run marks only its anchor line', () => {
    const deleted = [{ start: 5, end: 9, kind: 'deleted', deleted: 3 }];
    assert.equal(core.frGitMarkKind(deleted, 5), 'deleted');
    for (const line of [4, 6, 7, 8, 9, 10]) {
      assert.equal(core.frGitMarkKind(deleted, line), '');
    }
  });

  test('absent or invalid input yields the empty string', () => {
    assert.equal(core.frGitMarkKind(null, 1), '');
    assert.equal(core.frGitMarkKind(undefined, 1), '');
    assert.equal(core.frGitMarkKind({}, 1), '');
    assert.equal(core.frGitMarkKind('x', 1), '');
    assert.equal(core.frGitMarkKind([], 1), '');
    assert.equal(core.frGitMarkKind(runs, 1.5), '');
    assert.equal(core.frGitMarkKind(runs, 0), '');
    assert.equal(core.frGitMarkKind(runs, -3), '');
    assert.equal(core.frGitMarkKind(runs, NaN), '');
    assert.equal(core.frGitMarkKind(runs, '6'), 'added');
    assert.equal(core.frGitMarkKind([{ start: 0, end: 5, kind: 'added' }], 3), '');
    assert.equal(core.frGitMarkKind([null, 'x', { kind: 'weird', start: 1, end: 1 }], 1), '');
    assert.equal(core.frGitMarkKind([{ start: 1, end: 1, kind: 'constructor' }], 1), '');
  });

  test('the first covering run wins', () => {
    assert.equal(
      core.frGitMarkKind([
        { start: 1, end: 5, kind: 'added' },
        { start: 3, end: 6, kind: 'modified' },
      ], 4),
      'added',
    );
  });

  test('works on lineChanges produced by frNormalizeGitStatus', () => {
    const status = core.frNormalizeGitStatus(GIT_SAMPLE_RAW);
    const fileRuns = status.lineChanges['/abs/repo/src/a.ts'];
    assert.equal(core.frGitMarkKind(fileRuns, 2), 'modified');
    assert.equal(core.frGitMarkKind(fileRuns, 3), '');
    assert.equal(core.frGitMarkKind(fileRuns, 4), 'added');
    assert.equal(core.frGitMarkKind(fileRuns, 7), 'deleted');
    assert.equal(core.frGitMarkKind(status.lineChanges['/missing.ts'], 1), '');
  });
});

describe('frGroupChangedFiles', () => {
  test('groups by directory: root first, then localeCompare; files sorted by path', () => {
    const files = [
      { path: 'src/b.ts' },
      { path: 'src/a.ts' },
      { path: 'README.md' },
      { path: 'docs/z/x.md' },
      { path: 'src/dir/c.ts' },
      { path: 'src/dir/a.ts' },
    ];
    const groups = core.frGroupChangedFiles(files);
    assert.deepEqual(groups.map((group) => group.dir), ['', 'docs/z', 'src', 'src/dir']);
    assert.deepEqual(groups.map((group) => group.files.map((file) => file.path)), [
      ['README.md'],
      ['docs/z/x.md'],
      ['src/a.ts', 'src/b.ts'],
      ['src/dir/a.ts', 'src/dir/c.ts'],
    ]);
    // The original file objects are kept (same references).
    assert.equal(groups[2].files[0], files[1]);
  });

  test('files at the repository root use dir ""', () => {
    assert.deepEqual(core.frGroupChangedFiles([{ path: 'package.json' }]), [
      { dir: '', files: [{ path: 'package.json' }] },
    ]);
  });

  test('empty and garbage input group to []', () => {
    assert.deepEqual(core.frGroupChangedFiles([]), []);
    assert.deepEqual(core.frGroupChangedFiles(null), []);
    assert.deepEqual(core.frGroupChangedFiles(undefined), []);
    assert.deepEqual(core.frGroupChangedFiles('x'), []);
    assert.deepEqual(core.frGroupChangedFiles([null, 'x', 42, [], { path: 'a.ts' }]), [
      { dir: '', files: [{ path: 'a.ts' }] },
    ]);
  });

  test('does not mutate the input array', () => {
    const files = [{ path: 'b/b.ts' }, { path: 'a/a.ts' }];
    const groups = core.frGroupChangedFiles(files);
    assert.deepEqual(files.map((file) => file.path), ['b/b.ts', 'a/a.ts']);
    assert.deepEqual(groups.map((group) => group.dir), ['a', 'b']);
  });
});

describe('git helpers — never throw', () => {
  test('all four helpers are total functions', () => {
    const hostile = new Proxy({}, {
      get() { throw new Error('boom'); },
    });
    for (const value of [undefined, null, 0, 'x', [], {}, hostile]) {
      assert.doesNotThrow(() => core.frNormalizeGitStatus(value));
      assert.doesNotThrow(() => core.frGitKind(value));
      assert.doesNotThrow(() => core.frGitMarkKind(value, value));
      assert.doesNotThrow(() => core.frGroupChangedFiles(value));
    }
  });
});

/* ========================================================================= */
/* Optimization pass 5: recursive file search helpers                         */
/* ========================================================================= */

describe('FR_SEARCH_SKIP_DIRS', () => {
  test('is the fixed read-only list of the four skipped directories', () => {
    assert.deepEqual(core.FR_SEARCH_SKIP_DIRS, ['node_modules', '.git', '.svn', '.hg']);
    assert.ok(Array.isArray(core.FR_SEARCH_SKIP_DIRS));
    assert.ok(Object.isFrozen(core.FR_SEARCH_SKIP_DIRS));
    assert.throws(() => core.FR_SEARCH_SKIP_DIRS.push('dist'), TypeError);
  });
});

describe('frSearchNormalize', () => {
  test('trims and lowercases string queries', () => {
    assert.equal(core.frSearchNormalize('  Foo  '), 'foo');
    assert.equal(core.frSearchNormalize('src/App.TS'), 'src/app.ts');
    assert.equal(core.frSearchNormalize('\tNode_Modules\n'), 'node_modules');
    assert.equal(core.frSearchNormalize('ÄBC'), 'äbc');
  });

  test('non-strings and blank queries normalize to the empty string', () => {
    for (const value of ['', '   ', '\t\n', null, undefined, 42, true, {}, [], ['a']]) {
      assert.equal(core.frSearchNormalize(value), '');
    }
  });
});

describe('frSearchMatches', () => {
  test('matches case-insensitively anywhere in the path', () => {
    assert.equal(core.frSearchMatches('src/client/App.ts', 'app'), true);
    assert.equal(core.frSearchMatches('src/client/App.ts', 'APP'), true);
    assert.equal(core.frSearchMatches('src/client/App.ts', 'Client/App'), true);
    assert.equal(core.frSearchMatches('src/client/App.ts', 'client'), true);
    assert.equal(core.frSearchMatches('src/client/App.ts', 'zzz'), false);
  });

  test('matches basenames and nested paths', () => {
    assert.equal(core.frSearchMatches('src/client/App.ts', 'App.ts'), true);
    assert.equal(core.frSearchMatches('docs/api/v2/index.md', 'v2/index'), true);
    assert.equal(core.frSearchMatches('README.md', 'readme'), true);
  });

  test('normalizes Windows separators in the path', () => {
    assert.equal(core.frSearchMatches('src\\client\\App.ts', 'client/app'), true);
    assert.equal(core.frSearchMatches('src\\client\\App.ts', 'src/client'), true);
    assert.equal(core.frSearchMatches('C:\\work\\src\\a.ts', 'work/src'), true);
  });

  test('normalizes the query (trim/lowercase) and rejects blank queries', () => {
    assert.equal(core.frSearchMatches('src/App.ts', '  APP  '), true);
    for (const query of ['', '   ', null, undefined, 42, {}, []]) {
      assert.equal(core.frSearchMatches('src/App.ts', query), false);
    }
  });

  test('empty or absent paths never match a non-empty query', () => {
    assert.equal(core.frSearchMatches('', 'a'), false);
    assert.equal(core.frSearchMatches(null, 'a'), false);
    assert.equal(core.frSearchMatches(undefined, 'a'), false);
    assert.equal(core.frSearchMatches('a.ts', ''), false);
  });
});

describe('frSearchSkipDir', () => {
  test('matches the four skipped directory names case-insensitively', () => {
    for (const name of ['node_modules', '.git', '.svn', '.hg']) {
      assert.equal(core.frSearchSkipDir(name), true, name);
      assert.equal(core.frSearchSkipDir(name.toUpperCase()), true, name.toUpperCase());
    }
    assert.equal(core.frSearchSkipDir('Node_Modules'), true);
    assert.equal(core.frSearchSkipDir('.GIT'), true);
    assert.equal(core.frSearchSkipDir('.Svn'), true);
  });

  test('does not skip ordinary or merely similar directories', () => {
    for (const name of [
      'src',
      'docs',
      'node_modules_backup',
      'node_modules ',
      '.github',
      '.gitignore',
      'git',
      'svn',
      'hg',
      'NODE_MODULES2',
    ]) {
      assert.equal(core.frSearchSkipDir(name), false, JSON.stringify(name));
    }
  });

  test('non-string and empty names are not skipped', () => {
    for (const name of ['', null, undefined, 42, {}, []]) {
      assert.equal(core.frSearchSkipDir(name), false);
    }
  });
});

describe('search helpers — total functions', () => {
  test('never throw on odd input', () => {
    const hostile = new Proxy({}, {
      get() { throw new Error('boom'); },
    });
    for (const value of [undefined, null, 0, 'x', [], {}, hostile]) {
      assert.doesNotThrow(() => core.frSearchNormalize(value));
      assert.doesNotThrow(() => core.frSearchMatches(value, value));
      assert.doesNotThrow(() => core.frSearchMatches('a.ts', value));
      assert.doesNotThrow(() => core.frSearchSkipDir(value));
      assert.doesNotThrow(() => core.frSearchScore(value, value));
      assert.doesNotThrow(() => core.frGroupSearchResults(value));
    }
  });
});

/* ========================================================================= */
/* Optimization pass 6: fuzzy search scoring                                  */
/* ========================================================================= */

describe('frSearchScore', () => {
  test('the contract case: changesitems finds changes_items.tsx', () => {
    const fuzzy = core.frSearchScore('changes_items.tsx', 'changesitems');
    assert.ok(fuzzy > 0);
    assert.equal(core.frSearchMatches('changes_items.tsx', 'changesitems'), true);
    // A path that only matches through the subsequence fallback ranks lower.
    const plainSubsequence = core.frSearchScore('changesxitems.tsx', 'changesitems');
    assert.ok(plainSubsequence > 0);
    assert.ok(fuzzy > plainSubsequence, fuzzy + ' should beat ' + plainSubsequence);
    assert.ok(fuzzy >= 500, 'stripped-basename substring class');
    assert.ok(plainSubsequence < 500, 'plain subsequence class');
  });

  test('a raw substring outranks the stripped fuzzy form', () => {
    const raw = core.frSearchScore('changes_items.tsx', 'changes_items');
    const fuzzy = core.frSearchScore('changes_items.tsx', 'changesitems');
    assert.ok(raw > 0 && fuzzy > 0);
    assert.ok(raw > fuzzy, raw + ' should beat ' + fuzzy);
  });

  test('a short contiguous match beats a scattered subsequence', () => {
    const contiguous = core.frSearchScore('changes_items.tsx', 'changes');
    const scattered = core.frSearchScore('changes_items.tsx', 'chgitems');
    assert.ok(contiguous > 0 && scattered > 0);
    assert.ok(contiguous > scattered, contiguous + ' should beat ' + scattered);
  });

  test('a basename match outranks a full-path-only match', () => {
    const basenameHit = core.frSearchScore('src/app.ts', 'app');
    const pathOnly = core.frSearchScore('app/src.ts', 'app');
    assert.ok(basenameHit > 0 && pathOnly > 0);
    assert.ok(basenameHit > pathOnly, basenameHit + ' should beat ' + pathOnly);
  });

  test('an exact basename is the maximum class', () => {
    const exact = core.frSearchScore('app.ts', 'app.ts');
    assert.equal(exact, 1200);
    assert.equal(core.frSearchScore('src/app.ts', 'app.ts'), 1200); // exact basename anywhere
    assert.ok(exact > core.frSearchScore('app.ts', 'app'));
    assert.ok(exact > core.frSearchScore('src/app.ts', 'app'));
    assert.ok(exact > core.frSearchScore('my_app.ts', 'app'));
    assert.ok(exact > core.frSearchScore('changes_items.tsx', 'changesitems'));
    assert.ok(exact > core.frSearchScore('changesxitems.tsx', 'changesitems'));
  });

  test('the full score ladder is strictly ordered', () => {
    const scores = [
      core.frSearchScore('app.ts', 'app.ts'),                        // exact basename
      core.frSearchScore('app.ts', 'app'),                           // basename prefix
      core.frSearchScore('my_app.ts', 'app'),                        // basename substring
      core.frSearchScore('app/src.ts', 'app'),                       // path substring
      core.frSearchScore('changes_items.tsx', 'changesitems'),       // stripped basename substring
      core.frSearchScore('changes/items.tsx', 'changesitems'),       // stripped path substring
      core.frSearchScore('changesxitems.tsx', 'changesitems'),       // stripped basename subsequence
      core.frSearchScore('changes/xitems.tsx', 'changesitems'),      // stripped path subsequence
    ];
    for (let i = 0; i < scores.length; i += 1) assert.ok(scores[i] > 0, 'class ' + i + ' matches');
    for (let i = 1; i < scores.length; i += 1) {
      assert.ok(
        scores[i - 1] > scores[i],
        'class ' + (i - 1) + ' > class ' + i + ' (' + scores[i - 1] + ' vs ' + scores[i] + ')',
      );
    }
  });

  test('non-matches score 0', () => {
    assert.equal(core.frSearchScore('bar.ts', 'foo'), 0);
    assert.equal(core.frSearchScore('abc.ts', 'abd'), 0);
    assert.equal(core.frSearchMatches('bar.ts', 'foo'), false);
  });

  test('out-of-order characters do not match as a subsequence', () => {
    assert.equal(core.frSearchScore('ab.ts', 'ba'), 0);
    assert.equal(core.frSearchScore('changes.ts', 'segnahc'), 0);
    assert.equal(core.frSearchMatches('ab.ts', 'ba'), false);
  });

  test('normalizes Windows separators', () => {
    const posix = core.frSearchScore('src/changes_items.tsx', 'changesitems');
    const windows = core.frSearchScore('src\\changes_items.tsx', 'changesitems');
    assert.ok(windows > 0);
    assert.equal(windows, posix);
    assert.equal(core.frSearchMatches('src\\client\\App.ts', 'client/app'), true);
    assert.ok(core.frSearchScore('C:\\work\\src\\App.ts', 'work/src') > 0);
  });

  test('CJK letters and digits count as letters/digits for stripping', () => {
    assert.ok(core.frSearchScore('src/变更_记录.ts', '变更记录') > 0, 'CJK letters survive stripping');
    assert.equal(core.frSearchMatches('变更_记录.ts', '变更记录'), true);
    assert.ok(core.frSearchScore('app_2.ts', 'app2') > 0, 'digits survive stripping');
  });

  test('empty, whitespace and non-string queries score 0', () => {
    for (const query of ['', '   ', '\t\n', null, undefined, 42, true, {}, [], ['a']]) {
      assert.equal(core.frSearchScore('src/app.ts', query), 0);
      assert.equal(core.frSearchMatches('src/app.ts', query), false);
    }
  });

  test('empty or absent paths score 0', () => {
    assert.equal(core.frSearchScore('', 'a'), 0);
    assert.equal(core.frSearchScore(null, 'a'), 0);
    assert.equal(core.frSearchScore(undefined, 'a'), 0);
    assert.equal(core.frSearchScore('a.ts', ''), 0);
  });

  test('scores are non-negative finite numbers', () => {
    for (const pair of [
      ['app.ts', 'app'],
      ['src/app.ts', 'app'],
      ['changes_items.tsx', 'changesitems'],
      ['bar.ts', 'foo'],
    ]) {
      const score = core.frSearchScore(pair[0], pair[1]);
      assert.equal(typeof score, 'number');
      assert.ok(isFinite(score));
      assert.ok(score >= 0);
    }
  });

  test('never throws on hostile input', () => {
    const hostile = new Proxy({}, {
      get() { throw new Error('boom'); },
    });
    for (const value of [undefined, null, 0, 'x', [], {}, hostile]) {
      assert.doesNotThrow(() => core.frSearchScore(value, value));
      assert.doesNotThrow(() => core.frSearchScore('a.ts', value));
      assert.doesNotThrow(() => core.frSearchScore(value, 'a'));
      assert.doesNotThrow(() => core.frSearchMatches(value, value));
    }
  });

  test('frSearchMatches is the boolean form of frSearchScore', () => {
    const cases = [
      ['changes_items.tsx', 'changesitems'],
      ['changesxitems.tsx', 'changesitems'],
      ['src/app.ts', 'app'],
      ['app/src.ts', 'app'],
      ['bar.ts', 'foo'],
      ['ab.ts', 'ba'],
      ['更新_日志.md', '更新日志'],
      ['a.ts', ''],
    ];
    for (const pair of cases) {
      assert.equal(
        core.frSearchMatches(pair[0], pair[1]),
        core.frSearchScore(pair[0], pair[1]) > 0,
        pair[0] + ' / ' + pair[1],
      );
    }
  });
});

describe('frGroupSearchResults', () => {
  test('groups by directory: root first, then localeCompare', () => {
    const results = [
      { abs: '/r/src/dir/b.ts', path: 'src/dir/b.ts', score: 1 },
      { abs: '/r/src/a.ts', path: 'src/a.ts', score: 1 },
      { abs: '/r/README.md', path: 'README.md', score: 1 },
      { abs: '/r/docs/a.md', path: 'docs/a.md', score: 1 },
      { abs: '/r/package.json', path: 'package.json', score: 1 },
    ];
    assert.deepEqual(
      core.frGroupSearchResults(results).map((group) => group.dir),
      ['', 'docs', 'src', 'src/dir'],
    );
  });

  test('directory order matches frGroupChangedFiles', () => {
    const results = [
      { path: 'src/b.ts', score: 1 },
      { path: 'README.md', score: 2 },
      { path: 'docs/a.md', score: 3 },
    ];
    assert.deepEqual(
      core.frGroupSearchResults(results).map((group) => group.dir),
      core.frGroupChangedFiles(results).map((group) => group.dir),
    );
  });

  test('files inside a group sort by score descending, then path', () => {
    const results = [
      { abs: '/r/src/b.ts', path: 'src/b.ts', score: 5 },
      { abs: '/r/src/a.ts', path: 'src/a.ts', score: 10 },
      { abs: '/r/src/c.ts', path: 'src/c.ts', score: 10 },
      { abs: '/r/src/d.ts', path: 'src/d.ts', score: 99 },
    ];
    const groups = core.frGroupSearchResults(results);
    assert.deepEqual(
      groups[0].files.map((file) => file.path),
      ['src/d.ts', 'src/a.ts', 'src/c.ts', 'src/b.ts'],
    );
  });

  test('missing and garbage scores count as 0', () => {
    const results = [
      { path: 'a/x.ts', score: 'high' },
      { path: 'a/y.ts' },
      { path: 'a/z.ts', score: 5 },
      { path: 'a/w.ts', score: NaN },
      { path: 'a/v.ts', score: Infinity },
      { path: 'a/u.ts', score: -3 },
      { path: 'a/t.ts', score: 0 },
    ];
    const groups = core.frGroupSearchResults(results);
    assert.deepEqual(
      groups[0].files.map((file) => file.path),
      ['a/z.ts', 'a/t.ts', 'a/u.ts', 'a/v.ts', 'a/w.ts', 'a/x.ts', 'a/y.ts'],
    );
  });

  test('does not mutate the input array or objects', () => {
    const results = [
      { abs: '/r/b/b.ts', path: 'b/b.ts', score: 1 },
      { abs: '/r/a/z.ts', path: 'a/z.ts', score: 9 },
      { abs: '/r/a/a.ts', path: 'a/a.ts', score: 2 },
    ];
    const snapshot = JSON.stringify(results);
    const groups = core.frGroupSearchResults(results);
    assert.equal(JSON.stringify(results), snapshot);
    assert.deepEqual(groups.map((group) => group.dir), ['a', 'b']);
    assert.deepEqual(groups[0].files.map((file) => file.path), ['a/z.ts', 'a/a.ts']);
    // Original result objects are kept (same references).
    assert.equal(groups[0].files[0], results[1]);
  });

  test('empty and garbage input group to []', () => {
    assert.deepEqual(core.frGroupSearchResults([]), []);
    assert.deepEqual(core.frGroupSearchResults(null), []);
    assert.deepEqual(core.frGroupSearchResults(undefined), []);
    assert.deepEqual(core.frGroupSearchResults('x'), []);
    assert.deepEqual(core.frGroupSearchResults([null, 'x', 42, [], { path: 'a.ts', score: 1 }]), [
      { dir: '', files: [{ path: 'a.ts', score: 1 }] },
    ]);
  });

  test('root-level results use dir "" and hostile input never throws', () => {
    assert.deepEqual(core.frGroupSearchResults([{ path: 'app.ts', score: 10 }]), [
      { dir: '', files: [{ path: 'app.ts', score: 10 }] },
    ]);
    const hostile = new Proxy({}, {
      get() { throw new Error('boom'); },
    });
    for (const value of [undefined, null, 0, 'x', [], {}, hostile]) {
      assert.doesNotThrow(() => core.frGroupSearchResults(value));
    }
  });
});
