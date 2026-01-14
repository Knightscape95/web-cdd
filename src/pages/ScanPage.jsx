import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, X, RotateCcw, Zap, ArrowLeft } from 'lucide-react'
import { classifyImage } from '../lib/classifier'
import { saveScan } from '../lib/database'
import { saveTrainingImage } from '../lib/trainingService'

function ScanPage({ selectedCrop, setScanResult }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')

  const cropNames = {
    soybean: { mr: 'सोयाबीन', en: 'Soybean' },
    cotton: { mr: 'कापूस', en: 'Cotton' }
  }

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('कॅमेरा प्रवेश नाकारला. कृपया परवानगी द्या.')
    }
  }, [facingMode])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  // Initialize camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [facingMode])

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    stopCamera()
  }

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setCapturedImage(e.target.result)
      stopCamera()
    }
    reader.readAsDataURL(file)
  }

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null)
    setError(null)
    startCamera()
  }

  // Switch camera
  const switchCamera = () => {
    stopCamera()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  // Analyze image
  const analyzeImage = async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await classifyImage(capturedImage, selectedCrop)
      
      const scanData = {
        ...result,
        image: capturedImage,
        crop: selectedCrop,
        timestamp: new Date().toISOString()
      }
      
      setScanResult(scanData)

      // Save to database using new service
      await saveScan(scanData)

      // Automatically save image for training
      await saveTrainingImage({
        image: capturedImage,
        crop: selectedCrop,
        label: result.disease,
        predictedLabel: result.disease,
        confidence: result.confidence,
        verified: false,
        source: 'scan'
      })

      navigate('/results')
    } catch (err) {
      console.error('Classification error:', err)
      setError('विश्लेषण अयशस्वी. कृपया पुन्हा प्रयत्न करा.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-black/80 text-white p-4 flex items-center justify-between z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <p className="font-semibold">{cropNames[selectedCrop]?.mr}</p>
          <p className="text-xs opacity-75">{cropNames[selectedCrop]?.en} Scan</p>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Camera/Preview Area */}
      <div className="flex-1 relative">
        {!capturedImage ? (
          <>
            {/* Live Camera */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner guides */}
              <div className="absolute top-1/4 left-1/4 w-16 h-16 border-l-4 border-t-4 border-primary-400 rounded-tl-lg" />
              <div className="absolute top-1/4 right-1/4 w-16 h-16 border-r-4 border-t-4 border-primary-400 rounded-tr-lg" />
              <div className="absolute bottom-1/4 left-1/4 w-16 h-16 border-l-4 border-b-4 border-primary-400 rounded-bl-lg" />
              <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border-r-4 border-b-4 border-primary-400 rounded-br-lg" />
              
              {/* Scan line animation */}
              <div className="absolute left-1/4 right-1/4 top-1/4 bottom-1/4">
                <div className="scan-line" />
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-32 left-0 right-0 text-center text-white">
              <p className="text-lg font-medium drop-shadow-lg">पान कॅमेरासमोर धरा</p>
              <p className="text-sm opacity-80">Hold the leaf in front of camera</p>
            </div>
          </>
        ) : (
          /* Captured Image Preview */
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
            <div className="spinner mb-4" />
            <p className="text-lg font-medium">विश्लेषण करत आहे...</p>
            <p className="text-sm opacity-75">Analyzing image</p>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Controls */}
      <div className="bg-black p-6">
        {!capturedImage ? (
          /* Camera Controls */
          <div className="flex items-center justify-around">
            {/* Gallery */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/10 p-4 rounded-full text-white"
            >
              <Upload size={28} />
            </button>

            {/* Capture */}
            <button
              onClick={capturePhoto}
              className="bg-white p-5 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <Camera className="text-primary-600" size={36} />
            </button>

            {/* Switch Camera */}
            <button
              onClick={switchCamera}
              className="bg-white/10 p-4 rounded-full text-white"
            >
              <RotateCcw size={28} />
            </button>
          </div>
        ) : (
          /* Preview Controls */
          <div className="flex items-center justify-around">
            {/* Retake */}
            <button
              onClick={retakePhoto}
              className="bg-white/10 text-white px-6 py-3 rounded-xl flex items-center gap-2"
              disabled={isProcessing}
            >
              <RotateCcw size={20} />
              <span>पुन्हा घ्या</span>
            </button>

            {/* Analyze */}
            <button
              onClick={analyzeImage}
              className="btn-primary flex items-center gap-2"
              disabled={isProcessing}
            >
              <Zap size={20} />
              <span>विश्लेषण करा</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScanPage
