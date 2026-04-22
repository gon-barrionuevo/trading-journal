'use client'

import { useEffect, useState, useMemo } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics, formatPnl } from '@/lib/calculations'
import { useT } from '@/lib/lang-context'
import { useAccount } from '@/lib/account-context'
import TradeModal from '@/components/TradeModal'
import DayModal from '@/components/DayModal'

// ─── helpers ─────────────────────────────────────────────────────────────────

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_ES   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const DAYS_EN   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function tradeDate(tr: Trade): string {
  return (tr.trade_date ?? tr.created_at).slice(0, 10)
}

/** BE = pnl entre -0.5 y +0.5 */
function dayStatus(pnl: number): 'win' | 'loss' | 'be' {
  if (Math.abs(pnl) <= 0.5) return 'be'
  return pnl > 0 ? 'win' : 'loss'
}

function cellClasses(status: 'win' | 'loss' | 'be' | null, isToday: boolean, isWeekend: boolean): string {
  const base = 'cal-day-cell relative overflow-hidden rounded-default border px-2.5 py-2 cursor-pointer transition duration-150 min-h-18'

  if (status === 'win')  return `${base} bg-[linear-gradient(135deg,#071a09,#0d2e10)] border-[#1a5c2a]`
  if (status === 'loss') return `${base} bg-[linear-gradient(135deg,#1a0707,#2e0d0d)] border-[#5c1a1a]`
  if (status === 'be')   return `${base} bg-[linear-gradient(135deg,#1a1500,#2a2000)] border-[#5c4e00]`

  return `${base} bg-surface ${isToday ? 'border-accent' : 'border-border'} ${isWeekend ? 'opacity-45' : ''}`
}

// ─── component ───────────────────────────────────────────────────────────────

