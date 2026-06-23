import { create } from 'zustand'
import axios from 'axios'

const api = axios.create({ baseURL: '/' })

export const useSearchStore = create((set, get) => ({
  // State
  query: '',
  queryImage: null,
  queryImagePreview: null,
  results: [],
  isLoading: false,
  error: null,
  searchType: 'text',        // text | image | hybrid | nlp | rag | voice | camera
  category: null,
  sort: 'similarity',
  topK: 20,
  ragExplanation: null,
  responseTime: null,

  // Actions
  setQuery: (q) => set({ query: q }),
  setCategory: (c) => set({ category: c }),
  setSort: (s) => set({ sort: s }),
  setSearchType: (t) => set({ searchType: t }),
  setQueryImage: (file, preview) => set({ queryImage: file, queryImagePreview: preview }),
  clearImage: () => set({ queryImage: null, queryImagePreview: null }),
  clearResults: () => set({ results: [], error: null, ragExplanation: null }),

  searchText: async (q, category) => {
    set({ isLoading: true, error: null, searchType: 'text' })
    try {
      const { data } = await api.get('/search/text', { params: { q, top_k: get().topK, category } })
      set({ results: data.results, responseTime: data.response_time_ms, isLoading: false, query: q })
    } catch (e) {
      set({ error: e.response?.data?.detail || 'Search failed', isLoading: false })
    }
  },

  searchImage: async (file, category) => {
    set({ isLoading: true, error: null, searchType: 'image' })
    const form = new FormData()
    form.append('file', file)
    form.append('top_k', get().topK)
    if (category) form.append('category', category)
    try {
      const { data } = await api.post('/search/image', form)
      set({ results: data.results, responseTime: data.response_time_ms, isLoading: false })
    } catch (e) {
      set({ error: e.response?.data?.detail || 'Search failed', isLoading: false })
    }
  },

  searchHybrid: async (file, text, alpha = 0.5, category) => {
    set({ isLoading: true, error: null, searchType: 'hybrid' })
    const form = new FormData()
    form.append('file', file)
    form.append('text', text)
    form.append('alpha', alpha)
    form.append('top_k', get().topK)
    if (category) form.append('category', category)
    try {
      const { data } = await api.post('/search/hybrid', form)
      set({ results: data.results, responseTime: data.response_time_ms, isLoading: false })
    } catch (e) {
      set({ error: e.response?.data?.detail || 'Search failed', isLoading: false })
    }
  },

  searchNLP: async (q) => {
    set({ isLoading: true, error: null, searchType: 'nlp', query: q })
    try {
      const { data } = await api.get('/search/nlp', { params: { q, top_k: get().topK } })
      set({ results: data.results, responseTime: data.response_time_ms, isLoading: false })
    } catch (e) {
      set({ error: e.response?.data?.detail || 'NLP search failed', isLoading: false })
    }
  },

  searchRAG: async (q) => {
    set({ isLoading: true, error: null, searchType: 'rag', query: q })
    try {
      const { data } = await api.get('/search/rag', { params: { q, top_k: 8 } })
      set({ results: data.results, ragExplanation: data.explanation, responseTime: data.response_time_ms, isLoading: false })
    } catch (e) {
      set({ error: e.response?.data?.detail || 'RAG search failed', isLoading: false })
    }
  },
}))
