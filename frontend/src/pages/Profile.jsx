import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Heart, Clock, LogOut, Bookmark } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ImageCard from '../components/ImageCard'

export default function Profile() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('favorites') // favorites | history
  const [favorites, setFavorites] = useState([])
  const [history, setHistory] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/'); return }
    Promise.all([
      axios.get('/favorites'),
      axios.get('/history'),
      axios.get('/analytics/dashboard'),
    ]).then(([f, h, d]) => {
      setFavorites(f.data)
      setHistory(h.data)
      setDashboard(d.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  return (
    <div className="profile-page container">
      {/* Profile header */}
      <motion.div className="profile-header card" initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}}>
        <div className="profile-avatar">{user.username[0].toUpperCase()}</div>
        <div className="profile-info">
          <h1 className="profile-name">{user.username}</h1>
          <p className="text-sm text-2">{user.email}</p>
          {dashboard && (
            <div className="profile-stats">
              <div className="profile-stat"><span className="profile-stat-val">{dashboard.total_searches}</span> Searches</div>
              <div className="profile-stat"><span className="profile-stat-val">{dashboard.total_favorites}</span> Saved</div>
            </div>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/') }}>
          <LogOut size={14}/> Sign out
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`profile-tab ${tab === 'favorites' ? 'active' : ''}`} onClick={() => setTab('favorites')}>
          <Heart size={14}/> Favorites ({favorites.length})
        </button>
        <button className={`profile-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <Clock size={14}/> Search History ({history.length})
        </button>
      </div>

      {loading ? (
        <div className="flex-center" style={{minHeight:200}}><div className="spinner"/></div>
      ) : tab === 'favorites' ? (
        favorites.length > 0 ? (
          <div className="result-grid">
            {favorites.map((f, i) => (
              <ImageCard key={f.favorite_id} image={{ ...f.image, score_percent: 0 }} rank={i+1} />
            ))}
          </div>
        ) : (
          <div className="profile-empty">
            <Heart size={40} style={{opacity:0.2}}/>
            <p>No favorites yet. Start saving images!</p>
          </div>
        )
      ) : (
        <div className="history-list">
          {history.length > 0 ? history.map((h, i) => (
            <motion.div key={h.id} className="history-item card" initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
              <div className="flex items-center gap-md">
                <div className="history-icon"><Clock size={14}/></div>
                <div>
                  <p className="text-sm font-semibold">{h.query_text || '[Image Search]'}</p>
                  <p className="text-xs text-3">{new Date(h.created_at).toLocaleString()} · {h.results_count} results · {h.search_type}</p>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="profile-empty">
              <Clock size={40} style={{opacity:0.2}}/>
              <p>No search history yet.</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .profile-page { padding:var(--space-xl) 0; display:flex; flex-direction:column; gap:var(--space-xl); }
        .profile-header { padding:var(--space-lg); display:flex; align-items:center; gap:var(--space-lg); flex-wrap:wrap; }
        .profile-avatar { width:64px; height:64px; border-radius:50%; background:var(--gradient-accent); display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:800; color:#fff; flex-shrink:0; }
        .profile-info { flex:1; }
        .profile-name { font-family:var(--font-display); font-size:1.4rem; font-weight:800; }
        .profile-stats { display:flex; gap:var(--space-lg); margin-top:8px; }
        .profile-stat { font-size:0.85rem; color:var(--clr-text-2); }
        .profile-stat-val { font-weight:700; color:var(--clr-text); }
        .profile-tabs { display:flex; gap:8px; border-bottom:1px solid var(--clr-border); }
        .profile-tab { display:flex; align-items:center; gap:6px; padding:12px 18px; border-bottom:2px solid transparent; font-size:0.88rem; font-weight:600; color:var(--clr-text-2); cursor:pointer; transition:all var(--transition); margin-bottom:-1px; }
        .profile-tab:hover { color:var(--clr-text); }
        .profile-tab.active { color:var(--clr-accent); border-bottom-color:var(--clr-accent); }
        .profile-empty { display:flex; flex-direction:column; align-items:center; gap:12px; min-height:200px; justify-content:center; color:var(--clr-text-3); }
        .history-list { display:flex; flex-direction:column; gap:8px; }
        .history-item { padding:12px 16px; }
        .history-icon { width:32px; height:32px; border-radius:var(--radius-sm); background:var(--clr-surface-2); display:flex; align-items:center; justify-content:center; color:var(--clr-accent); flex-shrink:0; }
      `}</style>
    </div>
  )
}
