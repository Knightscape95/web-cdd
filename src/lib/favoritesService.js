const STORAGE_KEY = 'favorites_locations'

export function getFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to parse favorites', err)
    return []
  }
}

export function saveFavorites(favs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs))
  } catch (err) {
    console.error('Failed to save favorites', err)
  }
}

export function addFavorite(item) {
  const favs = getFavorites()
  // Avoid duplicates by lat/lon
  if (favs.some(f => f.lat === item.lat && f.lon === item.lon)) return favs
  const newItem = { id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7), ...item }
  const updated = [newItem, ...favs]
  saveFavorites(updated)
  // dispatch event for UI updates
  try { window.dispatchEvent(new CustomEvent('favorites:changed', { detail: updated })) } catch(e) {}
  return updated
}

export function removeFavorite(id) {
  const favs = getFavorites()
  const updated = favs.filter(f => f.id !== id)
  saveFavorites(updated)
  try { window.dispatchEvent(new CustomEvent('favorites:changed', { detail: updated })) } catch(e) {}
  return updated
}

export function clearFavorites() {
  localStorage.removeItem(STORAGE_KEY)
}
