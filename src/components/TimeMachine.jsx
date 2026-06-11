import { useState, useEffect } from 'react'
import { Clock, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

const TWELVE_KEY = '1b5540bb3fc342e19f36f8bcffcce177'

export default function TimeMachine({ symbol, currentPrice }) {
  const [oldPrice, setOldPrice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function fetchOldPrice() {
      try {
        const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1week&outputsize=52&apikey=${TWELVE_KEY}`)
        const data = await res.json()
        if (mounted && data.values && data.values.length > 0) {
          // The last element is the oldest data point (approx 1 year ago)
          const oldest = data.values[data.values.length - 1]
          setOldPrice(parseFloat(oldest.close))
        }
      } catch (err) {
        console.error('Time machine fetch error', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchOldPrice()
    return () => { mounted = false }
  }, [symbol])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 rounded-2xl p-5 border border-indigo-700/30 flex items-center justify-center h-full">
        <RefreshCw size={18} className="animate-spin text-indigo-400" />
      </div>
    )
  }

  if (!oldPrice || !currentPrice) {
    return null
  }

  // Calculate if invested 10,000 THB 1 year ago
  const sharesBought = 10000 / oldPrice
  const currentValue = sharesBought * currentPrice
  const profit = currentValue - 10000
  const profitPct = (profit / 10000) * 100

  const isUp = profit >= 0

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 rounded-2xl p-5 border border-indigo-700/30 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-indigo-400" size={18} />
          <h3 className="font-bold text-sm text-indigo-100">Time Machine</h3>
        </div>
        
        <p className="text-xs text-indigo-300 mb-2">ถ้าคุณลงทุน <span className="font-bold text-white">10,000 บาท</span> ใน {symbol} เมื่อ 1 ปีที่แล้ว...</p>
        
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

      <div className="bg-indigo-950/50 rounded-lg p-2.5 text-[10px] text-indigo-200/70 border border-indigo-500/20">
        <div className="flex justify-between mb-1">
          <span>ราคา 1 ปีก่อน: ${oldPrice.toFixed(2)}</span>
          <span>ราคาปัจจุบัน: ${currentPrice.toFixed(2)}</span>
        </div>
        <p className="text-center mt-1 text-[9px] opacity-60">* จำลองผลกำไรจากส่วนต่างราคา (ยังไม่รวมปันผล)</p>
      </div>
    </div>
  )
}
