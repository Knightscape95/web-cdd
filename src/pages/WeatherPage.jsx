import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, MapPin, RefreshCw, Thermometer, Droplets, Wind, 
  Cloud, Sun, CloudRain, ChevronRight, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Info, Calendar, Loader2, Search
} from 'lucide-react'
import { 
  getCurrentLocation, 
  getLocationName, 
  getCurrentWeather, 
  getForecast,
  getWeatherIconUrl,
  getConditionMarathi,
  getWindDirection
} from '../lib/weatherService'
import { predictWeather, getFarmingInsights, getCropCalendar } from '../lib/weatherPredictor'
import { getWeatherHistory, getDailyWeatherStats } from '../lib/database'
import LocationSearch from '../components/LocationSearch'
import FavoritesList from '../components/FavoritesList'
import AdvancedMetrics from '../components/AdvancedMetrics'
import HourlyTimeline from '../components/HourlyTimeline'
import MapContainer from '../components/MapContainer'
import WeatherTimeline from '../components/WeatherTimeline'
import LayerControls from '../components/LayerControls'
import SearchBox from '../components/SearchBox'
import ColorLegend from '../components/ColorLegend'
import MapViewSwitcher from '../components/MapViewSwitcher'
import MiniTempBar from '../components/MiniTempBar'

