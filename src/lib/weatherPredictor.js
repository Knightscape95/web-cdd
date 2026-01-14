/**
 * Weather Predictor
 * Uses collected historical data to predict future weather
 * Implements simple statistical models for prediction
 */

import { getDailyWeatherStats, saveWeatherPrediction, getLatestPrediction } from './database'

/**
 * Linear Regression for trend prediction
 */
class SimpleLinearRegression {
  constructor() {
    this.slope = 0
    this.intercept = 0
  }

  fit(x, y) {
    const n = x.length
    if (n === 0) return this

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0)
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0)

    const denominator = n * sumX2 - sumX * sumX
    if (denominator === 0) {
      this.slope = 0
      this.intercept = sumY / n
    } else {
      this.slope = (n * sumXY - sumX * sumY) / denominator
      this.intercept = (sumY - this.slope * sumX) / n
    }

    return this
  }

  predict(x) {
    return this.slope * x + this.intercept
  }
}

/**
 * Moving Average Calculator
 */
function movingAverage(data, windowSize = 3) {
  if (data.length < windowSize) return data
  
  const result = []
  for (let i = windowSize - 1; i < data.length; i++) {
    const sum = data.slice(i - windowSize + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / windowSize)
  }
  return result
}

/**
 * Exponential Moving Average
 */
function exponentialMovingAverage(data, alpha = 0.3) {
  if (data.length === 0) return []
  
  const result = [data[0]]
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1])
  }
  return result
}

/**
 * Seasonal adjustment (simple)
 */
function getSeasonalFactor(month) {
  // Maharashtra seasonal factors for agriculture
  const factors = {
    // Winter (Rabi season)
    1: { temp: -3, humidity: -10, rainfall: 0.1 },
    2: { temp: 0, humidity: -15, rainfall: 0.1 },
    // Pre-monsoon
    3: { temp: 3, humidity: -10, rainfall: 0.2 },
    4: { temp: 5, humidity: 0, rainfall: 0.3 },
    5: { temp: 5, humidity: 10, rainfall: 0.5 },
    // Monsoon (Kharif season)
    6: { temp: 0, humidity: 30, rainfall: 1.0 },
    7: { temp: -2, humidity: 40, rainfall: 1.5 },
    8: { temp: -2, humidity: 35, rainfall: 1.3 },
    9: { temp: 0, humidity: 25, rainfall: 0.8 },
    // Post-monsoon
    10: { temp: 0, humidity: 5, rainfall: 0.3 },
    11: { temp: -2, humidity: -5, rainfall: 0.1 },
    12: { temp: -4, humidity: -10, rainfall: 0.1 }
  }
  return factors[month] || { temp: 0, humidity: 0, rainfall: 0 }
}

/**
 * Main Prediction Function
 * Predicts weather for the next 7-14 days using historical data
 */
