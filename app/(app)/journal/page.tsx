'use client'

import { useEffect, useState } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics, formatPnl } from '@/lib/calculations'
import TradeModal from '@/components/TradeModal'

export default function Journal() {
  const [trades, setTrades]         = useState<Trade[]>([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTrade, setEditTrade]   = useState<Trade | null>(null)
  const [lightbox, setLightbox]     = useState<Trade | null>(null)

  const fetchTrades = async () => {
    const res  = await fetch('/api/trades')
    const data = await res.json()
    setTrades(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTrades() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
  const sorted = [...trades].sort((a, b) =>
    new Date(b.trade_date ?? b.created_at).getTime() -
    new Date(a.trade_date ?? a.created_at).getTime()
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Journal</div>
          <div className="page-sub">Registro de trades con análisis visual</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTrade(null); setModalOpen(true) }}>
          + Nuevo trade
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div className="empty-state"><div className="empty-sub">Cargando...</div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>

            {sorted.map(t => {
              const pnl  = t.pnl ?? 0
              const isW  = pnl >= 0
              const dt   = t.trade_date
                ? new Date(t.trade_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'
              const bg   = isW
                ? 'linear-gradient(135deg,#0a150a,#102a10)'
                : 'linear-gradient(135deg,#1a0a10,#300a1a)'

              return (
                <div key={t.id} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s, transform 0.15s',
                }}>
                  {/* Image */}
                  <div
                    onClick={() => t.image_url && setLightbox(t)}
                    style={{
                      width: '100%', height: 140,
                      background: bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                      cursor: t.image_url ? 'zoom-in' : 'default'
                    }}
                  >
                    {t.image_url
                      ? <img src={t.image_url} alt="Chart" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ color: 'var(--muted2)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 24 }}>📊</div>
                          <div>Sin imagen</div>
                        </div>
                    }
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                      background: isW ? 'rgba(0,214,143,0.85)' : 'rgba(255,77,109,0.85)',
                      color: isW ? '#002a1e' : '#2a0010'
                    }}>
                      {formatPnl(pnl)}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.asset}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{dt}</div>
                      </div>
                      <div className={isW ? 'pnl-positive' : 'pnl-negative'} style={{ fontSize: 18, fontWeight: 700 }}>
                        {t.pct ? `${t.pct}%` : '—'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span className={`badge badge-${t.direction}`}>{t.direction.toUpperCase()}</span>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'var(--surface3)', color: 'var(--muted)' }}>
                        R: {t.pct ?? '—'}%
                      </span>
                      {t.rr && (
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'var(--surface3)', color: 'var(--muted)' }}>
                          R:R {t.rr}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.comment || 'Sin comentario.'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 12px', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditTrade(t); setModalOpen(true) }}>✎ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>✕ Eliminar</button>
                  </div>
                </div>
              )
            })}

            {/* Add card */}
            <div
              onClick={() => { setEditTrade(null); setModalOpen(true) }}
              style={{
                background: 'var(--surface)',
                border: '1px dashed var(--border2)',
                borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 280, cursor: 'pointer',
                transition: 'border-color 0.15s'
              }}
            >
              <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 10, color: 'var(--accent)' }}>+</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Agregar nuevo trade</div>
                <div style={{ fontSize: 11, marginTop: 4, color: 'var(--muted2)' }}>Con imagen y análisis</div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, cursor: 'zoom-out', padding: 24
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed', top: 20, right: 24,
              background: 'var(--surface2)', border: '1px solid var(--border2)',
              color: 'var(--muted)', fontSize: 20,
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >×</button>

          <img
            src={lightbox.image_url!}
            alt="Análisis"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 'var(--radius)', objectFit: 'contain', cursor: 'default' }}
          />

          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius-sm)', padding: '8px 16px',
            fontSize: 12, color: 'var(--muted)',
            display: 'flex', gap: 16, alignItems: 'center'
          }}>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{lightbox.asset}</span>
            <span>{lightbox.trade_date ? new Date(lightbox.trade_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
            <span className={lightbox.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatPnl(lightbox.pnl)}</span>
          </div>
        </div>
      )}

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
