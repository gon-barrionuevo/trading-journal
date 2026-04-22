'use client'

import { useEffect, useState } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics, formatMoney, formatPnl } from '@/lib/calculations'
import { useT } from '@/lib/lang-context'

export default function Stats() {
  const { t } = useT()
  const [trades, setTrades]   = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res  = await fetch('/api/trades')
      const data = await res.json()
      setTrades(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [])

  const m = calcMetrics(trades)

  const last10 = [...trades]
    .sort((a, b) => new Date(b.trade_date ?? b.created_at).getTime() - new Date(a.trade_date ?? a.created_at).getTime())
    .slice(0, 10).reverse()

  const maxAbs = Math.max(...last10.map(tr => Math.abs(tr.pnl ?? 0)), 1)
  const bw = 30, gap = 14
  const totalW  = last10.length * (bw + gap) - gap
  const startX  = (440 - totalW) / 2
  const maxH    = 80

  const statCards = [
    { label: t('stats_patrimony'), value: formatMoney(m.patrimonio),  sub: `${t('stats_initial')}: ${formatMoney(m.baseCapital)}`,  color: m.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: t('stats_net_gain'), value: formatPnl(m.totalPnl),       sub: `${m.pctChange.toFixed(2)}% ${t('stats_over_cap')}`,     color: m.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: t('stats_avg'),      value: m.avgWin ? formatMoney(m.avgWin) : '—', sub: `${t('stats_avg_loss')}: ${m.avgLoss ? formatMoney(m.avgLoss) : '—'}`, color: 'var(--amber)' },
    { label: t('stats_avg_risk'), value: m.avgRisk != null ? `${m.avgRisk.toFixed(2)}%` : '—', sub: t('stats_avg_risk_sub'), color: 'var(--accent2)' },
    { label: t('stats_max_risk'), value: m.maxRiskTrade ? `${m.maxRiskTrade.pct?.toFixed(2)}%` : '—', sub: m.maxRiskTrade?.asset ?? t('stats_max_risk_sub'), color: 'var(--red)' },
    { label: t('stats_min_risk'), value: m.minRiskTrade ? `${m.minRiskTrade.pct?.toFixed(2)}%` : '—', sub: m.minRiskTrade?.asset ?? t('stats_min_risk_sub'), color: 'var(--green)' },
  ]

  const keyMetrics = [
    { label: t('stats_avg_win'),  value: m.avgWin  ? formatMoney(m.avgWin)  : '—', color: 'var(--green)'   },
    { label: t('stats_avg_loss2'),value: m.avgLoss ? formatMoney(m.avgLoss) : '—', color: 'var(--red)'     },
    { label: t('stats_pf'),       value: m.pf === null ? '—' : m.pf === Infinity ? '∞' : m.pf.toFixed(2),  color: 'var(--amber)'   },
    { label: t('stats_rr'),       value: (m.avgWin && m.avgLoss) ? `1:${(m.avgWin / m.avgLoss).toFixed(1)}` : '—', color: 'var(--accent2)' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="page-header">
        <div>
          <div className="page-title">{t('stats_title')}</div>
          <div className="page-sub">{t('stats_sub')}</div>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="empty-state"><div className="empty-sub">...</div></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3.5 mb-6">
              {statCards.map((c, i) => (
                <div key={i} className="card">
                  <div className="text-[11px] text-(--muted) uppercase tracking-[0.8px] font-medium mb-1.5">{c.label}</div>
                  <div className="text-7xl font-bold font-mono m-1.5 text-[28px]" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-[11px] text-(--muted)">{c.sub}</div>
                </div>
              ))}
            </div>

            <div className="card mb-4">
              <div className="text-[13px] font-medium mb-1">{t('stats_pnl_chart')}</div>
              <div className="text-[12px] text-(--muted) mb-2">{t('stats_pnl_sub')}</div>
              <svg width="100%" viewBox="0 0 440 130" className="mt-2">
                {last10.length === 0 ? (
                  <text x="220" y="70" fill="#555568" fontSize="12" fontFamily="var(--font)" textAnchor="middle">{t('stats_no_data')}</text>
                ) : (
                  <>
                    {last10.map((tr, i) => {
                      const x   = startX + i * (bw + gap)
                      const h   = Math.max(4, (Math.abs(tr.pnl ?? 0) / maxAbs) * maxH)
                      const isW = (tr.pnl ?? 0) >= 0
                      const y   = isW ? 100 - h : 100
                      return (
                        <g key={tr.id}>
                          <rect x={x} y={y} width={bw} height={h} rx="4" fill={isW ? '#00d68f' : '#ff4d6d'} opacity="0.85" />
                          <text x={x + bw / 2} y="118" fill="#555568" fontSize="9" fontFamily="var(--font)" textAnchor="middle">{(tr.asset ?? '').split('/')[0].slice(0, 4)}</text>
                        </g>
                      )
                    })}
                    <line x1="0" y1="100" x2="440" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  </>
                )}
              </svg>
            </div>

            <div className="card">
              <div className="text-[13px] font-medium mb-3">{t('stats_key')}</div>
              <div className="grid grid-cols-4 gap-3">
                {keyMetrics.map((km, i) => (
                  <div key={i} className="text-center p-3.5 bg-(--surface2) rounded-lg">
                    <div className="text-5xl font-bold font-mono text-xl" style={{ fontSize: 20, color: km.color }}>{km.value}</div>
                    <div className="text-[11px] text-(--muted) mt-1">{km.label}</div>
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
