import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle, Share2, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getRemedy } from '../lib/remedies'

function ResultsPage({ result, selectedCrop }) {
  const navigate = useNavigate()
  const [remedy, setRemedy] = useState(null)
  const [showSteps, setShowSteps] = useState(true)

  useEffect(() => {
    if (result?.disease) {
      const remedyData = getRemedy(result.disease)
      setRemedy(remedyData)
    }
  }, [result])

  if (!result) {
    return (
      <div className="page-container items-center justify-center">
        <p className="text-gray-500">कोणताही निकाल नाही</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">
          मुख्यपृष्ठावर जा
        </button>
      </div>
    )
  }

  const isHealthy = result.disease?.toLowerCase().includes('healthy')
  const confidence = Math.round(result.confidence * 100)

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
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'पीक रोग निकाल',
          text: `${result.disease} (${diseaseMarathi[result.disease] || ''}) - ${confidence}% खात्री`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold">निकाल</h1>
            <p className="text-xs opacity-90">Scan Result</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Image Preview */}
        {result.image && (
          <div className="card p-0 overflow-hidden">
            <img 
              src={result.image} 
              alt="Scanned leaf" 
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Result Card */}
        <div className={`card ${isHealthy ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
              {isHealthy ? (
                <CheckCircle className="text-green-600" size={32} />
              ) : (
                <AlertTriangle className="text-red-600" size={32} />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">
                {diseaseMarathi[result.disease] || result.disease}
              </h2>
              <p className="text-gray-600">{result.disease}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className={`h-2 flex-1 rounded-full ${isHealthy ? 'bg-green-200' : 'bg-red-200'}`}>
                  <div 
                    className={`h-full rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{confidence}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Remedy Section */}
        {!isHealthy && remedy && (
          <>
            {/* Treatment Steps */}
            <div className="card">
              <button 
                onClick={() => setShowSteps(!showSteps)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="font-semibold text-gray-800">
                  उपचार पद्धती <span className="text-gray-400 font-normal">/ Treatment</span>
                </h3>
                {showSteps ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {showSteps && (
                <div className="mt-4 space-y-3">
                  {remedy.steps.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="bg-primary-100 text-primary-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dosage */}
            {remedy.dosage && (
              <div className="card bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-2">
                  औषध मात्रा <span className="text-blue-400 font-normal">/ Dosage</span>
                </h3>
                <p className="text-blue-700 text-sm">{remedy.dosage}</p>
              </div>
            )}

            {/* Precautions */}
            {remedy.precautions && (
              <div className="card bg-orange-50">
                <h3 className="font-semibold text-orange-800 mb-2">
                  ⚠️ सावधगिरी <span className="text-orange-400 font-normal">/ Precautions</span>
                </h3>
                <p className="text-orange-700 text-sm">{remedy.precautions}</p>
              </div>
            )}
          </>
        )}

        {/* Healthy Message */}
        {isHealthy && (
          <div className="card bg-green-50">
            <h3 className="font-semibold text-green-800 mb-2">🎉 तुमचे पीक निरोगी आहे!</h3>
            <p className="text-green-700 text-sm">
              तुमच्या पिकात कोणताही रोग आढळला नाही. पीक व्यवस्थापनाच्या चांगल्या पद्धती सुरू ठेवा.
            </p>
            <p className="text-green-600 text-xs mt-2">
              Your crop appears healthy. Continue good crop management practices.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/scan')}
            className="btn-primary flex-1"
          >
            नवीन स्कॅन
          </button>
          <button 
            onClick={handleShare}
            className="btn-secondary p-3"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultsPage
