import { Activity, TrendingUp, DollarSign, BarChart3 } from 'lucide-react'

export default function HealthScore({ quote, profile, divMetric, lynchCat, sentimentData }) {
  let score = 50 // Base score

  const reasons = []

  // 1. P/E Ratio
  const pe = profile?.metric?.peBasicExclExtraTTM || profile?.metric?.peNormalizedAnnual
  if (pe) {
    if (pe < 15) { score += 20; reasons.push('P/E ต่ำ (คืนทุนไว)') }
    else if (pe < 25) { score += 10; reasons.push('P/E ระดับกลาง') }
    else if (pe > 40) { score -= 15; reasons.push('P/E ค่อนข้างสูง (ราคาแพง)') }
  }

  // 2. Dividend
  const yieldTTM = divMetric?.yieldTTM
  if (yieldTTM > 3) { score += 20; reasons.push('ปันผลสูง (>3%)') }
  else if (yieldTTM > 0) { score += 10; reasons.push('มีการจ่ายปันผล') }

  // 3. Peter Lynch
  if (lynchCat === 'Stalwart' || lynchCat === 'Fast Grower') {
    score += 15
    reasons.push(lynchCat === 'Stalwart' ? 'บริษัทแข็งแกร่ง' : 'เติบโตสูง')
  } else if (lynchCat === 'Turnaround' || lynchCat === 'Asset Play') {
    score -= 10
    reasons.push('มีความเสี่ยง/ซับซ้อน')
  }

  // 4. Sentiment (News)
  if (sentimentData?.sentiment?.bullishPercent > 0.6) {
    score += 15
    reasons.push('ข่าวช่วงนี้เป็นเชิงบวก')
  } else if (sentimentData?.sentiment?.bearishPercent > 0.5) {
    score -= 15
    reasons.push('ข่าวช่วงนี้เป็นเชิงลบ')
  }

  // 5. Short term trend
  if (quote?.c > quote?.pc) {
    score += 10
  } else {
    score -= 5
  }

  // Cap score 0-100
  score = Math.max(0, Math.min(100, score))

  let statusText = 'ปานกลาง'
  let colorClass = 'text-yellow-400'
  let bgClass = 'bg-yellow-500/20'
  let progressClass = 'bg-yellow-400'

  if (score >= 75) {
    statusText = 'ดีเยี่ยม'
    colorClass = 'text-green-400'
    bgClass = 'bg-green-500/20'
    progressClass = 'bg-green-400'
  } else if (score <= 40) {
    statusText = 'ต้องระวัง'
    colorClass = 'text-red-400'
    bgClass = 'bg-red-500/20'
    progressClass = 'bg-red-400'
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="text-pink-400" size={18} />
          <h3 className="font-bold text-sm">สุขภาพหุ้น (Health Score)</h3>
        </div>
        
        <div className="flex items-end gap-3 mb-4">
          <span className={`text-5xl font-black ${colorClass}`}>{score}</span>
          <span className="text-gray-400 mb-1.5 font-medium">/ 100</span>
          <span className={`px-2 py-1 rounded text-xs font-bold mb-2 ml-auto ${colorClass} ${bgClass}`}>
            {statusText}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4 overflow-hidden">
          <div className={`h-2.5 rounded-full ${progressClass} transition-all duration-1000`} style={{ width: `${score}%` }}></div>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">ปัจจัยหลัก:</p>
        <div className="flex flex-wrap gap-1.5">
          {reasons.slice(0, 4).map((r, i) => (
            <span key={i} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-1 rounded-md">
              {r}
            </span>
          ))}
          {reasons.length === 0 && <span className="text-[10px] text-gray-500">ไม่มีข้อมูลเพียงพอ</span>}
        </div>
      </div>
    </div>
  )
}
