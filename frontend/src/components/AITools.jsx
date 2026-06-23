import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Loader, CheckCircle, AlertCircle, Tag, FileText, Palette, Box } from 'lucide-react'
import axios from 'axios'

const FEATURES = [
  { id: 'caption',    label: 'Caption',         icon: <FileText size={13}/>,  endpoint: '/ai/caption',  key: 'caption' },
  { id: 'tags',       label: 'Smart Tags',      icon: <Tag size={13}/>,       endpoint: '/ai/tags',     key: 'tags' },
  { id: 'describe',   label: 'Product Info',    icon: <Box size={13}/>,       endpoint: '/ai/describe', key: null },
  { id: 'removebg',   label: 'Remove BG',       icon: <Palette size={13}/>,   endpoint: '/ai/remove-background', isBlob: true },
  { id: 'detect',     label: 'Detect Objects',  icon: <Box size={13}/>,       endpoint: '/ai/detect-objects', key: 'objects' },
]

export default function AITools({ imageFile = null }) {
  const [file, setFile] = useState(imageFile)
  const [preview, setPreview] = useState(null)
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})
  const fileRef = useRef()

  const handleFile = (f) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResults({})
  }

  const runFeature = async (feature) => {
    if (!file) return
    setLoading(l => ({ ...l, [feature.id]: true }))
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await axios.post(feature.endpoint, form, {
        responseType: feature.isBlob ? 'blob' : 'json'
      })
      if (feature.isBlob) {
        const url = URL.createObjectURL(res.data)
        setResults(r => ({ ...r, [feature.id]: { type: 'image', url } }))
      } else {
        const data = feature.key ? res.data[feature.key] : res.data
        setResults(r => ({ ...r, [feature.id]: { type: 'data', data } }))
      }
    } catch {
      setResults(r => ({ ...r, [feature.id]: { type: 'error', msg: 'Failed' } }))
    }
    setLoading(l => ({ ...l, [feature.id]: false }))
  }

  return (
    <div className="ai-tools-panel">
      {/* Upload area */}
      <div
        className="ai-upload-zone"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="selected" className="ai-preview-img" />
        ) : (
          <div className="flex flex-col items-center gap-sm text-3">
            <Upload size={24} />
            <span className="text-sm">Click to select image</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* Feature buttons */}
      <div className="ai-feature-grid">
        {FEATURES.map(f => (
          <div key={f.id} className="ai-feature-card card">
            <button
              className="btn btn-ghost btn-sm w-full"
              onClick={() => runFeature(f)}
              disabled={!file || loading[f.id]}
              style={{ justifyContent: 'center' }}
            >
              {loading[f.id] ? <Loader size={13} className="spin-anim" /> : f.icon}
              {f.label}
            </button>

            {/* Result */}
            <AnimatePresence>
              {results[f.id] && (
                <motion.div className="ai-result" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  {results[f.id].type === 'image' && (
                    <img src={results[f.id].url} alt="result" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--clr-border)' }} />
                  )}
                  {results[f.id].type === 'data' && (
                    <div className="ai-data-result">
                      {Array.isArray(results[f.id].data) ? (
                        <div className="flex wrap gap-sm">
                          {results[f.id].data.map((item, i) => (
                            <span key={i} className="tag">
                              {typeof item === 'object' ? item.label : item}
                              {item.confidence && <span className="text-xs text-3"> {Math.round(item.confidence * 100)}%</span>}
                            </span>
                          ))}
                        </div>
                      ) : typeof results[f.id].data === 'object' ? (
                        <div className="flex flex-col gap-sm">
                          {Object.entries(results[f.id].data).map(([k, v]) => (
                            <div key={k} className="text-sm">
                              <span className="text-3">{k}: </span>
                              <span>{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm">{String(results[f.id].data)}</p>
                      )}
                    </div>
                  )}
                  {results[f.id].type === 'error' && (
                    <p className="text-xs" style={{ color: 'var(--clr-error)' }}>{results[f.id].msg}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <style>{`
        .ai-tools-panel { display: flex; flex-direction: column; gap: var(--space-md); }
        .ai-upload-zone {
          border: 2px dashed var(--clr-border-2); border-radius: var(--radius-md);
          min-height: 120px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; overflow: hidden; transition: border-color var(--transition);
        }
        .ai-upload-zone:hover { border-color: var(--clr-accent); }
        .ai-preview-img { width: 100%; max-height: 180px; object-fit: contain; }
        .ai-feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); }
        .ai-feature-card { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
        .ai-result { overflow: hidden; }
        .ai-data-result { padding: 8px; background: var(--clr-surface-2); border-radius: var(--radius-sm); }
        @keyframes spinAnim { to { transform: rotate(360deg); } }
        .spin-anim { animation: spinAnim 0.7s linear infinite; }
      `}</style>
    </div>
  )
}
