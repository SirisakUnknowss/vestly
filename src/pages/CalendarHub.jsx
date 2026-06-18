import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar as CalendarIcon, 
  Star, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Calculator, 
  Info, 
  ArrowLeft, 
  ChevronRight,
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { STOCKS_DB } from '../data/stocksDB'

// Constants
const API_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'

// Relative Date Helper
const getRelativeDate = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

// Generate human-friendly Thai date string
const formatThaiDate = (dateStr) => {
  try {
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ]
    const d = new Date(dateStr)
    const dayName = days[d.getDay()]
    const dateNum = d.getDate()
    const monthName = months[d.getMonth()]
    const yearThai = d.getFullYear() + 543
    return `วัน${dayName}ที่ ${dateNum} ${monthName} ${yearThai}`
  } catch {
    return dateStr
  }
}

// Get Monday and Sunday bounds for range filtering
const getRangeBounds = (range) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  if (range === 'week') {
    const currentDay = now.getDay()
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(now)
    monday.setDate(now.getDate() + distanceToMonday)
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return { start: monday, end: sunday }
  }
  
  if (range === 'next-week') {
    const currentDay = now.getDay()
    const distanceToNextMonday = currentDay === 0 ? 1 : 8 - currentDay
    const nextMonday = new Date(now)
    nextMonday.setDate(now.getDate() + distanceToNextMonday)
    
    const nextSunday = new Date(nextMonday)
    nextSunday.setDate(nextMonday.getDate() + 6)
    nextSunday.setHours(23, 59, 59, 999)
    return { start: nextMonday, end: nextSunday }
  }
  
  if (range === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start: startOfMonth, end: endOfMonth }
  }
  
  return null
}

