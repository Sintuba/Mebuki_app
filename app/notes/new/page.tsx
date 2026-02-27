'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NoteCategory } from '@/types/note';

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoteCategory>('learning');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), category }),
      });
      if (!res.ok) throw new Error('作成に失敗しました');
      const note = await res.json();
      router.push(`/notes/${note.category}/${note.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '作成に失敗しました');
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← 戻る
          </button>
          <h1 className="text-base font-semibold text-gray-900">新しいノート</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="ノートのタイトルを入力..."
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <div className="flex gap-2">
              {(['learning', 'specs'] as NoteCategory[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-md text-sm font-mono transition-colors ${
                    category === c
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '作成中...' : 'ノートを作成する'}
          </button>
        </div>
      </main>
    </div>
  );
}
