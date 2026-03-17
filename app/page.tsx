'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics, formatMoney, formatPnl } from '@/lib/calculations'
import TradeModal from '@/components/TradeModal'

export default function Dashboard() {
  const [trades, setTrades]       = useState<Trade[]>([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTrade, setEditTrade] = useState<Trade | null>(null)

  const fetchTrades = useCallback(async () => {
    const res = await fetch('/api/trades')
    const data = await res.json()
    setTrades(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este trade?')) return
    await fetch('/api/trades', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchTrades()
  }

  const m = calcMetrics(trades)
  const recent = [...trades].sort((a, b) =>
    new Date(b.trade_date ?? b.created_at).getTime() -
    new Date(a.trade_date ?? a.created_at).getTime()
  ).slice(0, 6)

  const now = new Date()
  const monthYear = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  // Equity curve SVG
  const renderEquity = () => {
    const pts = m.equityPoints
    if (pts.length < 2) return (
      <text x="250" y="80" fill="#555568" fontSize="12" fontFamily="var(--font)" textAnchor="middle">
        Agregá trades para ver la curva
      </text>
    )
    const W = 500, H = 150, pad = 15
    const minV = Math.min(...pts), maxV = Math.max(...pts), range = maxV - minV || 1
    const xs = pts.map((_, i) => pad + (i / (pts.length - 1)) * (W - 2 * pad))
    const ys = pts.map(v => H - pad - ((v - minV) / range) * (H - 2 * pad))
    const area = `M${xs[0]},${ys[0]} ` + xs.slice(1).map((x, i) => `L${x},${ys[i + 1]}`).join(' ') + ` L${xs[xs.length-1]},${H} L${xs[0]},${H} Z`
    const line = `M${xs[0]},${ys[0]} ` + xs.slice(1).map((x, i) => `L${x},${ys[i + 1]}`).join(' ')
    const col = pts[pts.length - 1] >= pts[0] ? '#00d68f' : '#ff4d6d'
    const fv = (v: number) => '$' + v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const lastTrade = [...trades].sort((a, b) =>
      new Date(b.trade_date ?? b.created_at).getTime() - new Date(a.trade_date ?? a.created_at).getTime()
    )[0]
    return (
      <>
        <defs>
          <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.25" />
            <stop offset="100%" stopColor={col} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={H * .25} x2={W} y2={H * .25} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1={H * .5}  x2={W} y2={H * .5}  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1={H * .75} x2={W} y2={H * .75} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <path d={area} fill="url(#eg)" />
        <path d={line} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="4" fill={col} />
        <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="7" fill={col} opacity="0.2" />
        <text x="4" y={H - 4} fill="#555568" fontSize="10" fontFamily="var(--font)">Inicio</text>
        <text x={W - 4} y={H - 4} fill="#555568" fontSize="10" fontFamily="var(--font)" textAnchor="end">
          {lastTrade?.trade_date?.slice(0, 10) ?? ''}
        </text>
        <text x="4" y="12" fill="#555568" fontSize="10" fontFamily="var(--font)">{fv(maxV)}</text>
        <text x="4" y={H - 16} fill="#555568" fontSize="10" fontFamily="var(--font)">{fv(minV)}</text>
      </>
    )
  }

  // Donut
  const circ = 239
  const winArc  = m.total ? Math.round((m.wins  / m.total) * circ) : 0
  const lossArc = m.total ? Math.round((m.losses / m.total) * circ) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Resumen · {monthYear}</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTrade(null); setModalOpen(true) }}>
          + Nuevo trade
        </button>
      </div>

      <div className="content">

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            {
              label: 'Patrimonio',
              value: formatMoney(m.patrimonio),
              delta: m.total === 0 ? 'Sin trades aún' : `${m.totalPnl >= 0 ? '↑ +' : '↓ '}${m.pctChange.toFixed(2)}% total`,
              deltaType: m.total === 0 ? 'neutral' : m.totalPnl >= 0 ? 'up' : 'down',
              dot: 'green'
            },
            {
              label: 'Win rate',
              value: m.winRate + '%',
              valueColor: m.winRate >= 50 ? 'var(--green)' : 'var(--red)',
              delta: `${m.total} trades totales`,
              deltaType: 'neutral', dot: 'green'
            },
            {
              label: 'Profit factor',
              value: m.pf === null ? '—' : m.pf === Infinity ? '∞' : m.pf.toFixed(2),
              valueColor: 'var(--amber)',
              delta: 'Ratio ganancia/pérd.',
              deltaType: 'neutral', dot: 'amber'
            },
            {
              label: 'Racha actual',
              value: m.streak > 0 ? `${m.streak}${m.lastTradeType}` : '—',
              valueColor: m.lastTradeType === 'W' ? 'var(--green)' : 'var(--red)',
              delta: `Mejor racha: ${m.bestStreak || '—'}${m.bestStreak ? 'W' : ''}`,
              deltaType: 'neutral', dot: 'green'
            }
          ].map((card, i) => (
            <div key={i} className="card" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {card.label}
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: card.dot === 'amber' ? 'var(--amber)' : 'var(--green)', display: 'inline-block' }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--mono)', lineHeight: 1, marginBottom: 6, color: card.valueColor ?? 'var(--text)' }}>
                {loading ? '...' : card.value}
              </div>
              <div style={{ fontSize: 12, color: card.deltaType === 'up' ? 'var(--green)' : card.deltaType === 'down' ? 'var(--red)' : 'var(--muted)' }}>
                {card.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 24 }}>
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Curva de equity</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Evolución del patrimonio</div>
            <svg width="100%" viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: 160 }}>
              {renderEquity()}
            </svg>
          </div>

          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Win / Loss</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Distribución de resultados</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#1a1a24" strokeWidth="12" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#00d68f" strokeWidth="12"
                    strokeDasharray={`${winArc} ${circ - winArc}`} strokeLinecap="round" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#ff4d6d" strokeWidth="12"
                    strokeDasharray={`${lossArc} ${circ - lossArc}`} strokeDashoffset={-winArc} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{m.winRate}%</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>win rate</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Wins',   value: m.wins,   color: 'var(--green)', cls: 'pnl-positive' },
                  { label: 'Losses', value: m.losses, color: 'var(--red)',   cls: 'pnl-negative' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color, marginRight: 8 }} />
                      {row.label}
                    </div>
                    <div className={row.cls} style={{ fontSize: 13, fontWeight: 500 }}>{row.value}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>P&L neto</div>
                  <div className={m.totalPnl >= 0 ? 'pnl-positive' : 'pnl-negative'} style={{ fontSize: 13, fontWeight: 500 }}>
                    {formatPnl(m.totalPnl)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent trades */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Últimos trades</div>
            <a href="/journal" style={{ textDecoration: 'none' }}>
              <button className="btn btn-ghost btn-sm">Ver todos →</button>
            </a>
          </div>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 0.5fr', alignItems: 'center', padding: '10px 20px', fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            <div>Activo</div><div>Dirección</div><div>Riesgo %</div><div>P&L USD</div><div>Fecha</div><div />
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-sub">Cargando...</div></div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-text">Sin trades registrados</div>
              <div className="empty-sub">Hacé clic en "Nuevo trade" para empezar</div>
            </div>
          ) : recent.map(t => {
            const pnl = t.pnl ?? 0
            const dt  = t.trade_date
              ? new Date(t.trade_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
              : '—'
            return (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 0.5fr', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 12, transition: 'background 0.1s' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{t.asset}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{dt}</div>
                </div>
                <div><span className={`badge badge-${t.direction}`}>{t.direction.toUpperCase()}</span></div>
                <div className="mono">{t.pct ? `${t.pct}%` : '—'}</div>
                <div className={pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatPnl(pnl)}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{dt}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '3px 7px', fontSize: 10 }} onClick={() => { setEditTrade(t); setModalOpen(true) }}>✎</button>
                  <button className="btn btn-danger btn-sm" style={{ padding: '3px 7px', fontSize: 10 }} onClick={() => handleDelete(t.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TradeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTrade(null) }}
        onSaved={fetchTrades}
        editTrade={editTrade}
        defaultPatrimony={m.patrimonio}
      />
    </div>
  )
}
