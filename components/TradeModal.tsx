'use client'

import { useState, useEffect } from 'react'
import { Trade, NewTrade } from '@/types/trade'
import { useAccount } from '@/lib/account-context'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editTrade?: Trade | null
  defaultPatrimony?: number
  defaultDate?: string
}

const emptyForm = (): NewTrade => ({
  asset:           'BTC/USDT',
  direction:       'long',
  pct:             null,
  patrimony:       null,
  pnl:             0,
  trade_date:      new Date().toISOString().slice(0, 16),
  comment:         null,
  image_url_macro: null,
  image_url_micro: null,
  rr:              null,
  account_id:      null,
  followed_plan:   null,
})

export default function TradeModal({ open, onClose, onSaved, editTrade, defaultPatrimony, defaultDate }: Props) {
  const { activeAccount } = useAccount()

  const [form, setForm]                     = useState<NewTrade>(emptyForm())
  const [imageMacroFile, setImageMacroFile] = useState<File | null>(null)
  const [imageMacroPreview, setImageMacroPreview] = useState<string | null>(null)
  const [imageMicroFile, setImageMicroFile] = useState<File | null>(null)
  const [imageMicroPreview, setImageMicroPreview] = useState<string | null>(null)
  const [saving, setSaving]                 = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)
  const [pnlRaw, setPnlRaw]                 = useState<string>('')
  const [pctAutoCalc, setPctAutoCalc]       = useState(false)

  useEffect(() => {
    if (!open) return
    if (editTrade) {
      setForm({
        asset:           editTrade.asset,
        direction:       editTrade.direction,
        pct:             editTrade.pct,
        patrimony:       editTrade.patrimony,
        pnl:             editTrade.pnl,
        trade_date:      editTrade.trade_date?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
        comment:         editTrade.comment,
        image_url_macro: editTrade.image_url_macro,
        image_url_micro: editTrade.image_url_micro,
        rr:              editTrade.rr,
        account_id:      editTrade.account_id,
        followed_plan:   editTrade.followed_plan,
      })
      setImageMacroPreview(editTrade.image_url_macro)
      setImageMicroPreview(editTrade.image_url_micro)
      setPnlRaw(String(editTrade.pnl ?? ''))
    } else {
      setForm({
        ...emptyForm(),
        patrimony:  defaultPatrimony != null ? parseFloat(defaultPatrimony.toFixed(2)) : null,
        trade_date: defaultDate ?? new Date().toISOString().slice(0, 16),
        account_id: activeAccount?.id ?? null,
      })
      setImageMacroPreview(null)
      setImageMicroPreview(null)
      setPnlRaw('')
    }
    setImageMacroFile(null)
    setImageMicroFile(null)
    setPctAutoCalc(false)
  }, [open, editTrade, defaultPatrimony, defaultDate, activeAccount])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleImageMacro = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Imagen muy grande (máx 5MB)'); return }
    setImageMacroFile(file)
    setImageMacroPreview(URL.createObjectURL(file))
  }

  const handleImageMicro = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Imagen muy grande (máx 5MB)'); return }
    setImageMicroFile(file)
    setImageMicroPreview(URL.createObjectURL(file))
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    const { url } = await res.json()
    return url
  }

  // Auto-cálculo % solo en pérdidas
  const handlePnlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val !== '' && val !== '-' && !/^-?\d*[.,]?\d*$/.test(val)) return
    const normalized = val.replace(',', '.')
    setPnlRaw(normalized)
    const parsed = parseFloat(normalized)
    if (!isNaN(parsed) && parsed < 0 && form.patrimony && form.patrimony > 0) {
      const autoPct = parseFloat((Math.abs(parsed) / form.patrimony * 100).toFixed(2))
      setForm(f => ({ ...f, pct: autoPct }))
      setPctAutoCalc(true)
    } else {
      if (isNaN(parsed) || parsed >= 0) setPctAutoCalc(false)
    }
  }

  const handlePatrimonyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const patrimony = e.target.value ? parseFloat(e.target.value) : null
    const parsedPnl = parseFloat(pnlRaw)
    if (!isNaN(parsedPnl) && parsedPnl < 0 && patrimony && patrimony > 0) {
      const autoPct = parseFloat((Math.abs(parsedPnl) / patrimony * 100).toFixed(2))
      setForm(f => ({ ...f, patrimony, pct: autoPct }))
      setPctAutoCalc(true)
    } else {
      setForm(f => ({ ...f, patrimony }))
    }
  }

  const handlePctChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPctAutoCalc(false)
    setForm(f => ({ ...f, pct: e.target.value ? parseFloat(e.target.value) : null }))
  }

  const handleSubmit = async () => {
    if (!form.asset.trim()) { showToast('Ingresá el activo'); return }
    const parsedPnl = parseFloat(pnlRaw)
    if (pnlRaw.trim() === '' || isNaN(parsedPnl)) { showToast('Ingresá la ganancia o pérdida'); return }

    setSaving(true)
    try {
      let imageMacroUrl = form.image_url_macro
      let imageMicroUrl = form.image_url_micro
      if (imageMacroFile) imageMacroUrl = await uploadImage(imageMacroFile)
      if (imageMicroFile) imageMicroUrl = await uploadImage(imageMicroFile)

      const payload = { ...form, pnl: parsedPnl, image_url_macro: imageMacroUrl, image_url_micro: imageMicroUrl }

      if (editTrade) {
        await fetch('/api/trades', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editTrade.id, ...payload }),
        })
        showToast('Trade actualizado ✓')
      } else {
        await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        showToast('Trade guardado ✓')
      }

      onSaved()
      onClose()
    } catch {
      showToast('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="modal-mobile-full rounded-2xl overflow-y-auto"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border2)',
            maxHeight: 'calc(100vh - 40px)',
            padding: 28,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-[17px] font-semibold">
              {editTrade ? 'Editar trade' : 'Registrar nuevo trade'}
            </div>
            <button onClick={onClose} className="bg-transparent border-none text-[var(--muted)] text-xl cursor-pointer">×</button>
          </div>

          {/* Form grid */}
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">

            {/* Activo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--muted)] font-medium">Activo *</label>
              <input className="form-input" value={form.asset} onChange={e => setForm(f => ({ ...f, asset: e.target.value }))} placeholder="Ej: BTC/USDT" />
            </div>

            {/* Dirección */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--muted)] font-medium">Dirección</label>
              <div className="flex gap-2">
                {(['long', 'short'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setForm(f => ({ ...f, direction: dir }))}
                    className="flex-1 py-2.5 rounded-[var(--radius-sm)] text-[13px] font-medium cursor-pointer transition-all"
                    style={{
                      border: form.direction === dir ? `1px solid ${dir === 'long' ? 'var(--green)' : 'var(--red)'}` : '1px solid var(--border2)',
                      background: form.direction === dir ? (dir === 'long' ? 'var(--green-bg)' : 'var(--red-bg)') : 'var(--surface2)',
                      color: form.direction === dir ? (dir === 'long' ? 'var(--green)' : 'var(--red)') : 'var(--muted)',
                    }}
                  >
                    {dir === 'long' ? '↑ LONG' : '↓ SHORT'}
                  </button>
                ))}
              </div>
            </div>

            {/* PnL — full width */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--muted)] font-medium">
                Ganancia / Pérdida (USD) *
                <span className="text-[var(--muted2)] font-normal"> — cuánto ganaste o perdiste</span>
              </label>
              <input
                className="form-input"
                type="text"
                inputMode="decimal"
                value={pnlRaw}
                onChange={handlePnlChange}
                placeholder="Ej: +120 si ganaste · -45 si perdiste · 0 para Break Even"
              />
            </div>

            {/* % Riesgo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium flex items-center gap-1.5">
                <span className="text-[var(--muted)]">% capital arriesgado</span>
                {pctAutoCalc && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--red-bg)] text-[var(--red)] font-semibold">auto</span>
                )}
              </label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                value={form.pct ?? ''}
                onChange={handlePctChange}
                placeholder="Ej: 1%"
                style={{ borderColor: pctAutoCalc ? 'rgba(255,77,109,0.4)' : undefined }}
              />
              {pctAutoCalc && form.patrimony && (
                <div className="text-[11px] text-[var(--muted2)] -mt-1">
                  Calculado: |{pnlRaw}| ÷ {form.patrimony} × 100
                </div>
              )}
            </div>

            {/* Patrimonio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--muted)] font-medium">
                Patrimonio antes del trade
                <span className="text-[var(--green)] font-normal"> — auto</span>
              </label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                value={form.patrimony ?? ''}
                onChange={handlePatrimonyChange}
                placeholder="Se carga automáticamente"
                style={{ color: 'var(--muted)' }}
              />
            </div>

            {/* Fecha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--muted)] font-medium">Fecha y hora</label>
              <input className="form-input" type="datetime-local" value={form.trade_date ?? ''} onChange={e => setForm(f => ({ ...f, trade_date: e.target.value }))} />
            </div>

            {/* R:R */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--muted)] font-medium">R:R</label>
              <input className="form-input" value={form.rr ?? ''} onChange={e => setForm(f => ({ ...f, rr: e.target.value || null }))} placeholder="Ej: 1:2" />
            </div>

            {/* ── Seguí el plan — checkbox simple ── */}
            <div className="col-span-2">
              <label className="text-[12px] text-[var(--muted)] font-medium mb-2 block">
                Disciplina
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, followed_plan: f.followed_plan === true ? null : true }))}
                  className="flex-1 py-2.5 px-4 rounded-[var(--radius-sm)] text-[13px] font-medium cursor-pointer transition-all border flex items-center justify-center gap-2"
                  style={{
                    border: form.followed_plan === true ? '1px solid var(--green)' : '1px solid var(--border2)',
                    background: form.followed_plan === true ? 'var(--green-bg)' : 'var(--surface2)',
                    color: form.followed_plan === true ? 'var(--green)' : 'var(--muted)',
                  }}
                >
                  <span className="text-base">{form.followed_plan === true ? '✓' : '○'}</span>
                  <span>Seguí el plan</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, followed_plan: f.followed_plan === false ? null : false }))}
                  className="flex-1 py-2.5 px-4 rounded-[var(--radius-sm)] text-[13px] font-medium cursor-pointer transition-all border flex items-center justify-center gap-2"
                  style={{
                    border: form.followed_plan === false ? '1px solid var(--red)' : '1px solid var(--border2)',
                    background: form.followed_plan === false ? 'var(--red-bg)' : 'var(--surface2)',
                    color: form.followed_plan === false ? 'var(--red)' : 'var(--muted)',
                  }}
                >
                  <span className="text-base">{form.followed_plan === false ? '✕' : '○'}</span>
                  <span>No seguí el plan</span>
                </button>
              </div>
              {form.followed_plan === null && (
                <div className="text-[11px] text-[var(--muted)] mt-1.5">
                  Opcional — ¿Seguiste tu plan de trading en esta operación?
                </div>
              )}
            </div>

            {/* Imágenes — full width */}
            <div className="col-span-2">
              <label className="text-[12px] text-[var(--muted)] font-medium mb-2 block">Imágenes del análisis</label>
              <div className="grid grid-cols-2 gap-3">
                {/* MACRO */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] text-[var(--muted2)] font-medium uppercase tracking-wider">MACRO (D/H4)</div>
                  <div className="relative border-[1.5px] border-dashed border-[var(--border2)] rounded-[var(--radius-sm)] p-4 text-center cursor-pointer transition-all hover:border-[var(--accent)]">
                    <input type="file" accept="image/*" onChange={handleImageMacro} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="text-xl mb-1">📊</div>
                    <div className="text-[11px] text-[var(--muted)]">MACRO</div>
                  </div>
                  {imageMacroPreview && (
                    <img src={imageMacroPreview} alt="Preview MACRO" className="w-full h-[100px] object-cover rounded-[var(--radius-sm)]" />
                  )}
                </div>

                {/* MICRO */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] text-[var(--muted2)] font-medium uppercase tracking-wider">MICRO (H1/M15)</div>
                  <div className="relative border-[1.5px] border-dashed border-[var(--border2)] rounded-[var(--radius-sm)] p-4 text-center cursor-pointer transition-all hover:border-[var(--accent)]">
                    <input type="file" accept="image/*" onChange={handleImageMicro} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="text-xl mb-1">🔍</div>
                    <div className="text-[11px] text-[var(--muted)]">MICRO</div>
                  </div>
                  {imageMicroPreview && (
                    <img src={imageMicroPreview} alt="Preview MICRO" className="w-full h-[100px] object-cover rounded-[var(--radius-sm)]" />
                  )}
                </div>
              </div>
            </div>

            {/* Comentario — full width */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--muted)] font-medium">Análisis / Comentario</label>
              <textarea
                className="form-textarea"
                value={form.comment ?? ''}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="¿Por qué entraste? ¿Qué salió bien o mal? ¿Qué aprendiste?"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-[var(--border)]">
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : editTrade ? '✓ Guardar cambios' : '✓ Guardar trade'}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast show" style={{ zIndex: 300 }}>
          <span>✓</span><span>{toast}</span>
        </div>
      )}
    </>
  )
}
