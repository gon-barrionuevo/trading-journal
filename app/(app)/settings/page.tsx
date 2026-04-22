'use client'

import { useState, useEffect } from 'react'
import { useT } from '@/lib/lang-context'
import type { Locale } from '@/lib/i18n'

const CONFIG_KEY = 'tradefolio_config_v1'

type Config = { name: string; capital: number; currency: string }

const DEFAULT_CONFIG: Config = { name: 'Trader', capital: 0, currency: 'USD' }

function loadInitialConfig(): Config {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_CONFIG
  } catch {
    return DEFAULT_CONFIG
  }
}

export default function Settings() {
  const { t, locale, setLocale } = useT()
  const [config, setConfig]         = useState<Config>(loadInitialConfig)
  const [tradeCount, setTradeCount] = useState(0)
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    fetch('/api/trades').then(r => r.json()).then(data => setTradeCount(Array.isArray(data) ? data.length : 0)).catch(() => {})
  }, [])

  const saveConfig = () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const exportData = async () => {
    const res  = await fetch('/api/trades')
    const data = await res.json()
    const blob = new Blob([JSON.stringify({ config, trades: data }, null, 2)], { type: 'application/json' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `tradefolio_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="page-header">
        <div>
          <div className="page-title">{t('settings_title')}</div>
          <div className="page-sub">{t('settings_sub')}</div>
        </div>
      </div>

      <div className="content">
        {/* Profile */}
        <div className="card max-w-120 mb-4">
          <div className="text-sm font-medium mb-4">{t('settings_profile')}</div>
          <div className="flex flex-col gap-1.5 mb-3.5">
            <label className="text-xs text-muted font-medium">{t('settings_name')}</label>
            <input className="form-input" type="text" value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))} placeholder="Trader" />
          </div>
          <div className="flex flex-col gap-1.5 mb-3.5">
            <label className="text-xs text-muted font-medium">{t('settings_capital')}</label>
            <input className="form-input" type="number" step="0.01" value={config.capital || ''} onChange={e => setConfig(c => ({ ...c, capital: parseFloat(e.target.value) || 0 }))} placeholder="1000" />
          </div>
          <div className="flex flex-col gap-1.5 mb-5">
            <label className="text-xs text-muted font-medium">{t('settings_currency')}</label>
            <select className="form-select" value={config.currency} onChange={e => setConfig(c => ({ ...c, currency: e.target.value }))}>
              <option value="USD">USD — Dólar</option>
              <option value="ARS">ARS — Peso argentino</option>
              <option value="EUR">EUR — Euro</option>
              <option value="BRL">BRL — Real</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={saveConfig}>
            {saved ? t('settings_saved') : t('settings_save')}
          </button>
        </div>

        {/* Language */}
        <div className="card max-w-120 mb-4">
          <div className="text-sm font-medium mb-1">{t('settings_language')}</div>
          <div className="text-xs text-muted mb-4">{t('settings_lang_sub')}</div>
          <div className="flex gap-2">
            {(['es', 'en'] as Locale[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`${locale === lang ? 'btn btn-primary' : 'btn btn-ghost'} min-w-20`}
              >
                {lang === 'es' ? '🇦🇷 Español' : '🇺🇸 English'}
              </button>
            ))}
          </div>
        </div>

        {/* Database */}
        <div className="card max-w-120">
          <div className="text-sm font-medium mb-1">{t('settings_db')}</div>
          <div className="text-xs text-muted mb-4">{t('settings_db_sub')}</div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="text-sm font-medium">{t('settings_trades')}</div>
              <div className="text-xs text-muted">{tradeCount} trades</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green bg-green-bg border border-green/15 px-2.5 py-1 rounded-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-green" />
              {t('settings_active')}
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium">{t('settings_export')}</div>
              <div className="text-xs text-muted">{t('settings_export_sub')}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={exportData}>{t('settings_export_btn')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
