import { useState, useEffect } from 'react'
import { Clock, TrendingUp, TrendingDown, RefreshCw, Calculator } from 'lucide-react'

const TWELVE_KEY = '1b5540bb3fc342e19f36f8bcffcce177'

export default function TimeMachine({ symbol, currentPrice }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  
  // User Inputs
  const [amountInput, setAmountInput] = useState('10000')
  const [monthsAgo, setMonthsAgo] = useState(12)

  useEffect(() => {
    let mounted = true
    async function fetchHistory() {
      setLoading(true)
      try {
        // Fetch 5 years of monthly data
        const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1month&outputsize=60&apikey=${TWELVE_KEY}`)
        const data = await res.json()
        if (mounted && data.values) {
          setHistory(data.values)
        }
      } catch (err) {
        console.error('Time machine fetch error', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchHistory()
    return () => { mounted = false }
  }, [symbol])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 rounded-2xl p-5 border border-indigo-700/30 flex items-center justify-center h-full min-h-[220px]">
        <RefreshCw size={18} className="animate-spin text-indigo-400" />
      </div>
    )
  }

  if (history.length === 0 || !currentPrice) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 rounded-2xl p-5 border border-indigo-700/30 flex items-center justify-center h-full min-h-[220px]">
        <p className="text-xs text-indigo-400">ไม่มีข้อมูลย้อนหลังเพียงพอ</p>
      </div>
    )
  }

  // Find the appropriate historical price
  // history[0] is most recent month, history[1] is 1 month ago
  const targetIndex = Math.min(monthsAgo, history.length - 1)
  const oldPrice = parseFloat(history[targetIndex].close)
  const oldDate = new Date(history[targetIndex].datetime).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })

  // Calculate
  const investment = parseFloat(amountInput.replace(/,/g, '')) || 0
  const sharesBought = investment / oldPrice
  const currentValue = sharesBought * currentPrice
  const profit = currentValue - investment
  const profitPct = investment > 0 ? (profit / investment) * 100 : 0

  const isUp = profit >= 0

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 rounded-2xl p-5 border border-indigo-700/30 h-full flex flex-col justify-between min-h-[220px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="text-indigo-400" size={18} />
            <h3 className="font-bold text-sm text-indigo-100">Time Machine</h3>
          </div>
          <Calculator size={14} className="text-indigo-400/50" />
        </div>
        
        {/* User Controls */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-xs text-indigo-300">ถ้าลงทุน</span>
          <div className="relative w-24">
            <input 
              type="text"
              value={amountInput}
              onChange={(e) => {
                // Allow only numbers
                const val = e.target.value.replace(/\D/g, '')
                setAmountInput(val ? parseInt(val).toLocaleString() : '')
              }}
              className="bg-indigo-950/50 border border-indigo-500/30 text-white text-xs font-bold rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-400 text-right pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-indigo-400">฿</span>
          </div>
          <span className="text-xs text-indigo-300">เมื่อ</span>
          <select 
            value={monthsAgo}
            onChange={(e) => setMonthsAgo(parseInt(e.target.value))}
            className="bg-indigo-950/50 border border-indigo-500/30 text-white text-xs font-bold rounded px-2 py-1 focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            <option value={6}>6 เดือนที่แล้ว</option>
            <option value={12}>1 ปีที่แล้ว</option>
            <option value={36}>3 ปีที่แล้ว</option>
            <option value={60}>5 ปีที่แล้ว</option>
          </select>
        </div>
        
        <div className="mb-4">
          <span className="text-xs text-indigo-300">วันนี้คุณจะมีเงิน:</span>
          <div className="flex items-end gap-2 mt-1">
            <span className={`text-3xl font-black ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              ฿{currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className={`text-sm font-bold flex items-center mb-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              {isUp ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
              {Math.abs(profitPct).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-indigo-950/50 rounded-lg p-2.5 text-[10px] text-indigo-200/70 border border-indigo-500/20 mt-2">
        <div className="flex justify-between mb-1">
          <span>ราคา {oldDate}: ${oldPrice.toFixed(2)}</span>
          <span>ราคาปัจจุบัน: ${currentPrice.toFixed(2)}</span>
        </div>
        <p className="text-center mt-1 text-[9px] opacity-60">* จำลองผลกำไรจากส่วนต่างราคา (ยังไม่รวมปันผล)</p>
      </div>
    </div>
  )
}
