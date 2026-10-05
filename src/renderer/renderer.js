'use strict';

const $ = (id) => document.getElementById(id);
const dropZone = $('drop-zone');
const fileName = $('file-name');
const convertBtn = $('convert');
const message = $('message');
const showFolderBtn = $('show-folder');
const settingsMessage = $('settings-message');

let currentMd = null;
let lastOutPath = null;
let busy = false;

function show(el, text, kind) {
  el.textContent = text;
  el.className = kind || '';
  el.hidden = !text;
}

function renderCss(info) {
  const label = info.isDefault ? '既定' : info.cssPath;
  $('css-current').textContent = label;
  $('css-current-settings').textContent = label;
  if (info.missing) {
    show(settingsMessage, `指定した CSS が見つかりません（${info.missingPath}）。既定の CSS を使用します。`, 'warn');
  }
}

async function setMarkdown(p) {
  const v = await window.api.validateMarkdown(p);
  if (!v.ok) {
    show(message, v.message, 'err');
    showFolderBtn.hidden = true;
    return;
  }
  currentMd = p;
  lastOutPath = null;
  fileName.textContent = p.split(/[\\/]/).pop();
  fileName.hidden = false;
  convertBtn.disabled = busy;
  show(message, '');
  showFolderBtn.hidden = true;
}

// ドラッグ&ドロップ（ウィンドウ外に落とした場合の画面遷移は防ぐ）
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('over');
  const files = [...e.dataTransfer.files];
  if (files.length === 0) return;
  await setMarkdown(window.api.pathForFile(files[0]));
  if (files.length > 1) show(message, '複数のファイルがドロップされたため、最初の1件だけを対象にしました。', 'warn');
});
const pickFile = async () => {
  const p = await window.api.chooseMarkdown();
  if (p) await setMarkdown(p);
};
dropZone.addEventListener('click', pickFile);
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    pickFile();
  }
});

convertBtn.addEventListener('click', async () => {
  if (!currentMd || busy) return;
  busy = true;
  convertBtn.disabled = true;
  showFolderBtn.hidden = true;
  show(message, '変換中…');
  const r = await window.api.convert(currentMd);
  busy = false;
  convertBtn.disabled = false;
  if (r.status === 'ok') {
    lastOutPath = r.outPath;
    const note = r.cssFallback ? `\n（指定した CSS が見つからなかったため、既定の CSS を使用しました: ${r.missingPath}）` : '';
    show(message, `PDF を出力しました: ${r.outPath}${note}`, r.cssFallback ? 'warn' : 'ok');
    showFolderBtn.hidden = false;
  } else if (r.status === 'canceled') {
    show(message, '');
  } else {
    show(message, `変換に失敗しました: ${r.message}`, 'err');
  }
  renderCss(await window.api.getSettings());
});

showFolderBtn.addEventListener('click', () => {
  if (lastOutPath) window.api.showInFolder(lastOutPath);
});

// 設定
$('toggle-settings').addEventListener('click', () => {
  const toSettings = $('view-settings').hidden;
  $('view-settings').hidden = !toSettings;
  $('view-main').hidden = toSettings;
  $('toggle-settings').textContent = toSettings ? '戻る' : '設定';
});
$('choose-css').addEventListener('click', async () => {
  show(settingsMessage, '');
  renderCss(await window.api.chooseCss());
});
$('reset-css').addEventListener('click', async () => {
  show(settingsMessage, '');
  renderCss(await window.api.resetCss());
});
$('export-css').addEventListener('click', async () => {
  const r = await window.api.exportDefaultCss();
  if (r.status === 'ok') show(settingsMessage, `既定 CSS を保存しました: ${r.outPath}`, 'ok');
  else if (r.status === 'error') show(settingsMessage, `エクスポートに失敗しました: ${r.message}`, 'err');
});

window.api.getSettings().then(renderCss);
