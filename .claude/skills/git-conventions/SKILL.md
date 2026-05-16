---
name: git-conventions
description: Git 操作の共通規則とベストプラクティス。安全規則、機密ファイル、禁止事項を定義。全ての Git 操作で自動適用される。
context: fork
user-invocable: false
allowed-tools: Bash, Read, Grep, Glob
---

# Git Conventions スキル

## Instructions

このスキルは Git 操作における共通の規則とベストプラクティスを提供します。
`git-commit` や `git-push` スキルと組み合わせて自動適用されます。

### 正しい git の使い方

**重要**: すべての git コマンドは作業ディレクトリ（カレントディレクトリ）で直接実行する。

```bash
# ✅ 正しい使い方
git status
git diff
git add src/app.ts
git commit -m "message"
git push

# ❌ 禁止: git -C を使わない
git -C /path/to/repo status
git -C /Users/user/project diff
```

**理由**:

- Claude Code は常にプロジェクトルートを作業ディレクトリとして動作する
- `git -C` は冗長であり、パスの誤りによるリスクがある
- シンプルで読みやすいコマンドを維持する

### 安全規則

#### 絶対禁止

| 操作                            | 理由                                               |
| ------------------------------- | -------------------------------------------------- |
| **`git -C <path>` オプション**  | **作業ディレクトリで直接実行すること。冗長で不要** |
| git config の更新               | セキュリティリスク                                 |
| main/master への直接コミット    | 作業ブランチで作業すること                         |
| main/master への force push     | 共同作業者への影響                                 |
| `--no-verify` オプション        | hook をスキップすべきでない                        |
| `--no-gpg-sign` オプション      | 署名をスキップすべきでない                         |
| `git reset --hard` の無確認実行 | データ消失リスク                                   |

#### --amend の使用条件

以下の**すべて**を満たす場合のみ使用可能:

1. ユーザーが明示的に要求、または pre-commit hook がファイルを自動修正した場合
2. HEAD コミットが現在の会話で作成された（`git log -1 --format='%an %ae'` で確認）
3. コミットがリモートにプッシュされていない（`git status` で確認）

**コミットが失敗または reject された場合は、絶対に --amend を使用しない。問題を修正して新しいコミットを作成する。**

### 機密ファイル

以下のファイルは**絶対にコミットしない**:

```
.env
.env.*
.env.local
.env.*.local
credentials.json
secrets.*
*.pem
*.key
*.p12
config/local.*
```

検出した場合は**警告**を表示し、ユーザーに確認を求める。

### コミットメッセージ形式

一文で簡潔に記述する。Co-Authored-By やエージェント署名は含めない。

```bash
git commit -m "fix: ログインセッションのタイムアウト修正"
```

### type の使い分け

| type       | 用途                       |
| ---------- | -------------------------- |
| `feat`     | 新しい機能の追加           |
| `fix`      | バグ修正                   |
| `refactor` | 機能変更なしのコード改善   |
| `docs`     | ドキュメントのみの変更     |
| `test`     | テストのみの変更           |
| `chore`    | ビルド、CI、依存関係の変更 |

### 並列実行の推奨

以下の読み取り系コマンドは**並列実行**で効率化:

```bash
# 並列実行可能
git status
git diff
git diff --staged
git log --oneline -5
git branch -vv
```

## Examples

### 安全な操作フロー

```bash
# 1. 状態確認（並列）
git status & git diff & git log --oneline -3

# 2. ステージング
git add <files>

# 3. コミット（一文形式）
git commit -m "fix: 〇〇の修正"

# 4. プッシュ前確認
git log @{u}..HEAD --oneline

# 5. プッシュ
git push
```

### 危険な操作の例（禁止）

```bash
# ❌ 禁止: hook スキップ
git commit --no-verify

# ❌ 禁止: main への force push
git push --force origin main

# ❌ 禁止: 無確認の hard reset
git reset --hard HEAD~3
```
