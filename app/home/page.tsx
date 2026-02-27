import { auth } from '@/lib/auth'
import { listNotes } from '@/lib/github'
import { CATEGORY_LABELS } from '@/lib/constants'
import { HomeDashboard, type CategoryStat, type ActivityItem } from '@/components/home-dashboard'
import type { Note, NoteCategory } from '@/types/note'

const CATEGORIES: NoteCategory[] = ['learning', 'specs', 'snippets', 'logs', 'rules']

function computeCategoryStats(notes: Note[]): CategoryStat[] {
  return CATEGORIES.map((cat) => {
    const catNotes = notes.filter((n) => n.category === cat)
    return {
      id: cat,
      label: CATEGORY_LABELS[cat],
      total: catNotes.length,
      promoted: catNotes.filter((n) => n.status === 'stable').length,
      raw: catNotes.filter((n) => n.status === 'raw').length,
      refining: catNotes.filter((n) => n.status === 'refining').length,
      stable: catNotes.filter((n) => n.status === 'stable').length,
    }
  })
}

function computeDailyData(notes: Note[]): ActivityItem[] {
  const todayStr = new Date().toISOString().slice(0, 10)
  return [0, 3, 6, 9, 12, 15, 18, 21].map((h) => ({
    label: `${h}時`,
    notes: notes.filter((n) => {
      if (!n.createdAt) return false
      const d = new Date(n.createdAt)
      return d.toISOString().slice(0, 10) === todayStr && d.getHours() >= h && d.getHours() < h + 3
    }).length,
    promoted: notes.filter((n) => {
      if (!n.updatedAt) return false
      const d = new Date(n.updatedAt)
      return n.status === 'stable' && d.toISOString().slice(0, 10) === todayStr && d.getHours() >= h && d.getHours() < h + 3
    }).length,
  }))
}

function computeWeeklyData(notes: Note[]): ActivityItem[] {
  const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().slice(0, 10)
    return {
      label: i === 6 ? '今日' : DAY_LABELS[d.getDay()],
      notes: notes.filter((n) => n.createdAt?.slice(0, 10) === dateStr).length,
      promoted: notes.filter((n) => n.status === 'stable' && n.updatedAt?.slice(0, 10) === dateStr).length,
    }
  })
}

function computeMonthlyData(notes: Note[]): ActivityItem[] {
  return Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() - (3 - i) * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)
    return {
      label: i === 3 ? '今週' : `${4 - i}週前`,
      notes: notes.filter((n) => {
        if (!n.createdAt) return false
        const d = new Date(n.createdAt)
        return d >= weekStart && d <= weekEnd
      }).length,
      promoted: notes.filter((n) => {
        if (!n.updatedAt) return false
        const d = new Date(n.updatedAt)
        return n.status === 'stable' && d >= weekStart && d <= weekEnd
      }).length,
    }
  })
}

export default async function HomePage() {
  const session = await auth()
  const token = session?.accessToken
  const notes = await listNotes(undefined, token)

  return (
    <HomeDashboard
      categoryStats={computeCategoryStats(notes)}
      dailyData={computeDailyData(notes)}
      weeklyData={computeWeeklyData(notes)}
      monthlyData={computeMonthlyData(notes)}
    />
  )
}
