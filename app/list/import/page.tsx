'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import type { NoteCategory } from '@/types/note'
import { CATEGORY_LABELS } from '@/lib/constants'

const CATEGORIES: NoteCategory[] = ['learning', 'specs', 'snippets', 'logs', 'rules']

function extractFromFile(content: string, filename: string): { title: string; body: string } {
  // Try frontmatter
  const fmMatch = content.match(/^---\n([\s\S]+?)\n---\n?([\s\S]*)/)
  if (fmMatch) {
    const titleLine = fmMatch[1].match(/^title:\s*(.+)$/m)
    const title = titleLine ? titleLine[1].trim().replace(/^["']|["']$/g, '') : ''
    return { title, body: fmMatch[2].trim() }
  }
  // Try first # heading
  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch) {
    return { title: headingMatch[1].trim(), body: content }
  }
  // Fallback to filename
  return { title: filename.replace(/\.[^.]+$/, ''), body: content }
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [rawContent, setRawContent] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<NoteCategory>('learning')
  const [isDragOver, setIsDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function processFile(f: File) {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      setRawContent(text)
      const { title: t, body: b } = extractFromFile(text, f.name)
      setTitle(t)
      setBody(b || text)
    }
    reader.readAsText(f, 'utf-8')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }

  function reset() {
    setFile(null)
    setRawContent('')
    setTitle('')
    setBody('')
  }

  async function handleImport() {
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), category, content: body }),
      })
      if (!res.ok) throw new Error('インポートに失敗しました')
      const note = await res.json()
      router.push(`/edit/${note.category}/${note.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'インポートに失敗しました')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h1 className="text-sm font-medium">インポート</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-xs rounded">
            {error}
          </div>
        )}

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">ファイルをドロップ</p>
              <p className="text-xs text-muted-foreground mt-1">または クリックして選択</p>
            </div>
            <p className="text-[11px] text-muted-foreground/60">.md / .yaml / .yml / .json</p>
            <input
              ref={inputRef}
              type="file"
              accept=".md,.yaml,.yml,.json"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{file.name}</span>
              <button
                onClick={reset}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                変更
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">原ファイル</p>
                <pre className="text-[11px] bg-muted/50 rounded p-3 overflow-auto max-h-64 font-mono whitespace-pre-wrap">
                  {rawContent}
                </pre>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">変換後Markdown</p>
                <pre className="text-[11px] bg-muted/50 rounded p-3 overflow-auto max-h-64 font-mono whitespace-pre-wrap">
                  {body}
                </pre>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-w-md">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">タイトル</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ノートのタイトル"
                  className="w-full text-sm border border-border rounded px-3 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">カテゴリ</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NoteCategory)}
                  className="w-full text-sm border border-border rounded px-3 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleImport}
                disabled={loading || !title.trim()}
                className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '取り込み中...' : '取り込む'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
