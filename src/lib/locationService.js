/**
 * Location Service
 * Centralized location management for the entire app
 * Uses fixed location: 20°28'32.2"N 78°58'36.5"E (Wardha district, Maharashtra)
 */

// Fixed location coordinates
// 20°28'32.2"N 78°58'36.5"E
const FIXED_LOCATION = {
  lat: 20.4756,
  lon: 78.9768,
  district: 'Wardha',
  state: 'Maharashtra',
  city: 'Wardha',
  timestamp: Date.now(),
  isDefault: false
}

/**
 * Get fixed location
 */
export async function getLocation() {
  return {
    ...FIXED_LOCATION,
    timestamp: Date.now()
  }
}

/**
 * Search locations by query. Uses OpenWeather Geocoding if API key present,
 * otherwise falls back to Nominatim.
 */
export async function searchLocations(query) {
  if (!query || query.trim().length === 0) return []
  const q = encodeURIComponent(query.trim())
  const OWM_KEY = import.meta.env.VITE_WEATHER_API_KEY

  try {
    if (OWM_KEY) {
      const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=6&appid=${OWM_KEY}`)
      if (!res.ok) throw new Error('Geocoding failed')
      const data = await res.json()
      return data.map(item => ({
        name: item.name + (item.state ? `, ${item.state}` : '' ) + (item.country ? `, ${item.country}` : ''),
        lat: item.lat,
        lon: item.lon,
        country: item.country || '',
        state: item.state || ''
      }))
    } else {
      // Nominatim fallback
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=6`)
      if (!res.ok) throw new Error('Fallback geocoding failed')
      const data = await res.json()
      return data.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        country: item.address?.country || '',
        state: item.address?.state || ''
      }))
    }
  } catch (err) {
    console.error('searchLocations error', err)
    return []
  }
}

/**
 * Clear cached location (no-op for fixed location)
 */
export function clearLocationCache() {
  // No-op since we use fixed location
}
