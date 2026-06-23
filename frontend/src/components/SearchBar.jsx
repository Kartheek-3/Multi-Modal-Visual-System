import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Image, Mic, Layers, Brain, Camera, X, Upload, ChevronDown } from 'lucide-react'
import { useSearchStore } from '../store/useSearchStore'
import { useNavigate } from 'react-router-dom'
import VoiceSearch from './VoiceSearch'

const SEARCH_MODES = [
  { id: 'text',   label: 'Text',    icon: <Search size={15} />,  desc: 'Search with keywords' },
  { id: 'image',  label: 'Image',   icon: <Image size={15} />,   desc: 'Upload and find similars' },
  { id: 'hybrid', label: 'Hybrid',  icon: <Layers size={15} />,  desc: 'Image + text combined' },
  { id: 'nlp',    label: 'AI',      icon: <Brain size={15} />,   desc: 'Natural language intent' },
  { id: 'rag',    label: 'RAG',     icon: <Brain size={15} />,   desc: 'Search with AI explanation' },
]

export default function SearchBar() {
  const navigate = useNavigate()
  const { searchType, setSearchType, query, setQuery, queryImage, queryImagePreview,
          setQueryImage, clearImage, searchText, searchImage, searchHybrid, searchNLP,
          searchRAG, isLoading, category } = useSearchStore()

  const [showModes, setShowModes] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [hybridText, setHybridText] = useState('')
  const fileRef = useRef()

  const handleFile = useCallback((file) => {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setQueryImage(file, preview)
    if (searchType === 'text') setSearchType('image')
  }, [setQueryImage, setSearchType, searchType])

  const onDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (isLoading) return

    if (searchType === 'text' || searchType === 'nlp' || searchType === 'rag') {
      if (!query.trim()) return
      if (searchType === 'nlp') await searchNLP(query)
      else if (searchType === 'rag') await searchRAG(query)
      else await searchText(query, category)
    } else if (searchType === 'image') {
      if (!queryImage) return
      await searchImage(queryImage, category)
    } else if (searchType === 'hybrid') {
      if (!queryImage || !hybridText.trim()) return
      await searchHybrid(queryImage, hybridText, 0.5, category)
    }
    navigate('/results')
  }

  const mode = SEARCH_MODES.find(m => m.id === searchType) || SEARCH_MODES[0]
  const showTextInput = searchType === 'text' || searchType === 'nlp' || searchType === 'rag'
  const showImageInput = searchType === 'image' || searchType === 'hybrid'

  return (
    <>
      <form className="searchbar-wrap" onSubmit={handleSubmit}>
        {/* Mode selector */}
        <div className="searchbar-mode-selector">
          <button
            type="button"
            className="mode-toggle"
            onClick={() => setShowModes(!showModes)}
          >
            {mode.icon}
            <span>{mode.label}</span>
            <ChevronDown size={13} style={{ opacity: 0.5, transform: showModes ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          <AnimatePresence>
            {showModes && (
              <motion.div
                className="mode-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {SEARCH_MODES.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mode-option ${searchType === m.id ? 'active' : ''}`}
                    onClick={() => { setSearchType(m.id); setShowModes(false) }}
                  >
                    {m.icon}
                    <div>
                      <div className="mode-option-label">{m.label}</div>
                      <div className="mode-option-desc">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="searchbar-divider" />

        {/* Image preview pill */}
        <AnimatePresence>
          {queryImagePreview && showImageInput && (
            <motion.div className="image-pill" initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.8, opacity:0 }}>
              <img src={queryImagePreview} alt="query" className="image-pill-thumb" />
              <button type="button" className="image-pill-remove" onClick={clearImage}>
                <X size={11} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text input */}
        {showTextInput && (
          <input
            className="searchbar-input"
            placeholder={
              searchType === 'nlp' ? 'e.g. "Modern running shoes under ₹5000"…' :
              searchType === 'rag' ? 'e.g. "Find black sneakers and explain why"…' :
              'Search images…'
            }
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        )}

        {/* Hybrid text input */}
        {searchType === 'hybrid' && (
          <input
            className="searchbar-input"
            placeholder='Describe what to find e.g. "Black color only"…'
            value={hybridText}
            onChange={e => setHybridText(e.target.value)}
          />
        )}

        {/* Empty image prompt */}
        {showImageInput && !queryImagePreview && (
          <div
            className="searchbar-image-prompt"
            onClick={() => fileRef.current?.click()}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
          >
            <Upload size={15} />
            <span>Drop or click to upload image</span>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files[0])} />

        {/* Right action buttons */}
        <div className="searchbar-actions">
          {showImageInput && (
            <button type="button" className="btn-icon" onClick={() => fileRef.current?.click()} title="Upload image">
              <Upload size={16} />
            </button>
          )}
          <button type="button" className="btn-icon" onClick={() => setShowVoice(true)} title="Voice search">
            <Mic size={16} />
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? <div className="spinner" style={{width:18,height:18,borderWidth:2}} /> : <Search size={16} />}
            {isLoading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      <VoiceSearch open={showVoice} onClose={() => setShowVoice(false)} />

      <style>{`
        .searchbar-wrap {
          display:flex; align-items:center; gap:8px;
          background:rgba(255,255,255,0.05);
          border:1px solid var(--clr-border-2);
          border-radius:var(--radius-full);
          padding:6px 8px 6px 4px;
          backdrop-filter:blur(12px);
          transition:border-color var(--transition), box-shadow var(--transition);
          width:100%; max-width:780px;
          position:relative;
        }
        .searchbar-wrap:focus-within {
          border-color:rgba(124,92,250,0.5);
          box-shadow:0 0 0 3px rgba(124,92,250,0.12), var(--shadow-glow);
        }
        .searchbar-mode-selector { position:relative; }
        .mode-toggle {
          display:flex; align-items:center; gap:6px;
          padding:7px 12px; border-radius:var(--radius-full);
          background:var(--clr-surface-2); border:1px solid var(--clr-border);
          color:var(--clr-text); font-size:0.82rem; font-weight:600;
          white-space:nowrap; transition:all var(--transition-fast); cursor:pointer;
        }
        .mode-toggle:hover { border-color:var(--clr-accent); color:var(--clr-accent); }
        .mode-dropdown {
          position:absolute; top:calc(100% + 10px); left:0;
          min-width:220px; background:#0d1120;
          border:1px solid var(--clr-border-2); border-radius:var(--radius-md);
          padding:6px; z-index:200; box-shadow:var(--shadow-card);
        }
        .mode-option {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:var(--radius-sm); width:100%; cursor:pointer;
          color:var(--clr-text-2); transition:all var(--transition-fast);
          text-align:left;
        }
        .mode-option:hover, .mode-option.active { background:var(--clr-surface-2); color:var(--clr-text); }
        .mode-option.active { color:var(--clr-accent); }
        .mode-option-label { font-size:0.85rem; font-weight:600; }
        .mode-option-desc { font-size:0.72rem; color:var(--clr-text-3); margin-top:1px; }
        .searchbar-divider { width:1px; height:24px; background:var(--clr-border); flex-shrink:0; }
        .searchbar-input {
          flex:1; background:none; border:none; outline:none;
          color:var(--clr-text); font-size:0.95rem;
          padding:6px 8px; min-width:0;
        }
        .searchbar-input::placeholder { color:var(--clr-text-3); }
        .searchbar-image-prompt {
          flex:1; display:flex; align-items:center; gap:8px;
          color:var(--clr-text-3); font-size:0.85rem; cursor:pointer;
          padding:6px 8px; border-radius:var(--radius-md);
          transition:color var(--transition-fast);
        }
        .searchbar-image-prompt:hover { color:var(--clr-accent); }
        .searchbar-actions { display:flex; align-items:center; gap:6px; flex-shrink:0; }
        .image-pill {
          display:flex; align-items:center; position:relative; flex-shrink:0;
        }
        .image-pill-thumb {
          width:32px; height:32px; border-radius:8px; object-fit:cover;
          border:2px solid var(--clr-accent);
        }
        .image-pill-remove {
          position:absolute; top:-4px; right:-4px;
          width:16px; height:16px; border-radius:50%;
          background:var(--clr-error); color:#fff;
          display:flex; align-items:center; justify-content:center;
          font-size:10px; cursor:pointer;
        }
      `}</style>
    </>
  )
}
