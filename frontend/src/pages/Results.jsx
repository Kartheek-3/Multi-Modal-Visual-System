import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Bot, AlertCircle, Search } from 'lucide-react'
import { useSearchStore } from '../store/useSearchStore'
import ImageCard from '../components/ImageCard'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'

function ScoreLegend() {
  return (
    <div className="score-legend">
      <span className="score-badge score-high">≥80% High</span>
      <span className="score-badge score-mid">60-80% Medium</span>
      <span className="score-badge score-low">&lt;60% Low</span>
    </div>
  )
}

export default function Results() {
  const {
    results, isLoading, error, query, searchType, ragExplanation,
    responseTime, category, sort, setCategory, setSort,
  } = useSearchStore()

  const [showFilter, setShowFilter] = useState(false)
  const [sortedResults, setSortedResults] = useState([])

  useEffect(() => {
    let r = [...results]
    if (sort === 'similarity') r.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    // 'newest' and 'rating' would need server data; client-side approximation
    setSortedResults(r)
  }, [results, sort])

  const typeLabel = {
    text: 'Text', image: 'Image', hybrid: 'Hybrid',
    nlp: 'AI Intent', rag: 'RAG', voice: 'Voice', camera: 'Camera',
  }[searchType] || searchType

  return (
    <div className="results-page">
      {/* Search bar at top */}
      <div className="results-search-bar">
        <div className="container" style={{ display:'flex', justifyContent:'center', padding:'16px var(--space-lg)' }}>
          <SearchBar />
        </div>
      </div>

      <div className="container results-layout">
        {/* Sidebar */}
        <aside className="results-sidebar">
          <div className="card" style={{ padding:'16px' }}>
            <FilterPanel
              category={category}
              sort={sort}
              onCategory={setCategory}
              onSort={setSort}
              resultCount={sortedResults.length}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="results-main">
          {/* Header */}
          <div className="results-header">
            <div>
              <h1 className="results-count-text">
                {isLoading ? 'Searching…' : `${sortedResults.length} results`}
                {query && !isLoading && <span className="text-3"> for "{query}"</span>}
              </h1>
              <div className="flex items-center gap-sm" style={{ marginTop:6 }}>
                <span className="badge badge-accent">{typeLabel} Search</span>
                {responseTime && (
                  <span className="flex items-center gap-sm text-xs text-3">
                    <Zap size={11}/> {responseTime}ms
                  </span>
                )}
              </div>
            </div>
            {sortedResults.length > 0 && <ScoreLegend />}
          </div>

          {/* RAG explanation */}
          <AnimatePresence>
            {ragExplanation && (
              <motion.div className="rag-box" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}>
                <Bot size={16} style={{ color:'var(--clr-accent)', flexShrink:0, marginTop:2 }}/>
                <div>
                  <p className="text-sm font-semibold" style={{ marginBottom:4 }}>AI Explanation</p>
                  <p className="text-sm text-2">{ragExplanation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div className="results-error" initial={{opacity:0}} animate={{opacity:1}}>
              <AlertCircle size={16}/> {error}
            </motion.div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="result-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton" style={{ aspectRatio:'1', borderRadius:'var(--radius-md)' }} />
                  <div className="skeleton" style={{ height:14, marginTop:10, borderRadius:6 }} />
                  <div className="skeleton" style={{ height:12, marginTop:6, width:'60%', borderRadius:6 }} />
                </div>
              ))}
            </div>
          )}

          {/* Results grid */}
          {!isLoading && sortedResults.length > 0 && (
            <div className="result-grid">
              {sortedResults.map((img, i) => (
                <ImageCard key={img.id || i} image={img} rank={i + 1} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && sortedResults.length === 0 && (
            <div className="results-empty">
              <Search size={48} style={{ opacity:0.2, marginBottom:16 }}/>
              <h2>No results found</h2>
              <p className="text-2">Try a different query or upload an image to search.</p>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .results-page { min-height:calc(100vh - 64px); display:flex; flex-direction:column; }
        .results-search-bar { border-bottom:1px solid var(--clr-border); background:rgba(8,11,20,0.6); backdrop-filter:blur(12px); }
        .results-layout { display:flex; gap:var(--space-lg); padding-top:var(--space-lg); padding-bottom:var(--space-xl); flex:1; }
        .results-sidebar { width:200px; flex-shrink:0; position:sticky; top:80px; align-self:flex-start; }
        .results-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:var(--space-lg); }
        .results-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); }
        .results-count-text { font-family:var(--font-display); font-size:1.2rem; font-weight:700; }
        .score-legend { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .filter-category-list { display:flex; flex-direction:column; gap:4px; }
        .filter-cat-btn { padding:7px 12px; border-radius:var(--radius-sm); text-align:left; font-size:0.82rem; color:var(--clr-text-2); transition:all var(--transition-fast); cursor:pointer; }
        .filter-cat-btn:hover { background:var(--clr-surface-2); color:var(--clr-text); }
        .filter-cat-btn.active { background:rgba(124,92,250,0.15); color:var(--clr-accent); font-weight:600; }
        .rag-box { display:flex; gap:12px; background:rgba(124,92,250,0.07); border:1px solid rgba(124,92,250,0.2); border-radius:var(--radius-md); padding:16px; }
        .results-error { display:flex; align-items:center; gap:8px; background:rgba(242,92,110,0.1); border:1px solid rgba(242,92,110,0.25); border-radius:var(--radius-md); padding:14px 18px; color:var(--clr-error); font-size:0.9rem; }
        .results-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; min-height:300px; text-align:center; gap:8px; color:var(--clr-text-2); }
        .skeleton-card { display:flex; flex-direction:column; }
        @media(max-width:768px) { .results-sidebar { display:none; } }
      `}</style>
    </div>
  )
}
