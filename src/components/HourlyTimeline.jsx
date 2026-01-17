import React, { useMemo } from 'react'
import { getWeatherIconUrl } from '../lib/weatherService'

function formatHour(dateStrOrObj) {
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj
  return d.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })
}

function Sparkline({ values = [], width = 200, height = 40, stroke = '#3b82f6' }) {
  if (!values || values.length === 0) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / Math.max(1, values.length - 1)
  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function HourlyTimeline({ hourly = [] }) {
  // Take up to next 24 hours — data may be 3-hourly points
  const items = hourly.slice(0, 8) // 8 * 3h = 24h if 3-hourly; otherwise first 24

  const temps = useMemo(() => items.map(i => i.temp), [items])

  return (
    <div className="my-3">
      <h4 className="text-sm font-semibold mb-2">घंट्यांचे रूपरेषा (Hourly timeline)</h4>
      <div className="overflow-x-auto" role="list" tabIndex={0} aria-label="Hourly forecast timeline">
        <div className="flex gap-3 items-center px-1">
          {items.map((it, idx) => (
            <div
              key={idx}
              role="listitem"
              className="min-w-[96px] flex-shrink-0 bg-white dark:bg-gray-800 border rounded-lg p-2 text-center hover:shadow focus:shadow outline-none focus:ring-2 focus:ring-blue-400"
              tabIndex={0}
            >
              <div className="text-xs text-gray-500">{formatHour(it.dt)}</div>
              <img src={getWeatherIconUrl(it.icon)} alt={it.condition} className="mx-auto w-8 h-8" />
              <div className="text-sm font-semibold">{Math.round(it.temp)}°C</div>
              <div className="text-xs text-gray-500">{it.pop ? `${Math.round(it.pop * 100)}%` : '-'}</div>
            </div>
          ))}

          {/* Sparkline box */}
          <div className="min-w-[220px] flex-shrink-0 bg-white dark:bg-gray-800 border rounded-lg p-2">
            <div className="text-xs text-gray-500">तापमान ट्रेंड</div>
            <Sparkline values={temps} width={200} height={40} />
          </div>
        </div>
      </div>
    </div>
  )
}
