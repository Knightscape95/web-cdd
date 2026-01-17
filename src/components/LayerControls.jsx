import React from 'react'
import { motion } from 'framer-motion'

const layers = [
  { id: 'wind', icon: '💨', label: 'Wind', color: '#22c55e' },
  { id: 'rain', icon: '🌧️', label: 'Rain', color: '#3b82f6' },
  { id: 'temp', icon: '🌡️', label: 'Temperature', color: '#ef4444' },
  { id: 'clouds', icon: '☁️', label: 'Clouds', color: '#94a3b8' },
  { id: 'pressure', icon: '📊', label: 'Pressure', color: '#8b5cf6' },
  { id: 'humidity', icon: '💧', label: 'Humidity', color: '#06b6d4' },
]

export default function LayerControls({ activeLayer, onChange }) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed right-4 top-20 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-slate-700 shadow-2xl z-40 min-w-[180px]"
    >
      <h3 className="text-white text-sm font-bold mb-3 px-2">Weather Layers</h3>

      <div className="space-y-1">
        {layers.map(layer => (
          <motion.button
            key={layer.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(layer.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeLayer === layer.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <span className="text-2xl">{layer.icon}</span>
            <span className="text-sm font-medium">{layer.label}</span>
            {activeLayer === layer.id && (
              <motion.div
                layoutId="activeIndicator"
                className="ml-auto w-2 h-2 rounded-full bg-white"
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
