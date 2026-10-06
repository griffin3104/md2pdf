'use strict';
// npm test: フロントマター除去のテスト（Electron 不要）
const assert = require('node:assert/strict');
const { stripFrontMatter } = require('../src/main/frontmatter');

const cases = [
  ['基本', '---\ntitle: a\ntags: [x, y]\n---\n# 見出し\n', '# 見出し\n'],
  ['CRLF', '---\r\ntitle: a\r\n---\r\n# 見出し\r\n', '# 見出し\r\n'],
  ['BOM つき', '﻿---\ntitle: a\n---\n本文', '本文'],
  ['空のフロントマター', '---\n---\n本文', '本文'],
  ['閉じ行が ...', '---\ntitle: a\n...\n本文', '本文'],
  ['閉じ行の後ろに空白', '---\ntitle: a\n---  \n本文', '本文'],
  ['本文が空', '---\ntitle: a\n---\n', ''],
  ['閉じ行なし（そのまま）', '---\ntitle: a\n本文', '---\ntitle: a\n本文'],
  ['フロントマターなし', '# 見出し\n\n---\n\n本文', '# 見出し\n\n---\n\n本文'],
  ['先頭以外の --- は対象外', '本文\n---\ntitle: a\n---\n', '本文\n---\ntitle: a\n---\n'],
  ['---- は区切りではない', '----\ntitle: a\n----\n本文', '----\ntitle: a\n----\n本文'],
  ['複数あっても先頭のみ', '---\na: 1\n---\n本文\n---\nb: 2\n---\n', '本文\n---\nb: 2\n---\n'],
];

let failed = 0;
for (const [name, input, expected] of cases) {
  try {
    assert.equal(stripFrontMatter(input), expected);
    console.log(`ok   ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`FAIL ${name}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(stripFrontMatter(input))}`);
  }
}
console.log(failed === 0 ? `\n全 ${cases.length} 件 OK` : `\n${failed} 件失敗`);
process.exit(failed === 0 ? 0 : 1);
