---
title: Next.js App Router 基礎
status: raw
category: learning
ai_outcome: none
createdAt: '2026-02-28T00:00:00.000Z'
updatedAt: '2026-02-27T22:15:47.544Z'
---
## App Router とは

Next.js 13 以降の新しいルーティングシステム。`app/` ディレクトリを使う。

## Server Component vs Client Component

- デフォルトは **Server Component** → データフェッチをサーバーで行える
- `'use client'` を先頭に書くと **Client Component** → useState / useEffect が使える

## データフェッチのパターン

```tsx
// Server Component でそのままfetch可能
async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}
```

## Route Groups

`(app)` のように括弧で囲んだディレクトリは URL に影響しない。
レイアウトのグルーピングに使う。
