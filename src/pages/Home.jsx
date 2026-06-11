import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ChevronUp, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { STOCKS_DB, SECTORS } from '../data/stocksDB'
import PageTransition from '../components/PageTransition'

const API_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'
const PRICE_CACHE_KEY = 'home_price_cache_v1'
const CACHE_TTL = 5 * 60 * 1000  // 5 min

// ── cap badge ──────────────────────────────────────────────────────
const CAP_STYLE = {
  Large: 'bg-emerald-900/30 text-emerald-300',
  Mid:   'bg-teal-900/30 text-teal-300',
  Small: 'bg-gray-700 text-gray-400',
}

// ── price/metric cache (session) ──────────────────────────────────
function loadPriceCache() {
  try {
    const c = JSON.parse(localStorage.getItem(PRICE_CACHE_KEY) || '{}')
    const now = Date.now()
    // return only fresh entries
    return Object.fromEntries(
      Object.entries(c).filter(([, v]) => now - v.ts < CACHE_TTL)
    )
  } catch { return {} }
}
function savePriceCache(cache) {
  try { localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cache)) } catch {}
}

// ── lazy price fetcher (fetches symbols on demand) ─────────────────
function useLazyPrices(symbols) {
  const [data, setData]     = useState(loadPriceCache)
  const queueRef            = useRef([])
  const timerRef            = useRef(null)
  const cacheRef            = useRef(data)
  cacheRef.current = data

  const fetchBatch = useCallback(async () => {
    const batch = queueRef.current.splice(0, 8)
    if (!batch.length) return
    await Promise.all(batch.map(async sym => {
      if (cacheRef.current[sym]) return   // already have fresh data
      try {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${API_KEY}`)
        const d = await r.json()
        if (d.c) {
          setData(prev => {
            const next = { ...prev, [sym]: { price: d.c, change: d.d, changePct: d.dp, high: d.h, low: d.l, ts: Date.now() } }
            savePriceCache(next)
            return next
          })
        }
      } catch {}
    }))
    if (queueRef.current.length) {
      timerRef.current = setTimeout(fetchBatch, 1100)  // ~55 req/min
    }
  }, [])

  const enqueue = useCallback((syms) => {
    const fresh = cacheRef.current
    const needed = syms.filter(s => !fresh[s])
    if (!needed.length) return
    // deduplicate
    const inQ = new Set(queueRef.current)
    needed.forEach(s => { if (!inQ.has(s)) queueRef.current.push(s) })
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => { timerRef.current = null; fetchBatch() }, 100)
    }
  }, [fetchBatch])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return { data, enqueue }
}

// ── Row ───────────────────────────────────────────────────────────
function StockRow({ stock, priceData, starred, onStar, onClick }) {
  const { s, n, e, sec, ind, cap } = stock
  const isUp = (priceData?.change ?? 0) >= 0

  return (
    <tr
      onClick={onClick}
      className="border-b cursor-pointer transition-all group"
      style={{ borderColor: 'var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.06)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
    >
      {/* Star */}
      <td className="pl-3 pr-1 py-3 w-8">
        <button onClick={ev => { ev.stopPropagation(); onStar(s) }}
          className={`transition-colors ${starred ? 'text-yellow-500' : 'opacity-30 group-hover:opacity-60'}`}
          style={{ color: starred ? undefined : 'var(--text-primary)' }}>
          <Star size={13} fill={starred ? 'currentColor' : 'none'} />
        </button>
      </td>
      {/* Symbol + Name */}
      <td className="px-3 py-3 min-w-[130px]">
        <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{s}</div>
        <div className="text-[11px] truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>{n}</div>
      </td>
      {/* Exchange */}
      <td className="px-3 py-3 hidden lg:table-cell">
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{e}</span>
      </td>
      {/* Sector */}
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sec}</span>
      </td>
      {/* Industry */}
      <td className="px-3 py-3 hidden xl:table-cell">
        <span className="text-xs truncate max-w-[160px] block" style={{ color: 'var(--text-muted)' }}>{ind}</span>
      </td>
    </tr>
  )
}

// ── Main ──────────────────────────────────────────────────────────
const PAGE_SIZE = 50

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch]       = useState('')
  const [sector, setSector]       = useState('All')
  const [cap, setCap]             = useState('All')
  const [exchange, setExchange]   = useState('All')
  const [sortCol, setSortCol]     = useState('s')
  const [sortDir, setSortDir]     = useState('asc')
  const [page, setPage]           = useState(0)
  const [showFilter, setShowFilter] = useState(false)
  const [starred, setStarred]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('starred') || '[]') } catch { return [] }
  })

  const { data: prices, enqueue } = useLazyPrices([])

  // Filtered + sorted
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return STOCKS_DB
      .filter(st => {
        if (sector   !== 'All' && st.sec !== sector)   return false
        if (cap      !== 'All' && st.cap !== cap)       return false
        if (exchange !== 'All' && st.e   !== exchange)  return false
        if (q && !st.s.toLowerCase().includes(q) && !st.n.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        let va, vb
        if (sortCol === 's')     { va = a.s;   vb = b.s }
        else if (sortCol === 'n'){ va = a.n;   vb = b.n }
        else if (sortCol === 'p'){ va = prices[a.s]?.price ?? -1; vb = prices[b.s]?.price ?? -1 }
        else if (sortCol === 'c'){ va = prices[a.s]?.changePct ?? -999; vb = prices[b.s]?.changePct ?? -999 }
        else { va = a[sortCol] ?? ''; vb = b[sortCol] ?? '' }
        if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
        return sortDir === 'asc' ? va - vb : vb - va
      })
  }, [search, sector, cap, exchange, sortCol, sortDir, prices])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const visible    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page on filter change
  useEffect(() => setPage(0), [search, sector, cap, exchange])

  // Enqueue prices for visible rows
  useEffect(() => {
    enqueue(visible.map(s => s.s))
  }, [visible.map(s => s.s).join(','), enqueue])

  const sort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const toggleStar = (sym) => {
    setStarred(prev => {
      const next = prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
      localStorage.setItem('starred', JSON.stringify(next))
      return next
    })
  }

  const SortIcon = ({ col }) => sortCol !== col ? null
    : sortDir === 'asc' ? <ChevronUp size={11} className="inline ml-0.5" />
                        : <ChevronDown size={11} className="inline ml-0.5" />


  return (
    <PageTransition className="max-w-screen-xl mx-auto px-3 py-5">

      {/* ── Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden mb-6 p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.25) 0%, rgba(16,185,129,0.15) 60%, rgba(52,211,153,0.1) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 60%), radial-gradient(circle at 80% 20%, #34d399 0%, transparent 50%)' }}/>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
            US Markets
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">
            <span className="gradient-text">หุ้นอเมริกา</span> ครบทุกตัว
          </h1>
          <p className="text-gray-400 text-sm">เริ่มต้นลงทุนวันนี้ · {STOCKS_DB.length} หุ้น · กดเพื่อดูรายละเอียดและกราฟ</p>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="text-xs text-gray-500">{filtered.length} หุ้น</p>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา symbol หรือชื่อบริษัท..."
            className="w-full rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder-gray-600"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#f1f1f5' }}
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={13}/></button>}
        </div>

        <button onClick={() => setShowFilter(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all ${showFilter ? 'text-white border-emerald-500/50' : 'text-gray-400 hover:text-white hover:border-emerald-500/30'}`}
          style={{ backgroundColor: showFilter ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)', borderColor: showFilter ? undefined : 'var(--border)' }}>
          <SlidersHorizontal size={14} /> Filter
        </button>
      </div>

      {/* ── Filters ── */}
      {showFilter && (
        <div className="rounded-xl p-4 mb-4 space-y-3" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sector */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Sector</p>
              <div className="flex flex-wrap gap-1.5">
                {['All', ...SECTORS].map(s => (
                  <button key={s} onClick={() => setSector(s)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${sector === s ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
                    style={sector === s ? { background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' } : { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {/* Market Cap */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Market Cap</p>
              <div className="flex flex-wrap gap-1.5">
                {['All','Large','Mid','Small'].map(c => (
                  <button key={c} onClick={() => setCap(c)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${cap === c ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
                    style={cap === c ? { background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' } : { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    {c === 'All' ? 'All' : `${c} Cap`}
                  </button>
                ))}
              </div>
            </div>
            {/* Exchange */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Exchange</p>
              <div className="flex flex-wrap gap-1.5">
                {['All','NYSE','NASDAQ'].map(ex => (
                  <button key={ex} onClick={() => setExchange(ex)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${exchange === ex ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
                    style={exchange === ex ? { background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' } : { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs border-b" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <th className="pl-3 pr-1 py-3 w-8" />
                <th className="px-3 py-3 text-left cursor-pointer hover:text-white" onClick={() => sort('s')}>
                  Symbol / Name <SortIcon col="s" />
                </th>
                <th className="px-3 py-3 text-left hidden lg:table-cell">Exchange</th>
                <th className="px-3 py-3 text-left cursor-pointer hover:text-white hidden md:table-cell" onClick={() => sort('sec')}>
                  Sector <SortIcon col="sec" />
                </th>
                <th className="px-3 py-3 text-left hidden xl:table-cell">Industry</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-500">ไม่พบหุ้น</td></tr>
              ) : visible.map(stock => (
                <StockRow
                  key={stock.s}
                  stock={stock}
                  priceData={prices[stock.s]}
                  starred={starred.includes(stock.s)}
                  onStar={toggleStar}
                  onClick={() => navigate(`/stock/${stock.s}`)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs text-gray-500">
              หน้า {page + 1} / {totalPages} ({filtered.length} หุ้น)
            </span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(0)}
                className="px-2 py-1 text-xs rounded text-gray-400 hover:text-white disabled:opacity-40 transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>«</button>
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs rounded text-gray-400 hover:text-white disabled:opacity-40 transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>‹ Prev</button>
              {(() => {
                const SHOW = 5
                const start = Math.max(0, Math.min(page - Math.floor(SHOW / 2), totalPages - SHOW))
                const end   = Math.min(totalPages - 1, start + SHOW - 1)
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`px-3 py-1 text-xs rounded transition-all font-medium ${pg === page ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    style={pg === page ? { background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 0 12px rgba(16,185,129,0.3)' } : { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    {pg + 1}
                  </button>
                ))
              })()}
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs rounded text-gray-400 hover:text-white disabled:opacity-40 transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>Next ›</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}
                className="px-2 py-1 text-xs rounded text-gray-400 hover:text-white disabled:opacity-40 transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>»</button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
