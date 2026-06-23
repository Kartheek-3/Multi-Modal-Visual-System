import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Results from './pages/Results'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import Browse from './pages/Browse'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Background mesh gradient */}
        <div className="bg-mesh" aria-hidden="true" />

        <Navbar />

        <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/results"   element={<Results />} />
            <Route path="/browse"    element={<Browse />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile"   element={<Profile />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="container">
            <p className="text-xs text-3 text-center">
              VisualAI — Multimodal Visual Search Engine · CLIP + FAISS + Gemini
            </p>
          </div>
        </footer>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#f0f2ff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '0.88rem',
          },
          success: { iconTheme: { primary: '#22d3a0', secondary: '#111827' } },
          error:   { iconTheme: { primary: '#f25c6e', secondary: '#111827' } },
        }}
      />

      <style>{`
        .app-footer {
          padding:16px 0;
          border-top:1px solid var(--clr-border);
          position:relative; z-index:1;
        }
      `}</style>
    </BrowserRouter>
  )
}
