import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Locale, TranslationKey } from '@/lib/i18n'


export default function SidebarContent({
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
  locale: Locale
  setLocale: (l: Locale) => void
  handleLogout: () => void
  t: (key: TranslationKey) => string
}) {
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
    `flex items-center gap-2.5 px-2.5 py-2 rounded-xs text-sm cursor-pointer mb-0.5 border no-underline transition-all duration-150 ${
      pathname === href
        ? 'text-accent2 border-[rgba(124,106,255,0.2)] bg-[rgba(124,106,255,0.12)]'
        : 'text-muted border-transparent bg-transparent hover:text-text hover:bg-surface2'
    }`

  return (
    <aside className="w-[220px] min-w-[220px] bg-surface border-r border-border flex flex-col h-full">

      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center gap-2.5">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0">
          Tf
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base leading-tight">Tradefolio</div>
          <div className="text-xs text-muted">Trading Journal</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-transparent border-none text-muted text-2xl cursor-pointer leading-none p-1 shrink-0"
          >
            ×
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="mb-6">
          <div className="text-xs text-muted2 uppercase tracking-wider px-2 mb-1.5 font-medium">
            {t('nav_main')}
          </div>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)} onClick={onClose}>
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div>
          <div className="text-xs text-muted2 uppercase tracking-wider px-2 mb-1.5 font-medium">
            {t('nav_config')}
          </div>
          {configItems.map(item => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)} onClick={onClose}>
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-border">

        {/* Language toggle */}
        <div className="flex gap-1 mb-2.5">
          {(['es', 'en'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLocale(lang)}
              className={`flex-1 py-1.5 rounded-xs border text-xs cursor-pointer font-[var(--font)] transition-all duration-150 ${
                locale === lang
                  ? 'border-[rgba(124,106,255,0.3)] bg-[rgba(124,106,255,0.12)] text-accent2 font-semibold'
                  : 'border-border bg-transparent text-muted'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* User info */}
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1.5 rounded-xs">
          <div className="w-8 h-8 rounded-full bg-accent shrink-0 flex items-center justify-center text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-medium truncate">{displayName}</div>
            <div className="text-xs text-muted truncate">{user?.email}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-xs bg-transparent border border-border text-muted text-xs cursor-pointer transition-all duration-150 font-[var(--font)] hover:bg-red-bg hover:text-red hover:border-[rgba(255,77,109,0.3)]"
        >
          <span>↩</span> {t('auth_logout')}
        </button>
      </div>
    </aside>
  )
}