'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations, type Locale, type TranslationKey } from './i18n'

const LANG_KEY = 'tradefolio_lang'

type LangContextType = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey) => string
}

const LangContext = createContext<LangContextType>({
  locale: 'es',
  setLocale: () => {},
  t: (key) => translations.es[key],
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es')

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY) as Locale | null
    if (saved === 'es' || saved === 'en') setLocaleState(saved)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(LANG_KEY, l)
  }

  const t = (key: TranslationKey): string => translations[locale][key]

  return (
    <LangContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useT() {
  return useContext(LangContext)
}
