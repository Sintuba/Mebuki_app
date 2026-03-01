'use client'

import { useState } from 'react'
import { Sparkles, X, ChevronRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AiChoice {
  id: string
  label: string
  description: string
  content: string
}

interface AiChoicePanelProps {
  open: boolean
  loading: boolean
  choices: AiChoice[]
  error: string
  onClose: () => void
  onApply: (content: string) => void
}

export function AiChoicePanel({
  open,
  loading,
  choices,
  error,
  onClose,
  onApply,
}: AiChoicePanelProps) {
  const [preview, setPreview] = useState<AiChoice | null>(null)

  if (!open) return null

  const handleApply = (content: string) => {
    onApply(content)
    setPreview(null)
    onClose()
  }

  const handleClose = () => {
    setPreview(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full md:max-w-lg bg-background rounded-t-2xl md:rounded-2xl shadow-xl border border-border flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            <span className="text-sm font-medium">AIが変換方向を提案</span>
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
              <div className="size-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <p className="text-xs text-muted-foreground">AIが考えています...</p>
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
          ) : preview ? (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreview(null)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3" />
                  戻る
                </button>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs font-medium">{preview.label}</span>
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto font-mono text-foreground/80 border border-border/50">
                {preview.content}
              </div>
              <button
                onClick={() => handleApply(preview.content)}
                className="w-full h-11 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors"
              >
                この方向で適用する
              </button>
              <p className="text-[10px] text-muted-foreground text-center">
                適用後も編集・保存できます
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                どの方向でこのメモを変換しますか？
              </p>
              {choices.map((choice, i) => (
                <button
                  key={choice.id}
                  onClick={() => setPreview(choice)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left group',
                    i === 0 && 'border-violet-200 hover:border-violet-400 hover:bg-violet-50/40',
                    i === 1 && 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/40',
                    i === 2 && 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/40',
                  )}
                >
                  <div className={cn(
                    'size-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    i === 0 && 'bg-violet-100 text-violet-600',
                    i === 1 && 'bg-blue-100 text-blue-600',
                    i === 2 && 'bg-amber-100 text-amber-600',
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{choice.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{choice.description}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                </button>
              ))}
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                タップするとプレビューできます
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
