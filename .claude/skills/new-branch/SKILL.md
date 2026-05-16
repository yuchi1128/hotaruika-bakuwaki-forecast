---
name: git-new-branch
description: 新機能開発用のブランチ作成。main から最新を取得し、適切な命名規則でブランチを作成する。Use when user wants to start new feature development, create a branch, or begin working on a fix.
allowed-tools: Bash, Read, Grep, Glob
---

# Git New Branch スキル

## Instructions

このスキルはユーザーの要望に応じて適切なブランチを作成します。

**重要**: git コマンドは作業ディレクトリで直接実行する。`git -C` は使用禁止。

### 実行フロー

#### 1. 事前確認（並列実行）

以下の git コマンドを**並列**で実行:

```bash
git branch --show-current    # 現在のブランチ
git status                   # 未コミットの変更がないか
git stash list               # スタッシュの状態
```

##### 未コミットの変更がある場合

**AskUserQuestion ツール**でユーザーに確認:

```
⚠️ 未コミットの変更があります。
1. スタッシュして続行（git stash）
2. 中止
どちらにしますか？
```

#### 2. ブランチ名の決定

ユーザーの要望内容から適切な prefix と名前を決定する。

##### ブランチ命名規則

| prefix      | 用途                         | 例                              |
| ----------- | ---------------------------- | ------------------------------- |
| `feature/`  | 新機能の追加                 | `feature/add-reaction`          |
| `fix/`      | バグ修正                     | `fix/session-timeout`           |
| `hotfix/`   | 本番の緊急修正               | `hotfix/login-error`            |
| `refactor/` | リファクタリング             | `refactor/cache-logic`          |
| `docs/`     | ドキュメントのみ             | `docs/api-readme`               |
| `chore/`    | CI、依存関係、設定変更       | `chore/update-dependencies`     |

##### 命名ルール

- 英語の kebab-case（小文字、ハイフン区切り）
- 短く具体的に（2〜4語程度）
- 日本語の要望は英訳してブランチ名にする

#### 3. main を最新化してブランチ作成

```bash
# main に切り替え
git checkout main

# 最新を取得
git pull origin main

# 新しいブランチを作成して切り替え
git checkout -b <prefix>/<branch-name>
```

#### 4. 結果報告

作成したブランチ名と、これから行う作業内容をユーザーに報告する:

```
✅ ブランチを作成しました: feature/add-reaction
   base: main (最新)

これから〇〇の実装を始めます。
```

### 安全規則

- main 上で直接作業を開始しない（必ずブランチを作成する）
- git config の更新は禁止
- 既に同名のブランチが存在する場合はユーザーに確認する

## Examples

### 新機能開発

```
ユーザー: 掲示板に画像アップロード機能を追加したい
→ ブランチ名: feature/add-image-upload
```

### バグ修正

```
ユーザー: リアクションが二重に送信されるバグを直したい
→ ブランチ名: fix/duplicate-reaction
```

### 緊急修正

```
ユーザー: 本番でログインできなくなっている、至急直して
→ ブランチ名: hotfix/login-failure
```
