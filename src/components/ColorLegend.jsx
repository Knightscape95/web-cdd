import React from 'react'
import { motion } from 'framer-motion'

const legends = {
  temperature: {
    title: 'Temperature °C',
    colors: ['#3b4cc0', '#688aef', '#ffffbf', '#fdb96c', '#b40426'],
    values: ['-20', '0', '10', '20', '40+']
  },
  wind: {
    title: 'Wind Speed km/h',
    colors: ['#d4e9ff', '#8ec8f6', '#ffff99', '#ff9c4a', '#ff0000'],
    values: ['0', '10', '30', '60', '100+']
  },
  rain: {
    title: 'Precipitation mm/h',
    colors: ['#ffffff', '#b3e5ff', '#66b3ff', '#0066cc', '#000080'],
    values: ['0', '1', '5', '10', '20+']
  },
  clouds: {
    title: 'Cloud Cover %',
    colors: ['#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#27272a'],
    values: ['0', '25', '50', '75', '100']
  }
}

export default function ColorLegend({ activeLayer }) {
  const legend = legends[activeLayer] || legends.temperature

  return (
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed bottom-32 left-4 bg-slate-900/95 backdrop-blur-md rounded-xl p-4 border border-slate-700 shadow-2xl z-40">
      <h3 className="text-white text-sm font-bold mb-3">{legend.title}</h3>
      <div className="flex items-end gap-0.5">
        {legend.colors.map((color, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-12 h-8 border border-slate-600 first:rounded-l-md last:rounded-r-md" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-300 mt-2 font-medium">{legend.values[i]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
