'use client'

import { useEffect, useState } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics, formatMoney, formatPnl } from '@/lib/calculations'
import { useT } from '@/lib/lang-context'
import { useAccount } from '@/lib/account-context'

export default function Stats() {
  const { t } = useT()
  const { activeAccount } = useAccount()
  const [trades, setTrades]   = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeAccount) return
    setLoading(true)
    const load = async () => {
      const res  = await fetch(`/api/trades?account_id=${activeAccount.id}`)
      const data = await res.json()
      setTrades(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [activeAccount])

  const m = calcMetrics(trades, activeAccount?.initial_capital ?? 0)

  const last10 = [...trades]
    .sort((a, b) => new Date(b.trade_date ?? b.created_at).getTime() - new Date(a.trade_date ?? a.created_at).getTime())
    .slice(0, 10).reverse()

  const maxAbs = Math.max(...last10.map(tr => Math.abs(tr.pnl ?? 0)), 1)
  const bw = 30, gap = 14
  const totalW = last10.length * (bw + gap) - gap
  const startX = (440 - totalW) / 2
  const maxH   = 80

  // ── Estadísticas de "Seguí el plan" ──────────────────────────────────────
  const tradesWithPlan = trades.filter(t => t.followed_plan !== null)
  const followedYes    = trades.filter(t => t.followed_plan === true)
  const followedNo     = trades.filter(t => t.followed_plan === false)
  const planRate       = tradesWithPlan.length ? Math.round((followedYes.length / tradesWithPlan.length) * 100) : null

  // PnL promedio siguiendo el plan vs no
  const avgPnlYes = followedYes.length
    ? followedYes.reduce((s, t) => s + t.pnl, 0) / followedYes.length
    : null
  const avgPnlNo = followedNo.length
    ? followedNo.reduce((s, t) => s + t.pnl, 0) / followedNo.length
    : null

  const statCards = [
    { label: t('stats_patrimony'), value: formatMoney(m.patrimonio),  sub: `${t('stats_initial')}: ${formatMoney(m.baseCapital)}`,  color: m.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: t('stats_net_gain'), value: formatPnl(m.totalPnl),       sub: `${m.pctChange.toFixed(2)}% ${t('stats_over_cap')}`,     color: m.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: t('stats_avg'),      value: m.avgWin ? formatMoney(m.avgWin) : '—', sub: `${t('stats_avg_loss')}: ${m.avgLoss ? formatMoney(m.avgLoss) : '—'}`, color: 'var(--amber)' },
    { label: t('stats_avg_risk'), value: m.avgRisk != null ? `${m.avgRisk.toFixed(2)}%` : '—', sub: t('stats_avg_risk_sub'), color: 'var(--accent2)' },
    { label: t('stats_max_risk'), value: m.maxRiskTrade ? `${m.maxRiskTrade.pct?.toFixed(2)}%` : '—', sub: m.maxRiskTrade?.asset ?? t('stats_max_risk_sub'), color: 'var(--red)' },
    { label: t('stats_min_risk'), value: m.minRiskTrade ? `${m.minRiskTrade.pct?.toFixed(2)}%` : '—', sub: m.minRiskTrade?.asset ?? t('stats_min_risk_sub'), color: 'var(--green)' },
  ]

  const keyMetrics = [
    { label: t('stats_avg_win'),   value: m.avgWin  ? formatMoney(m.avgWin)  : '—', color: 'var(--green)'   },
    { label: t('stats_avg_loss2'), value: m.avgLoss ? formatMoney(m.avgLoss) : '—', color: 'var(--red)'     },
    { label: t('stats_pf'),        value: m.pf === null ? '—' : m.pf === Infinity ? '∞' : m.pf.toFixed(2),  color: 'var(--amber)'   },
    { label: t('stats_rr'),        value: (m.avgWin && m.avgLoss) ? `1:${(m.avgWin / m.avgLoss).toFixed(1)}` : '—', color: 'var(--accent2)' },
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
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3.5 mb-6">
              {statCards.map((c, i) => (
                <div key={i} className="card">
                  <div className="text-[11px] text-[var(--muted)] uppercase tracking-[0.8px] font-medium mb-1.5">{c.label}</div>
                  <div className="font-bold font-mono mb-1.5 text-[28px]" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-[11px] text-[var(--muted)]">{c.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Seguí el plan ───────────────────────────────────────────── */}
            <div className="card mb-4">
              <div className="text-[13px] font-medium mb-1">Disciplina — Seguí el plan</div>
              <div className="text-[12px] text-[var(--muted)] mb-4">
                {tradesWithPlan.length} de {trades.length} trades registrados
              </div>

              {tradesWithPlan.length === 0 ? (
                <div className="text-center py-6 text-[var(--muted)] text-[13px]">
                  Todavía no registraste si seguiste el plan en tus trades
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {/* Porcentaje general */}
                  <div className="text-center p-4 rounded-[var(--radius-sm)]" style={{ background: 'var(--surface2)' }}>
                    <div
                      className="text-[32px] font-bold font-mono mb-1"
                      style={{ color: (planRate ?? 0) >= 70 ? 'var(--green)' : (planRate ?? 0) >= 50 ? 'var(--amber)' : 'var(--red)' }}
                    >
                      {planRate}%
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">Disciplina</div>
                  </div>

                  {/* Siguió el plan */}
                  <div className="text-center p-4 rounded-[var(--radius-sm)]" style={{ background: 'var(--green-bg)', border: '1px solid rgba(0,214,143,0.2)' }}>
                    <div className="text-[28px] font-bold font-mono mb-1 text-[var(--green)]">
                      {followedYes.length}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">✓ Siguió el plan</div>
                    {avgPnlYes !== null && (
                      <div className="text-[11px] mt-1" style={{ color: avgPnlYes >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        Prom: {formatPnl(avgPnlYes)}
                      </div>
                    )}
                  </div>

                  {/* No siguió el plan */}
                  <div className="text-center p-4 rounded-[var(--radius-sm)]" style={{ background: 'var(--red-bg)', border: '1px solid rgba(255,77,109,0.2)' }}>
                    <div className="text-[28px] font-bold font-mono mb-1 text-[var(--red)]">
                      {followedNo.length}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">✕ No siguió el plan</div>
                    {avgPnlNo !== null && (
                      <div className="text-[11px] mt-1" style={{ color: avgPnlNo >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        Prom: {formatPnl(avgPnlNo)}
                      </div>
                    )}
                  </div>

                  {/* Impacto */}
                  <div className="text-center p-4 rounded-[var(--radius-sm)]" style={{ background: 'var(--surface2)' }}>
                    <div
                      className="text-[28px] font-bold font-mono mb-1"
                      style={{ color: 'var(--accent2)' }}
                    >
                      {avgPnlYes !== null && avgPnlNo !== null
                        ? formatPnl(avgPnlYes - avgPnlNo)
                        : '—'}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">Ventaja del plan</div>
                    <div className="text-[10px] text-[var(--muted2)] mt-1">prom. con plan vs sin plan</div>
                  </div>
                </div>
              )}

              {/* Barra visual */}
              {tradesWithPlan.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-[var(--muted)] mb-1.5">
                    <span>✓ Siguió ({followedYes.length})</span>
                    <span>✕ No siguió ({followedNo.length})</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${planRate}%`,
                        background: 'var(--green)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PnL chart */}
            <div className="card mb-4">
              <div className="text-[13px] font-medium mb-1">{t('stats_pnl_chart')}</div>
              <div className="text-[12px] text-[var(--muted)] mb-2">{t('stats_pnl_sub')}</div>
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
                          {/* Indicador de si siguió el plan */}
                          {tr.followed_plan !== null && (
                            <text
                              x={x + bw / 2} y={isW ? y - 4 : y + h + 10}
                              fill={tr.followed_plan ? '#00d68f' : '#ff4d6d'}
                              fontSize="8" textAnchor="middle"
                            >
                              {tr.followed_plan ? '✓' : '✕'}
                            </text>
                          )}
                          <text x={x + bw / 2} y="118" fill="#555568" fontSize="9" fontFamily="var(--font)" textAnchor="middle">
                            {(tr.asset ?? '').split('/')[0].slice(0, 4)}
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
              <div className="text-[13px] font-medium mb-3">{t('stats_key')}</div>
              <div className="grid grid-cols-4 gap-3">
                {keyMetrics.map((km, i) => (
                  <div key={i} className="text-center p-3.5 rounded-lg" style={{ background: 'var(--surface2)' }}>
                    <div className="font-bold font-mono" style={{ fontSize: 20, color: km.color }}>{km.value}</div>
                    <div className="text-[11px] text-[var(--muted)] mt-1">{km.label}</div>
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