'use strict';
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // ドロップされた File からローカルのパスを取得する
  pathForFile: (file) => webUtils.getPathForFile(file),
  validateMarkdown: (p) => ipcRenderer.invoke('md:validate', p),
  chooseMarkdown: () => ipcRenderer.invoke('md:choose'),
  convert: (mdPath) => ipcRenderer.invoke('pdf:convert', mdPath),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  chooseCss: () => ipcRenderer.invoke('settings:chooseCss'),
  resetCss: () => ipcRenderer.invoke('settings:resetCss'),
  exportDefaultCss: () => ipcRenderer.invoke('css:exportDefault'),
  showInFolder: (p) => ipcRenderer.invoke('shell:showInFolder', p),
});
