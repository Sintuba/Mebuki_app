import { auth } from '@/lib/auth'
import { listNotes } from '@/lib/notes'
import { TrashList } from '@/components/trash-list'

export const dynamic = 'force-dynamic'

export default async function TrashPage() {
  const session = await auth()
  const token = session?.accessToken ?? ''
  const notes = await listNotes(undefined, token)
  const trashedNotes = notes.filter((n) => n.status === 'trashed')

  return <TrashList initialNotes={trashedNotes} />
}
