import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Search, DollarSign, TrendingUp, TrendingDown,
  RefreshCw, Star, SlidersHorizontal, ChevronDown, ChevronUp,
  Filter, X
} from 'lucide-react'
import { DIVIDEND_STOCKS, SECTORS, FREQS } from '../data/dividendStocks'
import { LYNCH_CATEGORIES, ALL_LYNCH_IDS } from '../utils/peterLynch'
import MetricTooltip from '../components/MetricTooltip'

const API_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'
const METRIC_CACHE_KEY = 'div_metrics_v2'
const CACHE_TTL = 30 * 60 * 1000 // 30 min

// ── Helpers ─────────────────────────────────────────────────────
const FREQ_STYLE = {
  monthly:      { label:'Monthly',     dot:'bg-purple-400', badge:'bg-purple-500/15 text-purple-300 border border-purple-500/30' },
  quarterly:    { label:'Quarterly',   dot:'bg-blue-400',   badge:'bg-blue-500/15 text-blue-300 border border-blue-500/30' },
  'semi-annual':{ label:'Semi-Annual', dot:'bg-yellow-400', badge:'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30' },
  annual:       { label:'Annual',      dot:'bg-orange-400', badge:'bg-orange-500/15 text-orange-300 border border-orange-500/30' },
}

function loadCache() {
  try {
    const c = JSON.parse(localStorage.getItem(METRIC_CACHE_KEY) || 'null')
    if (c && Date.now() - c.ts < CACHE_TTL) return c.data
  } catch {}
  return {}
}
function saveCache(data) {
  try { localStorage.setItem(METRIC_CACHE_KEY, JSON.stringify({ ts: Date.now(), data })) } catch {}
}

// ── Hooks ────────────────────────────────────────────────────────
function useDivMetrics(symbols) {
  const [metrics, setMetrics] = useState(loadCache)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const abortRef = useRef(false)

  const fetchAll = useCallback(async (force = false) => {
    const cached = loadCache()
    const missing = force
      ? symbols
      : symbols.filter(s => !(s in cached))

    if (!missing.length) {
      setMetrics(cached)
      return
    }

    abortRef.current = false
    setLoading(true)
    const results = { ...loadCache() }
    const CONC = 6
    const DELAY = 1100

    for (let i = 0; i < missing.length; i += CONC) {
      if (abortRef.current) break
      const chunk = missing.slice(i, i + CONC)
      await Promise.all(chunk.map(async (symbol) => {
        try {
          const [qRes, mRes] = await Promise.all([
            fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`),
            fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`)
          ])
          const q = await qRes.json()
          const m = await mRes.json()
          const mt = m.metric || {}
          results[symbol] = {
            price:     q.c   || null,
            change:    q.d   || null,
            changePct: q.dp  || null,
            yield:     mt.dividendYieldIndicatedAnnual || mt.currentDividendYieldTTM || null,
            annual:    mt.dividendIndicatedAnnual || mt.dividendPerShareAnnual || null,
            growth5y:  mt.dividendGrowthRate5Y || null,
          }
          setMetrics(prev => ({ ...prev, [symbol]: results[symbol] }))
        } catch {}
      }))
      setProgress(Math.round(Math.min(i + CONC, missing.length) / missing.length * 100))
      if (i + CONC < missing.length) await new Promise(r => setTimeout(r, DELAY))
    }

    saveCache(results)
    setLoading(false)
    setProgress(100)
    return () => { abortRef.current = true }
  }, [symbols.join(',')])

  useEffect(() => { fetchAll() }, [])

  return { metrics, loading, progress, refetch: () => fetchAll(true) }
}

