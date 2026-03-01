---
title: Next.js App Router 完全理解
status: stable
category: learning
ai_outcome: keep
ai_reviewed: true
createdAt: '2026-01-23T00:00:00.000Z'
updatedAt: '2026-02-10T00:00:00.000Z'
---

## App Router とは

Next.js 13 以降の新しいルーティングシステム。`app/` ディレクトリを使用する。

## Server Component vs Client Component

- デフォルトは **Server Component** → データフェッチをサーバーで行える
- `'use client'` を先頭に書くと **Client Component** → `useState` / `useEffect` が使える
- サーバーコンポーネントは非同期関数にできる

## データフェッチのパターン

```tsx
// Server Component で直接 async/await
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }, // ISR
  })
  const json = await data.json()
  return <div>{json.title}</div>
}
```

## Route Groups

`(app)` のように括弧で囲んだディレクトリは URL に影響しない。レイアウトのグルーピングに使う。

```
app/
  (app)/
    home/page.tsx   → /home
    list/page.tsx   → /list
  (editor)/
    edit/page.tsx   → /edit
```

## キャッシュ戦略

- `unstable_cache` でサーバー側キャッシュ
- `revalidateTag('notes')` でタグ付きキャッシュの即時無効化
- `revalidatePath('/home')` でページ単位の無効化
