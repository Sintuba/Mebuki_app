import { auth, signOut } from '@/lib/auth'
import { Github, LogOut, User, Bell, Shield, HardDrive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PwaInstallButton } from '@/components/PwaInstallButton'

export default async function SettingsPage() {
  const session = await auth()
  const userName = session?.user?.name ?? '—'
  const userEmail = session?.user?.email ?? '—'
  const repo = `${process.env.GITHUB_OWNER ?? '?'}/${process.env.GITHUB_REPO ?? '?'}`

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">設定</h2>
        </div>

        {/* アカウント */}
        <Card className="bg-card border-border mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <User className="size-4 text-muted-foreground" strokeWidth={1.5} />
              アカウント
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-muted flex items-center justify-center">
                  <Github className="size-4 text-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </div>
              <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-md bg-muted">
                GitHub
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 通知 */}
        <Card className="bg-card border-border mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" strokeWidth={1.5} />
              通知
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'AI レビュー完了通知', desc: 'AIレビューが完了したら通知する' },
              { label: '昇華タイムリー', desc: '昇華候補が溜まったらリマインド' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-primary relative cursor-not-allowed opacity-50">
                  <span className="absolute right-0.5 top-0.5 size-4 rounded-full bg-primary-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ストレージ */}
        <Card className="bg-card border-border mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <HardDrive className="size-4 text-muted-foreground" strokeWidth={1.5} />
              ストレージ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GitHub リポジトリ</span>
              <span className="text-foreground font-mono text-xs">{repo}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ブランチ</span>
              <span className="text-foreground font-mono text-xs">
                {process.env.GITHUB_BRANCH ?? 'main'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* プライバシー */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" strokeWidth={1.5} />
              プライバシー
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">
              データはすべてあなたの GitHub リポジトリに保存されます。
            </p>
          </CardContent>
        </Card>

        <PwaInstallButton />

        <Separator className="my-4" />

        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            className="w-full h-10 text-sm gap-2 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="size-4" strokeWidth={1.5} />
            ログアウト
          </button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          MEBUKI v0.1.0
        </p>
      </div>
    </div>
  )
}
