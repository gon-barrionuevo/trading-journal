'use client'

import { useState } from 'react'
import { Trade } from '@/types/trade'
import { formatPnl } from '@/lib/calculations'
import { useT } from '@/lib/lang-context'

type Props = {
  open: boolean
  onClose: () => void
  date: string | null
  trades: Trade[]
  onEdit: (trade: Trade) => void
  onDelete: (id: string) => void
  onNewTrade: () => void
}

/** BE = pnl entre -0.5 y +0.5 */
function tradeStatus(pnl: number): 'win' | 'loss' | 'be' {
  if (Math.abs(pnl) <= 0.5) return 'be'
  return pnl > 0 ? 'win' : 'loss'
}

export default function DayModal({ open, onClose, date, trades, onEdit, onDelete, onNewTrade }: Props) {
  const { t, locale } = useT()
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (!open || !date) return null

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString(
    locale === 'es' ? 'es-AR' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  )

  const totalPnl = trades.reduce((s, tr) => s + (tr.pnl ?? 0), 0)
  const dayStatus = tradeStatus(totalPnl)

  const accentColor = dayStatus === 'win' ? 'var(--green)' : dayStatus === 'loss' ? 'var(--red)' : '#f5c400'
  const accentBg    = dayStatus === 'win' ? 'var(--green-bg)' : dayStatus === 'loss' ? 'var(--red-bg)' : 'rgba(245,196,0,0.1)'
  const accentBorder= dayStatus === 'win' ? 'rgba(0,214,143,0.25)' : dayStatus === 'loss' ? 'rgba(255,77,109,0.25)' : 'rgba(245,196,0,0.25)'

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(6px)',
          zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px 8px',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          className="modal-mobile-full"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${accentBorder}`,
            borderRadius: 18,
            width: 680,
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header — sticky */}
          <div style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10,
            borderRadius: '18px 18px 0 0',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {dateLabel}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                  {trades.length === 0
                    ? locale === 'es' ? 'Sin trades' : 'No trades'
                    : `${trades.length} trade${trades.length !== 1 ? 's' : ''}`}
                </div>
              </div>
              {trades.length > 0 && (
                <div style={{
                  padding: '4px 10px', borderRadius: 8, flexShrink: 0,
                  background: accentBg, border: `1px solid ${accentBorder}`,
                  fontSize: 14, fontWeight: 700, color: accentColor,
                  fontFamily: 'var(--mono)',
                }}>
                  {formatPnl(totalPnl)}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { onClose(); setTimeout(onNewTrade, 120) }}
              >
                + {t('dash_new_trade')}
              </button>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px', flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {trades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>
                  {locale === 'es' ? 'Sin trades este día' : 'No trades this day'}
                </div>
                <div style={{ fontSize: 12 }}>
                  {locale === 'es' ? 'Usá el botón de arriba para registrar uno' : 'Use the button above to log one'}
                </div>
              </div>
            ) : (
              trades.map((tr, idx) => {
                const pnl    = tr.pnl ?? 0
                const st     = tradeStatus(pnl)
                const color  = st === 'win' ? 'var(--green)' : st === 'loss' ? 'var(--red)' : '#f5c400'
                const bg     = st === 'win' ? 'var(--green-bg)' : st === 'loss' ? 'var(--red-bg)' : 'rgba(245,196,0,0.08)'
                const imgBg  = st === 'win'
                  ? 'linear-gradient(135deg,#071a09,#0d2e10)'
                  : st === 'loss'
                  ? 'linear-gradient(135deg,#1a0707,#2e0d0d)'
                  : 'linear-gradient(135deg,#1a1500,#2a2000)'

                return (
                  <div
                    key={tr.id}
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Trade # label si hay varios */}
                    {trades.length > 1 && (
                      <div style={{ padding: '8px 14px 0', fontSize: 11, color: 'var(--muted2)', fontWeight: 500 }}>
                        Trade #{idx + 1}
                      </div>
                    )}

                    {/* ── Imagen del análisis — protagonista ── */}
                    <div
                      style={{
                        width: '100%',
                        height: tr.image_url ? 220 : 64,
                        background: imgBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: tr.image_url ? 'zoom-in' : 'default',
                        position: 'relative', overflow: 'hidden',
                        marginTop: trades.length > 1 ? 8 : 0,
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
                          {/* Hint zoom */}
                          <div style={{
                            position: 'absolute', bottom: 8, right: 8,
                            background: 'rgba(0,0,0,0.65)', borderRadius: 6,
                            padding: '3px 8px', fontSize: 11, color: '#fff',
                            display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none',
                          }}>
                            🔍 {locale === 'es' ? 'Ver análisis' : 'View analysis'}
                          </div>
                        </>
                      ) : (
                        <div style={{ color: 'var(--muted2)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 20 }}>📊</span>
                          <span>{t('journal_no_img')}</span>
                        </div>
                      )}
                    </div>

                    {/* Info del trade */}
                    <div style={{ padding: '12px 14px' }}>
                      {/* Asset + PnL */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700 }}>{tr.asset}</span>
                          <span className={`badge badge-${tr.direction}`}>{tr.direction.toUpperCase()}</span>
                        </div>
                        <div style={{
                          fontSize: 18, fontWeight: 700, color,
                          padding: '2px 10px', borderRadius: 8, background: bg,
                          fontFamily: 'var(--mono)',
                        }}>
                          {formatPnl(pnl)}
                        </div>
                      </div>

                      {/* Badges secundarios */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: tr.comment ? 10 : 0 }}>
                        {tr.pct != null && (
                          <span style={{ fontSize: 11, padding: '3px 7px', borderRadius: 4, background: 'var(--surface3)', color: 'var(--muted)' }}>
                            {locale === 'es' ? 'Riesgo' : 'Risk'}: {tr.pct}%
                          </span>
                        )}
                        {tr.rr && (
                          <span style={{ fontSize: 11, padding: '3px 7px', borderRadius: 4, background: 'var(--surface3)', color: 'var(--muted)' }}>
                            R:R {tr.rr}
                          </span>
                        )}
                        {tr.patrimony != null && (
                          <span style={{ fontSize: 11, padding: '3px 7px', borderRadius: 4, background: 'var(--surface3)', color: 'var(--muted)' }}>
                            ${tr.patrimony.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Comentario */}
                      {tr.comment && (
                        <div style={{
                          fontSize: 13, color: 'var(--muted)', lineHeight: 1.6,
                          padding: '9px 11px', background: 'var(--surface)',
                          borderRadius: 8, border: '1px solid var(--border)',
                          marginTop: 10,
                        }}>
                          {tr.comment}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end', gap: 8,
                      padding: '8px 14px 12px',
                      borderTop: '1px solid var(--border)',
                    }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { onClose(); setTimeout(() => onEdit(tr), 120) }}>
                        {t('journal_edit')}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(tr.id)}>
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

      {/* ── Lightbox de imagen ───────────────────────────────────────────────── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.96)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 400, cursor: 'zoom-out', padding: 16,
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'var(--surface2)', border: '1px solid var(--border2)',
              color: 'var(--muted)', fontSize: 20, width: 36, height: 36,
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
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
              borderRadius: 'var(--radius)', objectFit: 'contain', cursor: 'default',
            }}
          />
        </div>
      )}
    </>
  )
}
