import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, Clock, Zap, Search, Heart, PieChart } from 'lucide-react'
import axios from 'axios'

function StatCard({ icon, label, value, delay = 0, color = 'var(--clr-accent)' }) {
  return (
    <motion.div className="stat-card card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay}}>
      <div className="stat-card-icon" style={{ color }}>{icon}</div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </motion.div>
  )
}

function MiniBar({ label, value, max, color }) {
  return (
    <div className="mini-bar-item">
      <div className="flex justify-between items-center" style={{marginBottom:4}}>
        <span className="text-sm">{label}</span>
        <span className="text-sm font-bold" style={{color}}>{value}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${Math.round((value/max)*100)}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Analytics() {
  const [perf, setPerf] = useState(null)
  const [trending, setTrending] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTypes, setSearchTypes] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/analytics/performance'),
      axios.get('/analytics/trending', { params: { limit: 8 } }),
      axios.get('/analytics/categories'),
      axios.get('/analytics/search-types'),
      axios.get('/analytics/overview'),
    ]).then(([p, t, c, s, o]) => {
      setPerf(p.data)
      setTrending(t.data)
      setCategories(c.data)
      setSearchTypes(s.data)
      setOverview(o.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" style={{ width:40, height:40 }}/>
    </div>
  )

  const maxCat = Math.max(...categories.map(c => c.count), 1)
  const maxType = Math.max(...searchTypes.map(s => s.count), 1)

  return (
    <div className="analytics-page container">
      <motion.div className="analytics-header" initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}}>
        <h1 className="analytics-title"><BarChart2 size={24}/> Analytics Dashboard</h1>
        <p className="text-2">Real-time insights into search performance and usage patterns.</p>
      </motion.div>

      {/* Overview stats */}
      <div className="overview-grid">
        <StatCard icon={<Search size={20}/>} label="Total Searches"  value={overview?.total_searches?.toLocaleString() ?? '—'} delay={0.05} />
        <StatCard icon={<BarChart2 size={20}/>} label="Total Images"  value={overview?.total_images?.toLocaleString() ?? '—'} delay={0.1} color="var(--clr-success)" />
        <StatCard icon={<Zap size={20}/>}   label="Avg Response"   value={perf ? `${perf.avg_response_ms}ms` : '—'} delay={0.15} color="var(--clr-warning)" />
        <StatCard icon={<Heart size={20}/>} label="Avg Results"    value={perf ? perf.avg_results : '—'} delay={0.2} color="#f25c6e" />
      </div>

      <div className="analytics-grid-2">
        {/* Trending */}
        <motion.div className="card analytics-card" initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:0.2}}>
          <div className="section-title" style={{marginBottom:16}}><TrendingUp size={14}/> Trending Queries</div>
          {trending.length > 0 ? trending.map((t, i) => (
            <div key={i} className="trending-row">
              <span className="trending-row-rank">#{i+1}</span>
              <span className="trending-row-query">{t.query}</span>
              <span className="badge badge-accent">{t.count}×</span>
            </div>
          )) : <p className="text-sm text-3">No searches yet.</p>}
        </motion.div>

        {/* Performance */}
        <motion.div className="card analytics-card" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.25}}>
          <div className="section-title" style={{marginBottom:16}}><Zap size={14}/> Search Performance</div>
          {perf ? [
            { label:'Avg Response Time', value:`${perf.avg_response_ms}ms`, color:'var(--clr-accent)' },
            { label:'Fastest Query',     value:`${perf.min_response_ms}ms`, color:'var(--clr-success)' },
            { label:'Slowest Query',     value:`${perf.max_response_ms}ms`, color:'var(--clr-error)' },
          ].map((r,i) => (
            <div key={i} className="perf-row">
              <span className="text-sm text-2">{r.label}</span>
              <span className="font-bold" style={{ color:r.color }}>{r.value}</span>
            </div>
          )) : <p className="text-sm text-3">No data yet.</p>}
        </motion.div>

        {/* Categories */}
        <motion.div className="card analytics-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
          <div className="section-title" style={{marginBottom:16}}><PieChart size={14}/> Images by Category</div>
          {categories.length > 0 ? categories.map((c,i) => (
            <MiniBar key={i} label={c.category} value={c.count} max={maxCat} color={`hsl(${250+i*30},70%,65%)`} />
          )) : <p className="text-sm text-3">No images indexed yet.</p>}
        </motion.div>

        {/* Search type breakdown */}
        <motion.div className="card analytics-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}}>
          <div className="section-title" style={{marginBottom:16}}><Search size={14}/> Search Type Breakdown</div>
          {searchTypes.length > 0 ? searchTypes.map((s,i) => (
            <MiniBar key={i} label={s.type} value={s.count} max={maxType} color={`hsl(${180+i*40},70%,60%)`} />
          )) : <p className="text-sm text-3">No searches yet.</p>}
        </motion.div>
      </div>

      <style>{`
        .analytics-page { padding:var(--space-xl) 0; display:flex; flex-direction:column; gap:var(--space-xl); }
        .analytics-header { display:flex; flex-direction:column; gap:6px; }
        .analytics-title { font-family:var(--font-display); font-size:1.8rem; font-weight:800; display:flex; align-items:center; gap:10px; }
        .overview-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:var(--space-md); }
        .stat-card { padding:var(--space-lg); display:flex; flex-direction:column; gap:8px; }
        .stat-card-icon { width:40px; height:40px; border-radius:var(--radius-md); background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; }
        .stat-card-value { font-family:var(--font-display); font-size:1.8rem; font-weight:800; }
        .stat-card-label { font-size:0.8rem; color:var(--clr-text-3); }
        .analytics-grid-2 { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:var(--space-lg); }
        .analytics-card { padding:var(--space-lg); display:flex; flex-direction:column; gap:10px; }
        .trending-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--clr-border); }
        .trending-row:last-child { border-bottom:none; }
        .trending-row-rank { font-size:0.75rem; font-weight:700; color:var(--clr-accent); min-width:28px; }
        .trending-row-query { flex:1; font-size:0.88rem; truncate; }
        .perf-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--clr-border); font-size:0.85rem; }
        .perf-row:last-child { border-bottom:none; }
        .mini-bar-item { margin-bottom:12px; }
      `}</style>
    </div>
  )
}
