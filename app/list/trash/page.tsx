import { auth } from '@/lib/auth'
import { cachedListNotes } from '@/lib/notes'
import { TrashList } from '@/components/trash-list'

export default async function TrashPage() {
  const session = await auth()
  const token = session?.accessToken ?? ''
  const notes = await cachedListNotes(token)
  const trashedNotes = notes.filter((n) => n.status === 'trashed')

  return <TrashList initialNotes={trashedNotes} />
}
