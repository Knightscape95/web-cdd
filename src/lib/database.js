/**
 * Database Service using IndexedDB
 * Stores weather history, scan records, images, and training data
 */

import { openDB } from 'idb'

const DB_NAME = 'crop-disease-db'
const DB_VERSION = 3 // Upgraded to version 3 for training_data store

// Initialize database with all stores
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Scan History Store
      if (!db.objectStoreNames.contains('scans')) {
        const scanStore = db.createObjectStore('scans', { keyPath: 'id', autoIncrement: true })
        scanStore.createIndex('timestamp', 'timestamp')
        scanStore.createIndex('crop', 'crop')
        scanStore.createIndex('disease', 'disease')
      }

      // Weather History Store - for collecting data over time
      if (!db.objectStoreNames.contains('weather_history')) {
        const weatherStore = db.createObjectStore('weather_history', { keyPath: 'id', autoIncrement: true })
        weatherStore.createIndex('timestamp', 'timestamp')
        weatherStore.createIndex('location', 'locationKey')
        weatherStore.createIndex('date', 'date')
      }

      // Weather Predictions Store - cached predictions
      if (!db.objectStoreNames.contains('weather_predictions')) {
        const predStore = db.createObjectStore('weather_predictions', { keyPath: 'id', autoIncrement: true })
        predStore.createIndex('locationKey', 'locationKey')
        predStore.createIndex('createdAt', 'createdAt')
      }

      // Location Settings Store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }

      // Images Store - for scan images (blob storage)
      if (!db.objectStoreNames.contains('images')) {
        const imgStore = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true })
        imgStore.createIndex('scanId', 'scanId')
        imgStore.createIndex('timestamp', 'timestamp')
      }

      // Training Data Store - for storing images with labels for model training
      if (!db.objectStoreNames.contains('training_data')) {
        const trainingStore = db.createObjectStore('training_data', { keyPath: 'id', autoIncrement: true })
        trainingStore.createIndex('crop', 'crop')
        trainingStore.createIndex('label', 'label')
        trainingStore.createIndex('timestamp', 'timestamp')
        trainingStore.createIndex('verified', 'verified')
      }
    }
  })
}

// ============== SCAN RECORDS ==============

/**
 * Save a scan record with image
 */
export async function saveScan(scanData) {
  const db = await initDB()
  
  // Extract image data to store separately (more efficient)
  const { image, ...scanRecord } = scanData
  scanRecord.timestamp = scanRecord.timestamp || new Date().toISOString()
  scanRecord.hasImage = !!image

  // Save scan record
  const scanId = await db.add('scans', scanRecord)

  // Save image separately if exists
  if (image) {
    await db.add('images', {
      scanId,
      image,
      timestamp: scanRecord.timestamp
    })
  }

  return scanId
}

/**
 * Get all scans with optional filters
 */
export async function getScans({ limit = 50, crop = null, disease = null } = {}) {
  const db = await initDB()
  let scans = await db.getAllFromIndex('scans', 'timestamp')
  
  // Sort by newest first
  scans = scans.reverse()

  // Apply filters
  if (crop) {
    scans = scans.filter(s => s.crop === crop)
  }
  if (disease) {
    scans = scans.filter(s => s.disease === disease)
  }

  return scans.slice(0, limit)
}

/**
 * Get scan by ID with image
 */
export async function getScanById(id) {
  const db = await initDB()
  const scan = await db.get('scans', id)
  
  if (scan && scan.hasImage) {
    const images = await db.getAllFromIndex('images', 'scanId')
    const imageRecord = images.find(img => img.scanId === id)
    if (imageRecord) {
      scan.image = imageRecord.image
    }
  }
  
  return scan
}

/**
 * Delete a scan and its image
 */
export async function deleteScan(id) {
  const db = await initDB()
  
  // Delete image first
  const images = await db.getAllFromIndex('images', 'scanId')
  const imageRecord = images.find(img => img.scanId === id)
  if (imageRecord) {
    await db.delete('images', imageRecord.id)
  }
  
  // Delete scan
  await db.delete('scans', id)
}

/**
 * Get scan statistics
 */
export async function getScanStats() {
  const db = await initDB()
  const scans = await db.getAll('scans')
  
  const stats = {
    total: scans.length,
    byCrop: {},
    byDisease: {},
    byMonth: {},
    healthyCount: 0,
    diseasedCount: 0
  }

  scans.forEach(scan => {
    // By crop
    stats.byCrop[scan.crop] = (stats.byCrop[scan.crop] || 0) + 1
    
    // By disease
    stats.byDisease[scan.disease] = (stats.byDisease[scan.disease] || 0) + 1
    
    // By month
    const month = scan.timestamp.substring(0, 7) // YYYY-MM
    stats.byMonth[month] = (stats.byMonth[month] || 0) + 1
    
    // Healthy vs diseased
    if (scan.disease?.toLowerCase().includes('healthy')) {
      stats.healthyCount++
    } else {
      stats.diseasedCount++
    }
  })

  return stats
}

