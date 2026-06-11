import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Star, TrendingUp, TrendingDown, RefreshCw,
  DollarSign, Calendar, BarChart2, Newspaper, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { classify, LYNCH_CATEGORIES } from '../utils/peterLynch'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AiAnalyst from '../components/AiAnalyst'

const FINNHUB_KEY  = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'
const TWELVE_KEY   = '1b5540bb3fc342e19f36f8bcffcce177'
const TWELVE_BASE  = 'https://api.twelvedata.com'

// ── Period configs (Twelve Data) ────────────────────────────────
const PERIODS = [
  { label: '1D',  interval: '5min',  outputsize: 78  },
  { label: '5D',  interval: '15min', outputsize: 130 },
  { label: '1W',  interval: '1h',    outputsize: 40  },
  { label: '1M',  interval: '1day',  outputsize: 30  },
  { label: '3M',  interval: '1day',  outputsize: 90  },
  { label: '6M',  interval: '1day',  outputsize: 180 },
  { label: 'YTD', interval: '1day',  outputsize: 365 },
  { label: '1Y',  interval: '1week', outputsize: 52  },
]

// ── Helpers ─────────────────────────────────────────────────────
function formatLabel(datetime, interval) {
  const d = new Date(datetime.replace(' ', 'T'))
  if (interval.includes('min') || interval === '1h') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}


