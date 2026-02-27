---
title: GitHub API 連携設計
status: stable
category: specs
ai_review: false
createdAt: '2026-02-28T04:00:00.000Z'
updatedAt: '2026-02-27T20:17:10.628Z'
---
## エンドポイント

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/notes` | ノート一覧 |
| POST | `/api/notes` | ノート新規作成 |
| GET | `/api/notes/:category/:id` | ノート取得 |
| PATCH | `/api/notes/:category/:id` | ノート更新 |
| DELETE | `/api/notes/:category/:id` | ノート削除 |

## 認証フロー

1. ユーザーが GitHub OAuth でログイン
2. `session.accessToken` に GitHub トークンを保存
3. 各 API 呼び出し時にトークンを使用

## SHA 管理

GitHub API でファイルを更新する際は現在の SHA が必要。
更新後は新しい SHA を保存して次の更新に備える。