// ============== WEATHER HISTORY ==============

/**
 * Save weather data point for historical tracking
 */
export async function saveWeatherData(weatherData) {
  const db = await initDB()
  
  const record = {
    ...weatherData,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    locationKey: `${weatherData.lat.toFixed(2)}_${weatherData.lon.toFixed(2)}`
  }

  return db.add('weather_history', record)
}

/**
 * Get weather history for a location
 */
export async function getWeatherHistory(lat, lon, days = 30) {
  const db = await initDB()
  const locationKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`
  
  const allRecords = await db.getAllFromIndex('weather_history', 'location')
  const locationRecords = allRecords.filter(r => r.locationKey === locationKey)
  
  // Get records from last N days
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  return locationRecords
    .filter(r => new Date(r.timestamp) >= cutoffDate)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

/**
 * Get daily aggregated weather data
 */
export async function getDailyWeatherStats(lat, lon, days = 30) {
  const history = await getWeatherHistory(lat, lon, days)
  
  // Group by date
  const byDate = {}
  history.forEach(record => {
    const date = record.date
    if (!byDate[date]) {
      byDate[date] = {
        date,
        temps: [],
        humidity: [],
        pressure: [],
        windSpeed: [],
        conditions: []
      }
    }
    byDate[date].temps.push(record.temp)
    byDate[date].humidity.push(record.humidity)
    byDate[date].pressure.push(record.pressure)
    byDate[date].windSpeed.push(record.windSpeed)
    byDate[date].conditions.push(record.condition)
  })

  // Calculate daily stats
  return Object.values(byDate).map(day => ({
    date: day.date,
    avgTemp: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
    minTemp: Math.min(...day.temps),
    maxTemp: Math.max(...day.temps),
    avgHumidity: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
    avgPressure: day.pressure.reduce((a, b) => a + b, 0) / day.pressure.length,
    avgWindSpeed: day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length,
    dominantCondition: getMostFrequent(day.conditions)
  })).sort((a, b) => new Date(a.date) - new Date(b.date))
}

/**
 * Clear old weather data (keep last 90 days)
 */
export async function cleanupOldWeatherData() {
  const db = await initDB()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)
  
  const allRecords = await db.getAll('weather_history')
  const oldRecords = allRecords.filter(r => new Date(r.timestamp) < cutoffDate)
  
  for (const record of oldRecords) {
    await db.delete('weather_history', record.id)
  }
  
  return oldRecords.length
}

// ============== WEATHER PREDICTIONS ==============

/**
 * Save weather prediction
 */
export async function saveWeatherPrediction(prediction) {
  const db = await initDB()
  
  const record = {
    ...prediction,
    createdAt: new Date().toISOString(),
    locationKey: `${prediction.lat.toFixed(2)}_${prediction.lon.toFixed(2)}`
  }

  return db.add('weather_predictions', record)
}

/**
 * Get latest prediction for location
 */
export async function getLatestPrediction(lat, lon) {
  const db = await initDB()
  const locationKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`
  
  const allPredictions = await db.getAllFromIndex('weather_predictions', 'locationKey')
  const locationPredictions = allPredictions.filter(p => p.locationKey === locationKey)
  
  if (locationPredictions.length === 0) return null
  
  // Get most recent prediction (less than 6 hours old)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
  const recent = locationPredictions
    .filter(p => new Date(p.createdAt) > sixHoursAgo)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  return recent[0] || null
}

// ============== SETTINGS ==============

/**
 * Save a setting
 */
export async function saveSetting(key, value) {
  const db = await initDB()
  return db.put('settings', { key, value, updatedAt: new Date().toISOString() })
}

/**
 * Get a setting
 */
export async function getSetting(key, defaultValue = null) {
  const db = await initDB()
  const setting = await db.get('settings', key)
  return setting?.value ?? defaultValue
}

/**
 * Get all settings
 */
export async function getAllSettings() {
  const db = await initDB()
  const settings = await db.getAll('settings')
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
}

// ============== UTILITIES ==============

function getMostFrequent(arr) {
  const counts = {}
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
}

/**
 * Export all data (for backup)
 */
export async function exportAllData() {
  const db = await initDB()
  
  return {
    scans: await db.getAll('scans'),
    weatherHistory: await db.getAll('weather_history'),
    predictions: await db.getAll('weather_predictions'),
    settings: await db.getAll('settings'),
    exportedAt: new Date().toISOString()
  }
}

/**
 * Get database statistics
 */
export async function getDBStats() {
  const db = await initDB()
  
  return {
    scansCount: (await db.getAll('scans')).length,
    weatherRecordsCount: (await db.getAll('weather_history')).length,
    predictionsCount: (await db.getAll('weather_predictions')).length,
    imagesCount: (await db.getAll('images')).length
  }
}
