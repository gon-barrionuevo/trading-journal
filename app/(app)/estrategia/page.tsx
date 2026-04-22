'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/lang-context'

type Rule = {
  id: string
  content: string
  order_index: number
  created_at: string
}

export default function Estrategia() {
  const { t } = useT()
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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleAdd = async () => {
    if (!newText.trim()) return
    setSaving(true)
    try {
      const res     = await fetch('/api/rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newText.trim() }) })
      const created = await res.json()
      setRules(prev => [...prev, created])
      setNewText('')
      showToast('✓')
    } catch { showToast('Error') }
    finally { setSaving(false) }
  }

  const handleEditSave = async (id: string) => {
    if (!editText.trim()) return
    await fetch('/api/rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, content: editText.trim() }) })
    setRules(prev => prev.map(r => r.id === id ? { ...r, content: editText.trim() } : r))
    setEditId(null); setEditText('')
    showToast('✓')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('?')) return
    await fetch('/api/rules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setRules(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="page-header">
        <div>
          <div className="page-title">{t('strategy_title')}</div>
          <div className="page-sub">{t('strategy_sub')}</div>
        </div>
      </div>

      <div className="content max-w-170">
        <div className="bg-surface border border-border rounded-default overflow-hidden mb-4">
          {loading ? (
            <div className="px-5 py-6 text-sm text-muted">...</div>
          ) : rules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-text">{t('strategy_empty')}</div>
              <div className="empty-sub">{t('strategy_empty_sub')}</div>
            </div>
          ) : rules.map((rule, index) => (
            <div key={rule.id}
              className={`flex items-start gap-3.5 px-5 py-4 transition-colors duration-100 hover:bg-surface2 ${
                index < rules.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[rgba(124,106,255,0.12)] border border-[rgba(124,106,255,0.25)] text-accent2 flex items-center justify-center text-xs font-semibold mono shrink-0 mt-px">
                {index + 1}
              </div>
              <div className="flex-1">
                {editId === rule.id ? (
                  <>
                    <textarea autoFocus value={editText}
                      onChange={e => { setEditText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEditSave(rule.id); if (e.key === 'Escape') { setEditId(null); setEditText('') } }}
                      className="w-full bg-surface2 border border-accent rounded-sm outline-none text-sm text-text leading-relaxed resize-none px-3 py-2 overflow-hidden"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleEditSave(rule.id)} className="btn btn-primary btn-sm">{t('strategy_save')}</button>
                      <button onClick={() => { setEditId(null); setEditText('') }} className="btn btn-ghost btn-sm">{t('strategy_cancel')}</button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-text leading-relaxed m-0">{rule.content}</p>
                )}
              </div>
              {editId !== rule.id && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditId(rule.id); setEditText(rule.content) }} className="btn btn-ghost btn-sm px-2 py-1 text-sm">✏️</button>
                  <button onClick={() => handleDelete(rule.id)} className="btn btn-danger btn-sm px-2 py-1 text-sm">🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-default px-5 py-4">
          <div className="text-xs text-muted font-medium mb-2.5">{t('strategy_new')}</div>
          <textarea value={newText}
            onChange={e => { setNewText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.max(80, e.target.scrollHeight) + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd() }}
            placeholder={t('strategy_placeholder')}
            className="w-full bg-surface2 border border-border2 rounded-sm outline-none text-sm text-text leading-relaxed resize-none h-20 px-3 py-2.5 overflow-hidden transition-colors duration-150 focus:border-accent"
          />
          <div className="flex justify-between items-center mt-2.5">
            <span className="text-xs text-muted2">{t('strategy_hint')}</span>
            <button onClick={handleAdd} disabled={saving || !newText.trim()} className="btn btn-primary btn-sm disabled:opacity-50">
              {saving ? t('strategy_saving') : t('strategy_add')}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast show">
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
