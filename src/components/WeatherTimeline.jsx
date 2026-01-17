import React, { useState, useEffect, useMemo } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { format, addHours } from 'date-fns'

export default function WeatherTimeline({ onTimeChange }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Generate 48-hour timeline
  const hours = useMemo(() => Array.from({ length: 48 }, (_, i) => addHours(new Date(), i)), [])

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => {
          const next = (prev + 1) % hours.length
          onTimeChange && onTimeChange(hours[next])
          return next
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isPlaying, hours, onTimeChange])

  useEffect(() => {
    onTimeChange && onTimeChange(hours[currentIndex])
  }, [currentIndex, hours, onTimeChange])

  return (
    <div className="fixed bottom-0 left-0 right-0 h-28 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 z-50 px-4 py-4">
      {/* Play/Pause Button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute left-6 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 p-4 rounded-full shadow-lg shadow-orange-500/50 transition-all hover:scale-110"
        aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
      >
        <span className="text-white text-xl">{isPlaying ? '⏸' : '▶️'}</span>
      </button>

      <div className="ml-20 mr-4">
        {/* Time Labels */}
        <div className="flex justify-between mb-3 text-xs text-slate-300 font-medium">
          {hours.filter((_, i) => i % 6 === 0).map((date, i) => (
            <span key={i} className="flex flex-col items-center">
              <span>{format(date, 'HH:mm')}</span>
              <span className="text-[10px] text-slate-500">{format(date, 'EEE')}</span>
            </span>
          ))}
        </div>

        {/* Slider */}
        <Slider
          value={currentIndex}
          min={0}
          max={hours.length - 1}
          onChange={(val) => setCurrentIndex(val)}
          railStyle={{ backgroundColor: '#334155', height: 8, borderRadius: 4 }}
          trackStyle={{ backgroundColor: '#f97316', height: 8, borderRadius: 4 }}
          handleStyle={{
            backgroundColor: '#fff',
            borderColor: '#f97316',
            width: 24,
            height: 24,
            marginTop: -8,
            boxShadow: '0 0 20px rgba(249, 115, 22, 0.8)',
            border: '3px solid #f97316'
          }}
        />

        {/* Current Time Display */}
        <div className="text-center mt-3">
          <span className="text-white font-bold text-lg">{format(hours[currentIndex], 'EEE, MMM d -  HH:mm')}</span>
        </div>
      </div>
    </div>
  )
}
