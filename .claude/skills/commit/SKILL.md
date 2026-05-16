---
name: git-commit
description: Git コミットワークフローの実行。変更のステージング、コミットメッセージ生成、コミット実行を行う。Use when user wants to commit changes, create a commit, or stage and commit files.
allowed-tools: Bash, Read, Grep, Glob
---

# Git Commit スキル

## Instructions

このスキルは Git コミットの全ワークフローを提供します。

**重要**: git コマンドは作業ディレクトリで直接実行する。`git -C` は使用禁止。

### 実行フロー

#### 1. 状態確認（並列実行）

以下の git コマンドを**並列**で実行し、現在の状態を把握する:

```bash
git status              # 未追跡ファイルと変更状態
git branch --show-current  # カレントブランチ
git diff                # ステージされていない変更
git diff --staged       # ステージ済みの変更
git log --oneline -5    # 直近のコミットスタイル確認
```

#### 2. ブランチチェック

現在のブランチが `main` または `master` の場合、**コミットを中止**する。
ユーザーに警告し、作業ブランチの作成を提案する:

```
⚠️ 現在 main ブランチにいます。main への直接コミットは禁止されています。
作業ブランチを作成してください:
  git checkout -b feature/〇〇
```

**AskUserQuestion ツール**でユーザーに確認を取り、明示的な許可がない限りコミットを実行しない。

#### 3. 変更分析

ステージされた変更（または新規追加予定の変更）を分析:

- 変更の性質（new feature, enhancement, bug fix, refactoring, test, docs など）
- 変更の目的と理由
- 機密ファイルの有無を確認

**機密ファイル検出時は警告**:

- `.env`, `.env.*`
- `credentials.json`, `secrets.*`
- `*.pem`, `*.key`
- `config/local.*`

#### 4. コミットメッセージ生成

コミットメッセージは **一文** で簡潔に記述する。

##### 形式

```
<type>: <簡潔な説明>
```

- `type` は動詞セクションの分類に従う（feat, fix, refactor, docs, test, chore）
- 説明は日本語で、変更内容がわかる一文
- Co-Authored-By やエージェント署名は **含めない**

#### 5. ステージングとコミット実行

```bash
# 関連ファイルをステージング（必要な場合）
git add <files>

# コミット実行
git commit -m "fix: ログインセッションのタイムアウト修正"
```

#### 6. 結果確認

コミット後、`git status` で成功を確認する。

### 安全規則

- pre-commit hook でコミットが失敗した場合は、問題を修正して**新しいコミット**を作成する（--amend は使用しない）
- コミットが成功したが hook がファイルを自動修正した場合のみ、--amend を検討可能
- プッシュ済みのコミットは --amend しない
- git config の更新は禁止
- `--no-verify`, `--no-gpg-sign` などのスキップオプションは禁止

### type の使い分け

- `feat`: 新しい機能の追加
- `fix`: バグ修正
- `refactor`: 機能変更なしのコード改善
- `docs`: ドキュメントのみの変更
- `test`: テストのみの変更
- `chore`: ビルド、CI、依存関係の変更

## Examples

### 良いコミットメッセージの例

```
fix: セッションタイムアウトを30分から1時間に延長
feat: 掲示板のリアクション機能を追加
refactor: 予測キャッシュの更新処理を整理
docs: APIエンドポイントの説明を更新
```

### 悪いコミットメッセージの例

```
fix bug
update files
変更
```
