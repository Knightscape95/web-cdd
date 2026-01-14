/**
 * Weather Service
 * Fetches weather data from OpenWeatherMap API
 * Supports current weather, 5-day forecast, and historical data collection
 */

import { saveWeatherData, getWeatherHistory } from './database'
import { getLocation } from './locationService'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

// Cache for API responses
const cache = new Map()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * Get user's current location (uses centralized location service)
 */
export async function getCurrentLocation() {
  return getLocation()
}

/**
 * Get location name from coordinates (reverse geocoding)
 */
export async function getLocationName(lat, lon) {
  const cacheKey = `geo_${lat.toFixed(2)}_${lon.toFixed(2)}`
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    )
    
    if (!response.ok) throw new Error('Geocoding failed')
    
    const data = await response.json()
    const location = data[0] || {}
    
    const result = {
      city: location.local_names?.mr || location.name || 'अज्ञात',
      cityEn: location.name || 'Unknown',
      state: location.state || '',
      country: location.country || ''
    }
    
    cache.set(cacheKey, result)
    return result
  } catch (err) {
    console.error('Reverse geocoding error:', err)
    return { city: 'अज्ञात स्थान', cityEn: 'Unknown Location' }
  }
}

/**
 * Fetch current weather data
 */
export async function getCurrentWeather(lat, lon) {
  const cacheKey = `current_${lat.toFixed(2)}_${lon.toFixed(2)}`
  const cached = cache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=mr`
    )
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    const weather = {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDeg: data.wind.deg,
      clouds: data.clouds.all,
      visibility: data.visibility,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000),
      lat,
      lon,
      fetchedAt: new Date().toISOString()
    }

    // Save to history for building predictions
    await saveWeatherData(weather)
    
    cache.set(cacheKey, { data: weather, timestamp: Date.now() })
    return weather
  } catch (err) {
    console.error('Weather fetch error:', err)
    throw err
  }
}

/**
 * Fetch 5-day / 3-hour forecast (free API)
 */
export async function getForecast(lat, lon) {
  const cacheKey = `forecast_${lat.toFixed(2)}_${lon.toFixed(2)}`
  const cached = cache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const response = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=mr`
    )
    
    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Process forecast data
    const forecasts = data.list.map(item => ({
      dt: new Date(item.dt * 1000),
      temp: Math.round(item.main.temp),
      tempMin: Math.round(item.main.temp_min),
      tempMax: Math.round(item.main.temp_max),
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      windSpeed: item.wind.speed,
      clouds: item.clouds.all,
      condition: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      pop: item.pop, // Probability of precipitation
      rain: item.rain?.['3h'] || 0
    }))

    // Group by day
    const dailyForecasts = groupForecastByDay(forecasts)
    
    const result = {
      hourly: forecasts,
      daily: dailyForecasts,
      city: data.city.name,
      fetchedAt: new Date().toISOString()
    }
    
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch (err) {
    console.error('Forecast fetch error:', err)
    throw err
  }
}

/**
 * Group 3-hourly forecast into daily summaries
 */
function groupForecastByDay(forecasts) {
  const days = {}
  
  forecasts.forEach(f => {
    const dateKey = f.dt.toISOString().split('T')[0]
    
    if (!days[dateKey]) {
      days[dateKey] = {
        date: dateKey,
        temps: [],
        humidity: [],
        conditions: [],
        icons: [],
        pops: [],
        rain: 0
      }
    }
    
    days[dateKey].temps.push(f.temp)
    days[dateKey].humidity.push(f.humidity)
    days[dateKey].conditions.push(f.condition)
    days[dateKey].icons.push(f.icon)
    days[dateKey].pops.push(f.pop)
    days[dateKey].rain += f.rain
  })

  return Object.values(days).map(day => ({
    date: day.date,
    dayName: getDayName(new Date(day.date)),
    tempMin: Math.min(...day.temps),
    tempMax: Math.max(...day.temps),
    avgHumidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
    condition: getMostFrequent(day.conditions),
    icon: getMostFrequent(day.icons),
    pop: Math.max(...day.pops),
    totalRain: day.rain
  })).slice(0, 5)
}

/**
 * Get weather statistics for farming insights
 */
export async function getWeatherStats(lat, lon, days = 7) {
  const history = await getWeatherHistory(lat, lon, days)
  
  if (history.length === 0) {
    return null
  }

  const temps = history.map(h => h.temp)
  const humidity = history.map(h => h.humidity)
  const pressure = history.map(h => h.pressure)

  return {
    avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
    minTemp: Math.min(...temps),
    maxTemp: Math.max(...temps),
    avgHumidity: Math.round(humidity.reduce((a, b) => a + b, 0) / humidity.length),
    avgPressure: Math.round(pressure.reduce((a, b) => a + b, 0) / pressure.length),
    recordCount: history.length,
    dateRange: {
      from: history[0]?.date,
      to: history[history.length - 1]?.date
    }
  }
}

/**
 * Get weather icon URL
 */
export function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}

/**
 * Get weather condition in Marathi
 */
export function getConditionMarathi(condition) {
  const conditions = {
    'Clear': 'स्वच्छ',
    'Clouds': 'ढगाळ',
    'Rain': 'पाऊस',
    'Drizzle': 'रिमझिम',
    'Thunderstorm': 'गडगडाट',
    'Snow': 'बर्फ',
    'Mist': 'धुके',
    'Fog': 'धुके',
    'Haze': 'धूसर',
    'Dust': 'धूळ',
    'Smoke': 'धूर'
  }
  return conditions[condition] || condition
}

/**
 * Get wind direction in Marathi
 */
export function getWindDirection(deg) {
  const directions = [
    { min: 0, max: 22.5, mr: 'उत्तर', en: 'N' },
    { min: 22.5, max: 67.5, mr: 'ईशान्य', en: 'NE' },
    { min: 67.5, max: 112.5, mr: 'पूर्व', en: 'E' },
    { min: 112.5, max: 157.5, mr: 'आग्नेय', en: 'SE' },
    { min: 157.5, max: 202.5, mr: 'दक्षिण', en: 'S' },
    { min: 202.5, max: 247.5, mr: 'नैऋत्य', en: 'SW' },
    { min: 247.5, max: 292.5, mr: 'पश्चिम', en: 'W' },
    { min: 292.5, max: 337.5, mr: 'वायव्य', en: 'NW' },
    { min: 337.5, max: 360, mr: 'उत्तर', en: 'N' }
  ]
  
  const dir = directions.find(d => deg >= d.min && deg < d.max)
  return dir || directions[0]
}

// Helper functions
function getDayName(date) {
  const days = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार']
  return days[date.getDay()]
}

function getMostFrequent(arr) {
  const counts = {}
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
}
