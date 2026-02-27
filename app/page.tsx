'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NoteCard from '@/components/NoteCard';
import type { Note, NoteCategory, NoteStatus } from '@/types/note';

const CATEGORIES: { value: NoteCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'learning', label: 'learning' },
  { value: 'specs', label: 'specs' },
];

const STATUSES: { value: NoteStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'raw', label: 'raw' },
  { value: 'refining', label: 'refining' },
  { value: 'stable', label: 'stable' },
];

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<NoteCategory | 'all'>('all');
  const [status, setStatus] = useState<NoteStatus | 'all'>('all');

  useEffect(() => {
    setLoading(true);
    const url =
      category === 'all' ? '/api/notes' : `/api/notes?category=${category}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [category]);

  const filtered =
    status === 'all' ? notes : notes.filter((n) => n.status === status);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 font-mono">Mebuki</h1>
          <Link
            href="/notes/new"
            className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            + 新しいノート
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1 rounded-full text-sm font-mono transition-colors ${
                  category === c.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`px-3 py-1 rounded-full text-sm font-mono transition-colors ${
                  status === s.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>ノートがありません</p>
            <Link
              href="/notes/new"
              className="mt-3 inline-block text-sm text-gray-600 underline"
            >
              最初のノートを作成する
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((note) => (
              <NoteCard key={note.slug} note={note} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
