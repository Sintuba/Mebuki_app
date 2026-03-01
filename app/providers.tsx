'use client'

import { AiSelectionProvider } from '@/contexts/ai-review-selection'

export function Providers({ children }: { children: React.ReactNode }) {
  return <AiSelectionProvider>{children}</AiSelectionProvider>
}