export async function predictWeather(lat, lon, daysAhead = 7) {
  // Check for cached prediction first
  const cached = await getLatestPrediction(lat, lon)
  if (cached) {
    return cached
  }

  // Get historical data (last 30 days)
  const history = await getDailyWeatherStats(lat, lon, 30)
  
  if (history.length < 5) {
    // Not enough data - return null (will use API forecast only)
    return null
  }

  // Prepare data for regression
  const temps = history.map(h => h.avgTemp)
  const humidity = history.map(h => h.avgHumidity)
  const pressure = history.map(h => h.avgPressure || 1013)
  const xValues = Array.from({ length: temps.length }, (_, i) => i)

  // Fit models
  const tempModel = new SimpleLinearRegression().fit(xValues, temps)
  const humidityModel = new SimpleLinearRegression().fit(xValues, humidity)
  const pressureModel = new SimpleLinearRegression().fit(xValues, pressure)

  // Calculate volatility (standard deviation)
  const tempStd = standardDeviation(temps)
  const humidityStd = standardDeviation(humidity)

  // Generate predictions
  const predictions = []
  const today = new Date()
  const currentMonth = today.getMonth() + 1

  for (let i = 1; i <= daysAhead; i++) {
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + i)
    
    const predMonth = futureDate.getMonth() + 1
    const seasonalFactor = getSeasonalFactor(predMonth)
    
    // Predict using trend + seasonal adjustment
    const baseTemp = tempModel.predict(temps.length + i - 1)
    const baseHumidity = humidityModel.predict(humidity.length + i - 1)
    const basePressure = pressureModel.predict(pressure.length + i - 1)

    // Add seasonal adjustments
    const predictedTemp = Math.round(baseTemp + seasonalFactor.temp)
    const predictedHumidity = Math.round(
      Math.max(20, Math.min(100, baseHumidity + seasonalFactor.humidity))
    )
    const predictedPressure = Math.round(basePressure)

    // Estimate conditions based on patterns
    const condition = estimateCondition(predictedTemp, predictedHumidity, predMonth)
    
    // Confidence decreases with distance
    const confidence = Math.max(0.3, 0.9 - (i * 0.08))

    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      dayName: getDayName(futureDate),
      temp: predictedTemp,
      tempMin: predictedTemp - Math.round(tempStd * 0.5),
      tempMax: predictedTemp + Math.round(tempStd * 0.5),
      humidity: predictedHumidity,
      pressure: predictedPressure,
      condition,
      confidence,
      isMLPrediction: true
    })
  }

  // Calculate trends
  const trends = {
    temperature: tempModel.slope > 0.1 ? 'rising' : tempModel.slope < -0.1 ? 'falling' : 'stable',
    humidity: humidityModel.slope > 0.5 ? 'rising' : humidityModel.slope < -0.5 ? 'falling' : 'stable',
    pressure: pressureModel.slope > 0.5 ? 'rising' : pressureModel.slope < -0.5 ? 'falling' : 'stable'
  }

  const prediction = {
    lat,
    lon,
    predictions,
    trends,
    modelInfo: {
      dataPoints: history.length,
      tempSlope: tempModel.slope.toFixed(3),
      humiditySlope: humidityModel.slope.toFixed(3),
      tempStd: tempStd.toFixed(2),
      humidityStd: humidityStd.toFixed(2)
    }
  }

  // Save prediction for caching
  await saveWeatherPrediction(prediction)

  return prediction
}

/**
 * Get farming recommendations based on predicted weather
 */
