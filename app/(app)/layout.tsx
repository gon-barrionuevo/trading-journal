import Sidebar from '@/components/Sidebar'
import { LangProvider } from '@/lib/lang-context'
import { AccountProvider } from '@/lib/account-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <AccountProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            {children}
          </main>
        </div>
      </AccountProvider>
    </LangProvider>
  )
}
