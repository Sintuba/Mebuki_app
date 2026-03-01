import type { NoteStatus } from '@/types/note';

const config: Record<NoteStatus, { label: string; className: string }> = {
  raw: {
    label: 'raw',
    className: 'bg-orange-100 text-orange-700 border border-orange-200',
  },
  refining: {
    label: 'refining',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  stable: {
    label: 'stable',
    className: 'bg-green-100 text-green-700 border border-green-200',
  },
  trashed: {
    label: 'trashed',
    className: 'bg-gray-100 text-gray-500 border border-gray-200',
  },
};

export default function StatusBadge({ status }: { status: NoteStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium ${className}`}>
      {label}
    </span>
  );
}
