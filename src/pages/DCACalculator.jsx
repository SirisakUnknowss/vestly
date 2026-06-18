import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calculator, 
  ArrowLeft, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  TrendingDown, 
  Calendar,
  Sparkles,
  Info,
  HelpCircle,
  X
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend
} from 'recharts'
import PageTransition from '../components/PageTransition'
import { STOCKS_DB } from '../data/stocksDB'

// Twelve Data API Key from StockDetail
const TWELVE_KEY = '1b5540bb3fc342e19f36f8bcffcce177'

// Popular stocks for quick selection with estimated historical CAGR (for fallback simulator)
const DCA_PRESETS = [
  { symbol: 'NVDA', name: 'NVIDIA', cagr: 0.65, startPrice: 12 },
  { symbol: 'AAPL', name: 'Apple', cagr: 0.22, startPrice: 50 },
  { symbol: 'MSFT', name: 'Microsoft', cagr: 0.20, startPrice: 130 },
  { symbol: 'AMZN', name: 'Amazon', cagr: 0.15, startPrice: 85 },
  { symbol: 'TSLA', name: 'Tesla', cagr: 0.35, startPrice: 40 },
  { symbol: 'O', name: 'Realty Income (ปันผลสูง)', cagr: 0.03, startPrice: 55 },
  { symbol: 'KO', name: 'Coca-Cola (มั่นคง)', cagr: 0.06, startPrice: 45 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', cagr: 0.05, startPrice: 125 },
]

export default function DCACalculator() {
  const navigate = useNavigate()
  
  // Input states
  const [symbol, setSymbol] = useState('NVDA')
  const [monthlyAmount, setMonthlyAmount] = useState('100')
  const [timeframeYears, setTimeframeYears] = useState('3') // '1' | '3' | '5'
  
  // App States
  const [chartData, setChartData] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSimulated, setIsSimulated] = useState(false)
  const [error, setError] = useState(null)

  // Auto-complete or manual ticker state
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Resolve Stock Info
  const stockName = useMemo(() => {
    const dbMatch = STOCKS_DB.find(s => s.s === symbol)
    if (dbMatch) return dbMatch.n
    const presetMatch = DCA_PRESETS.find(p => p.symbol === symbol)
    if (presetMatch) return presetMatch.name
    return symbol
  }, [symbol])

  // Dynamic simulation fallback when API fails or for offline mode
  const runSimulatedBacktest = useCallback((sym, amount, years) => {
    setIsSimulated(true)
    const monthsCount = parseInt(years) * 12
    const preset = DCA_PRESETS.find(p => p.symbol === sym) || { cagr: 0.12, startPrice: 100 }
    
    // Convert annual CAGR to monthly compound rate
    const monthlyRate = Math.pow(1 + preset.cagr, 1 / 12) - 1
    
    let currentPrice = preset.startPrice
    let totalInvested = 0
    let totalShares = 0
    const simulatedData = []
    
    const now = new Date()
    
    for (let i = 0; i < monthsCount; i++) {
      // Backwards dates
      const eventDate = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1 - i), 1)
      const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      
      // Calculate price with compounding growth and randomized market fluctuations
      const randomNoise = (Math.random() - 0.48) * 0.12 // -5.7% to +6.2% fluctuations
      currentPrice = currentPrice * (1 + monthlyRate + randomNoise)
      if (currentPrice < 1) currentPrice = 1 // Floor price
      
      // Invest monthly
      totalInvested += amount
      const sharesBought = amount / currentPrice
      totalShares += sharesBought
      
      const portfolioValue = totalShares * currentPrice
      const profitLoss = portfolioValue - totalInvested
      
      simulatedData.push({
        date: dateStr,
        price: currentPrice,
        invested: totalInvested,
        portfolioValue: Math.round(portfolioValue),
        sharesBought,
        totalShares,
      })
    }
    
    const finalValue = totalShares * currentPrice
    const totalReturn = ((finalValue - totalInvested) / totalInvested) * 100
    
    // Lump Sum comparison
    const lumpSumShares = (amount * monthsCount) / simulatedData[0].price
    const finalLumpSumValue = lumpSumShares * currentPrice
    const lumpSumReturn = ((finalLumpSumValue - (amount * monthsCount)) / (amount * monthsCount)) * 100
    
    setChartData(simulatedData)
    setResults({
      totalInvested,
      finalValue,
      profitLoss: finalValue - totalInvested,
      totalReturn,
      totalShares,
      cagr: preset.cagr * 100,
      lumpSumValue: finalLumpSumValue,
      lumpSumReturn,
    })
  }, [])

  // Run the backtest using API data or Fallback
  const calculateDCA = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsSimulated(false)
    
    const amount = parseFloat(monthlyAmount) || 100
    const years = parseInt(timeframeYears) || 3
    const monthsCount = years * 12
    
    try {
      // 1. Fetch monthly history from Twelve Data
      const response = await fetch(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1month&outputsize=${monthsCount + 2}&apikey=${TWELVE_KEY}`
      )
      const data = await response.json()
      
      if (data && data.values && data.values.length > 0) {
        // Sort ascending (oldest first)
        const rawValues = data.values.reverse().slice(0, monthsCount)
        
        let totalInvested = 0
        let totalShares = 0
        const backtestData = []
        
        rawValues.forEach((val) => {
          const price = parseFloat(val.close)
          const date = new Date(val.datetime)
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          
          totalInvested += amount
          const sharesBought = amount / price
          totalShares += sharesBought
          
          const portfolioValue = totalShares * price
          
          backtestData.push({
            date: dateStr,
            price,
            invested: totalInvested,
            portfolioValue: Math.round(portfolioValue),
            sharesBought,
            totalShares,
          })
        })
        
        const finalPrice = backtestData[backtestData.length - 1].price
        const finalValue = totalShares * finalPrice
        const totalReturn = ((finalValue - totalInvested) / totalInvested) * 100
        
        // Lump Sum comparison
        const lumpSumShares = (amount * monthsCount) / backtestData[0].price
        const finalLumpSumValue = lumpSumShares * finalPrice
        const lumpSumReturn = ((finalLumpSumValue - (amount * monthsCount)) / (amount * monthsCount)) * 100
        
        setChartData(backtestData)
        setResults({
          totalInvested,
          finalValue,
          profitLoss: finalValue - totalInvested,
          totalReturn,
          totalShares,
          lumpSumValue: finalLumpSumValue,
          lumpSumReturn,
        })
      } else {
        // Fallback to simulation if Twelve Data returns error
        runSimulatedBacktest(symbol, amount, timeframeYears)
      }
    } catch (err) {
      runSimulatedBacktest(symbol, amount, timeframeYears)
    } finally {
      setLoading(false)
    }
  }, [symbol, monthlyAmount, timeframeYears, runSimulatedBacktest])

  // Run initial backtest on load
  useEffect(() => {
    calculateDCA()
  }, [])

  // Auto-complete matching
  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const lower = searchQuery.toLowerCase()
    return STOCKS_DB.filter(
      st => st.s.toLowerCase().includes(lower) || st.n.toLowerCase().includes(lower)
    ).slice(0, 8)
  }, [searchQuery])

  const handleSelectSearchResult = (sym) => {
    setSymbol(sym)
    setSearchQuery('')
    setShowDropdown(false)
  }

  // Quick stats styling helpers
  const isProfit = results?.profitLoss >= 0

  return (
    <PageTransition className="min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        
        {/* Breadcrumb */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Markets
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
              <Calculator size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">DCA Calculator</h1>
              <p className="text-sm text-gray-400 mt-1">
                จำลองการลงทุนแบบถัวเฉลี่ยรายเดือน (Dollar-Cost Averaging) ย้อนหลัง เพื่อวิเคราะห์พฤติกรรมการเติบโตเมื่อลงทุนอย่างมีวินัย
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Form Settings */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5 space-y-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2 flex items-center justify-between">
                <span>ตั้งค่าจำลองแผนออม</span>
                {isSimulated && (
                  <span className="text-[9px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                    Compounded Sim
                  </span>
                )}
              </h3>

              {/* Ticker Search & Select */}
              <div className="space-y-2 relative">
                <label className="text-xs text-gray-400 block font-semibold">เลือกหุ้นเป้าหมาย</label>
                
                {/* Popular Presets */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {DCA_PRESETS.map((preset) => (
                    <button
                      key={preset.symbol}
                      onClick={() => setSymbol(preset.symbol)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                        symbol === preset.symbol
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                          : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'
                      }`}
                    >
                      {preset.symbol}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={`ค้นหาหุ้นอื่น ๆ (ปัจจุบัน: ${symbol})`}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 placeholder-gray-600"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => {
                        setSearchQuery('')
                        setShowDropdown(false)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Dropdown list */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto">
                    {searchResults.map(st => (
                      <button
                        key={st.s}
                        onClick={() => handleSelectSearchResult(st.s)}
                        className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-900 hover:text-white border-b border-gray-700/40 last:border-0 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-white mr-1.5">{st.s}</strong>
                          <span className="text-[10px] text-gray-500">{st.n}</span>
                        </div>
                        <span className="text-[9px] bg-gray-900 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700">
                          {st.sec}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery && searchResults.length === 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3 text-xs text-gray-500 text-center z-50">
                    ไม่พบสัญลักษณ์หุ้นนี้ในระบบ
                  </div>
                )}
                {showDropdown && (
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                )}
              </div>

              {/* Monthly Invest Amount */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 block font-semibold">ยอดออมสะสมรายเดือน ($)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="10"
                    max="100000"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex gap-1.5 mt-2">
                  {['50', '100', '200', '500'].map(val => (
                    <button
                      key={val}
                      onClick={() => setMonthlyAmount(val)}
                      className="flex-1 text-[11px] py-1 bg-gray-900 text-gray-400 hover:text-white rounded border border-gray-800 hover:border-gray-700 font-medium"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 block font-semibold">ระยะเวลาการออมหุ้น</label>
                <div className="flex bg-gray-900 border border-gray-700 rounded-xl p-1 gap-1">
                  {[
                    { id: '1', label: '1 ปี (12 ด.)' },
                    { id: '3', label: '3 ปี (36 ด.)' },
                    { id: '5', label: '5 ปี (60 ด.)' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTimeframeYears(t.id)}
                      className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${
                        timeframeYears === t.id
                          ? 'bg-teal-600 text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateDCA}
                disabled={loading}
                className="w-full btn-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> กำลังคำนวณ...
                  </>
                ) : (
                  <>
                    <Calculator size={16} /> เริ่มจำลองแผนลงทุน
                  </>
                )}
              </button>
            </div>

            {/* Simulated Disclaimer Banner */}
            {isSimulated && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3.5 text-xs text-yellow-400/90 leading-relaxed flex items-start gap-2">
                <Info size={15} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5 text-yellow-300">💡 ข้อมูลแบบจำลองทางสถิติ</strong>
                  ขณะนี้กำลังใช้งานข้อมูลประวัติผลประกอบการจำลอง (CAGR) ของสัญลักษณ์ {symbol} เนื่องจากข้อจำกัดอัตราดึงข้อมูล API แผนภูมินี้คำนวณตามการสุ่มแนวโน้มราคาตลาดจริงในอดีต
                </div>
              </div>
            )}

            {/* Beginner Education */}
            <div className="bg-gray-800/10 border border-gray-800/60 rounded-xl p-4 text-xs text-gray-500 space-y-2 leading-relaxed">
              <span className="font-semibold text-gray-400 flex items-center gap-1">
                <Sparkles size={12} className="text-yellow-400" /> DCA คืออะไร?
              </span>
              <p>
                <strong className="text-gray-400">Dollar-Cost Averaging</strong> คือ การลงทุนด้วยการหยอดออมจำนวนเงินเท่าเดิมสม่ำเสมอทุกงวด โดยไม่สนใจราคาหุ้นในช่วงนั้น 
              </p>
              <p>
                วิธีนี้จะช่วยขจัดความตื่นตระหนกทางจิตวิทยาในการซื้อผิดเวลา โดยเมื่อหุ้นราคาตก คุณจะได้จำนวนหุ้นมากขึ้น และเมื่อหุ้นราคาแพงขึ้น คุณจะซื้อได้น้อยลง ส่งผลให้ได้ <strong className="text-gray-400">ต้นทุนเฉลี่ยต่ำลง</strong> ในระยะยาว เหมาะอย่างยิ่งสำหรับผู้ที่ต้องการออมสร้างทรัพย์สินเพื่อเกษียณ
              </p>
            </div>
          </div>

          {/* Right Column: Chart & Visuals */}
          <div className="lg:col-span-8 space-y-5">
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-32 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-2xl">
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mb-3" />
                <p className="text-sm text-gray-400">กำลังประมวลผลประวัติราคาย้อนหลัง...</p>
              </div>
            )}

            {!loading && results && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'ยอดออมสะสมทั้งหมด', value: `$${results.totalInvested.toLocaleString()}`, color: 'text-gray-400' },
                    { label: 'มูลค่าพอร์ตสุดท้าย', value: `$${Math.round(results.finalValue).toLocaleString()}`, color: 'text-white font-extrabold' },
                    { 
                      label: 'กำไร / ขาดทุนสะสม', 
                      value: `${isProfit ? '+' : ''}$${Math.round(results.profitLoss).toLocaleString()}`, 
                      color: isProfit ? 'text-green-400 font-extrabold' : 'text-red-400 font-extrabold',
                      icon: isProfit ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />
                    },
                    { 
                      label: 'อัตราผลตอบแทนเฉลี่ย', 
                      value: `${isProfit ? '+' : ''}${results.totalReturn.toFixed(2)}%`, 
                      color: isProfit ? 'text-green-300 font-black' : 'text-red-300 font-black' 
                    },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                      <span className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wider">{stat.label}</span>
                      <span className={`text-base md:text-lg block ${stat.color}`}>
                        {stat.icon}{stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Backtest Recharts area chart */}
                <div className="bg-gray-800/25 border border-gray-700/40 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <Calendar size={15} /> กราฟสรุปผลการเติบโต: {symbol} ({stockName})
                  </h3>
                  
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#6b7280', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fill: '#6b7280', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const data = payload[0].payload
                            return (
                              <div className="bg-gray-900 border border-gray-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                                <p className="text-gray-500 font-bold mb-1 border-b border-gray-800 pb-1">{data.date}</p>
                                <p className="text-blue-400">ลงทุนสะสม: <strong className="text-white">${data.invested.toLocaleString()}</strong></p>
                                <p className="text-green-400">มูลค่าพอร์ต: <strong className="text-white">${data.portfolioValue.toLocaleString()}</strong></p>
                                <p className="text-gray-400">ราคาหุ้น: <strong className="text-white">${data.price.toFixed(2)}</strong></p>
                                <p className="text-gray-400">สะสมแล้ว: <strong className="text-white">{data.totalShares.toFixed(2)} หุ้น</strong></p>
                              </div>
                            )
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          name="มูลค่าพอร์ต (Portfolio Value)" 
                          dataKey="portfolioValue" 
                          stroke="#22c55e" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                        <Area 
                          type="monotone" 
                          name="ยอดออมสะสม (Invested Cash)" 
                          dataKey="invested" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorInvest)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Strategy Comparison Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* DCA Performance */}
                  <div className="bg-gradient-to-br from-emerald-950/20 to-gray-800/40 border border-emerald-800/30 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-emerald-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                      <span>แผนแบบ DCA (สะสมรายเดือน)</span>
                      <span className="text-xs text-white">⭐ แนะนำ</span>
                    </h4>
                    <ul className="space-y-2.5 text-xs text-gray-400">
                      <li className="flex justify-between">
                        <span>ยอดออมสะสมรวม:</span>
                        <strong className="text-white">${results.totalInvested.toLocaleString()}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>จำนวนหุ้นสะสมสำเร็จ:</span>
                        <strong className="text-white">{results.totalShares.toFixed(2)} หุ้น</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>ราคาซื้อถัวเฉลี่ยต่อหุ้น:</span>
                        <strong className="text-white">${(results.totalInvested / results.totalShares).toFixed(2)}</strong>
                      </li>
                      <li className="flex justify-between border-t border-gray-800/80 pt-2 font-bold text-sm">
                        <span className="text-emerald-300">ผลลัพธ์สุดท้าย:</span>
                        <span className="text-white">${Math.round(results.finalValue).toLocaleString()} ({isProfit ? '+' : ''}{results.totalReturn.toFixed(1)}%)</span>
                      </li>
                    </ul>
                  </div>

                  {/* Lump Sum Comparison */}
                  <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                      แผนแบบ Lump Sum (ซื้อก้อนเดียวก่อนเริ่ม)
                    </h4>
                    <ul className="space-y-2.5 text-xs text-gray-400">
                      <li className="flex justify-between">
                        <span>ยอดซื้อก้อนเดียว:</span>
                        <strong className="text-white">${results.totalInvested.toLocaleString()}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>จำนวนหุ้นรวมที่ได้:</span>
                        <strong className="text-white">
                          {((results.totalInvested) / (chartData[0]?.price || 1)).toFixed(2)} หุ้น
                        </strong>
                      </li>
                      <li className="flex justify-between">
                        <span>ราคาที่เข้าซื้อตอนแรก:</span>
                        <strong className="text-white">${chartData[0]?.price?.toFixed(2)}</strong>
                      </li>
                      <li className="flex justify-between border-t border-gray-800/80 pt-2 font-bold text-sm">
                        <span>ผลลัพธ์สุดท้าย:</span>
                        <span className="text-white">${Math.round(results.lumpSumValue).toLocaleString()} ({results.lumpSumReturn >= 0 ? '+' : ''}{results.lumpSumReturn.toFixed(1)}%)</span>
                      </li>
                    </ul>
                  </div>

                </div>
              </>
            )}

          </div>

        </div>

      </div>
    </PageTransition>
  )
}
