'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Loader2, Check } from 'lucide-react'
import { useAiSelection } from '@/contexts/ai-review-selection'
import { renderMd } from '@/components/md-editor'
import { cn } from '@/lib/utils'
import type { AiOutcome, NoteStatus } from '@/types/note'
import type { NoteReviewResult } from '@/app/api/ai/review/route'

const MAX = 10

const STATUS_LABELS: Record<NoteStatus, string> = {
  raw: '生メモ',
  refining: '精錬中',
  stable: '完成',
  trashed: '宿根',
}

type Phase = 'list' | 'reviewing' | 'results'
const REVIEW_PHASES = ['ノートを解析', 'AIがレビュー中', '結果を整理'] as const

export default function ReviewPage() {
  const router = useRouter()
  const { selectedNotes, remove: removeFromSelection } = useAiSelection()

  const [phase, setPhase] = useState<Phase>('list')
  const [results, setResults] = useState<NoteReviewResult[]>([])
  const [intentMap, setIntentMap] = useState<Record<string, AiOutcome>>({})
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set())
  const [acknowledging, setAcknowledging] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<Record<string, 'original' | 'suggestion'>>({})
  const [merging, setMerging] = useState<Set<string>>(new Set())
  const [merged, setMerged] = useState<Set<string>>(new Set())
  const [elaborating, setElaborating] = useState<Set<string>>(new Set())
  const [elaborations, setElaborations] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [reviewPhase, setReviewPhase] = useState(0)

  const notesToReview = selectedNotes.slice(0, MAX)
  const count = notesToReview.length

  // Initialize intent map on mount
  useEffect(() => {
    const map: Record<string, AiOutcome> = {}
    notesToReview.forEach((n) => {
      map[`${n.category}/${n.id}`] = n.ai_outcome !== 'none' ? n.ai_outcome : 'promote'
    })
    setIntentMap(map)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Progress bar animation
  useEffect(() => {
    if (phase !== 'reviewing') { setReviewPhase(0); return }
    const interval = setInterval(() => {
      setReviewPhase((p) => Math.min(p + 1, REVIEW_PHASES.length - 1))
    }, 1600)
    return () => clearInterval(interval)
  }, [phase])

  const startReview = async () => {
    setPhase('reviewing')
    setError('')
    try {
      const notesWithIntent = notesToReview.map((n) => ({
        ...n,
        ai_outcome: intentMap[`${n.category}/${n.id}`] ?? 'promote',
      }))
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesWithIntent }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || 'Review failed')
      }
      const data = await res.json()
      setResults(data.results)
      setAcknowledged(new Set())
      setPhase('results')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
      setPhase('list')
    }
  }

  const acknowledge = async (result: NoteReviewResult) => {
    const key = `${result.category}/${result.id}`
    const note = notesToReview.find((n) => n.id === result.id && n.category === result.category)
    if (!note || !note.sha) return

    setAcknowledging((prev) => new Set(prev).add(key))
    try {
      const res = await fetch(`/api/notes/${result.category}/${result.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          status: note.status,
          ai_outcome: 'none',
          ai_reviewed: true,
          sha: note.sha,
          createdAt: note.createdAt,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setAcknowledged((prev) => new Set(prev).add(key))
      removeFromSelection(result.id, result.category)
    } catch {
      setError(`「${note.title}」の了解処理に失敗しました`)
    } finally {
      setAcknowledging((prev) => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  const merge = async (result: NoteReviewResult) => {
    const key = `${result.category}/${result.id}`
    const note = notesToReview.find((n) => n.id === result.id && n.category === result.category)
    if (!note || !note.sha || !result.suggestion) return

    const newEdit = { at: new Date().toISOString(), summary: result.changeSummary || 'AIによる校正・改善' }
    const ai_edits = [...(note.ai_edits ?? []), newEdit]

    setMerging((prev) => new Set(prev).add(key))
    try {
      const res = await fetch(`/api/notes/${result.category}/${result.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: result.suggestion,
          status: note.status,
          ai_outcome: 'none',
          ai_reviewed: true,
          ai_edits,
          sha: note.sha,
          createdAt: note.createdAt,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setMerged((prev) => new Set(prev).add(key))
      setAcknowledged((prev) => new Set(prev).add(key))
      removeFromSelection(result.id, result.category)
    } catch {
      setError(`「${note.title}」のマージに失敗しました`)
    } finally {
      setMerging((prev) => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  const elaborate = async (result: NoteReviewResult) => {
    const key = `${result.category}/${result.id}`
    const note = notesToReview.find((n) => n.id === result.id && n.category === result.category)
    if (!note) return

    setElaborating((prev) => new Set(prev).add(key))
    try {
      const res = await fetch('/api/ai/elaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: note.title, content: note.content, status: note.status, reason: result.reason }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setElaborations((prev) => ({ ...prev, [key]: data.detail }))
    } catch {
      setError(`「${note.title}」の詳細生成に失敗しました`)
    } finally {
      setElaborating((prev) => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  return (
    <div className="flex flex-col h-svh bg-background">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0 bg-background">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="font-medium text-sm">AIレビュー</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {phase === 'results' ? '結果' : `${count}/${MAX}件`}
          </span>
        </div>
        <div className="w-14" />
      </div>

      {/* エラー */}
      {error && (
        <div className="shrink-0 mx-4 mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">

        {/* reviewing: progress bar */}
        {phase === 'reviewing' && (
          <div className="flex flex-col items-center justify-center h-full py-16 px-8 gap-8">
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="size-6 text-violet-400 animate-pulse" />
              <p className="text-sm font-medium">{REVIEW_PHASES[reviewPhase]}...</p>
            </div>
            <div className="w-full max-w-sm space-y-3">
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-violet-400 via-indigo-400 to-blue-400 transition-all duration-700"
                  style={{ width: `${((reviewPhase + 1) / REVIEW_PHASES.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between">
                {REVIEW_PHASES.map((p, i) => (
                  <span key={p} className={cn('text-[10px] transition-colors duration-500',
                    i <= reviewPhase ? 'text-violet-500 font-medium' : 'text-muted-foreground/30')}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* list: notes with intent selector */}
        {phase === 'list' && (
          <div className="p-4 space-y-2 max-w-2xl mx-auto">
            {count === 0 && (
              <div className="text-center py-16 text-sm text-muted-foreground">
                レビューするメモが選択されていません
              </div>
            )}
            {notesToReview.map((note) => {
              const key = `${note.category}/${note.id}`
              const intent = intentMap[key] ?? 'promote'
              return (
                <div key={key} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium truncate max-w-xs">{note.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {STATUS_LABELS[note.status as NoteStatus]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center border border-border rounded-full overflow-hidden shrink-0 text-[10px]">
                      <button
                        onClick={() => setIntentMap((prev) => ({ ...prev, [key]: 'promote' }))}
                        className={cn('px-2 h-6 font-medium transition-colors',
                          intent === 'promote' ? 'bg-green-500 text-white' : 'text-muted-foreground hover:text-foreground')}
                      >↑昇華</button>
                      <button
                        onClick={() => setIntentMap((prev) => ({ ...prev, [key]: 'keep' }))}
                        className={cn('px-2 h-6 font-medium transition-colors border-l border-border',
                          intent === 'keep' ? 'bg-amber-400 text-white' : 'text-muted-foreground hover:text-foreground')}
                      >保持</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* results: per-note */}
        {phase === 'results' && (
          <div className="p-4 space-y-4 max-w-2xl mx-auto">
            {results.map((result) => {
              const key = `${result.category}/${result.id}`
              const note = notesToReview.find((n) => n.id === result.id && n.category === result.category)
              const isAcknowledged = acknowledged.has(key)
              const isAcknowledging = acknowledging.has(key)
              const isMerging = merging.has(key)
              const isMerged = merged.has(key)
              const isElaborating = elaborating.has(key)
              const elaboration = elaborations[key]
              const canPromote = result.decision === 'promote'
              const tab = activeTab[key] ?? 'original'

              return (
                <div
                  key={key}
                  className={cn(
                    'rounded-xl border text-sm transition-colors',
                    isAcknowledged
                      ? 'border-border/40 bg-muted/20 opacity-60'
                      : canPromote ? 'border-green-200 bg-green-50/40' : 'border-border bg-background'
                  )}
                >
                  {/* カードヘッダー */}
                  <div className="flex items-start gap-2 p-4 pb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{note?.title ?? result.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {note ? STATUS_LABELS[note.status as NoteStatus] : ''}
                        </span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium',
                          canPromote ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground')}>
                          {canPromote ? `↑ → ${STATUS_LABELS[result.newStatus]}` : '現状維持'}
                        </span>
                      </div>

                      {/* Reason + elaborate */}
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">{result.reason}</p>
                        {!elaboration && (
                          <button
                            onClick={() => elaborate(result)}
                            disabled={isElaborating}
                            className="mt-1.5 flex items-center gap-1 text-[10px] text-violet-500 hover:text-violet-600 transition-colors disabled:opacity-50"
                          >
                            {isElaborating
                              ? <><Loader2 className="w-2.5 h-2.5 animate-spin" />詳細を生成中...</>
                              : <><Sparkles className="w-2.5 h-2.5" />もっと詳しく</>}
                          </button>
                        )}
                        {elaboration && (
                          <div className="mt-2 text-xs text-foreground/80 bg-violet-50/50 border border-violet-100 rounded-lg p-3 leading-relaxed">
                            {elaboration}
                            <button
                              onClick={() => elaborate(result)}
                              disabled={isElaborating}
                              className="mt-1.5 flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-500 transition-colors"
                            >
                              {isElaborating
                                ? <><Loader2 className="w-2.5 h-2.5 animate-spin" />再生成中...</>
                                : <><Sparkles className="w-2.5 h-2.5" />再生成</>}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 了解ボタン */}
                    <button
                      onClick={() => acknowledge(result)}
                      disabled={isAcknowledged || isAcknowledging || isMerging}
                      className={cn(
                        'shrink-0 text-xs px-2.5 h-7 rounded border transition-colors mt-0.5',
                        isAcknowledged
                          ? 'border-border/30 text-muted-foreground cursor-default'
                          : isAcknowledging
                            ? 'border-border text-muted-foreground'
                            : 'border-foreground text-foreground hover:bg-muted'
                      )}
                    >
                      {isAcknowledged ? <Check className="w-3 h-3" />
                        : isAcknowledging ? <Loader2 className="w-3 h-3 animate-spin" />
                        : '了解'}
                    </button>
                  </div>

                  {/* MD プレビュータブ */}
                  {result.suggestion && !isAcknowledged && (
                    <div className="px-4 pb-4">
                      {/* タブ切り替え */}
                      <div className="flex text-[11px] border border-border rounded-lg overflow-hidden w-fit mb-2">
                        <button
                          onClick={() => setActiveTab((prev) => ({ ...prev, [key]: 'original' }))}
                          className={cn('px-3 h-7 font-medium transition-colors',
                            tab === 'original' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
                        >元のメモ</button>
                        <button
                          onClick={() => setActiveTab((prev) => ({ ...prev, [key]: 'suggestion' }))}
                          className={cn('px-3 h-7 font-medium transition-colors border-l border-border',
                            tab === 'suggestion' ? 'bg-violet-500 text-white' : 'text-muted-foreground hover:text-foreground')}
                        >AI提案</button>
                      </div>

                      {/* MD レンダリングプレビュー */}
                      <div
                        className="md-preview min-h-32 max-h-[50vh] overflow-y-auto rounded-xl border border-border/60 bg-background p-4 text-sm"
                        dangerouslySetInnerHTML={{
                          __html: renderMd(tab === 'suggestion' ? result.suggestion : (note?.content ?? '')) ||
                            '<p class="empty-hint">内容なし</p>',
                        }}
                      />

                      {/* マージボタン */}
                      {tab === 'suggestion' && (
                        <button
                          onClick={() => merge(result)}
                          disabled={isMerging || isMerged}
                          className={cn(
                            'mt-2 w-full h-9 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5',
                            isMerged
                              ? 'border-border/30 text-muted-foreground cursor-default bg-muted/20'
                              : isMerging
                                ? 'border-violet-200 text-violet-400 bg-violet-50/40'
                                : 'border-violet-400 text-violet-600 bg-violet-50/60 hover:bg-violet-100/60'
                          )}
                        >
                          {isMerged ? <><Check className="w-3.5 h-3.5" />マージ済み</>
                            : isMerging ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />マージ中...</>
                            : 'AI提案をマージして適用'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="border-t border-border px-4 py-3 shrink-0 bg-background">
        {phase === 'list' && (
          <button
            onClick={startReview}
            disabled={count === 0}
            className="w-full h-11 bg-violet-500 text-white rounded-xl text-sm font-medium hover:bg-violet-600 disabled:opacity-40 transition-colors"
          >
            AIレビュー開始
          </button>
        )}
        {phase === 'results' && (
          <div className="flex gap-2">
            <button
              onClick={() => { setPhase('list'); setResults([]); setAcknowledged(new Set()); setActiveTab({}); setMerging(new Set()); setMerged(new Set()); setElaborating(new Set()); setElaborations({}) }}
              className="flex-1 h-11 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            >やり直す</button>
            <button
              onClick={() => router.back()}
              className="flex-1 h-11 border border-foreground text-foreground rounded-xl text-sm hover:bg-muted transition-colors"
            >閉じる</button>
          </div>
        )}
      </div>
    </div>
  )
}
