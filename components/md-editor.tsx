'use client'

import { useRef, useState } from 'react'
import {
  Bold, Italic, Heading1, Heading2, Code, Code2,
  List, ListOrdered, Quote, Minus,
  Eye, PenLine, Columns2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Markdown renderer (no external deps) ────────────────────────────────────

function inlineMd(raw: string): string {
  return raw
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
}

export function renderMd(src: string): string {
  if (!src.trim()) return ''
  const lines = src.split('\n')
  let html = ''
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      let code = ''
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        code += lines[i] + '\n'
        i++
      }
      html += `<pre><code class="lang-${lang}">${code.trimEnd()}</code></pre>`
      i++
      continue
    }

    // Headings
    const h4m = line.match(/^#### (.+)/)
    const h3m = line.match(/^### (.+)/)
    const h2m = line.match(/^## (.+)/)
    const h1m = line.match(/^# (.+)/)
    if (h1m) { html += `<h1>${inlineMd(h1m[1])}</h1>`; i++; continue }
    if (h2m) { html += `<h2>${inlineMd(h2m[1])}</h2>`; i++; continue }
    if (h3m) { html += `<h3>${inlineMd(h3m[1])}</h3>`; i++; continue }
    if (h4m) { html += `<h4>${inlineMd(h4m[1])}</h4>`; i++; continue }

    // Horizontal rule
    if (line.match(/^[-*]{3,}$/)) { html += '<hr />'; i++; continue }

    // Blockquote
    if (line.startsWith('> ')) {
      html += `<blockquote>${inlineMd(line.slice(2))}</blockquote>`; i++; continue
    }

    // Table (basic: | col | col |)
    if (line.includes('|') && lines[i + 1]?.match(/^\|?[\s:|-]+\|/)) {
      const headers = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      const headerHtml = headers.map(h => `<th>${inlineMd(h.trim())}</th>`).join('')
      i += 2 // skip separator row
      let bodyHtml = ''
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        bodyHtml += `<tr>${cells.map(c => `<td>${inlineMd(c.trim())}</td>`).join('')}</tr>`
        i++
      }
      html += `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`
      continue
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      html += '<ul>'
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        html += `<li>${inlineMd(lines[i].replace(/^[-*] /, ''))}</li>`
        i++
      }
      html += '</ul>'
      continue
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      html += '<ol>'
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        html += `<li>${inlineMd(lines[i].replace(/^\d+\. /, ''))}</li>`
        i++
      }
      html += '</ol>'
      continue
    }

    // Checkbox list
    if (line.match(/^- \[[ x]\] /)) {
      html += '<ul class="checklist">'
      while (i < lines.length && lines[i].match(/^- \[[ x]\] /)) {
        const checked = lines[i][3] === 'x'
        const text = inlineMd(lines[i].slice(6))
        html += `<li class="${checked ? 'checked' : ''}"><span class="checkbox">${checked ? '✓' : '○'}</span> ${text}</li>`
        i++
      }
      html += '</ul>'
      continue
    }

    // Empty line
    if (line.trim() === '') { html += '<div class="spacer"></div>'; i++; continue }

    // Paragraph
    html += `<p>${inlineMd(line)}</p>`
    i++
  }

  return html
}

// ─── Markdown insertion helper ────────────────────────────────────────────────

interface InsertAction {
  prefix: string
  suffix?: string
  placeholder?: string
  block?: boolean
}

function insertMd(
  ta: HTMLTextAreaElement | null,
  onChange: (v: string) => void,
  action: InsertAction,
) {
  if (!ta) return
  const { selectionStart: s, selectionEnd: e, value } = ta

  let newValue: string
  let newS: number
  let newE: number

  if (action.block) {
    const lineStart = value.lastIndexOf('\n', s - 1) + 1
    newValue = value.slice(0, lineStart) + action.prefix + value.slice(lineStart)
    newS = s + action.prefix.length
    newE = e + action.prefix.length
  } else {
    const suffix = action.suffix ?? action.prefix
    const sel = value.slice(s, e) || action.placeholder || ''
    newValue = value.slice(0, s) + action.prefix + sel + suffix + value.slice(e)
    newS = s + action.prefix.length
    newE = newS + sel.length
  }

  onChange(newValue)
  requestAnimationFrame(() => {
    ta.focus()
    ta.setSelectionRange(newS, newE)
  })
}

// ─── Toolbar definitions ──────────────────────────────────────────────────────

type ToolItem =
  | { type: 'sep' }
  | { icon: React.ComponentType<{ className?: string }>; label: string; action: InsertAction }

const PC_TOOLS: ToolItem[] = [
  { icon: Heading1,      label: '見出し1',      action: { prefix: '# ',    block: true } },
  { icon: Heading2,      label: '見出し2',      action: { prefix: '## ',   block: true } },
  { type: 'sep' },
  { icon: Bold,          label: '太字',         action: { prefix: '**', suffix: '**', placeholder: '太字' } },
  { icon: Italic,        label: '斜体',         action: { prefix: '*',  suffix: '*',  placeholder: '斜体' } },
  { type: 'sep' },
  { icon: Code,          label: 'インラインコード', action: { prefix: '`',  suffix: '`',  placeholder: 'code' } },
  { icon: Code2,         label: 'コードブロック',  action: { prefix: '```\n', suffix: '\n```', placeholder: '' } },
  { type: 'sep' },
  { icon: List,          label: 'リスト',       action: { prefix: '- ',   block: true } },
  { icon: ListOrdered,   label: '番号リスト',    action: { prefix: '1. ',  block: true } },
  { icon: Quote,         label: '引用',         action: { prefix: '> ',   block: true } },
  { icon: Minus,         label: '区切り線',      action: { prefix: '\n---\n', suffix: '' } },
]

