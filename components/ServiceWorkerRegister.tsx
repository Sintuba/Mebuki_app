'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registration failed:', err))
    }

    // beforeinstallprompt をグローバルに保持（React mount タイミングに依存しない）
    const handler = (e: Event) => {
      e.preventDefault()
      ;(window as unknown as Record<string, unknown>).__pwaPrompt = e
      window.dispatchEvent(new CustomEvent('pwa-installable'))
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  return null
}
