import { useNavigate } from 'react-router-dom'
import { Camera, Leaf, Cloud, Sun, Droplets, Wind, ChevronRight, MapPin, Loader2, CloudRain } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getCurrentLocation, getCurrentWeather, getLocationName, getWeatherIconUrl, getConditionMarathi } from '../lib/weatherService'
import { getFarmingInsights } from '../lib/weatherPredictor'

function HomePage({ selectedCrop, setSelectedCrop, isOnline }) {
  const navigate = useNavigate()
  const [weather, setWeather] = useState(null)
  const [location, setLocation] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [quickInsight, setQuickInsight] = useState(null)

  const crops = [
    { 
      id: 'soybean', 
      name: 'सोयाबीन', 
      nameEn: 'Soybean',
      icon: '🌱',
      color: 'bg-primary-600',
      diseases: 8
    },
    { 
      id: 'cotton', 
      name: 'कापूस', 
      nameEn: 'Cotton',
      icon: '🌿',
      color: 'bg-primary-500',
      diseases: 4
    },
  ]

  const handleCropSelect = (cropId) => {
    setSelectedCrop(cropId)
    navigate('/scan')
  }

  // Fetch weather with enhanced service
  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true)
      try {
        const loc = await getCurrentLocation()
        setLocation(loc)
        
        const [weatherData, locName] = await Promise.all([
          getCurrentWeather(loc.lat, loc.lon),
          getLocationName(loc.lat, loc.lon)
        ])
        
        setWeather({
          ...weatherData,
          city: locName.city,
          cityEn: locName.cityEn
        })

        // Get a quick insight
        const insights = getFarmingInsights([{
          temp: weatherData.temp,
          humidity: weatherData.humidity,
          condition: weatherData.condition
        }], selectedCrop)
        
        if (insights.length > 0) {
          setQuickInsight(insights[0])
        }
      } catch (err) {
        console.log('Weather fetch failed:', err)
      } finally {
        setWeatherLoading(false)
      }
    }

    fetchWeather()
  }, [selectedCrop])

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-xl">
              <Leaf size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold">पीक रोग ओळख</h1>
              <p className="text-sm opacity-90">Crop Disease Detection</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Weather Card - Enhanced */}
        <div 
          className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer"
          onClick={() => navigate('/weather')}
        >
          {weatherLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin" size={24} />
              <span className="ml-2">हवामान लोड होत आहे...</span>
            </div>
          ) : weather ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={getWeatherIconUrl(weather.icon)} 
                    alt={weather.condition}
                    className="w-16 h-16"
                  />
                  <div>
                    <p className="text-4xl font-bold">{weather.temp}°C</p>
                    <p className="text-blue-100">{getConditionMarathi(weather.condition)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-blue-100">
                    <MapPin size={14} />
                    <span className="text-sm">{weather.city}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Droplets size={14} />
                      {weather.humidity}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind size={14} />
                      {weather.windSpeed}m/s
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Quick Insight */}
              {quickInsight && (
                <div className="mt-3 pt-3 border-t border-blue-400/30">
                  <p className="text-sm text-blue-100">
                    {quickInsight.type === 'success' ? '✅' : quickInsight.type === 'warning' ? '⚠️' : 'ℹ️'}{' '}
                    {quickInsight.titleMr}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-end mt-2 text-blue-200 text-xs">
                <span>विस्तृत अंदाज पहा</span>
                <ChevronRight size={16} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Cloud className="text-blue-200" size={32} />
                <div>
                  <p className="font-medium">हवामान माहिती उपलब्ध नाही</p>
                  <p className="text-xs text-blue-200">क्लिक करून पुन्हा प्रयत्न करा</p>
                </div>
              </div>
              <ChevronRight size={20} />
            </div>
          )}
        </div>

        {/* Crop Selection */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            पीक निवडा <span className="text-gray-500 text-sm font-normal">/ Select Crop</span>
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => handleCropSelect(crop.id)}
                className={`${crop.color} text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95`}
              >
                <div className="text-5xl mb-3">{crop.icon}</div>
                <h3 className="text-xl font-bold">{crop.name}</h3>
                <p className="text-sm opacity-90">{crop.nameEn}</p>
                <p className="text-xs mt-2 opacity-75">{crop.diseases} रोग ओळखता येतात</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card card-hover cursor-pointer" onClick={() => navigate('/scan')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 p-4 rounded-xl">
                <Camera className="text-primary-600" size={28} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">स्कॅन सुरू करा</h3>
                <p className="text-sm text-gray-500">Start scanning your crop</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="card p-3">
            <div className="text-2xl mb-1">🔒</div>
            <p className="text-xs text-gray-600">ऑफलाइन</p>
            <p className="text-xs text-gray-400">Offline</p>
          </div>
          <div className="card p-3">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs text-gray-600">तत्काळ</p>
            <p className="text-xs text-gray-400">Instant</p>
          </div>
          <div className="card p-3">
            <div className="text-2xl mb-1">🌾</div>
            <p className="text-xs text-gray-600">मराठी</p>
            <p className="text-xs text-gray-400">Marathi</p>
          </div>
        </div>

        {/* Supported Diseases */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">
            ओळखता येणारे रोग <span className="text-gray-400 text-sm font-normal">/ Detectable Diseases</span>
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-primary-700 mb-2">सोयाबीन (8 रोग)</p>
              <div className="flex flex-wrap gap-1">
                {['YMV', 'SMV', 'Aerial Blight', 'Frog Eye', 'Grey Mildew', 'Angular Spot', 'Leaf Blight', 'Healthy'].map(d => (
                  <span key={d} className="disease-badge disease-healthy text-xs">{d}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-700 mb-2">कापूस (4 रोग)</p>
              <div className="flex flex-wrap gap-1">
                {['Bacterial Blight', 'Curl Virus', 'Fusarium Wilt', 'Healthy'].map(d => (
                  <span key={d} className="disease-badge disease-healthy text-xs">{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