export function getFarmingInsights(predictions, crop = 'soybean') {
  if (!predictions || predictions.length === 0) {
    return getDefaultInsights()
  }

  const insights = []
  const avgTemp = predictions.reduce((a, p) => a + p.temp, 0) / predictions.length
  const avgHumidity = predictions.reduce((a, p) => a + p.humidity, 0) / predictions.length
  const hasRain = predictions.some(p => ['Rain', 'Drizzle', 'Thunderstorm'].includes(p.condition))
  const highHumidityDays = predictions.filter(p => p.humidity > 80).length

  // Crop-specific recommendations
  const cropRecommendations = {
    soybean: {
      idealTemp: { min: 20, max: 30 },
      idealHumidity: { min: 50, max: 70 },
      diseaseRiskHumidity: 80
    },
    cotton: {
      idealTemp: { min: 25, max: 35 },
      idealHumidity: { min: 40, max: 60 },
      diseaseRiskHumidity: 75
    }
  }

  const cropConfig = cropRecommendations[crop] || cropRecommendations.soybean

  // Temperature insights
  if (avgTemp < cropConfig.idealTemp.min) {
    insights.push({
      type: 'warning',
      category: 'temperature',
      titleMr: '🌡️ थंडी सावधान',
      titleEn: 'Cold Weather Alert',
      messageMr: `सरासरी तापमान ${Math.round(avgTemp)}°C आहे जे ${crop === 'soybean' ? 'सोयाबीन' : 'कापूस'}साठी कमी आहे. पिकांना संरक्षण द्या.`,
      messageEn: `Average temperature of ${Math.round(avgTemp)}°C is below optimal. Protect your crops.`,
      action: crop === 'soybean' 
        ? 'मल्चिंग करा आणि सिंचन सकाळी करा'
        : 'पीक आच्छादन वापरा'
    })
  } else if (avgTemp > cropConfig.idealTemp.max) {
    insights.push({
      type: 'warning',
      category: 'temperature',
      titleMr: '☀️ उष्णता सावधान',
      titleEn: 'Heat Wave Alert',
      messageMr: `सरासरी तापमान ${Math.round(avgTemp)}°C आहे जे जास्त आहे. पिकांना पाणी द्या.`,
      messageEn: `Average temperature of ${Math.round(avgTemp)}°C is high. Ensure adequate irrigation.`,
      action: 'सकाळी लवकर किंवा संध्याकाळी सिंचन करा'
    })
  } else {
    insights.push({
      type: 'success',
      category: 'temperature',
      titleMr: '✅ तापमान योग्य',
      titleEn: 'Optimal Temperature',
      messageMr: `तापमान ${crop === 'soybean' ? 'सोयाबीन' : 'कापूस'} वाढीसाठी अनुकूल आहे.`,
      messageEn: `Temperature is favorable for ${crop} growth.`
    })
  }

  // Humidity & Disease Risk
  if (avgHumidity > cropConfig.diseaseRiskHumidity || highHumidityDays > 3) {
    insights.push({
      type: 'danger',
      category: 'disease',
      titleMr: '⚠️ रोग धोका जास्त',
      titleEn: 'High Disease Risk',
      messageMr: `आर्द्रता ${Math.round(avgHumidity)}% आहे. ${highHumidityDays} दिवस जास्त आर्द्रता असेल. बुरशीजन्य रोगांचा धोका वाढला आहे.`,
      messageEn: `Humidity at ${Math.round(avgHumidity)}% with ${highHumidityDays} high-humidity days. Increased fungal disease risk.`,
      action: 'प्रतिबंधात्मक बुरशीनाशक फवारणी करा. पीक तपासणी वाढवा.'
    })
  }

  // Rain insights
  if (hasRain) {
    const rainyDays = predictions.filter(p => ['Rain', 'Drizzle', 'Thunderstorm'].includes(p.condition))
    insights.push({
      type: 'info',
      category: 'rain',
      titleMr: '🌧️ पावसाची शक्यता',
      titleEn: 'Rain Expected',
      messageMr: `पुढील ${predictions.length} दिवसांत ${rainyDays.length} दिवस पाऊस पडण्याची शक्यता आहे.`,
      messageEn: `Rain expected on ${rainyDays.length} of the next ${predictions.length} days.`,
      action: 'फवारणी टाळा. पाण्याचा निचरा तपासा. काढणी पुढे ढकला.'
    })
  }

  // Spraying window recommendation
  const goodSprayDays = predictions.filter(p => 
    !['Rain', 'Drizzle', 'Thunderstorm'].includes(p.condition) && 
    p.humidity < 70
  )
  if (goodSprayDays.length > 0) {
    insights.push({
      type: 'success',
      category: 'spraying',
      titleMr: '💨 फवारणीसाठी योग्य दिवस',
      titleEn: 'Good Spraying Days',
      messageMr: `फवारणीसाठी योग्य: ${goodSprayDays.slice(0, 3).map(d => d.dayName).join(', ')}`,
      messageEn: `Best days for spraying: ${goodSprayDays.slice(0, 3).map(d => d.date).join(', ')}`,
      action: 'सकाळी 7-10 किंवा संध्याकाळी 4-6 वाजता फवारणी करा'
    })
  }

  // Irrigation recommendation
  if (!hasRain && avgHumidity < 50) {
    insights.push({
      type: 'warning',
      category: 'irrigation',
      titleMr: '💧 सिंचन आवश्यक',
      titleEn: 'Irrigation Needed',
      messageMr: 'कमी आर्द्रता आणि पावसाची शक्यता नाही. नियमित सिंचन करा.',
      messageEn: 'Low humidity and no rain expected. Ensure regular irrigation.',
      action: 'ठिबक किंवा तुषार सिंचन वापरा'
    })
  }

  return insights
}

