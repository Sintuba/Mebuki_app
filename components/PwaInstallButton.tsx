'use client'

import { useEffect, useState } from 'react'
import { Smartphone, Check } from 'lucide-react'

function getGlobalPrompt() {
  return (window as unknown as Record<string, unknown>).__pwaPrompt as
    | { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
    | undefined
}

export function PwaInstallButton() {
  const [isStandalone, setIsStandalone] = useState(false)
  const [promptAvailable, setPromptAvailable] = useState(false)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
      return
    }
    if (getGlobalPrompt()) setPromptAvailable(true)
    const handler = () => setPromptAvailable(true)
    window.addEventListener('pwa-installable', handler)
    return () => window.removeEventListener('pwa-installable', handler)
  }, [])

  if (isStandalone) {
    return (
      <div className="flex items-center justify-between py-2 text-sm">
        <span className="text-muted-foreground">インストール</span>
        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
          <Check className="size-3" />
          インストール済み
        </span>
      </div>
    )
  }

  const handleInstall = async () => {
    const prompt = getGlobalPrompt()
    if (prompt) {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') {
        ;(window as unknown as Record<string, unknown>).__pwaPrompt = undefined
        setPromptAvailable(false)
        setIsStandalone(true)
      }
    } else {
      setShowManual(true)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleInstall}
        className="w-full h-10 text-sm gap-2 inline-flex items-center justify-center rounded-md bg-green-500 text-white hover:bg-green-600 active:bg-green-700 transition-colors font-medium"
      >
        <Smartphone className="size-4" strokeWidth={1.5} />
        ホーム画面にインストール
      </button>
      {showManual && (
        <p className="text-xs text-muted-foreground px-1">
          Chrome メニュー（⋮）→「アプリをインストール」または「ホーム画面に追加」をタップしてください。
          {promptAvailable ? '' : ' 先にホーム画面の既存ショートカットを削除してページを再読み込みすると確実です。'}
        </p>
      )}
    </div>
  )
}
