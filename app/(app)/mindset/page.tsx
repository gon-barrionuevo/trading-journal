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

const LINE = 52
const HAND_CLASS = 'font-["Bradley_Hand","Segoe_Script","Lucida_Handwriting",cursive]'

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
    {
      key: 'positiva' as Category,
      label: t('mindset_positive'),
      textClass: 'text-green',
      bgClass: 'bg-green-bg',
      borderClass: 'border-green/30',
    },
    {
      key: 'limitante' as Category,
      label: t('mindset_limiting'),
      textClass: 'text-red',
      bgClass: 'bg-red-bg',
      borderClass: 'border-red/30',
    },
    {
      key: 'operando' as Category,
      label: t('mindset_operating'),
      textClass: 'text-accent2',
      bgClass: 'bg-[rgba(124,106,255,0.12)]',
      borderClass: 'border-[rgba(124,106,255,0.3)]',
    },
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
    <div className="absolute left-18 top-0 bottom-0 w-px bg-[rgba(196,150,150,0.5)] pointer-events-none" />
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="page-header">
        <div>
          <div className="page-title">{t('mindset_title')}</div>
          <div className="page-sub">{t('mindset_sub')}</div>
        </div>
      </div>

      <div className="pt-5 px-7 pb-0 flex flex-col flex-1 overflow-hidden gap-4">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap shrink-0">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveTab(c.key)}
              className={`px-4.5 py-1.75 rounded-full border text-sm font-medium cursor-pointer transition-all duration-200 ${
                activeTab === c.key
                  ? `${c.borderClass} ${c.bgClass} ${c.textClass}`
                  : 'border-white/8 bg-transparent text-muted2'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Notebook */}
        <div className="flex-1 flex flex-col bg-[#f7f2e8] rounded-tr-[10px] shadow-[-4px_0_0_#c4b090,-8px_0_0_#ddd0b0] overflow-hidden">
          {/* Spiral */}
          <div className="flex items-center py-2.25 bg-[#1e1c2a] shrink-0">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="flex-1 flex justify-center">
                <div className="w-4.5 h-4.5 rounded-full bg-[#0d0b15] border-[2.5px] border-[#5a5075] box-border" />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between pr-8 pl-22 h-13 border-b border-[rgba(160,185,220,0.45)] relative shrink-0">
            <MarginLine />
            <span className={`${HAND_CLASS} text-[22px] font-semibold text-[#2a2035]`}>{cat.label}</span>
            <span className={`${HAND_CLASS} text-sm text-[#9a8070]`}>{thisYear}</span>
          </div>

          {/* Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className={`${HAND_CLASS} px-22 py-4 text-[17px] text-[#b0a090]`}>{t('mindset_loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="flex min-h-13 border-b border-[rgba(160,185,220,0.45)] relative">
                <MarginLine />
                <div className="w-18 min-w-18 border-r border-[rgba(196,150,150,0.4)]" />
                <div className={`${HAND_CLASS} px-6 py-4 text-lg text-[#c0aa90] italic`}>{t('mindset_empty')}</div>
              </div>
            ) : filtered.map(entry => (
              <div key={entry.id} className="group/entry flex relative border-b border-[rgba(160,185,220,0.45)] min-h-13">
                <MarginLine />
                <div className="w-18 min-w-18 border-r border-[rgba(196,150,150,0.4)] flex flex-col justify-start pt-3.5 pr-1.5 pb-0 pl-2">
                  <span className={`${HAND_CLASS} text-xs text-[#b08070] leading-none`}>{fmtDate(entry.entry_date, locale)}</span>
                  {fmtYear(entry.entry_date) !== thisYear && <span className={`${HAND_CLASS} text-[10px] text-[#c09080] mt-0.5`}>{fmtYear(entry.entry_date)}</span>}
                </div>
                <div className="flex-1 py-3.5 pr-13 pl-3 relative">
                  {editId === entry.id ? (
                    <>
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={e => { setEditText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEditSave(entry.id); if (e.key === 'Escape') { setEditId(null); setEditText('') } }}
                        className={`${HAND_CLASS} w-full bg-white/60 border ${cat.borderClass} rounded-xs outline-none text-[19px] text-[#1a1530] leading-[1.65] resize-none px-2.5 py-1.5 overflow-hidden`}
                      />
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => handleEditSave(entry.id)}
                          className={`text-xs px-3 py-0.75 border rounded-[4px] cursor-pointer ${cat.bgClass} ${cat.borderClass} ${cat.textClass}`}
                        >
                          {t('strategy_save')}
                        </button>
                        <button
                          onClick={() => { setEditId(null); setEditText('') }}
                          className="text-xs px-3 py-0.75 bg-transparent border border-black/12 text-[#9a8a7a] rounded-[4px] cursor-pointer"
                        >
                          {t('strategy_cancel')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className={`${HAND_CLASS} text-[19px] text-[#1a1530] leading-[1.65] m-0`}>{entry.content}</p>
                  )}
                  {editId !== entry.id && (
                    <div className="absolute top-2.5 right-2 flex gap-1 opacity-0 transition-opacity duration-150 group-hover/entry:opacity-100 focus-within:opacity-100">
                      <button
                        onClick={() => { setEditId(entry.id); setEditText(entry.content) }}
                        className="w-7 h-7 rounded-xs bg-[rgba(124,106,255,0.12)] border border-[rgba(124,106,255,0.25)] text-accent cursor-pointer text-sm flex items-center justify-center"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="w-7 h-7 rounded-xs bg-red-bg border border-red/20 text-red cursor-pointer text-sm flex items-center justify-center"
                      >
                        🧹
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* New entry */}
            <div className="flex relative border-b border-[rgba(160,185,220,0.45)] min-h-13">
              <MarginLine />
              <div className="w-18 min-w-18 border-r border-[rgba(196,150,150,0.4)] pt-3.5 pr-1.5 pb-0 pl-2">
                <span className={`${HAND_CLASS} text-xs text-[#b08070]`}>{today}</span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newText}
                  onChange={e => { setNewText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.max(LINE, e.target.scrollHeight) + 'px' }}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd() }}
                  placeholder={t('mindset_placeholder')}
                  rows={1}
                  className={`${HAND_CLASS} w-full bg-transparent border-none outline-none text-[19px] text-[#1a1530] leading-[1.65] resize-none min-h-13 pt-3.5 pr-8 pb-0 pl-3 overflow-hidden`}
                />
              </div>
            </div>

            <div className="flex justify-end px-8 pt-2.5 pb-3 border-b border-[rgba(160,185,220,0.45)]">
              <button
                onClick={handleAdd}
                disabled={saving || !newText.trim()}
                className={`${HAND_CLASS} text-[17px] font-semibold rounded-full px-5 py-1.25 border transition-all duration-150 ${
                  saving || !newText.trim()
                    ? 'text-[#b0a090] bg-transparent border-[rgba(160,140,120,0.2)] cursor-default'
                    : `${cat.textClass} ${cat.bgClass} ${cat.borderClass} cursor-pointer`
                }`}
              >
                {saving ? t('mindset_saving') : t('mindset_add')}
              </button>
            </div>

            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-13 relative border-b border-[rgba(160,185,220,0.4)]"><MarginLine /></div>
            ))}
          </div>
        </div>

        <div className="shrink-0 pt-2 pb-4 text-right">
          <span className="text-xs text-muted2">{t('mindset_hint')}</span>
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
