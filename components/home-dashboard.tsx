'use client'

import { useState } from 'react'
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
import { STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

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

interface HomeDashboardProps {
  categoryStats: CategoryStat[]
  dailyData: ActivityItem[]
  weeklyData: ActivityItem[]
  monthlyData: ActivityItem[]
}

type Period = 'day' | 'week' | 'month'

export function HomeDashboard({
  categoryStats,
  dailyData,
  weeklyData,
  monthlyData,
}: HomeDashboardProps) {
  const [period, setPeriod] = useState<Period>('week')

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

  return (
    <ScrollArea className="flex-1">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">ダッシュボード</h2>
        </div>

        {/* KPI カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">全メモ数</p>
              <p className="text-2xl font-bold text-foreground">{totalNotes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">昇華済み</p>
              <p className="text-2xl font-bold text-primary">{totalPromoted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">昇華率</p>
              <p className="text-2xl font-bold text-foreground">{promotionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">カテゴリ数</p>
              <p className="text-2xl font-bold text-foreground">{categoryStats.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* カテゴリ別進捗カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {categoryStats.map((cat) => {
            const pct = cat.total > 0 ? Math.round((cat.promoted / cat.total) * 100) : 0
            return (
              <Card key={cat.id}>
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
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{STATUS_LABELS.raw} {cat.raw}</span>
                    <span>{STATUS_LABELS.refining} {cat.refining}</span>
                    <span>{STATUS_LABELS.stable} {cat.stable}</span>
                  </div>
                </CardContent>
              </Card>
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
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                    <Bar dataKey="total" fill="#94a3b8" radius={[3, 3, 0, 0]} name="全件" />
                    <Bar dataKey="promoted" fill="#6366f1" radius={[3, 3, 0, 0]} name="昇華済み" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-[#94a3b8]" />
                  全件
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-[#6366f1]" />
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
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
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
      </div>
    </ScrollArea>
  )
}
