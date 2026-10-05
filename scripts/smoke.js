'use strict';
// 動作確認用: npm run smoke  （samples/sample.md を変換して out/smoke.pdf に出力）
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { convert } = require('../src/main/converter');

app.whenReady().then(async () => {
  const root = path.join(__dirname, '..');
  const out = path.join(root, 'out', 'smoke.pdf');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  try {
    await convert(path.join(root, 'samples', 'sample.md'), out, path.join(root, 'src', 'assets', 'default.css'));
    console.log('Generated:', out);
    app.exit(0);
  } catch (e) {
    console.error('Error:', e);
    app.exit(1);
  }
});
