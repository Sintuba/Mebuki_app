'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X, Loader2, Check } from 'lucide-react'
import type { Note, NoteStatus } from '@/types/note'
import type { NoteReviewResult } from '@/app/api/ai/review/route'
import { cn } from '@/lib/utils'

const MAX = 10

const STATUS_LABELS: Record<NoteStatus, string> = {
  raw: '生メモ',
  refining: '精錬中',
  stable: '完成',
  trashed: '宿根',
}

type Phase = 'list' | 'reviewing' | 'results'

export function AiReviewFab() {
  const [flaggedNotes, setFlaggedNotes] = useState<Note[]>([])
  const [fetchKey, setFetchKey] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('list')
  const [results, setResults] = useState<NoteReviewResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/notes')
      .then((r) => r.json())
      .then((notes: Note[]) => {
        setFlaggedNotes(notes.filter((n) => n.ai_outcome !== 'none').slice(0, MAX))
      })
      .catch(() => {})
  }, [fetchKey])

  const handleOpen = () => {
    setIsOpen(true)
    setPhase('list')
    setResults([])
    setSelected(new Set())
    setError('')
  }

  const handleClose = () => {
    setIsOpen(false)
    setFetchKey((k) => k + 1)
  }

  const startReview = async () => {
    setPhase('reviewing')
    setError('')
    try {
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: flaggedNotes }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || 'Review failed')
      }
      const data = await res.json()
      setResults(data.results)
      // 昇華判定のみ事前選択
      setSelected(
        new Set(
          data.results
            .filter((r: NoteReviewResult) => r.decision === 'promote')
            .map((r: NoteReviewResult) => `${r.category}/${r.id}`)
        )
      )
      setPhase('results')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
      setPhase('list')
    }
  }

  const applySelected = async () => {
    setApplying(true)
    setError('')
    try {
      await Promise.all(
        results
          .filter((r) => selected.has(`${r.category}/${r.id}`))
          .map(async (result) => {
            const note = flaggedNotes.find(
              (n) => n.id === result.id && n.category === result.category
            )
            if (!note) return
            await fetch(`/api/notes/${result.category}/${result.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: note.title,
                content: note.content,
                status: result.newStatus,
                ai_outcome: 'none',
                sha: note.sha,
                createdAt: note.createdAt,
              }),
            })
          })
      )
      handleClose()
    } catch {
      setError('適用中にエラーが発生しました')
    } finally {
      setApplying(false)
    }
  }

  const count = flaggedNotes.length

  const toggleSelect = (key: string, canPromote: boolean) => {
    if (!canPromote) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <>
      {/* フローティングボタン */}
      <button
        onClick={handleOpen}
        disabled={count === 0}
        title={count > 0 ? `フラグ付きノートを${count}件AIレビュー` : 'フラグ付きノートがありません'}
        className={cn(
          'fixed bottom-[72px] right-4 md:bottom-6 md:right-6 z-40',
          'flex items-center gap-1.5 h-12 px-4 rounded-full shadow-lg',
          'text-sm font-medium transition-all duration-200',
          count > 0
            ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-200/60'
            : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
        )}
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="tabular-nums">
          {count}<span className="opacity-60">/{MAX}</span>
        </span>
      </button>

      {/* モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          {/* バックドロップ */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* パネル */}
          <div className="relative w-full md:max-w-lg bg-background rounded-t-2xl md:rounded-2xl shadow-xl border border-border flex flex-col max-h-[80vh]">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm">AIレビュー</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {count}/{MAX}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
              {error && (
                <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {phase === 'reviewing' && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                  <p className="text-sm text-muted-foreground">AIがレビュー中...</p>
                </div>
              )}

              {(phase === 'list' || phase === 'results') &&
                flaggedNotes.map((note) => {
                  const result = results.find(
                    (r) => r.id === note.id && r.category === note.category
                  )
                  const key = `${note.category}/${note.id}`
                  const isSelected = selected.has(key)
                  const canPromote = result?.decision === 'promote'

                  return (
                    <div
                      key={key}
                      className={cn(
                        'rounded-lg border p-3 text-sm transition-colors',
                        result
                          ? canPromote
                            ? 'border-green-200 bg-green-50/40'
                            : 'border-border/60 bg-muted/20'
                          : 'border-border bg-background'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {/* チェックボックス（結果表示時のみ） */}
                        {result && (
                          <button
                            onClick={() => toggleSelect(key, canPromote)}
                            className={cn(
                              'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                              canPromote
                                ? isSelected
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-border hover:border-green-400'
                                : 'border-border/30 cursor-default'
                            )}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </button>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* タイトル + バッジ */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium truncate max-w-[180px]">
                              {note.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                              {STATUS_LABELS[note.status]}
                            </span>
                            {note.ai_outcome === 'promote' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">
                                ↑昇華希望
                              </span>
                            )}
                            {note.ai_outcome === 'keep' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">
                                保持確認
                              </span>
                            )}
                          </div>

                          {/* AI判定結果 */}
                          {result && (
                            <div className="mt-2 space-y-1">
                              <div
                                className={cn(
                                  'text-xs font-medium',
                                  canPromote ? 'text-green-600' : 'text-muted-foreground'
                                )}
                              >
                                {canPromote
                                  ? `↑ ${STATUS_LABELS[note.status]} → ${STATUS_LABELS[result.newStatus]}`
                                  : `− 現状維持（${STATUS_LABELS[note.status]}）`}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {result.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* フッター */}
            <div className="border-t border-border px-4 py-3 shrink-0">
              {phase === 'list' && (
                <button
                  onClick={startReview}
                  className="w-full h-10 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  AIレビュー開始
                </button>
              )}

              {phase === 'results' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPhase('list')
                      setResults([])
                      setSelected(new Set())
                    }}
                    className="flex-1 h-10 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    やり直す
                  </button>
                  <button
                    onClick={applySelected}
                    disabled={applying || selected.size === 0}
                    className={cn(
                      'flex-1 h-10 rounded-lg text-sm font-medium transition-colors',
                      selected.size > 0 && !applying
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    {applying ? '適用中...' : `${selected.size}件を適用`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
