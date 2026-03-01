'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Note } from '@/types/note'
import { StatusBadge } from '@/components/status-badge'
import { AiBadge } from '@/components/flag-badge'
import { CATEGORY_LABELS } from '@/lib/constants'
import { useAiSelection } from '@/contexts/ai-review-selection'
import type { NoteCategory } from '@/types/note'

type SortKey = 'newest' | 'oldest' | 'title'
type FilterCategory = NoteCategory | 'all'

interface ArchiveListProps {
  initialNotes: Note[]
}

export function ArchiveList({ initialNotes }: ArchiveListProps) {
  const router = useRouter()
  const ctx = useAiSelection()
  const [notes, setNotes] = useState(initialNotes)
  const [sort, setSort] = useState<SortKey>('newest')
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all')
  const [restoring, setRestoring] = useState(false)

  const selectionCount = ctx.selectedNotes.length

  const filtered = notes
    .filter((n) => n.status === 'stable')
    .filter((n) => filterCategory === 'all' || n.category === filterCategory)
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
    if (!window.confirm(`選択中の ${selectionCount} 件を整理中に戻しますか？`)) return
    setRestoring(true)
    try {
      await Promise.all(
        ctx.selectedNotes.map((n) =>
          fetch(`/api/notes/${n.category}/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: n.title,
              content: n.content,
              status: 'refining',
              ai_outcome: n.ai_outcome,
              ai_reviewed: n.ai_reviewed,
              sha: n.sha,
              createdAt: n.createdAt,
            }),
          })
        )
      )
      setNotes((prev) => prev.filter((n) => !ctx.isSelected(n.id, n.category)))
      ctx.clear()
    } catch {
      alert('復元に失敗しました')
    } finally {
      setRestoring(false)
    }
  }

  const handleCardClick = (note: Note) => {
    router.push(`/edit/${note.category}/${note.id}?from=/list/archive`)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ヘッダー */}
      <div className="shrink-0 border-b border-border px-4 py-3 flex items-center gap-2 flex-wrap">
        <h1 className="text-sm font-medium">アーカイブ（昇華済み）</h1>
        <div className="flex-1" />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
          className="text-[11px] border border-border rounded px-1.5 py-1 bg-background text-foreground"
        >
          <option value="all">すべて</option>
          {(Object.entries(CATEGORY_LABELS) as [NoteCategory, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

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
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-blue-400 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            {selectionCount}件を整理中へ戻す
          </button>
        )}
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-sm text-muted-foreground">アーカイブにノートがありません</p>
            <p className="text-xs text-muted-foreground/60 mt-1">完成したノートがここに表示されます</p>
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
                  <span className="ml-1.5 text-green-600 font-medium">
                    ({selectionCount}件選択中)
                  </span>
                )}
              </span>
            </div>

            {filtered.map((note) => {
              const isChecked = ctx.isSelected(note.id, note.category)
              const catLabel = CATEGORY_LABELS[note.category as keyof typeof CATEGORY_LABELS] ?? note.category

              return (
                <div
                  key={note.id}
                  className="border-b border-border transition-colors duration-150"
                >
                  <div
                    onClick={() => handleCardClick(note)}
                    className="px-3 py-3 flex items-center gap-2 cursor-pointer hover:bg-muted/20 active:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => ctx.toggle(note)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 rounded border-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm text-foreground">{note.title}</span>
                        <StatusBadge status={note.status} />
                        {note.ai_outcome && note.ai_outcome !== 'none' && <AiBadge outcome={note.ai_outcome} />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="text-green-600 font-medium">{catLabel}</span>
                        <span>{new Date(note.updatedAt).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>
                    <Link
                      href={`/edit/${note.category}/${note.id}?from=/list/archive`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 text-[11px] px-2.5 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      開く
                    </Link>
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
