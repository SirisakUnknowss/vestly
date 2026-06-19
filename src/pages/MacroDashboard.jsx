import React, { useState, useEffect, useMemo } from 'react'
import {
  Globe, TrendingUp, TrendingDown, Minus, RefreshCw,
  DollarSign, Percent, BarChart3, Activity, Shield,
  ArrowUpRight, ArrowDownRight, Info, Landmark, Gauge, Fuel
} from 'lucide-react'
import PageTransition from '../components/PageTransition'

const TWELVE_KEY = '1b5540bb3fc342e19f36f8bcffcce177'
const TWELVE_BASE = 'https://api.twelvedata.com'

// ── Macro Indicator Definitions ─────────────────────────────
const MACRO_INDICATORS = [
  {
    id: 'spy',
    label: 'S&P 500 (SPY)',
    desc: 'ดัชนีตลาดหุ้นสหรัฐ 500 บริษัทใหญ่',
    symbol: 'SPY',
    type: 'etf',
    icon: BarChart3,
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    format: 'price',
  },
  {
    id: 'qqq',
    label: 'Nasdaq 100 (QQQ)',
    desc: 'ดัชนีหุ้นเทคโนโลยี 100 บริษัท',
    symbol: 'QQQ',
    type: 'etf',
    icon: Activity,
    color: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-400',
    format: 'price',
  },
  {
    id: 'dia',
    label: 'Dow Jones (DIA)',
    desc: 'ดัชนีอุตสาหกรรม 30 บริษัท Blue-Chip',
    symbol: 'DIA',
    type: 'etf',
    icon: Landmark,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    format: 'price',
  },
  {
    id: 'dxy',
    label: 'US Dollar Index (UUP)',
    desc: 'ความแข็งค่าของเงินดอลลาร์สหรัฐ',
    symbol: 'UUP',
    type: 'etf',
    icon: DollarSign,
    color: 'from-emerald-500 to-green-600',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    format: 'price',
  },
  {
    id: 'vix',
    label: 'VIX (VIXY)',
    desc: 'ดัชนีความกลัว — ความผันผวนตลาด',
    symbol: 'VIXY',
    type: 'etf',
    icon: Gauge,
    color: 'from-red-500 to-rose-600',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    format: 'price',
  },
  {
    id: 'tlt',
    label: '20Y+ Treasury (TLT)',
    desc: 'พันธบัตรรัฐบาลสหรัฐอายุ 20 ปีขึ้นไป',
    symbol: 'TLT',
    type: 'etf',
    icon: Shield,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    format: 'price',
  },
  {
    id: 'gold',
    label: 'Gold (GLD)',
    desc: 'ราคาทองคำ — สินทรัพย์ปลอดภัย',
    symbol: 'GLD',
    type: 'etf',
    icon: DollarSign,
    color: 'from-yellow-500 to-amber-600',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    format: 'price',
  },
  {
    id: 'oil',
    label: 'Crude Oil (USO)',
    desc: 'ราคาน้ำมันดิบ WTI',
    symbol: 'USO',
    type: 'etf',
    icon: Fuel,
    color: 'from-orange-500 to-red-600',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    format: 'price',
  },
]

// ── Static macro context (educational) ──────────────────────
const MACRO_CONTEXT = {
  fedRate: { label: 'Fed Funds Rate', value: '5.25 – 5.50%', trend: 'stable', desc: 'อัตราดอกเบี้ยนโยบาย Fed (ล่าสุด)' },
  cpi: { label: 'CPI Inflation (YoY)', value: '~3.3%', trend: 'down', desc: 'อัตราเงินเฟ้อผู้บริโภค เทียบปีก่อน' },
  gdp: { label: 'GDP Growth (Q1 2024)', value: '~1.6%', trend: 'down', desc: 'อัตราการเติบโต GDP สหรัฐ (ประมาณการ)' },
  unemployment: { label: 'Unemployment Rate', value: '~4.0%', trend: 'up', desc: 'อัตราว่างงานสหรัฐ' },
}

function TrendArrow({ trend }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-400" />
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-yellow-400" />
}

