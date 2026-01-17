import React, { useState, useMemo } from 'react'
import { computeGDD, estimateFrostRisk, rainfallAccumulation, computePestDiseaseRisk, summarizeRecent } from '../lib/agroMetrics'

const windows = [7, 14, 30]

export default function AdvancedMetrics({ history = [], forecast = [], crop = 'soybean' }) {
  const [baseTemp, setBaseTemp] = useState(10)
  const [windowDays, setWindowDays] = useState(14)

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

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Advanced Metrics (विस्तृत मोजमाप)</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="p-3 bg-gray-50 rounded">
          <label className="text-xs">Base temperature (°C)</label>
          <input type="number" value={baseTemp} onChange={(e) => setBaseTemp(e.target.value)} className="w-full p-2 mt-1 rounded border" aria-label="Base temperature for GDD" />
          <label className="text-xs mt-2 block">Window</label>
          <select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))} className="w-full p-2 rounded border mt-1" aria-label="Window days for metrics">
            {windows.map(w => <option key={w} value={w}>{w} days</option>)}
          </select>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">GDD (last {windowDays} days)</p>
          <p className="text-2xl font-bold">{gdd.gdd}°C·days</p>
          <p className="text-xs text-gray-500 mt-2">Sum of daily growing degree days over the window. Base temp: {baseTemp}°C</p>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Frost risk (next {Math.min(windowDays, 7)} days)</p>
          <p className={`text-2xl font-bold ${frost.risk === 'high' ? 'text-red-600' : frost.risk === 'medium' ? 'text-orange-500' : 'text-green-600'}`}>{frost.risk.toUpperCase()}</p>
          <p className="text-xs text-gray-500 mt-2">Probability: {Math.round(frost.probability * 100)}% (based on recent minima and forecast)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Rainfall (historical / forecast)</p>
          <p className="text-xl font-semibold">{rain.historical}mm / {rain.forecast}mm</p>
          <p className="text-xs text-gray-500 mt-2">Historical uses saved daily totals (if available). Forecast is from API.</p>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Pest/Disease Risk</p>
          <p className={`text-2xl font-bold ${pest.level === 'high' ? 'text-red-600' : pest.level === 'medium' ? 'text-orange-500' : 'text-green-600'}`}>{pest.level.toUpperCase()}</p>
          <p className="text-sm mt-1">Score: {pest.score}/100</p>
          <ul className="text-xs mt-2 list-disc pl-4 text-gray-600">
            {pest.reasons.map((r, i) => <li key={i}>{r}</li>)}
            {pest.reasons.length === 0 && <li>No immediate risk factors detected</li>}
          </ul>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Recent summary</p>
          <p className="text-sm">Avg Temp: {recent.avgTemp}°C</p>
          <p className="text-sm">Avg Humidity: {recent.avgHumidity}%</p>
          <p className="text-sm">Avg Min Temp: {recent.avgMinTemp}°C</p>
          <p className="text-xs text-gray-500 mt-2">These values are computed from saved daily data.</p>
        </div>
      </div>
    </div>
  )
}
