/**
 * Location Service
 * Centralized location management for the entire app
 * Provides location to weather, mandi, and other services
 */

import { getSetting, saveSetting } from './database'

// Cache location in memory
let cachedLocation = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get user's current location with caching
 */
export async function getLocation() {
  // Return cached if fresh
  if (cachedLocation && Date.now() - cachedLocation.timestamp < CACHE_DURATION) {
    return cachedLocation
  }

  // Try to get from browser geolocation
  const location = await new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(getDefaultLocation())
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          isDefault: false
        }
        
        // Get district name via reverse geocoding
        const district = await getDistrictFromCoords(loc.lat, loc.lon)
        loc.district = district.district
        loc.state = district.state
        loc.city = district.city
        
        // Cache it
        cachedLocation = loc
        await saveSetting('lastLocation', loc)
        
        resolve(loc)
      },
      async () => {
        // Try to get last saved location
        const saved = await getSetting('lastLocation')
        if (saved) {
          cachedLocation = { ...saved, timestamp: Date.now() }
          resolve(cachedLocation)
        } else {
          resolve(getDefaultLocation())
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  })

  return location
}

/**
 * Get district from coordinates using free reverse geocoding
 */
async function getDistrictFromCoords(lat, lon) {
  try {
    // Use OpenStreetMap Nominatim (free, no API key)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    
    if (!response.ok) throw new Error('Geocoding failed')
    
    const data = await response.json()
    const addr = data.address || {}
    
    return {
      district: addr.county || addr.state_district || addr.city || 'Pune',
      state: addr.state || 'Maharashtra',
      city: addr.city || addr.town || addr.village || addr.county || 'Unknown'
    }
  } catch (err) {
    console.error('Reverse geocoding error:', err)
    return { district: 'Pune', state: 'Maharashtra', city: 'Pune' }
  }
}

/**
 * Default location (Pune, Maharashtra)
 */
function getDefaultLocation() {
  cachedLocation = {
    lat: 18.5204,
    lon: 73.8567,
    district: 'Pune',
    state: 'Maharashtra',
    city: 'Pune',
    timestamp: Date.now(),
    isDefault: true
  }
  return cachedLocation
}

/**
 * Clear cached location (for manual refresh)
 */
export function clearLocationCache() {
  cachedLocation = null
}
