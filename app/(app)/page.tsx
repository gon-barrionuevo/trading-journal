'use client'

import { useEffect, useState } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics, formatMoney, formatPnl } from '@/lib/calculations'
import { useT } from '@/lib/lang-context'
import { useAccount } from '@/lib/account-context'
import TradeModal from '@/components/TradeModal'
import EquityCurve from '@/components/EquityCurve'

export default function Dashboard() {
  const { t, locale } = useT()
  const { activeAccount } = useAccount()
  const [trades, setTrades]       = useState<Trade[]>([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTrade, setEditTrade] = useState<Trade | null>(null)

  const fetchTrades = async () => {
    if (!activeAccount) {
      setLoading(false)
      return
    }
    const res = await fetch(`/api/trades?account_id=${activeAccount.id}`)
    const data = await res.json()
    setTrades(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchTrades() }, [activeAccount])

  const handleDelete = async (id: string) => {
    if (!confirm('?')) return
    await fetch('/api/trades', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchTrades()
  }

  const m        = calcMetrics(trades, activeAccount?.initial_capital ?? 0)
  const recent   = [...trades].sort((a, b) => new Date(b.trade_date ?? b.created_at).getTime() - new Date(a.trade_date ?? a.created_at).getTime()).slice(0, 6)
  const monthYear = new Date().toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', { month: 'long', year: 'numeric' })
  const circ = 239
  const winArc  = m.total ? Math.round((m.wins  / m.total) * circ) : 0
  const lossArc = m.total ? Math.round((m.losses / m.total) * circ) : 0

  const metricCards = [
    {
      label: t('dash_patrimony'),
      value: formatMoney(m.patrimonio),
      delta: m.total === 0 ? t('dash_no_trades') : `${m.totalPnl >= 0 ? '↑ +' : '↓ '}${m.pctChange.toFixed(2)}% total`,
      deltaType: m.total === 0 ? 'neutral' : m.totalPnl >= 0 ? 'up' : 'down',
      dot: 'green'
    },
    {
      label: t('dash_winrate'),
      value: m.winRate + '%',
      valueColor: m.winRate >= 50 ? 'var(--green)' : 'var(--red)',
      delta: `${m.total} ${t('dash_total_trades')}`,
      deltaType: 'neutral', dot: 'green'
    },
    {
      label: t('dash_pf'),
      value: m.pf === null ? '—' : m.pf === Infinity ? '∞' : m.pf.toFixed(2),
      valueColor: 'var(--amber)',
      delta: t('dash_ratio'),
      deltaType: 'neutral', dot: 'amber'
    },
    {
      label: t('dash_streak'),
      value: m.streak > 0 ? `${m.streak}${m.lastTradeType}` : '—',
      valueColor: m.lastTradeType === 'W' ? 'var(--green)' : 'var(--red)',
      delta: `${t('dash_best_streak')}: ${m.bestStreak || '—'}${m.bestStreak ? 'W' : ''}`,
      deltaType: 'neutral', dot: 'green'
    }
  ]

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="page-header">
        <div>
          <div className="page-title">{t('dash_title')}</div>
          <div className="page-sub">{t('dash_sub')} · {monthYear}</div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { setEditTrade(null); setModalOpen(true) }}
          disabled={!activeAccount}
        >
          {t('dash_new_trade')}
        </button>
      </div>

      <div className="content">
        {/* Sin cuenta activa */}
        {!activeAccount ? (
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <div className="empty-text">No tenés ninguna cuenta creada</div>
            <div className="empty-sub">
              Creá tu primera cuenta de trading usando el selector en la barra lateral
            </div>
          </div>
        ) : (
          <>
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3.5 mb-6">
          {metricCards.map((card, i) => (
            <div key={i} className="card cursor-pointer">
              <div className="text-[11px] text-[var(--muted)] uppercase tracking-[0.8px] font-medium mb-2.5 flex items-center justify-between">
                {card.label}
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${card.dot === 'amber' ? 'bg-[var(--amber)]' : 'bg-[var(--green)]'}`} />
              </div>
              <div className={`text-2xl font-semibold font-mono leading-none mb-1.5 ${(card as {valueColor?: string}).valueColor ? `text-[${(card as {valueColor?: string}).valueColor}]` : 'text-[var(--text)]'}`}>
                {loading ? '...' : card.value}
              </div>
              <div className={`text-xs ${card.deltaType === 'up' ? 'text-[var(--green)]' : card.deltaType === 'down' ? 'text-[var(--red)]' : 'text-[var(--muted)]'}`}>
                {card.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-[2fr_1fr] gap-3.5 mb-6">
          <div className="card">
            <div className="text-[13px] font-medium mb-1">{t('dash_equity')}</div>
            <div className="text-[12px] text-[var(--muted)] mb-3">{t('dash_equity_sub')}</div>
            <EquityCurve trades={trades} />
          </div>
          <div className="card">
            <div className="text-sm font-medium mb-1">{t('dash_winloss')}</div>
            <div className="text-xs text-[var(--muted)] mb-4">{t('dash_winloss_sub')}</div>
            <div className="flex items-center gap-5">
              <div className="relative w-27.5 h-27.5 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" className="stroke-[var(--surface2)]" strokeWidth="12" />
                  <circle cx="50" cy="50" r="38" fill="none" className="stroke-[var(--green)]" strokeWidth="12" strokeDasharray={`${winArc} ${circ - winArc}`} strokeLinecap="round" />
                  <circle cx="50" cy="50" r="38" fill="none" className="stroke-[var(--red)]" strokeWidth="12" strokeDasharray={`${lossArc} ${circ - lossArc}`} strokeDashoffset={-winArc} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl font-semibold font-mono text-[var(--green)]">{m.winRate}%</div>
                  <div className="text-[10px] text-[var(--muted)]">win rate</div>
                </div>
              </div>
              <div className="flex-1">
                {[
                  { label: t('dash_wins'),   value: m.wins,   color: 'var(--green)', cls: 'pnl-positive' },
                  { label: t('dash_losses'), value: m.losses, color: 'var(--red)',   cls: 'pnl-negative' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between mb-2.5">
                    <div className="text-xs text-[var(--muted)] flex items-center">
                      <div className={`w-2 h-2 rounded-[2px] mr-2 bg-[${row.color}]`} />
                      {row.label}
                    </div>
                    <div className={`${row.cls} text-sm font-medium`}>{row.value}</div>
                  </div>
                ))}]
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]">
                  <div className="text-xs text-[var(--muted)]">{t('dash_pnl_net')}</div>
                  <div className={`${m.totalPnl >= 0 ? 'pnl-positive' : 'pnl-negative'} text-sm font-medium`}>{formatPnl(m.totalPnl)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent trades */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="text-sm font-medium">{t('dash_recent')}</div>
            <a href="/journal" className="no-underline">
              <button className="btn btn-ghost btn-sm">{t('dash_see_all')}</button>
            </a>
          </div>
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_0.5fr] items-center p-[10px_20px] text-[11px] text-[var(--muted)] font-medium uppercase tracking-[0.7px]">
            <div>{t('dash_asset')}</div><div>{t('dash_direction')}</div><div>{t('dash_risk')}</div><div>{t('dash_pnl_usd')}</div><div>{t('dash_date')}</div><div />
          </div>
          {loading ? (
            <div className="empty-state"><div className="empty-sub">...</div></div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-text">{t('dash_no_records')}</div>
              <div className="empty-sub">{t('dash_no_records_sub')}</div>
            </div>
          ) : recent.map(tr => {
            const pnl = tr.pnl ?? 0
            const dt  = tr.trade_date ? new Date(tr.trade_date).toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', { day: '2-digit', month: 'short' }) : '—'
            return (
              <div key={tr.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_0.5fr] items-center p-[12px_20px] border-t border-[var(--border)] text-xs">
                <div><div className="font-medium text-sm">{tr.asset}</div><div className="text-[11px] text-[var(--muted)]">{dt}</div></div>
                <div><span className={`badge badge-${tr.direction}`}>{tr.direction.toUpperCase()}</span></div>
                <div className="font-mono">{tr.pct ? `${tr.pct}%` : '—'}</div>
                <div className={pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatPnl(pnl)}</div>
                <div className="text-[var(--muted)] text-xs">{dt}</div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost p-0.75! px-1.75! text-[10px]" onClick={() => { setEditTrade(tr); setModalOpen(true) }}>✎</button>
                  <button className="btn btn-danger p-0.75! px-1.75! text-[10px]" onClick={() => handleDelete(tr.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
        </>
        )}
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
