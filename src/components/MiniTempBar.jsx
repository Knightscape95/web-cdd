import React from 'react'

// Mini horizontal bar showing tempMin - tempMax relative to overall range
export default function MiniTempBar({ min = 0, max = 0, overallMin = 0, overallMax = 40 }) {
  const range = overallMax - overallMin || 1
  const leftPercent = ((min - overallMin) / range) * 100
  const rightPercent = ((max - overallMin) / range) * 100

  const widthPercent = Math.max(2, rightPercent - leftPercent) // ensure visible

  return (
    <div className="w-28 h-3 bg-gray-200 dark:bg-gray-700 rounded-full relative" role="img" aria-label={`Temperature range ${min} to ${max} degrees Celsius`}>
      <div
        className="absolute h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
      />
    </div>
  )
}
