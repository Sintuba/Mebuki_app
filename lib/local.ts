/**
 * ローカルファイルシステムバックエンド
 * notes/{category}/{id}.md を直接読み書きする
 *
 * NOTES_DIR 環境変数で保存先を変更可能（デフォルト: {cwd}/notes）
 * Electron パッケージ後は app.getPath('userData') + '/notes' を設定すること
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Note, NoteFrontmatter, NoteCategory } from '@/types/note'

const NOTES_DIR = process.env.NOTES_DIR ?? path.join(process.cwd(), 'notes')

function notePath(category: NoteCategory, id: string) {
  return path.join(NOTES_DIR, category, `${id}.md`)
}

function ensureDir(category: NoteCategory) {
  const dir = path.join(NOTES_DIR, category)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/** ファイルの mtime をそのまま sha 代わりに使う（競合検知用） */
function fileSha(p: string): string {
  try {
    return String(fs.statSync(p).mtimeMs)
  } catch {
    return ''
  }
}

function parseNote(category: NoteCategory, id: string): Note | null {
  const p = notePath(category, id)
  try {
    const raw = fs.readFileSync(p, 'utf-8')
    const { data: fm, content } = matter(raw)
    return {
      ...(fm as NoteFrontmatter),
      id,
      slug: `${category}/${id}`,
      content: content.trim(),
      sha: fileSha(p),
    }
  } catch {
    return null
  }
}

// ── 公開 API（lib/github.ts と同一インターフェース） ──────────────────────────

export async function listNotes(category?: NoteCategory, _token?: string): Promise<Note[]> {
  const categories: NoteCategory[] = category
    ? [category]
    : ['learning', 'specs', 'snippets', 'logs', 'rules']

  const perCategory = categories.map((cat) => {
    const dir = path.join(NOTES_DIR, cat)
    if (!fs.existsSync(dir)) return []
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => parseNote(cat, f.replace('.md', '')))
      .filter((n): n is Note => n !== null)
  })

  return perCategory
    .flat()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export async function getNote(
  category: NoteCategory,
  id: string,
  _token?: string,
): Promise<Note | null> {
  return parseNote(category, id)
}

export async function createNote(
  category: NoteCategory,
  id: string,
  frontmatter: NoteFrontmatter,
  content: string,
  _token?: string,
): Promise<Note> {
  ensureDir(category)
  const p = notePath(category, id)
  const raw = matter.stringify(content, frontmatter as unknown as Record<string, unknown>)
  fs.writeFileSync(p, raw, 'utf-8')
  return { ...frontmatter, id, slug: `${category}/${id}`, content, sha: fileSha(p) }
}

export async function updateNote(
  category: NoteCategory,
  id: string,
  frontmatter: NoteFrontmatter,
  content: string,
  _sha: string,
  _token?: string,
): Promise<Note> {
  ensureDir(category)
  const p = notePath(category, id)
  const raw = matter.stringify(content, frontmatter as unknown as Record<string, unknown>)
  fs.writeFileSync(p, raw, 'utf-8')
  return { ...frontmatter, id, slug: `${category}/${id}`, content, sha: fileSha(p) }
}

export async function deleteNote(
  category: NoteCategory,
  id: string,
  _sha: string,
  _token?: string,
): Promise<void> {
  const p = notePath(category, id)
  if (fs.existsSync(p)) fs.unlinkSync(p)
}

/** ローカルは高速なのでキャッシュ不要。インターフェース互換のため残す */
export function cachedListNotes(_token: string, category?: NoteCategory) {
  return listNotes(category)
}
