'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Chrome only fires beforeinstallprompt when SW controls the page
    // from the start of navigation. On first install, SW activates mid-page
    // and Chrome misses the window. Reload once after SW first claims control.
    if (!navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      }, { once: true })
    }

    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err))
  }, [])

  return null
}
