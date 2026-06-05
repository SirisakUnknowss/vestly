import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target, ChevronDown, ChevronUp, TrendingDown, TrendingUp,
  RefreshCw, CheckCircle, XCircle, AlertCircle, BarChart2,
  Zap, Shield, Eye, AlertTriangle, ChevronRight, Info
} from 'lucide-react'
import { STOCKS_DB } from '../data/stocksDB'

const API_KEY = 'd8fg29hr01qn4439pm7gd8fg29hr01qn4439pm80'

// ── SWOT Engine ────────────────────────────────────────────────────
function generateSWOT(m, stock) {
  const strengths = [], weaknesses = [], opportunities = [], threats = []
  const rev5  = m.revenueGrowth5Y    ?? m.revenueGrowth3Y ?? null
  const eps5  = m.epsGrowth5Y        ?? m.epsGrowth3Y ?? null
  const roe   = m.roeTTM             ?? null
  const de    = m.debtEquityAnnual   ?? null
  const gm    = m.grossMarginTTM     ?? null
  const pe    = m.peNormalizedAnnual ?? null
  const pb    = m.pbAnnual           ?? null
  const cr    = m.currentRatioAnnual ?? null
  const div5  = m.dividendGrowthRate5Y ?? null
  const drop  = m._dropPct           ?? null

  // ── STRENGTHS ──
  if (roe   >  15)  strengths.push({ text: `ROE สูง ${roe.toFixed(1)}% — ใช้ทุนมีประสิทธิภาพ`, score: 2 })
  if (roe   >  30)  strengths.push({ text: `ROE ดีเยี่ยม ${roe.toFixed(1)}% — Competitive moat แข็งแกร่ง`, score: 2 })
  if (rev5  >  10)  strengths.push({ text: `รายได้เติบโต 5Y: +${rev5.toFixed(1)}%/yr — Top-line momentum ดี`, score: 2 })
  if (eps5  >  10)  strengths.push({ text: `EPS เติบโต 5Y: +${eps5.toFixed(1)}%/yr — กำไรต่อหุ้นเพิ่มสม่ำเสมอ`, score: 2 })
  if (gm    >  40)  strengths.push({ text: `Gross margin ${gm.toFixed(1)}% — Pricing power สูง`, score: 1 })
  if (gm    >  60)  strengths.push({ text: `Gross margin ${gm.toFixed(1)}% — Software-like economics`, score: 2 })
  if (de    !== null && de < 0.5) strengths.push({ text: `D/E ต่ำ ${de.toFixed(2)} — ฐานะการเงินแข็งแกร่ง`, score: 2 })
  if (de    !== null && de < 1)   strengths.push({ text: `Debt/Equity ${de.toFixed(2)} — หนี้อยู่ในระดับจัดการได้`, score: 1 })
  if (cr    >  1.5) strengths.push({ text: `Current ratio ${cr.toFixed(2)} — Liquidity ดี`, score: 1 })
  if (div5  >  5)   strengths.push({ text: `ปันผลเติบโต 5Y: +${div5.toFixed(1)}%/yr — Dividend growth แข็งแกร่ง`, score: 1 })
  if (stock.cap === 'Large') strengths.push({ text: 'Large cap — Scale ใหญ่ ทนแรงกดดันตลาดได้ดี', score: 1 })

  // ── WEAKNESSES ──
  if (roe   !== null && roe < 8)   weaknesses.push({ text: `ROE ต่ำ ${roe.toFixed(1)}% — ใช้ทุนไม่มีประสิทธิภาพ`, score: -2 })
  if (rev5  !== null && rev5 < 0)  weaknesses.push({ text: `รายได้ลดลง ${rev5.toFixed(1)}%/yr — Top-line กำลังหด`, score: -2 })
  if (rev5  !== null && rev5 < 3 && rev5 >= 0) weaknesses.push({ text: `รายได้โตช้า ${rev5.toFixed(1)}%/yr — ใกล้ระดับ stagnant`, score: -1 })
  if (eps5  !== null && eps5 < 0)  weaknesses.push({ text: `EPS ลดลง ${eps5.toFixed(1)}%/yr — กำไรต่อหุ้นถดถอย`, score: -2 })
  if (de    !== null && de > 2)    weaknesses.push({ text: `D/E สูง ${de.toFixed(2)} — ภาระหนี้มาก`, score: -2 })
  if (de    !== null && de > 3)    weaknesses.push({ text: `D/E ${de.toFixed(2)} — ความเสี่ยงฐานะการเงิน`, score: -2 })
  if (gm    !== null && gm < 20)   weaknesses.push({ text: `Gross margin ต่ำ ${gm.toFixed(1)}% — ถูกกดดันด้านราคา`, score: -1 })
  if (cr    !== null && cr < 1)    weaknesses.push({ text: `Current ratio ${cr.toFixed(2)} — Liquidity ตึงตัว`, score: -1 })
  if (m.epsAnnual !== null && m.epsAnnual < 0) weaknesses.push({ text: 'EPS ติดลบ — ขาดทุน', score: -3 })

  // ── OPPORTUNITIES ──
  if (drop  !== null && drop <= -20) opportunities.push({ text: `ราคาร่วงจาก ATH ${drop.toFixed(1)}% — Valuation compression เปิดโอกาสซื้อ`, score: 2 })
  if (pe    !== null && pe > 0 && pe < 15) opportunities.push({ text: `P/E ${pe.toFixed(1)} — ต่ำกว่าค่าเฉลี่ยตลาด S&P 500 (~21x)`, score: 2 })
  if (pe    !== null && pe > 0 && pe < 10) opportunities.push({ text: `P/E ${pe.toFixed(1)} — Deep value territory`, score: 2 })
  if (pb    !== null && pb > 0 && pb < 2)  opportunities.push({ text: `P/B ${pb.toFixed(2)} — ราคาใกล้มูลค่าตามบัญชี`, score: 1 })
  if (div5  > 0) opportunities.push({ text: 'จ่ายปันผลสม่ำเสมอ — รองรับการถือระยะยาว', score: 1 })
  const growthSectors = ['Technology','Healthcare','Communication']
  if (growthSectors.includes(stock.sec)) opportunities.push({ text: `Sector ${stock.sec} — อยู่ใน megatrend ระยะยาว`, score: 1 })
  if (rev5 > 0 && pe > 0 && pe < 20) opportunities.push({ text: 'รายได้โตต่อเนื่อง + valuation สมเหตุสมผล — Growth at reasonable price', score: 2 })

  // ── THREATS ──
  if (pe    !== null && pe > 40)   threats.push({ text: `P/E ${pe.toFixed(1)} — ยังแพงแม้ราคาร่วง ต้องระวัง further de-rating`, score: -2 })
  if (pe    !== null && pe > 60)   threats.push({ text: `P/E ${pe.toFixed(1)} — Expensive ต้องการ growth สูงมากเพื่อ justify ราคา`, score: -2 })
  if (de    !== null && de > 1.5)  threats.push({ text: `หนี้สูง — อัตราดอกเบี้ยสูงกระทบ cost of debt โดยตรง`, score: -2 })
  const cycleSectors = ['Energy','Materials','Industrial']
  if (cycleSectors.includes(stock.sec)) threats.push({ text: `Cyclical sector (${stock.sec}) — รายได้ผันผวนตามเศรษฐกิจ`, score: -1 })
  if (stock.sec === 'Real Estate') threats.push({ text: 'REIT sensitive ต่ออัตราดอกเบี้ย — Rising rates กดดัน valuation', score: -2 })
  if (drop  !== null && drop < -40) threats.push({ text: `ราคาร่วงหนัก ${drop.toFixed(1)}% — อาจมี fundamental deterioration`, score: -2 })
  threats.push({ text: 'Macro uncertainty — เงินเฟ้อ/ดอกเบี้ย/geopolitics กระทบตลาดโดยรวม', score: -1 })

  // ── Score ──
  const total = [...strengths, ...weaknesses, ...opportunities, ...threats]
    .reduce((acc, x) => acc + x.score, 0)

  let verdict, verdictColor, verdictBg
  if      (total >= 8)  { verdict = 'น่าสนใจมาก — พิจารณาซื้อ';   verdictColor = 'text-green-300';  verdictBg = 'bg-green-900/30 border-green-700/40' }
  else if (total >= 4)  { verdict = 'น่าติดตาม — เฝ้าดูอีกระยะ';  verdictColor = 'text-blue-300';   verdictBg = 'bg-blue-900/30 border-blue-700/40' }
  else if (total >= 0)  { verdict = 'กลางๆ — ต้องวิเคราะห์เพิ่ม';  verdictColor = 'text-yellow-300'; verdictBg = 'bg-yellow-900/20 border-yellow-700/30' }
  else                  { verdict = 'ระวัง — ความเสี่ยงสูง';        verdictColor = 'text-red-300';    verdictBg = 'bg-red-900/20 border-red-700/30' }

  return { strengths, weaknesses, opportunities, threats, total, verdict, verdictColor, verdictBg }
}

