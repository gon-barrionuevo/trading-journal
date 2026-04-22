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
        className="fixed inset-0 bg-black/82 backdrop-blur-sm z-[200] flex items-center justify-center p-2"
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          className="modal-mobile-full bg-[var(--surface)] rounded-[18px] w-[680px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-32px)] overflow-y-auto flex flex-col"
          style={{
            border: `1px solid ${accentBorder}`,
          }}
        >
          {/* Header — sticky */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-2.5 sticky top-0 bg-[var(--surface)] z-10 rounded-t-[18px] flex-wrap">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="min-w-0">
                <div className="text-sm font-semibold capitalize whitespace-nowrap overflow-hidden text-ellipsis">
                  {dateLabel}
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">
                  {trades.length === 0
                    ? locale === 'es' ? 'Sin trades' : 'No trades'
                    : `${trades.length} trade${trades.length !== 1 ? 's' : ''}`}
                </div>
              </div>
              {trades.length > 0 && (
                <div className="p-1 px-2.5 rounded text-sm font-bold font-mono flex-shrink-0" style={{
                  background: accentBg,
                  border: `1px solid ${accentBorder}`,
                  color: accentColor,
                }}>
                  {formatPnl(totalPnl)}
                </div>
              )}
            </div>

            <div className="flex gap-1.5 items-center flex-shrink-0">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { onClose(); setTimeout(onNewTrade, 120) }}
              >
                + {t('dash_new_trade')}
              </button>
              <button
                onClick={onClose}
                className="bg-none border-0 text-[var(--muted)] text-2xl cursor-pointer leading-none p-0 px-1 flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 flex flex-col gap-4">
            {trades.length === 0 ? (
              <div className="text-center py-10 text-[var(--muted)]">
                <div className="text-4xl mb-2.5">📅</div>
                <div className="text-sm font-medium mb-1.5 text-[var(--text)]">
                  {locale === 'es' ? 'Sin trades este día' : 'No trades this day'}
                </div>
                <div className="text-xs">
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
                    className="bg-[var(--surface2)] border border-[var(--border)] rounded-3xl overflow-hidden"
                  >
                    {/* Trade # label si hay varios */}
                    {trades.length > 1 && (
                      <div className="px-3.5 pt-2 text-[11px] text-[var(--muted2)] font-medium">
                        Trade #{idx + 1}
                      </div>
                    )}

                    {/* ── Imágenes del análisis ── */}
                    {(tr.image_url_macro || tr.image_url_micro) ? (
                      <div className="grid grid-cols-2 gap-2 p-2" style={{ background: imgBg }}>
                        {/* MACRO */}
                        <div
                          className={`cursor-pointer relative overflow-hidden flex items-center justify-center rounded-lg ${!tr.image_url_macro ? 'opacity-40' : ''}`}
                          style={{ height: 160 }}
                          onClick={() => tr.image_url_macro && setLightbox(tr.image_url_macro)}
                        >
                          {tr.image_url_macro ? (
                            <>
                              <img src={tr.image_url_macro} alt="MACRO" className="w-full h-full object-cover" />
                              <div className="absolute top-2 left-2 bg-black/75 rounded text-[10px] text-white px-1.5 py-0.5 font-medium uppercase tracking-wider">
                                MACRO
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black/65 rounded text-xs text-white flex items-center gap-1 px-2 py-0.75 pointer-events-none">
                                🔍
                              </div>
                            </>
                          ) : (
                            <div className="text-[var(--muted2)] text-xs flex flex-col items-center gap-1">
                              <span className="text-3xl">📊</span>
                              <span className="text-[10px]">MACRO</span>
                            </div>
                          )}
                        </div>

                        {/* MICRO */}
                        <div
                          className={`cursor-pointer relative overflow-hidden flex items-center justify-center rounded-lg ${!tr.image_url_micro ? 'opacity-40' : ''}`}
                          style={{ height: 160 }}
                          onClick={() => tr.image_url_micro && setLightbox(tr.image_url_micro)}
                        >
                          {tr.image_url_micro ? (
                            <>
                              <img src={tr.image_url_micro} alt="MICRO" className="w-full h-full object-cover" />
                              <div className="absolute top-2 left-2 bg-black/75 rounded text-[10px] text-white px-1.5 py-0.5 font-medium uppercase tracking-wider">
                                MICRO
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black/65 rounded text-xs text-white flex items-center gap-1 px-2 py-0.75 pointer-events-none">
                                🔍
                              </div>
                            </>
                          ) : (
                            <div className="text-[var(--muted2)] text-xs flex flex-col items-center gap-1">
                              <span className="text-3xl">🔍</span>
                              <span className="text-[10px]">MICRO</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="w-full cursor-pointer relative overflow-hidden flex items-center justify-center"
                        style={{
                          height: 64,
                          background: imgBg,
                          marginTop: trades.length > 1 ? 8 : 0,
                        }}
                      >
                        <div className="text-[var(--muted2)] text-xs flex flex-col items-center gap-1">
                          <span className="text-5xl">📊</span>
                          <span>{t('journal_no_img')}</span>
                        </div>
                      </div>
                    )}

                    {/* Info del trade */}
                    <div className="p-3.5">
                      {/* Asset + PnL */}
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold">{tr.asset}</span>
                          <span className={`badge badge-${tr.direction}`}>{tr.direction.toUpperCase()}</span>
                        </div>
                        <div className="text-lg font-bold rounded text-sm p-0.5 px-2.5 font-mono" style={{
                          color,
                          background: bg,
                        }}>
                          {formatPnl(pnl)}
                        </div>
                      </div>

                      {/* Badges secundarios */}
                      <div className={`flex gap-1.5 flex-wrap ${tr.comment ? 'mb-2.5' : ''}`}>
                        {tr.pct != null && (
                          <span className="text-[11px] px-1.75 py-0.75 rounded bg-[var(--surface3)] text-[var(--muted)]">
                            {locale === 'es' ? 'Riesgo' : 'Risk'}: {tr.pct}%
                          </span>
                        )}
                        {tr.rr && (
                          <span className="text-[11px] px-1.75 py-0.75 rounded bg-[var(--surface3)] text-[var(--muted)]">
                            R:R {tr.rr}
                          </span>
                        )}
                        {tr.patrimony != null && (
                          <span className="text-[11px] px-1.75 py-0.75 rounded bg-[var(--surface3)] text-[var(--muted)]">
                            ${tr.patrimony.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Comentario */}
                      {tr.comment && (
                        <div className="text-sm text-[var(--muted)] leading-relaxed p-2.75 bg-[var(--surface)] rounded border border-[var(--border)] mt-2.5">
                          {tr.comment}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 p-2 pt-0 border-t border-[var(--border)]">
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
          className="fixed inset-0 bg-black/96 z-[400] cursor-zoom-out p-4 flex items-center justify-center"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 bg-[var(--surface2)] border border-[var(--border2)] text-[var(--muted)] text-xl w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
          <img
            src={lightbox}
            alt="Análisis"
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[92vh] rounded object-contain cursor-default"
          />
        </div>
      )}
    </>
  )
}
