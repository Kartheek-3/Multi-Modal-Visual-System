import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function AuthModal({ open, onClose }) {
  const [mode, setMode] = useState('login') // login | register
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const { login, register, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    let ok
    if (mode === 'login') ok = await login(form.email, form.password)
    else ok = await register(form.username, form.email, form.password)
    if (ok) { clearError(); onClose() }
  }

  const handleField = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (error) clearError()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div className="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
        <motion.div
          className="auth-modal card"
          initial={{scale:0.92,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.92,opacity:0}}
          transition={{type:'spring',stiffness:280,damping:26}}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="auth-header">
            <h2 className="auth-title">
              {mode === 'login' ? 'Welcome back 👋' : 'Create account ✨'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'login' ? 'Sign in to access personalized search and favorites' : 'Join VisualAI to save searches and get recommendations'}
            </p>
            <button className="btn-icon" style={{position:'absolute',top:16,right:16}} onClick={onClose}><X size={16}/></button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="auth-field">
                <label className="auth-label"><User size={13}/> Username</label>
                <input className="input" placeholder="your_username" value={form.username} onChange={handleField('username')} required />
              </div>
            )}
            <div className="auth-field">
              <label className="auth-label"><Mail size={13}/> Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={handleField('email')} required />
            </div>
            <div className="auth-field">
              <label className="auth-label"><Lock size={13}/> Password</label>
              <div className="relative">
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handleField('password')} required style={{paddingRight:44}}/>
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {error && (
              <motion.div className="auth-error" initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}>
                <AlertCircle size={14}/> {error}
              </motion.div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={isLoading} style={{justifyContent:'center',marginTop:4}}>
              {isLoading ? <div className="spinner" style={{width:18,height:18,borderWidth:2}}/> : null}
              {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <p className="text-sm text-2">Don't have an account? <button className="auth-link" onClick={() => { setMode('register'); clearError() }}>Sign up</button></p>
            ) : (
              <p className="text-sm text-2">Already have an account? <button className="auth-link" onClick={() => { setMode('login'); clearError() }}>Sign in</button></p>
            )}
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .auth-modal {
          width:420px; max-width:95vw; padding:0;
          background:#0d1120; border-color:var(--clr-border-2); overflow:hidden; position:relative;
        }
        .auth-header { padding:28px 28px 0; }
        .auth-title { font-family:var(--font-display); font-size:1.4rem; font-weight:700; margin-bottom:6px; }
        .auth-subtitle { font-size:0.85rem; color:var(--clr-text-2); }
        .auth-form { padding:20px 28px; display:flex; flex-direction:column; gap:14px; }
        .auth-field { display:flex; flex-direction:column; gap:6px; }
        .auth-label { display:flex; align-items:center; gap:5px; font-size:0.8rem; font-weight:600; color:var(--clr-text-2); }
        .pw-toggle { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--clr-text-3); background:none; border:none; cursor:pointer; transition:color var(--transition-fast); }
        .pw-toggle:hover { color:var(--clr-text); }
        .auth-error { display:flex; align-items:center; gap:6px; padding:10px 14px; border-radius:var(--radius-md); background:rgba(242,92,110,0.1); border:1px solid rgba(242,92,110,0.25); color:var(--clr-error); font-size:0.82rem; }
        .auth-switch { padding:0 28px 24px; text-align:center; }
        .auth-link { color:var(--clr-accent); font-weight:600; background:none; border:none; cursor:pointer; }
        .auth-link:hover { text-decoration:underline; }
      `}</style>
    </AnimatePresence>
  )
}
