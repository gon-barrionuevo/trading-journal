'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/',          label: 'Dashboard',     icon: '◈' },
  { href: '/journal',   label: 'Journal',        icon: '◎' },
  { href: '/stats',     label: 'Estadísticas',   icon: '◇' },
  { href: '/mindset',   label: 'Mindset',        icon: '🧠' },
]

const configItems = [
  { href: '/settings', label: 'Configuración', icon: '◉' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220, minWidth: 220,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh'
    }}>

      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <div style={{
          width: 32, height: 32, background: 'var(--accent)',
          borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff'
        }}>Tr</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>TrackR</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Trading Journal</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase',
            letterSpacing: 1, padding: '0 8px', marginBottom: 6, fontWeight: 500
          }}>Main</div>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 'var(--radius-xs)',
                color: pathname === item.href ? 'var(--accent2)' : 'var(--muted)',
                fontSize: 13, cursor: 'pointer',
                marginBottom: 2,
                border: pathname === item.href ? '1px solid rgba(124,106,255,0.2)' : '1px solid transparent',
                background: pathname === item.href ? 'rgba(124,106,255,0.12)' : 'transparent',
                transition: 'all 0.15s'
              }}>
                <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div>
          <div style={{
            fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase',
            letterSpacing: 1, padding: '0 8px', marginBottom: 6, fontWeight: 500
          }}>Config</div>
          {configItems.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 'var(--radius-xs)',
                color: pathname === item.href ? 'var(--accent2)' : 'var(--muted)',
                fontSize: 13, cursor: 'pointer',
                marginBottom: 2,
                border: pathname === item.href ? '1px solid rgba(124,106,255,0.2)' : '1px solid transparent',
                background: pathname === item.href ? 'rgba(124,106,255,0.12)' : 'transparent',
                transition: 'all 0.15s'
              }}>
                <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div className="storage-badge">
          <div className="storage-dot" />
          <span>Supabase conectado</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 'var(--radius-xs)'
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: '#fff'
          }}>T</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Trader</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Beta</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
