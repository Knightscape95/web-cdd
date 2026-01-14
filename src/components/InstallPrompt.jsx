import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show after 30 seconds
      setTimeout(() => setShowPrompt(true), 30000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt || !deferredPrompt) return null

  return (
    <div className="install-prompt">
      <div className="flex items-center gap-3">
        <div className="bg-primary-600 p-2 rounded-xl">
          <Download size={24} />
        </div>
        <div>
          <p className="font-semibold">ॲप इंस्टॉल करा</p>
          <p className="text-sm opacity-90">ऑफलाइन वापरासाठी</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="bg-white text-primary-800 px-4 py-2 rounded-lg font-medium"
        >
          इंस्टॉल
        </button>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt
