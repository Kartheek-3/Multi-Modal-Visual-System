import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Volume2 } from 'lucide-react'
import { useSearchStore } from '../store/useSearchStore'
import { useNavigate } from 'react-router-dom'

export default function VoiceSearch({ open, onClose }) {
  const { setQuery, setSearchType, searchText } = useSearchStore()
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle') // idle | listening | processing | done | error
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Voice search is not supported in this browser. Try Chrome or Edge.')
      setStatus('error')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => setStatus('listening')
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(t)
      if (e.results[e.results.length - 1].isFinal) {
        setStatus('processing')
      }
    }
    recognition.onend = async () => {
      if (transcript) {
        setStatus('done')
        setQuery(transcript)
        setSearchType('text')
        await searchText(transcript)
        setTimeout(() => { onClose(); navigate('/results') }, 600)
      } else {
        setStatus('idle')
      }
    }
    recognition.onerror = (e) => {
      setError(e.error === 'not-allowed' ? 'Microphone access denied.' : `Error: ${e.error}`)
      setStatus('error')
    }

    recognition.start()
    return () => recognition.abort()
  }, [open])

  if (!open) return null

  return (
    <motion.div className="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div
        className="voice-modal card"
        initial={{scale:0.88, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.88, opacity:0}}
        onClick={e => e.stopPropagation()}
      >
        <button className="btn-icon voice-close" onClick={onClose}><X size={16}/></button>

        <div className="voice-visual">
          <div className={`voice-ring ${status === 'listening' ? 'active' : ''}`}>
            <div className={`voice-ring inner ${status === 'listening' ? 'active' : ''}`}>
              <div className="voice-btn-center">
                {status === 'listening' ? <Mic size={28} /> : status === 'error' ? <MicOff size={28}/> : <Volume2 size={28}/>}
              </div>
            </div>
          </div>
        </div>

        <div className="voice-status">
          {status === 'idle' && <p className="text-2">Initialising microphone…</p>}
          {status === 'listening' && <p className="gradient-text font-bold">Listening…</p>}
          {status === 'processing' && <p className="text-2">Processing your query…</p>}
          {status === 'done' && <p style={{color:'var(--clr-success)'}}>Searching!</p>}
          {status === 'error' && <p style={{color:'var(--clr-error)'}}>{error}</p>}
        </div>

        {transcript && (
          <div className="voice-transcript">
            <p className="text-sm">"{transcript}"</p>
          </div>
        )}

        <p className="text-xs text-3">Speak clearly into your microphone</p>
      </motion.div>

      <style>{`
        .voice-modal {
          width:340px; padding:32px 24px;
          display:flex; flex-direction:column; align-items:center; gap:20px;
          background:#0d1120; text-align:center; position:relative;
        }
        .voice-close { position:absolute; top:12px; right:12px; }
        .voice-visual { display:flex; align-items:center; justify-content:center; margin:8px 0; }
        .voice-ring {
          width:140px; height:140px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          border:2px solid var(--clr-border);
          transition:all 0.3s ease;
        }
        .voice-ring.active {
          border-color:rgba(124,92,250,0.4);
          animation:ringPulse 1.4s ease-in-out infinite;
          box-shadow:0 0 0 0 var(--clr-accent-glow);
        }
        .voice-ring.inner {
          width:100px; height:100px;
          border:2px solid var(--clr-border);
        }
        .voice-ring.inner.active {
          border-color:rgba(124,92,250,0.6);
          animation:ringPulse 1.4s ease-in-out 0.2s infinite;
        }
        .voice-btn-center {
          width:64px; height:64px; border-radius:50%;
          background:var(--gradient-accent);
          display:flex; align-items:center; justify-content:center;
          color:#fff; box-shadow:var(--shadow-glow);
        }
        @keyframes ringPulse {
          0%,100% { transform:scale(1); opacity:1; }
          50% { transform:scale(1.05); opacity:0.7; }
        }
        .voice-status { font-size:1rem; font-weight:600; }
        .voice-transcript {
          background:var(--clr-surface-2); border:1px solid var(--clr-border);
          border-radius:var(--radius-md); padding:10px 16px; width:100%;
        }
      `}</style>
    </motion.div>
  )
}
