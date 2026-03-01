'use client'

import { use, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EditorHeader } from '@/components/editor-header'
import { EditorToolbar } from '@/components/editor-toolbar'
import { PromoteModal } from '@/components/promote-modal'
import { MdEditor } from '@/components/md-editor'
import { AiChoicePanel } from '@/components/ai-choice-panel'
import type { AiChoice } from '@/components/ai-choice-panel'
import type { NoteStatus, AiOutcome, AiEditRecord } from '@/types/note'

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
  const searchParams = useSearchParams()
  const backUrl = searchParams.get('from') ?? `/list/${category}`
  const isNew = id === 'new'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<NoteStatus>('raw')
  const [aiOutcome, setAiOutcome] = useState<AiOutcome>('keep')
  const [aiReviewed, setAiReviewed] = useState(false)
  const [aiEdits, setAiEdits] = useState<AiEditRecord[]>([])
  const createdAtRef = useRef<string>('')
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  // AI choices
  const [aiChoicesOpen, setAiChoicesOpen] = useState(false)
  const [aiChoicesLoading, setAiChoicesLoading] = useState(false)
  const [aiChoices, setAiChoices] = useState<AiChoice[]>([])
  const [aiChoicesError, setAiChoicesError] = useState('')

  // GitHub の sha（更新時に必要）
  const shaRef = useRef<string | undefined>(undefined)

  // 保存済み状態の追跡（hasChanges 検知用）
  const savedTitle = useRef('')
  const savedContent = useRef('')
  const savedStatus = useRef<NoteStatus>('raw')
  const savedAiOutcome = useRef<AiOutcome>('keep')
  const [hasChanges, setHasChanges] = useState(false)

  // イベントリスナー内でのステイル値回避用 ref
  const hasChangesRef = useRef(false)
  useEffect(() => { hasChangesRef.current = hasChanges }, [hasChanges])

  // ナビゲーション許可フラグ（確認後に戻る際に使う）
  const allowLeaveRef = useRef(false)

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
        setAiOutcome(note.ai_outcome ?? 'keep')
        setAiReviewed(note.ai_reviewed ?? false)
        setAiEdits(note.ai_edits ?? [])
        shaRef.current = note.sha
        createdAtRef.current = note.createdAt ?? ''
        savedTitle.current = note.title ?? ''
        savedContent.current = note.content ?? ''
        savedStatus.current = note.status ?? 'raw'
        savedAiOutcome.current = note.ai_outcome ?? 'keep'
        setHasChanges(false)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [category, id, isNew])

  // 変更検知（ai_outcome の切り替えも保存ボタンを有効化）
  useEffect(() => {
    setHasChanges(
      title !== savedTitle.current ||
      content !== savedContent.current ||
      status !== savedStatus.current ||
      aiOutcome !== savedAiOutcome.current
    )
  }, [title, content, status, aiOutcome])

  // ブラウザ閉じ / リロード時の警告
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasChangesRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // バックボタン（ブラウザのスワイプ・戻るボタン）のガード
  useEffect(() => {
    window.history.pushState({ editorGuard: true }, '')

    const handlePopState = () => {
      if (allowLeaveRef.current) return
      if (hasChangesRef.current) {
        window.history.pushState({ editorGuard: true }, '')
        setShowLeaveModal(true)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // ヘッダーの戻るボタン（Link → callback に変更済みのため確実に捕捉できる）
  const handleBack = () => {
    if (hasChanges) {
      setShowLeaveModal(true)
    } else {
      router.push(backUrl)
    }
  }

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
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), category, content }),
        })
        if (!res.ok) throw new Error('作成に失敗しました')
        const note = await res.json()
        router.replace(`/edit/${note.category}/${note.id}`)
      } else {
        const res = await fetch(`/api/notes/${category}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content,
            status: saveStatus,
            ai_outcome: aiOutcome,
            ai_reviewed: aiReviewed,
            sha: shaRef.current,
            createdAt: createdAtRef.current,
          }),
        })
        if (!res.ok) throw new Error('保存に失敗しました')
        const updated = await res.json()
        shaRef.current = updated.sha
        if (overrideStatus) setStatus(overrideStatus)
      }
      savedTitle.current = title.trim()
      savedContent.current = content
      savedStatus.current = saveStatus
      savedAiOutcome.current = aiOutcome
      setHasChanges(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndLeave = async () => {
    await handleSave()
    setShowLeaveModal(false)
    allowLeaveRef.current = true
    router.push(backUrl)
  }

  const handleLeaveWithoutSaving = () => {
    setShowLeaveModal(false)
    allowLeaveRef.current = true
    router.push(backUrl)
  }

  const handlePromoteConfirm = () => {
    setPromoteOpen(false)
    handleSave(promoteStatus(status))
  }

  const handleDemote = () => {
    setStatus(demoteStatus(status))
  }

  const handleAiChoices = async () => {
    setAiChoicesOpen(true)
    setAiChoicesLoading(true)
    setAiChoices([])
    setAiChoicesError('')
    try {
      const res = await fetch('/api/ai/choices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI提案に失敗しました')
      setAiChoices(data.choices ?? [])
    } catch (e) {
      setAiChoicesError(e instanceof Error ? e.message : 'AI提案に失敗しました')
    } finally {
      setAiChoicesLoading(false)
    }
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
          <button onClick={() => setError('')} className="ml-2 underline">
            閉じる
          </button>
        </div>
      )}

      {status === 'trashed' && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2 flex items-center justify-center gap-3">
          <span>このノートは宿根です</span>
          <button
            onClick={() => setStatus('raw')}
            className="px-2.5 py-1 rounded border border-amber-400 bg-amber-100 hover:bg-amber-200 font-medium transition-colors"
          >
            復元する
          </button>
        </div>
      )}

      <EditorHeader
        title={title}
        onTitleChange={setTitle}
        category={category}
        status={status}
        aiOutcome={aiOutcome}
        onBack={handleBack}
      />

      <MdEditor value={content} onChange={setContent} disabled={saving} />

      <EditorToolbar
        aiOutcome={aiOutcome}
        onAiOutcomeChange={setAiOutcome}
        aiReviewed={aiReviewed}
        aiEdits={aiEdits}
        hasChanges={hasChanges}
        hasContent={content.trim().length > 0}
        status={status}
        saving={saving}
        aiChoicesLoading={aiChoicesLoading}
        onSave={() => handleSave()}
        onPromote={() => setPromoteOpen(true)}
        onDemote={handleDemote}
        onYamlCopy={() => {
          navigator.clipboard.writeText(
            `title: "${title}"\ncategory: ${category}\nstatus: ${status}\nai_outcome: ${aiOutcome}\nai_reviewed: ${aiReviewed}`
          )
        }}
        onAiChoices={!isNew ? handleAiChoices : undefined}
      />

      <PromoteModal
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        onConfirm={handlePromoteConfirm}
        content={content}
      />

      <AiChoicePanel
        open={aiChoicesOpen}
        loading={aiChoicesLoading}
        choices={aiChoices}
        error={aiChoicesError}
        onClose={() => setAiChoicesOpen(false)}
        onApply={(newContent) => setContent(newContent)}
      />

      {/* 未保存確認オーバーレイ */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowLeaveModal(false)}
          />
          <div className="relative w-full bg-background rounded-t-2xl shadow-xl border border-border px-5 pt-5 pb-8">
            <p className="text-sm font-medium mb-1">保存されていない変更があります</p>
            <p className="text-xs text-muted-foreground mb-5">保存せずに戻りますか？</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveAndLeave}
                disabled={saving}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '保存して戻る'}
              </button>
              <button
                onClick={handleLeaveWithoutSaving}
                className="w-full h-11 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                保存せず戻る
              </button>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-full h-11 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
