import React, { useEffect, useState } from 'react'
import { getFavorites, removeFavorite } from '../lib/favoritesService'

export default function FavoritesList({ onSelect }) {
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    setFavorites(getFavorites())

    const handler = (e) => setFavorites(getFavorites())
    window.addEventListener('favorites:changed', handler)
    return () => window.removeEventListener('favorites:changed', handler)
  }, [])

  const handleRemove = (id) => {
    const updated = removeFavorite(id)
    setFavorites(updated)
  }

  return (
    <div className="w-full max-w-md">
      <h4 className="text-xs font-semibold mb-2">आपले आवडते / Favorites</h4>
      <div className="bg-white dark:bg-gray-800 rounded shadow overflow-auto max-h-64">
        {favorites.length === 0 && (
          <div className="p-3 text-sm text-gray-500">कोणतीही आवडती ठिकाणे नाहीत</div>
        )}
        {favorites.map(f => (
          <div key={f.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div>
              <div className="font-medium text-sm">{f.name}</div>
              <div className="text-xs text-gray-500">{f.state} {f.country}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onSelect && onSelect(f)} className="text-xs px-2 py-1 rounded bg-blue-100">या ठिकाणी जा</button>
              <button onClick={() => handleRemove(f.id)} className="text-xs px-2 py-1 rounded bg-red-100">काढून टाका</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
