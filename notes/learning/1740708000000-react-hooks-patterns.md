---
title: React Hooks パターン集
status: raw
category: learning
ai_review: false
createdAt: '2026-02-28T02:00:00.000Z'
updatedAt: '2026-02-27T15:33:27.288Z'
id: 1740708000000-react-hooks-patterns
slug: learning/1740708000000-react-hooks-patterns
content: |-
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
sha: d56dd59c9c7831e8444c65d24ad92c0923ad4f95
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