// ── Financial Health Check ────────────────────────────────────────
function financialHealth(m) {
  const checks = [
    { label:'Revenue Growth (5Y)', value: m.revenueGrowth5Y ?? m.revenueGrowth3Y, pass: v => v > 0,   fmt: v => `+${v.toFixed(1)}%/yr` },
    { label:'EPS Growth (5Y)',      value: m.epsGrowth5Y    ?? m.epsGrowth3Y,      pass: v => v > 0,   fmt: v => `+${v.toFixed(1)}%/yr` },
    { label:'ROE',                  value: m.roeTTM,                               pass: v => v > 10,  fmt: v => `${v.toFixed(1)}%` },
    { label:'Gross Margin',         value: m.grossMarginTTM,                       pass: v => v > 20,  fmt: v => `${v.toFixed(1)}%` },
    { label:'Debt/Equity',          value: m.debtEquityAnnual,                     pass: v => v < 1.5, fmt: v => v.toFixed(2) },
    { label:'Current Ratio',        value: m.currentRatioAnnual,                   pass: v => v > 1,   fmt: v => v.toFixed(2) },
    { label:'EPS Positive',         value: m.epsAnnual,                            pass: v => v > 0,   fmt: v => `$${v.toFixed(2)}` },
    { label:'P/E Ratio',            value: m.peNormalizedAnnual,                   pass: v => v > 0 && v < 35, fmt: v => `${v.toFixed(1)}x` },
  ]
  const scored = checks.map(c => ({ ...c, ok: c.value != null && c.pass(c.value) }))
  const passed = scored.filter(c => c.value != null && c.ok).length
  const total  = scored.filter(c => c.value != null).length
  return { checks: scored, passed, total, score: total ? Math.round(passed / total * 100) : 0 }
}

