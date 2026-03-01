'use client'

import { useState } from 'react'
import { Sparkles, Sprout } from 'lucide-react'
import type { NoteStatus, AiOutcome, AiEditRecord } from '@/types/note'
import { STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const STATUS_ORDER: NoteStatus[] = ['raw', 'refining', 'stable']

interface EditorToolbarProps {
  aiOutcome: AiOutcome
  onAiOutcomeChange: (v: AiOutcome) => void
  aiReviewed: boolean
  aiEdits?: AiEditRecord[]
  hasChanges: boolean
  hasContent: boolean
  status: NoteStatus
  saving?: boolean
  aiChoicesLoading?: boolean
  sproutLoading?: boolean
  onSave: () => void
  onPromote: () => void
  onDemote: () => void
  onYamlCopy: () => void
  onAiChoices?: () => void
  onSprout?: () => void
}

function AiOutcomeControl({ value, onChange, compact = false }: {
  value: AiOutcome; onChange: (v: AiOutcome) => void; compact?: boolean
}) {
  const segments: { key: AiOutcome; label: string; shortLabel: string; activeClass: string }[] = [
    { key: 'none',    label: 'AI なし', shortLabel: '-',   activeClass: 'bg-muted text-foreground' },
    { key: 'promote', label: 'AI昇華',  shortLabel: 'AI↑', activeClass: 'bg-green-500 text-white' },
    { key: 'keep',    label: 'AI保持',  shortLabel: 'AI保', activeClass: 'bg-amber-400 text-white' },
  ]
  return (
    <div className="flex items-center border border-border rounded-full overflow-hidden shrink-0 text-[11px]">
      {segments.map((seg, i) => (
        <button key={seg.key} onClick={() => onChange(seg.key)} title={seg.label}
          className={cn('transition-colors font-medium', compact ? 'px-3 h-11 text-xs' : 'px-2.5 h-7',
            i > 0 && 'border-l border-border',
            value === seg.key ? seg.activeClass : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
          {compact ? seg.shortLabel : seg.label}
        </button>
      ))}
    </div>
  )
}

function AiEditsPopover({ aiEdits }: { aiEdits: AiEditRecord[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors">
        <span>✦</span><span>変更履歴 {aiEdits.length}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 z-50 min-w-60 max-w-80 bg-background border border-border rounded-xl shadow-lg p-3 space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-2">AI変更履歴</p>
            {aiEdits.map((edit, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className="text-muted-foreground/60 shrink-0 tabular-nums whitespace-nowrap">
                  {new Date(edit.at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-foreground/80 leading-relaxed">{edit.summary}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function EditorToolbar({
  aiOutcome, onAiOutcomeChange, aiReviewed, aiEdits = [],
  hasChanges, hasContent, status, saving = false,
  aiChoicesLoading = false,
  sproutLoading = false,
  onSave, onPromote, onDemote, onYamlCopy, onAiChoices, onSprout,
}: EditorToolbarProps) {
  const currentIdx = STATUS_ORDER.indexOf(status)
  const canPromote = currentIdx < STATUS_ORDER.length - 1
  const canDemote  = currentIdx > 0
  const promoteEnabled = canPromote && hasContent && aiReviewed
  const promoteTitle = !aiReviewed ? 'AIレビューを受けると昇華できます' : undefined

  return (
    <div className="shrink-0 border-t border-border bg-background">
      {/* SP: 1行 */}
      <div className="flex md:hidden items-center gap-2 px-3 h-20">
        <AiOutcomeControl value={aiOutcome} onChange={onAiOutcomeChange} compact />
        <div className="flex-1" />
        {canDemote && (
          <button onClick={onDemote}
            className="text-sm text-muted-foreground hover:text-foreground px-3 h-11 rounded border border-border transition-colors shrink-0">↓</button>
        )}
        {onAiChoices && hasContent && (
          <button
            onClick={onAiChoices}
            disabled={aiChoicesLoading}
            title="AIに変換方向を提案してもらう"
            className={cn(
              'h-11 w-11 rounded border transition-colors shrink-0 flex items-center justify-center',
              aiChoicesLoading
                ? 'border-violet-300 text-violet-400'
                : 'border-violet-300 text-violet-500 hover:bg-violet-50'
            )}
          >
            <Sparkles className={cn('size-5', aiChoicesLoading && 'animate-pulse')} />
          </button>
        )}
        {onSprout && hasContent && (
          <button
            onClick={onSprout}
            disabled={sproutLoading}
            title="芽吹き候補を探す"
            className={cn(
              'h-11 w-11 rounded border transition-colors shrink-0 flex items-center justify-center',
              sproutLoading
                ? 'border-green-300 text-green-400'
                : 'border-green-300 text-green-600 hover:bg-green-50'
            )}
          >
            <Sprout className={cn('size-5', sproutLoading && 'animate-pulse')} />
          </button>
        )}
        <button onClick={onSave} disabled={saving || !hasChanges}
          className={cn('text-sm px-4 h-11 rounded border transition-colors shrink-0',
            hasChanges && !saving ? 'border-foreground text-foreground' : 'border-border text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50')}>
          {saving ? '…' : hasChanges ? '保存' : '済み'}
        </button>
        {canPromote && hasContent && (
          <button onClick={promoteEnabled ? onPromote : undefined} disabled={!promoteEnabled} title={promoteTitle}
            className={cn('text-sm px-4 h-11 rounded transition-colors shrink-0',
              promoteEnabled ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
            昇華
          </button>
        )}
      </div>

      {/* PC: 1行に集約 */}
      <div className="hidden md:flex items-center gap-2 px-4 h-11">
        {canDemote && (
          <button onClick={onDemote}
            className="text-xs text-muted-foreground hover:text-foreground px-2.5 h-7 rounded border border-border transition-colors shrink-0"
            title={`${STATUS_LABELS[STATUS_ORDER[currentIdx - 1]]}に降格`}>
            ↓ {STATUS_LABELS[STATUS_ORDER[currentIdx - 1]]}
          </button>
        )}
        <AiOutcomeControl value={aiOutcome} onChange={onAiOutcomeChange} />
        <div className="flex-1" />
        {aiEdits.length > 0 && <AiEditsPopover aiEdits={aiEdits} />}
        {aiReviewed && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-600 shrink-0">
            ✦AI済
          </span>
        )}
        <button onClick={onYamlCopy}
          className="text-[11px] text-muted-foreground hover:text-foreground px-2 h-7 rounded transition-colors shrink-0"
          title="YAMLをクリップボードにコピー">YAML</button>
        {onAiChoices && hasContent && (
          <button
            onClick={onAiChoices}
            disabled={aiChoicesLoading}
            title="AIに変換方向を提案してもらう"
            className={cn(
              'flex items-center gap-1.5 text-[11px] px-2.5 h-7 rounded border transition-colors shrink-0',
              aiChoicesLoading
                ? 'border-violet-200 text-violet-400'
                : 'border-violet-300 text-violet-500 hover:bg-violet-50'
            )}
          >
            <Sparkles className={cn('size-3', aiChoicesLoading && 'animate-pulse')} />
            {aiChoicesLoading ? '考え中...' : 'AI提案'}
          </button>
        )}
        {onSprout && hasContent && (
          <button
            onClick={onSprout}
            disabled={sproutLoading}
            title="芽吹き候補を探す"
            className={cn(
              'flex items-center gap-1.5 text-[11px] px-2.5 h-7 rounded border transition-colors shrink-0',
              sproutLoading
                ? 'border-green-200 text-green-400'
                : 'border-green-300 text-green-600 hover:bg-green-50'
            )}
          >
            <Sprout className={cn('size-3', sproutLoading && 'animate-pulse')} />
            {sproutLoading ? '探し中...' : '芽吹く'}
          </button>
        )}
        <button onClick={onSave} disabled={saving || !hasChanges}
          className={cn('text-sm px-4 h-8 rounded border transition-colors shrink-0',
            hasChanges && !saving ? 'border-foreground text-foreground hover:bg-muted' : 'border-border text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50')}>
          {saving ? '保存中…' : hasChanges ? '保存' : '保存済み'}
        </button>
        {canPromote && hasContent && (
          <button onClick={promoteEnabled ? onPromote : undefined} disabled={!promoteEnabled} title={promoteTitle}
            className={cn('text-sm px-4 h-8 rounded transition-colors shrink-0',
              promoteEnabled ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
            昇華 →
          </button>
        )}
      </div>
    </div>
  )
}
