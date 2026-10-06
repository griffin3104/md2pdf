'use strict';
// Markdown -> PDF 変換（Electron 内蔵 Chromium の printToPDF を使用）
const { BrowserWindow } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const hljs = require('highlight.js');
const { stripFrontMatter } = require('./frontmatter');

// asar 内のファイルは別プロセスの Chromium から読めないので、unpack 済みのパスに差し替える
const unpacked = (p) => p.replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);
const MERMAID_JS = unpacked(require.resolve('mermaid/dist/mermaid.min.js'));
const HLJS_CSS = require.resolve('highlight.js/styles/github.css');

const MM_PER_INCH = 25.4;
const MARGIN_MM = { top: 16, bottom: 16, left: 8, right: 8 };

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function createMarked() {
  return new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        if (lang === 'mermaid') return escapeHtml(code);
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    }),
    {
      renderer: {
        code({ text, lang }) {
          if (lang === 'mermaid') return `<div class="mermaid">${text}</div>\n`;
          return false; // 既定の描画
        },
      },
    }
  );
}

function renderHtml(mdPath, cssPath) {
  const body = createMarked().parse(stripFrontMatter(fs.readFileSync(mdPath, 'utf8')));
  const hljsCss = fs.readFileSync(HLJS_CSS, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  // 相対パスの画像を Markdown のあるフォルダ基準で解決する
  const baseHref = pathToFileURL(path.dirname(mdPath) + path.sep).href;
  return `<!doctype html>
<html><head><meta charset="utf-8">
<base href="${baseHref}">
<style>${hljsCss}</style>
<style>${css}</style>
<style>pre code.hljs { background: transparent; padding: 0; }</style>
</head><body>
${body}
<script src="${pathToFileURL(MERMAID_JS).href}"></script>
<script>
  window.__ready = (async () => {
    mermaid.initialize({ startOnLoad: false });
    await mermaid.run({ querySelector: 'div.mermaid' });
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    return true;
  })();
</script>
</body></html>`;
}

/**
 * @param {string} mdPath  入力 Markdown の絶対パス
 * @param {string} outPdf  出力 PDF の絶対パス
 * @param {string} cssPath 使用する CSS の絶対パス
 */
async function convert(mdPath, outPdf, cssPath) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-'));
  const tmpHtml = path.join(tmpDir, 'index.html');
  let win;
  try {
    fs.writeFileSync(tmpHtml, renderHtml(mdPath, cssPath));
    win = new BrowserWindow({ show: false });
    await win.loadFile(tmpHtml);
    await win.webContents.executeJavaScript('window.__ready');
    const inch = (mm) => mm / MM_PER_INCH;
    const pdf = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: {
        top: inch(MARGIN_MM.top),
        bottom: inch(MARGIN_MM.bottom),
        left: inch(MARGIN_MM.left),
        right: inch(MARGIN_MM.right),
      },
    });
    fs.writeFileSync(outPdf, pdf);
  } finally {
    if (win && !win.isDestroyed()) win.destroy();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

module.exports = { convert };
