import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ZoomIn, Tag, Info, ExternalLink } from 'lucide-react'
import ImageModal from './ImageModal'
import axios from 'axios'

function getScoreClass(pct) {
  if (pct >= 80) return 'score-high'
  if (pct >= 60) return 'score-mid'
  return 'score-low'
}

export default function ImageCard({ image, rank, style }) {
  const [isFav, setIsFav] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [imgError, setImgError] = useState(false)

  const score = image.score_percent ?? (image.score != null ? Math.round(image.score * 100) : 0)

  const toggleFav = async (e) => {
    e.stopPropagation()
    try {
      if (isFav) {
        await axios.delete(`/favorites/${image.id}`)
      } else {
        await axios.post(`/favorites/${image.id}`)
      }
      setIsFav(!isFav)
    } catch {
      setIsFav(!isFav) // optimistic
    }
  }

  const handleClick = async () => {
    try { await axios.post(`/click/${image.id}`) } catch {}
    setShowModal(true)
  }

  return (
    <>
      <motion.div
        className="image-card card card-glow"
        style={style}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(rank * 0.04, 0.5) }}
        onClick={handleClick}
      >
        {/* Image */}
        <div className="image-card-img-wrap">
          {!imgError ? (
            <img
              src={image.url}
              alt={image.title || image.filename}
              className="image-card-img"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="image-card-img image-card-error">
              <Info size={28} style={{ opacity: 0.3 }} />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="image-card-overlay">
            <button className="btn-icon" onClick={e => { e.stopPropagation(); setShowModal(true) }}>
              <ZoomIn size={16} />
            </button>
            <button className={`btn-icon ${isFav ? 'active' : ''}`} onClick={toggleFav}>
              <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Score badge */}
          {score > 0 && (
            <div className={`score-badge ${getScoreClass(score)}`} style={{ position:'absolute', top:8, left:8 }}>
              {score}%
            </div>
          )}

          {/* Rank badge */}
          {rank <= 3 && (
            <div className="rank-badge">#{rank}</div>
          )}
        </div>

        {/* Info */}
        <div className="image-card-info">
          <p className="image-card-title truncate">{image.title || image.filename}</p>
          {image.category && (
            <span className="badge badge-accent" style={{ fontSize:'0.7rem' }}>{image.category}</span>
          )}
          {image.caption && (
            <p className="text-xs text-2 truncate" style={{ marginTop: 4 }}>{image.caption}</p>
          )}

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div className="flex wrap gap-sm" style={{ marginTop: 6 }}>
              {image.tags.slice(0, 3).map(t => (
                <span key={t} className="tag" style={{ fontSize:'0.7rem', padding:'2px 7px' }}>
                  <Tag size={9} />{t}
                </span>
              ))}
              {image.tags.length > 3 && (
                <span className="tag" style={{ fontSize:'0.7rem', padding:'2px 7px' }}>+{image.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Color dots */}
          {image.dominant_colors && image.dominant_colors.length > 0 && (
            <div className="flex items-center gap-sm" style={{ marginTop: 6 }}>
              {image.dominant_colors.slice(0, 5).map((c, i) => (
                <div key={i} className="color-dot" style={{ backgroundColor: c.hex }} title={`${c.name} (${c.percentage}%)`} />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && <ImageModal image={image} onClose={() => setShowModal(false)} />}
      </AnimatePresence>

      <style>{`
        .image-card {
          cursor:pointer; overflow:hidden;
          transition:transform var(--transition), box-shadow var(--transition);
        }
        .image-card:hover { transform:translateY(-4px); }
        .image-card-img-wrap { position:relative; aspect-ratio:1; overflow:hidden; background:var(--clr-surface-2); }
        .image-card-img { width:100%; height:100%; object-fit:cover; transition:transform var(--transition-slow); }
        .image-card:hover .image-card-img { transform:scale(1.06); }
        .image-card-error { display:flex; align-items:center; justify-content:center; width:100%; height:100%; }
        .image-card-overlay {
          position:absolute; inset:0;
          background:rgba(8,11,20,0.6);
          display:flex; align-items:center; justify-content:center; gap:10px;
          opacity:0; transition:opacity var(--transition); backdrop-filter:blur(3px);
        }
        .image-card:hover .image-card-overlay { opacity:1; }
        .image-card-info { padding:12px; display:flex; flex-direction:column; gap:4px; }
        .image-card-title { font-size:0.85rem; font-weight:600; color:var(--clr-text); }
        .rank-badge {
          position:absolute; top:8px; right:8px;
          background:var(--gradient-accent); color:#fff;
          font-size:0.72rem; font-weight:700;
          padding:2px 8px; border-radius:var(--radius-full);
        }
      `}</style>
    </>
  )
}
