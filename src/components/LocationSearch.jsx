import React, { useState, useEffect, useRef } from 'react'
import { searchLocations } from '../lib/locationService'
import { addFavorite } from '../lib/favoritesService'

export default function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchLocations(query)
        setResults(r)
      } catch (err) {
        setError('स्थान शोधताना त्रुटी')
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  const handleSelect = (item) => {
    if (onSelect) onSelect(item)
  }

  const handleAddFavorite = (item) => {
    addFavorite({ name: item.name, lat: item.lat, lon: item.lon, country: item.country, state: item.state })
    // feedback: naive, could be improved
    alert('जाती जतन केली गेली (Saved to favorites)')
  }

  return (
    <div className="w-full max-w-md">
      <label className="text-xs font-medium mb-1 block">स्थान शोधा / Search location</label>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="शहर, तालुका किंवा गावाचे नाव टाका"
          className="w-full p-2 rounded border"
          aria-label="Search location"
        />
      </div>

      <div className="mt-2 bg-white dark:bg-gray-800 rounded shadow max-h-64 overflow-auto">
        {loading && <div className="p-3 text-sm text-gray-500">शोधत आहे...</div>}
        {error && <div className="p-3 text-sm text-red-500">{error}</div>}
        {!loading && results.length === 0 && query.trim().length >= 2 && (
          <div className="p-3 text-sm text-gray-500">कोणतेही परिणाम सापडले नाहीत</div>
        )}
        {results.map((r, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="pr-2">
              <div className="font-medium text-sm">{r.name}</div>
              <div className="text-xs text-gray-500">{r.state} {r.country}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAddFavorite(r)} className="text-xs px-2 py-1 rounded bg-yellow-100">⭐ जतन</button>
              <button onClick={() => handleSelect(r)} className="text-xs px-2 py-1 rounded bg-blue-100">या ठिकाणी जा</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
