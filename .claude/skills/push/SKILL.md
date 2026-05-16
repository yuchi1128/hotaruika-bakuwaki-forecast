---
name: git-push
description: Git プッシュワークフローの実行。現在のブランチをリモートリポジトリに安全にプッシュする。Use when user wants to push commits, push to remote, or sync with remote repository.
allowed-tools: Bash, Read, Grep, Glob
---

# Git Push スキル

## Instructions

このスキルは Git プッシュの全ワークフローを提供します。

**重要**: git コマンドは作業ディレクトリで直接実行する。`git -C` は使用禁止。

### 実行フロー

#### 1. 事前確認（並列実行）

以下の git コマンドを**並列**で実行:

```bash
git branch --show-current                                       # 現在のブランチ名
git status                                                      # コミットされていない変更
git branch -vv                                                  # ブランチとトラッキング状態
git log @{u}..HEAD --oneline 2>/dev/null || echo "No upstream"  # プッシュ予定のコミット
```

現在のブランチ名をユーザーに表示し、プッシュ先を明確にする。

#### 2. 安全性チェック

以下を確認:

- **force push が必要な状態でないか**
- リモートとの差分が妥当か

##### 警告が必要なケース

| ケース                         | 対応                                           |
| ------------------------------ | ---------------------------------------------- |
| force push が必要              | **AskUserQuestion ツール**で明示的な確認を取る |
| コミットされていない変更がある | 先にコミットするか確認                         |

#### 3. プッシュ実行

```bash
# アップストリームが設定されていない場合
git push -u origin <current-branch>

# アップストリームが設定済みの場合
git push
```

#### 4. 結果確認

プッシュ後、成功メッセージまたはエラーを報告する。

### オプション引数

- `--force` または `-f`: force push を実行（ユーザー確認後のみ）
- `--set-upstream` または `-u`: アップストリームを設定してプッシュ

### 安全規則

#### 絶対禁止

- **main/master/develop への force push は絶対禁止**
- git config の更新は禁止
- `--force-with-lease` なしの force push は非推奨

#### 要確認

- main/master/develop への直接プッシュ
- force push（他ブランチでも確認必須）
- リモートとの diverge 状態

### エラー対応

| エラー                     | 対応                                           |
| -------------------------- | ---------------------------------------------- |
| ネットワークエラー         | リトライを提案                                 |
| 認証エラー                 | 認証設定の確認を促す                           |
| リモートが先行             | pull --rebase を提案                           |
| reject（non-fast-forward） | 状況を説明し、rebase または force の判断を仰ぐ |

## Examples

### 通常のプッシュ

```bash
# 状態確認
$ git status
On branch feature/add-login
Your branch is ahead of 'origin/feature/add-login' by 2 commits.

# プッシュ実行
$ git push
Enumerating objects: 10, done.
...
To github.com:user/repo.git
   abc1234..def5678  feature/add-login -> feature/add-login
```

### 新規ブランチの初回プッシュ

```bash
# アップストリーム未設定の場合
$ git push -u origin feature/new-feature
Branch 'feature/new-feature' set up to track remote branch 'feature/new-feature' from 'origin'.
```

### force push が必要な場合（要確認）

```
⚠️ force push が必要です。

現在の状態:
- ローカル: abc1234
- リモート: xyz9876（diverged）

force push を実行しますか？
注意: リモートの変更が失われる可能性があります。

[確認後のみ実行]
$ git push --force-with-lease
```