export default function Journal() {
  const { t, locale } = useT()
  const { activeAccount } = useAccount()
  const today = new Date()

  const [trades, setTrades]     = useState<Trade[]>([])
  const [loading, setLoading]   = useState(true)
  const [curMonth, setCurMonth] = useState(today.getMonth())
  const [curYear, setCurYear]   = useState(today.getFullYear())

  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [editTrade, setEditTrade]           = useState<Trade | null>(null)

  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const months = locale === 'es' ? MONTHS_ES : MONTHS_EN
  const days   = locale === 'es' ? DAYS_ES   : DAYS_EN

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchTrades = async () => {
    if (!activeAccount) {
      setLoading(false)
      return
    }
    const res  = await fetch(`/api/trades?account_id=${activeAccount.id}`)
    const data = await res.json()
    setTrades(Array.isArray(data) ? data : [])
    setLoading(false)
  }
  useEffect(() => { fetchTrades() }, [activeAccount])

  // ── derived ────────────────────────────────────────────────────────────────
  const tradesByDate = useMemo(() => {
    const map = new Map<string, Trade[]>()
    trades.forEach(tr => {
      const d = tradeDate(tr)
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(tr)
    })
    return map
  }, [trades])

  const monthPrefix = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`

  const monthTrades = useMemo(() =>
    trades.filter(tr => tradeDate(tr).startsWith(monthPrefix)),
    [trades, monthPrefix]
  )

  const monthStats = useMemo(() => {
    const totalPnl = monthTrades.reduce((s, tr) => s + (tr.pnl ?? 0), 0)
    const tradeDays = new Set(monthTrades.map(tr => tradeDate(tr))).size

    let winDays = 0, lossDays = 0, bestDay = 0, worstDay = 0
    tradesByDate.forEach((dTrades, d) => {
      if (!d.startsWith(monthPrefix)) return
      const pnl = dTrades.reduce((s, tr) => s + (tr.pnl ?? 0), 0)
      const st  = dayStatus(pnl)
      if (st === 'win')  { winDays++;  if (pnl > bestDay)   bestDay  = pnl }
      if (st === 'loss') { lossDays++; if (pnl < worstDay)  worstDay = pnl }
    })

    return {
      totalPnl, tradeDays, winDays, lossDays, bestDay, worstDay,
      winRate: tradeDays ? Math.round(winDays / tradeDays * 100) : 0,
    }
  }, [monthTrades, tradesByDate, monthPrefix])

  const m = calcMetrics(trades)

  // ── calendar ───────────────────────────────────────────────────────────────
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate()
  const firstDow    = new Date(curYear, curMonth, 1).getDay()
  const offset      = firstDow === 0 ? 6 : firstDow - 1
  const todayStr    = today.toISOString().slice(0, 10)

  // ── handlers ───────────────────────────────────────────────────────────────
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

  const handleNewTrade = () => {
    setEditTrade(null)
    setTradeModalOpen(true)
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 overflow-auto">

      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">{t('journal_title')}</div>
          <div className="page-sub">{t('journal_sub')}</div>
        </div>
        <button className="btn btn-primary" onClick={() => handleNewTrade()}>
          {t('dash_new_trade')}
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div className="empty-state"><div className="empty-sub">...</div></div>
        ) : (
          <>
            {/* ── Nav ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2.5">

              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="bg-surface border border-border2 text-text rounded-sm px-3 py-1.5 cursor-pointer text-base">‹</button>
                <div className="cal-nav-title text-lg font-bold min-w-50 text-center">
                  {months[curMonth]} {curYear}
                </div>
                <button onClick={nextMonth} className="bg-surface border border-border2 text-text rounded-sm px-3 py-1.5 cursor-pointer text-base">›</button>
              </div>

              <div className="flex gap-1.5">
                <select value={curMonth} onChange={e => setCurMonth(Number(e.target.value))}
                  className="bg-surface border border-border2 text-text rounded-sm px-2.5 py-1.5 cursor-pointer text-sm">
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={curYear} onChange={e => setCurYear(Number(e.target.value))}
                  className="bg-surface border border-border2 text-text rounded-sm px-2.5 py-1.5 cursor-pointer text-sm">
                  {Array.from({ length: 6 }, (_, i) => today.getFullYear() - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Stats del mes ─────────────────────────────────────────────── */}
            <div className="cal-stats-grid grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2 mb-5">
              {[
                {
                  label: locale === 'es' ? 'P&L del mes' : 'Monthly P&L',
                  value: formatPnl(monthStats.totalPnl),
                  valueClass: Math.abs(monthStats.totalPnl) <= 0.5 ? 'text-amber' : monthStats.totalPnl > 0 ? 'text-green' : 'text-red',
                },
                { label: locale === 'es' ? 'Días operados' : 'Trading days', value: String(monthStats.tradeDays), valueClass: 'text-text' },
                { label: 'Win rate', value: monthStats.tradeDays ? `${monthStats.winRate}%` : '—', valueClass: 'text-green' },
                { label: locale === 'es' ? 'Días ganadores' : 'Win days', value: String(monthStats.winDays), valueClass: 'text-green' },
                { label: locale === 'es' ? 'Días perdedores' : 'Loss days', value: String(monthStats.lossDays), valueClass: 'text-red' },
                {
                  label: locale === 'es' ? 'Mejor día' : 'Best day',
                  value: monthStats.bestDay ? `+$${monthStats.bestDay.toFixed(0)}` : '—',
                  valueClass: 'text-green',
                },
              ].map(s => (
                <div key={s.label} className="bg-surface border border-border rounded-default px-3 py-2.5">
                  <div className="text-xs text-muted mb-0.5 font-medium">{s.label}</div>
                  <div className={`text-base font-bold mono ${s.valueClass}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* ── Weekday headers ────────────────────────────────────────────── */}
            <div className="grid grid-cols-7 gap-0.75 mb-0.75">
              {days.map((d, i) => (
                <div key={d} className={`cal-weekday text-center text-xs font-semibold py-0.75 tracking-wide ${i >= 5 ? 'text-muted2' : 'text-muted'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* ── Calendar grid ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-7 gap-0.75">
              {/* Offset vacío */}
              {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}

              {/* Celdas de días */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr   = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayTrades = tradesByDate.get(dateStr) ?? []
                const pnl       = dayTrades.reduce((s, tr) => s + (tr.pnl ?? 0), 0)
                const status    = dayTrades.length > 0 ? dayStatus(pnl) : null
                const isToday   = dateStr === todayStr
                const dow       = new Date(dateStr + 'T12:00:00').getDay()
                const isWeekend = dow === 0 || dow === 6
                const hasImg    = dayTrades.some(tr => tr.image_url_macro || tr.image_url_micro)

                const numClass  = status === 'win' ? 'text-green-400' : status === 'loss' ? 'text-red-400' : status === 'be' ? 'text-yellow-300' : isToday ? 'text-accent' : 'text-muted'
                const pnlClass  = status === 'win' ? 'text-green-400' : status === 'loss' ? 'text-red-400' : 'text-yellow-300'
                const cntClass  = status === 'win' ? 'text-green-300' : status === 'loss' ? 'text-red-300' : 'text-yellow-200'
                const imgClass  = status ? cntClass : 'text-muted2'

                return (
                  <div
                    key={day}
                    className={cellClasses(status, isToday, isWeekend)}
                    onClick={() => openDay(dateStr)}
                  >
                    <div className={`cal-day-num text-xs font-semibold mb-0.75 ${numClass}`}>
                      {day}
                    </div>
                    {status && (
                      <div className={`cal-day-pnl text-xs font-bold leading-tight ${pnlClass}`}>
                        {pnl >= 0 ? '+' : ''}{pnl % 1 === 0 ? pnl : pnl.toFixed(1)}
                      </div>
                    )}
                    {dayTrades.length > 0 && (
                      <div className={`cal-day-count text-[10px] mt-0.5 ${cntClass}`}>
                        {dayTrades.length}t
                      </div>
                    )}
                    {hasImg && (
                      <div className={`cal-day-img absolute bottom-1.25 right-1.25 text-[9px] ${imgClass}`}>
                        📷
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Leyenda ─────────────────────────────────────────────────────── */}
            <div className="flex gap-4 mt-4 flex-wrap items-center">
              {[
                { dotClass: 'bg-[#1a5c2a]', label: locale === 'es' ? 'Ganancia' : 'Profit' },
                { dotClass: 'bg-[#5c1a1a]', label: locale === 'es' ? 'Pérdida' : 'Loss' },
                { dotClass: 'bg-[#5c4e00]', label: 'Break Even (±$0.50)' },
                { dotClass: 'bg-border', label: locale === 'es' ? 'Sin trades' : 'No trades' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.25 text-xs text-muted">
                  <div className={`w-2.5 h-2.5 rounded-[3px] border border-border2 shrink-0 ${l.dotClass}`} />
                  {l.label}
                </div>
              ))}
              <div className="text-xs text-muted ml-auto flex items-center gap-1">
                📷 {locale === 'es' ? 'Con análisis' : 'Has analysis'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── DayModal ──────────────────────────────────────────────────────────── */}
      <DayModal
        open={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        date={selectedDate}
        trades={selectedDate ? (tradesByDate.get(selectedDate) ?? []) : []}
        onEdit={handleEdit}
        onDelete={async (id) => {
          await handleDelete(id)
          const remaining = (tradesByDate.get(selectedDate ?? '') ?? []).filter(tr => tr.id !== id)
          if (remaining.length === 0) setDayModalOpen(false)
        }}
        onNewTrade={handleNewTrade}
      />

      {/* ── TradeModal ────────────────────────────────────────────────────────── */}
      <TradeModal
        open={tradeModalOpen}
        onClose={() => { setTradeModalOpen(false); setEditTrade(null) }}
        onSaved={fetchTrades}
        editTrade={editTrade}
        defaultPatrimony={m.patrimonio}
      />
    </div>
  )
}