// ── Row Component ────────────────────────────────────────────────
function DividendRow({ stock, metric, starred, onStar, onClick, lynchCat }) {
  const isUp = (metric?.change ?? 0) >= 0
  const fs = FREQ_STYLE[stock.freq] || FREQ_STYLE.quarterly
  const yieldVal = metric?.yield
  const lc = lynchCat ? LYNCH_CATEGORIES[lynchCat] : null

  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors group"
    >
      {/* Star */}
      <td className="pl-4 pr-2 py-3 w-8">
        <button
          onClick={e => { e.stopPropagation(); onStar(stock.symbol) }}
          className={`transition-colors ${starred ? 'text-yellow-400' : 'text-gray-600 group-hover:text-gray-400'}`}
        >
          <Star size={14} fill={starred ? 'currentColor' : 'none'} />
        </button>
      </td>
      {/* Symbol */}
      <td className="px-3 py-3 min-w-[90px]">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-sm">{stock.symbol}</span>
          {lc && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${lc.badge}`}>{lc.emoji}</span>}
        </div>
        <div className="text-xs text-gray-500 truncate max-w-[140px]">{stock.name}</div>
      </td>
      {/* Sector */}
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="text-xs text-gray-400">{stock.sector}</span>
      </td>
      {/* Freq */}
      <td className="px-3 py-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${fs.badge}`}>
          {fs.label}
        </span>
      </td>
      {/* Price */}
      <td className="px-3 py-3 text-right">
        <span className="text-white font-semibold text-sm">
          {metric?.price ? `$${metric.price.toFixed(2)}` : '—'}
        </span>
      </td>
      {/* Change */}
      <td className="px-3 py-3 text-right hidden sm:table-cell">
        <span className={`text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {metric?.changePct != null ? `${isUp ? '+' : ''}${metric.changePct.toFixed(2)}%` : '—'}
        </span>
      </td>
      {/* Annual Div */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm font-semibold text-white">
          {metric?.annual ? `$${metric.annual.toFixed(2)}` : '—'}
        </span>
      </td>
      {/* Yield */}
      <td className="px-3 py-3 text-right pr-4">
        <span className={`text-sm font-bold ${
          yieldVal >= 5 ? 'text-green-300'
          : yieldVal >= 3 ? 'text-green-400'
          : yieldVal >= 1 ? 'text-yellow-400'
          : 'text-gray-400'
        }`}>
          {yieldVal ? `${yieldVal.toFixed(2)}%` : '—'}
        </span>
      </td>
    </tr>
  )
}

// ── Card Component (mobile) ───────────────────────────────────────
function DividendCard({ stock, metric, starred, onStar, onClick }) {
  const isUp = (metric?.change ?? 0) >= 0
  const fs = FREQ_STYLE[stock.freq] || FREQ_STYLE.quarterly
  return (
    <div onClick={onClick} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-500 cursor-pointer transition-all">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{stock.symbol}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${fs.badge}`}>{fs.label}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{stock.name}</div>
        </div>
        <button onClick={e => { e.stopPropagation(); onStar(stock.symbol) }} className={`${starred ? 'text-yellow-400' : 'text-gray-600'}`}>
          <Star size={16} fill={starred ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="flex items-end justify-between mt-3">
        <div>
          <div className="text-xl font-bold">{metric?.price ? `$${metric.price.toFixed(2)}` : '—'}</div>
          <div className={`text-xs font-medium mt-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {metric?.changePct != null ? `${isUp ? '+' : ''}${metric.changePct.toFixed(2)}%` : ''}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Annual Div</div>
          <div className="font-bold text-sm">{metric?.annual ? `$${metric.annual.toFixed(2)}` : '—'}</div>
          <div className={`text-sm font-bold ${metric?.yield >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
            {metric?.yield ? `${metric.yield.toFixed(2)}%` : '—'} yield
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function DividendPage() {
  const navigate = useNavigate()

  const [search, setSearch]           = useState('')
  const [freqFilter, setFreqFilter]     = useState('all')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [lynchFilter, setLynchFilter]   = useState('all')
  const [sortBy, setSortBy]           = useState('yield')
  const [sortDir, setSortDir]         = useState('desc')
  const [viewMode, setViewMode]       = useState('table')
  const [yieldMin, setYieldMin]       = useState(0)
  const [priceMin, setPriceMin]       = useState('')
  const [priceMax, setPriceMax]       = useState('')
  const [pricePreset, setPricePreset] = useState('')
  const [showFilters, setShowFilters]   = useState(false)

  const PRICE_PRESETS = [
    { id: '0-10',    label: 'Under $10', min: 0,   max: 10   },
    { id: '10-50',   label: '$10–50',    min: 10,  max: 50   },
    { id: '50-100',  label: '$50–100',   min: 50,  max: 100  },
    { id: '100-200', label: '$100–200',  min: 100, max: 200  },
    { id: '200-500', label: '$200–500',  min: 200, max: 500  },
    { id: '500+',    label: 'Over $500', min: 500, max: null },
  ]
  const setPreset = (p) => {
    if (pricePreset === p.id) { setPricePreset(''); setPriceMin(''); setPriceMax('') }
    else { setPricePreset(p.id); setPriceMin(p.min.toString()); setPriceMax(p.max !== null ? p.max.toString() : '') }
  }
  const clearPrice = () => { setPriceMin(''); setPriceMax(''); setPricePreset('') }

  const lynchMap = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('lynch_classify_v1') || '{}') } catch { return {} }
  }, [])
  const [starred, setStarred]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('starred') || '[]') } catch { return [] }
  })

  const symbols = useMemo(() => [...new Set(DIVIDEND_STOCKS.map(s => s.symbol))], [])
  const { metrics, loading, progress, refetch } = useDivMetrics(symbols)

  const toggleStar = (symbol) => {
    setStarred(prev => {
      const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
      localStorage.setItem('starred', JSON.stringify(next))
      return next
    })
  }

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    const seen = new Set()
    return DIVIDEND_STOCKS
      .filter(s => {
        if (seen.has(s.symbol)) return false
        seen.add(s.symbol)
        if (freqFilter !== 'all' && s.freq !== freqFilter) return false
        if (sectorFilter !== 'all' && s.sector !== sectorFilter) return false
        if (lynchFilter !== 'all' && lynchMap[s.symbol] !== lynchFilter) return false
        const q = search.toLowerCase()
        if (q && !s.symbol.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false
        const m = metrics[s.symbol]
        if (yieldMin > 0 && (!m?.yield || m.yield < yieldMin)) return false
        const mn = priceMin !== '' ? parseFloat(priceMin) : null
        const mx = priceMax !== '' ? parseFloat(priceMax) : null
        if (mn !== null || mx !== null) {
          const p = m?.price
          if (!p) return false
          if (mn !== null && p < mn) return false
          if (mx !== null && p > mx) return false
        }
        return true
      })
      .sort((a, b) => {
        const ma = metrics[a.symbol]
        const mb = metrics[b.symbol]
        let va, vb
        if (sortBy === 'yield')  { va = ma?.yield  ?? -1; vb = mb?.yield  ?? -1 }
        if (sortBy === 'annual') { va = ma?.annual  ?? -1; vb = mb?.annual ?? -1 }
        if (sortBy === 'price')  { va = ma?.price   ?? -1; vb = mb?.price  ?? -1 }
        if (sortBy === 'change') { va = ma?.changePct ?? -999; vb = mb?.changePct ?? -999 }
        return sortDir === 'desc' ? vb - va : va - vb
      })
  }, [search, freqFilter, sectorFilter, lynchFilter, sortBy, sortDir, yieldMin, priceMin, priceMax, metrics, lynchMap])

  // Stats summary
  const loaded = DIVIDEND_STOCKS.filter(s => metrics[s.symbol]?.yield).length
  const avgYield = loaded
    ? (DIVIDEND_STOCKS.reduce((acc, s) => acc + (metrics[s.symbol]?.yield || 0), 0) / loaded).toFixed(2)
    : '—'

  const SortBtn = ({ col, label }) => (
    <button
      onClick={() => handleSort(col)}
      className={`flex items-center gap-0.5 hover:text-white transition-colors ${sortBy === col ? 'text-blue-400' : 'text-gray-400'}`}
    >
      {label}
      {sortBy === col ? (sortDir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>) : null}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors p-1">
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <DollarSign className="text-green-400" size={22} />
            <h1 className="text-xl font-bold">US Dividend Stocks</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {loading && (
              <span className="text-xs text-blue-400 animate-pulse hidden sm:block">
                Loading {progress}%
              </span>
            )}
            <button onClick={refetch} disabled={loading} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {loading && (
          <div className="h-0.5 bg-gray-700">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5">

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Stocks',  value: DIVIDEND_STOCKS.length,                        color: 'text-white'      },
            { label: 'Data Loaded',   value: `${loaded}/${DIVIDEND_STOCKS.length}`,          color: 'text-blue-400'   },
            { label: 'Avg Yield',     value: avgYield !== '—' ? `${avgYield}%` : '—',        color: 'text-green-400'  },
            { label: 'Showing',       value: filtered.length,                                color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา symbol หรือชื่อบริษัท..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'}`}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>

          {/* View mode */}
          <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-xs">
            <button onClick={() => setViewMode('table')} className={`px-3 py-2 transition-colors ${viewMode === 'table' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}>Table</button>
            <button onClick={() => setViewMode('card')}  className={`px-3 py-2 transition-colors ${viewMode === 'card'  ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}>Cards</button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 mb-4 space-y-4">
            {/* Frequency */}
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Frequency</p>
              <div className="flex flex-wrap gap-2">
                {['all','monthly','quarterly','semi-annual','annual'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFreqFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      freqFilter === f
                        ? f === 'all' ? 'bg-blue-600 text-white'
                          : `${FREQ_STYLE[f]?.badge} border font-bold`
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {f === 'all' ? 'All' : FREQ_STYLE[f]?.label}
                    {f !== 'all' && (
                      <span className="ml-1 opacity-70">
                        ({DIVIDEND_STOCKS.filter(s => s.freq === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sector */}
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Sector</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSectorFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sectorFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>All</button>
                {SECTORS.map(s => (
                  <button key={s} onClick={() => setSectorFilter(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sectorFilter === s ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Price Range</p>
              <div className="flex flex-wrap gap-2 items-center">
                {PRICE_PRESETS.map(p => (
                  <button key={p.id} onClick={() => setPreset(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${pricePreset === p.id ? 'bg-teal-600 border-teal-500 text-white' : 'bg-gray-700 border-transparent text-gray-300 hover:bg-gray-600'}`}>
                    {p.label}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-gray-500 text-xs">$</span>
                  <input type="number" min="0" value={priceMin} onChange={e => { setPriceMin(e.target.value); setPricePreset('') }} placeholder="Min"
                    className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-400 placeholder-gray-500" />
                  <span className="text-gray-500 text-xs">—</span>
                  <span className="text-gray-500 text-xs">$</span>
                  <input type="number" min="0" value={priceMax} onChange={e => { setPriceMax(e.target.value); setPricePreset('') }} placeholder="Max"
                    className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-400 placeholder-gray-500" />
                  {(priceMin !== '' || priceMax !== '') && (
                    <button onClick={clearPrice} className="text-gray-500 hover:text-white ml-1"><X size={13} /></button>
                  )}
                </div>
              </div>
            </div>

            {/* Peter Lynch */}
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Peter Lynch Category</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setLynchFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${lynchFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>All</button>
                {ALL_LYNCH_IDS.map(id => {
                  const cat = LYNCH_CATEGORIES[id]
                  return (
                    <button key={id} onClick={() => setLynchFilter(id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${lynchFilter === id ? cat.badge : 'bg-gray-700 border-transparent text-gray-300 hover:bg-gray-600'}`}>
                      {cat.emoji} {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Min Yield */}
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Min Yield: <span className="text-white">{yieldMin}%</span></p>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 8].map(v => (
                  <button key={v} onClick={() => setYieldMin(v)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${yieldMin === v ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    {v === 0 ? 'Any' : `≥${v}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Frequency quick tabs */}
        {!showFilters && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all','monthly','quarterly','semi-annual','annual'].map(f => {
              const fs = FREQ_STYLE[f]
              const active = freqFilter === f
              return (
                <button
                  key={f}
                  onClick={() => setFreqFilter(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    active
                      ? f === 'all' ? 'bg-blue-600 border-blue-500 text-white'
                        : `${fs?.badge}`
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {f !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${fs?.dot}`} />}
                  {f === 'all' ? 'All Dividends' : fs?.label}
                </button>
              )
            })}
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {viewMode === 'table' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-700/40">
                    <th className="pl-4 pr-2 py-3 w-8" />
                    <th className="px-3 py-3 text-left text-xs text-gray-400 font-medium">Symbol</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-400 font-medium hidden md:table-cell">Sector</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-400 font-medium">Frequency<MetricTooltip id="freq" /></th>
                    <th className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end">
                        <SortBtn col="price" label="Price" />
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right hidden sm:table-cell">
                      <div className="flex items-center justify-end">
                        <SortBtn col="change" label="Change" />
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end">
                        <SortBtn col="annual" label="Annual Div" />
                        <MetricTooltip id="annual" />
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right pr-4">
                      <div className="flex items-center justify-end">
                        <SortBtn col="yield" label="Yield" />
                        <MetricTooltip id="yield" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-500">ไม่พบหุ้นตามเงื่อนไขที่กำหนด</td></tr>
                  ) : (
                    filtered.map(stock => (
                      <DividendRow
                        key={stock.symbol}
                        stock={stock}
                        metric={metrics[stock.symbol]}
                        starred={starred.includes(stock.symbol)}
                        onStar={toggleStar}
                        onClick={() => navigate(`/stock/${stock.symbol}`)}
                        lynchCat={lynchMap[stock.symbol]}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500 text-right">
                {filtered.length} stocks • ราคาและ yield อัปเดตจาก Finnhub
              </div>
            )}
          </div>
        )}

        {/* ── CARD VIEW ── */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">ไม่พบหุ้นตามเงื่อนไขที่กำหนด</div>
            ) : (
              filtered.map(stock => (
                <DividendCard
                  key={stock.symbol}
                  stock={stock}
                  metric={metrics[stock.symbol]}
                  starred={starred.includes(stock.symbol)}
                  onStar={toggleStar}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                />
              ))
            )}
          </div>
        )}

      </main>
    </div>
  )
}
