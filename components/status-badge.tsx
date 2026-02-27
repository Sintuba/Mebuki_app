import type { NoteStatus } from '@/types/note';
import { STATUS_LABELS } from '@/lib/constants';

const CONFIG: Record<NoteStatus, string> = {
  raw: 'bg-orange-100 text-orange-700 border border-orange-200',
  refining: 'bg-blue-100 text-blue-700 border border-blue-200',
  stable: 'bg-green-100 text-green-700 border border-green-200',
};

export function StatusBadge({ status }: { status: NoteStatus }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${CONFIG[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
