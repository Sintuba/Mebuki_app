import Link from 'next/link';
import type { Note } from '@/types/note';
import StatusBadge from './StatusBadge';

export default function NoteCard({ note }: { note: Note }) {
  const excerpt = note.content.slice(0, 100).replace(/[#*`]/g, '').trim();

  return (
    <Link
      href={`/notes/${note.category}/${note.id}`}
      className="block p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all bg-white"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="font-semibold text-gray-900 truncate">{note.title}</h2>
        <StatusBadge status={note.status} />
      </div>
      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{excerpt || '内容なし'}</p>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">{note.category}</span>
        {note.ai_outcome && note.ai_outcome !== 'none' && (
          <span className={`px-1.5 py-0.5 rounded ${note.ai_outcome === 'promote' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
            {note.ai_outcome === 'promote' ? 'AI↑' : 'AI保'}
          </span>
        )}
        <span className="ml-auto">
          {new Date(note.updatedAt).toLocaleDateString('ja-JP')}
        </span>
      </div>
    </Link>
  );
}
