import MainHeader from '@/components/MainHeader'
import MobileHeader from '@/components/MobileHeader'
import CategorySidebar from '@/components/CategorySidebar'
import MobileFooter from '@/components/MobileFooter'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-svh bg-background">
      <MainHeader />
      <MobileHeader />
      <main className="flex-1 flex flex-col md:pb-0 min-h-0" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          <CategorySidebar />
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </div>
      </main>
      <MobileFooter />
    </div>
  )
}
