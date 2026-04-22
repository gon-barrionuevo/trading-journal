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

/**
 * Retorna un objeto de formulario vacío con valores por defecto
 * @returns NewTrade con valores iniciales
 */
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
  const [form, setForm]             = useState<NewTrade>(emptyForm())
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<string | null>(null)
  const [pnlRaw, setPnlRaw]         = useState<string>('')
  const [pctAutoCalc, setPctAutoCalc] = useState(false) // indica si el % fue calculado automáticamente

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
    setPctAutoCalc(false)
  }, [open, editTrade, defaultPatrimony])

  /**
   * Muestra un mensaje de notificación temporal por 3 segundos
   * @param msg - Mensaje a mostrar en el toast
   */
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  /**
   * Maneja la selección de imagen del usuario
   * Valida el tamaño (máx 5MB) y genera preview local
   * @param e - Evento del input file
   */
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Imagen muy grande (máx 5MB)'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  /**
   * Sube la imagen al servidor mediante FormData
   * @param file - Archivo de imagen a subir
   * @returns URL de la imagen subida o null si falla
   */
  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    const { url } = await res.json()
    return url
  }

  /**
   * Maneja cambios en el input de Ganancia/Pérdida
   * - Valida formato (solo números, punto, coma, signo menos)
   * - Auto-calcula % de riesgo si es pérdida y hay patrimonio
   * - Desactiva auto-cálculo si es ganancia o se borra
   * @param e - Evento del input de PnL
   */
  const handlePnlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    // Solo permite: dígitos, punto, coma, signo menos al inicio
    if (val !== '' && val !== '-' && !/^-?\d*[.,]?\d*$/.test(val)) return

    const normalized = val.replace(',', '.')
    setPnlRaw(normalized)

    const parsed = parseFloat(normalized)

    // Auto-cálculo solo si es pérdida (negativo) y hay patrimonio cargado
    if (!isNaN(parsed) && parsed < 0 && form.patrimony && form.patrimony > 0) {
      const autoPct = parseFloat((Math.abs(parsed) / form.patrimony * 100).toFixed(2))
      setForm(f => ({ ...f, pct: autoPct }))
      setPctAutoCalc(true)
    } else {
      // Si borra el valor o pone positivo, limpia el flag pero no toca el % manual
      if (isNaN(parsed) || parsed >= 0) {
        setPctAutoCalc(false)
      }
    }
  }

  /**
   * Maneja cambios en el input de Patrimonio
   * Si hay una pérdida registrada, recalcula automáticamente el % de riesgo
   * @param e - Evento del input de patrimonio
   */
  const handlePatrimonyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const patrimony = e.target.value ? parseFloat(e.target.value) : null
    setForm(f => ({ ...f, patrimony }))

    const parsedPnl = parseFloat(pnlRaw)
    if (!isNaN(parsedPnl) && parsedPnl < 0 && patrimony && patrimony > 0) {
      const autoPct = parseFloat((Math.abs(parsedPnl) / patrimony * 100).toFixed(2))
      setForm(f => ({ ...f, patrimony, pct: autoPct }))
      setPctAutoCalc(true)
    }
  }

  /**
   * Maneja cambios en el input de % de capital arriesgado
   * Desactiva el auto-cálculo cuando el usuario edita manualmente
   * @param e - Evento del input de porcentaje
   */
  const handlePctChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPctAutoCalc(false)
    setForm(f => ({ ...f, pct: e.target.value ? parseFloat(e.target.value) : null }))
  }

  /**
   * Valida y envía el formulario al servidor
   * - Valida campos requeridos (activo, pnl)
   * - Sube imagen si fue seleccionada
   * - Realiza POST (nuevo) o PUT (edición)
   * - Muestra mensaje de éxito o error
   */
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
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          className="modal-mobile-full bg-surface border border-border2 rounded-xl w-[560px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-40px)] overflow-y-auto p-7"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-lg font-semibold">
              {editTrade ? 'Editar trade' : 'Registrar nuevo trade'}
            </div>
            <button onClick={onClose} className="bg-none border-none text-muted text-xl cursor-pointer">×</button>
          </div>

          {/* Form */}
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">

            {/* Activo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Activo *</label>
              <input
                className="form-input"
                value={form.asset}
                onChange={e => setForm(f => ({ ...f, asset: e.target.value }))}
                placeholder="Ej: BTC/USDT"
              />
            </div>

            {/* Dirección */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Dirección</label>
              <div className="flex gap-2">
                {(['long', 'short'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setForm(f => ({ ...f, direction: dir }))}
                    className={`flex-1 py-2.5 rounded-sm font-medium text-sm cursor-pointer font-[var(--font)] ${
                      form.direction === dir
                        ? dir === 'long'
                          ? 'border border-green bg-green-bg text-green'
                          : 'border border-red bg-red-bg text-red'
                        : 'border border-border2 bg-surface2 text-muted'
                    }`}
                  >
                    {dir === 'long' ? '↑ LONG' : '↓ SHORT'}
                  </button>
                ))}
              </div>
            </div>

            {/* Ganancia/Pérdida — full width, ANTES del % para que el cálculo tenga sentido visualmente */}
            <div className="col-span-full flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">
                Ganancia / Pérdida (USD) *
                <span className="text-muted2 font-normal"> — cuánto ganaste o perdiste</span>
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
              <label className="text-xs font-medium flex items-center gap-1.5">
                <span className="text-muted">% capital arriesgado</span>
                {pctAutoCalc && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/12 text-red font-semibold">
                    auto
                  </span>
                )}
              </label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                value={form.pct ?? ''}
                onChange={handlePctChange}
                placeholder="Ej: 1 = arriesgás 1% de tu capital"
                style={{
                  borderColor: pctAutoCalc ? 'rgba(255,77,109,0.4)' : undefined,
                  transition: 'border-color 0.2s',
                }}
              />
              {pctAutoCalc && form.patrimony && (
                <div className="text-[11px] text-muted2 -mt-0.5">
                  Calculado: |{pnlRaw}| ÷ {form.patrimony} × 100
                </div>
              )}
            </div>

            {/* Patrimonio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">
                Patrimonio antes del trade
                <span className="text-green font-normal"> — auto</span>
              </label>
              <input
                className="form-input text-(--muted)"
                type="number"
                step="0.01"
                value={form.patrimony ?? ''}
                onChange={handlePatrimonyChange}
                placeholder="Se carga automáticamente"
              />
            </div>

            {/* Fecha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Fecha y hora</label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.trade_date ?? ''}
                onChange={e => setForm(f => ({ ...f, trade_date: e.target.value }))}
              />
            </div>

            {/* R:R */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">R:R</label>
              <input
                className="form-input"
                value={form.rr ?? ''}
                onChange={e => setForm(f => ({ ...f, rr: e.target.value || null }))}
                placeholder="Ej: 1:2"
              />
            </div>

            {/* Imagen — full width */}
            <div className="col-span-full flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Imagen del chart / análisis</label>
              <div className="border-1.5 border-dashed border-border2 rounded-default p-6 text-center cursor-pointer relative transition-colors duration-150">
                <input
                  type="file" accept="image/*"
                  onChange={handleImage}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="text-2xl mb-2">🖼</div>
                <div className="text-xs text-muted">Arrastrá o hacé clic para subir tu screenshot</div>
                <div className="text-[11px] text-muted2 mt-1">PNG, JPG hasta 5MB</div>
              </div>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-full h-35 object-cover rounded-sm mt-2" />
              )}
            </div>

            {/* Comentario — full width */}
            <div className="col-span-full flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Análisis / Comentario</label>
              <textarea
                className="form-textarea"
                value={form.comment ?? ''}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="¿Por qué entraste? ¿Qué salió bien o mal? ¿Qué aprendiste?"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : editTrade ? '✓ Guardar cambios' : '✓ Guardar trade'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast show z-[200]">
          <span>✓</span><span>{toast}</span>
        </div>
      )}
    </>
  )
}
