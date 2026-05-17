---
name: worktree-cleanup
description: 作業完了後のワークツリー片付け。devサーバー停止、Docker停止、worktree削除、ブランチ削除までを自動化。Use when user wants to clean up after PR merge, remove a worktree, or finish work on a worktree.
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# Worktree Cleanup スキル

## Instructions

このスキルはマージ後のワークツリー片付けを自動化します。

**重要**: 既存の `git-conventions` スキルのルールに従う。`git -C` は使用禁止、作業ディレクトリで直接実行する。

### 実行フロー

#### 1. 現在地と対象 worktree の特定

```bash
pwd
git worktree list
```

##### 現在ワークツリー内の場合

そのworktreeを片付け対象とする。

##### 現在 main の場合

`git worktree list` の結果から、複数あれば **AskUserQuestion** でどのworktreeを片付けるか確認:

```
片付けるワークツリーを選んでください:
[1] add-terms-page
[2] fix-cors-bug
[3] 中止
```

#### 2. 未コミット変更チェック

対象 worktree で:

```bash
git status --porcelain
```

未コミット変更がある場合は **AskUserQuestion**:

```
⚠️ このワークツリーに未コミットの変更があります。
[A] 破棄して片付ける (--force)
[B] 中止
```

#### 3. マージ済みチェック

```bash
git -C <main-repo-path> branch --merged main | grep "worktree-<topic>"
```

マージされていない場合は **AskUserQuestion**:

```
⚠️ このブランチは main にマージされていません。
本当に削除しますか?
[A] それでも削除する
[B] 中止
```

#### 4. 動作中の dev サーバーを停止

このセッションで `npm run dev` をバックグラウンド起動していた場合、**TaskStop** で停止する。
(タスクIDが不明な場合はユーザーに確認するか、`lsof -i :<port>` で確認)

#### 5. Worktree の Docker (backend / db) 停止

該当ワークツリーのコンテナが起動しているか確認 (Mode B では backend のみ、Mode C では backend と db 両方):

```bash
docker ps --filter "name=<worktree-name>-" --format "{{.Names}}"
```

起動していれば worktree ルートで:

```bash
cd .claude/worktrees/<topic>
docker compose down
```

(backend / db / その他関連コンテナがまとめて停止・削除される)

#### 6. main へ移動

```bash
cd <main-repo-path>
git checkout main
```

#### 7. main を最新化

```bash
git pull origin main
```

#### 8. Worktree 削除

```bash
git worktree remove .claude/worktrees/<topic>
```

未コミット変更で警告が出る場合は、Step 2 で確認済みなら `--force` をつける。

#### 9. ローカルブランチ削除

マージ済みなら:

```bash
git branch -d worktree-<topic>
```

マージされていないが削除確認済みの場合:

```bash
git branch -D worktree-<topic>
```

#### 10. リモート追跡参照の prune

```bash
git fetch --prune
```

#### 11. 結果報告

```
✅ ワークツリー片付け完了

  削除: .claude/worktrees/<topic>
  ブランチ削除: worktree-<topic>
  Docker: <停止 / 元々起動していなかった>
  Main: 最新化済み (<commit-hash>)
```

### 安全規則

- 未コミット変更がある場合は必ず確認
- 未マージブランチは確認なしに削除しない
- Docker停止前に該当ワークツリーのコンテナか確認 (他worktreeを誤って停止しない)
- main ブランチ自体は絶対に削除しない

## Examples

### 通常の片付け (マージ済み・モードAだった)

```
ユーザー: 利用規約の作業終わった、片付けて
→ /worktree-cleanup
→ 対象: add-terms-page
→ 未コミット変更なし
→ マージ済み
→ dev サーバー停止
→ Docker: 元々起動していなかった
→ worktree削除 / ブランチ削除 / main最新化 / 完了
```

### 通常の片付け (マージ済み・モードBだった)

```
ユーザー: APIの作業終わった、片付けて
→ /worktree-cleanup
→ 対象: add-report-api
→ 未コミット変更なし
→ マージ済み
→ dev サーバー停止
→ Worktree backend Docker停止
→ worktree削除 / ブランチ削除 / main最新化 / 完了
```

### 通常の片付け (マージ済み・モードCだった)

```
ユーザー: マイグレーションの検証終わった、片付けて
→ /worktree-cleanup
→ 対象: add-feature-flags-table
→ 未コミット変更なし
→ マージ済み
→ dev サーバー停止
→ Worktree backend + db Docker停止
→ worktree削除 / ブランチ削除 / main最新化 / 完了
```

### 作業キャンセル (未マージ)

```
ユーザー: この作業もうやめたい
→ /worktree-cleanup
→ 未コミット変更あり (確認 → 破棄)
→ マージされていない (確認 → 強制削除)
→ サーバー停止 → worktree削除 → ブランチ強制削除 (-D)
```