export default function MacroDashboard() {
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  // ── Fetch all macro quotes ─────────────────────────────
  const fetchQuotes = async () => {
    setLoading(true)
    const results = {}
    const FINNHUB_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'

    // Fetch quotes using Finnhub in parallel
    await Promise.all(
      MACRO_INDICATORS.map(async (ind) => {
        try {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ind.symbol}&token=${FINNHUB_KEY}`)
          const data = await res.json()
          if (data.c) {
            results[ind.id] = {
              price: data.c,
              change: data.d,
              changePct: data.dp,
              prevClose: data.pc,
              high: data.h,
              low: data.l,
            }
          }
        } catch {}
      })
    )

    setQuotes(results)
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Globe size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Macro Dashboard</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">ภาพรวมเศรษฐกิจโลก & ตลาดสำคัญ</p>
            </div>
          </div>
          <button
            onClick={fetchQuotes}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── US Macro Context (Static Educational) ── */}
        <div className="bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Landmark size={12} /> ตัวชี้วัดเศรษฐกิจสหรัฐ (อ้างอิง)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(MACRO_CONTEXT).map(([key, item]) => (
              <div
                key={key}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{item.label}</span>
                  <TrendArrow trend={item.trend} />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1">
            <Info size={10} /> ข้อมูลอ้างอิงทั่วไป อาจไม่ใช่ค่าเรียลไทม์ กรุณาตรวจสอบจากแหล่งข้อมูลทางการ (Fed, BLS)
          </p>
        </div>

        {/* ── Real-Time Market Cards ── */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity size={12} /> ตลาดสำคัญ (เรียลไทม์)
          </h3>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-3" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MACRO_INDICATORS.map(ind => {
                const q = quotes[ind.id]
                const isUp = q && q.change >= 0
                const Icon = ind.icon

                return (
                  <div
                    key={ind.id}
                    className={`group relative bg-white dark:bg-gray-900/40 rounded-xl border ${ind.borderColor} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden`}
                  >
                    {/* Subtle glow */}
                    <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${ind.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 bg-gradient-to-br ${ind.color} rounded-lg flex items-center justify-center shadow-md`}>
                            <Icon size={14} className="text-white" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white">{ind.label}</h4>
                            <p className="text-[9px] text-gray-400">{ind.desc}</p>
                          </div>
                        </div>
                      </div>

                      {q ? (
                        <>
                          <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            ${q.price.toFixed(2)}
                          </p>
                          <div className={`flex items-center gap-1.5 mt-1 text-sm font-semibold ${isUp ? 'text-emerald-500' : 'text-red-400'}`}>
                            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            <span>{isUp ? '+' : ''}{q.change?.toFixed(2)}</span>
                            <span className="text-xs opacity-80">({isUp ? '+' : ''}{q.changePct?.toFixed(2)}%)</span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                            <span>H <span className="text-gray-700 dark:text-gray-300 font-semibold">${q.high?.toFixed(2)}</span></span>
                            <span>L <span className="text-gray-700 dark:text-gray-300 font-semibold">${q.low?.toFixed(2)}</span></span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Market Interpretation Guide ── */}
        <div className="bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Info size={14} className="text-cyan-400" />
            วิธีอ่าน Macro Dashboard
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">📈 SPY, QQQ, DIA</p>
                <p>ดัชนีตลาดหุ้นหลัก — ถ้าขึ้นพร้อมกัน แสดงว่าตลาดมีแนวโน้มบวก (Risk-On)</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">📊 VIX (VIXY)</p>
                <p>ดัชนีความกลัว ถ้าสูง แสดงว่านักลงทุนกังวล ถ้าต่ำ แปลว่าตลาดมั่นใจ</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">🛡️ TLT & Gold</p>
                <p>สินทรัพย์ปลอดภัย — ถ้าราคาขึ้น แสดงว่านักลงทุนหนีความเสี่ยง (Risk-Off)</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">💵 Dollar & Oil</p>
                <p>ดอลลาร์แข็ง กดทำให้กำไรบริษัทข้ามชาติลด น้ำมันสูง เพิ่มต้นทุนการผลิต</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Last Updated ── */}
        {lastUpdated && (
          <p className="text-[10px] text-gray-400 text-center">
            อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH')}
          </p>
        )}

        {/* ── Disclaimer ── */}
        <div className="flex items-start gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] text-gray-500">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>ข้อมูลเศรษฐกิจอ้างอิงทั่วไป อาจไม่ใช่ค่าเรียลไทม์ ข้อมูลตลาดจาก Finnhub API ใช้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน</span>
        </div>

      </div>
    </PageTransition>
  )
}
