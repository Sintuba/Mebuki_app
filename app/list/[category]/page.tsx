import { auth } from '@/lib/auth'
import { cachedListNotes } from '@/lib/notes'
import { notFound } from 'next/navigation'
import { NoteList } from '@/components/note-list'
import type { NoteCategory } from '@/types/note'

const VALID_CATEGORIES = ['learning', 'specs', 'snippets', 'logs', 'rules']

type Params = { params: Promise<{ category: string }> }

export default async function CategoryListPage({ params }: Params) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category)) notFound()

  const session = await auth()
  const token = session?.accessToken ?? ''
  const notes = await cachedListNotes(token, category as NoteCategory)

  return <NoteList initialNotes={notes} category={category} />
}
