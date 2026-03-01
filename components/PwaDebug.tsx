'use client'

import { useEffect, useState } from 'react'

export function PwaDebug() {
  const [info, setInfo] = useState({
    manifestLink: '確認中...',
    swState: '確認中...',
    promptReady: false,
    isStandalone: false,
  })

  useEffect(() => {
    const manifestEl = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')

    setInfo({
      manifestLink: manifestEl?.href ?? 'なし ❌',
      swState: 'serviceWorker' in navigator ? '対応' : '非対応 ❌',
      promptReady: !!(window as unknown as Record<string, unknown>).__pwaPrompt,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    })

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setInfo((prev) => ({ ...prev, swState: `稼働中 ✓ (${reg.active?.state})` }))
      }).catch(() => {
        setInfo((prev) => ({ ...prev, swState: 'エラー ❌' }))
      })
    }

    const handler = () => setInfo((prev) => ({ ...prev, promptReady: true }))
    window.addEventListener('pwa-installable', handler)
    return () => window.removeEventListener('pwa-installable', handler)
  }, [])

  return (
    <div className="text-[11px] font-mono space-y-1 p-3 bg-muted rounded-md border border-border">
      <p className="text-xs font-semibold text-foreground mb-2">PWA 診断</p>
      <p><span className="text-muted-foreground">manifest: </span>{info.manifestLink}</p>
      <p><span className="text-muted-foreground">SW: </span>{info.swState}</p>
      <p><span className="text-muted-foreground">installPrompt: </span>{info.promptReady ? '取得済み ✓' : '未取得'}</p>
      <p><span className="text-muted-foreground">standalone: </span>{info.isStandalone ? 'はい ✓' : 'いいえ（ブラウザ）'}</p>
    </div>
  )
}
