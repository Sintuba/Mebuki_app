'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { STATUS_LABELS, CATEGORY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { NoteCategory } from '@/types/note'

export interface CategoryStat {
  id: string
  label: string
  total: number
  promoted: number
  raw: number
  refining: number
  stable: number
}

export interface ActivityItem {
  label: string
  notes: number
  promoted: number
}

export interface ThoughtStats {
  avgMaturationDays: number | null
  abandonRate: number
  peakTimeLabel: string
  timeDistribution: { label: string; sublabel: string; count: number }[]
}

export interface InsightData {
  stagnantNotes: { id: string; title: string; category: NoteCategory; daysSince: number }[]
  perennialCandidates: { id: string; title: string; category: NoteCategory; daysSince: number }[]
  daysSinceLastNote: number
  topCategory: NoteCategory | null
  weakCategory: NoteCategory | null
}

interface HomeDashboardProps {
  categoryStats: CategoryStat[]
  dailyData: ActivityItem[]
  weeklyData: ActivityItem[]
  monthlyData: ActivityItem[]
  thoughtStats: ThoughtStats
  insightData: InsightData
  trashCount: number
}

type Period = 'day' | 'week' | 'month'

type Tab = 'overview' | 'analysis' | 'ai'

interface AiInsight {
  tendency: string
  strength: string
  focus: string
  challenge: string
  advice: string
}

