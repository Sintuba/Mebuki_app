---
title: TypeScript ジェネリクス入門
status: refining
category: learning
ai_review: true
createdAt: '2026-02-28T01:00:00.000Z'
updatedAt: '2026-02-27T20:34:33.320Z'
---
## ジェネリクスとは

型をパラメータとして受け取る仕組み。再利用性が上がる。

```typescript
function identity<T>(arg: T): T {
  return arg
}

identity<string>("hello") // string
identity<number>(42)      // number
```

## 実用例: API レスポンスの型付け

```typescript
interface ApiResponse<T> {
  data: T
  error?: string
}

async function fetchUser(): Promise<ApiResponse<User>> {
  // ...
}
```
