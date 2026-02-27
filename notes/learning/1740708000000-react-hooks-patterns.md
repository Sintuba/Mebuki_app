---
title: React Hooks パターン集
status: stable
category: learning
ai_review: false
createdAt: "2026-02-28T02:00:00.000Z"
updatedAt: "2026-02-28T08:00:00.000Z"
---

## useEffect の依存配列

```tsx
// マウント時のみ実行
useEffect(() => { ... }, [])

// 値が変わるたびに実行
useEffect(() => { ... }, [value])

// クリーンアップ
useEffect(() => {
  const id = setInterval(() => { ... }, 1000)
  return () => clearInterval(id)
}, [])
```

## useRef でDOMにアクセス

```tsx
const ref = useRef<HTMLInputElement>(null)
// ref.current?.focus()
```

## カスタムフック

ロジックを切り出して再利用する。

```tsx
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initial
  })
  // ...
}
```
