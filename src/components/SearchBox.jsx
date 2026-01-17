import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiMapPin } from 'react-icons/fi'

export default function SearchBox({ onLocationSelect, onCurrentLocation }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.length < 3) {
      setResults([])
      return
    }

    setLoading(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
        )
        const data = await res.json()
        setResults(data)
        setIsOpen(true)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  const handleSelect = (result) => {
    onLocationSelect({ lat: parseFloat(result.lat), lng: parseFloat(result.lon), name: result.display_name })
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="fixed top-4 left-4 z-50 w-96">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location..."
          className="w-full px-5 py-4 pr-24 bg-slate-900/95 backdrop-blur-md text-white rounded-xl border border-slate-700 focus:border-orange-500 focus:outline-none shadow-2xl placeholder-slate-500 font-medium"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
          <button onClick={onCurrentLocation} className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Use current location">
            <FiMapPin className="text-slate-400 hover:text-orange-500" size={20} />
          </button>
          <FiSearch className="text-slate-400" size={20} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-2 w-full bg-slate-900/98 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl overflow-hidden max-h-96 overflow-y-auto">
            {results.map((result, i) => (
              <motion.button key={i} whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }} onClick={() => handleSelect(result)} className="w-full text-left px-5 py-4 text-white border-b border-slate-800 last:border-0 transition-colors flex items-start gap-3">
                <FiMapPin className="text-orange-500 mt-1 flex-shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{result.display_name.split(',')[0]}</div>
                  <div className="text-xs text-slate-400 truncate mt-1">{result.display_name}</div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
