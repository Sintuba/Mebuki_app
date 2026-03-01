'use client'

import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'

function getGlobalPrompt() {
  return (window as unknown as Record<string, unknown>).__pwaPrompt as
    | { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
    | undefined
}

export function PwaInstallButton() {
  const [available, setAvailable] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }
    if (getGlobalPrompt()) {
      setAvailable(true)
      return
    }
    const handler = () => setAvailable(true)
    window.addEventListener('pwa-installable', handler)
    return () => window.removeEventListener('pwa-installable', handler)
  }, [])

  if (installed) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">インストール状態</span>
        <span className="text-xs text-green-600 font-medium">インストール済み</span>
      </div>
    )
  }

  if (!available) return null

  const handleInstall = async () => {
    const prompt = getGlobalPrompt()
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setAvailable(false)
      setInstalled(true)
      ;(window as unknown as Record<string, unknown>).__pwaPrompt = undefined
    }
  }

  return (
    <button
      onClick={handleInstall}
      className="w-full h-10 text-sm gap-2 inline-flex items-center justify-center rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors font-medium"
    >
      <Smartphone className="size-4" strokeWidth={1.5} />
      ホーム画面にインストール
    </button>
  )
}