function WeatherPage({ selectedCrop }) {
  const navigate = useNavigate()
  
  const [location, setLocation] = useState(null)
  const [locationName, setLocationName] = useState(null)
  const [currentWeather, setCurrentWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [insights, setInsights] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('current')

  const cropNames = {
    soybean: { mr: 'सोयाबीन', en: 'Soybean' },
    cotton: { mr: 'कापूस', en: 'Cotton' }
  }

  // Fetch all weather data
  const fetchWeatherData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Get location
      const loc = await getCurrentLocation()
      setLocation(loc)

      // Get location name
      const locName = await getLocationName(loc.lat, loc.lon)
      setLocationName(locName)

      // Fetch all data in parallel
      const [weather, forecastData, historyData] = await Promise.all([
        getCurrentWeather(loc.lat, loc.lon),
        getForecast(loc.lat, loc.lon),
        getDailyWeatherStats(loc.lat, loc.lon, 30)
      ])

      setCurrentWeather(weather)
      setForecast(forecastData)
      setHistory(historyData)

      // Get ML predictions
      const pred = await predictWeather(loc.lat, loc.lon, 7)
      setPrediction(pred)

      // Generate insights
      const allPredictions = pred?.predictions || forecastData?.daily || []
      const farmInsights = getFarmingInsights(allPredictions, selectedCrop)
      setInsights(farmInsights)

    } catch (err) {
      console.error('Weather fetch error:', err)
      setError('हवामान माहिती मिळवता आली नाही. कृपया पुन्हा प्रयत्न करा.')
    } finally {
      setLoading(false)
    }
  }, [selectedCrop])

  useEffect(() => {
    fetchWeatherData()
  }, [fetchWeatherData])

  const currentMonth = new Date().getMonth() + 1
  const cropCalendar = getCropCalendar(selectedCrop, currentMonth)

  // Forecast temperature bounds used by mini temp bars for comparison
  const forecastTempMins = forecast?.daily?.map(d => Number(d.tempMin ?? d.minTemp ?? d.temp ?? 0)) || []
  const forecastTempMaxs = forecast?.daily?.map(d => Number(d.tempMax ?? d.maxTemp ?? d.temp ?? 0)) || []
  const overallTempMin = forecastTempMins.length ? Math.min(...forecastTempMins) : 0
  const overallTempMax = forecastTempMaxs.length ? Math.max(...forecastTempMaxs) : overallTempMin + 10

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="text-red-500" size={16} />
      case 'falling': return <TrendingDown className="text-blue-500" size={16} />
      default: return <span className="text-gray-500">→</span>
    }
  }

  // Location search state
  const [showLocationPanel, setShowLocationPanel] = useState(false)

  const handleLocationSelect = async (loc) => {
    // center on selected location and fetch weather for it
    try {
      setLoading(true)
      setError(null)
      setLocation({ lat: loc.lat, lon: loc.lon, city: loc.name })

      const [weather, forecastData, locName] = await Promise.all([
        getCurrentWeather(loc.lat, loc.lon),
        getForecast(loc.lat, loc.lon),
        getLocationName(loc.lat, loc.lon)
      ])

      setCurrentWeather(weather)
      setForecast(forecastData)
      setLocationName(locName)

      const pred = await predictWeather(loc.lat, loc.lon, 7)
      setPrediction(pred)
      const farmInsights = getFarmingInsights(pred?.predictions || forecastData?.daily || [], selectedCrop)
      setInsights(farmInsights)

      setShowLocationPanel(false)
    } catch (err) {
      console.error('Location select error', err)
      setError('ठिकाण निवडताना त्रुटी')
    } finally {
      setLoading(false)
    }
  }


  const getInsightIcon = (type) => {
    switch (type) {
      case 'danger': return <AlertTriangle className="text-red-500" size={20} />
      case 'warning': return <AlertTriangle className="text-orange-500" size={20} />
      case 'success': return <CheckCircle className="text-green-500" size={20} />
      default: return <Info className="text-blue-500" size={20} />
    }
  }

  const getInsightBg = (type) => {
    switch (type) {
      case 'danger': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="page-container items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
        <p className="mt-4 text-gray-600 dark:text-gray-300">हवामान माहिती लोड होत आहे...</p>
      </div>
    )
  }

  return (
    <div className="page-container bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="header bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold">हवामान अंदाज</h1>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <MapPin size={12} />
              <span>{locationName?.city || 'स्थान शोधत आहे...'}</span>
            </div>
          </div>
        </div>

        {/* Location search & favorites */}
        <div className="ml-auto flex items-center gap-3">
          <button
            className="p-2 hover:bg-white/10 rounded-full"
            onClick={() => setShowLocationPanel(prev => !prev)}
            aria-expanded={showLocationPanel}
            title="Search locations"
          >
            <Search size={18} />
          </button>

          <button 
            onClick={fetchWeatherData}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-14 z-10">
        {[
          { id: 'current', label: 'आत्ता', labelEn: 'Now' },
          { id: 'forecast', label: 'अंदाज', labelEn: 'Forecast' },
          { id: 'insights', label: 'सल्ला', labelEn: 'Insights' },
          { id: 'advanced', label: 'पुढील मोजमाप', labelEn: 'Advanced' },
          { id: 'history', label: 'इतिहास', labelEn: 'History' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Location panel (search + favorites) */}
        <div className={`card p-3 ${showLocationPanel ? '' : 'hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LocationSearch onSelect={handleLocationSelect} />
            </div>
            <div>
              <FavoritesList onSelect={handleLocationSelect} />
            </div>
          </div>
        </div>
        
        {/* Current Weather Tab */}
        {activeTab === 'current' && currentWeather && (
          <>
            {/* Main Weather Card */}
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">{locationName?.cityEn}</p>
                  <p className="text-6xl font-light">{currentWeather.temp}°</p>
                  <p className="text-lg">{getConditionMarathi(currentWeather.condition)}</p>
                  <p className="text-blue-200 text-sm">{currentWeather.description}</p>
                </div>
                <div className="text-center">
                  <img 
                    src={getWeatherIconUrl(currentWeather.icon)} 
                    alt={currentWeather.condition}
                    className="w-24 h-24"
                  />
                  <p className="text-sm text-blue-100">
                    H: {currentWeather.tempMax}° L: {currentWeather.tempMin}°
                  </p>
                </div>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Droplets className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">आर्द्रता</p>
                  <p className="text-lg font-semibold dark:text-white">{currentWeather.humidity}%</p>
                </div>
              </div>
              
              <div className="card flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <Wind className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">वारा</p>
                  <p className="text-lg font-semibold dark:text-white">{currentWeather.windSpeed} m/s</p>
                  <p className="text-xs text-gray-400">{getWindDirection(currentWeather.windDeg).mr}</p>
                </div>
              </div>
              
              <div className="card flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                  <Thermometer className="text-orange-600 dark:text-orange-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">जाणवणारे</p>
                  <p className="text-lg font-semibold dark:text-white">{currentWeather.feelsLike}°C</p>
                </div>
              </div>
              
              <div className="card flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                  <Cloud className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">ढग</p>
                  <p className="text-lg font-semibold dark:text-white">{currentWeather.clouds}%</p>
                </div>
              </div>
            </div>

            {/* Sun Times */}
            <div className="card flex justify-around">
              <div className="text-center">
                <Sun className="text-orange-400 mx-auto" size={24} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">सूर्योदय</p>
                <p className="font-semibold dark:text-white">
                  {currentWeather.sunrise.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-center">
                <Cloud className="text-gray-400 mx-auto" size={24} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">सूर्यास्त</p>
                <p className="font-semibold dark:text-white">
                  {currentWeather.sunset.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Map - large */}
            <div className="card relative">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">नकाशा (Map)</h4>
                <div className="text-xs text-gray-500">Tip: Click the full-screen icon on the map to expand for detailed overlays</div>
              </div>

              {/* Top-left search and top-right view switcher */}
              <SearchBox onLocationSelect={(loc) => handleLocationSelect({ lat: loc.lat, lon: loc.lng })} onCurrentLocation={() => { /* handled by map locate */ }} />
              <MapViewSwitcher activeView={activeLayer === 'satellite' ? 'satellite' : 'street'} onChange={(v) => setActiveLayer(v === 'satellite' ? 'satellite' : 'street')} />

              <MapContainer center={[location?.lat || 21.1458, location?.lon || 79.0882]} zoom={9} className="h-[70vh] w-full" />

              <LayerControls activeLayer={activeLayer} onChange={(id) => setActiveLayer(id)} />
              <ColorLegend activeLayer={activeLayer} />

              <p className="text-xs text-gray-500 mt-2">Use the layer controls on the map (top-right) to switch base layers and toggle weather overlays. RainViewer radar doesn't require a key; OpenWeather overlays (precipitation, temperature, wind, clouds) require <code>VITE_WEATHER_API_KEY</code> to be configured in your environment.</p>
            </div>
          </>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <>
            {/* API Forecast */}
            {forecast?.hourly && (
              <div className="card">
                <HourlyTimeline hourly={forecast.hourly} />
              </div>
            )}

            {forecast?.daily && (
              <div className="card">
                <h3 className="font-semibold mb-3 dark:text-white">5 दिवसांचा अंदाज (OpenWeather)</h3>
                <div className="space-y-3">
                  {forecast.daily.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getWeatherIconUrl(day.icon)} 
                          alt={day.condition}
                          className="w-10 h-10"
                        />
                        <div>
                          <p className="font-medium dark:text-white">{day.dayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{getConditionMarathi(day.condition)}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="text-sm font-semibold dark:text-white">{day.tempMax}°</div>
                        <div className="text-xs text-gray-500">{day.tempMin}°</div>

                        {/* Mini temp bar for quick visual comparison */}
                        <MiniTempBar min={Number(day.tempMin)} max={Number(day.tempMax)} overallMin={overallTempMin} overallMax={overallTempMax} />

                        <div className="ml-2 inline-flex items-center gap-1">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">💧 {Math.round((day.pop || 0) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ML Predictions */}
            {prediction?.predictions && (
              <div className="card bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-300">🤖 AI अंदाज (7 दिवस)</h3>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                    ML Model
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  {prediction.modelInfo?.dataPoints || 0} डेटा पॉइंट्सवर आधारित
                </p>
                <div className="space-y-2">
                  {prediction.predictions.map((pred, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-purple-100 last:border-0">
                      <div>
                        <p className="font-medium">{pred.dayName}</p>
                        <p className="text-xs text-gray-500">{pred.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{getConditionMarathi(pred.condition)}</span>
                        <div className="text-right">
                          <p className="font-semibold">{pred.temp}°C</p>
                          <p className="text-xs text-gray-400">आर्द्रता {pred.humidity}%</p>
                        </div>
                        <div className="w-16">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${pred.confidence * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 text-center mt-0.5">
                            {Math.round(pred.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trends */}
                {prediction.trends && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <h4 className="text-sm font-medium mb-2">ट्रेंड्स</h4>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">तापमान:</span>
                        {getTrendIcon(prediction.trends.temperature)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">आर्द्रता:</span>
                        {getTrendIcon(prediction.trends.humidity)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">दाब:</span>
                        {getTrendIcon(prediction.trends.pressure)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!prediction && (
              <div className="card bg-gray-50 dark:bg-gray-800 text-center py-8">
                <Info className="text-gray-400 mx-auto mb-2" size={32} />
                <p className="text-gray-600 dark:text-gray-300">अंदाज तयार करण्यासाठी अधिक डेटा आवश्यक आहे</p>
                <p className="text-xs text-gray-400 mt-1">दररोज अॅप वापरा - 5+ दिवसांनंतर AI अंदाज उपलब्ध होतील</p>
              </div>
            )}
          </>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <>
            {/* Crop Calendar */}
            <div className="card bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-green-600 dark:text-green-400" size={20} />
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  {cropNames[selectedCrop]?.mr} पीक कॅलेंडर
                </h3>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <p className="font-medium text-lg dark:text-white">{cropCalendar.stage}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{cropCalendar.en}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cropCalendar.activities.map((activity, idx) => (
                    <span key={idx} className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Farming Insights */}
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">🌾 शेती सल्ला</h3>
            {insights.map((insight, idx) => (
              <div key={idx} className={`card border ${getInsightBg(insight.type)}`}>
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold dark:text-white">{insight.titleMr}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{insight.titleEn}</p>
                    <p className="text-sm mt-2 dark:text-gray-200">{insight.messageMr}</p>
                    {insight.action && (
                      <div className="mt-2 bg-white/50 dark:bg-gray-700/50 rounded p-2">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          <strong>कृती:</strong> {insight.action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Advanced Metrics Tab */}
        {activeTab === 'advanced' && (
          <>
            <AdvancedMetrics history={history} forecast={forecast?.daily || []} crop={selectedCrop} />
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <>
            <div className="card">
              <h3 className="font-semibold mb-2 dark:text-white">📊 संकलित हवामान डेटा</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                गेल्या 30 दिवसांतील {history.length} रेकॉर्ड्स
              </p>

              {history.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.slice().reverse().map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-sm dark:text-white">{day.date}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{day.dominantCondition || 'N/A'}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-orange-600 font-medium">{Math.round(day.avgTemp)}°</p>
                          <p className="text-xs text-gray-400">तापमान</p>
                        </div>
                        <div className="text-center">
                          <p className="text-blue-600 font-medium">{Math.round(day.avgHumidity)}%</p>
                          <p className="text-xs text-gray-400">आर्द्रता</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Cloud className="mx-auto mb-2 opacity-50" size={48} />
                  <p>अद्याप कोणताही डेटा नाही</p>
                  <p className="text-xs mt-1">अॅप वापरत राहा - डेटा स्वयंचलितपणे संकलित होतो</p>
                </div>
              )}
            </div>

            {/* Stats Summary */}
            {history.length > 0 && (
              <div className="card">
                <h4 className="font-semibold mb-3 dark:text-white">📈 सारांश</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(history.reduce((a, h) => a + h.avgTemp, 0) / history.length)}°
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">सरासरी तापमान</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(history.reduce((a, h) => a + h.avgHumidity, 0) / history.length)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">सरासरी आर्द्रता</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {history.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">दिवसांचा डेटा</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default WeatherPage
