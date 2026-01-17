/**
 * Agricultural Metrics Utilities
 * - GDD (Growing Degree Days)
 * - Frost risk estimate
 * - Rainfall accumulation
 * - Pest/Disease risk score
 *
 * Functions are pure and documented for clarity.
 */

/**
 * Compute Growing Degree Days for a series of daily stats.
 * dailyStats: Array of { date, minTemp, maxTemp, avgTemp }
 * baseTemp: base temperature for crop (default 10°C)
 * days: number of recent days to consider (from the end of dailyStats)
 */
export function computeGDD(dailyStats = [], baseTemp = 10, days = 14) {
  if (!Array.isArray(dailyStats) || dailyStats.length === 0) return { gdd: 0, breakdown: [] }

  const slice = dailyStats.slice(-days)
  const breakdown = slice.map(d => {
    // Use mean of min and max when available, otherwise avgTemp
    const mean = (typeof d.minTemp === 'number' && typeof d.maxTemp === 'number')
      ? (d.minTemp + d.maxTemp) / 2
      : (d.avgTemp || 0)

    const dailyGDD = Math.max(0, mean - baseTemp)
    return { date: d.date, mean: Number(mean.toFixed(2)), dailyGDD: Number(dailyGDD.toFixed(2)) }
  })

  const gdd = breakdown.reduce((acc, b) => acc + b.dailyGDD, 0)
  return { gdd: Number(gdd.toFixed(2)), breakdown }
}

/**
 * Estimate frost risk using historical minima and forecast minima.
 * history: array of daily stats (with minTemp)
 * forecast: array of future daily objects (with tempMin or minTemp)
 * windowDays: number of days to consider (lookback + lookahead combined)
 * threshold: temperature (°C) below which frost is a concern
 * Returns { risk: 'low'|'medium'|'high', probability: 0..1, details }
 */
export function estimateFrostRisk(history = [], forecast = [], windowDays = 7, threshold = 2) {
  // Consider last windowDays of history and first windowDays of forecast
  const recentHist = (Array.isArray(history) ? history.slice(-windowDays) : [])
  const future = (Array.isArray(forecast) ? forecast.slice(0, windowDays) : [])

  let countCold = 0
  let total = 0

  recentHist.forEach(d => {
    if (typeof d.minTemp === 'number') {
      total++
      if (d.minTemp <= threshold) countCold++
    }
  })

  future.forEach(d => {
    const min = d.tempMin ?? d.minTemp ?? null
    if (typeof min === 'number') {
      total++
      if (min <= threshold) countCold++
    }
  })

  const probability = total === 0 ? 0 : countCold / total
  let risk = 'low'
  if (probability > 0.5) risk = 'high'
  else if (probability > 0.15) risk = 'medium'

  return { risk, probability: Number(probability.toFixed(2)), details: { countCold, total, threshold } }
}

/**
 * Compute rainfall accumulation.
 * history: array of daily stats (may include totalRain or rain)
 * forecastDaily: array of forecast daily objects (may include totalRain)
 * windowDays: number of days in the window (lookback or lookahead)
 * Returns { historical: mm, forecast: mm }
 */
export function rainfallAccumulation(history = [], forecastDaily = [], windowDays = 7) {
  const histSlice = history.slice(-windowDays)
  const histSum = histSlice.reduce((acc, d) => acc + (d.totalRain ?? d.rain ?? 0), 0)

  const forecastSlice = forecastDaily.slice(0, windowDays)
  const forecastSum = forecastSlice.reduce((acc, d) => acc + (d.totalRain ?? d.rain ?? 0), 0)

  return { historical: Number(histSum.toFixed(2)), forecast: Number(forecastSum.toFixed(2)) }
}

/**
 * Simple pest/disease risk scoring.
 * Uses crop configuration thresholds and recent metrics to compute risk level.
 * cropConfig: { diseaseRiskHumidity: number, idealTemp: {min, max} }
 * recentMetrics: { avgTemp, avgHumidity, rainAccumulation }
 * Returns { score: 0..100, level: 'low'|'medium'|'high', reasons: [] }
 */
export function computePestDiseaseRisk(cropConfig = {}, recentMetrics = {}) {
  const { avgTemp = 0, avgHumidity = 0, rainAccumulation = 0 } = recentMetrics
  const diseaseHumidityThreshold = cropConfig?.diseaseRiskHumidity ?? 75

  let score = 0
  const reasons = []

  // Humidity increases risk
  const humidityExcess = Math.max(0, avgHumidity - diseaseHumidityThreshold)
  score += Math.min(40, humidityExcess * 0.8)
  if (humidityExcess > 0) reasons.push(`High humidity: ${avgHumidity}%`)

  // Warm and wet is favorable for many pathogens
  if (avgTemp >= (cropConfig.idealTemp?.min ?? 0) && avgTemp <= (cropConfig.idealTemp?.max ?? 100) && rainAccumulation > 5) {
    score += 30
    reasons.push(`Warm with rain: ${rainAccumulation}mm`) 
  }

  // Very low temps (frost) reduce some pests but increase others - count minimally
  if (avgTemp < 5) {
    score -= 10
    reasons.push(`Low temperature: ${avgTemp}°C`) 
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)))

  let level = 'low'
  if (score >= 60) level = 'high'
  else if (score >= 30) level = 'medium'

  return { score, level, reasons }
}

/**
 * Helper: compute simple averages from recent daily stats
 */
export function summarizeRecent(history = [], days = 7) {
  const slice = history.slice(-days)
  if (slice.length === 0) return { avgTemp: 0, avgHumidity: 0, avgMinTemp: 0 }

  const avgTemp = slice.reduce((a, d) => a + (d.avgTemp ?? 0), 0) / slice.length
  const avgHumidity = slice.reduce((a, d) => a + (d.avgHumidity ?? 0), 0) / slice.length
  const avgMinTemp = slice.reduce((a, d) => a + (d.minTemp ?? d.avgTemp ?? 0), 0) / slice.length

  return { avgTemp: Number(avgTemp.toFixed(2)), avgHumidity: Number(avgHumidity.toFixed(2)), avgMinTemp: Number(avgMinTemp.toFixed(2)) }
}
