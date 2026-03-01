'use client'

import { createContext, useContext, useState } from 'react'
import type { Note } from '@/types/note'

interface AiSelectionContextValue {
  selectedNotes: Note[]
  isSelected: (id: string, category: string) => boolean
  toggle: (note: Note) => void
  remove: (id: string, category: string) => void
  clear: () => void
}

const AiSelectionContext = createContext<AiSelectionContextValue>({
  selectedNotes: [],
  isSelected: () => false,
  toggle: () => {},
  remove: () => {},
  clear: () => {},
})

export function AiSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([])

  const isSelected = (id: string, category: string) =>
    selectedNotes.some((n) => n.id === id && n.category === category)

  const toggle = (note: Note) => {
    setSelectedNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id && n.category === note.category)
      return exists
        ? prev.filter((n) => !(n.id === note.id && n.category === note.category))
        : [...prev, note]
    })
  }

  const remove = (id: string, category: string) => {
    setSelectedNotes((prev) =>
      prev.filter((n) => !(n.id === id && n.category === category))
    )
  }

  const clear = () => setSelectedNotes([])

  return (
    <AiSelectionContext.Provider value={{ selectedNotes, isSelected, toggle, remove, clear }}>
      {children}
    </AiSelectionContext.Provider>
  )
}

export function useAiSelection() {
  return useContext(AiSelectionContext)
}
