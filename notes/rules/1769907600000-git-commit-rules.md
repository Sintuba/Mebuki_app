---
title: Git コミットメッセージルール
status: raw
category: rules
ai_outcome: keep
ai_reviewed: false
createdAt: '2026-02-01T01:00:00.000Z'
updatedAt: '2026-02-01T01:00:00.000Z'
---

## フォーマット

```
<type>: <subject>
```

## タイプ一覧

| タイプ | 用途 |
|---|---|
| `feat` | 新機能追加 |
| `fix` | バグ修正 |
| `update` | 既存機能の改善 |
| `chore` | ビルド・設定変更 |
| `docs` | ドキュメントのみ |
| `refactor` | リファクタリング |

## 例

```
feat: ノート一覧ページを追加
fix: 保存後にキャッシュが更新されない問題を修正
update: ヘッダーをスティッキーに変更
chore: 依存パッケージを更新
```

あとで整理する
