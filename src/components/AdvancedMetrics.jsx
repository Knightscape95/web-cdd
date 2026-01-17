import React, { useState, useMemo } from 'react'
import { computeGDD, estimateFrostRisk, rainfallAccumulation, computePestDiseaseRisk, summarizeRecent } from '../lib/agroMetrics'

const windows = [7, 14, 30]

export default function AdvancedMetrics({ history = [], forecast = [], crop = 'soybean' }) {
  const [baseTemp, setBaseTemp] = useState(10)
  const [windowDays, setWindowDays] = useState(14)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // crop configs - should mirror weatherPredictor crop recommendations
  const cropConfigs = {
    soybean: { idealTemp: { min: 20, max: 30 }, diseaseRiskHumidity: 80 },
    cotton: { idealTemp: { min: 25, max: 35 }, diseaseRiskHumidity: 75 }
  }

  const cropConfig = cropConfigs[crop] || cropConfigs.soybean

  const gdd = useMemo(() => computeGDD(history, Number(baseTemp), windowDays), [history, baseTemp, windowDays])
  const frost = useMemo(() => estimateFrostRisk(history, forecast, Math.min(windowDays, 7), 2), [history, forecast, windowDays])
  const rain = useMemo(() => rainfallAccumulation(history, forecast, windowDays), [history, forecast, windowDays])

  const recent = summarizeRecent(history, windowDays)
  const pest = useMemo(() => computePestDiseaseRisk(cropConfig, { avgTemp: recent.avgTemp, avgHumidity: recent.avgHumidity, rainAccumulation: rain.historical }), [cropConfig, recent, rain])

  // Visual helpers
  const frostPct = Math.round((frost.probability || 0) * 100)
  const pestPct = pest.score

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
        <div>
          <h3 className="font-semibold">Advanced Metrics <span className="text-sm text-gray-500">(विस्तृत मोजमाप)</span></h3>
          <p className="text-xs text-gray-500 mt-1">Key agronomic metrics derived from recent and forecast weather data.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs">Base temp</label>
          <input
            type="number"
            min="-10"
            step="0.5"
            value={baseTemp}
            onChange={(e) => setBaseTemp(Number(e.target.value))}
            className="w-20 p-2 rounded border"
            aria-label="Base temperature for GDD"
          />

          <label className="text-xs">Window</label>
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="p-2 rounded border"
            aria-label="Window days for metrics"
          >
            {windows.map(w => <option key={w} value={w}>{w} days</option>)}
          </select>

          <button onClick={() => setShowBreakdown(prev => !prev)} className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{showBreakdown ? 'Hide GDD' : 'Show GDD'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">GDD (last {windowDays} days)</p>
              <p className="text-2xl font-bold" aria-live="polite">{gdd.gdd}°C·days</p>
            </div>
            <div className="text-xs text-gray-500">Base: {baseTemp}°C</div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Growing Degree Days help estimate crop development progress.</p>

          {showBreakdown && (
            <div className="mt-3 text-xs text-gray-600 max-h-36 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="pb-1">Date</th>
                    <th className="pb-1">Mean</th>
                    <th className="pb-1">GDD</th>
                  </tr>
                </thead>
                <tbody>
                  {gdd.breakdown.map(b => (
                    <tr key={b.date}>
                      <td className="py-0.5">{b.date}</td>
                      <td className="py-0.5">{b.mean}°C</td>
                      <td className="py-0.5">{b.dailyGDD}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Frost risk (next {Math.min(windowDays, 7)} days)</p>
          <div className="flex items-center justify-between mt-1">
            <div className={`font-semibold text-lg ${frost.risk === 'high' ? 'text-red-600' : frost.risk === 'medium' ? 'text-orange-500' : 'text-green-600'}`}>{frost.risk.toUpperCase()}</div>
            <div className="text-sm text-gray-500">{frostPct}%</div>
          </div>

          <div className="mt-3">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div style={{ width: `${frostPct}%` }} className={`h-full ${frost.risk === 'high' ? 'bg-red-500' : frost.risk === 'medium' ? 'bg-orange-400' : 'bg-green-400'}`} role="progressbar" aria-valuenow={frostPct} aria-valuemin={0} aria-valuemax={100} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Frost risk based on recent minima and near-term forecast.</p>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Rainfall (last {windowDays} days / next {windowDays} days)</p>
          <div className="mt-1 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold">{rain.historical} mm</div>
              <div className="text-xs text-gray-500">Historical</div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{rain.forecast} mm</div>
              <div className="text-xs text-gray-500">Forecast</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Compare rainfall to crop water needs and thresholds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Pest / Disease Risk</p>
          <div className="mt-2 flex items-center justify-between">
            <div className={`text-2xl font-bold ${pest.level === 'high' ? 'text-red-600' : pest.level === 'medium' ? 'text-orange-500' : 'text-green-600'}`}>{pest.level.toUpperCase()}</div>
            <div className="text-sm text-gray-500">Score: {pest.score}/100</div>
          </div>

          <div className="mt-3">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div style={{ width: `${pestPct}%` }} className={`h-full ${pest.level === 'high' ? 'bg-red-500' : pest.level === 'medium' ? 'bg-orange-400' : 'bg-green-400'}`} role="progressbar" aria-valuenow={pestPct} aria-valuemin={0} aria-valuemax={100} />
            </div>
            <ul className="text-xs mt-2 list-disc pl-4 text-gray-600">
              {pest.reasons.map((r, i) => <li key={i}>{r}</li>)}
              {pest.reasons.length === 0 && <li>No immediate risk factors detected</li>}
            </ul>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Recent summary</p>
          <div className="mt-2 text-sm">
            <div>Avg Temp: <strong>{recent.avgTemp}°C</strong></div>
            <div>Avg Humidity: <strong>{recent.avgHumidity}%</strong></div>
            <div>Avg Min Temp: <strong>{recent.avgMinTemp}°C</strong></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Values computed from saved daily data.</p>
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold">Notes & Recommendations</h4>
          <p className="text-xs text-gray-500 mt-2">Use these metrics to plan irrigation, spraying, and harvest timing. Adjust base temperature if you use crop-specific thresholds.</p>
        </div>
      </div>
    </div>
  )
}
