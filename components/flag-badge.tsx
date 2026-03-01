import type { AiOutcome } from '@/types/note'

interface AiBadgeProps {
  outcome: AiOutcome
}

export function AiBadge({ outcome }: AiBadgeProps) {
  if (outcome === 'none') return null
  const styles =
    outcome === 'promote'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-amber-50 text-amber-700 border-amber-200'
  const label = outcome === 'promote' ? 'AI↑' : 'AI保'
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0 ${styles}`}>
      {label}
    </span>
  )
}

export function AiReviewedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-600 border border-violet-200 shrink-0">
      ✦AI済
    </span>
  )
}

export function PromoteBadge() {
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
      候補
    </span>
  )
}
