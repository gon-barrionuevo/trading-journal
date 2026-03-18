'use client'

import { useState, useEffect } from 'react'
import { Trade, NewTrade } from '@/types/trade'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editTrade?: Trade | null
  defaultPatrimony?: number
}

const emptyForm = (): NewTrade => ({
  asset: 'BTC/USDT',
  direction: 'long',
  pct: null,
  patrimony: null,
  pnl: 0,
  trade_date: new Date().toISOString().slice(0, 16),
  comment: null,
  image_url: null,
  rr: null,
})

export default function TradeModal({ open, onClose, onSaved, editTrade, defaultPatrimony }: Props) {
  const [form, setForm]       = useState<NewTrade>(emptyForm())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState<string | null>(null)
  const [pnlRaw, setPnlRaw]   = useState<string>('')

  useEffect(() => {
    if (!open) return
    if (editTrade) {
      setForm({
        asset:      editTrade.asset,
        direction:  editTrade.direction,
        pct:        editTrade.pct,
        patrimony:  editTrade.patrimony,
        pnl:        editTrade.pnl,
        trade_date: editTrade.trade_date?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
        comment:    editTrade.comment,
        image_url:  editTrade.image_url,
        rr:         editTrade.rr,
      })
      setImagePreview(editTrade.image_url)
      setPnlRaw(String(editTrade.pnl ?? ''))
    } else {
      setForm({ ...emptyForm(), patrimony: defaultPatrimony != null ? parseFloat(defaultPatrimony.toFixed(2)) : null })
      setImagePreview(null)
      setPnlRaw('')
    }
    setImageFile(null)
  }, [open, editTrade, defaultPatrimony])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Imagen muy grande (máx 5MB)'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    const { url } = await res.json()
    return url
  }

  const handleSubmit = async () => {
    if (!form.asset.trim()) { showToast('Ingresá el activo'); return }
    const parsedPnl = parseFloat(pnlRaw)
    if (pnlRaw.trim() === '' || isNaN(parsedPnl)) { showToast('Ingresá la ganancia o pérdida'); return }

    setSaving(true)
    try {
      let imageUrl = form.image_url
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const payload = { ...form, pnl: parsedPnl, image_url: imageUrl }

      if (editTrade) {
        await fetch('/api/trades', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editTrade.id, ...payload })
        })
        showToast('Trade actualizado ✓')
      } else {
        await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
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
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border2)',
            borderRadius: 16,
            width: 560, maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            padding: 28,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>
              {editTrade ? 'Editar trade' : 'Registrar nuevo trade'}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>

          {/* Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

            {/* Activo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Activo *</label>
              <input
                className="form-input"
                value={form.asset}
                onChange={e => setForm(f => ({ ...f, asset: e.target.value }))}
                placeholder="Ej: BTC/USDT"
              />
            </div>

            {/* Dirección */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Dirección</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['long', 'short'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setForm(f => ({ ...f, direction: dir }))}
                    style={{
                      flex: 1, padding: 9,
                      borderRadius: 'var(--radius-sm)',
                      border: form.direction === dir
                        ? `1px solid ${dir === 'long' ? 'var(--green)' : 'var(--red)'}`
                        : '1px solid var(--border2)',
                      background: form.direction === dir
                        ? (dir === 'long' ? 'var(--green-bg)' : 'var(--red-bg)')
                        : 'var(--surface2)',
                      color: form.direction === dir
                        ? (dir === 'long' ? 'var(--green)' : 'var(--red)')
                        : 'var(--muted)',
                      fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer'
                    }}
                  >
                    {dir === 'long' ? '↑ LONG' : '↓ SHORT'}
                  </button>
                ))}
              </div>
            </div>

            {/* % Riesgo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                % capital arriesgado <span style={{ color: 'var(--muted2)', fontWeight: 400 }}>— riesgo real</span>
              </label>
              <input
                className="form-input"
                type="number"
                step="0.1"
                value={form.pct ?? ''}
                onChange={e => setForm(f => ({ ...f, pct: e.target.value ? parseFloat(e.target.value) : null }))}
                placeholder="Ej: 1 = arriesgás 1% de tu capital"
              />
            </div>

            {/* Patrimonio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                Patrimonio antes del trade <span style={{ color: 'var(--green)', fontWeight: 400 }}>— auto</span>
              </label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                value={form.patrimony ?? ''}
                onChange={e => setForm(f => ({ ...f, patrimony: e.target.value ? parseFloat(e.target.value) : null }))}
                placeholder="Se carga automáticamente"
                style={{ color: 'var(--muted)' }}
              />
            </div>

            {/* Ganancia/Pérdida — full width */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                Ganancia / Pérdida (USD) * <span style={{ color: 'var(--muted2)', fontWeight: 400 }}>— cuánto ganaste o perdiste</span>
              </label>
              <input
                className="form-input"
                type="text"
                inputMode="decimal"
                value={pnlRaw}
                onChange={e => {
                  const val = e.target.value
                  // Allow: digits, dot, comma, leading minus, in-progress decimals like "0." or "-0."
                  if (val === '' || val === '-' || /^-?\d*[.,]?\d*$/.test(val)) {
                    setPnlRaw(val.replace(',', '.'))
                  }
                }}
                placeholder="Ej: +120 si ganaste · -45 si perdiste · 0 para Break Even"
              />
            </div>

            {/* Fecha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Fecha y hora</label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.trade_date ?? ''}
                onChange={e => setForm(f => ({ ...f, trade_date: e.target.value }))}
              />
            </div>

            {/* Imagen — full width */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Imagen del chart / análisis</label>
              <div style={{
                border: '1.5px dashed var(--border2)', borderRadius: 'var(--radius)',
                padding: 24, textAlign: 'center', cursor: 'pointer', position: 'relative',
                transition: 'border-color 0.15s'
              }}>
                <input
                  type="file" accept="image/*"
                  onChange={handleImage}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                <div style={{ fontSize: 24, marginBottom: 8 }}>🖼</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Arrastrá o hacé clic para subir tu screenshot</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 4 }}>PNG, JPG hasta 5MB</div>
              </div>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" style={{
                  width: '100%', height: 140, objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)', marginTop: 8
                }} />
              )}
            </div>

            {/* Comentario — full width */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Análisis / Comentario</label>
              <textarea
                className="form-textarea"
                value={form.comment ?? ''}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="¿Por qué entraste? ¿Qué salió bien o mal? ¿Qué aprendiste?"
              />
            </div>

          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : editTrade ? '✓ Guardar cambios' : '✓ Guardar trade'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast show`} style={{ zIndex: 200 }}>
          <span>✓</span><span>{toast}</span>
        </div>
      )}
    </>
  )
}
