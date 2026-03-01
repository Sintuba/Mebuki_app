import MainHeader from '@/components/MainHeader'

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-svh bg-background overflow-hidden">
      {/* PC only: show main header; SP: fullscreen, no header chrome */}
      <div className="hidden md:block shrink-0">
        <MainHeader />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  )
}