/**
 * Default insights when no prediction data available
 */
function getDefaultInsights() {
  return [{
    type: 'info',
    category: 'data',
    titleMr: '📊 डेटा संकलन सुरू',
    titleEn: 'Collecting Weather Data',
    messageMr: 'अचूक अंदाजासाठी हवामान डेटा संकलित केला जात आहे. काही दिवसांत अंदाज उपलब्ध होतील.',
    messageEn: 'Weather data is being collected for accurate predictions. Predictions will be available in a few days.',
    action: 'दररोज अॅप उघडा जेणेकरून डेटा संकलन होईल'
  }]
}

/**
 * Get crop calendar recommendations
 */
export function getCropCalendar(crop, currentMonth) {
  const calendar = {
    soybean: {
      6: { stage: 'पेरणी', en: 'Sowing', activities: ['पूर्वमशागत', 'बियाणे प्रक्रिया', 'पेरणी'] },
      7: { stage: 'उगवण', en: 'Germination', activities: ['तण व्यवस्थापन', 'पहिली खुरपणी'] },
      8: { stage: 'वाढ', en: 'Vegetative', activities: ['खत व्यवस्थापन', 'कीड निरीक्षण'] },
      9: { stage: 'फुलोरा', en: 'Flowering', activities: ['फवारणी', 'सिंचन'] },
      10: { stage: 'शेंग भरणे', en: 'Pod Filling', activities: ['रोग निरीक्षण', 'पाणी व्यवस्थापन'] },
      11: { stage: 'परिपक्वता', en: 'Maturity', activities: ['काढणी तयारी', 'साठवण व्यवस्था'] }
    },
    cotton: {
      5: { stage: 'पेरणी', en: 'Sowing', activities: ['जमीन तयारी', 'बियाणे उपचार'] },
      6: { stage: 'उगवण', en: 'Germination', activities: ['विरळणी', 'तण नियंत्रण'] },
      7: { stage: 'वाढ', en: 'Vegetative', activities: ['खत व्यवस्थापन', 'पीक संरक्षण'] },
      8: { stage: 'फुलोरा', en: 'Flowering', activities: ['बोंड अळी निरीक्षण', 'सिंचन'] },
      9: { stage: 'बोंड विकास', en: 'Boll Development', activities: ['रोग नियंत्रण', 'पोषण'] },
      10: { stage: 'बोंड फुटणे', en: 'Boll Opening', activities: ['वेचणी तयारी'] },
      11: { stage: 'वेचणी', en: 'Picking', activities: ['पहिली वेचणी', 'ग्रेडिंग'] },
      12: { stage: 'वेचणी', en: 'Picking', activities: ['दुसरी वेचणी', 'साठवण'] }
    }
  }

  return calendar[crop]?.[currentMonth] || {
    stage: 'विश्रांती काळ',
    en: 'Off Season',
    activities: ['जमीन तयारी', 'पुढील हंगामाची योजना']
  }
}

// Helper functions
function standardDeviation(values) {
  const n = values.length
  if (n === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / n
  const squareDiffs = values.map(v => Math.pow(v - mean, 2))
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / n)
}

function estimateCondition(temp, humidity, month) {
  // Monsoon months (June-September) - higher chance of rain
  if (month >= 6 && month <= 9) {
    if (humidity > 80) return 'Rain'
    if (humidity > 70) return 'Clouds'
  }
  
  if (humidity > 85) return 'Rain'
  if (humidity > 70) return 'Clouds'
  if (humidity < 40) return 'Clear'
  
  return 'Clouds'
}

function getDayName(date) {
  const days = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार']
  return days[date.getDay()]
}

export { movingAverage, exponentialMovingAverage }
