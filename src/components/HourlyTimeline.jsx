import React, { useMemo } from 'react'
import { getWeatherIconUrl } from '../lib/weatherService'

function formatHour(dateStrOrObj) {
  // Support UNIX timestamp (seconds), ISO string, or Date object
  const d = typeof dateStrOrObj === 'number'
    ? new Date(dateStrOrObj * 1000)
    : (typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj)

  return (d && typeof d.toLocaleTimeString === 'function')
    ? d.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })
    : ''
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
  // Select entries that fall within the next 24 hours from the first timestamp.
  // This handles both 1-hourly and 3-hourly datasets by using a time cutoff instead of a fixed count.
  let items = []
  if (Array.isArray(hourly) && hourly.length > 0) {
    const first = hourly[0]
    const firstMs = typeof first.dt === 'number' ? first.dt * 1000 : new Date(first.dt).getTime()
    const cutoff = firstMs + 24 * 60 * 60 * 1000

    items = hourly.filter(i => {
      const t = typeof i.dt === 'number' ? i.dt * 1000 : new Date(i.dt).getTime()
      return t <= cutoff
    })

    // Fallback to a small slice if timestamps are missing or filter returned nothing
    if (items.length === 0) items = hourly.slice(0, 8)
  } else {
    items = []
  }

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
              <div className="text-xs text-gray-500">{it.pop != null ? `${Math.round(it.pop * 100)}%` : '-'}</div>
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
