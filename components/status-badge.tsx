import type { NoteStatus } from '@/types/note';
import { STATUS_LABELS } from '@/lib/constants';

export function StatusBadge({ status }: { status: NoteStatus }) {
  const cls =
    status === 'raw'
      ? 'bg-orange-100 text-orange-700 border-orange-200'
      : status === 'refining'
        ? 'bg-blue-100 text-blue-700 border-blue-200'
        : status === 'trashed'
          ? 'bg-gray-100 text-gray-500 border-gray-200'
          : 'bg-green-100 text-green-700 border-green-200'

  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0 ${cls}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
