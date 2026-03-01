import { auth } from '@/lib/auth'
import { cachedListNotes } from '@/lib/notes'
import { CATEGORY_LABELS } from '@/lib/constants'
import { HomeDashboard, type CategoryStat, type ActivityItem, type ThoughtStats, type InsightData } from '@/components/home-dashboard'
import type { Note, NoteCategory } from '@/types/note'

const CATEGORIES: NoteCategory[] = ['learning', 'specs', 'snippets', 'logs', 'rules']

function computeCategoryStats(notes: Note[]): CategoryStat[] {
  return CATEGORIES.map((cat) => {
    const catNotes = notes.filter((n) => n.category === cat && n.status !== 'trashed')
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
  const active = notes.filter((n) => n.status !== 'trashed')
  const todayStr = new Date().toISOString().slice(0, 10)
  return [0, 3, 6, 9, 12, 15, 18, 21].map((h) => ({
    label: `${h}時`,
    notes: active.filter((n) => {
      if (!n.createdAt) return false
      const d = new Date(n.createdAt)
      return d.toISOString().slice(0, 10) === todayStr && d.getHours() >= h && d.getHours() < h + 3
    }).length,
    promoted: active.filter((n) => {
      if (!n.updatedAt) return false
      const d = new Date(n.updatedAt)
      return n.status === 'stable' && d.toISOString().slice(0, 10) === todayStr && d.getHours() >= h && d.getHours() < h + 3
    }).length,
  }))
}

function computeWeeklyData(notes: Note[]): ActivityItem[] {
  const active = notes.filter((n) => n.status !== 'trashed')
  const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().slice(0, 10)
    return {
      label: i === 6 ? '今日' : DAY_LABELS[d.getDay()],
      notes: active.filter((n) => n.createdAt?.slice(0, 10) === dateStr).length,
      promoted: active.filter((n) => n.status === 'stable' && n.updatedAt?.slice(0, 10) === dateStr).length,
    }
  })
}

function computeMonthlyData(notes: Note[]): ActivityItem[] {
  const active = notes.filter((n) => n.status !== 'trashed')
  return Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() - (3 - i) * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)
    return {
      label: i === 3 ? '今週' : `${4 - i}週前`,
      notes: active.filter((n) => {
        if (!n.createdAt) return false
        const d = new Date(n.createdAt)
        return d >= weekStart && d <= weekEnd
      }).length,
      promoted: active.filter((n) => {
        if (!n.updatedAt) return false
        const d = new Date(n.updatedAt)
        return n.status === 'stable' && d >= weekStart && d <= weekEnd
      }).length,
    }
  })
}

function computeThoughtStats(notes: Note[]): ThoughtStats {
  const stableNotes = notes.filter((n) => n.status === 'stable')
  const trashedNotes = notes.filter((n) => n.status === 'trashed')

  // 平均熟成日数: stable ノートの createdAt → updatedAt の平均日数
  const avgMaturationDays =
    stableNotes.length > 0
      ? Math.round(
          stableNotes.reduce((sum, n) => {
            const days =
              (new Date(n.updatedAt).getTime() - new Date(n.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
            return sum + Math.max(0, days)
          }, 0) / stableNotes.length
        )
      : null

  // 廃棄率: 宿根 / 全ノート
  const abandonRate =
    notes.length > 0 ? Math.round((trashedNotes.length / notes.length) * 100) : 0

  // 時間帯分布: 全ノートの createdAt を 4 スロットに分類
  const slots = [
    { label: '深夜', sublabel: '0-6時', start: 0, end: 6 },
    { label: '朝', sublabel: '6-12時', start: 6, end: 12 },
    { label: '昼', sublabel: '12-18時', start: 12, end: 18 },
    { label: '夜', sublabel: '18-24時', start: 18, end: 24 },
  ]
  const timeDistribution = slots.map((slot) => ({
    label: slot.label,
    sublabel: slot.sublabel,
    count: notes.filter((n) => {
      if (!n.createdAt) return false
      const h = new Date(n.createdAt).getHours()
      return h >= slot.start && h < slot.end
    }).length,
  }))

  const peak = timeDistribution.reduce(
    (best, t) => (t.count > best.count ? t : best),
    timeDistribution[0]
  )

  return { avgMaturationDays, abandonRate, peakTimeLabel: peak.label, timeDistribution }
}

function computeInsightData(notes: Note[]): InsightData {
  const now = Date.now()
  const DAY = 1000 * 60 * 60 * 24

  // 停滞ノート: refining のまま 14日以上更新なし
  const stagnantNotes = notes
    .filter((n) => n.status === 'refining')
    .map((n) => ({
      id: n.id,
      title: n.title,
      category: n.category as NoteCategory,
      daysSince: Math.floor((now - new Date(n.updatedAt).getTime()) / DAY),
    }))
    .filter((n) => n.daysSince >= 14)
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 5)

  // 宿根候補: raw/refining で 7日以上触れていない
  const perennialCandidates = notes
    .filter((n) => n.status === 'raw' || n.status === 'refining')
    .map((n) => ({
      id: n.id,
      title: n.title,
      category: n.category as NoteCategory,
      daysSince: Math.floor((now - new Date(n.updatedAt).getTime()) / DAY),
    }))
    .filter((n) => n.daysSince >= 7)
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 5)

  // 最終メモ作成からの経過日数
  const sorted = notes
    .filter((n) => n.status !== 'trashed' && n.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const daysSinceLastNote =
    sorted.length > 0
      ? Math.floor((now - new Date(sorted[0].createdAt).getTime()) / DAY)
      : -1

  // カテゴリ別昇華率 → 最強・最弱カテゴリ
  const catRates = CATEGORIES.map((cat) => {
    const catNotes = notes.filter((n) => n.category === cat && n.status !== 'trashed')
    const rate = catNotes.length > 0 ? catNotes.filter((n) => n.status === 'stable').length / catNotes.length : -1
    return { cat, rate, total: catNotes.length }
  }).filter((c) => c.total > 0 && c.rate >= 0)

  const topCategory =
    catRates.length > 0
      ? catRates.reduce((best, c) => (c.rate > best.rate ? c : best)).cat
      : null
  const weakCategory =
    catRates.length >= 2
      ? catRates.reduce((worst, c) => (c.rate < worst.rate ? c : worst)).cat
      : null

  return { stagnantNotes, perennialCandidates, daysSinceLastNote, topCategory, weakCategory }
}

export default async function HomePage() {
  const session = await auth()
  const token = session?.accessToken ?? ''
  const notes = await cachedListNotes(token)

  const trashCount = notes.filter((n) => n.status === 'trashed').length

  return (
    <HomeDashboard
      categoryStats={computeCategoryStats(notes)}
      dailyData={computeDailyData(notes)}
      weeklyData={computeWeeklyData(notes)}
      monthlyData={computeMonthlyData(notes)}
      thoughtStats={computeThoughtStats(notes)}
      insightData={computeInsightData(notes)}
      trashCount={trashCount}
    />
  )
}