const SP_TOOLS: { label: string; action: InsertAction }[] = [
  { label: 'B',    action: { prefix: '**', suffix: '**', placeholder: '太字' } },
  { label: 'I',    action: { prefix: '*',  suffix: '*',  placeholder: '斜体' } },
  { label: 'H2',   action: { prefix: '## ', block: true } },
  { label: 'H3',   action: { prefix: '### ', block: true } },
  { label: '` `',  action: { prefix: '`', suffix: '`', placeholder: 'code' } },
  { label: '```',  action: { prefix: '```\n', suffix: '\n```', placeholder: '' } },
  { label: '•',    action: { prefix: '- ', block: true } },
  { label: '1.',   action: { prefix: '1. ', block: true } },
  { label: '[ ]',  action: { prefix: '- [ ] ', block: true } },
  { label: '>',    action: { prefix: '> ', block: true } },
  { label: '---',  action: { prefix: '\n---\n', suffix: '' } },
]

// ─── View mode types ──────────────────────────────────────────────────────────

type ViewMode = 'edit' | 'split' | 'preview'
type SpMode   = 'edit' | 'preview'

// ─── Component ────────────────────────────────────────────────────────────────

interface MdEditorProps {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function MdEditor({ value, onChange, disabled }: MdEditorProps) {
  const taRef   = useRef<HTMLTextAreaElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [spMode,   setSpMode]   = useState<SpMode>('preview')

  const insert = (action: InsertAction) => insertMd(taRef.current, onChange, action)

  const previewHtml = renderMd(value)

  // ── PC toolbar ──────────────────────────────────────────────────────────────
  const pcToolbar = (
    <div className="hidden md:flex items-center gap-0.5 px-2 py-1 border-b border-border bg-background shrink-0 flex-wrap">
      {PC_TOOLS.map((tool, i) => {
        if ('type' in tool)
          return <span key={i} className="w-px h-4 bg-border mx-1 shrink-0" />
        const { icon: Icon, label, action } = tool
        return (
          <button
            key={i}
            onClick={() => !disabled && insert(action)}
            disabled={disabled}
            title={label}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors shrink-0"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        )
      })}

      <div className="flex-1" />

      {/* ビューモード切替 */}
      {(
        [
          { mode: 'edit'    as ViewMode, icon: PenLine,  title: '編集のみ' },
          { mode: 'split'   as ViewMode, icon: Columns2, title: '分割表示' },
          { mode: 'preview' as ViewMode, icon: Eye,      title: 'プレビューのみ' },
        ] as const
      ).map(({ mode, icon: Icon, title }) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          title={title}
          className={cn(
            'p-1.5 rounded transition-colors',
            viewMode === mode
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  )

  // ── SP header (tab + mini toolbar) ─────────────────────────────────────────
  const spHeader = (
    <div className="flex md:hidden flex-col shrink-0 bg-background border-b border-border">
      {/* タブ (h-12) */}
      <div className="flex h-12">
        {(['edit', 'preview'] as SpMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setSpMode(mode)}
            className={cn(
              'flex-1 text-sm font-medium transition-colors',
              spMode === mode
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground',
            )}
          >
            {mode === 'edit' ? '編集' : 'プレビュー'}
          </button>
        ))}
      </div>

      {/* ミニツールバー（編集モードのみ） */}
      {spMode === 'edit' && (
        <div
          className="flex overflow-x-auto py-1.5 px-2 gap-2 h-12"
          style={{ scrollbarWidth: 'none' }}
        >
          {SP_TOOLS.map((tool, i) => (
            <button
              key={i}
              onClick={() => !disabled && insert(tool.action)}
              disabled={disabled}
              className="shrink-0 h-9 px-3 text-xs font-mono font-medium rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted disabled:opacity-40 transition-colors"
            >
              {tool.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ── Content area ────────────────────────────────────────────────────────────
  const textareaEl = (
    <textarea
      ref={taRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="ここにMarkdownを書く..."
      className="flex-1 w-full min-w-0 bg-background text-foreground resize-none outline-none leading-relaxed caret-primary placeholder:text-muted-foreground/40 p-4 md:p-5
        text-[16px] md:text-sm md:font-mono"
      style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
    />
  )

  const previewEl = (
    <div
      className={cn(
        'flex-1 overflow-y-auto p-4 md:p-6 md-preview',
        'md:border-l md:border-border',
      )}
      dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="empty-hint">プレビューがここに表示されます</p>' }}
    />
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {pcToolbar}
      {spHeader}

      {/* ── PC content ── */}
      <div className="hidden md:flex flex-1 min-h-0">
        {viewMode !== 'preview' && textareaEl}
        {viewMode !== 'edit'    && previewEl}
      </div>

      {/* ── SP content ── */}
      <div className="flex md:hidden flex-1 min-h-0">
        {spMode === 'edit' ? textareaEl : previewEl}
      </div>
    </div>
  )
}
