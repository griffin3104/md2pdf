# 作業手順書

md2pdf の開発・リリースの手順をまとめたものです（メンテナー向け）。

- [1. 前提](#1-前提)
- [2. 通常の作業の流れ](#2-通常の作業の流れ)
- [3. 外部からの PR を受け取るとき](#3-外部からの-pr-を受け取るとき)
- [4. リリース（タグの付け方）](#4-リリースタグの付け方)
- [5. うまくいかないとき](#5-うまくいかないとき)
- [6. 設定メモ](#6-設定メモ)

## 1. 前提

### GitHub のアカウント（個人用を使う）

このリポジトリは、個人アカウント **`griffin3104`** で管理しています。会社用のアカウントと混ざらないように、次の設定になっていることを確認してください。

| 項目 | 内容 |
|---|---|
| リモート URL | `git@github.com-sub:griffin3104/md2pdf.git`（`~/.ssh/config` の `github.com-sub` が個人用の鍵） |
| コミットの名前・メール | このリポジトリのローカル設定で `griffin3104` / GitHub の noreply アドレス |
| `gh` コマンド | `griffin3104` が有効であること |

確認コマンド:

```
git remote -v                     # github.com-sub になっているか
git config --local user.name      # griffin3104
git config --local user.email     # ...@users.noreply.github.com
gh auth status                    # griffin3104 が Active account: true か
gh auth switch -u griffin3104     # 違うときに切り替える
```

### ブランチのルール

`main` ブランチは保護されています。

- 直接 push はできません。必ず PR（プルリクエスト）を通します。
- PR をマージするには、CI（`test`）の成功が必要です。
- 承認（レビュー）は 0 人でマージできます。
- `main` の削除と、強制 push（履歴の書き換え）はできません。

## 2. 通常の作業の流れ

### 2.1 最新の `main` から作業ブランチを作る

```
git checkout main
git pull
git checkout -b <ブランチ名>      # 例: fix-table-style / add-dark-theme
```

ブランチ名は、変更の内容が分かる英語の短い名前にします。

### 2.2 変更してコミットする

```
npm start          # アプリを起動して確認
npm test           # テストを実行
npm run smoke      # GUI なしで samples/sample.md を変換して確認
```

```
git add <変更したファイル>
git commit -m "変更内容を簡潔に"
```

見た目（CSS・PDF の出力）を変えたときは、変更前後の PDF を並べて、意図しない差が出ていないか確認します。

### 2.3 push して PR を作る

```
git push -u origin <ブランチ名>
gh pr create --fill               # または GitHub の画面で作る
```

PR には、「何を」「なぜ」変更したかを書きます。

### 2.4 CI の結果を確認してマージする

```
gh pr checks --watch              # CI が終わるまで待つ（または GitHub の画面で確認）
gh pr merge --squash              # スカッシュマージ（コミットが 1 つにまとまる）
```

GitHub の画面なら、PR のページで **Squash and merge** を押します。マージ済みのブランチは、自動で削除されます。

### 2.5 手元を更新する

```
git checkout main
git pull
git branch -D <ブランチ名>        # 手元の作業ブランチを削除（スカッシュマージ後は -D が必要）
```

> スカッシュマージをすると、Git から見て「マージ済み」と判定されないため、`git branch -d` は失敗します。リモートでマージされたことを確認したうえで、`-D` で削除します。

## 3. 外部からの PR を受け取るとき

参加者の GitHub アカウントを、リポジトリに登録する必要はありません。参加者は **Fork** して PR を送ります（手順は [CONTRIBUTING.md](../CONTRIBUTING.md) を参照）。

メンテナーの作業:

1. PR の内容を読み、必要ならコメントで修正を依頼する。
2. 初めての参加者の PR では、GitHub の設定によって、CI の実行に承認が必要になることがあります（PR のページに **Approve and run** と表示される）。コードに問題がないことを確認してから押す。設定は、リポジトリの **Settings** → **Actions** → **General** の「Fork pull request workflows」で確認できます。
3. CI が成功したら、**Squash and merge** でマージする。
4. `package.json` の `version` は、参加者の PR では変更しない方針です。変更されていたら、依頼して戻してもらう。

## 4. リリース（タグの付け方）

リリースは、**「バージョンを上げる PR をマージ」→「タグを push」→「下書きを確認して公開」** の順に行います。

### 4.1 バージョンを決める

[セマンティック バージョニング](https://semver.org/lang/ja/)（`メジャー.マイナー.パッチ`）に沿います。

| 変更の種類 | 上げる桁 | 例 |
|---|---|---|
| バグ修正のみ | パッチ | 1.0.0 → 1.0.1 |
| 後方互換のある機能追加 | マイナー | 1.0.1 → 1.1.0 |
| 互換性のない変更 | メジャー | 1.1.0 → 2.0.0 |

### 4.2 バージョンを更新する PR をマージする

```
git checkout main
git pull
git checkout -b release-1.0.1
npm version 1.0.1 --no-git-tag-version     # package.json と package-lock.json を更新
git add package.json package-lock.json
git commit -m "バージョンを 1.0.1 に更新"
git push -u origin release-1.0.1
gh pr create --fill
gh pr checks --watch
gh pr merge --squash
```

> `package.json` の `version` は、インストーラのファイル名（例: `md2pdf-1.0.1-arm64.dmg`）に使われます。タグの名前と一致させてください。

### 4.3 `main` の最新にタグを付けて push する

```
git checkout main
git pull                                   # バージョン更新がマージされた状態か確認
git log --oneline -3
git tag v1.0.1
git push origin v1.0.1
```

タグは `v` で始まる名前（`v1.0.1`）にします。このタグを push すると、GitHub Actions のリリースのワークフローが動きます。

### 4.4 ワークフローの結果を確認する

```
gh run list --limit 3
gh run watch                               # 実行中のジョブを選んで進捗を見る
```

次の順に実行されます（合計 15 分前後）。

1. `build (macos-latest)` と `build (windows-latest)` が並行して走り、インストーラを作る。
2. 両方が成功したら、`release` ジョブが、**下書き（Draft）のリリースを 1 つ**作る。

### 4.5 下書きを確認して公開する

1. <https://github.com/griffin3104/md2pdf/releases> を開き、下書きの `v1.0.1` の **Edit** を押す。
2. 添付ファイルを確認する。次の 3 つがそろっていること。
   - `md2pdf-1.0.1-arm64.dmg`（Mac / Apple Silicon）
   - `md2pdf-1.0.1.dmg`（Mac / Intel）
   - Windows 用の `.exe`（ファイル名はアップロード時に `md2pdf.Setup.1.0.1.exe` のようになる）
3. リリースノートを書く（雛形は [4.6](#46-リリースノートの雛形)）。自動で入っている `Full Changelog` の行は残します。
4. 必要なら、実機（Mac / Windows）でインストーラを動かして確認する。
5. **Publish release** を押して公開する。

公開すると、リポジトリのトップページの右側「Releases」に表示されます。

### 4.6 リリースノートの雛形

````markdown
md2pdf X.Y.Z です。（変更の要約を 1 行）

## 変更点
- 変更内容 1
- 変更内容 2

## ダウンロード
| OS | ファイル |
|---|---|
| macOS（Apple Silicon: M1 以降） | `md2pdf-X.Y.Z-arm64.dmg` |
| macOS（Intel） | `md2pdf-X.Y.Z.dmg` |
| Windows | `md2pdf.Setup.X.Y.Z.exe` |

## 初回起動時の注意（署名なし）
このアプリには署名をしていないため、OS の警告が出ます。

- **macOS**: アプリを右クリックして「開く」を選んでください。「壊れている」と表示される場合は、ターミナルで次を実行します。
  ```
  xattr -cr /Applications/md2pdf.app
  ```
- **Windows**: 「PC を保護しました」と表示されたら、「詳細情報」→「実行」を選んでください。

## 既知の制限
- （あれば書く）
````

### 4.7 タグを付けずにビルドだけ確認する

リリースを作らずに、ビルドが通るかだけを確認できます。

```
gh workflow run release.yml --ref main
```

GitHub の Actions タブ →「Release」→ **Run workflow** でも実行できます。インストーラは、実行結果のページの **Artifacts** に 7 日間残ります（`release` ジョブは動かないため、Releases には載りません）。

### 4.8 ローカルでインストーラを作る

```
npm run dist:mac    # macOS 上で実行。dist/ に .dmg（arm64 / x64）ができる
npm run dist:win    # Windows 上で実行
```

`dist/` は Git の管理対象外です。

## 5. うまくいかないとき

### タグを間違えて push した / やり直したい

下書きを削除し、タグを消してから、やり直します。

```
gh release delete v1.0.1 --yes             # 下書きができていれば削除（--cleanup-tag を付けるとタグも消える）
git push origin :refs/tags/v1.0.1          # リモートのタグを削除
git tag -d v1.0.1                          # 手元のタグを削除
```

その後、問題を直してから、[4.3](#43-main-の最新にタグを付けて-push-する) のとおりタグを打ち直します。

> 公開（Publish）済みのリリースのタグは、削除しないでください。ダウンロードした人に影響します。修正が必要な場合は、パッチバージョンを上げて、新しいリリースを出します。

### ビルドが失敗した

```
gh run list --limit 3
gh run view <run-id> --log-failed          # 失敗したステップのログを見る
```

一時的な失敗（ネットワークなど）なら、失敗したジョブだけ再実行できます。

```
gh run rerun <run-id> --failed
```

### `release` ジョブだけが失敗した

同じタグの下書きが残っていると、`release` ジョブの再実行は失敗します。下書きを削除してから再実行してください。

```
gh release delete v1.0.1 --yes
gh run rerun <run-id> --failed
```

### Windows の `.exe` が Release にない / 下書きが 2 つできた

リリースのワークフローは、「ビルド（並行）→ `release` ジョブで 1 回だけ作成」の 2 段階です。もし下書きが複数できていたら、ワークフローが想定どおりに動いていません。`.github/workflows/release.yml` を確認してください。

### PR をマージできない

- CI（`test`）が失敗している → ログを確認して直し、push し直す。
- 「ブランチが古い」と表示される → PR のページの **Update branch** を押す（または手元で `main` を取り込んで push する）。
- 緊急で CI を待たずにマージしたい → リポジトリ管理者（メンテナー）は、PR のページから、ルールをバイパスしてマージできます。

## 6. 設定メモ

### `main` のブランチ保護（Ruleset: `protect-main`）

設定の場所: GitHub のリポジトリ → **Settings** → **Rules** → **Rulesets** → `protect-main`

| ルール | 内容 |
|---|---|
| Restrict deletions | `main` を削除できない |
| Block force pushes | 強制 push（履歴の書き換え）を禁止 |
| Require a pull request before merging | PR を必須にする（承認は 0 人） |
| Require status checks to pass | `test` の成功が必須。ブランチが古い場合はマージ不可（strict） |
| Bypass list | リポジトリの管理者。PR のページからのみバイパス可能（直接 push は不可） |

### GitHub Actions

| ファイル | 起動のタイミング | 内容 |
|---|---|---|
| `.github/workflows/ci.yml` | PR、`main` への push | `npm ci` と `npm test`（ジョブ名: `test`） |
| `.github/workflows/release.yml` | `v*` タグの push、手動実行 | Mac / Windows のビルド → 下書きの Release を作成 |

CI のジョブ名（`test`）を変えると、ブランチ保護の「必須のチェック」と一致しなくなり、PR がマージできなくなります。名前を変えるときは、Ruleset の必須チェックも合わせて更新してください。

### 署名について

macOS / Windows とも、インストーラには署名をしていません（証明書がないため）。利用者には、リリースノートと README に、警告の回避方法を載せています。
