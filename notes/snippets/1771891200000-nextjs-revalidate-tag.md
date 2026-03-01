---
title: Next.js revalidateTag パターン
status: raw
category: snippets
ai_outcome: keep
ai_reviewed: false
createdAt: '2026-02-24T00:00:00.000Z'
updatedAt: '2026-02-24T00:00:00.000Z'
---

## unstable_cache + revalidateTag

```ts
// キャッシュ定義
export function cachedListNotes(token: string, category?: NoteCategory) {
  return unstable_cache(
    () => listNotes(category, token),
    [token, category ?? 'all'],
    { tags: ['notes'], revalidate: 60 }
  )()
}

// 更新後に無効化（Route Handler 内）
import { revalidateTag } from 'next/cache'
revalidateTag('notes')
```

メモ: revalidateTag は Server Action か Route Handler 内でしか呼べない
