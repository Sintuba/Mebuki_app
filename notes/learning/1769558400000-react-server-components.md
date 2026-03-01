---
title: React Server Components 入門
status: refining
category: learning
ai_outcome: keep
ai_reviewed: false
createdAt: '2026-01-28T00:00:00.000Z'
updatedAt: '2026-02-05T00:00:00.000Z'
---

## RSC とは

React Server Components（RSC）はサーバーで実行されるコンポーネント。バンドルに含まれない。

## メリット

- データベース・ファイルシステムに直接アクセス可能
- 秘密情報（APIキー）をクライアントに渡さない
- 初期ページロードの JS バンドルサイズを削減

## 制約

- `useState` / `useEffect` など React Hooks は使えない
- ブラウザ API にアクセスできない
- イベントハンドラを渡せない

## クライアントコンポーネントとの境界

```tsx
// app/page.tsx (Server Component)
import ClientButton from './ClientButton' // 'use client'のコンポーネント

export default async function Page() {
  const data = await fetchData() // サーバーでフェッチ
  return <ClientButton initialData={data} />
}
```

## TODO

- [ ] Streaming / Suspense との組み合わせを調べる
- [ ] `use()` フックの動作確認
