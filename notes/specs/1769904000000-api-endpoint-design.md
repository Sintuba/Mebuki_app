---
title: API エンドポイント設計書
status: refining
category: specs
ai_outcome: keep
ai_reviewed: false
createdAt: '2026-02-01T00:00:00.000Z'
updatedAt: '2026-02-10T00:00:00.000Z'
---

## エンドポイント一覧

### `GET /api/notes/[category]/[id]`
ノートを1件取得。認証必須。

### `PATCH /api/notes/[category]/[id]`
ノートを更新。ステータス変更・内容編集に使用。

リクエストボディ:
```json
{
  "title": "タイトル",
  "content": "本文",
  "status": "refining",
  "ai_outcome": "keep",
  "ai_reviewed": false,
  "sha": "abc123",
  "createdAt": "2026-02-01T00:00:00.000Z"
}
```

### `DELETE /api/notes/[category]/[id]`
ノートを完全削除（宿根からの永久削除のみ想定）。

### `POST /api/notes`
新規ノートを作成。

### `POST /api/ai/review`
選択ノートを AI がレビューし、ai_outcome を更新する。

## TODO

- [ ] ページネーション対応（ノートが増えた場合）
- [ ] バルク操作エンドポイント
- [ ] エラーレスポンスの標準化
