'use client'

import { useEffect, useRef } from 'react'
import { Trade } from '@/types/trade'
import { calcMetrics } from '@/lib/calculations'

type Props = {
  trades: Trade[]
}

export default function EquityCurve({ trades }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<unknown>(null)

  const m       = calcMetrics(trades)
  const pts     = m.equityPoints
  const isUp    = pts.length >= 2 ? pts[pts.length - 1] >= pts[0] : true
  const color   = isUp ? '#00d68f' : '#ff4d6d'
  const initial = pts[0] ?? 0
  const current = pts[pts.length - 1] ?? 0
  const pctChange = initial > 0 ? ((current - initial) / initial) * 100 : 0

  // Build date labels: "Inicio" + one per trade sorted by date
  const sortedTrades = [...trades].sort((a, b) =>
    new Date(a.trade_date ?? a.created_at).getTime() -
    new Date(b.trade_date ?? b.created_at).getTime()
  )
  const labels = [
    'Inicio',
    ...sortedTrades.map(t => {
      const d = new Date(t.trade_date ?? t.created_at)
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
    })
  ]

  useEffect(() => {
    if (!canvasRef.current || pts.length < 2) return

    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy()
      }

      const ctx = canvasRef.current!.getContext('2d')!

      // Gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, 200)
      gradient.addColorStop(0, isUp ? 'rgba(0,214,143,0.25)' : 'rgba(255,77,109,0.25)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Patrimonio',
              data: pts,
              borderColor: color,
              borderWidth: 2.5,
              backgroundColor: gradient,
              fill: true,
              tension: 0.35,
              pointRadius: pts.map((_, i) => i === 0 || i === pts.length - 1 ? 5 : 0),
              pointHoverRadius: 6,
              pointBackgroundColor: color,
              pointBorderColor: '#0a0a0f',
              pointBorderWidth: 2,
            },
            // Reference line — capital inicial
            {
              label: 'Capital inicial',
              data: Array(pts.length).fill(initial),
              borderColor: 'rgba(255,255,255,0.15)',
              borderWidth: 1,
              borderDash: [6, 4],
              pointRadius: 0,
              pointHoverRadius: 0,
              fill: false,
              tension: 0,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1a1a24',
              borderColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              titleColor: '#7a7a8c',
              bodyColor: '#f0f0f5',
              padding: 12,
              callbacks: {
                title: (items) => items[0].label,
                label: (item) => {
                  if (item.datasetIndex === 1) return `Capital inicial: $${Number(item.raw).toFixed(2)}`
                  return `Patrimonio: $${Number(item.raw).toFixed(2)}`
                },
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
              ticks: {
                color: '#555568',
                font: { size: 11 },
                maxTicksLimit: 6,
                maxRotation: 0,
              },
              border: { display: false },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
              ticks: {
                color: '#555568',
                font: { size: 11 },
                maxTicksLimit: 5,
                callback: (v) => `$${Number(v).toFixed(2)}`,
              },
              border: { display: false },
            }
          }
        }
      })
    }

    loadChart()

    return () => {
      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy()
        chartRef.current = null
      }
    }
  }, [trades])

  if (pts.length < 2) {
    return (
      <div className="h-50 flex items-center justify-center text-(#555568) text-sm">
        Agregá trades para ver la curva
      </div>
    )
  }

  return (
    <div>
      {/* Badges: inicial / actual / % */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex flex-col">
          <span className="text-[11px] text-(--muted) mb-0.5">Inicial</span>
          <span className="font-mono text-sm font-medium text-(--text)">
            ${initial.toFixed(2)}
          </span>
        </div>
        <div className="w-px bg-(--border) mx-1" />
        <div className="flex flex-col">
          <span className="text-[11px] text-(--muted) mb-0.5">Actual</span>
          <span className="font-mono text-sm font-medium" style={{ color }}>
            ${current.toFixed(2)}
          </span>
        </div>
        <div className="w-px bg-(--border) mx-1" />
        <div className="flex flex-col">
          <span className="text-[11px] text-(--muted) mb-0.5">Retorno</span>
          <span className="font-mono text-sm font-medium" style={{ color }}>
            {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-45">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
