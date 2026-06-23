import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, Maximize2, Heart, Download, Brain, Tag, Palette, Box, MessageSquare, Loader } from 'lucide-react'
import axios from 'axios'

export default function ImageModal({ image, onClose }) {
  const [tab, setTab] = useState('info')     // info | vqa | recommend
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [recommendations, setRecommendations] = useState(null)
  const [loadingRec, setLoadingRec] = useState(false)

  const askVQA = async () => {
    if (!question.trim()) return
    setIsAsking(true)
    try {
      const form = new FormData()
      const res = await fetch(image.url)
      const blob = await res.blob()
      form.append('file', blob, 'image.jpg')
      form.append('question', question)
      const { data } = await axios.post('/ai/vqa', form)
      setAnswer(data.answer)
    } catch {
      setAnswer('Sorry, could not process that question.')
    }
    setIsAsking(false)
  }

  const loadRecommendations = async () => {
    if (recommendations) return
    setLoadingRec(true)
    try {
      const { data } = await axios.get(`/recommend/${image.id}`, { params: { top_k: 6 } })
      setRecommendations(data.recommendations)
    } catch {
      setRecommendations([])
    }
    setLoadingRec(false)
  }

  const TABS = [
    { id: 'info', label: 'Info', icon: <Tag size={13} /> },
    { id: 'vqa',  label: 'Ask AI', icon: <Brain size={13} /> },
    { id: 'recommend', label: 'Similar', icon: <Box size={13} />, onClick: loadRecommendations },
  ]

  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-container card"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{image.title || image.filename}</h2>
          <div className="flex items-center gap-sm">
            <button className="btn-icon" onClick={() => setZoom(z => Math.min(z + 0.3, 3))} title="Zoom in"><ZoomIn size={15}/></button>
            <button className="btn-icon" onClick={() => setZoom(z => Math.max(z - 0.3, 0.5))} title="Zoom out"><ZoomOut size={15}/></button>
            <button className="btn-icon" onClick={() => setZoom(1)} title="Reset"><Maximize2 size={15}/></button>
            <button className="btn-icon" onClick={onClose}><X size={17}/></button>
          </div>
        </div>

        <div className="modal-body">
          {/* Image panel */}
          <div className="modal-image-panel">
            <div className="modal-image-scroll">
              <img
                src={image.url}
                alt={image.title}
                className="modal-image"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              />
            </div>

            {/* Score + category */}
            <div className="flex items-center gap-sm" style={{ marginTop: 12 }}>
              {image.score_percent > 0 && (
                <span className={`score-badge ${image.score_percent >= 80 ? 'score-high' : image.score_percent >= 60 ? 'score-mid' : 'score-low'}`}>
                  {image.score_percent}% match
                </span>
              )}
              {image.category && <span className="badge badge-accent">{image.category}</span>}
            </div>

            {image.caption && (
              <p className="modal-caption">"{image.caption}"</p>
            )}
          </div>

          {/* Right panel */}
          <div className="modal-right-panel">
            {/* Tabs */}
            <div className="modal-tabs">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`modal-tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => { setTab(t.id); t.onClick?.() }}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            <div className="modal-tab-content">
              {/* INFO TAB */}
              {tab === 'info' && (
                <div className="animate-fade-in">
                  {image.tags?.length > 0 && (
                    <div className="modal-section">
                      <div className="section-title"><Tag size={13}/> Tags</div>
                      <div className="flex wrap gap-sm" style={{marginTop:8}}>
                        {image.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </div>
                  )}

                  {image.dominant_colors?.length > 0 && (
                    <div className="modal-section">
                      <div className="section-title"><Palette size={13}/> Dominant Colors</div>
                      <div className="flex wrap gap-sm" style={{marginTop:8}}>
                        {image.dominant_colors.map((c,i) => (
                          <div key={i} className="color-item">
                            <div className="color-swatch" style={{ background: c.hex }}/>
                            <div>
                              <div className="text-sm font-semibold">{c.name}</div>
                              <div className="text-xs text-3">{c.percentage}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {image.description && (
                    <div className="modal-section">
                      <div className="section-title">Description</div>
                      <p className="text-sm text-2" style={{marginTop:6}}>{image.description}</p>
                    </div>
                  )}

                  <div className="modal-section">
                    <div className="section-title">Details</div>
                    <div className="detail-grid">
                      {image.width && <div className="detail-item"><span className="text-3">Size</span> {image.width}×{image.height}px</div>}
                      {image.faiss_id != null && <div className="detail-item"><span className="text-3">FAISS ID</span> #{image.faiss_id}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* VQA TAB */}
              {tab === 'vqa' && (
                <div className="animate-fade-in vqa-panel">
                  <p className="text-sm text-2" style={{marginBottom:12}}>
                    Ask anything about this image — color, brand, style, objects…
                  </p>
                  <div className="flex gap-sm">
                    <input
                      className="input"
                      placeholder='e.g. "What color is this shoe?"'
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && askVQA()}
                    />
                    <button className="btn btn-primary btn-sm" onClick={askVQA} disabled={isAsking}>
                      {isAsking ? <Loader size={14} className="spinner" style={{width:14,height:14,borderWidth:2}} /> : <MessageSquare size={14}/>}
                    </button>
                  </div>
                  {answer && (
                    <motion.div
                      className="vqa-answer animate-fade-in"
                      initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    >
                      <Brain size={14} style={{color:'var(--clr-accent)',flexShrink:0,marginTop:2}}/>
                      <p className="text-sm">{answer}</p>
                    </motion.div>
                  )}
                  <div className="vqa-suggestions">
                    {["What is this product?","What color is it?","What brand does it resemble?","Describe the style"].map(q => (
                      <button key={q} className="suggestion-chip" onClick={() => setQuestion(q)}>{q}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* SIMILAR TAB */}
              {tab === 'recommend' && (
                <div className="animate-fade-in">
                  {loadingRec ? (
                    <div className="flex-center" style={{minHeight:200}}>
                      <div className="spinner"/>
                    </div>
                  ) : recommendations?.length > 0 ? (
                    <div className="rec-grid">
                      {recommendations.map((r,i) => (
                        <div key={i} className="rec-thumb">
                          <img src={r.url} alt={r.title || r.filename} onError={e => e.target.style.display='none'} />
                          <div className="rec-thumb-score">{Math.round((r.score||0)*100)}%</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-3 text-center" style={{padding:24}}>No similar images found yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .modal-container {
          width:92vw; max-width:1000px; max-height:90vh;
          display:flex; flex-direction:column;
          background:#0d1120; border-color:var(--clr-border-2);
          overflow:hidden;
        }
        .modal-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:16px 20px; border-bottom:1px solid var(--clr-border);
          flex-shrink:0;
        }
        .modal-title { font-family:var(--font-display); font-size:1rem; font-weight:700; }
        .modal-body { display:flex; flex:1; overflow:hidden; }
        .modal-image-panel {
          flex:0 0 55%; padding:20px;
          overflow-y:auto; border-right:1px solid var(--clr-border);
          display:flex; flex-direction:column;
        }
        .modal-image-scroll { overflow:hidden; border-radius:var(--radius-md); background:var(--clr-surface); display:flex; align-items:center; justify-content:center; min-height:280px; }
        .modal-image { width:100%; height:auto; transition:transform 0.3s ease; object-fit:contain; }
        .modal-caption { font-style:italic; color:var(--clr-text-2); font-size:0.85rem; margin-top:10px; }
        .modal-right-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .modal-tabs { display:flex; padding:12px 16px; gap:6px; border-bottom:1px solid var(--clr-border); flex-shrink:0; }
        .modal-tab {
          display:flex; align-items:center; gap:5px;
          padding:6px 14px; border-radius:var(--radius-full);
          font-size:0.8rem; font-weight:600;
          color:var(--clr-text-2); cursor:pointer; transition:all var(--transition-fast);
        }
        .modal-tab:hover { color:var(--clr-text); background:var(--clr-surface); }
        .modal-tab.active { background:rgba(124,92,250,0.15); color:var(--clr-accent); }
        .modal-tab-content { flex:1; overflow-y:auto; padding:16px; }
        .modal-section { margin-bottom:20px; }
        .modal-section .section-title { margin-bottom:0; }
        .color-item { display:flex; align-items:center; gap:8px; }
        .color-swatch { width:28px; height:28px; border-radius:6px; border:2px solid var(--clr-border); flex-shrink:0; }
        .detail-grid { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
        .detail-item { display:flex; gap:8px; font-size:0.82rem; color:var(--clr-text); }
        .vqa-panel { display:flex; flex-direction:column; gap:12px; }
        .vqa-answer { display:flex; gap:10px; background:rgba(124,92,250,0.08); border:1px solid rgba(124,92,250,0.2); border-radius:var(--radius-md); padding:12px; }
        .vqa-suggestions { display:flex; flex-wrap:wrap; gap:6px; }
        .suggestion-chip { padding:5px 12px; border-radius:var(--radius-full); background:var(--clr-surface-2); border:1px solid var(--clr-border); font-size:0.75rem; color:var(--clr-text-2); cursor:pointer; transition:all var(--transition-fast); }
        .suggestion-chip:hover { border-color:var(--clr-accent); color:var(--clr-accent); }
        .rec-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .rec-thumb { position:relative; aspect-ratio:1; border-radius:var(--radius-md); overflow:hidden; background:var(--clr-surface); cursor:pointer; }
        .rec-thumb img { width:100%; height:100%; object-fit:cover; transition:transform var(--transition); }
        .rec-thumb:hover img { transform:scale(1.06); }
        .rec-thumb-score { position:absolute; top:4px; left:4px; background:rgba(8,11,20,0.8); color:var(--clr-success); font-size:0.7rem; font-weight:700; padding:2px 7px; border-radius:var(--radius-full); }
        @media(max-width:640px) { .modal-body { flex-direction:column; } .modal-image-panel { flex:none; border-right:none; border-bottom:1px solid var(--clr-border); } }
      `}</style>
    </motion.div>
  )
}
