'use client'

import { useEffect, useState } from 'react'

export function PwaDebug() {
  const [info, setInfo] = useState({
    manifestLink: '確認中...',
    swRegistered: '確認中...',
    swController: '確認中...',
    promptReady: false,
    isStandalone: false,
  })

  useEffect(() => {
    const manifestEl = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    const w = window as unknown as Record<string, unknown>

    setInfo({
      manifestLink: manifestEl?.href ?? 'なし ❌',
      swRegistered: 'serviceWorker' in navigator ? '確認中...' : '非対応 ❌',
      swController: navigator.serviceWorker?.controller ? '制御中 ✓' : 'なし ❌',
      promptReady: !!w.__pwaPrompt,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    })

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setInfo((prev) => ({
          ...prev,
          swRegistered: `登録済み ✓ (${reg.active?.state})`,
          swController: navigator.serviceWorker.controller ? '制御中 ✓' : 'なし ❌',
        }))
      }).catch(() => {
        setInfo((prev) => ({ ...prev, swRegistered: 'エラー ❌' }))
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
      <p><span className="text-muted-foreground">SW登録: </span>{info.swRegistered}</p>
      <p><span className="text-muted-foreground">SW制御: </span>{info.swController}</p>
      <p><span className="text-muted-foreground">installPrompt: </span>{info.promptReady ? '取得済み ✓' : '未取得 ❌'}</p>
      <p><span className="text-muted-foreground">standalone: </span>{info.isStandalone ? 'はい ✓' : 'いいえ'}</p>
    </div>
  )
}
