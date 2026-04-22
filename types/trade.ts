export type Trade = {
  id:              string
  created_at:      string
  asset:           string
  direction:       'long' | 'short'
  pct:             number | null
  patrimony:       number | null
  pnl:             number
  trade_date:      string | null
  comment:         string | null
  image_url_macro: string | null
  image_url_micro: string | null
  rr:              string | null
  account_id:      string | null
  followed_plan:   boolean | null
  user_id:         string
}

export type NewTrade = Omit<Trade, 'id' | 'created_at' | 'user_id'>
