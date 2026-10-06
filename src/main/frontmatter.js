'use strict';
// Markdown 先頭の YAML フロントマター（--- ... --- または --- ... ...）を取り除く。
// 先頭行（BOM は許容）が `---` で、そのあとに閉じ行（`---` または `...`）がある場合のみ対象。
const FRONT_MATTER = /^﻿?---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;

function stripFrontMatter(source) {
  return source.replace(FRONT_MATTER, '');
}

module.exports = { stripFrontMatter };
