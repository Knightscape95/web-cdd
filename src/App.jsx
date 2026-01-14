import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Wifi, WifiOff } from 'lucide-react'

// Pages
import HomePage from './pages/HomePage'
import ScanPage from './pages/ScanPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import WeatherPage from './pages/WeatherPage'

// Components
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'

function AppContent() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [selectedCrop, setSelectedCrop] = useState('cotton')
  const [scanResult, setScanResult] = useState(null)
  const location = useLocation()

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      document.documentElement.classList.add('dark')
    } else if (savedDarkMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Hide bottom nav on scan and weather pages
  const showBottomNav = !['/scan', '/weather'].includes(location.pathname)

  return (
    <div className="page-container">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span>ऑफलाइन मोड - सर्व वैशिष्ट्ये कार्यरत आहेत</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                selectedCrop={selectedCrop} 
                setSelectedCrop={setSelectedCrop}
                isOnline={isOnline}
              />
            } 
          />
          <Route 
            path="/scan" 
            element={
              <ScanPage 
                selectedCrop={selectedCrop}
                setScanResult={setScanResult}
              />
            } 
          />
          <Route 
            path="/results" 
            element={
              <ResultsPage 
                result={scanResult}
                selectedCrop={selectedCrop}
              />
            } 
          />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route 
            path="/weather" 
            element={
              <WeatherPage 
                selectedCrop={selectedCrop}
              />
            } 
          />
        </Routes>
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNav />}

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
