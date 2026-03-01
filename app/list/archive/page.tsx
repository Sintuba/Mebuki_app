import { auth } from '@/lib/auth'
import { cachedListNotes } from '@/lib/notes'
import { ArchiveList } from '@/components/archive-list'

export default async function ArchivePage() {
  const session = await auth()
  const token = session?.accessToken ?? ''
  const notes = await cachedListNotes(token)
  const archiveNotes = notes.filter((n) => n.status === 'stable')

  return <ArchiveList initialNotes={archiveNotes} />
}
