'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useT } from '@/lib/lang-context'
import type { User } from '@supabase/supabase-js'

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { t, locale, setLocale } = useT()
  const [user, setUser]         = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Cerrar drawer al navegar
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Bloquear scroll del body cuando el drawer está abierto
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

  const navItems = [
    { href: '/',           label: t('nav_dashboard'), icon: '📊' },
    { href: '/journal',    label: t('nav_journal'),   icon: '🕯️' },
    { href: '/stats',      label: t('nav_stats'),     icon: '📈' },
    { href: '/mindset',    label: t('nav_mindset'),   icon: '🧠' },
    { href: '/estrategia', label: t('nav_strategy'),  icon: '📌' },
  ]

  const configItems = [
    { href: '/settings', label: t('nav_settings'), icon: '⚙️' },
  ]

  const navLinkStyle = (href: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 10px', borderRadius: 'var(--radius-xs)',
    color: pathname === href ? 'var(--accent2)' : 'var(--muted)',
    fontSize: 13, cursor: 'pointer', marginBottom: 2,
    border: pathname === href ? '1px solid rgba(124,106,255,0.2)' : '1px solid transparent',
    background: pathname === href ? 'rgba(124,106,255,0.12)' : 'transparent',
    transition: 'all 0.15s', textDecoration: 'none',
  })

  const sidebarContent = (
    <aside style={{
      width: 220, minWidth: 220,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, background: 'var(--accent)',
          borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff',
          flexShrink: 0,
        }}>Tf</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Tradefolio</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Trading Journal</div>
        </div>
        {/* Close button — solo mobile */}
        <button
          className="sidebar-close-btn"
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'none',
            background: 'none', border: 'none',
            color: 'var(--muted)', fontSize: 22,
            cursor: 'pointer', lineHeight: 1, padding: 4,
          }}
        >
          ×
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px', marginBottom: 6, fontWeight: 500 }}>
            {t('nav_main')}
          </div>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={navLinkStyle(item.href)}>
              <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px', marginBottom: 6, fontWeight: 500 }}>
            {t('nav_config')}
          </div>
          {configItems.map(item => (
            <Link key={item.href} href={item.href} style={navLinkStyle(item.href)}>
              <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        {/* Language toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, padding: '0 2px' }}>
          {(['es', 'en'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLocale(lang)}
              style={{
                flex: 1, padding: '5px',
                borderRadius: 'var(--radius-xs)',
                border: `1px solid ${locale === lang ? 'rgba(124,106,255,0.3)' : 'var(--border)'}`,
                background: locale === lang ? 'rgba(124,106,255,0.12)' : 'transparent',
                color: locale === lang ? 'var(--accent2)' : 'var(--muted)',
                fontSize: 12, fontWeight: locale === lang ? 600 : 400,
                cursor: 'pointer', fontFamily: 'var(--font)',
                transition: 'all 0.15s',
              }}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* User info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: 6,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--accent)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#fff',
          }}>{initials}</div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 'var(--radius-xs)',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', fontSize: 12, cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'var(--font)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--red-bg)'
            e.currentTarget.style.color = 'var(--red)'
            e.currentTarget.style.borderColor = 'rgba(255,77,109,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--muted)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <span>↩</span> {t('auth_logout')}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Desktop sidebar (sticky) ── */}
      <div className="sidebar-desktop" style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        {sidebarContent}
      </div>

      {/* ── Mobile: hamburger button en el top bar ── */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        style={{
          display: 'none',
          position: 'fixed', top: 14, left: 14, zIndex: 90,
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-xs)', padding: '8px 10px',
          cursor: 'pointer', color: 'var(--text)', fontSize: 16,
          lineHeight: 1,
        }}
      >
        ☰
      </button>

      {/* ── Mobile: overlay backdrop ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'none',
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 95,
          }}
          className="sidebar-backdrop"
        />
      )}

      {/* ── Mobile: drawer ── */}
      <div
        className="sidebar-drawer"
        style={{
          display: 'none',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 260, zIndex: 100,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        {sidebarContent}
      </div>
    </>
  )
}
