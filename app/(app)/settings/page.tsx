'use client'

import { useState, useEffect } from 'react'
import { useT } from '@/lib/lang-context'
import type { Locale } from '@/lib/i18n'

const CONFIG_KEY = 'tradefolio_config_v1'

type Config = { name: string; capital: number; currency: string }

export default function Settings() {
  const { t, locale, setLocale } = useT()
  const [config, setConfig]         = useState<Config>({ name: 'Trader', capital: 0, currency: 'USD' })
  const [tradeCount, setTradeCount] = useState(0)
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY)
      if (raw) setConfig(JSON.parse(raw))
    } catch {}
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">{t('settings_title')}</div>
          <div className="page-sub">{t('settings_sub')}</div>
        </div>
      </div>

      <div className="content">
        {/* Profile */}
        <div className="card" style={{ maxWidth: 480, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>{t('settings_profile')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{t('settings_name')}</label>
            <input className="form-input" type="text" value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))} placeholder="Trader" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{t('settings_capital')}</label>
            <input className="form-input" type="number" step="0.01" value={config.capital || ''} onChange={e => setConfig(c => ({ ...c, capital: parseFloat(e.target.value) || 0 }))} placeholder="1000" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{t('settings_currency')}</label>
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
        <div className="card" style={{ maxWidth: 480, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{t('settings_language')}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{t('settings_lang_sub')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['es', 'en'] as Locale[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={locale === lang ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ minWidth: 80 }}
              >
                {lang === 'es' ? '🇦🇷 Español' : '🇺🇸 English'}
              </button>
            ))}
          </div>
        </div>

        {/* Database */}
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{t('settings_db')}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{t('settings_db_sub')}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t('settings_trades')}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{tradeCount} trades</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--green)', background: 'rgba(0,214,143,0.08)', border: '1px solid rgba(0,214,143,0.15)', padding: '4px 10px', borderRadius: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              {t('settings_active')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t('settings_export')}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t('settings_export_sub')}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={exportData}>{t('settings_export_btn')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
