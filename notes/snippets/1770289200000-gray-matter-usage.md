---
title: gray-matter フロントマター処理
status: trashed
category: snippets
ai_outcome: keep
ai_reviewed: false
createdAt: '2026-02-05T11:00:00.000Z'
updatedAt: '2026-03-01T06:46:20.628Z'
---
## パース

```ts
import matter from 'gray-matter'

const { data: fm, content } = matter(rawMarkdown)
// fm → フロントマターオブジェクト
// content → 本文（フロントマターを除いた部分）
```

## シリアライズ

```ts
const serialized = matter.stringify(content, frontmatter)
// frontmatter は Record<string, unknown> に互換な型
```

## 注意点

- `matter.stringify` の引数順: `(content, data)` ← 逆にしがち
- boolean 値は YAML の `true` / `false` として出力される
- Date 型は ISO 文字列として渡すこと

## gray-matter の型定義

```ts
// NoteFrontmatter を unknown にキャスト
matter.stringify(content, frontmatter as unknown as Record<string, unknown>)
```

型が厳格すぎて直接渡せないので `unknown` 経由のキャストが必要。

TODO: 型安全なラッパー関数を作る