// ── Custom Tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, interval }) {
  if (!active || !payload?.length) return null
  const { datetime, price, open, high, low } = payload[0]?.payload ?? {}
  const d = new Date((datetime ?? '').replace(' ', 'T'))
  const dateStr = interval?.includes('min') || interval === '1h'
    ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
    : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-gray-900 border border-gray-600 rounded-xl px-3 py-2.5 shadow-2xl text-xs min-w-[130px]">
      <p className="text-gray-400 mb-1.5">{dateStr}</p>
      <p className="text-white font-bold text-base">${price?.toFixed(2)}</p>
      {open != null && <div className="mt-1.5 grid grid-cols-2 gap-x-3 text-gray-400">
        <span>O <span className="text-gray-200">${open?.toFixed(2)}</span></span>
        <span>H <span className="text-green-400">${high?.toFixed(2)}</span></span>
        <span>L <span className="text-red-400">${low?.toFixed(2)}</span></span>
      </div>}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export default function StockDetail() {
  const { symbol } = useParams()
  const navigate   = useNavigate()

  const [period,    setPeriod]    = useState('1M')
  const [chartData, setChartData] = useState([])
  const [chartLoad, setChartLoad] = useState(false)
  const [quote,     setQuote]     = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [divMetric, setDivMetric] = useState(null)
  const [divLoad,   setDivLoad]   = useState(false)
  
  const [newsData,      setNewsData]      = useState(null)
  const [sentimentData, setSentimentData] = useState(null)
  const [newsLoad,      setNewsLoad]      = useState(false)
  const [fetchedNewsSymbol, setFetchedNewsSymbol] = useState(null)

  const { user } = useAuth()
  
  const [lynchCat,  setLynchCat]  = useState(() => {
    try {
      const cache = JSON.parse(localStorage.getItem('lynch_classify_v1') || '{}')
      return cache[symbol] || null
    } catch { return null }
  })
  const [starred,   setStarred]   = useState([])
  const [activeTab, setActiveTab] = useState('chart') // chart | dividend | news

  useEffect(() => {
    if (user) {
      supabase.from('user_watchlists').select('symbol').eq('user_id', user.id).then(({ data }) => {
        if (data) setStarred(data.map(d => d.symbol))
      })
    } else {
      try { setStarred(JSON.parse(localStorage.getItem('starred') || '[]')) } catch {}
    }
  }, [user])

  const isStarred = starred.includes(symbol)
  
  const toggleStar = async () => {
    if (!user) {
      if (window.confirm('Please sign in to save stocks to your cloud watchlist.')) {
        navigate('/auth')
      }
      return
    }

    const nextIsStarred = !isStarred
    setStarred(prev => nextIsStarred ? [...prev, symbol] : prev.filter(s => s !== symbol))

    if (nextIsStarred) {
      await supabase.from('user_watchlists').insert({ user_id: user.id, symbol })
    } else {
      await supabase.from('user_watchlists').delete().match({ user_id: user.id, symbol })
    }
  }

  // ── Fetch Quote + classify Lynch ────────────────────────────────
  useEffect(() => {
    fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`)
      .then(r => r.json()).then(setQuote).catch(() => {})

    Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`).then(r => r.json()),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_KEY}`).then(r => r.json()),
    ]).then(([prof, met]) => {
      setProfile(prof)
      const cat = classify(met.metric || {}, prof.finnhubIndustry || '', prof)
      setLynchCat(cat)
      try {
        const cache = JSON.parse(localStorage.getItem('lynch_classify_v1') || '{}')
        localStorage.setItem('lynch_classify_v1', JSON.stringify({ ...cache, [symbol]: cat }))
      } catch {}
    }).catch(() => {})
  }, [symbol])

  // ── Fetch Chart (Twelve Data) ─────────────────────────────────
  const fetchChart = useCallback(async () => {
    const p = PERIODS.find(x => x.label === period)
    if (!p) return
    setChartLoad(true)
    setChartData([])
    try {
      const params = new URLSearchParams({
        symbol, interval: p.interval, outputsize: p.outputsize,
        apikey: TWELVE_KEY, order: 'ASC',
      })
      const res  = await fetch(`${TWELVE_BASE}/time_series?${params}`)
      const data = await res.json()
      if (data.values) {
        setChartData(data.values.map(v => ({
          datetime: v.datetime,
          label:    formatLabel(v.datetime, p.interval),
          price:    parseFloat(v.close),
          open:     parseFloat(v.open),
          high:     parseFloat(v.high),
          low:      parseFloat(v.low),
          volume:   parseInt(v.volume),
        })))
      }
    } catch {}
    setChartLoad(false)
  }, [symbol, period])

  useEffect(() => { fetchChart() }, [fetchChart])

  // ── Fetch Dividend Metrics (Finnhub) ─────────────────────────
  useEffect(() => {
    if (activeTab !== 'dividend') return
    if (divMetric) return
    setDivLoad(true)
    fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_KEY}`)
      .then(r => r.json())
      .then(data => {
        const m = data.metric || {}
        setDivMetric({
          yieldTTM:     m.currentDividendYieldTTM           || null,
          yieldIndicated: m.dividendYieldIndicatedAnnual    || null,
          annualDPS:    m.dividendPerShareAnnual             || null,
          annualInd:    m.dividendIndicatedAnnual            || null,
          ttmDPS:       m.dividendPerShareTTM               || null,
          growth5y:     m.dividendGrowthRate5Y              || null,
          payoutRatio:  m.payoutRatioAnnual                 || null,
          eps:          m.epsAnnual                         || null,
        })
      })
      .catch(() => setDivMetric({}))
      .finally(() => setDivLoad(false))
  }, [symbol, activeTab, divMetric])

  // ── Fetch News & Sentiment ───────────────────────────────────────
  const fetchNews = useCallback(() => {
    setNewsLoad(true)
    setNewsData(null)
    setSentimentData(null)
    
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const to = today.toISOString().split('T')[0]
    const from = lastWeek.toISOString().split('T')[0]

    Promise.all([
      fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_KEY}`).then(r => r.json()),
      fetch(`https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${FINNHUB_KEY}`).then(r => r.json())
    ]).then(([newsRes, sentRes]) => {
      const filteredNews = (Array.isArray(newsRes) ? newsRes : [])
        .filter(n => n.headline && n.image && n.summary)
        .slice(0, 15)
      setNewsData(filteredNews)
      setSentimentData(sentRes.sentiment || null)
      setFetchedNewsSymbol(symbol)
    }).catch(() => {
      setNewsData([])
      setSentimentData(null)
      setFetchedNewsSymbol(symbol)
    }).finally(() => setNewsLoad(false))
  }, [symbol])

  useEffect(() => {
    if (activeTab === 'news' && fetchedNewsSymbol !== symbol) {
      fetchNews()
    }
  }, [activeTab, symbol, fetchedNewsSymbol, fetchNews])

  // ── Computed values ──────────────────────────────────────────
  const livePrice    = quote?.c
  const todayChange  = quote?.d
  const todayChangePct = quote?.dp

  // Period change from chart
  const firstCandle = chartData[0]
  const lastCandle  = chartData[chartData.length - 1]
  const periodChange    = firstCandle && lastCandle ? lastCandle.price - firstCandle.price : null
  const periodChangePct = firstCandle && lastCandle ? ((lastCandle.price - firstCandle.price) / firstCandle.price) * 100 : null
  const showPeriodChange = period !== '1D' && periodChange != null

  const displayChange    = showPeriodChange ? periodChange    : todayChange
  const displayChangePct = showPeriodChange ? periodChangePct : todayChangePct
  const isUp = (displayChange ?? 0) >= 0

  const chartUp  = lastCandle?.price >= (firstCandle?.price ?? lastCandle?.price ?? 0)
  const minPrice = chartData.length ? Math.min(...chartData.map(d => d.price)) * 0.998 : 0
  const maxPrice = chartData.length ? Math.max(...chartData.map(d => d.price)) * 1.002 : 0
  const tickInterval = Math.max(1, Math.floor(chartData.length / 7))

  // Dividend computed
  const divYield   = divMetric?.yieldIndicated || divMetric?.yieldTTM
  const annualDiv  = divMetric?.annualInd || divMetric?.annualDPS
  const noDividend = divMetric && !divYield && !annualDiv

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10" style={{ backgroundColor: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border, #2a2a40)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors p-1">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{symbol}</h1>
              {profile?.name && <span className="text-gray-400 text-sm truncate hidden sm:block">{profile.name}</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {profile?.exchange && (
                <span className="text-xs text-gray-500">{profile.exchange} · {profile.finnhubIndustry}</span>
              )}
              {lynchCat && LYNCH_CATEGORIES[lynchCat] && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${LYNCH_CATEGORIES[lynchCat].badge}`}>
                  {LYNCH_CATEGORIES[lynchCat].emoji} {LYNCH_CATEGORIES[lynchCat].label}
                </span>
              )}
            </div>
          </div>
          {profile?.logo && (
            <img src={profile.logo} alt="" className="h-9 w-9 rounded-lg object-contain bg-white p-1" />
          )}
          <button onClick={toggleStar} className={`transition-colors ${isStarred ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}>
            <Star size={22} fill={isStarred ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── Price Hero ── */}
        <div>
          <div className="text-4xl font-bold tracking-tight">
            {livePrice ? `$${livePrice.toFixed(2)}` : '—'}
          </div>
          <div className={`flex items-center gap-1.5 mt-1.5 text-base font-semibold ${isUp ? 'text-green-400' : 'text-red-400'} mb-8`}>
            {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{displayChange != null ? `${isUp ? '+' : ''}${displayChange.toFixed(2)}` : '—'}</span>
            <span>({displayChangePct != null ? `${isUp ? '+' : ''}${displayChangePct.toFixed(2)}%` : '—'})</span>
            <span className="text-gray-500 text-sm font-normal ml-1">{showPeriodChange ? period : 'Today'}</span>
          </div>
        </div>

        {/* ── AI Analyst ── */}
        <AiAnalyst 
          symbol={symbol} 
          quote={quote} 
          profile={{ metric: divMetric, ...profile }} 
          divMetric={divMetric} 
          lynchCat={lynchCat} 
          newsData={newsData} 
          sentimentData={sentimentData} 
        />

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 w-fit">
          {[
            { id: 'chart',    icon: BarChart2,  label: 'Chart'    },
            { id: 'dividend', icon: DollarSign, label: 'Dividend' },
            { id: 'news',     icon: Newspaper,  label: 'News'     },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════ CHART TAB ══════════════ */}
        {activeTab === 'chart' && (<>

          {/* Period Selector */}
          <div className="flex items-center gap-1 flex-wrap">
            {PERIODS.map(p => (
              <button
                key={p.label}
                onClick={() => setPeriod(p.label)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p.label
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button onClick={fetchChart} className="ml-1 p-1.5 text-gray-500 hover:text-white transition-colors">
              <RefreshCw size={14} className={chartLoad ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Chart */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            {chartLoad ? (
              <div className="h-72 flex items-center justify-center text-gray-500 gap-2">
                <RefreshCw size={18} className="animate-spin" /> Loading chart...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-gray-500">No data available</div>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={chartUp ? '#22c55e' : '#ef4444'} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={chartUp ? '#22c55e' : '#ef4444'} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval={tickInterval}
                    />
                    <YAxis
                      domain={[minPrice, maxPrice]}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `$${v.toFixed(0)}`}
                      width={58}
                      orientation="right"
                    />
                    <Tooltip content={<ChartTooltip interval={PERIODS.find(p => p.label === period)?.interval} />} />
                    {firstCandle && (
                      <ReferenceLine y={firstCandle.price} stroke="#374151" strokeDasharray="4 4" strokeWidth={1} />
                    )}
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={chartUp ? '#22c55e' : '#ef4444'}
                      strokeWidth={2}
                      fill="url(#chartGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: chartUp ? '#22c55e' : '#ef4444', stroke: '#111827', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Stats */}
          {quote && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Open',       value: quote.o  },
                { label: 'High',       value: quote.h  },
                { label: 'Low',        value: quote.l  },
                { label: 'Prev Close', value: quote.pc },
              ].map(s => (
                <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className="text-lg font-bold">${s.value?.toFixed(2) ?? '—'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Company Info */}
          {profile?.name && (
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h2 className="font-bold mb-3">Company Info</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: 'Country',    value: profile.country },
                  { label: 'Currency',   value: profile.currency },
                  { label: 'Exchange',   value: profile.exchange },
                  { label: 'Industry',   value: profile.finnhubIndustry },
                  { label: 'IPO Date',   value: profile.ipo },
                  { label: 'Market Cap', value: profile.marketCapitalization
                      ? `$${(profile.marketCapitalization / 1000).toFixed(1)}B` : null },
                ].filter(x => x.value).map(x => (
                  <div key={x.label} className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-0.5">{x.label}</p>
                    <p className="font-semibold truncate">{x.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>)}

        {/* ══════════════ DIVIDEND TAB ══════════════ */}
        {activeTab === 'dividend' && (
          <div className="space-y-4">
            {divLoad ? (
              <div className="h-40 flex items-center justify-center text-gray-500 gap-2">
                <RefreshCw size={18} className="animate-spin" /> Loading dividend data...
              </div>
            ) : noDividend ? (
              <div className="bg-gray-800 rounded-2xl p-10 border border-gray-700 text-center">
                <DollarSign size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-300 font-semibold text-lg">ไม่มีการจ่ายปันผล</p>
                <p className="text-gray-500 text-sm mt-1">{symbol} does not pay a dividend</p>
              </div>
            ) : divMetric ? (
              <>
                {/* Yield Hero */}
                <div className="bg-gradient-to-br from-green-900/40 to-gray-800 rounded-2xl p-6 border border-green-700/30">
                  <p className="text-gray-400 text-sm mb-1">Dividend Yield</p>
                  <p className="text-5xl font-bold text-green-400">
                    {divYield ? `${divYield.toFixed(2)}%` : '—'}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">Indicated Annual Yield</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Annual Dividend / Share', value: annualDiv   ? `$${annualDiv.toFixed(4)}`          : '—', highlight: true  },
                    { label: 'Dividend / Share (TTM)',  value: divMetric.ttmDPS   ? `$${divMetric.ttmDPS.toFixed(4)}`   : '—' },
                    { label: '5Y Dividend Growth',      value: divMetric.growth5y ? `${divMetric.growth5y.toFixed(2)}%` : '—',
                      color: divMetric.growth5y > 0 ? 'text-green-400' : 'text-red-400' },
                    { label: 'Payout Ratio',            value: divMetric.payoutRatio ? `${divMetric.payoutRatio.toFixed(1)}%` : '—' },
                    { label: 'EPS (Annual)',             value: divMetric.eps ? `$${divMetric.eps.toFixed(2)}` : '—' },
                    { label: 'Yield (TTM)',              value: divMetric.yieldTTM ? `${divMetric.yieldTTM.toFixed(2)}%` : '—' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                      <p className="text-xs text-gray-500 mb-1.5 leading-tight">{item.label}</p>
                      <p className={`text-lg font-bold ${item.color || 'text-white'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 px-4 py-3 bg-blue-900/20 border border-blue-700/30 rounded-xl text-xs text-blue-300">
                  <Calendar size={14} className="shrink-0 mt-0.5" />
                  <span>ข้อมูลจาก Finnhub fundamental metrics • สำหรับประวัติการจ่ายปันผลแต่ละครั้ง กรุณาดูที่ <a href={`https://finance.yahoo.com/quote/${symbol}/history`} target="_blank" rel="noreferrer" className="underline">Yahoo Finance</a></span>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ══════════════ NEWS TAB ══════════════ */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            {newsLoad ? (
              <div className="h-40 flex items-center justify-center text-gray-500 gap-2">
                <RefreshCw size={18} className="animate-spin" /> Loading latest news & sentiment...
              </div>
            ) : (
              <>
                {/* Sentiment Hero */}
                {sentimentData && (
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Newspaper size={20} className="text-blue-400" /> AI Sentiment Analysis
                    </h3>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                      {/* Overall Score */}
                      <div className="shrink-0 text-center md:text-left">
                        <p className="text-sm text-gray-400 mb-1">Overall Tone</p>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          {sentimentData.bullishPercent > sentimentData.bearishPercent ? (
                            <ArrowUpRight size={28} className="text-green-400" />
                          ) : sentimentData.bearishPercent > sentimentData.bullishPercent ? (
                            <ArrowDownRight size={28} className="text-red-400" />
                          ) : (
                            <ArrowUpRight size={28} className="text-yellow-400" />
                          )}
                          <span className={`text-4xl font-black ${
                            sentimentData.bullishPercent > sentimentData.bearishPercent ? 'text-green-400' :
                            sentimentData.bearishPercent > sentimentData.bullishPercent ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {sentimentData.bullishPercent > sentimentData.bearishPercent ? 'BULLISH' : 
                             sentimentData.bearishPercent > sentimentData.bullishPercent ? 'BEARISH' : 'NEUTRAL'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-1 w-full space-y-3">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-green-400">{(sentimentData.bullishPercent * 100).toFixed(0)}% Bullish</span>
                          <span className="text-gray-400">{(100 - (sentimentData.bullishPercent * 100) - (sentimentData.bearishPercent * 100)).toFixed(0)}% Neutral</span>
                          <span className="text-red-400">{(sentimentData.bearishPercent * 100).toFixed(0)}% Bearish</span>
                        </div>
                        <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden flex">
                          <div className="bg-green-500 h-full" style={{ width: `${sentimentData.bullishPercent * 100}%` }} />
                          <div className="bg-gray-600 h-full" style={{ width: `${100 - (sentimentData.bullishPercent * 100) - (sentimentData.bearishPercent * 100)}%` }} />
                          <div className="bg-red-500 h-full" style={{ width: `${sentimentData.bearishPercent * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* News Feed */}
                <div className="flex items-center justify-between mt-8 mb-4">
                  <h3 className="font-bold text-lg text-white">Latest Headlines (7 Days)</h3>
                  <button 
                    onClick={fetchNews}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border border-gray-700"
                  >
                    <RefreshCw size={14} className={newsLoad ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {newsData && newsData.length > 0 ? newsData.map((news) => (
                    <a
                      key={news.id}
                      href={news.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex flex-col bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors"
                    >
                      <div className="h-40 w-full overflow-hidden bg-gray-900 shrink-0">
                        <img 
                          src={news.image} 
                          alt={news.headline}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2 uppercase font-semibold tracking-wider">
                          <span className="truncate mr-2 text-blue-400">{news.source}</span>
                          <span className="shrink-0">{new Date(news.datetime * 1000).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                          {news.headline}
                        </h4>
                        <p className="text-gray-400 text-xs line-clamp-3 mb-4">
                          {news.summary}
                        </p>
                        <div className="mt-auto pt-3 border-t border-gray-700/50 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Read Full Article <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </a>
                  )) : (
                    <div className="col-span-full p-10 text-center text-gray-500 border border-dashed border-gray-700 rounded-xl">
                      ไม่มีข่าวสารที่เกี่ยวข้องในช่วงนี้
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
