'use client'

import { use, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EditorHeader } from '@/components/editor-header'
import { EditorToolbar } from '@/components/editor-toolbar'
import { PromoteModal } from '@/components/promote-modal'
import type { NoteStatus } from '@/types/note'

const STATUS_ORDER: NoteStatus[] = ['raw', 'refining', 'stable']

function promoteStatus(s: NoteStatus): NoteStatus {
  const i = STATUS_ORDER.indexOf(s)
  return i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : s
}

function demoteStatus(s: NoteStatus): NoteStatus {
  const i = STATUS_ORDER.indexOf(s)
  return i > 0 ? STATUS_ORDER[i - 1] : s
}

export default function EditorPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>
}) {
  const { category, id } = use(params)
  const router = useRouter()
  const isNew = id === 'new'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<NoteStatus>('raw')
  const [aiReview, setAiReview] = useState(false)
  const [promoteCandidate, setPromoteCandidate] = useState(false)
  const [keep, setKeep] = useState(false)
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // GitHub の sha（更新時に必要）
  const shaRef = useRef<string | undefined>(undefined)

  // 保存済み状態の追跡（hasChanges 検知用）
  const savedTitle = useRef('')
  const savedContent = useRef('')
  const savedStatus = useRef<NoteStatus>('raw')
  const [hasChanges, setHasChanges] = useState(false)

  // 既存ノートの読み込み
  useEffect(() => {
    if (isNew) return
    setLoading(true)
    fetch(`/api/notes/${category}/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('ノートの読み込みに失敗しました')
        return r.json()
      })
      .then((note) => {
        setTitle(note.title ?? '')
        setContent(note.content ?? '')
        setStatus(note.status ?? 'raw')
        setAiReview(note.ai_review ?? false)
        shaRef.current = note.sha
        // ロード直後は変更なし
        savedTitle.current = note.title ?? ''
        savedContent.current = note.content ?? ''
        savedStatus.current = note.status ?? 'raw'
        setHasChanges(false)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [category, id, isNew])

  // 変更検知
  useEffect(() => {
    setHasChanges(
      title !== savedTitle.current ||
      content !== savedContent.current ||
      status !== savedStatus.current
    )
  }, [title, content, status])

  const handleSave = async (overrideStatus?: NoteStatus) => {
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    setSaving(true)
    setError('')
    const saveStatus = overrideStatus ?? status
    try {
      if (isNew) {
        // 新規作成
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), category, content }),
        })
        if (!res.ok) throw new Error('作成に失敗しました')
        const note = await res.json()
        // 作成後は新しい URL に遷移
        router.replace(`/edit/${note.category}/${note.id}`)
      } else {
        // 既存ノート更新
        const res = await fetch(`/api/notes/${category}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content,
            status: saveStatus,
            ai_review: aiReview,
            sha: shaRef.current,
          }),
        })
        if (!res.ok) throw new Error('保存に失敗しました')
        const updated = await res.json()
        shaRef.current = updated.sha
        if (overrideStatus) setStatus(overrideStatus)
      }
      // 保存済み状態を更新
      savedTitle.current = title.trim()
      savedContent.current = content
      savedStatus.current = saveStatus
      setHasChanges(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handlePromoteConfirm = () => {
    setPromoteOpen(false)
    handleSave(promoteStatus(status))
  }

  const handleDemote = () => {
    setStatus(demoteStatus(status))
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center">
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {error && (
        <div className="shrink-0 bg-destructive/10 text-destructive text-xs px-4 py-2 text-center">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 underline"
          >
            閉じる
          </button>
        </div>
      )}

      <EditorHeader
        title={title}
        onTitleChange={setTitle}
        category={category}
        status={status}
        aiReview={aiReview}
        promoteCandidate={promoteCandidate}
        keep={keep}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-background text-foreground text-sm font-mono resize-none p-4 md:p-6 outline-none leading-relaxed placeholder:text-muted-foreground/50 caret-primary"
          placeholder="ここにMarkdownを書く..."
          disabled={saving}
        />
      </div>

      <EditorToolbar
        aiReview={aiReview}
        onAiReviewChange={setAiReview}
        promoteCandidate={promoteCandidate}
        onPromoteCandidateChange={setPromoteCandidate}
        keep={keep}
        onKeepChange={setKeep}
        hasChanges={hasChanges}
        hasContent={content.trim().length > 0}
        status={status}
        saving={saving}
        onSave={() => handleSave()}
        onPromote={() => setPromoteOpen(true)}
        onDemote={handleDemote}
        onYamlCopy={() => {
          navigator.clipboard.writeText(
            `title: "${title}"\ncategory: ${category}\nstatus: ${status}\nai_review: ${aiReview}\npromote_candidate: ${promoteCandidate}\nkeep: ${keep}`
          )
        }}
      />

      <PromoteModal
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        onConfirm={handlePromoteConfirm}
        content={content}
      />
    </div>
  )
}
