'use strict';
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { convert } = require('./converter');
const settings = require('./settings');

const DEFAULT_CSS = path.join(__dirname, '..', 'assets', 'default.css');
const MD_EXTENSIONS = ['.md', '.markdown'];

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 760,
    height: 600,
    minWidth: 560,
    minHeight: 480,
    title: 'md2pdf',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

// 有効な CSS を決める。カスタム CSS が見つからなければ既定にフォールバックする。
function resolveCss() {
  const { cssPath } = settings.load();
  if (!cssPath) return { path: DEFAULT_CSS, isDefault: true, missing: false };
  if (fs.existsSync(cssPath)) return { path: cssPath, isDefault: false, missing: false };
  return { path: DEFAULT_CSS, isDefault: true, missing: true, missingPath: cssPath };
}

const cssInfo = () => {
  const { isDefault, missing, missingPath, path: p } = resolveCss();
  return { isDefault, missing, cssPath: isDefault ? null : p, missingPath: missingPath ?? null };
};

const isMarkdown = (p) => MD_EXTENSIONS.includes(path.extname(p).toLowerCase());

ipcMain.handle('settings:get', () => cssInfo());

ipcMain.handle('settings:chooseCss', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: '使用する CSS を選択',
    properties: ['openFile'],
    filters: [{ name: 'CSS', extensions: ['css'] }],
  });
  if (r.canceled || r.filePaths.length === 0) return cssInfo();
  settings.save({ cssPath: r.filePaths[0] });
  return cssInfo();
});

ipcMain.handle('settings:resetCss', () => {
  settings.save({ cssPath: null });
  return cssInfo();
});

ipcMain.handle('css:exportDefault', async () => {
  const r = await dialog.showSaveDialog(mainWindow, {
    title: '既定 CSS をエクスポート',
    defaultPath: path.join(app.getPath('documents'), 'default.css'),
    filters: [{ name: 'CSS', extensions: ['css'] }],
  });
  if (r.canceled || !r.filePath) return { status: 'canceled' };
  try {
    fs.copyFileSync(DEFAULT_CSS, r.filePath);
    return { status: 'ok', outPath: r.filePath };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
});

ipcMain.handle('md:choose', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: 'Markdown ファイルを選択',
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  });
  return r.canceled || r.filePaths.length === 0 ? null : r.filePaths[0];
});

ipcMain.handle('md:validate', (_e, p) => {
  if (!p || !isMarkdown(p)) return { ok: false, message: 'Markdown ファイル（.md / .markdown）を指定してください' };
  if (!fs.existsSync(p)) return { ok: false, message: `ファイルが見つかりません: ${p}` };
  return { ok: true };
});

ipcMain.handle('pdf:convert', async (_e, mdPath) => {
  if (!mdPath || !fs.existsSync(mdPath)) {
    return { status: 'error', message: `Markdown ファイルが見つかりません: ${mdPath}` };
  }
  const r = await dialog.showSaveDialog(mainWindow, {
    title: 'PDF の保存先',
    defaultPath: path.join(path.dirname(mdPath), `${path.basename(mdPath, path.extname(mdPath))}.pdf`),
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (r.canceled || !r.filePath) return { status: 'canceled' };

  const css = resolveCss();
  try {
    await convert(mdPath, r.filePath, css.path);
    return { status: 'ok', outPath: r.filePath, cssFallback: css.missing, missingPath: css.missingPath ?? null };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
});

ipcMain.handle('shell:showInFolder', (_e, p) => shell.showItemInFolder(p));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
