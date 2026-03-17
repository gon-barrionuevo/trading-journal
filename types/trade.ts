export type Trade = {
    id: string
    created_at: string
    asset: string
    direction: 'long' | 'short'
    pct: number | null
    patrimony: number | null
    pnl: number
    trade_date: string | null
    comment: string | null
    image_url: string | null
    rr: string | null
}

export type NewTrade = Omit<Trade, 'id' | 'created_at'>