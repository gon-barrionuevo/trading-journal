import Sidebar from '@/components/Sidebar'
import { LangProvider } from '@/lib/lang-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </main>
      </div>
    </LangProvider>
  )
}