// ── Step components ───────────────────────────────────────────────
function StepBadge({ n, active, done }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all`}
      style={
        done   ? { backgroundColor: '#408A71', color: '#fff' } :
        active ? { backgroundColor: '#285A48', color: '#B0E4CC', border: '2px solid #408A71' } :
                 { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '2px solid var(--border)' }
      }>
      {done ? <CheckCircle size={16}/> : n}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function StockHunter() {
  const navigate = useNavigate()

  // Step 1 state
  const [dropMin, setDropMin]       = useState(20)
  const [dropMax, setDropMax]       = useState(50)
  const [universe, setUniverse]     = useState('sp500') // sp500 | all
  const [step1Results, setStep1Results] = useState([])
  const [step1Loading, setStep1Loading] = useState(false)
  const [step1Progress, setStep1Progress] = useState(0)
  const abortRef = useRef(false)

  // Step 2 state
  const [step2Results, setStep2Results] = useState([])  // passed financial check
  const [step2Loading, setStep2Loading] = useState(false)
  const [step2Progress, setStep2Progress] = useState(0)
  const [activeStep, setActiveStep]   = useState(1)

  // Step 3 state
  const [selected, setSelected]     = useState(null)    // selected stock for SWOT
  const [swotData, setSwotData]     = useState(null)
  const [swotMetric, setSwotMetric] = useState(null)
  const [swotLoading, setSwotLoading] = useState(false)

  // ── Step 1: Find dip stocks ──────────────────────────────────
  const { SP500 } = { SP500: null }
  const runStep1 = useCallback(async () => {
    abortRef.current = false
    setStep1Loading(true); setStep1Progress(0); setStep1Results([])
    setStep2Results([]); setSelected(null)

    const symbols = universe === 'all'
      ? STOCKS_DB.map(s => s.s)
      : (await import('../sp500')).SP500

    const found = []
    const CONC = 8, DELAY = 1100
    for (let i = 0; i < symbols.length; i += CONC) {
      if (abortRef.current) break
      const chunk = symbols.slice(i, i + CONC)
      await Promise.all(chunk.map(async sym => {
        try {
          const r = await fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${sym}&metric=all&token=${API_KEY}`)
          const d = await r.json()
          const m = d.metric || {}
          const high  = m['52WeekHigh']
          const price = m.currentRatioAnnual ? null : null // will get from quote
          // fetch quote for current price
          const qr = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${API_KEY}`)
          const q  = await qr.json()
          const curPrice = q.c
          if (!high || !curPrice || high <= 0) return
          const dropPct = ((curPrice - high) / high) * 100
          if (dropPct <= -dropMin && dropPct >= -dropMax) {
            const info = STOCKS_DB.find(s => s.s === sym)
            const item = {
              symbol: sym,
              name:   info?.n || sym,
              sector: info?.sec || '—',
              industry: info?.ind || '—',
              cap:    info?.cap || '—',
              price:  curPrice,
              high52: high,
              low52:  m['52WeekLow'],
              dropPct,
              change:    q.d,
              changePct: q.dp,
              metric: { ...m, _dropPct: dropPct },
            }
            setStep1Results(prev =>
              prev.some(x => x.symbol === sym) ? prev : [...prev, item]
            )
          }
        } catch {}
      }))
      setStep1Progress(Math.round(Math.min(i + CONC, symbols.length) / symbols.length * 100))
      if (i + CONC < symbols.length) await new Promise(r => setTimeout(r, DELAY))
    }

    setStep1Loading(false)
    setStep1Progress(100)
    setActiveStep(2)
  }, [dropMin, dropMax, universe])

  // ── Step 2: Filter by financial health ───────────────────────
  const runStep2 = useCallback(() => {
    setStep2Loading(true)
    const passed = step1Results.filter(s => {
      const h = financialHealth(s.metric)
      return h.score >= 50  // ผ่านอย่างน้อย 50% ของเกณฑ์
    })
    // เพิ่ม health data
    const enriched = passed.map(s => ({ ...s, health: financialHealth(s.metric) }))
      .sort((a, b) => b.health.score - a.health.score)
    setStep2Results(enriched)
    setStep2Loading(false)
    setActiveStep(3)
  }, [step1Results])

  // ── Step 3: SWOT for selected stock ──────────────────────────
  const runSWOT = useCallback((stock) => {
    setSelected(stock)
    setSwotLoading(true)
    // SWOT is computed locally from metric
    const swot = generateSWOT(stock.metric, stock)
    setSwotData(swot)
    setSwotMetric(stock.metric)
    setSwotLoading(false)
  }, [])

  // ── Render helpers ────────────────────────────────────────────
  const HealthDot = ({ ok, value }) => {
    if (value == null) return <span className="text-gray-600 text-xs">N/A</span>
    return ok
      ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={11}/> ผ่าน</span>
      : <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle size={11}/> ไม่ผ่าน</span>
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target className="text-orange-400" size={24}/>
          <h1 className="text-2xl font-bold">Stock Hunter</h1>
        </div>
        <p className="text-sm text-gray-400">ค้นหาหุ้นที่น่าลงทุน 3 ขั้นตอน: หาหุ้นราคาร่วง → ประเมินงบการเงิน → SWOT Analysis</p>
      </div>

      {/* ══════════ STEP 1 ══════════ */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button className="w-full flex items-center gap-3 px-5 py-4 transition-colors"
          style={{ ':hover': { backgroundColor: 'var(--bg-hover)' } }}
          onClick={() => setActiveStep(activeStep === 1 ? 0 : 1)}>
          <StepBadge n={1} active={activeStep === 1} done={step1Results.length > 0 && !step1Loading} />
          <div className="text-left flex-1">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>ขั้นที่ 1 — หาหุ้นราคาร่วงจาก 52-Week High</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>กรองหุ้นที่ราคาต่ำกว่า ATH ตามช่วงที่กำหนด</div>
          </div>
          {step1Results.length > 0 && !step1Loading && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}>
              พบ {step1Results.length} ตัว
            </span>
          )}
          {activeStep === 1 ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }}/> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }}/>}
        </button>

        {activeStep === 1 && (
          <div className="px-5 pb-5 space-y-5" style={{ borderTop: '1px solid var(--border)' }}>
            {/* Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
              {/* Universe */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>กลุ่มหุ้น</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'sp500', label: 'S&P 500', desc: '~503 หุ้น' },
                    { id: 'all',   label: 'ทั้งหมดในระบบ', desc: `~${STOCKS_DB.length} หุ้น` },
                  ].map(u => (
                    <label key={u.id} className="flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors"
                      style={universe === u.id
                        ? { border: '1px solid #408A71', backgroundColor: 'rgba(64,138,113,0.12)' }
                        : { border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
                      <input type="radio" name="universe" value={u.id} checked={universe === u.id} onChange={() => setUniverse(u.id)} className="accent-emerald-500"/>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.label}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Drop range */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  ช่วงราคาร่วงจาก 52-Week High: <span style={{ color: 'var(--text-primary)' }}>{dropMin}% – {dropMax}%</span>
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}><span>Min drop</span><span>{dropMin}%</span></div>
                    <input type="range" min={10} max={60} value={dropMin}
                      onChange={e => setDropMin(Math.min(Number(e.target.value), dropMax - 5))}
                      className="w-full accent-emerald-500"/>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}><span>Max drop</span><span>{dropMax}%</span></div>
                    <input type="range" min={20} max={80} value={dropMax}
                      onChange={e => setDropMax(Math.max(Number(e.target.value), dropMin + 5))}
                      className="w-full accent-emerald-500"/>
                  </div>
                </div>

                {/* Preset quick buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    { label: 'Minor Dip 10-20%', min: 10, max: 20 },
                    { label: 'Dip 20-30%',        min: 20, max: 30 },
                    { label: 'Correction 30-50%', min: 30, max: 50 },
                    { label: 'Bear 50%+',         min: 50, max: 80 },
                  ].map(p => (
                    <button key={p.label} onClick={() => { setDropMin(p.min); setDropMax(p.max) }}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={dropMin === p.min && dropMax === p.max
                        ? { backgroundColor: '#285A48', border: '1px solid #408A71', color: '#B0E4CC' }
                        : { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress */}
            {step1Loading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="animate-pulse">กำลังสแกน... พบ {step1Results.length} ตัว</span>
                  <span>{step1Progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${step1Progress}%`, backgroundColor: '#408A71' }}/>
                </div>
              </div>
            )}

            {/* Button */}
            <div className="flex gap-3">
              <button onClick={runStep1} disabled={step1Loading}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all">
                {step1Loading ? <RefreshCw size={16} className="animate-spin"/> : <Target size={16}/>}
                {step1Loading ? 'กำลังสแกน...' : 'เริ่มสแกนหุ้น'}
              </button>
              {step1Loading && (
                <button onClick={() => { abortRef.current = true; setStep1Loading(false) }}
                  className="px-4 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  หยุด
                </button>
              )}
            </div>

            {/* Results table */}
            {step1Results.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs" style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th className="px-4 py-2.5 text-left">Symbol</th>
                        <th className="px-4 py-2.5 text-left hidden md:table-cell">Sector</th>
                        <th className="px-4 py-2.5 text-right">ราคาปัจจุบัน</th>
                        <th className="px-4 py-2.5 text-right">52W High</th>
                        <th className="px-4 py-2.5 text-right">ร่วงจาก ATH</th>
                        <th className="px-4 py-2.5 text-right hidden sm:table-cell">วันนี้</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step1Results.map(s => (
                        <tr key={s.symbol} className="cursor-pointer transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}
                          onClick={() => navigate(`/stock/${s.symbol}`)}>
                          <td className="px-4 py-2.5">
                            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{s.symbol}</div>
                            <div className="text-xs truncate max-w-[150px]" style={{ color: 'var(--text-muted)' }}>{s.name}</div>
                          </td>
                          <td className="px-4 py-2.5 text-xs hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>{s.sector}</td>
                          <td className="px-4 py-2.5 text-right font-bold" style={{ color: 'var(--text-primary)' }}>${s.price.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-secondary)' }}>${s.high52.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="font-bold" style={{ color: 'var(--red-down)' }}>{s.dropPct.toFixed(1)}%</span>
                            <div className="w-full rounded-full h-1 mt-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                              <div className="h-1 rounded-full" style={{ width: `${Math.min(Math.abs(s.dropPct), 100)}%`, backgroundColor: 'var(--red-down)' }}/>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                            <span style={{ color: s.changePct >= 0 ? 'var(--green-up)' : 'var(--red-down)' }}>
                              {s.changePct >= 0 ? '+' : ''}{s.changePct?.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════ STEP 2 ══════════ */}
      <div className={`rounded-2xl overflow-hidden transition-opacity ${step1Results.length === 0 ? 'opacity-50' : ''}`}
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button className="w-full flex items-center gap-3 px-5 py-4 transition-colors disabled:cursor-not-allowed"
          onClick={() => step1Results.length > 0 && setActiveStep(activeStep === 2 ? 0 : 2)}
          disabled={step1Results.length === 0}>
          <StepBadge n={2} active={activeStep === 2} done={step2Results.length > 0 && !step2Loading} />
          <div className="text-left flex-1">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>ขั้นที่ 2 — ประเมินงบการเงิน</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>กรองเฉพาะหุ้นที่งบการเงินเติบโตต่อเนื่อง</div>
          </div>
          {step2Results.length > 0 && !step2Loading && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}>
              ผ่าน {step2Results.length} ตัว
            </span>
          )}
          {activeStep === 2 ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }}/> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }}/>}
        </button>

        {activeStep === 2 && step1Results.length > 0 && (
          <div className="px-5 pb-5 space-y-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-start gap-3 rounded-xl p-4"
              style={{ backgroundColor: 'rgba(64,138,113,0.08)', border: '1px solid rgba(64,138,113,0.25)' }}>
              <Info size={16} className="shrink-0 mt-0.5" style={{ color: '#408A71' }}/>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                วิเคราะห์ <strong style={{ color: 'var(--text-primary)' }}>{step1Results.length} หุ้น</strong> ที่พบ โดยตรวจสอบ:
                Revenue Growth, EPS Growth, ROE, Gross Margin, Debt/Equity, Current Ratio, EPS Positive, P/E Ratio
                — ผ่านอย่างน้อย 50% ของเกณฑ์ถือว่าสุขภาพการเงินดี
              </div>
            </div>

            <button onClick={runStep2} disabled={step2Loading}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50">
              {step2Loading ? <RefreshCw size={16} className="animate-spin"/> : <BarChart2 size={16}/>}
              {step2Loading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์งบการเงิน'}
            </button>

            {step2Results.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs" style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th className="px-4 py-2.5 text-left">Symbol</th>
                        <th className="px-4 py-2.5 text-center">คะแนนสุขภาพ</th>
                        <th className="px-4 py-2.5 text-right hidden sm:table-cell">Rev Growth 5Y</th>
                        <th className="px-4 py-2.5 text-right hidden sm:table-cell">EPS Growth 5Y</th>
                        <th className="px-4 py-2.5 text-right hidden md:table-cell">ROE</th>
                        <th className="px-4 py-2.5 text-right hidden md:table-cell">Gross Margin</th>
                        <th className="px-4 py-2.5 text-right">ATH Drop</th>
                        <th className="px-4 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step2Results.map(s => {
                        const m = s.metric
                        const scoreColor = s.health.score >= 75 ? 'var(--green-up)' : s.health.score >= 50 ? '#facc15' : 'var(--red-down)'
                        return (
                          <tr key={s.symbol} className="transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td className="px-4 py-3">
                              <button onClick={() => navigate(`/stock/${s.symbol}`)} className="text-left transition-colors"
                                style={{ color: 'var(--text-primary)' }}>
                                <div className="font-bold">{s.symbol}</div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.sector}</div>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-lg font-bold" style={{ color: scoreColor }}>{s.health.score}%</div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.health.passed}/{s.health.total} เกณฑ์</div>
                            </td>
                            <td className="px-4 py-3 text-right hidden sm:table-cell">
                              {m.revenueGrowth5Y != null
                                ? <span style={{ color: m.revenueGrowth5Y > 0 ? 'var(--green-up)' : 'var(--red-down)' }}>{m.revenueGrowth5Y > 0 ? '+' : ''}{m.revenueGrowth5Y.toFixed(1)}%</span>
                                : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td className="px-4 py-3 text-right hidden sm:table-cell">
                              {m.epsGrowth5Y != null
                                ? <span style={{ color: m.epsGrowth5Y > 0 ? 'var(--green-up)' : 'var(--red-down)' }}>{m.epsGrowth5Y > 0 ? '+' : ''}{m.epsGrowth5Y.toFixed(1)}%</span>
                                : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td className="px-4 py-3 text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                              {m.roeTTM != null ? `${m.roeTTM.toFixed(1)}%` : '—'}
                            </td>
                            <td className="px-4 py-3 text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                              {m.grossMarginTTM != null ? `${m.grossMarginTTM.toFixed(1)}%` : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--red-down)' }}>{s.dropPct.toFixed(1)}%</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => { runSWOT(s); setActiveStep(3) }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mx-auto"
                                style={{ backgroundColor: 'rgba(64,138,113,0.15)', border: '1px solid rgba(64,138,113,0.4)', color: '#B0E4CC' }}>
                                <Zap size={12}/> SWOT
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {step2Results.length === 0 && !step2Loading && step1Results.length > 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                กด "วิเคราะห์งบการเงิน" เพื่อกรองหุ้นที่งบดีจาก {step1Results.length} ตัว
              </p>
            )}
          </div>
        )}
      </div>

      {/* ══════════ STEP 3 ══════════ */}
      <div className={`rounded-2xl overflow-hidden transition-opacity ${step2Results.length === 0 ? 'opacity-50' : ''}`}
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button className="w-full flex items-center gap-3 px-5 py-4 transition-colors"
          onClick={() => step2Results.length > 0 && setActiveStep(activeStep === 3 ? 0 : 3)}
          disabled={step2Results.length === 0}>
          <StepBadge n={3} active={activeStep === 3} done={swotData !== null} />
          <div className="text-left flex-1">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>ขั้นที่ 3 — SWOT Analysis</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>วิเคราะห์จุดแข็ง จุดอ่อน โอกาส และความเสี่ยง</div>
          </div>
          {selected && (
            <span className="text-xs px-2 py-1 rounded-full"
              style={{ color: '#B0E4CC', backgroundColor: 'rgba(64,138,113,0.15)', border: '1px solid rgba(64,138,113,0.35)' }}>
              {selected.symbol}
            </span>
          )}
          {activeStep === 3 ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }}/> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }}/>}
        </button>

        {activeStep === 3 && step2Results.length > 0 && (
          <div className="px-5 pb-5 pt-4 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>

            {/* Stock selector */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>เลือกหุ้นที่ต้องการวิเคราะห์:</p>
              <div className="flex flex-wrap gap-2">
                {step2Results.map(s => (
                  <button key={s.symbol} onClick={() => runSWOT(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={selected?.symbol === s.symbol
                      ? { backgroundColor: '#285A48', border: '1px solid #408A71', color: '#B0E4CC' }
                      : { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    {s.symbol}
                    <span style={{ color: s.health.score >= 75 ? 'var(--green-up)' : '#facc15' }}>{s.health.score}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SWOT Display */}
            {swotLoading && <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}><RefreshCw size={20} className="animate-spin mx-auto"/></div>}

            {swotData && selected && !swotLoading && (
              <div className="space-y-5">
                {/* Verdict */}
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>ผลการวิเคราะห์ — {selected.symbol}</div>
                    <div className={`text-xl font-bold ${swotData.verdictColor}`}>{swotData.verdict}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>คะแนนรวม: {swotData.total > 0 ? '+' : ''}{swotData.total} | ราคา ${selected.price.toFixed(2)} | ร่วง {selected.dropPct.toFixed(1)}% จาก ATH</div>
                  </div>
                  <button onClick={() => navigate(`/stock/${selected.symbol}`)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    ดูกราฟ <ChevronRight size={14}/>
                  </button>
                </div>

                {/* SWOT Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'strengths',     icon: Shield,        label: 'Strengths — จุดแข็ง',   bg: 'rgba(64,138,113,0.08)',  border: 'rgba(64,138,113,0.3)',  iconColor: '#408A71',  textColor: '#B0E4CC' },
                    { key: 'weaknesses',    icon: AlertTriangle, label: 'Weaknesses — จุดอ่อน',  bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.25)', iconColor: '#f87171',  textColor: '#fca5a5' },
                    { key: 'opportunities', icon: TrendingUp,    label: 'Opportunities — โอกาส', bg: 'rgba(64,138,113,0.06)',  border: 'rgba(40,90,72,0.3)',    iconColor: '#285A48',  textColor: '#B0E4CC' },
                    { key: 'threats',       icon: Eye,           label: 'Threats — ความเสี่ยง',  bg: 'rgba(250,204,21,0.05)',  border: 'rgba(250,204,21,0.2)',  iconColor: '#facc15',  textColor: '#fde68a' },
                  ].map(({ key, icon: Icon, label, bg, border, iconColor, textColor }) => (
                    <div key={key} className="rounded-xl p-4" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                      <div className="flex items-center gap-2 mb-3 font-bold text-sm" style={{ color: iconColor }}>
                        <Icon size={16}/> {label}
                        <span className="ml-auto text-xs opacity-60">{swotData[key].length} ข้อ</span>
                      </div>
                      {swotData[key].length === 0
                        ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ไม่มีข้อมูลเพียงพอ</p>
                        : <ul className="space-y-2">
                            {swotData[key].map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span className="shrink-0 mt-0.5" style={{ color: textColor }}>•</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{item.text}</span>
                              </li>
                            ))}
                          </ul>
                      }
                    </div>
                  ))}
                </div>

                {/* Key Metrics */}
                {swotMetric && (
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>Key Metrics</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'P/E',          value: swotMetric.peNormalizedAnnual, fmt: v => `${v.toFixed(1)}x`,  good: v => v > 0 && v < 25 },
                        { label: 'P/B',          value: swotMetric.pbAnnual,           fmt: v => `${v.toFixed(2)}x`,  good: v => v > 0 && v < 3  },
                        { label: 'ROE',          value: swotMetric.roeTTM,             fmt: v => `${v.toFixed(1)}%`,  good: v => v > 15 },
                        { label: 'Gross Margin', value: swotMetric.grossMarginTTM,     fmt: v => `${v.toFixed(1)}%`,  good: v => v > 30 },
                        { label: 'Revenue 5Y',   value: swotMetric.revenueGrowth5Y,    fmt: v => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`, good: v => v > 5 },
                        { label: 'EPS 5Y',       value: swotMetric.epsGrowth5Y,        fmt: v => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`, good: v => v > 5 },
                        { label: 'D/E',          value: swotMetric.debtEquityAnnual,   fmt: v => v.toFixed(2),        good: v => v < 1   },
                        { label: '52W Drop',     value: selected.dropPct,              fmt: v => `${v.toFixed(1)}%`,  good: () => false  },
                      ].filter(x => x.value != null).map(x => (
                        <div key={x.label} className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{x.label}</div>
                          <div className="text-base font-bold" style={{ color: x.good(x.value) ? 'var(--green-up)' : 'var(--text-primary)' }}>
                            {x.fmt(x.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  ⚠️ การวิเคราะห์นี้เป็นเพียงเครื่องมือช่วยตัดสินใจ ไม่ใช่คำแนะนำการลงทุน ควรทำ Due Diligence เพิ่มเติมก่อนลงทุน
                </p>
              </div>
            )}

            {!selected && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                กดปุ่ม <span style={{ color: '#408A71' }} className="font-medium">SWOT</span> ที่หุ้นที่สนใจในขั้นที่ 2 เพื่อเริ่มวิเคราะห์
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
