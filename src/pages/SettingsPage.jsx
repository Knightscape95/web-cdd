import { useState, useEffect } from 'react'
import { Globe, Moon, Sun, Trash2, Info, ExternalLink } from 'lucide-react'

function SettingsPage() {
  const [language, setLanguage] = useState('mr')
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved !== null) return saved === 'true'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const clearCache = async () => {
    if (!confirm('सर्व कॅश डेटा हटवायचा आहे का? / Clear all cached data?')) return

    try {
      // Clear service worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      
      // Clear IndexedDB
      const { openDB } = await import('idb')
      const db = await openDB('crop-disease-db', 1)
      await db.clear('history')
      
      alert('कॅश साफ केला! / Cache cleared!')
      window.location.reload()
    } catch (err) {
      console.error('Failed to clear cache:', err)
      alert('Error clearing cache')
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="text-lg font-bold">सेटिंग्ज</h1>
          <p className="text-xs opacity-90">Settings</p>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Language */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-xl">
                <Globe className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">भाषा</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Language</p>
              </div>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field w-auto"
            >
              <option value="mr">मराठी</option>
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
        </div>

        {/* Dark Mode */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-xl">
                {darkMode ? <Moon className="text-gray-600" size={24} /> : <Sun className="text-yellow-500" size={24} />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">डार्क मोड</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dark Mode</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Clear Cache */}
        <div className="card">
          <button 
            onClick={clearCache}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-xl">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">कॅश साफ करा</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Clear Cache & Data</p>
              </div>
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="card bg-primary-50 dark:bg-primary-900/30">
          <div className="flex items-start gap-3">
            <div className="bg-primary-100 dark:bg-primary-800 p-2 rounded-xl">
              <Info className="text-primary-600 dark:text-primary-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-800 dark:text-primary-300">ऑप माहिती</h3>
              <div className="mt-2 text-sm text-primary-700 dark:text-primary-400 space-y-1">
                <p>आवृत्ती: 1.0.0</p>
                <p>Version: 1.0.0</p>
                <p className="pt-2">
                  सोयाबीन  आणि कापूस (4 रोग) साठी AI-आधारित रोग ओळख.
                </p>
                <p className="text-xs text-primary-600">
                  AI-powered disease detection for Soybean & Cotton crops.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">श्रेय / Credits</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p>• ML Model: MobileNetV3 + ONNX Runtime</p>
            <p>• Dataset: Cotton-Original (980 images)</p>
            <p>• Weather Data: OpenWeatherMap API</p>
            <div className="flex items-center gap-2 pt-2">
              <span>• Developed by:</span>
              <a 
                href="https://github.com/Knightscape95" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img 
                  src="/download.jpeg" 
                  alt="Developer" 
                  className="w-8 h-8 rounded-full border-2 border-primary-500"
                />
                <span className="text-primary-600 font-medium">Knightscape95</span>
              </a>
            </div>
          </div>
        </div>

        
        {/* Version Footer */}
        <p className="text-center text-gray-400 dark:text-gray-500 text-xs pt-4">
          © 2026 Crop Disease Detection<br />
          Made with ❤️ for Indian Farmers
        </p>
      </div>
    </div>
  )
}

export default SettingsPage
