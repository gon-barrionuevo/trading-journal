'use client'

import { useEffect, useState } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics, formatMoney, formatPnl } from '@/lib/calculations'
import TradeModal from '@/components/TradeModal'
import EquityCurve from '@/components/EquityCurve'

export default function Dashboard() {
  const [trades, setTrades]       = useState<Trade[]>([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTrade, setEditTrade] = useState<Trade | null>(null)

  const fetchTrades = async () => {
    const res = await fetch('/api/trades')
    const data = await res.json()
    setTrades(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTrades() }, [])

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
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Evolución del patrimonio</div>
            <EquityCurve trades={trades} />
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
