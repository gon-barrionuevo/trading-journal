'use client'

import { useEffect, useState, useMemo } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics, formatPnl } from '@/lib/calculations'
import { useT } from '@/lib/lang-context'
import TradeModal from '@/components/TradeModal'
import DayModal from '@/components/DayModal'

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_ES   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const DAYS_EN   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function tradeDate(tr: Trade): string {
  return (tr.trade_date ?? tr.created_at).slice(0, 10)
}

// Returns "win" | "loss" | "be" | "none"
function dayStatus(pnl: number): 'win' | 'loss' | 'be' {
  if (Math.abs(pnl) <= 1) return 'be'
  return pnl > 0 ? 'win' : 'loss'
}

// ─── component ──────────────────────────────────────────────────────────────

export default function Journal() {
  const { t, locale } = useT()
  const today = new Date()

  const [trades, setTrades]         = useState<Trade[]>([])
  const [loading, setLoading]       = useState(true)
  const [curMonth, setCurMonth]     = useState(today.getMonth())
  const [curYear, setCurYear]       = useState(today.getFullYear())

  // TradeModal (crear / editar)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [editTrade, setEditTrade]           = useState<Trade | null>(null)
  const [defaultDate, setDefaultDate]       = useState<string | undefined>(undefined)

  // DayModal
  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const months = locale === 'es' ? MONTHS_ES : MONTHS_EN
  const days   = locale === 'es' ? DAYS_ES   : DAYS_EN

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchTrades = async () => {
    const res  = await fetch('/api/trades')
    const data = await res.json()
    setTrades(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchTrades() }, [])

  // ── derived data ─────────────────────────────────────────────────────────

  // Agrupa trades por fecha "YYYY-MM-DD"
  const tradesByDate = useMemo(() => {
    const map = new Map<string, Trade[]>()
    trades.forEach(tr => {
      const d = tradeDate(tr)
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(tr)
    })
    return map
  }, [trades])

  // Trades del mes visible
  const monthTrades = useMemo(() => {
    const prefix = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`
    return trades.filter(tr => tradeDate(tr).startsWith(prefix))
  }, [trades, curMonth, curYear])

  // Stats del mes
  const monthStats = useMemo(() => {
    const totalPnl  = monthTrades.reduce((s, tr) => s + (tr.pnl ?? 0), 0)
    const tradeDays = new Set(monthTrades.map(tr => tradeDate(tr))).size
    const winDays   = [...new Set(monthTrades.map(tr => tradeDate(tr)))]
      .filter(d => {
        const pnl = (tradesByDate.get(d) ?? []).reduce((s, tr) => s + (tr.pnl ?? 0), 0)
        return pnl > 1
      }).length
    const lossDays = [...new Set(monthTrades.map(tr => tradeDate(tr)))]
      .filter(d => {
        const pnl = (tradesByDate.get(d) ?? []).reduce((s, tr) => s + (tr.pnl ?? 0), 0)
        return pnl < -1
      }).length

    let bestDay = 0
    tradesByDate.forEach((dTrades, d) => {
      if (!d.startsWith(`${curYear}-${String(curMonth + 1).padStart(2, '0')}`)) return
      const pnl = dTrades.reduce((s, tr) => s + (tr.pnl ?? 0), 0)
      if (pnl > bestDay) bestDay = pnl
    })

    return { totalPnl, tradeDays, winDays, lossDays, bestDay, winRate: tradeDays ? Math.round(winDays / tradeDays * 100) : 0 }
  }, [monthTrades, tradesByDate, curMonth, curYear])

  const m = calcMetrics(trades)

  // ── calendar grid ─────────────────────────────────────────────────────────
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate()
  const firstDow    = new Date(curYear, curMonth, 1).getDay()
  // Convert Sunday=0 to Monday=0
  const offset      = firstDow === 0 ? 6 : firstDow - 1

  // ── handlers ──────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1) }
    else setCurMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1) }
    else setCurMonth(m => m + 1)
  }

  const openDay = (dateStr: string) => {
    setSelectedDate(dateStr)
    setDayModalOpen(true)
  }

  const handleEdit = (trade: Trade) => {
    setEditTrade(trade)
    setTradeModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este trade?')) return
    await fetch('/api/trades', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchTrades()
  }

  const handleNewTrade = (dateStr?: string) => {
    setEditTrade(null)
    setDefaultDate(dateStr)
    setTradeModalOpen(true)
  }

  // ── styles helpers ────────────────────────────────────────────────────────
  const cellStyle = (status: 'win' | 'loss' | 'be' | null, isToday: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      minHeight: 80,
      padding: '8px 10px',
      cursor: 'pointer',
      transition: 'border-color 0.15s, transform 0.1s',
      position: 'relative',
      overflow: 'hidden',
    }
    if (status === 'win')  return { ...base, background: 'linear-gradient(135deg,#071a09,#0d2e10)', borderColor: '#1a5c2a' }
    if (status === 'loss') return { ...base, background: 'linear-gradient(135deg,#1a0707,#2e0d0d)', borderColor: '#5c1a1a' }
    if (status === 'be')   return { ...base, background: 'linear-gradient(135deg,#1a1500,#2a2000)', borderColor: '#5c4e00' }
    return { ...base, background: 'var(--surface)', borderColor: isToday ? 'var(--accent)' : 'var(--border)' }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">{t('journal_title')}</div>
          <div className="page-sub">{t('journal_sub')}</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleNewTrade()}
        >
          {t('dash_new_trade')}
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div className="empty-state"><div className="empty-sub">...</div></div>
        ) : (
          <>
            {/* ── Calendar nav ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={prevMonth}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}
                >
                  ‹
                </button>
                <div style={{ fontSize: 20, fontWeight: 700, minWidth: 200, textAlign: 'center' }}>
                  {months[curMonth]} {curYear}
                </div>
                <button
                  onClick={nextMonth}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}
                >
                  ›
                </button>
              </div>

              {/* Month/Year selects */}
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={curMonth}
                  onChange={e => setCurMonth(Number(e.target.value))}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                  value={curYear}
                  onChange={e => setCurYear(Number(e.target.value))}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                >
                  {Array.from({ length: 6 }, (_, i) => today.getFullYear() - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Month stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 24 }}>
              {[
                { label: locale === 'es' ? 'P&L del mes' : 'Monthly P&L', value: formatPnl(monthStats.totalPnl), color: monthStats.totalPnl > 1 ? 'var(--green)' : monthStats.totalPnl < -1 ? 'var(--red)' : '#f5c400' },
                { label: locale === 'es' ? 'Días operados' : 'Trading days', value: String(monthStats.tradeDays), color: 'var(--text)' },
                { label: 'Win rate', value: monthStats.tradeDays ? `${monthStats.winRate}%` : '—', color: 'var(--green)' },
                { label: locale === 'es' ? 'Días ganadores' : 'Win days', value: String(monthStats.winDays), color: 'var(--green)' },
                { label: locale === 'es' ? 'Días perdedores' : 'Loss days', value: String(monthStats.lossDays), color: 'var(--red)' },
                { label: locale === 'es' ? 'Mejor día' : 'Best day', value: monthStats.bestDay ? `+$${monthStats.bestDay.toFixed(0)}` : '—', color: 'var(--green)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* ── Weekday headers ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              {days.map((d, i) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: i >= 5 ? 'var(--muted2)' : 'var(--muted)', padding: '4px 0', letterSpacing: '0.05em' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* ── Calendar grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {/* Empty cells before first day */}
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr  = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayTrades = tradesByDate.get(dateStr) ?? []
                const pnl      = dayTrades.reduce((s, tr) => s + (tr.pnl ?? 0), 0)
                const status   = dayTrades.length > 0 ? dayStatus(pnl) : null
                const isToday  = dateStr === today.toISOString().slice(0, 10)
                const isWeekend = (() => { const dow = new Date(dateStr + 'T12:00:00').getDay(); return dow === 0 || dow === 6 })()

                return (
                  <div
                    key={day}
                    style={{
                      ...cellStyle(status, isToday),
                      opacity: isWeekend && !status ? 0.5 : 1,
                    }}
                    onClick={() => openDay(dateStr)}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
                  >
                    {/* Day number */}
                    <div style={{
                      fontSize: 12, fontWeight: 600,
                      color: status === 'win' ? '#4ade80' : status === 'loss' ? '#f87171' : status === 'be' ? '#fde047' : isToday ? 'var(--accent)' : 'var(--muted)',
                      marginBottom: 4,
                    }}>
                      {day}
                    </div>

                    {/* PnL */}
                    {status && (
                      <div style={{
                        fontSize: 12, fontWeight: 700,
                        color: status === 'win' ? '#4ade80' : status === 'loss' ? '#f87171' : '#fde047',
                        lineHeight: 1.2,
                      }}>
                        {pnl >= 0 ? '+' : ''}{pnl % 1 === 0 ? pnl : pnl.toFixed(1)}
                      </div>
                    )}

                    {/* Trade count */}
                    {dayTrades.length > 0 && (
                      <div style={{
                        fontSize: 10,
                        color: status === 'win' ? '#86efac' : status === 'loss' ? '#fca5a5' : '#fef08a',
                        marginTop: 2,
                      }}>
                        {dayTrades.length}t
                      </div>
                    )}

                    {/* Has image indicator */}
                    {dayTrades.some(tr => tr.image_url) && (
                      <div style={{
                        position: 'absolute', bottom: 5, right: 6,
                        fontSize: 9,
                        color: status === 'win' ? '#86efac' : status === 'loss' ? '#fca5a5' : status === 'be' ? '#fef08a' : 'var(--muted2)',
                      }}>
                        📷
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Legend ── */}
            <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { color: '#1a5c2a', label: locale === 'es' ? 'Ganancia' : 'Profit' },
                { color: '#5c1a1a', label: locale === 'es' ? 'Pérdida' : 'Loss' },
                { color: '#5c4e00', label: 'Break Even' },
                { color: 'var(--border)', label: locale === 'es' ? 'Sin trades' : 'No trades' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: '1px solid var(--border2)' }} />
                  {l.label}
                </div>
              ))}
              <div style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                📷 <span>{locale === 'es' ? 'Tiene análisis guardado' : 'Has saved analysis'}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── DayModal ── */}
      <DayModal
        open={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        date={selectedDate}
        trades={selectedDate ? (tradesByDate.get(selectedDate) ?? []) : []}
        onEdit={handleEdit}
        onDelete={async (id) => {
          await handleDelete(id)
          // Si fue el último trade del día, cerrar modal
          const remaining = (tradesByDate.get(selectedDate ?? '') ?? []).filter(tr => tr.id !== id)
          if (remaining.length === 0) setDayModalOpen(false)
        }}
        onNewTrade={() => handleNewTrade(selectedDate ? selectedDate + 'T09:00' : undefined)}
      />

      {/* ── TradeModal ── */}
      <TradeModal
        open={tradeModalOpen}
        onClose={() => { setTradeModalOpen(false); setEditTrade(null); setDefaultDate(undefined) }}
        onSaved={fetchTrades}
        editTrade={editTrade}
        defaultPatrimony={m.patrimonio}
      />
    </div>
  )
}
