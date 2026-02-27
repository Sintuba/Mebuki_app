---
title: Next.js App Router 基礎
status: stable
category: learning
ai_review: false
createdAt: '2026-02-28T00:00:00.000Z'
updatedAt: '2026-02-27T15:39:51.170Z'
id: 1740700800000-next-js-app-router
slug: learning/1740700800000-next-js-app-router
content: |-
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
sha: a0694801f96e945df3100636c5e437d98445fd59
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
