'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

function getGlobalPrompt() {
  return (window as unknown as Record<string, unknown>).__pwaPrompt as
    | { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
    | undefined
}

export function PwaInstallBanner() {
  const [available, setAvailable] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // すでにキャプチャ済みの場合
    if (getGlobalPrompt()) {
      setAvailable(true)
      return
    }
    // これから発火する場合
    const handler = () => setAvailable(true)
    window.addEventListener('pwa-installable', handler)
    return () => window.removeEventListener('pwa-installable', handler)
  }, [])

  if (!available || dismissed) return null

  const handleInstall = async () => {
    const prompt = getGlobalPrompt()
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setAvailable(false)
      ;(window as unknown as Record<string, unknown>).__pwaPrompt = undefined
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-3 bg-green-500 text-white shadow-lg md:hidden">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Download className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium truncate">MEBUKIをホーム画面に追加</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="text-sm font-bold bg-white text-green-600 px-3 py-1 rounded-md"
        >
          追加
        </button>
        <button onClick={() => setDismissed(true)} aria-label="閉じる">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
