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
 * Clear cached location (no-op for fixed location)
 */
export function clearLocationCache() {
  // No-op since we use fixed location
}
