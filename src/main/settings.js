'use strict';
// 設定の保存（userData/settings.json）。cssPath が null のときは同梱の既定 CSS を使う。
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULTS = { cssPath: null };

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(patch) {
  const next = { ...load(), ...patch };
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

module.exports = { load, save };
