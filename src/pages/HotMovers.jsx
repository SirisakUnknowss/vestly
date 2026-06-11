import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, ChevronUp, ChevronDown, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { SP500 } from '../sp500'
import PageTransition from '../components/PageTransition'

const API_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'
const CACHE_KEY = 'sp500_cache'
const CACHE_TTL = 10 * 60 * 1000

function loadCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (c && Date.now() - c.ts < CACHE_TTL) return { data: c.data, fresh: true }
  } catch {}
  return { data: {}, fresh: false }
}

export default function HotMovers() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState(() => loadCache().data)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [topN, setTopN] = useState(20)
  const [sortBy, setSortBy] = useState('pct')
  const abortRef = useRef(false)

  const fetch500 = useCallback(async () => {
    abortRef.current = false
    setLoading(true); setProgress(0)
    const results = {}
    const CONC = 8, DELAY = 1100
    for (let i = 0; i < SP500.length; i += CONC) {
      if (abortRef.current) break
      const chunk = SP500.slice(i, i + CONC)
      await Promise.all(chunk.map(async sym => {
        try {
          const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${API_KEY}`)
          const d = await r.json()
          if (d.c) results[sym] = { price: d.c, change: d.d, changePct: d.dp, prevClose: d.pc }
          setQuotes(p => ({ ...p, [sym]: results[sym] || p[sym] }))
        } catch {}
      }))
      setProgress(Math.round(Math.min(i + CONC, SP500.length) / SP500.length * 100))
      if (i + CONC < SP500.length) await new Promise(r => setTimeout(r, DELAY))
    }
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: results })) } catch {}
    setLoading(false); setProgress(100)
  }, [])

  useEffect(() => {
    const { fresh } = loadCache()
    if (!fresh) fetch500()
    return () => { abortRef.current = true }
  }, [])

  const data = Object.entries(quotes)
    .map(([s, q]) => ({ s, ...q }))
    .filter(d => d.change != null && d.changePct != null)
    .sort((a, b) => sortBy === 'pct'
      ? Math.abs(b.changePct) - Math.abs(a.changePct)
      : Math.abs(b.change) - Math.abs(a.change))

  const gainers = data.filter(d => d.change > 0).slice(0, topN)
  const losers  = data.filter(d => d.change < 0).slice(0, topN)

  const Row = ({ item, rank }) => {
    const isUp = item.change > 0
    return (
      <div onClick={() => navigate(`/stock/${item.s}`)}
        className="flex items-center justify-between py-2.5 border-b border-gray-700/40 last:border-0 hover:bg-gray-700/20 cursor-pointer rounded px-2 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-gray-600 text-xs w-5 shrink-0 tabular-nums">{rank}</span>
          <div>
            <div className="font-bold text-white text-sm">{item.s}</div>
            <div className="text-xs text-gray-500">${item.price?.toFixed(2)}</div>
          </div>
        </div>
        <div className={`text-right shrink-0 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          <div className="text-sm font-bold">{isUp ? '+' : ''}{item.changePct?.toFixed(2)}%</div>
          <div className="text-xs">{isUp ? '+' : ''}${item.change?.toFixed(2)}</div>
        </div>
      </div>
    )
  }

  return (
    <PageTransition className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="text-orange-400" size={22}/>
        <h1 className="text-xl font-bold">Hot Movers — S&P 500</h1>
        {loading && <span className="text-xs text-blue-400 animate-pulse">{progress}% ({Object.keys(quotes).length}/{SP500.length})</span>}
      </div>
      <p className="text-sm text-gray-400 mb-4">หุ้นที่เคลื่อนไหวมากที่สุดในวันนี้ เทียบกับ Previous Close</p>

      {/* Progress */}
      {loading && (
        <div className="h-1 bg-gray-700 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex bg-gray-800 rounded-lg p-0.5 text-xs border border-gray-700">
          <button onClick={() => setSortBy('pct')} className={`px-3 py-1.5 rounded-md transition-colors ${sortBy === 'pct' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>% Change</button>
          <button onClick={() => setSortBy('val')} className={`px-3 py-1.5 rounded-md transition-colors ${sortBy === 'val' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>$ Value</button>
        </div>
        <div className="flex bg-gray-800 rounded-lg p-0.5 text-xs border border-gray-700">
          {[10, 20, 30].map(n => (
            <button key={n} onClick={() => setTopN(n)} className={`px-3 py-1.5 rounded-md transition-colors ${topN === n ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}>Top {n}</button>
          ))}
        </div>
        <button onClick={fetch500} disabled={loading} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-white disabled:opacity-40 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gainers */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-green-900/20">
            <ChevronUp className="text-green-400" size={18}/>
            <span className="font-bold text-green-400">Top Gainers</span>
            <span className="text-gray-500 text-xs ml-auto">{gainers.length} หุ้น</span>
          </div>
          <div className="px-2 py-1">
            {loading && gainers.length === 0
              ? <p className="text-gray-500 text-xs py-6 text-center">กำลังโหลด...</p>
              : gainers.map((item, i) => <Row key={item.s} item={item} rank={i + 1} />)
            }
          </div>
        </div>
        {/* Losers */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-red-900/20">
            <ChevronDown className="text-red-400" size={18}/>
            <span className="font-bold text-red-400">Top Losers</span>
            <span className="text-gray-500 text-xs ml-auto">{losers.length} หุ้น</span>
          </div>
          <div className="px-2 py-1">
            {loading && losers.length === 0
              ? <p className="text-gray-500 text-xs py-6 text-center">กำลังโหลด...</p>
              : losers.map((item, i) => <Row key={item.s} item={item} rank={i + 1} />)
            }
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
