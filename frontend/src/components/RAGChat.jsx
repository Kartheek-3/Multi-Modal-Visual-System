import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, X, Loader, Sparkles, MessageSquare } from 'lucide-react'
import axios from 'axios'

const SUGGESTIONS = [
  'Find me black running shoes',
  'Show similar blue bags',
  'What watches are popular?',
  'Find casual shirts and explain why',
]

export default function RAGChat({ open, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return

    setInput('')
    setMessages(m => [...m, { role: 'user', content: q }])
    setLoading(true)

    try {
      const { data } = await axios.get('/search/rag', { params: { q, top_k: 6 } })
      const botMsg = {
        role: 'assistant',
        content: data.explanation,
        results: data.results?.slice(0, 4) ?? [],
      }
      setMessages(m => [...m, botMsg])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <motion.div
      className="rag-panel"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      {/* Header */}
      <div className="rag-header">
        <div className="flex items-center gap-sm">
          <div className="rag-icon"><Bot size={16} /></div>
          <div>
            <div className="font-bold text-sm">RAG Search Assistant</div>
            <div className="text-xs text-3">AI-powered visual search with explanations</div>
          </div>
        </div>
        <button className="btn-icon" onClick={onClose}><X size={15} /></button>
      </div>

      {/* Messages */}
      <div className="rag-messages">
        {messages.length === 0 && (
          <div className="rag-welcome">
            <Sparkles size={28} style={{ color: 'var(--clr-accent)', margin: '0 auto 8px' }} />
            <p className="font-semibold" style={{ textAlign: 'center' }}>Ask me anything about images</p>
            <p className="text-sm text-3" style={{ textAlign: 'center' }}>I'll find results and explain why they match.</p>
            <div className="rag-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className={`rag-msg ${msg.role}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {msg.role === 'assistant' && (
              <div className="rag-msg-icon"><Bot size={13} /></div>
            )}
            <div className="rag-msg-body">
              <p className="text-sm" style={{ lineHeight: 1.6 }}>{msg.content}</p>
              {msg.results && msg.results.length > 0 && (
                <div className="rag-results-grid">
                  {msg.results.map((r, ri) => (
                    <div key={ri} className="rag-result-thumb">
                      <img
                        src={r.url}
                        alt={r.title || r.filename}
                        onError={e => e.target.style.display = 'none'}
                      />
                      <div className="rag-result-score">{r.score_percent ?? Math.round((r.score ?? 0) * 100)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="rag-msg assistant">
            <div className="rag-msg-icon"><Bot size={13} /></div>
            <div className="rag-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="rag-input-area">
        <input
          className="input"
          placeholder="Ask about images e.g. 'Find black shoes and explain'…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{ flexShrink: 0, padding: '10px 16px' }}
        >
          {loading ? <Loader size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={15} />}
        </button>
      </div>

      <style>{`
        .rag-panel {
          position: fixed; right: 0; top: 64px; bottom: 0;
          width: 380px; max-width: 100vw;
          background: #0d1120; border-left: 1px solid var(--clr-border-2);
          display: flex; flex-direction: column; z-index: 80;
          box-shadow: -8px 0 32px rgba(0,0,0,0.4);
        }
        .rag-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid var(--clr-border); flex-shrink: 0;
        }
        .rag-icon {
          width: 32px; height: 32px; border-radius: var(--radius-sm);
          background: rgba(124,92,250,0.15); border: 1px solid rgba(124,92,250,0.3);
          display: flex; align-items: center; justify-content: center; color: var(--clr-accent);
        }
        .rag-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .rag-welcome { display: flex; flex-direction: column; gap: 10px; padding: 20px 0; }
        .rag-suggestions { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
        .suggestion-chip {
          padding: 8px 14px; border-radius: var(--radius-md);
          background: var(--clr-surface); border: 1px solid var(--clr-border);
          font-size: 0.82rem; color: var(--clr-text-2); cursor: pointer;
          transition: all var(--transition-fast); text-align: left;
        }
        .suggestion-chip:hover { border-color: var(--clr-accent); color: var(--clr-accent); }
        .rag-msg { display: flex; gap: 8px; align-items: flex-start; }
        .rag-msg.user { flex-direction: row-reverse; }
        .rag-msg-icon { width: 26px; height: 26px; border-radius: 50%; background: rgba(124,92,250,0.15); border: 1px solid rgba(124,92,250,0.25); display: flex; align-items: center; justify-content: center; color: var(--clr-accent); flex-shrink: 0; margin-top: 2px; }
        .rag-msg-body { max-width: 85%; display: flex; flex-direction: column; gap: 8px; }
        .rag-msg.user .rag-msg-body { background: rgba(124,92,250,0.12); border: 1px solid rgba(124,92,250,0.2); border-radius: var(--radius-md); padding: 10px 14px; }
        .rag-msg.assistant .rag-msg-body { background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-md); padding: 10px 14px; }
        .rag-results-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 4px; }
        .rag-result-thumb { position: relative; aspect-ratio: 1; border-radius: var(--radius-sm); overflow: hidden; background: var(--clr-surface-2); }
        .rag-result-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .rag-result-score { position: absolute; bottom: 4px; right: 4px; background: rgba(8,11,20,0.8); color: var(--clr-success); font-size: 0.65rem; font-weight: 700; padding: 1px 5px; border-radius: var(--radius-full); }
        .rag-typing { display: flex; align-items: center; gap: 4px; padding: 10px 14px; background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-md); }
        .rag-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--clr-accent); animation: typingBounce 1.2s ease-in-out infinite; }
        .rag-typing span:nth-child(2) { animation-delay: 0.2s; }
        .rag-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce { 0%,80%,100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-5px); opacity: 1; } }
        .rag-input-area { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid var(--clr-border); flex-shrink: 0; }
      `}</style>
    </motion.div>
  )
}
