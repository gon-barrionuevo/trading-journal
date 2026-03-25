'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/lang-context'

type Category = 'positiva' | 'limitante' | 'operando'

type MindsetEntry = {
  id: string
  created_at: string
  category: Category
  content: string
  entry_date: string
}

const HAND = '"Bradley Hand", "Segoe Script", "Lucida Handwriting", cursive'
const LINE = 52

function fmtDate(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', { day: 'numeric', month: 'short' })
}
function fmtYear(d: string) { return new Date(d).getFullYear() }

export default function Mindset() {
  const { t, locale } = useT()
  const [entries, setEntries]     = useState<MindsetEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<Category>('positiva')
  const [newText, setNewText]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<string | null>(null)
  const [editId, setEditId]       = useState<string | null>(null)
  const [editText, setEditText]   = useState('')

  const today    = new Date().toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', { day: 'numeric', month: 'short' })
  const todayISO = new Date().toISOString().slice(0, 10)
  const thisYear = new Date().getFullYear()

  const CATEGORIES = [
    { key: 'positiva'  as Category, label: t('mindset_positive'), color: '#00d68f', bg: 'rgba(0,214,143,0.12)',   border: 'rgba(0,214,143,0.3)'   },
    { key: 'limitante' as Category, label: t('mindset_limiting'), color: '#ff4d6d', bg: 'rgba(255,77,109,0.10)',  border: 'rgba(255,77,109,0.3)'  },
    { key: 'operando'  as Category, label: t('mindset_operating'),color: '#a091ff', bg: 'rgba(124,106,255,0.12)', border: 'rgba(124,106,255,0.3)' },
  ]

  useEffect(() => {
    const load = async () => {
      const res  = await fetch('/api/mindset')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleAdd = async () => {
    if (!newText.trim()) return
    setSaving(true)
    try {
      const res     = await fetch('/api/mindset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: activeTab, content: newText.trim(), entry_date: todayISO }) })
      const created = await res.json()
      setEntries(prev => [created, ...prev])
      setNewText('')
      showToast('✓')
    } catch { showToast('Error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('?')) return
    await fetch('/api/mindset', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const handleEditSave = async (id: string) => {
    if (!editText.trim()) return
    await fetch('/api/mindset', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, content: editText.trim() }) })
    setEntries(prev => prev.map(e => e.id === id ? { ...e, content: editText.trim() } : e))
    setEditId(null); setEditText('')
    showToast('✓')
  }

  const filtered = entries.filter(e => e.category === activeTab)
  const cat      = CATEGORIES.find(c => c.key === activeTab)!

  const MarginLine = () => (
    <div style={{ position: 'absolute', left: 72, top: 0, bottom: 0, width: 1.5, background: 'rgba(196,150,150,0.5)', pointerEvents: 'none' }} />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">{t('mindset_title')}</div>
          <div className="page-sub">{t('mindset_sub')}</div>
        </div>
      </div>

      <div style={{ padding: '20px 28px 0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', gap: 16 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setActiveTab(c.key)} style={{ padding: '7px 18px', borderRadius: 20, border: `1px solid ${activeTab === c.key ? c.border : 'rgba(255,255,255,0.08)'}`, background: activeTab === c.key ? c.bg : 'transparent', color: activeTab === c.key ? c.color : '#555568', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Notebook */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f7f2e8', borderRadius: '0 10px 0 0', boxShadow: '-4px 0 0 #c4b090, -8px 0 0 #ddd0b0', overflow: 'hidden' }}>
          {/* Spiral */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', background: '#1e1c2a', flexShrink: 0 }}>
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0d0b15', border: '2.5px solid #5a5075', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px 0 88px', height: LINE, borderBottom: '1.5px solid rgba(160,185,220,0.45)', position: 'relative', flexShrink: 0 }}>
            <MarginLine />
            <span style={{ fontFamily: HAND, fontSize: 22, fontWeight: 600, color: '#2a2035' }}>{cat.label}</span>
            <span style={{ fontFamily: HAND, fontSize: 14, color: '#9a8070' }}>{thisYear}</span>
          </div>

          {/* Scrollable */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '16px 88px', fontFamily: HAND, fontSize: 17, color: '#b0a090' }}>{t('mindset_loading')}</div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', minHeight: LINE, borderBottom: '1.5px solid rgba(160,185,220,0.45)', position: 'relative' }}>
                <MarginLine />
                <div style={{ width: 72, minWidth: 72, borderRight: '1.5px solid rgba(196,150,150,0.4)' }} />
                <div style={{ padding: '16px 24px', fontFamily: HAND, fontSize: 18, color: '#c0aa90', fontStyle: 'italic' }}>{t('mindset_empty')}</div>
              </div>
            ) : filtered.map(entry => (
              <div key={entry.id} style={{ display: 'flex', position: 'relative', borderBottom: '1.5px solid rgba(160,185,220,0.45)', minHeight: LINE }}>
                <MarginLine />
                <div style={{ width: 72, minWidth: 72, borderRight: '1.5px solid rgba(196,150,150,0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '14px 6px 0 8px' }}>
                  <span style={{ fontFamily: HAND, fontSize: 12, color: '#b08070', lineHeight: 1 }}>{fmtDate(entry.entry_date, locale)}</span>
                  {fmtYear(entry.entry_date) !== thisYear && <span style={{ fontFamily: HAND, fontSize: 10, color: '#c09080', marginTop: 2 }}>{fmtYear(entry.entry_date)}</span>}
                </div>
                <div style={{ flex: 1, padding: '14px 52px 14px 12px', position: 'relative' }}>
                  {editId === entry.id ? (
                    <>
                      <textarea autoFocus value={editText} onChange={e => { setEditText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEditSave(entry.id); if (e.key === 'Escape') { setEditId(null); setEditText('') } }} style={{ width: '100%', background: 'rgba(255,255,255,0.6)', border: `1px solid ${cat.border}`, borderRadius: 6, outline: 'none', fontFamily: HAND, fontSize: 19, color: '#1a1530', lineHeight: '1.65', resize: 'none', padding: '6px 10px', overflow: 'hidden' }} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button onClick={() => handleEditSave(entry.id)} style={{ fontFamily: 'var(--font)', fontSize: 11, padding: '3px 12px', background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color, borderRadius: 4, cursor: 'pointer' }}>{t('strategy_save')}</button>
                        <button onClick={() => { setEditId(null); setEditText('') }} style={{ fontFamily: 'var(--font)', fontSize: 11, padding: '3px 12px', background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', color: '#9a8a7a', borderRadius: 4, cursor: 'pointer' }}>{t('strategy_cancel')}</button>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontFamily: HAND, fontSize: 19, color: '#1a1530', lineHeight: '1.65', margin: 0 }}>{entry.content}</p>
                  )}
                  {editId !== entry.id && (
                    <div style={{ position: 'absolute', top: 10, right: 8, display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.15s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                      <button onClick={() => { setEditId(entry.id); setEditText(entry.content) }} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.25)', color: '#7c6aff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                      <button onClick={() => handleDelete(entry.id)} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,77,109,0.10)', border: '1px solid rgba(255,77,109,0.2)', color: '#ff4d6d', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧹</button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* New entry */}
            <div style={{ display: 'flex', position: 'relative', borderBottom: '1.5px solid rgba(160,185,220,0.45)', minHeight: LINE }}>
              <MarginLine />
              <div style={{ width: 72, minWidth: 72, borderRight: '1.5px solid rgba(196,150,150,0.4)', padding: '14px 6px 0 8px' }}>
                <span style={{ fontFamily: HAND, fontSize: 12, color: '#b08070' }}>{today}</span>
              </div>
              <div style={{ flex: 1 }}>
                <textarea value={newText} onChange={e => { setNewText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.max(LINE, e.target.scrollHeight) + 'px' }} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd() }} placeholder={t('mindset_placeholder')} rows={1} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: HAND, fontSize: 19, color: '#1a1530', lineHeight: '1.65', resize: 'none', minHeight: LINE, padding: '14px 32px 0 12px', overflow: 'hidden' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 32px 12px', borderBottom: '1.5px solid rgba(160,185,220,0.45)' }}>
              <button onClick={handleAdd} disabled={saving || !newText.trim()} style={{ fontFamily: HAND, fontSize: 17, fontWeight: 600, color: saving || !newText.trim() ? '#b0a090' : cat.color, background: saving || !newText.trim() ? 'transparent' : cat.bg, border: `1px solid ${saving || !newText.trim() ? 'rgba(160,140,120,0.2)' : cat.border}`, borderRadius: 20, padding: '5px 20px', cursor: saving || !newText.trim() ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                {saving ? t('mindset_saving') : t('mindset_add')}
              </button>
            </div>

            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: LINE, position: 'relative', borderBottom: '1.5px solid rgba(160,185,220,0.4)' }}><MarginLine /></div>
            ))}
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: '8px 0 16px', textAlign: 'right' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#555568' }}>{t('mindset_hint')}</span>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '12px 18px', fontSize: 13, color: '#f0f0f5', display: 'flex', alignItems: 'center', gap: 8, zIndex: 200 }}>
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
