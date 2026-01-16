/**
 * Mandi Prices Service
 * Fetches real-time commodity prices from Agmarknet (data.gov.in)
 * Uses centralized location service
 */

import { getLocation } from './locationService'
import { saveMandiToBlob } from './blobService'

const API_KEY = import.meta.env.VITE_DATAGOV_API_KEY
const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'

// Cache
const cache = new Map()
const CACHE_DURATION = 30 * 60 * 1000

/**
 * Get mandi prices for user's location
 */
export async function getMandiPrices(commodity = 'soybean', forceRefresh = false) {
  const location = await getLocation()
  const cacheKey = `mandi_${commodity}_${location.district}`
  const cached = cache.get(cacheKey)

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { ...cached.data, location }
  }

  try {
    const commodityName = commodity === 'cotton' ? 'Cotton' : 'Soyabean'
    
    let url = `${BASE_URL}?api-key=${API_KEY}&format=json&limit=50`
    url += `&filters[state]=${encodeURIComponent(location.state || 'Maharashtra')}`
    url += `&filters[commodity]=${encodeURIComponent(commodityName)}`

    const response = await fetch(url)
    
    if (!response.ok) throw new Error('API error')

    const data = await response.json()
    
    const prices = (data.records || []).map(r => ({
      district: r.district,
      market: r.market,
      variety: r.variety,
      minPrice: parseFloat(r.min_price) || 0,
      maxPrice: parseFloat(r.max_price) || 0,
      modalPrice: parseFloat(r.modal_price) || 0,
      date: r.arrival_date
    })).filter(p => p.modalPrice > 0)
    
    // Sort by district match first, then by price
    prices.sort((a, b) => {
      if (a.district === location.district && b.district !== location.district) return -1
      if (b.district === location.district && a.district !== location.district) return 1
      return b.modalPrice - a.modalPrice
    })

    const result = {
      commodity: commodityName,
      prices: prices.slice(0, 20),
      location,
      fetchedAt: new Date().toISOString()
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    
    // Save to Vercel Blob (async, non-blocking)
    saveMandiToBlob(result)
    
    return result

  } catch (err) {
    console.error('Mandi API error:', err)
    return getFallbackPrices(commodity, location)
  }
}

/**
 * Get prices for both crops
 */
export async function getAllPrices(forceRefresh = false) {
  const [soybean, cotton] = await Promise.all([
    getMandiPrices('soybean', forceRefresh),
    getMandiPrices('cotton', forceRefresh)
  ])
  return { soybean, cotton, location: soybean.location }
}

/**
 * Fallback prices
 */
function getFallbackPrices(commodity, location) {
  const today = new Date().toLocaleDateString('en-IN')
  const district = location?.district || 'Pune'
  
  const data = commodity === 'cotton' ? {
    commodity: 'Cotton',
    prices: [
      { district, market: district, variety: 'Hybrid', minPrice: 6800, maxPrice: 7500, modalPrice: 7200, date: today },
      { district: 'Wardha', market: 'Hinganghat', variety: 'Hybrid', minPrice: 6900, maxPrice: 7600, modalPrice: 7300, date: today },
      { district: 'Amravati', market: 'Amravati', variety: 'Hybrid', minPrice: 6700, maxPrice: 7400, modalPrice: 7100, date: today },
      { district: 'Nagpur', market: 'Nagpur', variety: 'Desi', minPrice: 6750, maxPrice: 7450, modalPrice: 7150, date: today }
    ]
  } : {
    commodity: 'Soyabean',
    prices: [
      { district, market: district, variety: 'Yellow', minPrice: 4500, maxPrice: 5200, modalPrice: 4850, date: today },
      { district: 'Wardha', market: 'Hinganghat', variety: 'Yellow', minPrice: 4600, maxPrice: 5300, modalPrice: 4950, date: today },
      { district: 'Latur', market: 'Latur', variety: 'Yellow', minPrice: 4400, maxPrice: 5100, modalPrice: 4750, date: today },
      { district: 'Akola', market: 'Akola', variety: 'Yellow', minPrice: 4450, maxPrice: 5150, modalPrice: 4800, date: today }
    ]
  }

  return { ...data, location, isFallback: true, fetchedAt: new Date().toISOString() }
}

/**
 * Format price
 */
export function formatPrice(price) {
  if (!price) return '---'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price)
}

/**
 * Calculate average price
 */
export function getAveragePrice(prices) {
  if (!prices?.length) return null
  const sum = prices.reduce((acc, p) => acc + p.modalPrice, 0)
  return Math.round(sum / prices.length)
}
