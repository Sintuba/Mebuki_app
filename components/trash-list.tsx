'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import type { Note } from '@/types/note'
import { CATEGORY_LABELS } from '@/lib/constants'
import { useAiSelection } from '@/contexts/ai-review-selection'

type SortKey = 'newest' | 'oldest' | 'title'

interface TrashListProps {
  initialNotes: Note[]
}

export function TrashList({ initialNotes }: TrashListProps) {
  const ctx = useAiSelection()
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [sort, setSort] = useState<SortKey>('newest')
  const [working, setWorking] = useState(false)

  const selectionCount = ctx.selectedNotes.length

  const filtered = notes
    .filter((n) => n.status === 'trashed')
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (sort === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      return a.title.localeCompare(b.title, 'ja')
    })

  const toggleAll = () => {
    const allSelected = filtered.length > 0 && filtered.every((n) => ctx.isSelected(n.id, n.category))
    if (allSelected) {
      filtered.forEach((n) => ctx.remove(n.id, n.category))
    } else {
      filtered.forEach((n) => {
        if (!ctx.isSelected(n.id, n.category)) ctx.toggle(n)
      })
    }
  }

  const handleRestore = async () => {
    if (!window.confirm(`選択中の ${selectionCount} 件を未整理に戻しますか？`)) return
    setWorking(true)
    const toRestore = [...ctx.selectedNotes]
    let failedCount = 0
    for (const n of toRestore) {
      try {
        const res = await fetch(`/api/notes/${n.category}/${n.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: n.title,
            content: n.content,
            status: 'raw',
            ai_outcome: n.ai_outcome,
            ai_reviewed: n.ai_reviewed,
            sha: n.sha,
            createdAt: n.createdAt,
          }),
        })
        if (res.ok) {
          setNotes((prev) => prev.filter((x) => !(x.id === n.id && x.category === n.category)))
          ctx.remove(n.id, n.category)
        } else {
          failedCount++
        }
      } catch {
        failedCount++
      }
    }
    if (failedCount > 0) alert(`${failedCount}件の復元に失敗しました`)
    setWorking(false)
    router.refresh()
  }

  const handlePermanentDelete = async () => {
    if (!window.confirm(`選択中の ${selectionCount} 件を完全に削除しますか？この操作は取り消せません。`)) return
    setWorking(true)
    const toDelete = [...ctx.selectedNotes]
    let failedCount = 0
    for (const n of toDelete) {
      try {
        const res = await fetch(`/api/notes/${n.category}/${n.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sha: n.sha }),
        })
        if (res.ok) {
          setNotes((prev) => prev.filter((x) => !(x.id === n.id && x.category === n.category)))
          ctx.remove(n.id, n.category)
        } else {
          failedCount++
        }
      } catch {
        failedCount++
      }
    }
    if (failedCount > 0) alert(`${failedCount}件の削除に失敗しました`)
    setWorking(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ヘッダー */}
      <div className="shrink-0 border-b border-border px-4 py-3 flex items-center gap-2 flex-wrap">
        <h1 className="text-sm font-medium">宿根</h1>
        <div className="flex-1" />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-[11px] border border-border rounded px-1.5 py-1 bg-background text-foreground"
        >
          <option value="newest">新しい順</option>
          <option value="oldest">古い順</option>
          <option value="title">タイトル順</option>
        </select>

        {selectionCount > 0 && (
          <>
            <button
              onClick={handleRestore}
              disabled={working}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-blue-400 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {selectionCount}件を復元
            </button>
            <button
              onClick={handlePermanentDelete}
              disabled={working}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-destructive text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              完全削除
            </button>
          </>
        )}
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-sm text-muted-foreground">宿根はありません</p>
          </div>
        ) : (
          <>
            <div className="border-b border-border px-4 py-2 flex items-center gap-3">
              <input
                type="checkbox"
                checked={filtered.length > 0 && filtered.every((n) => ctx.isSelected(n.id, n.category))}
                onChange={toggleAll}
                className="h-3.5 w-3.5 rounded border-border"
              />
              <span className="text-[11px] text-muted-foreground">
                {filtered.length}件
                {selectionCount > 0 && (
                  <span className="ml-1.5 text-blue-600 font-medium">
                    ({selectionCount}件選択中)
                  </span>
                )}
              </span>
              <span className="text-[11px] text-muted-foreground/50 ml-auto">
                選択してから復元または完全削除
              </span>
            </div>

            {filtered.map((note) => {
              const isChecked = ctx.isSelected(note.id, note.category)
              const catLabel = CATEGORY_LABELS[note.category as keyof typeof CATEGORY_LABELS] ?? note.category

              return (
                <div
                  key={note.id}
                  className="border-b border-border"
                >
                  <div className="px-3 py-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => ctx.toggle(note)}
                      className="h-3.5 w-3.5 rounded border-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm text-foreground opacity-70">{note.title}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="text-muted-foreground">{catLabel}</span>
                        <span>{new Date(note.updatedAt).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
