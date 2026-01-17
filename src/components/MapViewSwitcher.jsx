import React from 'react'
import { motion } from 'framer-motion'

const views = [
  { id: 'street', label: 'Street', icon: '🗺️' },
  { id: 'satellite', label: 'Satellite', icon: '🛰️' },
  { id: 'hybrid', label: 'Hybrid', icon: '🌍' }
]

export default function MapViewSwitcher({ activeView, onChange }) {
  return (
    <div className="fixed top-4 right-4 bg-slate-900/95 backdrop-blur-md rounded-xl p-2 border border-slate-700 shadow-2xl z-40 flex gap-1">
      {views.map(view => (
        <motion.button key={view.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onChange(view.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeView === view.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-300 hover:bg-slate-800'}`}>
          <span>{view.icon}</span>
          <span>{view.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
