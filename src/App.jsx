import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Search, TrendingUp, TrendingDown, Wifi, WifiOff, X, BarChart2, ChevronUp, ChevronDown, RefreshCw, DollarSign, LayoutGrid } from 'lucide-react'
import { SP500 } from './sp500'
import { classify, LYNCH_CATEGORIES, ALL_LYNCH_IDS } from './utils/peterLynch'

// ─── Dividend frequency detection (shared helper) ────────────────
function detectFreq(dividends) {
  if (!dividends || dividends.length < 2) return null
  const sorted = [...dividends].sort((a, b) => new Date(b.ex_date) - new Date(a.ex_date))
  const gaps = []
  for (let i = 0; i < Math.min(sorted.length - 1, 4); i++) {
    const diff = (new Date(sorted[i].ex_date) - new Date(sorted[i + 1].ex_date)) / 86400000
    gaps.push(diff)
  }
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length
  if (avg < 45)  return 'monthly'
  if (avg < 120) return 'quarterly'
  if (avg < 270) return 'semi-annual'
  return 'annual'
}

// ─── Fetch + cache dividend frequencies for watchlist ─────────────
const DIV_CACHE_KEY = 'div_freq_cache'

function useDividendFreqs(symbols) {
  const [freqs, setFreqs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DIV_CACHE_KEY) || '{}') } catch { return {} }
  })

  useEffect(() => {
    const missing = symbols.filter(s => !(s in freqs))
    if (!missing.length) return
    // fetch one at a time to avoid rate limit
    let idx = 0
    const fetchNext = async () => {
      if (idx >= missing.length) return
      const s = missing[idx++]
      try {
        const res  = await fetch(`https://api.twelvedata.com/dividends?symbol=${s}&range=2y&apikey=demo`)
        const data = await res.json()
        const freq = detectFreq(data.dividends || [])
        const latest = data.dividends?.[0]
        setFreqs(prev => {
          const next = { ...prev, [s]: { freq, amount: latest?.amount ?? null, exDate: latest?.ex_date ?? null } }
          try { localStorage.setItem(DIV_CACHE_KEY, JSON.stringify(next)) } catch {}
          return next
        })
      } catch {}
      setTimeout(fetchNext, 800)
    }
    fetchNext()
  }, [symbols.join(',')])

  return freqs
}

const API_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'
const WS_URL  = `wss://ws.finnhub.io?token=${API_KEY}`
const LYNCH_CACHE_KEY = 'lynch_classify_v1'

// ─── Peter Lynch classification hook ─────────────────────────────
function useLynchClassify(symbols) {
  const [lynchMap, setLynchMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LYNCH_CACHE_KEY) || '{}') } catch { return {} }
  })

  useEffect(() => {
    const missing = symbols.filter(s => !(s in lynchMap))
    if (!missing.length) return
    let idx = 0
    const next = async () => {
      if (idx >= missing.length) return
      const sym = missing[idx++]
      try {
        const [mRes, pRes] = await Promise.all([
          fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${sym}&metric=all&token=${API_KEY}`),
          fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${sym}&token=${API_KEY}`),
        ])
        const metric  = (await mRes.json()).metric || {}
        const profile = await pRes.json()
        const cat = classify(metric, profile.finnhubIndustry || '', profile)
        setLynchMap(prev => {
          const updated = { ...prev, [sym]: cat }
          try { localStorage.setItem(LYNCH_CACHE_KEY, JSON.stringify(updated)) } catch {}
          return updated
        })
      } catch {}
      setTimeout(next, 900)
    }
    next()
  }, [symbols.join(',')])

  return lynchMap
}

const DEFAULT_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD']

const POPULAR_STOCKS = [
  'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','AMD',
  'NFLX','DIS','BABA','UBER','LYFT','SNAP','TWTR','INTC',
  'PYPL','SQ','SHOP','CRM','ORCL','IBM','CSCO','QCOM',
  'BRKB','JPM','BAC','WFC','GS','MS','V','MA',
]

function useFinnhubWS(symbols) {
  const [prices, setPrices] = useState({})
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const symbolsRef = useRef(symbols)

  useEffect(() => {
    symbolsRef.current = symbols
  }, [symbols])

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      symbolsRef.current.forEach(s => ws.send(JSON.stringify({ type: 'subscribe', symbol: s })))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'trade' && data.data) {
        setPrices(prev => {
          const next = { ...prev }
          data.data.forEach(trade => {
            const prev_price = next[trade.s]?.price
            next[trade.s] = {
              price: trade.p,
              prev: prev_price || trade.p,
              volume: trade.v,
              timestamp: trade.t,
            }
          })
          return next
        })
      }
    }

    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    return () => ws.close()
  }, [])

  const subscribe = useCallback((symbol) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', symbol }))
    }
  }, [])

  const unsubscribe = useCallback((symbol) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbol }))
    }
  }, [])

  return { prices, connected, subscribe, unsubscribe }
}

function useQuotes(symbols) {
  const [quotes, setQuotes] = useState({})

  useEffect(() => {
    if (!symbols.length) return
    symbols.forEach(async (symbol) => {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
        )
        const data = await res.json()
        setQuotes(prev => ({
          ...prev,
          [symbol]: {
            price: data.c,
            open: data.o,
            high: data.h,
            low: data.l,
            prevClose: data.pc,
            change: data.d,
            changePct: data.dp,
          }
        }))
      } catch {}
    })
  }, [symbols.join(',')])

  return quotes
}

const FREQ_COLORS = {
  monthly:      'bg-purple-500/20 text-purple-300 border-purple-500/30',
  quarterly:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'semi-annual':'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  annual:       'bg-orange-500/20 text-orange-300 border-orange-500/30',
}
const FREQ_SHORT = { monthly: 'Mo', quarterly: 'Q', 'semi-annual': 'SA', annual: 'Ann' }

// ── Skeleton Card ─────────────────────────────────────────────────
function SkeletonCard({ symbol, inWatchlist, starred, onToggleStar, onToggleWatchlist, onNavigate }) {
  return (
    <div
      className={`relative bg-gray-800 rounded-xl p-4 border cursor-pointer transition-all ${
        inWatchlist ? 'border-blue-600/60' : 'border-gray-700'
      }`}
      onClick={onNavigate}
    >
      <button
        onClick={e => { e.stopPropagation(); onToggleWatchlist(symbol) }}
        className={`absolute top-2 right-2 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
          inWatchlist ? 'text-blue-400 hover:text-red-400' : 'text-gray-600 hover:text-blue-400'
        }`}
      >
        {inWatchlist ? '−' : '+'}
      </button>

      <div className="flex items-start justify-between mb-3 pr-5">
        <span className="font-bold text-white text-lg">{symbol}</span>
        <button onClick={e => { e.stopPropagation(); onToggleStar(symbol) }}
          className={`transition-colors ${starred ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}>
          <Star size={16} fill={starred ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Shimmer blocks */}
      <div className="space-y-2 animate-pulse">
        <div className="h-7 w-24 bg-gray-700 rounded-md" />
        <div className="h-4 w-32 bg-gray-700/70 rounded-md" />
        <div className="flex gap-2 mt-2">
          <div className="h-3 w-12 bg-gray-700/50 rounded" />
          <div className="h-3 w-12 bg-gray-700/50 rounded" />
        </div>
      </div>
    </div>
  )
}

// ── StockCard ─────────────────────────────────────────────────────
function StockCard({ symbol, wsPrice, quote, sp500Quote, starred, inWatchlist, onToggleStar, onToggleWatchlist, onNavigate, divInfo, lynchCat }) {
  const price     = wsPrice?.price || quote?.price || sp500Quote?.price
  const prevClose = quote?.prevClose || sp500Quote?.prevClose
  const change    = price && prevClose ? price - prevClose : quote?.change ?? sp500Quote?.change
  const changePct = price && prevClose ? ((price - prevClose) / prevClose) * 100 : quote?.changePct ?? sp500Quote?.changePct
  const isUp  = (change ?? 0) >= 0
  const flash = wsPrice?.price && wsPrice?.prev && wsPrice.price !== wsPrice.prev
    ? wsPrice.price > wsPrice.prev ? 'flash-green' : 'flash-red' : ''

  return (
    <div
      className={`relative bg-gray-800 rounded-xl p-4 border cursor-pointer transition-all ${
        inWatchlist ? 'border-blue-600/60 hover:border-blue-400' : 'border-gray-700 hover:border-gray-500'
      } ${flash}`}
      onClick={onNavigate}
    >
      <button
        onClick={e => { e.stopPropagation(); onToggleWatchlist(symbol) }}
        className={`absolute top-2 right-2 transition-colors text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
          inWatchlist ? 'text-blue-400 hover:text-red-400' : 'text-gray-600 hover:text-blue-400'
        }`}
        title={inWatchlist ? 'ลบออกจาก Watchlist' : 'เพิ่มใน Watchlist'}
      >
        {inWatchlist ? '−' : '+'}
      </button>

      <div className="flex items-start justify-between mb-3 pr-5">
        <div>
          <span className="font-bold text-white text-lg">{symbol}</span>
          {inWatchlist && <span className="ml-1.5 text-[9px] text-blue-400 font-bold">WATCH</span>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleStar(symbol) }}
          className={`transition-colors ${starred ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
        >
          <Star size={16} fill={starred ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="text-2xl font-bold text-white mb-1">
        ${price.toFixed(2)}
      </div>

      <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{change != null ? `${isUp ? '+' : ''}${change.toFixed(2)}` : '—'}</span>
        <span>({changePct != null ? `${isUp ? '+' : ''}${changePct.toFixed(2)}%` : '—'})</span>
      </div>

      {(quote || sp500Quote) && (() => {
        const q = quote || sp500Quote
        return (
          <div className="mt-2 grid grid-cols-2 gap-0.5 text-[10px] text-gray-500">
            <span>H <span className="text-gray-400">${q.high?.toFixed(2) ?? '—'}</span></span>
            <span>L <span className="text-gray-400">${q.low?.toFixed(2) ?? '—'}</span></span>
          </div>
        )
      })()}

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {divInfo?.freq && (
          <>
            <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${FREQ_COLORS[divInfo.freq]}`}>
              <DollarSign size={9} />{FREQ_SHORT[divInfo.freq]}
            </span>
            {divInfo.amount && <span className="text-[10px] text-gray-500">${divInfo.amount?.toFixed(2)}</span>}
          </>
        )}
        {lynchCat && LYNCH_CATEGORIES[lynchCat] && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${LYNCH_CATEGORIES[lynchCat].badge}`}>
            {LYNCH_CATEGORIES[lynchCat].emoji} {LYNCH_CATEGORIES[lynchCat].label}
          </span>
        )}
      </div>
    </div>
  )
}

// ---------- S&P 500 Quotes via Finnhub (throttled + cached) ----------
const CACHE_KEY = 'sp500_cache'
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function useSP500Quotes() {
  const [sp500Quotes, setSp500Quotes] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
    } catch {}
    return {}
  })
  const [progress, setProgress] = useState(0)   // 0-100
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.ts < CACHE_TTL) return new Date(cached.ts)
    } catch {}
    return null
  })
  const abortRef = useRef(false)

  const fetchAll = useCallback(async () => {
    abortRef.current = false
    setLoading(true)
    setProgress(0)

    const results = {}
    const CONCURRENCY = 8        // parallel requests per batch
    const DELAY_MS   = 1100      // ~54 req/min safely under 60

    for (let i = 0; i < SP500.length; i += CONCURRENCY) {
      if (abortRef.current) break
      const chunk = SP500.slice(i, i + CONCURRENCY)
      await Promise.all(
        chunk.map(async (symbol) => {
          try {
            const res = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
            )
            const data = await res.json()
            if (data.c) {
              results[symbol] = {
                price: data.c,
                change: data.d,
                changePct: data.dp,
                prevClose: data.pc,
              }
              setSp500Quotes(prev => ({ ...prev, [symbol]: results[symbol] }))
            }
          } catch {}
        })
      )
      const done = Math.min(i + CONCURRENCY, SP500.length)
      setProgress(Math.round((done / SP500.length) * 100))
      if (i + CONCURRENCY < SP500.length) {
        await new Promise(r => setTimeout(r, DELAY_MS))
      }
    }

    const now = new Date()
    setLastUpdated(now)
    setLoading(false)
    setProgress(100)
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now.getTime(), data: results }))
    } catch {}
  }, [])

  useEffect(() => {
    // Auto-fetch if no valid cache
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (!cached || Date.now() - cached.ts >= CACHE_TTL) fetchAll()
    } catch { fetchAll() }
    return () => { abortRef.current = true }
  }, [])

  return { sp500Quotes, loading, progress, lastUpdated, refetch: fetchAll }
}

