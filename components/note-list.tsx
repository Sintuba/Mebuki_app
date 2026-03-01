'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Trash2 } from 'lucide-react'
import type { Note, NoteStatus } from '@/types/note'
import { StatusBadge } from '@/components/status-badge'
import { AiBadge, AiReviewedBadge } from '@/components/flag-badge'
import { CATEGORY_LABELS } from '@/lib/constants'
import { useAiSelection } from '@/contexts/ai-review-selection'
import { AiReviewTab } from '@/components/ai-review-tab'

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
  const router = useRouter()
  const ctx = useAiSelection()
  const [notes, setNotes] = useState(initialNotes)
  const [sort, setSort] = useState<SortKey>('newest')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pendingDemoteId, setPendingDemoteId] = useState<string | null>(null)

  const filtered = notes
    .filter((n) => n.status !== 'trashed')
    .filter((n) => filterStatus === 'all' || n.status === filterStatus)
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (sort === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      return a.title.localeCompare(b.title, 'ja')
    })

  const selectionCount = ctx.selectedNotes.length

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

  async function patchNote(note: Note, newStatus: NoteStatus) {
    const res = await fetch(`/api/notes/${note.category}/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: note.title,
        content: note.content,
        status: newStatus,
        ai_outcome: note.ai_outcome,
        ai_reviewed: note.ai_reviewed,
        sha: note.sha,
        createdAt: note.createdAt,
      }),
    })
    if (!res.ok) throw new Error('更新失敗')
    const updated = await res.json()
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, status: newStatus, sha: updated.sha } : n
      )
    )
  }

  const handleDelete = async () => {
    if (!window.confirm(`選択中の ${selectionCount} 件を宿根に移しますか？`)) return
    setDeleting(true)
    try {
      await Promise.all(
        ctx.selectedNotes.map((n) =>
          fetch(`/api/notes/${n.category}/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: n.title,
              content: n.content,
              status: 'trashed',
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
      alert('宿根への移動に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  /** SP: カード展開 / PC: エディタへ直接遷移 */
  const handleCardClick = (note: Note) => {
    setPendingDemoteId(null)
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      router.push(`/edit/${note.category}/${note.id}?from=/list/${category}`)
    } else {
      setExpandedId((prev) => (prev === note.id ? null : note.id))
    }
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

        {selectionCount > 0 && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-destructive text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            {selectionCount}件を宿根へ
          </button>
        )}

        {/* PC用AIレビューボタン */}
        <div className="hidden md:flex">
          <AiReviewTab variant="desktop" />
        </div>

        <Link
          href={`/edit/${category}/new`}
          className="text-[11px] px-2.5 py-1 rounded bg-green-500 text-white hover:bg-green-600"
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
              const canDemote = STATUS_ORDER.indexOf(note.status) > 0
              const isExpanded = expandedId === note.id
              const isChecked = ctx.isSelected(note.id, note.category)

              return (
                <div
                  key={note.id}
                  className={`border-b border-border transition-colors duration-150 ${isExpanded ? 'bg-muted/40' : ''}`}
                >
                  {/* メイン行 */}
                  <div
                    onClick={() => handleCardClick(note)}
                    className="px-3 py-3 flex items-center gap-2 cursor-pointer hover:bg-muted/20 active:bg-muted/40"
                  >
                    {/* チェックボックス（AIレビュー用選択） */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => ctx.toggle(note)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 rounded border-border shrink-0"
                    />

                    {/* テキスト */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm text-foreground">{note.title}</span>
                        <StatusBadge status={note.status} />
                        {note.ai_reviewed && <AiReviewedBadge />}
                        {note.ai_outcome && note.ai_outcome !== 'none' && <AiBadge outcome={note.ai_outcome} />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(note.updatedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>

                    {/* ↑↓ ステータスボタン */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* ↓ 還元（2段階確認） */}
                      {canDemote && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (pendingDemoteId === note.id) {
                              patchNote(note, demoteStatus(note.status))
                              setPendingDemoteId(null)
                            } else {
                              setPendingDemoteId(note.id)
                            }
                          }}
                          className={[
                            'flex items-center justify-center rounded-md border leading-none transition-all select-none',
                            pendingDemoteId === note.id
                              ? 'h-9 px-2.5 text-xs font-medium md:h-7 border-orange-400 bg-orange-100 text-orange-600'
                              : 'h-9 w-9 text-base font-bold md:h-7 md:w-7 md:text-sm border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-100 active:scale-95',
                          ].join(' ')}
                        >
                          {pendingDemoteId === note.id ? '還元' : '↓'}
                        </button>
                      )}

                      {/* ↑ 昇華（AI評価済み かつ stable 以外のみ表示） */}
                      {note.ai_reviewed && note.status !== 'stable' && (
                        <button
                          onClick={() => { setPendingDemoteId(null); patchNote(note, promoteStatus(note.status)) }}
                          title="昇華"
                          className={[
                            'flex items-center justify-center rounded-md border font-bold leading-none transition-colors select-none',
                            'h-9 w-9 text-base md:h-7 md:w-7 md:text-sm',
                            'border-green-200 bg-green-50 text-green-600 hover:bg-green-100 active:scale-95',
                          ].join(' ')}
                        >
                          ↑
                        </button>
                      )}
                    </div>

                    {/* 展開シェブロン (SP のみ) */}
                    <ChevronDown
                      className={[
                        'md:hidden shrink-0 text-muted-foreground transition-transform duration-200',
                        'w-4 h-4',
                        isExpanded ? 'rotate-180' : '',
                      ].join(' ')}
                    />
                  </div>

                  {/* 展開パネル (SP のみ) */}
                  <div
                    className={[
                      'grid transition-all duration-200 ease-out md:hidden',
                      isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    ].join(' ')}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pt-2 pb-4 flex items-center gap-3 border-t border-border/40">
                        {note.content ? (
                          <p className="flex-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {note.content}
                          </p>
                        ) : (
                          <p className="flex-1 text-[11px] text-muted-foreground/50 italic">
                            内容なし
                          </p>
                        )}
                        <Link
                          href={`/edit/${note.category}/${note.id}?from=/list/${category}`}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 px-5 py-2.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 active:scale-95 transition-transform"
                        >
                          開く
                        </Link>
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
