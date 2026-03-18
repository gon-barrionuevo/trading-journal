'use client'

import { useEffect, useState } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics, formatMoney, formatPnl } from '@/lib/calculations'

export default function Stats() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrades = async () => {
      const res  = await fetch('/api/trades')
      const data = await res.json()
      setTrades(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    fetchTrades()
  }, [])

  const m = calcMetrics(trades)

  // P&L bars (last 10)
  const last10 = [...trades]
    .sort((a, b) => new Date(b.trade_date ?? b.created_at).getTime() - new Date(a.trade_date ?? a.created_at).getTime())
    .slice(0, 10)
    .reverse()

  const maxAbs = Math.max(...last10.map(t => Math.abs(t.pnl ?? 0)), 1)
  const bw = 30, gap = 14
  const totalW = last10.length * (bw + gap) - gap
  const startX = (440 - totalW) / 2
  const maxH = 80

  const statCards = [
    { label: 'Patrimonio total',  value: formatMoney(m.patrimonio),        sub: `Capital inicial: ${formatMoney(m.baseCapital)}`,   color: m.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Ganancia neta',     value: formatPnl(m.totalPnl),            sub: `${m.pctChange.toFixed(2)}% sobre capital`,          color: m.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Avg win / Avg loss',value: m.avgWin ? formatMoney(m.avgWin) : '—', sub: `Avg loss: ${m.avgLoss ? formatMoney(m.avgLoss) : '—'}`, color: 'var(--amber)' },
    { label: 'Riesgo promedio',   value: m.avgRisk != null ? `${m.avgRisk.toFixed(2)}%` : '—', sub: '% capital arriesgado por trade', color: 'var(--accent2)' },
    { label: 'Riesgo máximo',     value: m.maxRiskTrade ? `${m.maxRiskTrade.pct?.toFixed(2)}%` : '—', sub: m.maxRiskTrade?.asset ?? 'Trade con mayor exposición', color: 'var(--red)' },
    { label: 'Riesgo mínimo',     value: m.minRiskTrade ? `${m.minRiskTrade.pct?.toFixed(2)}%` : '—', sub: m.minRiskTrade?.asset ?? 'Trade con menor exposición', color: 'var(--green)' },
  ]

  const keyMetrics = [
    { label: 'Avg. win',      value: m.avgWin  ? formatMoney(m.avgWin)  : '—', color: 'var(--green)'   },
    { label: 'Avg. loss',     value: m.avgLoss ? formatMoney(m.avgLoss) : '—', color: 'var(--red)'     },
    { label: 'Profit factor', value: m.pf === null ? '—' : m.pf === Infinity ? '∞' : m.pf.toFixed(2),  color: 'var(--amber)'   },
    { label: 'R:R promedio',  value: (m.avgWin && m.avgLoss) ? `1:${(m.avgWin / m.avgLoss).toFixed(1)}` : '—', color: 'var(--accent2)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Estadísticas</div>
          <div className="page-sub">Análisis detallado de tu performance</div>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="empty-state"><div className="empty-sub">Cargando...</div></div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
              {statCards.map((c, i) => (
                <div key={i} className="card">
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500, marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', margin: '6px 0 4px', color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* P&L bars */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>P&L por trade</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Últimos 10 registrados · verde = ganancia, rojo = pérdida</div>
              <svg width="100%" viewBox="0 0 440 130" style={{ marginTop: 8 }}>
                {last10.length === 0 ? (
                  <text x="220" y="70" fill="#555568" fontSize="12" fontFamily="var(--font)" textAnchor="middle">Sin datos aún</text>
                ) : (
                  <>
                    {last10.map((t, i) => {
                      const x   = startX + i * (bw + gap)
                      const h   = Math.max(4, (Math.abs(t.pnl ?? 0) / maxAbs) * maxH)
                      const isW = (t.pnl ?? 0) >= 0
                      const y   = isW ? 100 - h : 100
                      const col = isW ? '#00d68f' : '#ff4d6d'
                      return (
                        <g key={t.id}>
                          <rect x={x} y={y} width={bw} height={h} rx="4" fill={col} opacity="0.85" />
                          <text x={x + bw / 2} y="118" fill="#555568" fontSize="9" fontFamily="var(--font)" textAnchor="middle">
                            {(t.asset ?? '').split('/')[0].slice(0, 4)}
                          </text>
                        </g>
                      )
                    })}
                    <line x1="0" y1="100" x2="440" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  </>
                )}
              </svg>
            </div>

            {/* Key metrics */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Métricas clave</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {keyMetrics.map((km, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: 14, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--mono)', color: km.color }}>{km.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{km.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
