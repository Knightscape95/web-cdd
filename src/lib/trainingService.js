/**
 * Training Data Service
 * Stores scanned images with labels for model training
 * Images are stored with their labels for future ONNX model training
 */

import { openDB } from 'idb'

const DB_NAME = 'crop-disease-db'
const DB_VERSION = 3 // Upgraded version for new training_data store

// Initialize database with training store
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Existing stores...
      if (!db.objectStoreNames.contains('scans')) {
        const scanStore = db.createObjectStore('scans', { keyPath: 'id', autoIncrement: true })
        scanStore.createIndex('timestamp', 'timestamp')
        scanStore.createIndex('crop', 'crop')
        scanStore.createIndex('disease', 'disease')
      }

      if (!db.objectStoreNames.contains('weather_history')) {
        const weatherStore = db.createObjectStore('weather_history', { keyPath: 'id', autoIncrement: true })
        weatherStore.createIndex('timestamp', 'timestamp')
        weatherStore.createIndex('location', 'locationKey')
        weatherStore.createIndex('date', 'date')
      }

      if (!db.objectStoreNames.contains('weather_predictions')) {
        const predStore = db.createObjectStore('weather_predictions', { keyPath: 'id', autoIncrement: true })
        predStore.createIndex('locationKey', 'locationKey')
        predStore.createIndex('createdAt', 'createdAt')
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }

      if (!db.objectStoreNames.contains('images')) {
        const imgStore = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true })
        imgStore.createIndex('scanId', 'scanId')
        imgStore.createIndex('timestamp', 'timestamp')
      }

      // NEW: Training Data Store
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

/**
 * Save an image for training with its label
 * @param {Object} data Training data object
 * @param {string} data.image Base64 image data
 * @param {string} data.crop Crop type (cotton, soybean)
 * @param {string} data.label Disease label (the correct label)
 * @param {string} data.predictedLabel Model's prediction (may differ from label)
 * @param {number} data.confidence Model's confidence score
 * @param {boolean} data.verified Whether the label has been verified/corrected by user
 */
export async function saveTrainingImage(data) {
  const db = await initDB()

  const record = {
    image: data.image,
    crop: data.crop,
    label: data.label,
    predictedLabel: data.predictedLabel || data.label,
    confidence: data.confidence || 0,
    verified: data.verified || false,
    timestamp: new Date().toISOString(),
    metadata: {
      source: data.source || 'scan', // 'scan', 'upload', 'correction'
      deviceInfo: navigator.userAgent,
      imageSize: data.image?.length || 0
    }
  }

  return db.add('training_data', record)
}

/**
 * Get all training data with optional filters
 */
export async function getTrainingData({ crop = null, label = null, verified = null, limit = 100 } = {}) {
  const db = await initDB()
  let records = await db.getAll('training_data')

  // Apply filters
  if (crop) {
    records = records.filter(r => r.crop === crop)
  }
  if (label) {
    records = records.filter(r => r.label === label)
  }
  if (verified !== null) {
    records = records.filter(r => r.verified === verified)
  }

  // Sort by newest first
  records = records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return records.slice(0, limit)
}

/**
 * Get training data statistics
 */
export async function getTrainingStats() {
  const db = await initDB()
  const records = await db.getAll('training_data')

  const stats = {
    total: records.length,
    verified: records.filter(r => r.verified).length,
    unverified: records.filter(r => !r.verified).length,
    byCrop: {},
    byLabel: {},
    correctionRate: 0,
    storageSize: 0
  }

  let corrections = 0

  records.forEach(record => {
    // By crop
    stats.byCrop[record.crop] = (stats.byCrop[record.crop] || 0) + 1
    
    // By label
    const key = `${record.crop}:${record.label}`
    stats.byLabel[key] = (stats.byLabel[key] || 0) + 1

    // Count corrections
    if (record.label !== record.predictedLabel) {
      corrections++
    }

    // Estimate storage size
    stats.storageSize += record.image?.length || 0
  })

  stats.correctionRate = stats.total > 0 ? (corrections / stats.total * 100).toFixed(1) : 0
  stats.storageSizeMB = (stats.storageSize / (1024 * 1024)).toFixed(2)

  return stats
}

