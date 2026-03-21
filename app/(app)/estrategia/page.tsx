'use client'

import { useEffect, useState } from 'react'

type Rule = {
  id: string
  content: string
  order_index: number
  created_at: string
}

export default function Estrategia() {
  const [rules, setRules]       = useState<Rule[]>([])
  const [loading, setLoading]   = useState(true)
  const [newText, setNewText]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [toast, setToast]       = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const res  = await fetch('/api/rules')
      const data = await res.json()
      setRules(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async () => {
    if (!newText.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newText.trim() })
      })
      const created = await res.json()
      setRules(prev => [...prev, created])
      setNewText('')
      showToast('Regla agregada ✓')
    } catch { showToast('Error al guardar') }
    finally { setSaving(false) }
  }

  const handleEditSave = async (id: string) => {
    if (!editText.trim()) return
    await fetch('/api/rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: editText.trim() })
    })
    setRules(prev => prev.map(r => r.id === id ? { ...r, content: editText.trim() } : r))
    setEditId(null)
    setEditText('')
    showToast('Regla actualizada ✓')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta regla?')) return
    await fetch('/api/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setRules(prev => prev.filter(r => r.id !== id))
    showToast('Regla eliminada')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Estrategia</div>
          <div className="page-sub">Reglas que debés cumplir antes de entrar al mercado</div>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 680 }}>

        {/* Rules list */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}>

          {loading ? (
            <div style={{ padding: '24px 20px', color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>
          ) : rules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-text">Sin reglas todavía</div>
              <div className="empty-sub">Agregá las condiciones que debés cumplir antes de operar</div>
            </div>
          ) : rules.map((rule, index) => (
            <div
              key={rule.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '16px 20px',
                borderBottom: index < rules.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Number */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(124,106,255,0.12)',
                border: '1px solid rgba(124,106,255,0.25)',
                color: 'var(--accent2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)',
                flexShrink: 0, marginTop: 1,
              }}>
                {index + 1}
              </div>

              {/* Content or edit */}
              <div style={{ flex: 1 }}>
                {editId === rule.id ? (
                  <>
                    <textarea
                      autoFocus
                      value={editText}
                      onChange={e => {
                        setEditText(e.target.value)
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEditSave(rule.id)
                        if (e.key === 'Escape') { setEditId(null); setEditText('') }
                      }}
                      style={{
                        width: '100%', background: 'var(--surface2)',
                        border: '1px solid var(--accent)',
                        borderRadius: 'var(--radius-sm)',
                        outline: 'none', fontFamily: 'var(--font)',
                        fontSize: 14, color: 'var(--text)',
                        lineHeight: 1.6, resize: 'none',
                        padding: '8px 12px', overflow: 'hidden',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => handleEditSave(rule.id)}
                        className="btn btn-primary btn-sm"
                      >Guardar</button>
                      <button
                        onClick={() => { setEditId(null); setEditText('') }}
                        className="btn btn-ghost btn-sm"
                      >Cancelar</button>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                    {rule.content}
                  </p>
                )}
              </div>

              {/* Actions */}
              {editId !== rule.id && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => { setEditId(rule.id); setEditText(rule.content) }}
                    title="Editar"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px', fontSize: 13 }}
                  >✏️</button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    title="Eliminar"
                    className="btn btn-danger btn-sm"
                    style={{ padding: '4px 8px', fontSize: 13 }}
                  >🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new rule */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px 20px',
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 10 }}>
            Nueva regla
          </div>
          <textarea
            value={newText}
            onChange={e => {
              setNewText(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.max(80, e.target.scrollHeight) + 'px'
            }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd() }}
            placeholder="Ej: Esperar confirmación de estructura en timeframe mayor antes de entrar..."
            style={{
              width: '100%', background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none', fontFamily: 'var(--font)',
              fontSize: 14, color: 'var(--text)',
              lineHeight: 1.6, resize: 'none', height: 80,
              padding: '10px 12px', overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border2)')}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--muted2)' }}>Cmd+Enter para guardar</span>
            <button
              onClick={handleAdd}
              disabled={saving || !newText.trim()}
              className="btn btn-primary btn-sm"
              style={{ opacity: saving || !newText.trim() ? 0.5 : 1 }}
            >
              {saving ? 'Guardando...' : '+ Agregar regla'}
            </button>
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#1a1a24', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '12px 18px',
          fontSize: 13, color: '#f0f0f5',
          display: 'flex', alignItems: 'center', gap: 8, zIndex: 200,
        }}>
          <span>✓</span><span>{toast}</span>
        </div>
      )}
    </div>
  )
}
