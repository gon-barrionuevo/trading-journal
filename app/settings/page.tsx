'use client'

import { useState, useEffect } from 'react'

const CONFIG_KEY = 'trackr_config_v1'

type Config = {
  name: string
  capital: number
  currency: string
}

export default function Settings() {
  const [config, setConfig] = useState<Config>(() => {
    if (typeof window === 'undefined') return { name: 'Trader', capital: 0, currency: 'USD' }
    try {
      const raw = localStorage.getItem(CONFIG_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return { name: 'Trader', capital: 0, currency: 'USD' }
  })
  const [tradeCount, setTradeCount] = useState(0)
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    fetch('/api/trades')
      .then(r => r.json())
      .then(data => setTradeCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
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
    a.download = `trackr_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Configuración</div>
          <div className="page-sub">Perfil y gestión de datos</div>
        </div>
      </div>

      <div className="content">

        {/* Perfil */}
        <div className="card" style={{ maxWidth: 480, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Perfil</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Tu nombre</label>
            <input
              className="form-input"
              value={config.name}
              onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej: Juan"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Capital inicial (USD)</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={config.capital || ''}
              onChange={e => setConfig(c => ({ ...c, capital: parseFloat(e.target.value) || 0 }))}
              placeholder="Ej: 1000"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Moneda base</label>
            <select
              className="form-select"
              value={config.currency}
              onChange={e => setConfig(c => ({ ...c, currency: e.target.value }))}
            >
              <option value="USD">USD — Dólar</option>
              <option value="ARS">ARS — Peso argentino</option>
              <option value="EUR">EUR — Euro</option>
              <option value="BRL">BRL — Real</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={saveConfig}>
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>

        {/* Storage */}
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Base de datos</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Datos almacenados en Supabase</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Trades guardados</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{tradeCount} trades</div>
            </div>
            <div className="storage-badge" style={{ margin: 0 }}>
              <div className="storage-dot" />
              <span>Supabase activo</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Exportar datos</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Descargar todos los trades en JSON</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={exportData}>↓ Exportar</button>
          </div>
        </div>

      </div>
    </div>
  )
}
