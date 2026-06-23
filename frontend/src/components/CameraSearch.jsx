import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, FlipHorizontal, Search, ZoomIn } from 'lucide-react'
import { useSearchStore } from '../store/useSearchStore'
import { useNavigate } from 'react-router-dom'

export default function CameraSearch({ open, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const navigate = useNavigate()
  const { setQueryImage, searchImage, isLoading } = useSearchStore()

  const [phase, setPhase] = useState('init')   // init | preview | captured | searching
  const [capturedUrl, setCapturedUrl] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [error, setError] = useState('')

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setPhase('preview')
        setError('')
      }
    } catch (e) {
      setError('Camera access denied or not available.')
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const url = canvas.toDataURL('image/jpeg', 0.92)
    setCapturedUrl(url)
    stopCamera()
    setPhase('captured')
  }, [stopCamera])

  const handleSearch = async () => {
    if (!capturedUrl) return
    setPhase('searching')
    // Convert data URL to File
    const res = await fetch(capturedUrl)
    const blob = await res.blob()
    const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' })
    const preview = URL.createObjectURL(file)
    setQueryImage(file, preview)
    await searchImage(file)
    stopCamera()
    onClose()
    navigate('/results')
  }

  const flipCamera = () => {
    stopCamera()
    setFacingMode(m => m === 'environment' ? 'user' : 'environment')
    setPhase('init')
  }

  const handleClose = () => {
    stopCamera()
    setPhase('init')
    setCapturedUrl(null)
    setError('')
    onClose()
  }

  // Auto-start when opened
  if (open && phase === 'init' && !error) {
    startCamera()
  }

  if (!open) return null

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}>
      <motion.div
        className="camera-modal card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="camera-header">
          <div className="section-title"><Camera size={15} /> Camera Search</div>
          <div className="flex items-center gap-sm">
            <button className="btn-icon" onClick={flipCamera} title="Flip camera"><FlipHorizontal size={15} /></button>
            <button className="btn-icon" onClick={handleClose}><X size={16} /></button>
          </div>
        </div>

        {/* Video / Preview */}
        <div className="camera-viewport">
          {phase === 'preview' && (
            <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
          )}
          {phase === 'captured' && capturedUrl && (
            <motion.img src={capturedUrl} alt="captured" className="camera-video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          )}
          {phase === 'init' && !error && (
            <div className="camera-loading">
              <div className="spinner" style={{ width: 36, height: 36 }} />
              <p className="text-sm text-2">Starting camera…</p>
            </div>
          )}
          {error && (
            <div className="camera-error">
              <Camera size={36} style={{ opacity: 0.3 }} />
              <p className="text-sm" style={{ color: 'var(--clr-error)' }}>{error}</p>
            </div>
          )}

          {/* Viewfinder corners */}
          {phase === 'preview' && (
            <div className="viewfinder">
              <div className="vf-corner tl" />
              <div className="vf-corner tr" />
              <div className="vf-corner bl" />
              <div className="vf-corner br" />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Actions */}
        <div className="camera-actions">
          {phase === 'preview' && (
            <button className="shutter-btn" onClick={capture} title="Capture">
              <div className="shutter-inner" />
            </button>
          )}
          {phase === 'captured' && (
            <div className="flex items-center gap-md w-full">
              <button className="btn btn-ghost grow" onClick={() => { setPhase('init'); setCapturedUrl(null) }}>
                Retake
              </button>
              <button className="btn btn-primary grow" onClick={handleSearch} disabled={isLoading} style={{ justifyContent: 'center' }}>
                {isLoading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Search size={15} />}
                {isLoading ? 'Searching…' : 'Search this'}
              </button>
            </div>
          )}
          {(phase === 'init' || phase === 'searching') && (
            <button className="btn btn-ghost" onClick={handleClose}>Cancel</button>
          )}
        </div>

        <p className="text-xs text-3 text-center" style={{ paddingBottom: 4 }}>
          Point your camera at any object and tap the shutter to search
        </p>
      </motion.div>

      <style>{`
        .camera-modal {
          width: 440px; max-width: 96vw;
          background: #0d1120; border-color: var(--clr-border-2);
          display: flex; flex-direction: column; gap: 0; overflow: hidden;
        }
        .camera-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid var(--clr-border);
        }
        .camera-viewport {
          position: relative; background: #000;
          aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .camera-video { width: 100%; height: 100%; object-fit: cover; }
        .camera-loading, .camera-error { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--clr-text-2); }
        .viewfinder { position: absolute; inset: 20px; pointer-events: none; }
        .vf-corner {
          position: absolute; width: 24px; height: 24px;
          border-color: var(--clr-accent); border-style: solid; border-width: 0;
        }
        .vf-corner.tl { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; border-top-left-radius: 4px; }
        .vf-corner.tr { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; border-top-right-radius: 4px; }
        .vf-corner.bl { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; border-bottom-left-radius: 4px; }
        .vf-corner.br { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; border-bottom-right-radius: 4px; }
        .camera-actions { padding: 16px; display: flex; justify-content: center; align-items: center; min-height: 72px; }
        .shutter-btn {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(255,255,255,0.1); border: 3px solid #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all var(--transition);
        }
        .shutter-btn:hover { transform: scale(1.08); background: rgba(255,255,255,0.2); }
        .shutter-btn:active { transform: scale(0.94); }
        .shutter-inner { width: 48px; height: 48px; border-radius: 50%; background: #fff; transition: all var(--transition-fast); }
        .shutter-btn:active .shutter-inner { transform: scale(0.9); }
      `}</style>
    </motion.div>
  )
}
