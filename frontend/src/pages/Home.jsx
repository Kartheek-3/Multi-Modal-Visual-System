import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Zap, Image, Brain, Mic, Camera, BarChart2, Shield } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import { useSearchStore } from '../store/useSearchStore'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const FEATURES = [
  { icon: <Image size={20}/>,  title: 'Image Search',       desc: 'Upload any image to find visually similar results instantly.' },
  { icon: <Brain size={20}/>,  title: 'AI Natural Language', desc: '"Show me red running shoes" — AI understands intent.' },
  { icon: <Mic size={20}/>,    title: 'Voice Search',        desc: 'Speak your query and let the engine do the work.' },
  { icon: <Camera size={20}/>, title: 'Camera Search',       desc: 'Point your camera at any object for instant results.' },
  { icon: <Zap size={20}/>,    title: 'Hybrid Search',       desc: 'Combine image + text for pinpoint precision.' },
  { icon: <BarChart2 size={20}/>, title: 'Analytics',        desc: 'Track trends, performance, and your search history.' },
]

const CATEGORIES = [
  { label: 'Shoes',       emoji: '👟', q: 'shoes' },
  { label: 'Watches',     emoji: '⌚', q: 'watches' },
  { label: 'Bags',        emoji: '👜', q: 'bags' },
  { label: 'Shirts',      emoji: '👕', q: 'shirts' },
  { label: 'Electronics', emoji: '💻', q: 'electronics' },
  { label: 'Sports',      emoji: '⚽', q: 'sports' },
]

export default function Home() {
  const [stats, setStats] = useState(null)
  const [trending, setTrending] = useState([])
  const { searchText, setQuery } = useSearchStore()
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/analytics/overview').then(r => setStats(r.data)).catch(() => {})
    axios.get('/analytics/trending', { params: { limit: 6 } }).then(r => setTrending(r.data)).catch(() => {})
  }, [])

  const handleQuickSearch = async (q) => {
    setQuery(q)
    await searchText(q, null)
    navigate('/results')
  }

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <motion.div className="hero-content" initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
          <div className="hero-badge animate-fade-in">
            <Sparkles size={13}/> AI-Powered Multimodal Search
          </div>
          <h1 className="hero-title">
            Search the Visual World<br/>
            <span className="gradient-text">with AI Precision</span>
          </h1>
          <p className="hero-subtitle">
            Upload images, speak queries, or describe what you're looking for — CLIP + FAISS finds it in milliseconds.
          </p>

          <div className="hero-search-wrap animate-fade-in delay-2">
            <SearchBar />
          </div>

          {/* Category quick links */}
          <div className="category-pills animate-fade-in delay-3">
            {CATEGORIES.map(c => (
              <button key={c.q} className="category-pill" onClick={() => handleQuickSearch(c.q)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div className="stats-row" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}>
            {[
              { label:'Images Indexed', value: stats.total_images?.toLocaleString() || '—' },
              { label:'Searches Run',   value: stats.total_searches?.toLocaleString() || '—' },
              { label:'Users',          value: stats.total_users?.toLocaleString() || '—' },
              { label:'Search Modes',   value: '5+' },
            ].map((s,i) => (
              <div key={i} className="stat-item">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="container trending-section">
          <div className="section-title"><TrendingUp size={16}/> Trending Searches</div>
          <div className="trending-chips">
            {trending.map((t,i) => (
              <motion.button
                key={t.query}
                className="trending-chip"
                initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                onClick={() => handleQuickSearch(t.query)}
              >
                <span className="trending-rank">#{i+1}</span>
                {t.query}
                <span className="trending-count">{t.count}</span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Features grid */}
      <section className="container features-section">
        <h2 className="features-title">Everything You Need to <span className="gradient-text">Find Anything</span></h2>
        <div className="features-grid">
          {FEATURES.map((f,i) => (
            <motion.div
              key={i}
              className="feature-card card card-glow"
              initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.1+i*0.07}}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <style>{`
        .home-page { display:flex; flex-direction:column; gap:0; }
        .hero {
          min-height:calc(100vh - 64px); display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:var(--space-xl) var(--space-lg); text-align:center;
          gap:var(--space-xl);
        }
        .hero-content { display:flex; flex-direction:column; align-items:center; gap:var(--space-lg); max-width:800px; }
        .hero-badge {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(124,92,250,0.12); border:1px solid rgba(124,92,250,0.3);
          border-radius:var(--radius-full); padding:6px 16px;
          font-size:0.8rem; font-weight:600; color:var(--clr-accent);
        }
        .hero-title {
          font-family:var(--font-display); font-size:clamp(2.2rem,6vw,3.8rem);
          font-weight:800; line-height:1.15; color:var(--clr-text);
        }
        .hero-subtitle { font-size:1.05rem; color:var(--clr-text-2); max-width:560px; }
        .hero-search-wrap { width:100%; max-width:780px; }
        .category-pills { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
        .category-pill {
          padding:8px 18px; border-radius:var(--radius-full);
          background:var(--clr-surface); border:1px solid var(--clr-border);
          font-size:0.85rem; font-weight:500; color:var(--clr-text-2);
          cursor:pointer; transition:all var(--transition);
        }
        .category-pill:hover { border-color:var(--clr-accent); color:var(--clr-accent); transform:translateY(-2px); box-shadow:0 4px 16px var(--clr-accent-glow); }
        .stats-row { display:flex; gap:var(--space-xl); justify-content:center; flex-wrap:wrap; }
        .stat-item { text-align:center; }
        .stat-value { font-family:var(--font-display); font-size:2rem; font-weight:800; background:var(--gradient-accent); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .stat-label { font-size:0.8rem; color:var(--clr-text-3); margin-top:2px; }
        .trending-section { padding:var(--space-xl) 0; }
        .trending-section .section-title { margin-bottom:var(--space-md); }
        .trending-chips { display:flex; flex-wrap:wrap; gap:8px; }
        .trending-chip { display:flex; align-items:center; gap:8px; padding:8px 16px; border-radius:var(--radius-full); background:var(--clr-surface); border:1px solid var(--clr-border); font-size:0.85rem; color:var(--clr-text-2); cursor:pointer; transition:all var(--transition); }
        .trending-chip:hover { border-color:var(--clr-accent); color:var(--clr-text); }
        .trending-rank { font-size:0.72rem; font-weight:700; color:var(--clr-accent); }
        .trending-count { font-size:0.72rem; background:var(--clr-surface-2); padding:1px 7px; border-radius:var(--radius-full); }
        .features-section { padding:var(--space-2xl) 0; }
        .features-title { font-family:var(--font-display); font-size:clamp(1.6rem,4vw,2.4rem); font-weight:800; text-align:center; margin-bottom:var(--space-xl); }
        .features-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:var(--space-lg); }
        .feature-card { padding:var(--space-lg); display:flex; flex-direction:column; gap:12px; }
        .feature-icon { width:44px; height:44px; border-radius:var(--radius-md); background:rgba(124,92,250,0.12); border:1px solid rgba(124,92,250,0.2); display:flex; align-items:center; justify-content:center; color:var(--clr-accent); }
        .feature-title { font-family:var(--font-display); font-size:1.05rem; font-weight:700; }
        .feature-desc { font-size:0.85rem; color:var(--clr-text-2); line-height:1.6; }
      `}</style>
    </div>
  )
}
