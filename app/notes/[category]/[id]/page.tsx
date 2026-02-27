'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import StatusBadge from '@/components/StatusBadge';
import type { Note, NoteStatus } from '@/types/note';

// SSRを無効化（react-md-editorはclient-only）
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const STATUS_FLOW: NoteStatus[] = ['raw', 'refining', 'stable'];

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  const id = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/notes/${category}/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setNote(data);
        setContent(data.content ?? '');
      })
      .catch(() => setError('ノートの読み込みに失敗しました'));
  }, [category, id]);

  const save = useCallback(
    async (overrides?: Partial<Note>) => {
      if (!note) return;
      setSaving(true);
      setError('');
      try {
        const res = await fetch(`/api/notes/${category}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            sha: note.sha,
            ...overrides,
          }),
        });
        if (!res.ok) throw new Error('保存に失敗しました');
        const updated: Note = await res.json();
        setNote(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存に失敗しました');
      } finally {
        setSaving(false);
      }
    },
    [note, content, category, id]
  );

  async function advanceStatus() {
    if (!note) return;
    const currentIdx = STATUS_FLOW.indexOf(note.status);
    if (currentIdx === STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    await save({ status: nextStatus });
  }

  if (error && !note) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {error}
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        読み込み中...
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(note.status);
  const canAdvance = currentIdx < STATUS_FLOW.length - 1;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-gray-700 transition-colors text-sm"
          >
            ← 一覧
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-mono text-gray-500">{note.category}</span>
          <span className="font-semibold text-gray-900 truncate flex-1">{note.title}</span>

          <div className="flex items-center gap-2 ml-auto">
            <StatusBadge status={note.status} />

            {canAdvance && (
              <button
                onClick={advanceStatus}
                disabled={saving}
                className="px-2.5 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                → {STATUS_FLOW[currentIdx + 1]}
              </button>
            )}

            <button
              onClick={() => save()}
              disabled={saving}
              className="px-3 py-1 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : saved ? '保存済み ✓' : '保存'}
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2 text-center">{error}</div>
        )}
      </header>

      {/* エディタ */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4" data-color-mode="light">
        <MDEditor
          value={content}
          onChange={(v) => setContent(v ?? '')}
          height="calc(100vh - 120px)"
          preview="live"
          hideToolbar={false}
        />
      </div>

      {/* フッター: メタ情報 */}
      <footer className="border-t border-gray-100 py-2 px-4 text-xs text-gray-400 flex gap-4">
        <span>作成: {new Date(note.createdAt).toLocaleString('ja-JP')}</span>
        <span>更新: {new Date(note.updatedAt).toLocaleString('ja-JP')}</span>
        {note.ai_review && <span className="text-purple-400">AI reviewed</span>}
      </footer>
    </div>
  );
}
