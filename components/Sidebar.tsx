'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useT } from '@/lib/lang-context'
import type { User } from '@supabase/supabase-js'
import SidebarContent from './SidebarContent'

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname                 = usePathname()
  const router                   = useRouter()
  const supabase                 = createClient()
  const { t, locale, setLocale } = useT()
  const [user, setUser]          = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Trader'
  const initials    = displayName.charAt(0).toUpperCase()

  const sharedProps = { pathname, user, displayName, initials, locale, setLocale, handleLogout, t }

  return (
    <>
      {/* Desktop: sidebar sticky, oculto en mobile */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0">
        <SidebarContent {...sharedProps} />
      </div>

      {/* Mobile: botón hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden fixed top-3.5 left-3.5 z-[90] flex items-center justify-center bg-surface border border-border2 rounded-xs w-9 h-9 cursor-pointer text-text text-base"
      >
        ☰
      </button>

      {/* Mobile: backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[95]"
        />
      )}

      {/* Mobile: drawer */}
      <div
        className="md:hidden fixed top-0 left-0 bottom-0 w-[260px] z-[100] transition-transform duration-[250ms] ease-out"
        style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <SidebarContent {...sharedProps} onClose={() => setMobileOpen(false)} />
      </div>
    </>
  )
}
