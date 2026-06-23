import { motion } from 'framer-motion'
import { Filter, X, SlidersHorizontal } from 'lucide-react'

const CATEGORIES = [
  { id: null,          label: 'All',         emoji: '🔍' },
  { id: 'shoes',       label: 'Shoes',       emoji: '👟' },
  { id: 'watches',     label: 'Watches',     emoji: '⌚' },
  { id: 'bags',        label: 'Bags',        emoji: '👜' },
  { id: 'shirts',      label: 'Shirts',      emoji: '👕' },
  { id: 'electronics', label: 'Electronics', emoji: '💻' },
  { id: 'sports',      label: 'Sports',      emoji: '⚽' },
  { id: 'other',       label: 'Other',       emoji: '📦' },
]

const SORT_OPTIONS = [
  { id: 'similarity',    label: 'Most Similar' },
  { id: 'newest',        label: 'Newest' },
  { id: 'highest_rated', label: 'Highest Rated' },
  { id: 'most_viewed',   label: 'Most Viewed' },
]

export default function FilterPanel({ category, sort, onCategory, onSort, resultCount }) {
  return (
    <div className="filter-panel">
      <div className="filter-header">
        <div className="section-title"><SlidersHorizontal size={13}/> Filters</div>
        {(category || sort !== 'similarity') && (
          <button
            className="btn-icon"
            style={{ width: 24, height: 24 }}
            onClick={() => { onCategory(null); onSort('similarity') }}
            title="Clear filters"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {resultCount != null && (
        <p className="filter-count text-xs text-3">{resultCount} results</p>
      )}

      <div className="filter-section">
        <p className="filter-label">Category</p>
        {CATEGORIES.map((c) => (
          <motion.button
            key={String(c.id)}
            className={`filter-btn ${category === c.id ? 'active' : ''}`}
            onClick={() => onCategory(c.id)}
            whileTap={{ scale: 0.96 }}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="filter-section">
        <p className="filter-label">Sort By</p>
        {SORT_OPTIONS.map((s) => (
          <motion.button
            key={s.id}
            className={`filter-btn ${sort === s.id ? 'active' : ''}`}
            onClick={() => onSort(s.id)}
            whileTap={{ scale: 0.96 }}
          >
            {s.label}
          </motion.button>
        ))}
      </div>

      <style>{`
        .filter-panel { display: flex; flex-direction: column; gap: 6px; }
        .filter-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .filter-count { margin-bottom: 6px; }
        .filter-section { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
        .filter-label { font-size: 0.72rem; font-weight: 700; color: var(--clr-text-3); text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 8px; }
        .filter-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: var(--radius-sm);
          font-size: 0.83rem; color: var(--clr-text-2);
          cursor: pointer; transition: all var(--transition-fast); text-align: left; width: 100%;
        }
        .filter-btn:hover { background: var(--clr-surface-2); color: var(--clr-text); }
        .filter-btn.active { background: rgba(124,92,250,0.14); color: var(--clr-accent); font-weight: 600; }
      `}</style>
    </div>
  )
}
