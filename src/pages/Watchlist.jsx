import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Wifi, WifiOff, TrendingUp, TrendingDown, X, Plus } from 'lucide-react'

const API_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'
const WS_URL  = `wss://ws.finnhub.io?token=${API_KEY}`
const DEFAULT = ['AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','JPM']

function useWS(symbols) {
  const [prices, setPrices] = useState({})
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const symRef = useRef(symbols)
  useEffect(() => { symRef.current = symbols }, [symbols])

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    ws.onopen = () => {
      setConnected(true)
      symRef.current.forEach(s => ws.send(JSON.stringify({ type: 'subscribe', symbol: s })))
    }
    ws.onmessage = e => {
      const d = JSON.parse(e.data)
      if (d.type === 'trade' && d.data) {
        setPrices(prev => {
          const next = { ...prev }
          d.data.forEach(t => {
            next[t.s] = { price: t.p, prev: next[t.s]?.price || t.p }
          })
          return next
        })
      }
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    return () => ws.close()
  }, [])

  const subscribe = useCallback((s) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: 'subscribe', symbol: s }))
  }, [])
  const unsubscribe = useCallback((s) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbol: s }))
  }, [])

  return { prices, connected, subscribe, unsubscribe }
}

function useQuotes(symbols) {
  const [quotes, setQuotes] = useState({})
  useEffect(() => {
    symbols.forEach(async sym => {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${API_KEY}`)
        const d = await r.json()
        if (d.c) setQuotes(p => ({ ...p, [sym]: { price: d.c, change: d.d, changePct: d.dp, high: d.h, low: d.l, prevClose: d.pc } }))
      } catch {}
    })
  }, [symbols.join(',')])
  return quotes
}

function Card({ symbol, ws, quote, starred, onStar, onRemove, onClick }) {
  const price     = ws?.price || quote?.price
  const prevClose = quote?.prevClose
  const change    = price && prevClose ? price - prevClose : quote?.change
  const changePct = price && prevClose ? ((price - prevClose) / prevClose) * 100 : quote?.changePct
  const isUp = (change ?? 0) >= 0
  const flash = ws?.price && ws?.prev && ws.price !== ws.prev
    ? ws.price > ws.prev ? 'flash-green' : 'flash-red' : ''

  return (
    <div onClick={onClick}
      className={`relative bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500 cursor-pointer transition-all ${flash}`}>
      <button onClick={e => { e.stopPropagation(); onRemove(symbol) }}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-400 transition-colors">
        <X size={13} />
      </button>
      <div className="flex items-center justify-between mb-2 pr-4">
        <span className="font-bold text-white">{symbol}</span>
        <button onClick={e => { e.stopPropagation(); onStar(symbol) }}
          className={starred ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}>
          <Star size={15} fill={starred ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="text-2xl font-bold mb-0.5">
        {price ? `$${price.toFixed(2)}` : <span className="text-gray-600 animate-pulse text-base">Loading…</span>}
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
        {isUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
        {change != null && <span>{isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct?.toFixed(2)}%)</span>}
      </div>
      {quote && (
        <div className="mt-2 grid grid-cols-2 text-[10px] text-gray-500 gap-0.5">
          <span>H <span className="text-gray-400">${quote.high?.toFixed(2)}</span></span>
          <span>L <span className="text-gray-400">${quote.low?.toFixed(2)}</span></span>
        </div>
      )}
    </div>
  )
}

export default function Watchlist() {
  const navigate = useNavigate()
  const [stocks, setStocks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stocks') || 'null') || DEFAULT } catch { return DEFAULT }
  })
  const [starred, setStarred] = useState(() => {
    try { return JSON.parse(localStorage.getItem('starred') || '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const { prices, connected, subscribe, unsubscribe } = useWS(stocks)
  const quotes = useQuotes(stocks)

  useEffect(() => { localStorage.setItem('stocks', JSON.stringify(stocks)) }, [stocks])
  useEffect(() => { localStorage.setItem('starred', JSON.stringify(starred)) }, [starred])

  const add = (sym) => {
    const s = sym.trim().toUpperCase()
    if (s && !stocks.includes(s)) { setStocks(p => [...p, s]); subscribe(s) }
    setInput('')
  }
  const remove = (s) => { setStocks(p => p.filter(x => x !== s)); unsubscribe(s) }
  const toggleStar = (s) => setStarred(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Watchlist</h1>
          <p className="text-xs text-gray-500">{stocks.length} หุ้น · Real-time via WebSocket</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? <Wifi size={14}/> : <WifiOff size={14}/>}
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Add input */}
      <form onSubmit={e => { e.preventDefault(); add(input) }} className="flex gap-2 mb-6">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="เพิ่ม symbol เช่น AAPL"
          className="flex-1 max-w-xs bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-500" />
        <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={14}/> Add
        </button>
      </form>

      {stocks.length === 0 ? (
        <div className="text-center py-20 text-gray-500">ยังไม่มีหุ้น — เพิ่มผ่านช่องด้านบน</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {stocks.map(sym => (
            <Card key={sym} symbol={sym} ws={prices[sym]} quote={quotes[sym]}
              starred={starred.includes(sym)} onStar={toggleStar} onRemove={remove}
              onClick={() => navigate(`/stock/${sym}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