export function HomeDashboard({
  categoryStats,
  dailyData,
  weeklyData,
  monthlyData,
  thoughtStats,
  insightData,
  trashCount,
}: HomeDashboardProps) {
  const [period, setPeriod] = useState<Period>('week')
  const [tab, setTab] = useState<Tab>('overview')
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [loadingPhase, setLoadingPhase] = useState(0)
  const aiFetchedRef = useRef(false)

  const LOADING_PHASES = ['データ収集', '統計分析', 'インサイト生成'] as const

  useEffect(() => {
    if (!aiLoading) { setLoadingPhase(0); return }
    const interval = setInterval(() => {
      setLoadingPhase((p) => Math.min(p + 1, LOADING_PHASES.length - 1))
    }, 1800)
    return () => clearInterval(interval)
  }, [aiLoading])

  const periodMap = {
    day: { data: dailyData, title: '1日のアクティビティ' },
    week: { data: weeklyData, title: '週間アクティビティ' },
    month: { data: monthlyData, title: '月間アクティビティ' },
  }

  const activityData = periodMap[period].data
  const activityTitle = periodMap[period].title

  const barData = categoryStats.map((c) => ({
    name: c.label,
    total: c.total,
    promoted: c.promoted,
  }))

  const pieData = [
    { name: STATUS_LABELS.raw, value: categoryStats.reduce((a, c) => a + c.raw, 0), color: '#9ca3af' },
    { name: STATUS_LABELS.refining, value: categoryStats.reduce((a, c) => a + c.refining, 0), color: '#f59e0b' },
    { name: STATUS_LABELS.stable, value: categoryStats.reduce((a, c) => a + c.stable, 0), color: '#22c55e' },
  ]

  const totalNotes = categoryStats.reduce((a, c) => a + c.total, 0)
  const totalPromoted = categoryStats.reduce((a, c) => a + c.promoted, 0)
  const promotionRate = totalNotes > 0 ? Math.round((totalPromoted / totalNotes) * 100) : 0

  const timeMax = Math.max(...thoughtStats.timeDistribution.map((t) => t.count), 1)

  const handleTabChange = async (t: Tab) => {
    setTab(t)
    if (t === 'ai' && !aiFetchedRef.current) {
      aiFetchedRef.current = true
      setAiLoading(true)
      setAiError('')
      try {
        const categoryRates = categoryStats
          .filter((c) => c.total > 0)
          .map((c) => ({
            category: c.id as import('@/types/note').NoteCategory,
            rate: Math.round((c.promoted / c.total) * 100),
            total: c.total,
          }))
        const res = await fetch('/api/ai/insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalNotes,
            promotionRate,
            avgMaturationDays: thoughtStats.avgMaturationDays,
            abandonRate: thoughtStats.abandonRate,
            peakTimeLabel: thoughtStats.peakTimeLabel,
            stagnantNoteCount: insightData.stagnantNotes.length,
            perennialCandidateCount: insightData.perennialCandidates.length,
            topCategory: insightData.topCategory,
            weakCategory: insightData.weakCategory,
            categoryRates,
            stagnantNoteTitles: insightData.stagnantNotes.map((n) => n.title),
            perennialCandidateTitles: insightData.perennialCandidates.map((n) => n.title),
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'エラーが発生しました')
        }
        const data = await res.json()
        setAiInsight(data)
      } catch (e) {
        setAiError(e instanceof Error ? e.message : 'エラーが発生しました')
        aiFetchedRef.current = false
      } finally {
        setAiLoading(false)
      }
    }
  }

  return (
    <ScrollArea className="flex-1">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
        {/* タブ */}
        <div className="flex items-center gap-0 mb-6 border-b border-border">
          {(['overview', 'analysis'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={cn(
                'px-4 py-2.5 text-sm border-b-2 transition-colors',
                tab === t
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'overview' ? '概要' : '分析'}
            </button>
          ))}
          <button
            onClick={() => handleTabChange('ai')}
            className={cn(
              'ml-auto mb-1.5 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
              tab === 'ai'
                ? 'bg-linear-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-indigo-200/60'
                : 'border border-border text-muted-foreground hover:border-violet-400 hover:text-violet-600 hover:shadow-sm hover:shadow-violet-100'
            )}
          >
            <Sparkles className={cn('size-3.5 transition-all', tab === 'ai' && 'animate-pulse')} />
            AIインサイト
          </button>
        </div>

        {/* ── 分析タブ ── */}
        {tab === 'analysis' && (
          <div className="space-y-4">
            {/* サマリー行 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">最後のメモから</p>
                  <p className="text-2xl font-bold text-foreground">
                    {insightData.daysSinceLastNote < 0
                      ? '—'
                      : insightData.daysSinceLastNote === 0
                      ? '今日'
                      : `${insightData.daysSinceLastNote}日`}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">最も育つ分野</p>
                  <p className="text-base font-bold text-green-600 leading-tight mt-1">
                    {insightData.topCategory
                      ? CATEGORY_LABELS[insightData.topCategory]
                      : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">伸びしろのある分野</p>
                  <p className="text-base font-bold text-amber-500 leading-tight mt-1">
                    {insightData.weakCategory
                      ? CATEGORY_LABELS[insightData.weakCategory]
                      : '—'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* カテゴリ別昇華率ランキング */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">カテゴリ別昇華率</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                {[...categoryStats]
                  .filter((c) => c.total > 0)
                  .sort((a, b) => {
                    const ra = a.total > 0 ? a.promoted / a.total : 0
                    const rb = b.total > 0 ? b.promoted / b.total : 0
                    return rb - ra
                  })
                  .map((cat, i) => {
                    const rate = cat.total > 0 ? Math.round((cat.promoted / cat.total) * 100) : 0
                    return (
                      <Link key={cat.id} href={`/list/${cat.id}`} className="block group">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground/50 w-4 shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium group-hover:text-primary transition-colors">
                                {cat.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {cat.promoted}/{cat.total}件
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  rate >= 50 ? 'bg-green-500' : rate >= 25 ? 'bg-amber-400' : 'bg-muted-foreground/30'
                                )}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                          <span className={cn(
                            'text-xs font-bold w-10 text-right shrink-0',
                            rate >= 50 ? 'text-green-600' : rate >= 25 ? 'text-amber-500' : 'text-muted-foreground'
                          )}>
                            {rate}%
                          </span>
                        </div>
                      </Link>
                    )
                  })}
              </CardContent>
            </Card>

            {/* 停滞ノート */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">停滞ノート</CardTitle>
                  <span className="text-[11px] text-muted-foreground">整理中のまま14日以上</span>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                {insightData.stagnantNotes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">停滞ノートはありません</p>
                ) : (
                  <div className="space-y-1">
                    {insightData.stagnantNotes.map((n) => (
                      <Link
                        key={n.id}
                        href={`/edit/${n.category}/${n.id}?from=/home`}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {n.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {CATEGORY_LABELS[n.category]} · {n.daysSince}日間更新なし
                          </p>
                        </div>
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0',
                          n.daysSince >= 30
                            ? 'text-red-600 bg-red-50 border-red-200'
                            : 'text-amber-600 bg-amber-50 border-amber-200'
                        )}>
                          {n.daysSince}日
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 宿根候補 */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">宿根候補</CardTitle>
                  <span className="text-[11px] text-muted-foreground">7日以上触れていないメモ</span>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                {insightData.perennialCandidates.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">宿根候補はありません</p>
                ) : (
                  <div className="space-y-1">
                    {insightData.perennialCandidates.map((n) => (
                      <Link
                        key={n.id}
                        href={`/edit/${n.category}/${n.id}?from=/home`}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {n.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {CATEGORY_LABELS[n.category]} · {n.daysSince}日間放置
                          </p>
                        </div>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border text-gray-500 bg-gray-50 border-gray-200 shrink-0">
                          {n.daysSince}日
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── AIインサイトタブ ── */}
        {tab === 'ai' && (
          <div className="space-y-4">
            {aiLoading && (
              <div className="py-16 px-2 space-y-8">
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="size-6 text-violet-400 animate-pulse" />
                  <p className="text-sm font-medium text-foreground">{LOADING_PHASES[loadingPhase]}中...</p>
                </div>
                <div className="space-y-3">
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-violet-400 via-indigo-400 to-blue-400 transition-all duration-700"
                      style={{ width: `${((loadingPhase + 1) / LOADING_PHASES.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between">
                    {LOADING_PHASES.map((phase, i) => (
                      <span
                        key={phase}
                        className={cn(
                          'text-[10px] transition-colors duration-500',
                          i <= loadingPhase ? 'text-violet-500 font-medium' : 'text-muted-foreground/30'
                        )}
                      >
                        {phase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {aiError && !aiLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-sm text-destructive">{aiError}</p>
                <button
                  onClick={() => { aiFetchedRef.current = false; handleTabChange('ai') }}
                  className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  再試行
                </button>
              </div>
            )}

            {aiInsight && !aiLoading && (
              <>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">傾向分析</p>
                    <p className="text-sm text-foreground leading-relaxed">{aiInsight.tendency}</p>
                  </CardContent>
                </Card>
                <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-950/10">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-medium text-green-600 mb-2 uppercase tracking-wide">あなたの強み</p>
                    <p className="text-sm text-foreground leading-relaxed">{aiInsight.strength}</p>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card className="border-primary/30">
                    <CardContent className="p-4">
                      <p className="text-[10px] font-medium text-primary mb-2 uppercase tracking-wide">思考のヒント</p>
                      <p className="text-sm text-foreground leading-relaxed">{aiInsight.focus}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-violet-400/30 bg-violet-50/20">
                    <CardContent className="p-4">
                      <p className="text-[10px] font-medium text-violet-500 mb-2 uppercase tracking-wide">アイデアのつながり</p>
                      <p className="text-sm text-foreground leading-relaxed">{aiInsight.challenge}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">メモの育て方の特徴</p>
                    <p className="text-sm text-foreground leading-relaxed">{aiInsight.advice}</p>
                  </CardContent>
                </Card>
                <button
                  onClick={() => { aiFetchedRef.current = false; setAiInsight(null); handleTabChange('ai') }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                >
                  再生成
                </button>
              </>
            )}
          </div>
        )}

        {/* ── 概要タブ ── */}
        {tab === 'overview' && <>

        {/* KPI カード: 5枚 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">全メモ数</p>
              <p className="text-2xl font-bold text-foreground">{totalNotes}</p>
            </CardContent>
          </Card>
          <Link href="/list/archive">
            <Card className="h-full transition-colors hover:border-green-400/50 cursor-pointer">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">昇華済み</p>
                <p className="text-2xl font-bold text-green-600">{totalPromoted}</p>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">昇華率</p>
              <p className="text-2xl font-bold text-foreground">{promotionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">平均熟成日数</p>
              <p className="text-2xl font-bold text-foreground">
                {thoughtStats.avgMaturationDays !== null ? `${thoughtStats.avgMaturationDays}日` : '—'}
              </p>
            </CardContent>
          </Card>
          <Link href="/list/trash">
            <Card className="h-full transition-colors hover:border-orange-300/50 cursor-pointer">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">廃棄率 / 宿根</p>
                <p className="text-2xl font-bold text-orange-500">
                  {thoughtStats.abandonRate}%
                  <span className="text-sm font-normal text-muted-foreground ml-1">({trashCount})</span>
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 思考パターン: 時間帯分布 */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground">思考の時間帯パターン</CardTitle>
              <span className="text-[11px] text-muted-foreground">
                ピーク: <span className="font-medium text-foreground">{thoughtStats.peakTimeLabel}</span>
              </span>
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="grid grid-cols-4 gap-3">
              {thoughtStats.timeDistribution.map((slot) => {
                const pct = Math.round((slot.count / timeMax) * 100)
                const isPeak = slot.label === thoughtStats.peakTimeLabel
                return (
                  <div key={slot.label} className="flex flex-col items-center gap-1.5">
                    <div className="w-full flex flex-col items-center gap-1">
                      <span className={cn('text-xs font-medium', isPeak ? 'text-primary' : 'text-foreground')}>
                        {slot.count}件
                      </span>
                      <div className="w-full h-16 bg-secondary rounded-md overflow-hidden flex items-end">
                        <div
                          className={cn(
                            'w-full rounded-md transition-all',
                            isPeak ? 'bg-primary' : 'bg-primary/30'
                          )}
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={cn('text-xs font-medium', isPeak ? 'text-primary' : 'text-muted-foreground')}>
                        {slot.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">{slot.sublabel}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* カテゴリ別進捗カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {categoryStats.map((cat) => {
            const pct = cat.total > 0 ? Math.round((cat.promoted / cat.total) * 100) : 0
            return (
              <Link key={cat.id} href={`/list/${cat.id}`} className="block group">
                <Card className="transition-colors group-hover:border-foreground/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-foreground">{cat.label}</p>
                      <span className="text-xs text-muted-foreground">{cat.total}件</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-primary">{pct}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">{STATUS_LABELS.raw} {cat.raw}</span>
                      <span className="text-muted-foreground">{STATUS_LABELS.refining} {cat.refining}</span>
                      <span className="text-green-600 font-medium">{STATUS_LABELS.stable} {cat.stable}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* チャート */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* バーチャート: カテゴリ概要 */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">カテゴリ概要</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }} barCategoryGap="25%">
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                    <Bar dataKey="total" fill="#94a3b8" radius={[3, 3, 0, 0]} name="全件" />
                    <Bar dataKey="promoted" fill="#22c55e" radius={[3, 3, 0, 0]} name="昇華済み" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-[#94a3b8]" />
                  全件
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-[#22c55e]" />
                  昇華済み
                </div>
              </div>
            </CardContent>
          </Card>

          {/* パイチャート: ステータス分布 */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">ステータス分布</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-5 mt-1">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} {d.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ラインチャート: アクティビティ (フル幅) */}
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">{activityTitle}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                    <Line type="monotone" dataKey="notes" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} name="追加メモ" />
                    <Line type="monotone" dataKey="promoted" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} name="昇華数" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-[#6366f1]" />
                  追加メモ
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-[#22c55e]" />
                  昇華数
                </div>
              </div>

              {/* 期間切り替え */}
              <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-border">
                {(['day', 'week', 'month'] as const).map((key) => {
                  const label = { day: '1日', week: '週間', month: '月間' }[key]
                  return (
                    <button
                      key={key}
                      onClick={() => setPeriod(key)}
                      className={cn(
                        'px-4 py-1.5 text-xs rounded-md transition-colors',
                        period === key
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        </> /* 概要タブ終わり */}
      </div>
    </ScrollArea>
  )
}
