import { useState, useEffect, useRef, useCallback } from 'react'
import { SP500 } from '../sp500'

const API_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'
const CACHE_KEY = 'sp500_cache'
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export function useSP500Quotes() {
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
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (!cached || Date.now() - cached.ts >= CACHE_TTL) fetchAll()
    } catch { fetchAll() }
    return () => { abortRef.current = true }
  }, [fetchAll])

  return { sp500Quotes, loading, progress, lastUpdated, refetch: fetchAll }
}
