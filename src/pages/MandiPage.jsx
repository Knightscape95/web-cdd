import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, MapPin, Wheat, Loader2 } from 'lucide-react'
import { getAllPrices, formatPrice, getAveragePrice } from '../lib/mandiService'

function MandiPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [priceData, setPriceData] = useState(null)
  const [selectedCrop, setSelectedCrop] = useState('soybean')

  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async (force = false) => {
    try {
      if (!force) setLoading(true)
      setError(null)
      const data = await getAllPrices(force)
      setPriceData(data)
    } catch (err) {
      console.error('Failed to fetch mandi prices:', err)
      setError('बाजार भाव लोड करण्यात अयशस्वी')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPrices(true)
    setRefreshing(false)
  }

  const currentPrices = priceData?.[selectedCrop]?.prices || []
  const avgPrice = getAveragePrice(currentPrices)
  const location = priceData?.location

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-300">बाजार भाव लोड करत आहे...</p>
          <p className="text-sm text-gray-400">Loading market prices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">मंडी भाव</h1>
            <p className="text-xs opacity-90">Market Prices</p>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="p-2 -mr-2"
          >
            <RefreshCw size={24} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Location */}
        <div className="mt-3 flex items-center justify-center gap-2 text-sm opacity-90">
          <MapPin size={16} />
          <span>{location?.district || location?.city || 'Maharashtra'}</span>
        </div>
      </header>

      {/* Crop Selector */}
      <div className="p-4">
        <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
          <button
            onClick={() => setSelectedCrop('soybean')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              selectedCrop === 'soybean'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <span className="block text-lg">🫘</span>
            <span className="text-sm">सोयाबीन</span>
          </button>
          <button
            onClick={() => setSelectedCrop('cotton')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              selectedCrop === 'cotton'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <span className="block text-lg">🌿</span>
            <span className="text-sm">कापूस</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 w-full py-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg text-sm"
          >
            पुन्हा प्रयत्न करा
          </button>
        </div>
      )}

      {/* Average Price Card */}
      {avgPrice && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl text-white shadow-lg">
          <p className="text-sm opacity-90">सरासरी भाव / Average Price</p>
          <p className="text-3xl font-bold mt-1">{formatPrice(avgPrice)}</p>
          <p className="text-xs opacity-75 mt-1">प्रति क्विंटल / per Quintal</p>
        </div>
      )}

      {/* Price List */}
      <div className="px-4 pb-24">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
          मंडी निहाय भाव / Market-wise Prices
        </h2>

        {currentPrices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Wheat className="mx-auto mb-2 opacity-50" size={48} />
            <p>कोणताही डेटा उपलब्ध नाही</p>
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentPrices.map((price, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      {price.market}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {price.district}
                    </p>
                    {price.variety && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                        {price.variety}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      {formatPrice(price.modalPrice)}
                    </p>
                    <p className="text-xs text-gray-400">Modal Price</p>
                  </div>
                </div>

                {/* Price Range */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">किमान / Min</p>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      {formatPrice(price.minPrice)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">कमाल / Max</p>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      {formatPrice(price.maxPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">तारीख / Date</p>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      {price.date || '---'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Data Source */}
        <p className="text-center text-xs text-gray-400 mt-6">
          स्रोत: Agmarknet (data.gov.in)<br />
          Data Source: Government of India Open Data
        </p>

        {priceData?.soybean?.isFallback && (
          <p className="text-center text-xs text-amber-500 mt-2">
            ⚠️ ऑफलाइन डेटा दर्शवत आहे / Showing cached data
          </p>
        )}
      </div>
    </div>
  )
}

export default MandiPage
