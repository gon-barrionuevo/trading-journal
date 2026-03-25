import Sidebar from '@/components/Sidebar'
import { LangProvider } from '@/lib/lang-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <div className="layout">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </LangProvider>
  )
}
