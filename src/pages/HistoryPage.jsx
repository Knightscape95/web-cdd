import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Calendar, ChevronRight, AlertCircle, BarChart2 } from 'lucide-react'
import { getScans, deleteScan, getScanStats } from '../lib/database'

function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStats, setShowStats] = useState(false)

  const diseaseMarathi = {
    'Bacterial Blight': 'जिवाणूजन्य करपा',
    'Curl Virus': 'पान मुरडा विषाणू',
    'Fussarium Wilt': 'फ्युझेरियम मर',
    'Fusarium Wilt': 'फ्युझेरियम मर',
    'Healthy': 'निरोगी',
    'YMV': 'पिवळा मोझॅक विषाणू',
    'SMV': 'सोयाबीन मोझॅक विषाणू',
    'Aerial Blight': 'हवाई करपा',
    'Frog Eye': 'बेडूक डोळा',
    'Grey Mildew': 'राखाडी बुरशी',
    'Angular Leaf Spot': 'कोनीय पानावरील ठिपके',
    'Leaf Blight': 'पानावरील करपा',
    'Diseased': 'रोगग्रस्त'
  }

  const cropMarathi = {
    'cotton': 'कापूस',
    'soybean': 'सोयाबीन'
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const [records, statsData] = await Promise.all([
        getScans({ limit: 100 }),
        getScanStats()
      ])
      setHistory(records)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteRecord = async (id) => {
    if (!confirm('हा रेकॉर्ड हटवायचा आहे का?')) return

    try {
      await deleteScan(id)
      setHistory(prev => prev.filter(r => r.id !== id))
      // Refresh stats
      const statsData = await getScanStats()
      setStats(statsData)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const clearAll = async () => {
    if (!confirm('सर्व इतिहास हटवायचा आहे का?')) return

    try {
      // Delete all records one by one
      for (const record of history) {
        await deleteScan(record.id)
      }
      setHistory([])
      setStats({ total: 0, byCrop: {}, byDisease: {}, healthyCount: 0, diseasedCount: 0 })
    } catch (err) {
      console.error('Failed to clear:', err)
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('mr-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">स्कॅन इतिहास</h1>
            <p className="text-xs opacity-90">Scan History ({stats?.total || 0} रेकॉर्ड्स)</p>
          </div>
          <div className="flex gap-2">
            {stats?.total > 0 && (
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 bg-white/20 rounded-lg"
              >
                <BarChart2 size={18} />
              </button>
            )}
            {history.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm bg-white/20 px-3 py-1.5 rounded-lg"
              >
                सर्व हटवा
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {/* Stats Panel */}
        {showStats && stats && (
          <div className="card bg-gradient-to-r from-primary-50 to-blue-50 mb-4">
            <h3 className="font-semibold mb-3">📊 स्कॅन आकडेवारी</h3>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="bg-white rounded-lg p-2">
                <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
                <p className="text-xs text-gray-500">एकूण स्कॅन</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-2xl font-bold text-green-600">{stats.healthyCount}</p>
                <p className="text-xs text-gray-500">निरोगी</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-2xl font-bold text-red-600">{stats.diseasedCount}</p>
                <p className="text-xs text-gray-500">रोगग्रस्त</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">पीकनुसार:</p>
                {Object.entries(stats.byCrop).map(([crop, count]) => (
                  <p key={crop} className="text-gray-600">
                    {cropMarathi[crop] || crop}: {count}
                  </p>
                ))}
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">रोगनुसार (टॉप 3):</p>
                {Object.entries(stats.byDisease)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([disease, count]) => (
                    <p key={disease} className="text-gray-600 truncate">
                      {diseaseMarathi[disease] || disease}: {count}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 font-medium">कोणताही इतिहास नाही</p>
            <p className="text-gray-400 text-sm">No scan history yet</p>
            <button
              onClick={() => navigate('/scan')}
              className="btn-primary mt-6"
            >
              स्कॅन सुरू करा
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => {
              const isHealthy = record.disease?.toLowerCase().includes('healthy')
              
              return (
                <div 
                  key={record.id}
                  className="card flex items-center gap-3"
                >
                  {/* Thumbnail - images stored separately now */}
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                    {record.hasImage ? (
                      <span className="text-2xl">🖼️</span>
                    ) : (
                      <span className="text-2xl">{record.crop === 'cotton' ? '🌿' : '🌱'}</span>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                      <h3 className="font-semibold text-gray-800 truncate">
                        {diseaseMarathi[record.disease] || record.disease}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      {cropMarathi[record.crop] || record.crop} • {Math.round(record.confidence * 100)}%
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar size={12} />
                      {formatDate(record.timestamp)}
                    </p>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPage
