import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, SlidersHorizontal, Sparkles, ChevronDown, ChevronUp,
  ArrowUpDown, RefreshCw, Filter, X, TrendingUp, TrendingDown,
  Bookmark, RotateCcw, Info, Zap, Shield, DollarSign, Target
} from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { STOCKS_DB } from '../data/stocksDB'
import { SP500 } from '../sp500'

const FINNHUB_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'

// ── Preset Strategy Configs ────────────────────────────────
const PRESETS = [
  {
    id: 'stalwarts',
    label: 'Peter Lynch Stalwarts',
    emoji: '🏛️',
    desc: 'หุ้น Blue-chip ที่เติบโตมั่นคง P/E ไม่แพง จ่ายปันผลสม่ำเสมอ',
    color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
    accent: 'text-blue-400',
    filters: { peMin: 5, peMax: 20, roeMin: 12, divYieldMin: 1.0, deMax: 1.5 },
    icon: Shield
  },
  {
    id: 'high_yield',
    label: 'High Yield Low Debt',
    emoji: '💰',
    desc: 'ปันผลสูง หนี้ต่ำ เน้นกระแสเงินสดมั่นคง',
    color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30',
    accent: 'text-emerald-400',
    filters: { divYieldMin: 2.5, deMax: 0.8, roeMin: 8 },
    icon: DollarSign
  },
  {
    id: 'garp',
    label: 'Growth at Reasonable Price',
    emoji: '🚀',
    desc: 'เติบโตสูงในราคาสมเหตุสมผล (GARP Strategy)',
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
    accent: 'text-violet-400',
    filters: { peMin: 5, peMax: 30, roeMin: 18, divYieldMin: 0 },
    icon: TrendingUp
  },
  {
    id: 'deep_value',
    label: 'Deep Value',
    emoji: '🎯',
    desc: 'หุ้นราคาถูก P/E ต่ำ มูลค่าพื้นฐานสูงกว่าราคาตลาด',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    accent: 'text-amber-400',
    filters: { peMin: 1, peMax: 12, roeMin: 5, deMax: 2.0 },
    icon: Target
  },
]

// ── Sector list from STOCKS_DB ──────────────────────────────
const ALL_SECTORS = [...new Set(STOCKS_DB.map(s => s.sec))].sort()

// ── Market Cap size ─────────────────────────────────────────
const CAP_OPTIONS = [
  { id: 'all', label: 'ทุกขนาด' },
  { id: 'Large', label: 'Large Cap' },
  { id: 'Mid', label: 'Mid Cap' },
  { id: 'Small', label: 'Small Cap' },
]

// ── Default filter state ────────────────────────────────────
const DEFAULT_FILTERS = {
  peMin: '', peMax: '',
  roeMin: '', roeMax: '',
  divYieldMin: '', divYieldMax: '',
  deMin: '', deMax: '',
  sector: 'all',
  cap: 'all',
}

// ── Metric fetch cache ─────────────────────────────────────
const METRIC_CACHE_KEY = 'screener_metrics_v2'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function getCachedMetrics() {
  try {
    const cached = JSON.parse(localStorage.getItem(METRIC_CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
  } catch {}
  return null
}

function setCachedMetrics(data) {
  try {
    localStorage.setItem(METRIC_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {}
}

export default function AdvancedScreener() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [activePreset, setActivePreset] = useState(null)
  const [sortKey, setSortKey] = useState('symbol')
  const [sortDir, setSortDir] = useState('asc')
  const [metrics, setMetrics] = useState(() => getCachedMetrics() || {})
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  const abortRef = useRef(false)

  // ── Fetch fundamental metrics for all SP500 stocks ────────
  const fetchMetrics = useCallback(async () => {
    const cached = getCachedMetrics()
    if (cached && Object.keys(cached).length > 50) {
      setMetrics(cached)
      return
    }

    abortRef.current = false
    setLoading(true)
    setProgress(0)

    const results = { ...metrics }
    const CONCURRENCY = 6
    const DELAY_MS = 1200

    for (let i = 0; i < SP500.length; i += CONCURRENCY) {
      if (abortRef.current) break
      const chunk = SP500.slice(i, i + CONCURRENCY)
      await Promise.all(
        chunk.map(async (symbol) => {
          if (results[symbol]) return // skip already fetched
          try {
            const res = await fetch(
              `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_KEY}`
            )
            const data = await res.json()
            const m = data.metric || {}
            results[symbol] = {
              pe: m.peNormalizedAnnual || m.peBasicExclExtraTTM || null,
              roe: m.roeTTM || m.roeRfy || null,
              divYield: m.currentDividendYieldTTM || m.dividendYieldIndicatedAnnual || null,
              de: m.totalDebtToEquityQuarterly || m.totalDebtToEquityAnnual || null,
              eps: m.epsAnnual || null,
              marketCap: m.marketCapitalization || null,
              beta: m.beta || null,
              pb: m.pbAnnual || null,
              revenueGrowth: m.revenueGrowth5Y || null,
            }
            setMetrics(prev => ({ ...prev, [symbol]: results[symbol] }))
          } catch {}
        })
      )
      const done = Math.min(i + CONCURRENCY, SP500.length)
      setProgress(Math.round((done / SP500.length) * 100))
      if (i + CONCURRENCY < SP500.length) {
        await new Promise(r => setTimeout(r, DELAY_MS))
      }
    }

    setCachedMetrics(results)
    setLoading(false)
    setProgress(100)
  }, [])

  useEffect(() => {
    fetchMetrics()
    return () => { abortRef.current = true }
  }, [fetchMetrics])

  // ── Filter logic ──────────────────────────────────────────
  const filteredStocks = useMemo(() => {
    // Build stock list from SP500 with DB info + metrics
    let stocks = SP500.map(sym => {
      const db = STOCKS_DB.find(s => s.s === sym)
      const m = metrics[sym]
      return {
        symbol: sym,
        name: db?.n || sym,
        sector: db?.sec || 'Other',
        industry: db?.ind || '',
        cap: db?.cap || '',
        pe: m?.pe,
        roe: m?.roe,
        divYield: m?.divYield,
        de: m?.de,
        eps: m?.eps,
        marketCap: m?.marketCap,
        beta: m?.beta,
        pb: m?.pb,
        revenueGrowth: m?.revenueGrowth,
      }
    })

    // Only filter stocks that have metrics loaded
    if (Object.keys(metrics).length > 0) {
      stocks = stocks.filter(s => {
        const m = metrics[s.symbol]
        if (!m) return false

        if (filters.sector !== 'all' && s.sector !== filters.sector) return false
        if (filters.cap !== 'all' && s.cap !== filters.cap) return false
        
        if (filters.peMin !== '' && (m.pe == null || m.pe < Number(filters.peMin))) return false
        if (filters.peMax !== '' && (m.pe == null || m.pe > Number(filters.peMax))) return false
        
        if (filters.roeMin !== '' && (m.roe == null || m.roe < Number(filters.roeMin))) return false
        if (filters.roeMax !== '' && (m.roe == null || m.roe > Number(filters.roeMax))) return false
        
        if (filters.divYieldMin !== '' && (m.divYield == null || m.divYield < Number(filters.divYieldMin))) return false
        if (filters.divYieldMax !== '' && (m.divYield == null || m.divYield > Number(filters.divYieldMax))) return false
        
        if (filters.deMin !== '' && (m.de == null || m.de < Number(filters.deMin))) return false
        if (filters.deMax !== '' && (m.de == null || m.de > Number(filters.deMax))) return false

        return true
      })
    } else {
      // No metrics loaded yet – show all but without filtering
      stocks = stocks.slice(0, 20) // preview while loading
    }

    // Sort
    stocks.sort((a, b) => {
      let va = a[sortKey]
      let vb = b[sortKey]
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })

    return stocks
  }, [metrics, filters, sortKey, sortDir])

  // ── Handlers ─────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setActivePreset(null) // clear preset on manual edit
  }

  const applyPreset = (preset) => {
    setActivePreset(preset.id)
    setFilters({
      ...DEFAULT_FILTERS,
      peMin: preset.filters.peMin ?? '',
      peMax: preset.filters.peMax ?? '',
      roeMin: preset.filters.roeMin ?? '',
      roeMax: preset.filters.roeMax ?? '',
      divYieldMin: preset.filters.divYieldMin ?? '',
      divYieldMax: preset.filters.divYieldMax ?? '',
      deMin: preset.filters.deMin ?? '',
      deMax: preset.filters.deMax ?? '',
    })
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setActivePreset(null)
  }

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ArrowUpDown size={12} className="text-gray-600" />
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-emerald-400" /> : <ChevronDown size={12} className="text-emerald-400" />
  }

  // ── Stats ────────────────────────────────────────────────
  const metricsLoaded = Object.keys(metrics).length
  const totalSP500 = SP500.length

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* ── Header ── */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <SlidersHorizontal size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Screener</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">ตัวกรองขั้นสูง S&P 500 — ค้นหาหุ้นที่ตรงตามเกณฑ์ของคุณ</p>
            </div>
          </div>
        </div>

        {/* ── Loading Progress ── */}
        {loading && (
          <div className="bg-white dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-violet-400" />
                กำลังโหลด Fundamental Metrics...
              </span>
              <span className="text-sm font-mono text-violet-400">{metricsLoaded}/{totalSP500}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Strategy Presets ── */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles size={12} /> กลยุทธ์ยอดนิยม
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map(preset => {
              const Icon = preset.icon
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`group relative text-left p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                    activePreset === preset.id
                      ? `bg-gradient-to-br ${preset.color} border-current shadow-lg`
                      : 'bg-white dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} className={activePreset === preset.id ? preset.accent : 'text-gray-400'} />
                    <span className={`text-sm font-bold ${activePreset === preset.id ? preset.accent : 'text-gray-800 dark:text-gray-200'}`}>
                      {preset.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{preset.desc}</p>
                  {activePreset === preset.id && (
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${preset.accent.replace('text-', 'bg-')} animate-pulse`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Filter Panel ── */}
        <div className="bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
              <Filter size={14} className="text-violet-400" />
              ตัวกรอง
              {Object.values(filters).some((v, i) => v !== Object.values(DEFAULT_FILTERS)[i]) && (
                <span className="bg-violet-500/20 text-violet-400 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
              )}
            </span>
            {showFilters ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showFilters && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              {/* Row 1: P/E & ROE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">P/E Min</label>
                  <input
                    type="number"
                    value={filters.peMin}
                    onChange={e => handleFilterChange('peMin', e.target.value)}
                    placeholder="—"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">P/E Max</label>
                  <input
                    type="number"
                    value={filters.peMax}
                    onChange={e => handleFilterChange('peMax', e.target.value)}
                    placeholder="—"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">ROE Min %</label>
                  <input
                    type="number"
                    value={filters.roeMin}
                    onChange={e => handleFilterChange('roeMin', e.target.value)}
                    placeholder="—"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">ROE Max %</label>
                  <input
                    type="number"
                    value={filters.roeMax}
                    onChange={e => handleFilterChange('roeMax', e.target.value)}
                    placeholder="—"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              </div>

              {/* Row 2: Div Yield & D/E */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">Div Yield Min %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={filters.divYieldMin}
                    onChange={e => handleFilterChange('divYieldMin', e.target.value)}
                    placeholder="—"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">Div Yield Max %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={filters.divYieldMax}
                    onChange={e => handleFilterChange('divYieldMax', e.target.value)}
                    placeholder="—"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">D/E Min</label>
                  <input
                    type="number"
                    step="0.1"
                    value={filters.deMin}
                    onChange={e => handleFilterChange('deMin', e.target.value)}
                    placeholder="—"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">D/E Max</label>
                  <input
                    type="number"
                    step="0.1"
                    value={filters.deMax}
                    onChange={e => handleFilterChange('deMax', e.target.value)}
                    placeholder="—"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              </div>

              {/* Row 3: Sector & Cap */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">Sector</label>
                  <select
                    value={filters.sector}
                    onChange={e => handleFilterChange('sector', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  >
                    <option value="all">ทุก Sector</option>
                    {ALL_SECTORS.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1 block">Market Cap</label>
                  <select
                    value={filters.cap}
                    onChange={e => handleFilterChange('cap', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  >
                    {CAP_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <RotateCcw size={12} /> รีเซ็ตตัวกรอง
                </button>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  พบ <span className="font-bold text-violet-400">{filteredStocks.length}</span> หุ้นที่ตรงเกณฑ์
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Results Table ── */}
        <div className="bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {[
                    { key: 'symbol', label: 'Symbol', w: 'w-28' },
                    { key: 'sector', label: 'Sector', w: 'w-32 hidden sm:table-cell' },
                    { key: 'pe', label: 'P/E', w: 'w-20' },
                    { key: 'roe', label: 'ROE %', w: 'w-20' },
                    { key: 'divYield', label: 'Yield %', w: 'w-20' },
                    { key: 'de', label: 'D/E', w: 'w-20' },
                    { key: 'eps', label: 'EPS', w: 'w-20 hidden lg:table-cell' },
                    { key: 'beta', label: 'Beta', w: 'w-20 hidden lg:table-cell' },
                    { key: 'pb', label: 'P/B', w: 'w-20 hidden xl:table-cell' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={`${col.w} px-4 py-3 text-left text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors select-none`}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <SortIcon k={col.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-gray-500">
                      <Search size={32} className="mx-auto mb-3 text-gray-400" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300">ไม่พบหุ้นที่ตรงเกณฑ์</p>
                      <p className="text-xs mt-1">ลองปรับตัวกรองใหม่ หรือเลือกกลยุทธ์อื่น</p>
                    </td>
                  </tr>
                ) : (
                  filteredStocks.slice(0, 100).map((stock, idx) => (
                    <tr
                      key={stock.symbol}
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono w-5">{idx + 1}</span>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">{stock.symbol}</span>
                            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{stock.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{stock.sector}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${stock.pe != null && stock.pe < 15 ? 'text-emerald-500' : stock.pe != null && stock.pe > 30 ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {stock.pe != null ? stock.pe.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${stock.roe != null && stock.roe > 15 ? 'text-emerald-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {stock.roe != null ? stock.roe.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${stock.divYield != null && stock.divYield > 2 ? 'text-emerald-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {stock.divYield != null ? stock.divYield.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${stock.de != null && stock.de > 2 ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {stock.de != null ? stock.de.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-gray-700 dark:text-gray-300">{stock.eps != null ? `$${stock.eps.toFixed(2)}` : '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-gray-700 dark:text-gray-300">{stock.beta != null ? stock.beta.toFixed(2) : '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-gray-700 dark:text-gray-300">{stock.pb != null ? stock.pb.toFixed(2) : '—'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {filteredStocks.length > 100 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 text-center">
              แสดง 100 จาก {filteredStocks.length} รายการ — กรุณาปรับตัวกรองเพื่อจำกัดผลลัพธ์
            </div>
          )}
        </div>

        {/* ── Disclaimer ── */}
        <div className="flex items-start gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] text-gray-500">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>ข้อมูล Fundamental Metrics จาก Finnhub API อาจมีความล่าช้า ตัวกรองขั้นสูงเป็นเครื่องมือสำหรับการศึกษา ไม่ใช่คำแนะนำการลงทุน</span>
        </div>

      </div>
    </PageTransition>
  )
}