// ---------- Top Movers Panel ----------
function TopMoversPanel({ sp500Quotes, loading, progress, lastUpdated, refetch, onClose }) {
  const [sortBy, setSortBy] = useState('pct')
  const [topN, setTopN] = useState(10)

  const data = Object.entries(sp500Quotes)
    .map(([symbol, q]) => ({ symbol, ...q }))
    .filter(d => d.change != null && d.changePct != null)

  const sorted = [...data].sort((a, b) =>
    sortBy === 'pct' ? Math.abs(b.changePct) - Math.abs(a.changePct)
                     : Math.abs(b.change) - Math.abs(a.change)
  )

  const topGainers = sorted.filter(d => d.change > 0).slice(0, topN)
  const topLosers  = sorted.filter(d => d.change < 0).slice(0, topN)

  const MoverRow = ({ item, rank }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-700/60 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-gray-600 text-xs w-5 shrink-0">{rank}</span>
        <span className="font-bold text-white text-sm">{item.symbol}</span>
        <span className="text-gray-400 text-xs truncate">${item.price?.toFixed(2)}</span>
      </div>
      <div className={`text-right text-xs font-semibold shrink-0 ml-2 ${item.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
        <div className="text-sm">{item.change > 0 ? '+' : ''}{item.changePct?.toFixed(2)}%</div>
        <div>{item.change > 0 ? '+' : ''}${item.change?.toFixed(2)}</div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <BarChart2 className="text-blue-400 shrink-0" size={20} />
            <h2 className="font-bold text-lg shrink-0">Top Movers — S&amp;P 500</h2>
            {loading
              ? <span className="text-xs text-blue-400 animate-pulse shrink-0">{progress}% ({Object.keys(sp500Quotes).length}/{SP500.length})</span>
              : lastUpdated && <span className="text-xs text-gray-500 truncate">cache {lastUpdated.toLocaleTimeString('th-TH')}</span>
            }
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} disabled={loading} className="p-1.5 text-gray-400 hover:text-white transition-colors disabled:opacity-40" title="รีเฟรช">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {loading && (
          <div className="h-1 bg-gray-700 shrink-0">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700 shrink-0">
          <div className="flex bg-gray-700 rounded-lg p-0.5 text-xs">
            <button onClick={() => setSortBy('pct')} className={`px-3 py-1 rounded-md transition-colors ${sortBy === 'pct' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>% Change</button>
            <button onClick={() => setSortBy('value')} className={`px-3 py-1 rounded-md transition-colors ${sortBy === 'value' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>$ Value</button>
          </div>
          <div className="flex bg-gray-700 rounded-lg p-0.5 text-xs ml-auto">
            {[5, 10, 20].map(n => (
              <button key={n} onClick={() => setTopN(n)} className={`px-3 py-1 rounded-md transition-colors ${topN === n ? 'bg-gray-500 text-white' : 'text-gray-400 hover:text-white'}`}>Top {n}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 divide-x divide-gray-700 overflow-y-auto flex-1">
          {/* Gainers */}
          <div className="px-4 pt-3 pb-4">
            <div className="flex items-center gap-1 mb-2 sticky top-0 bg-gray-800 py-1">
              <ChevronUp className="text-green-400" size={16} />
              <span className="text-green-400 font-semibold text-sm">Top Gainers</span>
              <span className="text-gray-500 text-xs ml-1">({topGainers.length})</span>
            </div>
            {loading && <p className="text-gray-500 text-xs py-4 text-center">กำลังโหลด {SP500.length} หุ้น...</p>}
            {!loading && topGainers.length === 0 && <p className="text-gray-500 text-xs">ไม่มีข้อมูล</p>}
            {topGainers.map((item, i) => <MoverRow key={item.symbol} item={item} rank={i + 1} />)}
          </div>
          {/* Losers */}
          <div className="px-4 pt-3 pb-4">
            <div className="flex items-center gap-1 mb-2 sticky top-0 bg-gray-800 py-1">
              <ChevronDown className="text-red-400" size={16} />
              <span className="text-red-400 font-semibold text-sm">Top Losers</span>
              <span className="text-gray-500 text-xs ml-1">({topLosers.length})</span>
            </div>
            {loading && <p className="text-gray-500 text-xs py-4 text-center">กำลังโหลด {SP500.length} หุ้น...</p>}
            {!loading && topLosers.length === 0 && <p className="text-gray-500 text-xs">ไม่มีข้อมูล</p>}
            {topLosers.map((item, i) => <MoverRow key={item.symbol} item={item} rank={i + 1} />)}
          </div>
        </div>

        <div className="px-5 py-3 text-xs text-gray-500 text-center border-t border-gray-700 shrink-0">
          ข้อมูลจาก S&amp;P 500 ทั้งหมด {Object.keys(sp500Quotes).length} หุ้น • เทียบกับ Previous Close
        </div>
      </div>
    </div>
  )
}

// ---------- Main App ----------
export default function App() {
  const navigate = useNavigate()
  const [stocks, setStocks] = useState(() => {
    const saved = localStorage.getItem('stocks')
    return saved ? JSON.parse(saved) : DEFAULT_STOCKS
  })
  const [starred, setStarred] = useState(() => {
    const saved = localStorage.getItem('starred')
    return saved ? JSON.parse(saved) : []
  })
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [filter, setFilter]       = useState('all')
  const [priceMin, setPriceMin]   = useState('')
  const [priceMax, setPriceMax]   = useState('')
  const [pricePreset, setPricePreset] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [showMovers, setShowMovers] = useState(false)

  const { prices, connected, subscribe, unsubscribe } = useFinnhubWS(stocks)
  const quotes = useQuotes(stocks)
  const { sp500Quotes, loading: sp500Loading, progress, lastUpdated, refetch } = useSP500Quotes()
  const divFreqs  = useDividendFreqs(stocks)
  const lynchMap  = useLynchClassify(stocks)

  // Save to localStorage
  useEffect(() => { localStorage.setItem('stocks', JSON.stringify(stocks)) }, [stocks])
  useEffect(() => { localStorage.setItem('starred', JSON.stringify(starred)) }, [starred])

  // Search stocks
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const timeout = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/search?q=${search}&token=${API_KEY}`
        )
        const data = await res.json()
        const upper = search.trim().toUpperCase()
        const all = (data.result || []).filter(r => !r.symbol.includes('.'))
        // แยก exact match ออกมาก่อนเสมอ
        const exact   = all.filter(r => r.symbol === upper)
        const others  = all
          .filter(r => r.symbol !== upper && ['Common Stock','Stock'].includes(r.type))
          .slice(0, 10)
        setSearchResults([...exact, ...others])
      } catch {}
      setSearchLoading(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search])

  const addStock = (symbol) => {
    if (!stocks.includes(symbol)) {
      setStocks(prev => [...prev, symbol])
      subscribe(symbol)
    }
    setSearch('')
    setSearchResults([])
  }

  const toggleWatchlist = (symbol) => {
    if (stocks.includes(symbol)) {
      setStocks(prev => prev.filter(s => s !== symbol))
      unsubscribe(symbol)
    } else {
      setStocks(prev => [...prev, symbol])
      subscribe(symbol)
    }
  }

  const toggleStar = (symbol) => {
    setStarred(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    )
  }

  const DIV_FILTERS = ['monthly', 'quarterly', 'semi-annual', 'annual']

  // All available symbols = S&P500 union watchlist
  const allSymbols = [...new Set([...SP500, ...stocks])]

  // get best price: realtime WS > REST quote > sp500 cache
  const getPrice = (s) =>
    prices[s]?.price || quotes[s]?.price || sp500Quotes[s]?.price || null

  const applyFilters = (list) => {
    let result = list

    // category filter
    if (filter === 'watchlist') result = result.filter(s => stocks.includes(s))
    else if (filter === 'starred') result = result.filter(s => starred.includes(s))
    else if (DIV_FILTERS.includes(filter)) result = result.filter(s => divFreqs[s]?.freq === filter)
    else if (ALL_LYNCH_IDS.includes(filter)) result = result.filter(s => lynchMap[s] === filter)

    // price filter
    const mn = priceMin !== '' ? parseFloat(priceMin) : null
    const mx = priceMax !== '' ? parseFloat(priceMax) : null
    if (mn !== null || mx !== null) {
      result = result.filter(s => {
        const p = getPrice(s)
        if (!p) return false
        if (mn !== null && p < mn) return false
        if (mx !== null && p > mx) return false
        return true
      })
    }

    return result
  }

  const displayStocks = applyFilters(allSymbols)

  const PRICE_PRESETS = [
    { id: '0-10',    label: 'Under $10',   min: 0,    max: 10   },
    { id: '10-50',   label: '$10–50',       min: 10,   max: 50   },
    { id: '50-100',  label: '$50–100',      min: 50,   max: 100  },
    { id: '100-200', label: '$100–200',     min: 100,  max: 200  },
    { id: '200-500', label: '$200–500',     min: 200,  max: 500  },
    { id: '500+',    label: 'Over $500',    min: 500,  max: null },
  ]

  const setPreset = (preset) => {
    if (pricePreset === preset.id) {
      setPricePreset(''); setPriceMin(''); setPriceMax('')
    } else {
      setPricePreset(preset.id)
      setPriceMin(preset.min.toString())
      setPriceMax(preset.max !== null ? preset.max.toString() : '')
    }
  }

  const clearPrice = () => { setPriceMin(''); setPriceMax(''); setPricePreset('') }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-400" size={24} />
            <h1 className="text-xl font-bold">US Stock Tracker</h1>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาหุ้น เช่น AAPL, TSLA..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-500"
            />
            {/* Dropdown */}
            {search.trim().length > 0 && (searchResults.length > 0 || searchLoading || /^[A-Za-z]{1,5}$/.test(search.trim())) && (
              <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
                {searchLoading && (
                  <div className="px-4 py-3 text-sm text-gray-400">กำลังค้นหา...</div>
                )}
                {/* Exact-symbol shortcut — แสดงเสมอถ้าพิมพ์เหมือน ticker */}
                {!searchLoading && /^[A-Za-z]{1,5}$/.test(search.trim()) &&
                  !searchResults.find(r => r.symbol === search.trim().toUpperCase()) && (
                  <button
                    onClick={() => addStock(search.trim().toUpperCase())}
                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-900/30 hover:bg-blue-900/50 border-b border-gray-700 transition-colors text-left"
                  >
                    <div>
                      <div className="font-bold text-blue-300">{search.trim().toUpperCase()}</div>
                      <div className="text-xs text-gray-500">เพิ่ม symbol นี้ตรงๆ</div>
                    </div>
                    <span className="text-xs text-blue-400 ml-2">+ Add directly</span>
                  </button>
                )}
                {searchResults.map(r => (
                  <button
                    key={r.symbol}
                    onClick={() => addStock(r.symbol)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                  >
                    <div>
                      <div className="font-semibold text-white">{r.symbol}</div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">{r.description}</div>
                    </div>
                    <span className="text-xs text-blue-400 ml-2">+ Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Dividend Page */}
            <button
              onClick={() => navigate('/dividends')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <DollarSign size={14} />
              <span className="hidden sm:inline">Dividends</span>
            </button>
            {/* Top Movers Button */}
            <button
              onClick={() => setShowMovers(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <BarChart2 size={14} />
              <span className="hidden sm:inline">Top Movers</span>
            </button>

            {/* Connection status */}
            <div className={`flex items-center gap-1 text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{connected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Loading progress bar — ติดใต้ header */}
      {sp500Loading && (
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-blue-400 shrink-0 font-medium tabular-nums">
              {Object.keys(sp500Quotes).length} / {SP500.length} หุ้น ({progress}%)
            </span>
          </div>
        </div>
      )}

      {/* Top Movers Modal */}
      {showMovers && (
        <TopMoversPanel
          sp500Quotes={sp500Quotes}
          loading={sp500Loading}
          progress={progress}
          lastUpdated={lastUpdated}
          refetch={refetch}
          onClose={() => setShowMovers(false)}
        />
      )}

      {/* Filter tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-5 pb-2 space-y-2">
        {/* Row 1: All / Watchlist / Starred / Dividend */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            S&amp;P 500 ({SP500.length})
          </button>
          <button onClick={() => setFilter('watchlist')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === 'watchlist' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            📋 Watchlist ({stocks.length})
          </button>
          <button onClick={() => setFilter('starred')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === 'starred' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            <Star size={11} fill={filter === 'starred' ? 'currentColor' : 'none'} /> ดาว ({starred.length})
          </button>
          <div className="w-px bg-gray-700 self-stretch" />
          {[
            { id: 'monthly',     label: 'Monthly',     color: 'bg-purple-600' },
            { id: 'quarterly',   label: 'Quarterly',   color: 'bg-blue-600'   },
            { id: 'semi-annual', label: 'Semi-Annual', color: 'bg-yellow-500 text-gray-900' },
            { id: 'annual',      label: 'Annual',      color: 'bg-orange-500' },
          ].map(f => {
            const count = stocks.filter(s => divFreqs[s]?.freq === f.id).length
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f.id ? `${f.color} text-white` : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                <DollarSign size={10} /> {f.label} ({count})
              </button>
            )
          })}
        </div>
        {/* Row 2: Peter Lynch */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-gray-500 font-medium">Peter Lynch:</span>
          {ALL_LYNCH_IDS.map(id => {
            const cat   = LYNCH_CATEGORIES[id]
            const count = stocks.filter(s => lynchMap[s] === id).length
            return (
              <button key={id} onClick={() => setFilter(id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filter === id
                    ? `${cat.badge} font-bold`
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}>
                {cat.emoji} {cat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Row 3: Price Range */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-gray-500 font-medium">Price:</span>
          {PRICE_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                pricePreset === p.id
                  ? 'bg-teal-600 border-teal-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {p.label}
            </button>
          ))}
          {/* Custom range inputs */}
          <div className="flex items-center gap-1 ml-1">
            <span className="text-gray-600 text-xs">$</span>
            <input
              type="number"
              min="0"
              value={priceMin}
              onChange={e => { setPriceMin(e.target.value); setPricePreset('') }}
              placeholder="Min"
              className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-400 placeholder-gray-600"
            />
            <span className="text-gray-600 text-xs">—</span>
            <span className="text-gray-600 text-xs">$</span>
            <input
              type="number"
              min="0"
              value={priceMax}
              onChange={e => { setPriceMax(e.target.value); setPricePreset('') }}
              placeholder="Max"
              className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-400 placeholder-gray-600"
            />
            {(priceMin !== '' || priceMax !== '') && (
              <button onClick={clearPrice} className="text-gray-500 hover:text-white transition-colors ml-1">
                <X size={13} />
              </button>
            )}
          </div>
          {/* Active filter badge */}
          {(priceMin !== '' || priceMax !== '') && (
            <span className="text-[10px] text-teal-400 bg-teal-900/30 border border-teal-700/40 rounded-full px-2 py-0.5">
              {displayStocks.length} หุ้น
            </span>
          )}
        </div>
      </div>

      {/* Stock Grid */}
      <main className="max-w-7xl mx-auto px-4 py-4 pb-10">
        {/* Loading overlay */}
        {sp500Loading && displayStocks.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p>กำลังโหลด S&P 500... {progress}%</p>
          </div>
        )}

        {!sp500Loading && displayStocks.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            {filter === 'starred'    ? '⭐ ยังไม่มีหุ้นที่ติดดาว'
           : filter === 'watchlist'  ? '📋 ยังไม่มีหุ้นใน Watchlist — กด + ที่การ์ดได้เลย'
           : 'ไม่พบหุ้นตามเงื่อนไข'}
          </div>
        )}

        {displayStocks.length > 0 && (
          <>
            <p className="text-xs text-gray-500 mb-3">
              แสดง {displayStocks.length} หุ้น
              {sp500Loading && (
                <span className="ml-2 text-blue-400">
                  · โหลดแล้ว {Object.keys(sp500Quotes).length}/{SP500.length}
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {displayStocks.map(symbol => {
                const hasData = !!(prices[symbol]?.price || quotes[symbol]?.price || sp500Quotes[symbol]?.price)
                const commonProps = {
                  key: symbol,
                  symbol,
                  starred: starred.includes(symbol),
                  inWatchlist: stocks.includes(symbol),
                  onToggleStar: toggleStar,
                  onToggleWatchlist: toggleWatchlist,
                  onNavigate: () => navigate(`/stock/${symbol}`),
                }
                return hasData ? (
                  <StockCard
                    {...commonProps}
                    wsPrice={prices[symbol]}
                    quote={quotes[symbol]}
                    sp500Quote={sp500Quotes[symbol]}
                    divInfo={divFreqs[symbol]}
                    lynchCat={lynchMap[symbol]}
                  />
                ) : (
                  <SkeletonCard {...commonProps} />
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
