import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BarChart2, User, LogOut, Menu, X, Zap, Camera, Bot } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import AuthModal from './AuthModal'
import CameraSearch from './CameraSearch'
import RAGChat from './RAGChat'

export default function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [showAuth, setShowAuth] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showRAG, setShowRAG] = useState(false)

  const navLinks = [
    { to: '/', label: 'Search' },
    { to: '/browse', label: 'Browse' },
    { to: '/analytics', label: 'Analytics', icon: <BarChart2 size={14} /> },
  ]

  return (
    <div>
      <nav className="navbar">
        <div className="container flex items-center justify-between" style={{ height: '100%' }}>
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon animate-glow-pulse">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="navbar-logo-text">
              Visual<span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="navbar-links">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`navbar-link ${location.pathname === l.to ? 'active' : ''}`}
              >
                {l.icon}{l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-sm">
            <button
              className={`btn-icon tooltip ${showRAG ? 'active' : ''}`}
              data-tip="AI Chat"
              onClick={() => setShowRAG(v => !v)}
            >
              <Bot size={16} />
            </button>
            <button
              className="btn-icon tooltip"
              data-tip="Camera Search"
              onClick={() => setShowCamera(true)}
            >
              <Camera size={16} />
            </button>

            {user ? (
              <div className="relative">
                <button className="navbar-user-btn" onClick={() => setShowUserMenu(v => !v)}>
                  <div className="navbar-avatar">{user.username[0].toUpperCase()}</div>
                  <span className="navbar-username">{user.username}</span>
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      className="user-dropdown"
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <User size={14} /> Profile
                      </Link>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item danger" onClick={() => { logout(); setShowUserMenu(false) }}>
                        <LogOut size={14} /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAuth(true)}>
                <Sparkles size={14} /> Get Started
              </button>
            )}

            <button className="btn-icon mobile-menu-btn" onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="mobile-link" onClick={() => setMobileOpen(false)}>
                  {l.icon}{l.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      <CameraSearch open={showCamera} onClose={() => setShowCamera(false)} />
      <AnimatePresence>
        {showRAG && <RAGChat open={showRAG} onClose={() => setShowRAG(false)} />}
      </AnimatePresence>

      <style>{`
        .navbar {
          position: sticky; top: 0; z-index: 50;
          height: 64px;
          background: rgba(8,11,20,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--clr-border);
        }
        .navbar-logo { display:flex; align-items:center; gap:10px; }
        .navbar-logo-icon {
          width:34px; height:34px; border-radius:10px;
          background: var(--gradient-accent);
          display:flex; align-items:center; justify-content:center;
          color:#fff; flex-shrink:0;
        }
        .navbar-logo-text {
          font-family: var(--font-display);
          font-size:1.25rem; font-weight:700; color:var(--clr-text);
        }
        .navbar-links { display:flex; align-items:center; gap:4px; }
        .navbar-link {
          display:flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:var(--radius-full);
          font-size:0.88rem; font-weight:500; color:var(--clr-text-2);
          transition:all var(--transition);
        }
        .navbar-link:hover, .navbar-link.active { color:var(--clr-text); background:var(--clr-surface); }
        .navbar-link.active { color:var(--clr-accent); }
        .navbar-user-btn {
          display:flex; align-items:center; gap:8px; cursor:pointer;
          padding:4px 12px 4px 4px; border-radius:var(--radius-full);
          background:var(--clr-surface); border:1px solid var(--clr-border);
          transition:all var(--transition);
        }
        .navbar-user-btn:hover { border-color:var(--clr-accent); }
        .navbar-avatar {
          width:28px; height:28px; border-radius:50%;
          background:var(--gradient-accent);
          display:flex; align-items:center; justify-content:center;
          font-size:0.78rem; font-weight:700; color:#fff;
        }
        .navbar-username { font-size:0.85rem; font-weight:600; color:var(--clr-text); }
        .user-dropdown {
          position:absolute; top:calc(100% + 8px); right:0;
          min-width:160px; background:#111827;
          border:1px solid var(--clr-border-2); border-radius:var(--radius-md);
          padding:6px; box-shadow:var(--shadow-card); z-index:200;
        }
        .dropdown-item {
          display:flex; align-items:center; gap:8px;
          padding:8px 12px; border-radius:var(--radius-sm);
          font-size:0.85rem; color:var(--clr-text-2);
          transition:all var(--transition-fast); cursor:pointer; width:100%;
        }
        .dropdown-item:hover { background:var(--clr-surface-2); color:var(--clr-text); }
        .dropdown-item.danger:hover { color:var(--clr-error); }
        .dropdown-divider { height:1px; background:var(--clr-border); margin:4px 0; }
        .mobile-menu-btn { display:none; }
        .mobile-menu {
          background:var(--clr-bg-2); border-top:1px solid var(--clr-border);
          padding:var(--space-md) var(--space-lg);
          display:flex; flex-direction:column; gap:4px; overflow:hidden;
        }
        .mobile-link {
          display:flex; align-items:center; gap:8px;
          padding:10px 14px; border-radius:var(--radius-md);
          color:var(--clr-text-2); font-size:0.95rem;
          transition:all var(--transition-fast);
        }
        .mobile-link:hover { background:var(--clr-surface); color:var(--clr-text); }
        @media(max-width:768px) {
          .navbar-links { display:none; }
          .navbar-username { display:none; }
          .mobile-menu-btn { display:flex; }
        }
      `}</style>
    </div>
  )
}
