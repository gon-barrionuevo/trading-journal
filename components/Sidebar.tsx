'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useT } from '@/lib/lang-context'
import { useAccount } from '@/lib/account-context'
import { Account } from '@/types/account'
import type { User } from '@supabase/supabase-js'

// ─── Modal: Nueva / Editar cuenta ────────────────────────────────────────────
function AccountModal({
  open,
  onClose,
  onSaved,
  editAccount,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editAccount?: Account | null
}) {
  const [name, setName]       = useState('')
  const [capital, setCapital] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (!open) return
    setName(editAccount?.name ?? '')
    setCapital(editAccount?.initial_capital ? String(editAccount.initial_capital) : '')
  }, [open, editAccount])

  if (!open) return null

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = { name: name.trim(), initial_capital: parseFloat(capital) || 0 }
    if (editAccount) {
      await fetch('/api/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editAccount.id, ...payload }),
      })
    } else {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-[16px] font-semibold">
            {editAccount ? 'Editar cuenta' : 'Nueva cuenta'}
          </div>
          <button onClick={onClose} className="text-[var(--muted)] text-xl bg-transparent border-none cursor-pointer">×</button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-[var(--muted)] font-medium">Nombre *</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='Ej: Binance - $500, FTMO Challenge'
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-[var(--muted)] font-medium">Capital inicial (USD)</label>
          <input
            className="form-input"
            type="number"
            value={capital}
            onChange={e => setCapital(e.target.value)}
            placeholder="Ej: 500"
          />
        </div>

        <div className="flex gap-2 justify-end mt-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Guardando...' : '✓ Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Subcomponente sidebar content ───────────────────────────────────────────
function SidebarContent({
  onClose,
  pathname,
  user,
  displayName,
  initials,
  locale,
  setLocale,
  handleLogout,
  t,
}: {
  onClose?: () => void
  pathname: string
  user: User | null
  displayName: string
  initials: string
  locale: string
  setLocale: (l: 'es' | 'en') => void
  handleLogout: () => void
  t: (key: string) => string
}) {
  const { accounts, activeAccount, setActiveAccount, refreshAccounts } = useAccount()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [editAccount, setEditAccount]           = useState<Account | null>(null)
  const [burnConfirm, setBurnConfirm]           = useState<Account | null>(null)

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

  const linkClass = (href: string) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-xs)] text-[13px] cursor-pointer mb-0.5 border no-underline transition-all duration-150 ${
      pathname === href
        ? 'text-[var(--accent2)] border-[rgba(124,106,255,0.2)] bg-[rgba(124,106,255,0.12)]'
        : 'text-[var(--muted)] border-transparent bg-transparent hover:text-[var(--text)] hover:bg-[var(--surface2)]'
    }`

  const handleBurn = async (account: Account) => {
    await fetch('/api/accounts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: account.id, status: 'burned', burned_at: new Date().toISOString() }),
    })
    await refreshAccounts()
    setBurnConfirm(null)
  }

  const activeAccounts   = accounts.filter(a => a.status === 'active')
  const burnedAccounts   = accounts.filter(a => a.status === 'burned')

  return (
    <>
      <aside className="w-[220px] min-w-[220px] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full">

        {/* Logo */}
        <div className="px-5 pt-6 pb-[18px] border-b border-[var(--border)] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0">
            Tf
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base leading-tight">Tradefolio</div>
            <div className="text-[11px] text-[var(--muted)]">Trading Journal</div>
          </div>
          {onClose && (
            <button onClick={onClose} className="bg-transparent border-none text-[var(--muted)] text-2xl cursor-pointer leading-none p-1 shrink-0">×</button>
          )}
        </div>

        {/* Account selector */}
        <div className="px-3 pt-3 pb-1 relative">
          <div className="text-[11px] text-[var(--muted2)] uppercase tracking-wider px-2 mb-1.5 font-medium">
            Cuenta activa
          </div>

          {/* Dropdown trigger */}
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius-xs)] border text-left transition-all duration-150 cursor-pointer"
            style={{
              background: 'var(--surface2)',
              borderColor: dropdownOpen ? 'var(--accent)' : 'var(--border2)',
              color: 'var(--text)',
            }}
          >
            <span className="text-[10px]">
              {activeAccount?.status === 'burned' ? '🔥' : '💼'}
            </span>
            <span className="text-[12px] font-medium flex-1 truncate">
              {activeAccount?.name ?? 'Sin cuenta'}
            </span>
            <span className="text-[var(--muted)] text-[10px]">{dropdownOpen ? '▲' : '▼'}</span>
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div
              className="absolute left-3 right-3 top-full mt-1 z-50 rounded-[var(--radius-sm)] overflow-hidden shadow-xl"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}
            >
              {/* Cuentas activas */}
              {activeAccounts.length > 0 && (
                <div className="p-1">
                  <div className="text-[10px] text-[var(--muted2)] px-2 py-1 uppercase tracking-wider">Activas</div>
                  {activeAccounts.map(acc => (
                    <div
                      key={acc.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-xs)] cursor-pointer group"
                      style={{
                        background: activeAccount?.id === acc.id ? 'rgba(124,106,255,0.12)' : 'transparent',
                      }}
                    >
                      <span
                        className="text-[12px] flex-1 truncate"
                        style={{ color: activeAccount?.id === acc.id ? 'var(--accent2)' : 'var(--text)' }}
                        onClick={() => { setActiveAccount(acc); setDropdownOpen(false) }}
                      >
                        💼 {acc.name}
                      </span>
                      <div className="hidden group-hover:flex gap-1">
                        <button
                          className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] bg-transparent border-none cursor-pointer px-1"
                          onClick={e => { e.stopPropagation(); setEditAccount(acc); setAccountModalOpen(true); setDropdownOpen(false) }}
                          title="Editar"
                        >✎</button>
                        <button
                          className="text-[10px] text-[var(--red)] bg-transparent border-none cursor-pointer px-1"
                          onClick={e => { e.stopPropagation(); setBurnConfirm(acc); setDropdownOpen(false) }}
                          title="Quemar cuenta"
                        >🔥</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cuentas quemadas */}
              {burnedAccounts.length > 0 && (
                <div className="p-1 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-[10px] text-[var(--muted2)] px-2 py-1 uppercase tracking-wider">Historial</div>
                  {burnedAccounts.map(acc => (
                    <div
                      key={acc.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-xs)] cursor-pointer opacity-60 hover:opacity-100"
                      onClick={() => { setActiveAccount(acc); setDropdownOpen(false) }}
                    >
                      <span className="text-[12px] flex-1 truncate text-[var(--muted)]">
                        🔥 {acc.name}
                      </span>
                      <span className="text-[10px] text-[var(--red)]">quemada</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón nueva cuenta */}
              <div className="p-1 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-xs)] text-[12px] text-[var(--accent2)] bg-transparent border-none cursor-pointer hover:bg-[rgba(124,106,255,0.08)] transition-all"
                  onClick={() => { setEditAccount(null); setAccountModalOpen(true); setDropdownOpen(false) }}
                >
                  + Nueva cuenta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="px-3 py-3 flex-1 overflow-y-auto">
          <div className="mb-6">
            <div className="text-[11px] text-[var(--muted2)] uppercase tracking-wider px-2 mb-1.5 font-medium">
              {t('nav_main')}
            </div>
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)} onClick={onClose}>
                <span className="text-[15px] w-[18px] text-center shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div>
            <div className="text-[11px] text-[var(--muted2)] uppercase tracking-wider px-2 mb-1.5 font-medium">
              {t('nav_config')}
            </div>
            {configItems.map(item => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)} onClick={onClose}>
                <span className="text-[15px] w-[18px] text-center shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-[var(--border)]">
          <div className="flex gap-1 mb-2.5">
            {(['es', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`flex-1 py-[5px] rounded-[var(--radius-xs)] border text-xs cursor-pointer font-[var(--font)] transition-all duration-150 ${
                  locale === lang
                    ? 'border-[rgba(124,106,255,0.3)] bg-[rgba(124,106,255,0.12)] text-[var(--accent2)] font-semibold'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)]'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 px-2 py-2 mb-1.5 rounded-[var(--radius-xs)]">
            <div className="w-[30px] h-[30px] rounded-full bg-[var(--accent)] shrink-0 flex items-center justify-center text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-[13px] font-medium truncate">{displayName}</div>
              <div className="text-[11px] text-[var(--muted)] truncate">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-2 py-[7px] rounded-[var(--radius-xs)] bg-transparent border border-[var(--border)] text-[var(--muted)] text-xs cursor-pointer transition-all duration-150 font-[var(--font)] hover:bg-[var(--red-bg)] hover:text-[var(--red)] hover:border-[rgba(255,77,109,0.3)]"
          >
            <span>↩</span> {t('auth_logout')}
          </button>
        </div>
      </aside>

      {/* Modal nueva/editar cuenta */}
      <AccountModal
        open={accountModalOpen}
        onClose={() => { setAccountModalOpen(false); setEditAccount(null) }}
        onSaved={refreshAccounts}
        editAccount={editAccount}
      />

      {/* Confirmar quemar cuenta */}
      {burnConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setBurnConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: 'var(--surface)', border: '1px solid rgba(255,77,109,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🔥</div>
              <div className="text-[16px] font-semibold mb-2">¿Quemar esta cuenta?</div>
              <div className="text-[13px] text-[var(--muted)]">
                <span className="text-[var(--text)] font-medium">{burnConfirm.name}</span> quedará archivada en tu historial. Esta acción no elimina los trades.
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button className="btn btn-ghost" onClick={() => setBurnConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleBurn(burnConfirm)}>🔥 Quemar cuenta</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

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
      {/* Desktop */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0">
        <SidebarContent {...sharedProps} />
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden fixed top-3.5 left-3.5 z-[90] flex items-center justify-center bg-[var(--surface)] border border-[var(--border2)] rounded-[var(--radius-xs)] w-9 h-9 cursor-pointer text-[var(--text)] text-base"
      >
        ☰
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[95]"
        />
      )}

      {/* Mobile drawer */}
      <div
        className="md:hidden fixed top-0 left-0 bottom-0 w-[260px] z-[100] transition-transform duration-[250ms] ease-out"
        style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <SidebarContent {...sharedProps} onClose={() => setMobileOpen(false)} />
      </div>
    </>
  )
}
