import { useEffect, useState } from 'react'
import { useSearchStore } from '../store/useSearchStore'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
import ImageCard from '../components/ImageCard'
import SearchBar from '../components/SearchBar'
import { Grid, SlidersHorizontal } from 'lucide-react'

const SORTS = ['newest', 'oldest', 'most_viewed', 'highest_rated']
const CATEGORIES = ['all', 'shoes', 'watches', 'bags', 'shirts', 'electronics', 'sports', 'other']

export default function Browse() {
  const [images, setImages] = useState([])
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState(null)
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  const load = async (p = 1, cat = category, srt = sort, append = false) => {
    setLoading(true)
    try {
      const { data } = await axios.get('/images', { params: { page: p, page_size: 24, category: cat || undefined, sort: srt } })
      setImages(prev => append ? [...prev, ...data.images] : data.images)
      setHasMore(data.images.length === 24)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load(1, category, sort, false); setPage(1) }, [category, sort])

  const loadMore = () => { const next = page + 1; setPage(next); load(next, category, sort, true) }

  return (
    <div className="browse-page container">
      <div className="browse-header">
        <h1 className="browse-title"><Grid size={22}/> Browse Images</h1>
        <div className="browse-controls">
          {/* Category */}
          <div className="flex wrap gap-sm">
            {CATEGORIES.map(c => (
              <button key={c} className={`filter-cat-btn ${(category ?? 'all') === c ? 'active' : ''}`} onClick={() => setCategory(c === 'all' ? null : c)}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          {/* Sort */}
          <select className="input" style={{ width:'auto', padding:'8px 14px' }} value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {loading && images.length === 0 ? (
        <div className="result-grid">
          {Array.from({length:12}).map((_,i) => (
            <div key={i}>
              <div className="skeleton" style={{aspectRatio:'1', borderRadius:'var(--radius-md)'}}/>
              <div className="skeleton" style={{height:14,marginTop:10,borderRadius:6}}/>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="result-grid">
            {images.map((img,i) => <ImageCard key={img.id} image={img} rank={i+1}/>)}
          </div>
          {hasMore && (
            <div style={{textAlign:'center',marginTop:'var(--space-xl)'}}>
              <button className="btn btn-ghost" onClick={loadMore} disabled={loading}>
                {loading ? <div className="spinner" style={{width:18,height:18,borderWidth:2}}/> : 'Load More'}
              </button>
            </div>
          )}
          {images.length === 0 && !loading && (
            <div className="flex-center" style={{minHeight:200,color:'var(--clr-text-3)'}}>No images found.</div>
          )}
        </>
      )}

      <style>{`
        .browse-page { padding:var(--space-xl) 0; display:flex; flex-direction:column; gap:var(--space-xl); }
        .browse-header { display:flex; flex-direction:column; gap:var(--space-md); }
        .browse-title { font-family:var(--font-display); font-size:1.8rem; font-weight:800; display:flex; align-items:center; gap:10px; }
        .browse-controls { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); }
        .filter-cat-btn { padding:7px 14px; border-radius:var(--radius-full); font-size:0.82rem; color:var(--clr-text-2); background:var(--clr-surface); border:1px solid var(--clr-border); cursor:pointer; transition:all var(--transition-fast); }
        .filter-cat-btn:hover { border-color:var(--clr-accent); color:var(--clr-accent); }
        .filter-cat-btn.active { background:rgba(124,92,250,0.15); color:var(--clr-accent); border-color:rgba(124,92,250,0.3); font-weight:600; }
      `}</style>
    </div>
  )
}