/**
 * Update a training record (e.g., to correct label)
 */
export async function updateTrainingLabel(id, newLabel) {
  const db = await initDB()
  const record = await db.get('training_data', id)

  if (!record) {
    throw new Error('Training record not found')
  }

  record.label = newLabel
  record.verified = true
  record.updatedAt = new Date().toISOString()

  return db.put('training_data', record)
}

/**
 * Delete a training record
 */
export async function deleteTrainingRecord(id) {
  const db = await initDB()
  return db.delete('training_data', id)
}

/**
 * Clear all training data
 */
export async function clearAllTrainingData() {
  const db = await initDB()
  const tx = db.transaction('training_data', 'readwrite')
  await tx.objectStore('training_data').clear()
  return true
}

/**
 * Export training data for model training
 * Returns structured data suitable for ONNX model training
 */
export async function exportTrainingData({ crop = null, verifiedOnly = true } = {}) {
  const db = await initDB()
  let records = await db.getAll('training_data')

  if (crop) {
    records = records.filter(r => r.crop === crop)
  }
  if (verifiedOnly) {
    records = records.filter(r => r.verified)
  }

  // Format for training
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalSamples: records.length,
    crop: crop || 'all',
    classes: [...new Set(records.map(r => r.label))],
    samples: records.map(r => ({
      image: r.image,
      label: r.label,
      crop: r.crop,
      confidence: r.confidence,
      timestamp: r.timestamp
    }))
  }

  return exportData
}

/**
 * Export training data as downloadable JSON file
 */
export async function downloadTrainingData(options = {}) {
  const data = await exportTrainingData(options)
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `training_data_${data.crop}_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return data.totalSamples
}

/**
 * Export images as a ZIP-like structure (base64 encoded)
 * Each image is named by its label for easy organization
 */
export async function exportTrainingImages({ crop = null } = {}) {
  const db = await initDB()
  let records = await db.getAll('training_data')

  if (crop) {
    records = records.filter(r => r.crop === crop)
  }

  // Organize by label
  const organized = {}
  records.forEach((record, idx) => {
    const label = record.label.replace(/\s+/g, '_')
    if (!organized[label]) {
      organized[label] = []
    }
    organized[label].push({
      filename: `${label}_${idx + 1}.jpg`,
      image: record.image,
      metadata: {
        crop: record.crop,
        timestamp: record.timestamp,
        confidence: record.confidence
      }
    })
  })

  return {
    exportedAt: new Date().toISOString(),
    crop: crop || 'all',
    labels: Object.keys(organized),
    images: organized,
    totalImages: records.length
  }
}

/**
 * Get sample count for each class (for balanced training)
 */
export async function getClassDistribution(crop = null) {
  const db = await initDB()
  let records = await db.getAll('training_data')

  if (crop) {
    records = records.filter(r => r.crop === crop)
  }

  const distribution = {}
  records.forEach(record => {
    const key = record.label
    distribution[key] = (distribution[key] || 0) + 1
  })

  return distribution
}

/**
 * Check if we have enough samples for training
 */
export async function checkTrainingReadiness(minSamplesPerClass = 10) {
  const stats = await getTrainingStats()
  const distribution = await getClassDistribution()

  const classes = Object.entries(distribution)
  const readyClasses = classes.filter(([_, count]) => count >= minSamplesPerClass)

  return {
    isReady: readyClasses.length >= 2, // Need at least 2 classes
    totalSamples: stats.total,
    verifiedSamples: stats.verified,
    classDistribution: distribution,
    minSamplesRequired: minSamplesPerClass,
    recommendation: classes.length < 2 
      ? 'Need samples from at least 2 different classes'
      : readyClasses.length < classes.length
        ? `Some classes have fewer than ${minSamplesPerClass} samples`
        : 'Ready for training!'
  }
}
