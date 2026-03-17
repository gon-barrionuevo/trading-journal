import { Trade } from '@/types/trade'

export function calcMetrics(trades: Trade[], capitalInicial: number = 0) {
    const total   = trades.length
    const wins    = trades.filter(t => t.pnl > 0).length
    const losses  = trades.filter(t => t.pnl < 0).length
    const winRate = total ? Math.round((wins / total) * 100) : 0

    const totalPnl  = trades.reduce((s, t) => s + (t.pnl || 0), 0)
    const totalWins = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0)
    const totalLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0))

    const pf      = totalLoss > 0 ? totalWins / totalLoss : totalWins > 0 ? Infinity : null
    const avgWin  = wins   ? totalWins / wins   : 0
    const avgLoss = losses ? totalLoss / losses : 0

    // Racha actual y mejor racha
    let streak = 0, bestStreak = 0
    if (trades.length) {
        const sorted = [...trades].sort((a, b) =>
            new Date(a.trade_date ?? a.created_at).getTime() -
            new Date(b.trade_date ?? b.created_at).getTime()
        )
        const lastType = sorted[sorted.length - 1].pnl >= 0 ? 'W' : 'L'
        for (let i = sorted.length - 1; i >= 0; i--) {
            if ((sorted[i].pnl >= 0 ? 'W' : 'L') === lastType) streak++
            else break
        }
        let bc = 0
        for (const t of sorted) {
            if (t.pnl >= 0) { bc++; bestStreak = Math.max(bestStreak, bc) }
            else bc = 0
        }
    }

    // Capital base: patrimony del trade más antiguo, o capital inicial de config
    const sorted4base = [...trades].sort((a, b) =>
        new Date(a.trade_date ?? a.created_at).getTime() -
        new Date(b.trade_date ?? b.created_at).getTime()
    )
    const baseCapital = sorted4base.length && sorted4base[0].patrimony
        ? sorted4base[0].patrimony
        : capitalInicial

    const patrimonio = baseCapital + totalPnl
    const pctChange  = baseCapital > 0 ? (totalPnl / baseCapital) * 100 : 0

    // Métricas de riesgo
    const tradesWithRisk = trades.filter(t => t.pct && t.pct > 0)
    const avgRisk     = tradesWithRisk.length
        ? tradesWithRisk.reduce((s, t) => s + (t.pct ?? 0), 0) / tradesWithRisk.length
        : null
    const maxRiskTrade = tradesWithRisk.length
        ? tradesWithRisk.reduce((a, b) => (a.pct ?? 0) > (b.pct ?? 0) ? a : b)
        : null
    const minRiskTrade = tradesWithRisk.length
        ? tradesWithRisk.reduce((a, b) => (a.pct ?? 0) < (b.pct ?? 0) ? a : b)
        : null

    // Equity curve points: [baseCapital, ...acumulado]
    const sortedAll = [...trades].sort((a, b) =>
        new Date(a.trade_date ?? a.created_at).getTime() -
        new Date(b.trade_date ?? b.created_at).getTime()
    )
    let run = baseCapital
    const equityPoints = [
        baseCapital,
        ...sortedAll.map(t => { run += (t.pnl || 0); return run })
    ]

    return {
        total, wins, losses, winRate,
        totalPnl, totalWins, totalLoss,
        pf, avgWin, avgLoss,
        streak, bestStreak,
        baseCapital, patrimonio, pctChange,
        avgRisk, maxRiskTrade, minRiskTrade,
        equityPoints,
        lastTradeType: trades.length
            ? ([...trades].sort((a, b) =>
                new Date(b.trade_date ?? b.created_at).getTime() -
                new Date(a.trade_date ?? a.created_at).getTime()
            )[0].pnl >= 0 ? 'W' : 'L')
            : null
    }
}

export function formatMoney(value: number, currency = 'USD'): string {
    const sym = currency === 'USD' ? '$' : currency + ' '
    return sym + Math.abs(value).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

export function formatPnl(value: number, currency = 'USD'): string {
    const prefix = value >= 0 ? '+' : '-'
    return prefix + formatMoney(value, currency)
}