# md2pdf (GUI版)

Markdown ファイルを PDF に変換するデスクトップアプリ。
現在の zsh 関数 `~/.zsh/functions/md2pdf` を GUI アプリ化し、Windows / macOS の両方で動かすことを目的とする。

## 技術方針

- フレームワーク: **Electron**（Tauri も検討したが、PDF 出力用の Chromium が内蔵されていない点がネックのため見送り）
- パッケージング: electron-builder（macOS: `.dmg` / Windows: NSIS インストーラ）
- ソースコードは本フォルダ直下の `src/` 以下に置く
  - `src/main/` : メインプロセス（ファイルダイアログ、設定の保存、PDF 変換）
  - `src/renderer/` : 画面（UI、ドラッグ&ドロップ）
  - `src/assets/` : 同梱リソース（既定 CSS など）
- 対応 OS: Windows / macOS
- PDF 変換は、Electron 内蔵の Chromium（`webContents.printToPDF()`）で行う方針

## 機能要件

### 1. Markdown の指定（ドラッグ&ドロップ）
- Markdown ファイルをアプリ画面にドラッグ&ドロップして指定する
- 指定したファイル名を画面に表示する
- Markdown 以外のファイルがドロップされた場合は、エラーメッセージを表示して受け付けない

### 2. PDF 変換
- 画面の「PDF化」ボタンを押すと、PDF の出力先を選ぶ保存ダイアログが開く
- 保存ダイアログの初期ファイル名は `<Markdown名>.pdf`
- 変換仕様は現行の zsh 関数に合わせる
  - 用紙: A4
  - 余白: 上下 16mm / 左右 8mm
  - Markdown 内の画像（相対パス）が PDF に反映されること
  - mermaid ブロックが図として PDF に反映されること
- 変換完了後、完了メッセージを表示する（出力先フォルダを開くボタンがあるとよい）
- 変換失敗時は、原因が分かるエラーメッセージを表示する

### 3. CSS
- 現行の `default.css` をアプリに同梱し、**既定の CSS** とする
- 設定で、参照する CSS を任意の CSS ファイルに切り替えられる
  - 「CSS を選択…」ボタンで `.css` ファイルを選ぶ
  - 「既定に戻す」ボタンで同梱の既定 CSS に戻す
- 現在有効な CSS（「既定」またはファイルパス）を、変換画面にも表示する
- 指定したカスタム CSS が見つからない場合は、エラーで止めずに既定 CSS にフォールバックし、その旨を通知する
- **既定 CSS のエクスポート機能**
  - 同梱の既定 CSS を任意の場所に保存できる（カスタム CSS を作るときの雛形用）

### 4. 設定の保存
- 設定（使用する CSS のパスなど）は、OS ごとのアプリ設定ディレクトリに保存する
  - 例: `{ "cssPath": null | "/path/to/custom.css" }`（`null` は既定 CSS を意味する）
- 次回起動時にも設定を引き継ぐ

## 画面構成（想定）

- メイン画面
  - ドラッグ&ドロップ領域（指定済みのファイル名を表示）
  - 有効な CSS の表示
  - 「PDF化」ボタン
  - ステータス / メッセージ表示
- 設定画面
  - CSS を選択 / 既定に戻す
  - 既定 CSS をエクスポート

## 移植元（現行の zsh 関数）の挙動メモ

- 使い方: `md2pdf <Markdownファイルパス> [-c|--css <CSSファイルパス>]`
- `lib/md2pdf-mermaid.js` で mermaid ブロックを展開した作業用 Markdown を、Markdown と同じディレクトリに一時的に作る（画像の相対パスを解決するため）
- `md-to-pdf` に `--basedir`（Markdown のあるディレクトリ）、`--stylesheet`（CSS）、A4・余白の PDF オプションを渡して変換する
- 出力は `<Markdown と同じ場所>/<同名>.pdf`

## 未決事項

- **PDF 出力の実装方式**
  - 案A（第一候補）: `marked` で HTML 化 → 非表示の BrowserWindow に読み込み → `printToPDF()`。Chromium の二重持ちを避けられ、画像の相対パスは `<base href>` で解決できる（隠し作業ファイルが不要になる）
  - 案B: 現行どおり `md-to-pdf` を組み込む。移植は容易だが、puppeteer 用の Chromium が別に必要になりサイズが増える
  - 最初に小さなプロトタイプで、案A の見た目（余白・画像・mermaid・CSS）が現行の出力と一致するか確認する
- mermaid の展開方式（`lib/md2pdf-mermaid.js` の内容を確認のうえ決定）
- 既定 CSS が、`md-to-pdf` の土台スタイルに依存していないかの確認
- 複数ファイルの一括変換に対応するか（初期版は 1 ファイルのみを想定）
- 配布方法（自分用のみか、配布するか。配布する場合は署名・公証の要否）

## 開発・ビルド

```
npm install
npm start          # アプリを起動
npm run smoke      # GUI なしで samples/sample.md を out/smoke.pdf に変換（動作確認用）
npm run dist:mac   # macOS 用 .dmg を作成（Mac 上で実行）
npm run dist:win   # Windows 用インストーラを作成（Windows 上、または CI で実行）
```

- `poc/` はプロトタイプ（検証用）。本番のコードは `src/` 以下
- 現在の実装状況: ドラッグ&ドロップ / PDF化（保存ダイアログ）/ CSS 切り替え / 既定 CSS のエクスポート / 設定の保存まで実装済み。Windows での動作確認は未実施
