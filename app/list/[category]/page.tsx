import { auth } from '@/lib/auth'
import { listNotes } from '@/lib/github'
import { notFound } from 'next/navigation'
import { NoteList } from '@/components/note-list'
import type { NoteCategory } from '@/types/note'

const VALID_CATEGORIES = ['learning', 'specs', 'snippets', 'logs', 'rules']

type Params = { params: Promise<{ category: string }> }

export default async function CategoryListPage({ params }: Params) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category)) notFound()

  const session = await auth()
  const notes = await listNotes(category as NoteCategory, session?.accessToken)

  return <NoteList initialNotes={notes} category={category} />
}
