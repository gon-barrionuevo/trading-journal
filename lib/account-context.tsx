'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Account } from '@/types/account'

type AccountContextType = {
  accounts:       Account[]
  activeAccount:  Account | null
  setActiveAccount: (account: Account) => void
  refreshAccounts: () => Promise<void>
  loading:        boolean
}

const AccountContext = createContext<AccountContextType>({
  accounts:        [],
  activeAccount:   null,
  setActiveAccount: () => {},
  refreshAccounts: async () => {},
  loading:         true,
})

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts]           = useState<Account[]>([])
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null)
  const [loading, setLoading]             = useState(true)

  const refreshAccounts = useCallback(async () => {
    try {
      const res  = await fetch('/api/accounts')
      const data = await res.json()
      if (!Array.isArray(data)) return

      setAccounts(data)

      // Recuperar cuenta activa del localStorage, o usar la primera activa
      const savedId = localStorage.getItem('activeAccountId')
      const saved   = savedId ? data.find((a: Account) => a.id === savedId) : null
      const first   = data.find((a: Account) => a.status === 'active')

      setActiveAccountState(saved ?? first ?? data[0] ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refreshAccounts() }, [refreshAccounts])

  const setActiveAccount = (account: Account) => {
    setActiveAccountState(account)
    localStorage.setItem('activeAccountId', account.id)
  }

  return (
    <AccountContext.Provider value={{ accounts, activeAccount, setActiveAccount, refreshAccounts, loading }}>
      {children}
    </AccountContext.Provider>
  )
}

export const useAccount = () => useContext(AccountContext)
