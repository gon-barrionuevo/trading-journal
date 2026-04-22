export type AccountStatus = 'active' | 'burned' | 'archived'

export type Account = {
  id:              string
  user_id:         string
  name:            string
  initial_capital: number
  status:          AccountStatus
  burned_at:       string | null
  created_at:      string
}

export type NewAccount = Omit<Account, 'id' | 'user_id' | 'created_at'>
