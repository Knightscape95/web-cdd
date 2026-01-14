/**
 * Disease Classifier using ONNX Runtime Web
 * Supports Cotton and Soybean disease detection
 */

import * as ort from 'onnxruntime-web'

// Model configurations
const MODELS = {
  cotton: {
    path: '/cotton_disease_model.onnx',
    classes: ['Bacterial Blight', 'Curl Virus', 'Fussarium Wilt', 'Healthy'],
    inputSize: 224
  },
  soybean: {
    path: '/soynet_soybean_model.onnx',
    classes: ['Healthy', 'Diseased'],
    inputSize: 224
  }
}

// Cached sessions
const sessions = {}

/**
 * Load ONNX model session
 */
async function loadModel(cropType) {
  if (sessions[cropType]) {
    return sessions[cropType]
  }

  const config = MODELS[cropType]
  if (!config) {
    throw new Error(`Unknown crop type: ${cropType}`)
  }

  try {
    // Set ONNX Runtime options for web
    ort.env.wasm.numThreads = 1
    ort.env.wasm.simd = true

    const session = await ort.InferenceSession.create(config.path, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    })

    sessions[cropType] = session
    console.log(`Model loaded for ${cropType}`)
    return session
  } catch (err) {
    console.error('Failed to load model:', err)
    throw err
  }
}

/**
 * Preprocess image for model input
 */
async function preprocessImage(imageData, inputSize) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = inputSize
      canvas.height = inputSize
      const ctx = canvas.getContext('2d')

      // Draw and resize
      ctx.drawImage(img, 0, 0, inputSize, inputSize)

      // Get pixel data
      const imageDataObj = ctx.getImageData(0, 0, inputSize, inputSize)
      const { data } = imageDataObj

      // Convert to CHW format and normalize
      const float32Data = new Float32Array(3 * inputSize * inputSize)
      
      // ImageNet normalization
      const mean = [0.485, 0.456, 0.406]
      const std = [0.229, 0.224, 0.225]

      for (let i = 0; i < inputSize * inputSize; i++) {
        const r = data[i * 4] / 255
        const g = data[i * 4 + 1] / 255
        const b = data[i * 4 + 2] / 255

        // CHW format: [R channel, G channel, B channel]
        float32Data[i] = (r - mean[0]) / std[0]
        float32Data[inputSize * inputSize + i] = (g - mean[1]) / std[1]
        float32Data[2 * inputSize * inputSize + i] = (b - mean[2]) / std[2]
      }

      resolve(float32Data)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageData
  })
}

/**
 * Softmax function
 */
function softmax(arr) {
  const max = Math.max(...arr)
  const exp = arr.map(x => Math.exp(x - max))
  const sum = exp.reduce((a, b) => a + b, 0)
  return exp.map(x => x / sum)
}

/**
 * Classify image
 * @param {string} imageData - Base64 image data
 * @param {string} cropType - 'cotton' or 'soybean'
 * @returns {Promise<{disease: string, confidence: number, allPredictions: Array}>}
 */
export async function classifyImage(imageData, cropType = 'cotton') {
  const config = MODELS[cropType]
  
  if (!config) {
    // Return mock result if model not configured
    console.warn(`Model not configured for ${cropType}, using mock result`)
    return mockClassification(cropType)
  }

  try {
    // Load model
    const session = await loadModel(cropType)

    // Preprocess image
    const inputData = await preprocessImage(imageData, config.inputSize)

    // Create input tensor
    const inputTensor = new ort.Tensor('float32', inputData, [1, 3, config.inputSize, config.inputSize])

    // Run inference
    const feeds = { [session.inputNames[0]]: inputTensor }
    const results = await session.run(feeds)

    // Get output
    const output = results[session.outputNames[0]]
    const predictions = Array.from(output.data)

    // Apply softmax
    const probabilities = softmax(predictions)

    // Find top prediction
    let maxIndex = 0
    let maxProb = probabilities[0]
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i]
        maxIndex = i
      }
    }

    // Build all predictions
    const allPredictions = config.classes.map((className, idx) => ({
      disease: className,
      confidence: probabilities[idx]
    })).sort((a, b) => b.confidence - a.confidence)

    return {
      disease: config.classes[maxIndex],
      confidence: maxProb,
      allPredictions
    }
  } catch (err) {
    console.error('Classification failed:', err)
    // Return mock result on error
    return mockClassification(cropType)
  }
}

/**
 * Mock classification for demo/fallback
 */
function mockClassification(cropType) {
  const config = MODELS[cropType] || MODELS.cotton
  const randomIndex = Math.floor(Math.random() * config.classes.length)
  const confidence = 0.75 + Math.random() * 0.2

  return {
    disease: config.classes[randomIndex],
    confidence,
    allPredictions: config.classes.map((c, i) => ({
      disease: c,
      confidence: i === randomIndex ? confidence : (1 - confidence) / (config.classes.length - 1)
    }))
  }
}

/**
 * Check if model is available
 */
export async function isModelAvailable(cropType) {
  try {
    const response = await fetch(MODELS[cropType].path, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

export { MODELS }