export default function CalendarHub() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('earnings') // 'earnings' | 'dividends'
  const [dateRange, setDateRange] = useState('month') // 'week' | 'next-week' | 'month' | 'all'
  const [searchQuery, setSearchQuery] = useState('')
  const [watchlistOnly, setWatchlistOnly] = useState(false)
  
  // Watchlist from localStorage
  const watchlist = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('stocks') || '[]')
    } catch {
      return []
    }
  }, [])

  // Calculator State
  const [calcSymbol, setCalcSymbol] = useState('O')
  const [sharesCount, setSharesCount] = useState('100')
  const [showCalcTip, setShowCalcTip] = useState(true)

  // Live and Mock Data State
  const [earningsData, setEarningsData] = useState([])
  const [dividendsData, setDividendsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Mock Database
  const mockEarnings = useMemo(() => [
    { date: getRelativeDate(-4), symbol: 'AAPL', epsEstimate: 1.40, epsActual: 1.45, revenueEstimate: 90000000000, revenueActual: 91500000000, hour: 'amc', quarter: 2, year: 2026 },
    { date: getRelativeDate(-2), symbol: 'MSFT', epsEstimate: 2.93, epsActual: 2.90, revenueEstimate: 64000000000, revenueActual: 63800000000, hour: 'amc', quarter: 2, year: 2026 },
    { date: getRelativeDate(0), symbol: 'TSLA', epsEstimate: 0.60, epsActual: null, revenueEstimate: 25500000000, revenueActual: null, hour: 'bmo', quarter: 2, year: 2026 },
    { date: getRelativeDate(1), symbol: 'NVDA', epsEstimate: 0.64, epsActual: null, revenueEstimate: 28000000000, revenueActual: null, hour: 'amc', quarter: 2, year: 2026 },
    { date: getRelativeDate(3), symbol: 'GOOGL', epsEstimate: 1.84, epsActual: null, revenueEstimate: 84300000000, revenueActual: null, hour: 'bmo', quarter: 2, year: 2026 },
    { date: getRelativeDate(4), symbol: 'AMZN', epsEstimate: 1.02, epsActual: null, revenueEstimate: 148000000000, revenueActual: null, hour: 'amc', quarter: 2, year: 2026 },
    { date: getRelativeDate(7), symbol: 'META', epsEstimate: 4.30, epsActual: null, revenueEstimate: 38500000000, revenueActual: null, hour: 'amc', quarter: 2, year: 2026 },
    { date: getRelativeDate(10), symbol: 'AMD', epsEstimate: 0.70, epsActual: null, revenueEstimate: 5700000000, revenueActual: null, hour: 'bmo', quarter: 2, year: 2026 },
    { date: getRelativeDate(13), symbol: 'NFLX', epsEstimate: 4.50, epsActual: null, revenueEstimate: 9530000000, revenueActual: null, hour: 'amc', quarter: 2, year: 2026 },
  ], [])

  const mockDividends = useMemo(() => [
    { exDate: getRelativeDate(-5), payDate: getRelativeDate(15), symbol: 'O', amount: 0.263, yield: 5.85, name: 'Realty Income' },
    { exDate: getRelativeDate(-1), payDate: getRelativeDate(22), symbol: 'MCD', amount: 1.67, yield: 2.52, name: "McDonald's" },
    { exDate: getRelativeDate(2), payDate: getRelativeDate(25), symbol: 'KO', amount: 0.48, yield: 3.14, name: 'Coca-Cola' },
    { exDate: getRelativeDate(4), payDate: getRelativeDate(28), symbol: 'PG', amount: 1.01, yield: 2.45, name: 'Procter & Gamble' },
    { exDate: getRelativeDate(7), payDate: getRelativeDate(24), symbol: 'MAIN', amount: 0.24, yield: 6.20, name: 'Main Street Capital' },
    { exDate: getRelativeDate(9), payDate: getRelativeDate(30), symbol: 'JNJ', amount: 1.24, yield: 3.05, name: 'Johnson & Johnson' },
    { exDate: getRelativeDate(12), payDate: getRelativeDate(35), symbol: 'T', amount: 0.2775, yield: 6.88, name: 'AT&T' },
    { exDate: getRelativeDate(15), payDate: getRelativeDate(40), symbol: 'VZ', amount: 0.665, yield: 6.54, name: 'Verizon' },
  ], [])

  // Fetch Earnings from Finnhub API with Local Mock fallback
  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true)
      setError(null)
      try {
        const today = new Date()
        const fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15).toISOString().split('T')[0]
        const toDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30).toISOString().split('T')[0]

        const response = await fetch(
          `https://finnhub.io/api/v1/calendar/earnings?from=${fromDate}&to=${toDate}&token=${API_KEY}`
        )
        const data = await response.json()
        
        if (data && data.earningsCalendar && data.earningsCalendar.length > 0) {
          // Sort earnings by date
          const sorted = data.earningsCalendar.sort((a, b) => new Date(a.date) - new Date(b.date))
          setEarningsData(sorted)
        } else {
          // Fallback to mock data if empty response
          setEarningsData(mockEarnings)
        }
      } catch (err) {
        // Fallback on error
        setEarningsData(mockEarnings)
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
    // Dividends page is locally resolved + populated from mock & watchlist info
    setDividendsData(mockDividends)
  }, [mockEarnings, mockDividends])

  // Company Name Resolver
  const resolveCompanyName = (symbol) => {
    const match = STOCKS_DB.find(st => st.s === symbol)
    if (match) return match.n
    const divMatch = dividendsData.find(d => d.symbol === symbol)
    if (divMatch) return divMatch.name
    return symbol
  }

  // Payout calculation helper
  const calcPayoutResult = useMemo(() => {
    const div = dividendsData.find(d => d.symbol === calcSymbol)
    if (!div) return null
    const count = parseFloat(sharesCount) || 0
    const total = count * div.amount
    return {
      amountPerShare: div.amount,
      totalPayout: total,
      exDate: div.exDate,
      payDate: div.payDate,
      yield: div.yield,
    }
  }, [calcSymbol, sharesCount, dividendsData])

  // Filtered and Grouped Earnings
  const filteredEarnings = useMemo(() => {
    return earningsData.filter(item => {
      // Search
      const matchesSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
        resolveCompanyName(item.symbol).toLowerCase().includes(searchQuery.toLowerCase())
      
      // Watchlist
      const matchesWatchlist = watchlistOnly ? watchlist.includes(item.symbol) : true

      // Date Range bounds
      const bounds = getRangeBounds(dateRange)
      let matchesRange = true
      if (bounds) {
        const itemDate = new Date(item.date)
        matchesRange = itemDate >= bounds.start && itemDate <= bounds.end
      }

      return matchesSearch && matchesWatchlist && matchesRange
    })
  }, [earningsData, searchQuery, watchlistOnly, watchlist, dateRange])

  // Group Earnings by Date
  const groupedEarnings = useMemo(() => {
    const groups = {}
    filteredEarnings.forEach(item => {
      if (!groups[item.date]) {
        groups[item.date] = []
      }
      groups[item.date].push(item)
    })
    return Object.keys(groups)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(date => ({
        date,
        items: groups[date].sort((a, b) => a.symbol.localeCompare(b.symbol))
      }))
  }, [filteredEarnings])

  // Filtered and Grouped Dividends
  const filteredDividends = useMemo(() => {
    return dividendsData.filter(item => {
      // Search
      const matchesSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Watchlist
      const matchesWatchlist = watchlistOnly ? watchlist.includes(item.symbol) : true

      // Date Range bounds
      const bounds = getRangeBounds(dateRange)
      let matchesRange = true
      if (bounds) {
        const itemDate = new Date(item.exDate)
        matchesRange = itemDate >= bounds.start && itemDate <= bounds.end
      }

      return matchesSearch && matchesWatchlist && matchesRange
    })
  }, [dividendsData, searchQuery, watchlistOnly, watchlist, dateRange])

  // Group Dividends by Date
  const groupedDividends = useMemo(() => {
    const groups = {}
    filteredDividends.forEach(item => {
      if (!groups[item.exDate]) {
        groups[item.exDate] = []
      }
      groups[item.exDate].push(item)
    })
    return Object.keys(groups)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(date => ({
        date,
        items: groups[date].sort((a, b) => a.symbol.localeCompare(b.symbol))
      }))
  }, [filteredDividends])

  // Set calculator symbol and input focus
  const handleSelectCalcStock = (symbol) => {
    setCalcSymbol(symbol)
    const el = document.getElementById('calc-shares')
    if (el) el.focus()
  }

  return (
    <PageTransition className="min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        
        {/* Breadcrumb / Back Button */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Markets
        </button>

        {/* ── Header Area ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CalendarIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Calendar Hub</h1>
                <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <Sparkles size={8} /> Beta
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ปฏิทินความเคลื่อนไหวสำคัญของหุ้นสหรัฐฯ: วันรายงานผลประกอบการรายไตรมาส (Earnings) และวันเครื่องหมายสิทธิ์เงินปันผล (Dividend)
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Tab Navigation ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Filter Sidebar & Controls */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Tab Swapper */}
            <div className="bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/55 p-1.5 rounded-xl flex gap-1">
              <button
                onClick={() => { setActiveTab('earnings'); setDateRange('month') }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'earnings' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <TrendingUp size={15} /> Earnings
              </button>
              <button
                onClick={() => { setActiveTab('dividends'); setDateRange('month') }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'dividends' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <DollarSign size={15} /> Dividends
              </button>
            </div>

            {/* Filter Card */}
            <div className="bg-gray-50 dark:bg-gray-800/25 border border-gray-200 dark:border-gray-700/40 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase">ตัวกรองปฏิทิน</h3>
              
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหา Symbol / ชื่อบริษัท..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Watchlist Toggle */}
              <label className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900/50 rounded-lg cursor-pointer border border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-2">
                  <Star size={13} className={watchlistOnly ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">เฉพาะใน Watchlist</span>
                </div>
                <input
                  type="checkbox"
                  checked={watchlistOnly}
                  onChange={(e) => setWatchlistOnly(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-800 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Date Ranges */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">ช่วงเวลากิจกรรม</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'week', label: 'สัปดาห์นี้' },
                    { id: 'next-week', label: 'สัปดาห์หน้า' },
                    { id: 'month', label: 'เดือนนี้' },
                    { id: 'all', label: 'ทั้งหมด' },
                  ].map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setDateRange(range.id)}
                      className={`py-1.5 px-2.5 text-[11px] font-semibold border rounded-lg transition-colors cursor-pointer ${
                        dateRange === range.id
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 font-bold'
                          : 'bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700/60 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Calculator Card for Dividends Tab */}
            {activeTab === 'dividends' && (
              <div className="bg-gray-50 dark:bg-gray-800/25 border border-gray-200 dark:border-gray-700/40 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
                  <Calculator size={15} />
                  <h3 className="text-xs font-bold tracking-wider uppercase text-gray-900 dark:text-white">เครื่องคำนวณเงินปันผล</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-400 dark:text-gray-500 block mb-1">เลือกหุ้นปันผล</label>
                    <select
                      value={calcSymbol}
                      onChange={(e) => setCalcSymbol(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer animate-none"
                    >
                      {dividendsData.map(d => (
                        <option key={d.symbol} value={d.symbol} className="text-gray-900 dark:text-white bg-white dark:bg-gray-900">{d.symbol} — {d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 dark:text-gray-500 block mb-1">จำนวนหุ้นที่คุณถือ</label>
                    <input
                      id="calc-shares"
                      type="number"
                      min="1"
                      value={sharesCount}
                      onChange={(e) => setSharesCount(e.target.value)}
                      placeholder="เช่น 100 หุ้น"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 placeholder-gray-400 dark:placeholder-gray-700"
                    />
                  </div>

                  {calcPayoutResult && (
                    <div className="p-3 bg-emerald-500/5 dark:bg-emerald-905/20 border border-emerald-500/10 dark:border-emerald-900/30 rounded-lg space-y-2 text-xs">
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>ปันผลต่อหุ้น:</span>
                        <span className="font-bold text-gray-900 dark:text-white">${calcPayoutResult.amountPerShare.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-1.5">
                        <span>Dividend Yield:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{calcPayoutResult.yield.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-emerald-600 dark:text-emerald-300 pt-0.5">
                        <span>ปันผลรวมรับ:</span>
                        <span className="text-base text-gray-900 dark:text-white font-black">${calcPayoutResult.totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}

                  {calcPayoutResult && showCalcTip && (
                    <div className="p-2.5 bg-white dark:bg-gray-900/40 rounded-lg text-[10px] text-gray-600 dark:text-gray-500 leading-relaxed relative border border-gray-200 dark:border-gray-800">
                      <button 
                        onClick={() => setShowCalcTip(false)}
                        className="absolute top-1 right-1 text-gray-500 hover:text-gray-900 dark:hover:text-gray-400"
                      >
                        <X size={10} />
                      </button>
                      <span className="font-semibold text-amber-600 dark:text-yellow-500 block mb-0.5">⚠️ คำเตือนสิทธิ์</span>
                      ต้องซื้อหุ้นและถือไว้ก่อนวันที่ <span className="font-bold text-gray-600 dark:text-gray-300">{calcPayoutResult.exDate}</span> (Ex-Dividend Date) จึงจะมีสิทธิ์ได้รับเงินปันผลในวันที่ <span className="font-bold text-gray-600 dark:text-gray-300">{calcPayoutResult.payDate}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Quick Guide Card */}
            <div className="bg-gray-50 dark:bg-gray-800/25 border border-gray-200 dark:border-gray-700/40 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-semibold mb-1">
                <Info size={13} />
                <span>คำศัพท์น่ารู้</span>
              </div>
              <div className="space-y-2 leading-relaxed text-gray-600 dark:text-gray-500 text-[11px]">
                <p>
                  <strong className="text-gray-800 dark:text-gray-300">Ex-Dividend Date (Ex-Date):</strong> วันขึ้นเครื่องหมายไม่ได้รับปันผล หากต้องการปันผล ต้องซื้อและถือครองหุ้นตัวนั้นก่อนถึงวันนี้
                </p>
                <p>
                  <strong className="text-gray-800 dark:text-gray-300">Pay Date:</strong> วันที่เงินสดปันผลจะถูกโอนเข้าบัญชีซื้อขายหลักทรัพย์ของคุณจริง
                </p>
                <p>
                  <strong className="text-gray-800 dark:text-gray-300">Hour badging:</strong> 🌅 BMO = Before Market Open (ก่อนเปิดตลาด) / 🌃 AMC = After Market Close (หลังปิดตลาด)
                </p>
              </div>
            </div>
            
          </div>

          {/* Right Column: Calendar Lists */}
          <div className="lg:col-span-9">
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/10 border border-gray-200 dark:border-gray-800/50 rounded-2xl">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">กำลังดึงข้อมูลกิจกรรมล่าสุดจาก Finnhub...</p>
              </div>
            )}

            {!loading && (
              <div className="space-y-6">

                {/* EARNINGS TAB CONTENT */}
                {activeTab === 'earnings' && (
                  <>
                    {groupedEarnings.length === 0 ? (
                      <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/10 border border-gray-200 dark:border-gray-800/50 rounded-2xl text-gray-500 space-y-2">
                        <p className="text-base">📅 ไม่พบรายการปฏิทินงวดผลประกอบการ</p>
                        <p className="text-xs text-gray-500 dark:text-gray-600">ลองขยายช่วงตัวเลือกเวลา หรือพิมพ์คำค้นหาใหม่อีกครั้ง</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {groupedEarnings.map((group) => (
                          <div key={group.date} className="space-y-2.5">
                            <div className="flex items-center gap-2.5 sticky top-14 bg-white dark:bg-gray-900 py-2.5 z-10">
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-905/20 border border-emerald-500/10 dark:border-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
                                {group.date}
                              </span>
                              <span className="text-xs font-bold text-gray-400">
                                ({formatThaiDate(group.date)})
                              </span>
                              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {group.items.map((item, idx) => {
                                const isPast = item.epsActual !== null
                                const isBeat = isPast && item.epsActual >= item.epsEstimate
                                
                                return (
                                  <div 
                                    key={`${item.symbol}-${idx}`}
                                    onClick={() => navigate(`/stock/${item.symbol}`)}
                                    className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/40 hover:border-emerald-500/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.005] group"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-base">{item.symbol}</span>
                                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                                            Q{item.quarter || '—'} {item.year || '—'}
                                          </span>
                                        </div>
                                        <h4 className="text-xs text-gray-500 mt-1 line-clamp-1">
                                          {resolveCompanyName(item.symbol)}
                                        </h4>
                                      </div>
                                      
                                      <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                          item.hour === 'bmo' 
                                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' 
                                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                          {item.hour === 'bmo' ? '🌅 BMO' : '🌃 AMC'}
                                        </span>
                                        
                                        {isPast ? (
                                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${
                                            isBeat 
                                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' 
                                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                                          }`}>
                                            {isBeat ? '🔥 BEAT' : '🔻 MISS'}
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-800">
                                            UPCOMING
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="mt-3.5 pt-3 border-t border-gray-200 dark:border-gray-800/60 grid grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <span className="text-gray-500 block mb-0.5">EPS (กำไรต่อหุ้น)</span>
                                        <div className="font-semibold flex items-center gap-1.5 text-gray-900 dark:text-white">
                                          <span>Est: <strong className="text-gray-700 dark:text-gray-300">{item.epsEstimate != null ? `$${item.epsEstimate.toFixed(2)}` : '—'}</strong></span>
                                          {isPast && (
                                            <>
                                              <span className="text-gray-300 dark:text-gray-600">|</span>
                                              <span>Act: <strong className={isBeat ? 'text-green-600' : 'text-red-600'}>{`$${item.epsActual.toFixed(2)}`}</strong></span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block mb-0.5">Revenue (รายได้)</span>
                                        <div className="font-semibold flex items-center gap-1.5 text-gray-900 dark:text-white">
                                          <span>Est: <strong className="text-gray-700 dark:text-gray-300">
                                            {item.revenueEstimate ? `$${(item.revenueEstimate / 1e9).toFixed(1)}B` : '—'}
                                          </strong></span>
                                          {isPast && item.revenueActual != null && (
                                            <>
                                              <span className="text-gray-300 dark:text-gray-600">|</span>
                                              <span>Act: <strong className={item.revenueActual >= item.revenueEstimate ? 'text-green-600' : 'text-red-600'}>
                                                {`$${(item.revenueActual / 1e9).toFixed(1)}B`}
                                              </strong></span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* DIVIDENDS TAB CONTENT */}
                {activeTab === 'dividends' && (
                  <>
                    {groupedDividends.length === 0 ? (
                      <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/10 border border-gray-200 dark:border-gray-800/50 rounded-2xl text-gray-500 space-y-2">
                        <p className="text-base">📅 ไม่พบรายการปฏิทินการจ่ายเงินปันผล</p>
                        <p className="text-xs text-gray-500 dark:text-gray-600">ลองขยายช่วงตัวเลือกเวลา หรือพิมพ์คำค้นหาใหม่อีกครั้ง</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {groupedDividends.map((group) => (
                          <div key={group.date} className="space-y-2.5">
                            {/* Date Group Header */}
                            <div className="flex items-center gap-2.5 sticky top-14 bg-white dark:bg-gray-900 py-2.5 z-10">
                              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-905/20 border border-blue-500/10 dark:border-blue-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
                                EX-DATE: {group.date}
                              </span>
                              <span className="text-xs font-bold text-gray-400">
                                ({formatThaiDate(group.date)})
                              </span>
                              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                            </div>

                            {/* Table Layout for Desktop */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden hidden md:block">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-left text-xs text-gray-600 dark:text-gray-500">
                                    <th className="px-4 py-3">หลักทรัพย์</th>
                                    <th className="px-4 py-3">ชื่อบริษัท</th>
                                    <th className="px-4 py-3 text-right">เงินปันผลต่อหุ้น</th>
                                    <th className="px-4 py-3 text-right">Dividend Yield</th>
                                    <th className="px-4 py-3">กำหนดจ่าย (Payment Date)</th>
                                    <th className="px-4 py-3 text-center">คำนวณปันผล</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.items.map((item, idx) => (
                                    <tr 
                                      key={`${item.symbol}-${idx}`}
                                      className="border-b border-gray-200 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                      onClick={() => navigate(`/stock/${item.symbol}`)}
                                    >
                                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white text-base">
                                        {item.symbol}
                                      </td>
                                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                                        {item.name}
                                      </td>
                                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-white">
                                        ${item.amount.toFixed(4)}
                                      </td>
                                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                        {item.yield.toFixed(2)}%
                                      </td>
                                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 font-medium">
                                        {item.payDate}
                                      </td>
                                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          onClick={() => handleSelectCalcStock(item.symbol)}
                                          className="p-1 px-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded transition-all cursor-pointer"
                                        >
                                          คำนวณเงิน
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Card Layout for Mobile */}
                            <div className="grid grid-cols-1 md:hidden gap-3">
                              {group.items.map((item, idx) => (
                                <div 
                                  key={`${item.symbol}-${idx}-mb`}
                                  onClick={() => navigate(`/stock/${item.symbol}`)}
                                  className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/40 hover:border-blue-500/50 rounded-xl p-4 cursor-pointer transition-all space-y-3"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <span className="font-extrabold text-gray-900 dark:text-white text-base">{item.symbol}</span>
                                      <span className="text-[10px] text-gray-500 block">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] text-gray-500 block">Yield</span>
                                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.yield.toFixed(2)}%</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-200 dark:border-gray-800/80 pt-2 text-gray-600 dark:text-gray-400">
                                    <div>
                                      <span className="text-gray-500 text-[10px] block">ปันผลต่อหุ้น</span>
                                      <strong className="text-gray-900 dark:text-white">${item.amount.toFixed(4)}</strong>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-[10px] block">กำหนดจ่ายเงิน</span>
                                      <strong className="text-gray-900 dark:text-white">{item.payDate}</strong>
                                    </div>
                                  </div>

                                  <div className="pt-1 flex" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleSelectCalcStock(item.symbol)}
                                      className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg cursor-pointer"
                                    >
                                      <Calculator size={12} /> เลือกคำนวณปันผลของตนเอง
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

              </div>
            )}
            
          </div>

        </div>

      </div>
    </PageTransition>
  )
}
