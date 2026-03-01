---
title: Mebuki システムアーキテクチャ
status: stable
category: specs
ai_outcome: keep
ai_reviewed: true
createdAt: '2026-01-25T05:00:00.000Z'
updatedAt: '2026-02-15T05:00:00.000Z'
---

## 概要

芽吹き（Mebuki）は、思考を育てるノートアプリ。メモが raw → refining → stable と成長する。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js 15 App Router |
| スタイリング | Tailwind CSS v4 |
| 認証 | NextAuth v5 (GitHub OAuth) |
| ストレージ | GitHub API (Octokit) |
| 言語 | TypeScript |

## ディレクトリ構成

```
app/
  (app)/          # メインアプリ
    home/         # ダッシュボード
    list/         # ノートリスト
    settings/     # 設定
  (editor)/       # エディタ
    edit/         # ノート編集
api/notes/        # CRUD API Routes
components/       # UI コンポーネント
lib/
  github.ts       # GitHub API クライアント
  auth.ts         # 認証ユーティリティ
types/note.ts     # 型定義
```

## データフロー

1. GitHub OAuth でログイン → アクセストークン取得
2. サーバーコンポーネントで `cachedListNotes(token)` を呼ぶ
3. GitHub リポジトリの `notes/{category}/{id}.md` を読む
4. CRUD は `/api/notes` Route Handler 経由で実行
