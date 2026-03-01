---
title: TypeScript ユーティリティ型まとめ
status: stable
category: learning
ai_outcome: promote
ai_reviewed: true
createdAt: '2026-01-26T12:00:00.000Z'
updatedAt: '2026-03-01T00:42:25.115Z'
---
## よく使うユーティリティ型

### `Partial<T>`
全プロパティをオプションにする。

```ts
type PartialNote = Partial<Note>
// { title?: string; status?: NoteStatus; ... }
```

### `Pick<T, K>`
指定したプロパティだけ抽出する。

```ts
type NotePreview = Pick<Note, 'id' | 'title' | 'status'>
```

### `Omit<T, K>`
指定したプロパティを除外する。

```ts
type NoteWithoutSha = Omit<Note, 'sha'>
```

### `Record<K, V>`
キーと値の型を指定したオブジェクト型。

```ts
const STATUS_LABELS: Record<NoteStatus, string> = {
  raw: '未整理',
  refining: '整理中',
  stable: '完成',
  trashed: '宿根',
}
```

### `Extract<T, U>` / `Exclude<T, U>`

```ts
type ActiveStatus = Exclude<NoteStatus, 'trashed'>
// 'raw' | 'refining' | 'stable'
```

## satisfies 演算子（TypeScript 4.9+）

型チェックをしつつ推論型を保持する。

```ts
const config = {
  theme: 'dark',
  fontSize: 14,
} satisfies Partial<AppConfig>
```
