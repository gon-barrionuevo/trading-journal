'use client'

import { useState } from 'react'
import { Trade } from '@/types/trade'
import { formatPnl } from '@/lib/calculations'
import { useT } from '@/lib/lang-context'

type Props = {
  open: boolean
  onClose: () => void
  date: string | null          // "2025-04-08"
  trades: Trade[]
  onEdit: (trade: Trade) => void
  onDelete: (id: string) => void
  onNewTrade: () => void
}

export default function DayModal({ open, onClose, date, trades, onEdit, onDelete, onNewTrade }: Props) {
  const { t, locale } = useT()
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (!open || !date) return null

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString(
    locale === 'es' ? 'es-AR' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  )

  const totalPnl  = trades.reduce((s, tr) => s + (tr.pnl ?? 0), 0)
  const isBE      = Math.abs(totalPnl) <= 1
  const isWin     = !isBE && totalPnl > 0
  const isLoss    = !isBE && totalPnl < 0

  const accentColor = isWin ? 'var(--green)' : isLoss ? 'var(--red)' : '#f5c400'
  const accentBg    = isWin ? 'var(--green-bg)' : isLoss ? 'var(--red-bg)' : 'rgba(245,196,0,0.1)'

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.80)',
          backdropFilter: 'blur(6px)',
          zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--surface)',
            border: `1px solid ${accentColor}44`,
            borderRadius: 18,
            width: 680,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 48px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            position: 'sticky', top: 0,
            background: 'var(--surface)',
            zIndex: 10,
            borderRadius: '18px 18px 0 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize' }}>{dateLabel}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {trades.length} trade{trades.length !== 1 ? 's' : ''}
                </div>
              </div>
              {trades.length > 0 && (
                <div style={{
                  padding: '4px 12px',
                  borderRadius: 8,
                  background: accentBg,
                  border: `1px solid ${accentColor}55`,
                  fontSize: 14,
                  fontWeight: 700,
                  color: accentColor,
                }}>
                  {formatPnl(totalPnl)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { onClose(); setTimeout(onNewTrade, 100) }}
              >
                + {t('dash_new_trade')}
              </button>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {trades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Sin trades este día</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Podés registrar uno usando el botón de arriba</div>
              </div>
            ) : (
              trades.map((tr, idx) => {
                const pnl   = tr.pnl ?? 0
                const isW   = pnl > 1
                const isL   = pnl < -1
                const color = isW ? 'var(--green)' : isL ? 'var(--red)' : '#f5c400'
                const bg    = isW ? 'var(--green-bg)' : isL ? 'var(--red-bg)' : 'rgba(245,196,0,0.08)'

                return (
                  <div
                    key={tr.id}
                    style={{
                      background: 'var(--surface2)',
                      border: `1px solid var(--border)`,
                      borderRadius: 14,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Trade number pill */}
                    {trades.length > 1 && (
                      <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--muted2)', fontWeight: 500 }}>
                          Trade #{idx + 1}
                        </span>
                      </div>
                    )}

                    {/* Chart image — prominente */}
                    <div
                      style={{
                        width: '100%',
                        height: tr.image_url ? 260 : 80,
                        background: isW
                          ? 'linear-gradient(135deg,#0a150a,#102a10)'
                          : isL
                          ? 'linear-gradient(135deg,#1a0a10,#300a1a)'
                          : 'linear-gradient(135deg,#1a1500,#2a2000)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: tr.image_url ? 'zoom-in' : 'default',
                        position: 'relative',
                        overflow: 'hidden',
                        margin: trades.length > 1 ? '8px 0 0' : 0,
                      }}
                      onClick={() => tr.image_url && setLightbox(tr.image_url)}
                    >
                      {tr.image_url ? (
                        <>
                          <img
                            src={tr.image_url}
                            alt="Análisis"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {/* Zoom hint */}
                          <div style={{
                            position: 'absolute', bottom: 10, right: 10,
                            background: 'rgba(0,0,0,0.6)',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11,
                            color: '#fff',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            🔍 Ver análisis
                          </div>
                        </>
                      ) : (
                        <div style={{ color: 'var(--muted2)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 22 }}>📊</div>
                          <div>{t('journal_no_img')}</div>
                        </div>
                      )}
                    </div>

                    {/* Trade info */}
                    <div style={{ padding: '14px 16px' }}>
                      {/* Row 1: asset + pnl */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontSize: 16, fontWeight: 700 }}>{tr.asset}</div>
                          <span className={`badge badge-${tr.direction}`}>{tr.direction.toUpperCase()}</span>
                        </div>
                        <div style={{
                          fontSize: 20, fontWeight: 700, color,
                          padding: '2px 10px', borderRadius: 8,
                          background: bg,
                        }}>
                          {formatPnl(pnl)}
                        </div>
                      </div>

                      {/* Row 2: badges */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: tr.comment ? 12 : 0 }}>
                        {tr.pct != null && (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--surface3)', color: 'var(--muted)' }}>
                            Riesgo: {tr.pct}%
                          </span>
                        )}
                        {tr.rr && (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--surface3)', color: 'var(--muted)' }}>
                            R:R {tr.rr}
                          </span>
                        )}
                        {tr.patrimony != null && (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--surface3)', color: 'var(--muted)' }}>
                            Capital: ${tr.patrimony.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Comment */}
                      {tr.comment && (
                        <div style={{
                          fontSize: 13,
                          color: 'var(--muted)',
                          lineHeight: 1.6,
                          padding: '10px 12px',
                          background: 'var(--surface)',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          marginTop: 4,
                        }}>
                          {tr.comment}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 8,
                      padding: '8px 16px 14px',
                      borderTop: '1px solid var(--border)',
                    }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { onClose(); setTimeout(() => onEdit(tr), 100) }}
                      >
                        {t('journal_edit')}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDelete(tr.id)}
                      >
                        {t('journal_delete')}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Lightbox de imagen */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 400,
            cursor: 'zoom-out',
            padding: 24,
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
              cursor: 'pointer',
            }}
          >
            ×
          </button>
          <img
            src={lightbox}
            alt="Análisis"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '92vh',
              borderRadius: 'var(--radius)',
              objectFit: 'contain',
              cursor: 'default',
            }}
          />
        </div>
      )}
    </>
  )
}
