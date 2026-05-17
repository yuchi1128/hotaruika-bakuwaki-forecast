---
name: worktree-new
description: 新規ワークツリーを作成して開発環境を起動する。ブランチ作成、setup-worktree.sh実行、依存インストール、devサーバー起動までを自動化。Use when user wants to start work in a new worktree, create a worktree for a feature, or begin parallel development.
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# Worktree New スキル

## Instructions

このスキルは新規ワークツリーを作成し、開発をすぐ始められる状態にします。

**重要**: 既存の `git-conventions` スキルのルールに従う。`git -C` は使用禁止、作業ディレクトリで直接実行する。

### 実行フロー

#### 1. 事前確認

main に居ること、未コミット変更がないことを確認:

```bash
git branch --show-current
git status
```

##### main 以外にいる場合

**AskUserQuestion** で確認:

```
⚠️ 現在 main ブランチにいません。main に切り替えてから worktree を作成しますか?
[A] main に切り替えて続行
[B] 中止
```

##### 未コミット変更がある場合

中止してユーザーに対応を促す。

#### 2. トピック名の確認

**AskUserQuestion** でユーザーに確認:

```
ワークツリー名を教えてください
- kebab-case (例: add-terms-page, fix-cors-bug)
- 短く具体的に (2〜4語程度)
- 日本語の要望は英訳する
```

ブランチ名は `worktree-<topic>` 形式になる。

##### 既存ブランチとの衝突チェック

```bash
git branch -a | grep "worktree-<topic>"
```

衝突する場合は別の名前を促す。

#### 3. モード選択

**AskUserQuestion** で開発モードを確認:

```
開発モードを選んでください:
[A] フロントエンドのみ変更 (Main の backend / DB を共有・推奨)
    → Docker起動不要、軽量
[B] フロント + バックエンド変更 (Main DB を共有)
    → Worktree専用の backend Docker のみ起動
[C] フロント + バック + DB変更 (完全独立)
    → Worktree専用の backend と db 両方を起動
    → DBスキーマ変更 (マイグレーション) の検証に使う
```

#### 4. ワークツリー作成

```bash
git worktree add .claude/worktrees/<topic> -b worktree-<topic> main
cd .claude/worktrees/<topic>
```

#### 5. セットアップ実行

```bash
bash scripts/setup-worktree.sh
```

出力から **Frontend port** / **Backend port** / **DB port** を抽出する。

#### 6. 依存パッケージのインストール (初回のみ)

```bash
cd frontend
[ -d node_modules ] || npm install
```

#### 7. (モードB / C のみ) frontend env.local の書き換え

`frontend/.env.local` の `NEXT_PUBLIC_API_URL` を worktree backend に書き換える:

```bash
sed -i.tmp "s|^NEXT_PUBLIC_API_URL=http://localhost:8080|NEXT_PUBLIC_API_URL=http://localhost:<backend-port>|" .env.local
rm .env.local.tmp
```

#### 8. (モードC のみ) .env の DATABASE_URL 書き換え

ワークツリーのルート `.env` の `DATABASE_URL` を Mode C 用 (docker内部 db:5432) に書き換える:

```bash
sed -i.tmp \
  -e 's|^DATABASE_URL=postgres://user:password@host.docker.internal:5433/hotaruika_db?sslmode=disable|# DATABASE_URL=postgres://user:password@host.docker.internal:5433/hotaruika_db?sslmode=disable|' \
  -e 's|^# DATABASE_URL=postgres://user:password@db:5432/hotaruika_db?sslmode=disable|DATABASE_URL=postgres://user:password@db:5432/hotaruika_db?sslmode=disable|' \
  .env
rm .env.tmp
```

#### 9. Docker 起動 (バックグラウンド)

モードに応じて起動するサービスが異なる:

- **モードA**: 起動不要 (スキップ)
- **モードB**:
  ```bash
  docker compose up backend --no-deps
  ```
- **モードC**:
  ```bash
  docker compose up backend db
  ```

#### 10. Dev サーバー起動 (バックグラウンド)

```bash
PORT=<frontend-port> npm run dev
```

起動完了 (`✓ Ready` ログ) を確認してから次へ。

#### 11. 結果報告

ユーザーに以下を伝える:

```
✅ ワークツリー作成完了

  Path:     .claude/worktrees/<topic>
  Branch:   worktree-<topic>
  Mode:     <A: フロントのみ / B: バック共有DB / C: バック+独立DB>
  Frontend: http://localhost:<frontend-port>
  Backend:  Main共有 (8080) or Worktree (<backend-port>)
  DB:       Main共有 (5433) or Worktree (<db-port>)

ブラウザで http://localhost:<frontend-port> を開いて作業を始めてください。
```

### 安全規則

- main 以外のブランチでの実行は必ず確認
- 既存の同名ブランチ・worktreeとの衝突は中止し別名を促す
- npm install / docker compose / npm run dev の失敗時はそこで停止 (自動修復しない)
- ユーザーが「今すぐ動かなくていい」と言わない限り、最後まで実行する

## Examples

### モードA (フロントエンドのみ)

```
ユーザー: 利用規約ページを作りたい
→ /worktree-new
   トピック: add-terms-page
   モード: A
→ Path:     .claude/worktrees/add-terms-page
   Branch:   worktree-add-terms-page
   Frontend: http://localhost:3115
   Backend:  Main共有 (8080)
   DB:       Main共有 (5433)
```

### モードB (フロント+バック・Main DB共有)

```
ユーザー: 通報APIを追加したい (DBスキーマは変えない)
→ /worktree-new
   トピック: add-report-api
   モード: B
→ Path:     .claude/worktrees/add-report-api
   Branch:   worktree-add-report-api
   Frontend: http://localhost:3122
   Backend:  Worktree (8122)
   DB:       Main共有 (5433)
```

### モードC (フロント+バック+独立DB)

```
ユーザー: テーブルを追加するマイグレーションを試したい
→ /worktree-new
   トピック: add-feature-flags-table
   モード: C
→ Path:     .claude/worktrees/add-feature-flags-table
   Branch:   worktree-add-feature-flags-table
   Frontend: http://localhost:3108
   Backend:  Worktree (8108)
   DB:       Worktree (5508)
```

### 失敗例: 未コミット変更あり

```
ユーザー: 新しい worktree を作って
→ /worktree-new
→ ⚠️ main に未コミット変更があります。コミット or スタッシュしてから再実行してください。
```
