'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'

const navItems = [
  { href: '/',         label: 'Dashboard',    icon: '📊' },
  { href: '/journal',  label: 'Journal',       icon: '🕯️' },
  { href: '/stats',    label: 'Estadísticas',  icon: '📈' },
  { href: '/mindset',  label: 'Mindset',       icon: '🧠' },
]

const configItems = [
  { href: '/settings', label: 'Configuración', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Trader'
  const initials    = displayName.charAt(0).toUpperCase()

  const navLinkStyle = (href: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 10px', borderRadius: 'var(--radius-xs)',
    color: pathname === href ? 'var(--accent2)' : 'var(--muted)',
    fontSize: 13, cursor: 'pointer', marginBottom: 2,
    border: pathname === href ? '1px solid rgba(124,106,255,0.2)' : '1px solid transparent',
    background: pathname === href ? 'rgba(124,106,255,0.12)' : 'transparent',
    transition: 'all 0.15s', textDecoration: 'none',
  })

  return (
    <aside style={{
      width: 220, minWidth: 220,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
    }}>

      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, background: 'var(--accent)',
          borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff',
        }}>Tr</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>TrackR</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Trading Journal</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px', marginBottom: 6, fontWeight: 500 }}>
            Main
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
            Config
          </div>
          {configItems.map(item => (
            <Link key={item.href} href={item.href} style={navLinkStyle(item.href)}>
              <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom — user info + logout */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
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
          <span>↩</span> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
