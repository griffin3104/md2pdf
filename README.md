# md2pdf

Markdown ファイルを、ドラッグ&ドロップで PDF に変換するデスクトップアプリです（Windows / macOS）。

- 日本語の文書向けに調整した CSS を同梱（表紙、見出し、表、コードの構文ハイライト）
- [mermaid](https://mermaid.js.org/) の図をそのまま PDF に描画
- Markdown 内の画像（相対パス）に対応
- Markdown 先頭の YAML フロントマター（`---` で囲まれたメタデータ）は、PDF には出力せず取り除く
- CSS を好きなものに切り替え可能。同梱の既定 CSS はエクスポートして雛形にできる

## 使い方

1. アプリを起動する
2. Markdown ファイル（`.md` / `.markdown`）をウィンドウにドラッグ&ドロップする（クリックして選ぶこともできます）
3. 「PDF化」ボタンを押して、保存先を選ぶ

出力は A4、余白は上下 16mm・左右 8mm です。

### CSS を切り替える

右上の「設定」から、使用する CSS を選べます。

- 「CSS を選択…」: 任意の `.css` ファイルを使う
- 「既定に戻す」: 同梱の CSS に戻す
- 「既定 CSS をエクスポート…」: 同梱の CSS を保存する（自作 CSS の雛形に使えます）

指定した CSS ファイルが見つからないときは、既定の CSS で変換します。

## インストール

[Releases](../../releases) から、お使いの OS 用のファイルをダウンロードしてください。

> **注意**: 現在、アプリには署名をしていません。初回起動時に OS の警告が出ることがあります。

- **macOS**: `.dmg` を開いて Applications にドラッグします。起動できないときは、アプリを右クリックして「開く」を選びます。「壊れている」と表示される場合は、ターミナルで次を実行してください。
  ```
  xattr -cr /Applications/md2pdf.app
  ```
- **Windows**: `.exe` を実行します。「PC を保護しました」と表示されたら、「詳細情報」→「実行」を選びます。

## 開発

必要なもの: Node.js

```
npm install
npm start          # アプリを起動
npm test           # フロントマター除去のテスト
npm run smoke      # GUI なしで samples/sample.md を out/smoke.pdf に変換（動作確認用）
npm run dist:mac   # macOS 用 .dmg を作成（macOS 上で実行）
npm run dist:win   # Windows 用インストーラを作成（Windows 上で実行）
```

### リリース

`package.json` の `version` を更新してコミットしたあと、`v` で始まるタグを push します。
GitHub Actions が macOS（Apple Silicon / Intel）と Windows のインストーラをビルドして、
[Releases](../../releases) に**下書き**を作ります。内容とリリースノートを確認して、「Publish release」で公開してください。

```
npm version 0.9.1 --no-git-tag-version   # package.json / package-lock.json を更新
git commit -am "バージョンを 0.9.1 に更新" && git push
git tag v0.9.1
git push origin v0.9.1
```

タグを打たずにビルドだけ確認したいときは、GitHub の Actions タブから「Release」を手動実行します（インストーラは Artifacts に 7 日間残ります）。

### 構成

```
src/main/       メインプロセス（ウィンドウ、ダイアログ、設定の保存、PDF 変換）
src/renderer/   画面（ドラッグ&ドロップ、設定）
src/assets/     同梱リソース（既定 CSS）
samples/        動作確認用の Markdown
scripts/        開発用スクリプト
docs/           設計メモ・手順書（requirements.md: 要件メモ / workflow.md: 作業・リリース手順書）
```

PDF 変換は、Electron 内蔵の Chromium（`printToPDF`）で行っています。Markdown は
[marked](https://github.com/markedjs/marked) で HTML にし、コードは
[highlight.js](https://highlightjs.org/)、図は mermaid で描画しています。

## コントリビューション

バグ報告、提案、プルリクエストを歓迎します。参加方法は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## ライセンス

[MIT License](LICENSE)
