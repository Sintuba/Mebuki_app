'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAiSelection } from '@/contexts/ai-review-selection'

const MAX = 10

interface AiReviewTabProps {
  variant?: 'mobile' | 'desktop'
}

export function AiReviewTab({ variant = 'mobile' }: AiReviewTabProps) {
  const { selectedNotes } = useAiSelection()
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/home'

  const count = Math.min(selectedNotes.length, MAX)

  const handleOpen = () => {
    if (count > 0) router.push('/review')
  }

  if (variant === 'desktop') {
    return (
      <button
        onClick={count > 0 ? handleOpen : undefined}
        className={cn(
          'flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all duration-200',
          count > 0
            ? 'border-violet-400 text-violet-600 bg-violet-50/60 hover:bg-violet-100/60'
            : 'border-border text-muted-foreground cursor-default'
        )}
      >
        <Sparkles className={cn('size-3', count > 0 && 'text-violet-500')} />
        AIレビュー
        {count > 0 && (
          <span className="text-[9px] font-bold bg-violet-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={!isHome && count > 0 ? handleOpen : undefined}
      className="flex-1 flex flex-col items-center justify-center"
    >
      <div className={cn(
        'relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 -mt-5 shadow-md',
        isHome
          ? 'bg-muted text-muted-foreground/30 shadow-none'
          : count > 0
            ? 'bg-linear-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-indigo-300/50'
            : 'bg-muted/60 text-muted-foreground border border-border shadow-none'
      )}>
        <Sparkles className={cn('size-6', !isHome && count > 0 && 'animate-pulse')} />
        {!isHome && count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-white text-violet-600 rounded-full w-4.5 h-4.5 flex items-center justify-center leading-none border border-violet-200 shadow-sm">
            {count}
          </span>
        )}
      </div>
      <span className={cn(
        'text-[11px] mt-1 transition-colors',
        isHome
          ? 'text-muted-foreground/30'
          : count > 0
            ? 'text-violet-500 font-medium'
            : 'text-muted-foreground'
      )}>
        AI
      </span>
    </button>
  )
}
