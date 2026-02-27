---
title: Mebuki アプリ設計概要
status: refining
category: specs
ai_review: false
createdAt: '2026-02-28T03:00:00.000Z'
updatedAt: '2026-02-27T20:26:02.120Z'
---
## アーキテクチャ

- **フロントエンド**: Next.js 15 (App Router)
- **認証**: NextAuth v5 + GitHub OAuth
- **データストレージ**: GitHub リポジトリの Markdown ファイル
- **スタイリング**: Tailwind CSS v4

## ノートのデータ構造

```
notes/
  {category}/
    {timestamp}-{slug}.md   ← YAML frontmatter + Markdown
```

## カテゴリ

| ID | 説明 |
|---|---|
| learning | 学習メモ |
| specs | 仕様書 |
| snippets | コード断片 |
| logs | 作業ログ |
| rules | ルール集 |

## ステータスフロー

`raw` → `refining` → `stable`
