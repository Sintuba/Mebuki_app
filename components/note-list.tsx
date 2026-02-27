'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Note, NoteStatus } from '@/types/note'
import { StatusBadge } from '@/components/status-badge'
import { AiBadge } from '@/components/flag-badge'
import { CATEGORY_LABELS } from '@/lib/constants'

const STATUS_ORDER: NoteStatus[] = ['raw', 'refining', 'stable']

type SortKey = 'newest' | 'oldest' | 'title'
type FilterStatus = NoteStatus | 'all'

function promoteStatus(s: NoteStatus): NoteStatus {
  const i = STATUS_ORDER.indexOf(s)
  return i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : s
}

function demoteStatus(s: NoteStatus): NoteStatus {
  const i = STATUS_ORDER.indexOf(s)
  return i > 0 ? STATUS_ORDER[i - 1] : s
}

interface NoteListProps {
  initialNotes: Note[]
  category: string
}

export function NoteList({ initialNotes, category }: NoteListProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [sort, setSort] = useState<SortKey>('newest')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const filtered = notes
    .filter((n) => filterStatus === 'all' || n.status === filterStatus)
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (sort === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      return a.title.localeCompare(b.title, 'ja')
    })

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((n) => n.id)))
    }
  }

  async function patchNote(note: Note, newStatus: NoteStatus) {
    const res = await fetch(`/api/notes/${note.category}/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, sha: note.sha }),
    })
    if (!res.ok) throw new Error('更新失敗')
    const updated = await res.json()
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, status: newStatus, sha: updated.sha } : n
      )
    )
  }

  const handleBulkPromote = () => {
    startTransition(async () => {
      const targets = filtered.filter(
        (n) => selected.has(n.id) && STATUS_ORDER.indexOf(n.status) < STATUS_ORDER.length - 1
      )
      await Promise.all(targets.map((n) => patchNote(n, promoteStatus(n.status))))
      setSelected(new Set())
    })
  }

  const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ヘッダー */}
      <div className="shrink-0 border-b border-border px-4 py-3 flex items-center gap-2 flex-wrap">
        <h1 className="text-sm font-medium">{categoryLabel}</h1>
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

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="text-[11px] border border-border rounded px-1.5 py-1 bg-background text-foreground"
        >
          <option value="all">すべて</option>
          <option value="raw">未整理</option>
          <option value="refining">整理中</option>
          <option value="stable">完成</option>
        </select>

        {selected.size > 0 && (
          <button
            onClick={handleBulkPromote}
            disabled={isPending}
            className="text-[11px] px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            一括昇華 ({selected.size})
          </button>
        )}

        <Link
          href={`/edit/${category}/new`}
          className="text-[11px] px-2.5 py-1 rounded bg-foreground text-background hover:bg-foreground/90"
        >
          + 新規
        </Link>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-sm text-muted-foreground">ノートがありません</p>
            <Link
              href={`/edit/${category}/new`}
              className="mt-3 text-xs text-muted-foreground underline hover:text-foreground"
            >
              最初のノートを作成する
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-border px-4 py-2 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                className="h-3.5 w-3.5 rounded border-border"
              />
              <span className="text-[11px] text-muted-foreground">{filtered.length}件</span>
            </div>

            {filtered.map((note) => {
              const canPromote = STATUS_ORDER.indexOf(note.status) < STATUS_ORDER.length - 1
              const canDemote = STATUS_ORDER.indexOf(note.status) > 0
              return (
                <div
                  key={note.id}
                  className="border-b border-border px-4 py-3 flex items-center gap-3 hover:bg-muted/30 group"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(note.id)}
                    onChange={() => toggleSelect(note.id)}
                    className="h-3.5 w-3.5 rounded border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-foreground truncate">{note.title}</span>
                      <StatusBadge status={note.status} />
                      {note.ai_review && <AiBadge />}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(note.updatedAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {canDemote && (
                      <button
                        onClick={() => patchNote(note, demoteStatus(note.status))}
                        className="text-[10px] px-1.5 py-0.5 border border-border rounded text-muted-foreground hover:text-foreground"
                        title="降格"
                      >
                        ↓
                      </button>
                    )}
                    {canPromote && (
                      <button
                        onClick={() => patchNote(note, promoteStatus(note.status))}
                        className="text-[10px] px-1.5 py-0.5 border border-border rounded text-muted-foreground hover:text-foreground"
                        title="昇華"
                      >
                        ↑
                      </button>
                    )}
                    <Link
                      href={`/edit/${note.category}/${note.id}`}
                      className="text-[10px] px-1.5 py-0.5 border border-border rounded text-muted-foreground hover:text-foreground"
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
