# Mebuki

思考の「成熟度」を育てるノートアプリ。

## コアコンセプト

ノートは3つのステータスを持ち、育てながら管理する。

```
raw（荒削り） → refining（育て中） → stable（安定した知識）
```

## カテゴリ

| カテゴリ | 用途 |
|----------|------|
| `learning` | インプット・学習メモ |
| `specs` | 仕様・アウトプット（learningから昇華） |

## データ構造

ノートはこのリポジトリの `notes/` ディレクトリにMarkdownファイルとして保存される。

```
notes/
  learning/
    1234567890-note-title.md
  specs/
    1234567890-spec-title.md
```

各ファイルのフロントマター:

```yaml
---
title: "タイトル"
status: raw          # raw | refining | stable
category: learning   # learning | specs
ai_review: false
createdAt: "2026-02-27T00:00:00.000Z"
updatedAt: "2026-02-27T00:00:00.000Z"
---
ノート本文（Markdown）
```

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して以下を設定する:

```env
GITHUB_TOKEN=ghp_xxxx        # GitHub Personal Access Token (scope: repo)
GITHUB_OWNER=Sintuba
GITHUB_REPO=Mebuki_app
GITHUB_BRANCH=main
```

**GitHub Token の作成方法:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 「Generate new token」→ `repo` スコープにチェック
3. 生成されたトークンをコピーして `GITHUB_TOKEN` に設定

### 3. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:3000` でアクセス。

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **エディタ**: @uiw/react-md-editor
- **ストレージ**: GitHub Contents API (@octokit/rest)
- **フロントマター解析**: gray-matter
