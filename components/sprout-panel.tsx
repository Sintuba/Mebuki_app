'use client'

import { useState } from 'react'
import { Sprout, X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NoteCategory } from '@/types/note'

export interface SproutCandidate {
  title: string
  summary: string
}

interface SproutPanelProps {
  open: boolean
  loading: boolean
  sprouts: SproutCandidate[]
  error: string
  category: NoteCategory
  onClose: () => void
  onSprouted: (count: number) => void
}

export function SproutPanel({
  open,
  loading,
  sprouts,
  error,
  category,
  onClose,
  onSprouted,
}: SproutPanelProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [done, setDone] = useState(false)

  if (!open) return null

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const handleSprout = async () => {
    if (selected.size === 0) return
    setCreating(true)
    setCreateError('')
    let count = 0
    try {
      for (const i of selected) {
        const sprout = sprouts[i]
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            title: sprout.title,
            content: `> ${sprout.summary}\n\n`,
          }),
        })
        if (res.ok) count++
      }
      setDone(true)
      onSprouted(count)
    } catch {
      setCreateError('ノートの作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setSelected(new Set())
    setDone(false)
    setCreateError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full md:max-w-lg bg-background rounded-t-2xl md:rounded-2xl shadow-xl border border-border flex flex-col max-h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Sprout className="size-4 text-green-500" />
            <span className="text-sm font-medium">芽吹き候補</span>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="size-6 text-green-500 animate-spin" />
              <p className="text-xs text-muted-foreground">芽吹き候補を探しています...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={handleClose}
                className="text-xs text-muted-foreground underline"
              >
                閉じる
              </button>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="size-12 rounded-full bg-green-100 flex items-center justify-center">
                <Sprout className="size-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-700">
                {selected.size}件のノートが芽吹きました
              </p>
              <p className="text-xs text-muted-foreground">リストから確認できます</p>
              <button
                onClick={handleClose}
                className="mt-2 text-xs text-muted-foreground underline"
              >
                閉じる
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                独立して深掘りする価値がある候補を選んでください
              </p>
              {sprouts.map((sprout, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left',
                    selected.has(i)
                      ? 'border-green-400 bg-green-50/60'
                      : 'border-border hover:border-green-300 hover:bg-green-50/30'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 size-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                      selected.has(i) ? 'bg-green-500 border-green-500' : 'border-border'
                    )}
                  >
                    {selected.has(i) && <Check className="size-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{sprout.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {sprout.summary}
                    </p>
                  </div>
                </button>
              ))}
              {createError && (
                <p className="text-xs text-destructive text-center pt-1">{createError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && !done && (
          <div className="border-t border-border px-4 py-3 shrink-0">
            <button
              onClick={handleSprout}
              disabled={creating || selected.size === 0}
              className={cn(
                'w-full h-11 rounded-xl text-sm font-medium transition-colors',
                selected.size > 0 && !creating
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  作成中...
                </span>
              ) : selected.size > 0 ? (
                `${selected.size}件を新規ノートとして芽吹かせる`
              ) : (
                '候補を選択してください'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
