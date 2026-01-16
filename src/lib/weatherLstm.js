/**
 * Weather LSTM Predictor (ONNX)
 * Loads `/weather_lstm.onnx` with ONNX Runtime Web and provides a wrapper
 * to predict temperature, humidity and pressure for next N days given historical daily stats.
 *
 * This is defensive — any failure falls back to statistical predictor in `weatherPredictor.js`.
 */

import * as ort from 'onnxruntime-web'

const MODEL_PATH = '/weather_lstm.onnx'
let session = null

// Normalization constants - adjust if you know exact training preprocessing
const NORM = {
  tempScale: 50.0, // temperatures typically in -10..40 -> scale by 50
  humidityScale: 100.0,
  pressureScale: 1100.0
}

export async function isLstmModelAvailable() {
  try {
    const res = await fetch(MODEL_PATH, { method: 'HEAD' })
    return res.ok
  } catch (e) {
    return false
  }
}

export async function loadLstmModel() {
  if (session) return session

  try {
    ort.env.wasm.numThreads = 1
    ort.env.wasm.simd = true

    session = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    })

    console.log('Weather LSTM model loaded')
    return session
  } catch (err) {
    console.error('Failed to load weather LSTM model:', err)
    session = null
    throw err
  }
}

/**
 * Convert history to model input tensor
 * @param {Array} history - array of {avgTemp, avgHumidity, avgPressure}
 * @returns {ort.Tensor} - shape [1, seq_len, features]
 */
function buildInputTensor(history) {
  const seqLen = history.length
  const features = 3
  const data = new Float32Array(1 * seqLen * features)

  for (let i = 0; i < seqLen; i++) {
    const h = history[i]
    data[i * features + 0] = (h.avgTemp || 0) / NORM.tempScale
    data[i * features + 1] = (h.avgHumidity || 0) / NORM.humidityScale
    data[i * features + 2] = (h.avgPressure || 1013) / NORM.pressureScale
  }

  // NOTE: Many ONNX RNNs expect input shape [seq_len, batch, features] or [1, seq_len, features].
  // We'll pass [1, seq_len, features] which is common for consumer models. If your model expects
  // another layout you may need to transpose accordingly.
  return new ort.Tensor('float32', data, [1, seqLen, features])
}

/**
 * Run the LSTM model to predict next days
 * @param {Array} history - recent daily stats (length should be >= sequence expected)
 * @param {number} daysAhead - how many days to predict
 * @returns {Promise<Array>} - array of predictions [{temp, humidity, pressure}] or null on failure
 */
export async function predictWithLstm(history, daysAhead = 7) {
  if (!history || history.length < 5) return null

  try {
    await loadLstmModel()
    if (!session) return null

    const inputTensor = buildInputTensor(history)

    const feeds = { [session.inputNames[0]]: inputTensor }
    const results = await session.run(feeds)

    // Find first float output
    const outputName = session.outputNames[0]
    const output = results[outputName]
    if (!output || !output.data) return null

    const outData = Float32Array.from(output.data)
    const dims = output.dims // e.g. [1, daysAhead, features] or [daysAhead, features]

    // Normalize back using same scales
    const preds = []

    if (dims.length === 3 && dims[0] === 1) {
      const seq = dims[1]
      const features = dims[2]
      for (let i = 0; i < Math.min(daysAhead, seq); i++) {
        const base = i * features
        const temp = outData[base + 0] * NORM.tempScale
        const humidity = outData[base + 1] * NORM.humidityScale
        const pressure = outData[base + 2] * NORM.pressureScale
        preds.push({ temp: Math.round(temp), humidity: Math.round(humidity), pressure: Math.round(pressure) })
      }
    } else if (dims.length === 2) {
      const seq = dims[0]
      const features = dims[1]
      for (let i = 0; i < Math.min(daysAhead, seq); i++) {
        const base = i * features
        const temp = outData[base + 0] * NORM.tempScale
        const humidity = outData[base + 1] * NORM.humidityScale
        const pressure = outData[base + 2] * NORM.pressureScale
        preds.push({ temp: Math.round(temp), humidity: Math.round(humidity), pressure: Math.round(pressure) })
      }
    } else {
      // Unknown output shape; attempt to parse sequentially
      const features = 3
      for (let i = 0; i < Math.min(daysAhead, Math.floor(outData.length / features)); i++) {
        const base = i * features
        preds.push({
          temp: Math.round(outData[base + 0] * NORM.tempScale),
          humidity: Math.round(outData[base + 1] * NORM.humidityScale),
          pressure: Math.round(outData[base + 2] * NORM.pressureScale)
        })
      }
    }

    return preds
  } catch (err) {
    console.error('LSTM prediction failed:', err)
    return null
  }
}
