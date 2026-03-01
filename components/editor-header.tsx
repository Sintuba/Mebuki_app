'use client'

import { ChevronLeft } from 'lucide-react'
import type { NoteStatus, AiOutcome } from '@/types/note'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<NoteStatus, string> = {
  raw:      'text-orange-600 bg-orange-50 border-orange-200',
  refining: 'text-blue-600  bg-blue-50  border-blue-200',
  stable:   'text-green-600 bg-green-50 border-green-200',
  trashed:  'text-gray-500  bg-gray-50  border-gray-200',
}

interface EditorHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  category: string
  status: NoteStatus
  aiOutcome: AiOutcome
  onBack: () => void
}

export function EditorHeader({
  title,
  onTitleChange,
  category,
  status,
  aiOutcome,
  onBack,
}: EditorHeaderProps) {
  const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category

  return (
    <div className="shrink-0 border-b border-border bg-background">
      {/* Row 1: ナビゲーション（薄め） */}
      <div className="flex items-center gap-1.5 px-1 md:px-3 h-9 border-b border-border/40">
        <button
          onClick={onBack}
          className="flex items-center gap-0.5 px-2 h-9 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`${categoryLabel}一覧に戻る`}
        >
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline text-[11px]">{categoryLabel}</span>
        </button>

        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0', STATUS_STYLES[status])}>
          {STATUS_LABELS[status]}
        </span>

        <div className="flex-1" />

        {aiOutcome === 'promote' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-green-200 bg-green-50 text-green-700 font-medium shrink-0">
            AI↑
          </span>
        )}
        {aiOutcome === 'keep' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 font-medium shrink-0">
            AI保
          </span>
        )}
      </div>

      {/* Row 2: タイトル入力 */}
      <div className="px-4 md:px-5 py-2">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="タイトルを入力..."
          className="w-full text-base md:text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none"
        />
      </div>
    </div>
  )
}
