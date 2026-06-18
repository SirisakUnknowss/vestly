import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Star, Search, Bot,
  Calendar, Calculator, LayoutGrid, Lightbulb,
  ArrowRight, Layers, Award, Shield, Zap
} from 'lucide-react'
import { STOCKS_DB } from '../data/stocksDB'
import PageTransition from '../components/PageTransition'

const DAILY_TIPS = [
  "💡 รู้หรือไม่: 'P/E Ratio' ย่อมาจาก Price to Earnings เปรียบเทียบว่าซื้อหุ้นกี่ปีถึงจะคืนทุน ยิ่งน้อยยิ่งดี",
  "💡 รู้หรือไม่: 'Dividend Yield' คือผลตอบแทนเงินปันผล ถ้า 5% แปลว่าซื้อ 100 บาท ได้เงินปันผล 5 บาทต่อปี",
  "💡 เคล็ดลับมือใหม่: อย่าเพิ่งซื้อหุ้นทั้งหมดในไม้เดียว ให้ค่อยๆ ทยอยซื้อ (DCA) เพื่อลดความเสี่ยง",
  "💡 จำไว้ว่า: หุ้นตกไม่ได้แปลว่าบริษัทกำลังจะเจ๊งเสมอไป บางทีอาจเป็นจังหวะซื้อของลดราคาก็ได้นะ!",
  "💡 หุ้นพื้นฐานดี (Blue Chip) มักจะเป็นบริษัทใหญ่ๆ ที่เรารู้จักกันดีในชีวิตประจำวัน",
  "💡 'EPS' (Earnings Per Share) คือกำไรต่อหุ้น ยิ่งกำไรต่อหุ้นเพิ่มขึ้นทุกปี หุ้นตัวนั้นยิ่งน่าสนใจ",
  "💡 ปีเตอร์ ลินช์ เคยกล่าวไว้ว่า 'จงลงทุนในสิ่งที่คุณรู้จักและเข้าใจ'"
]

const PETER_LYNCH_PRESETS = [
  { id: 'fast', label: 'Fast Growers', desc: 'เติบโตเร็ว (20-25% ต่อปี) มักเป็นหุ้นเทคโนโลยีขนาดกลางและเล็ก', color: 'text-violet-400 border-violet-500/20 bg-violet-500/5' },
  { id: 'stalwart', label: 'Stalwarts', desc: 'บริษัทขนาดใหญ่ มั่นคง โตสม่ำเสมอ (10-12% ต่อปี) ปลอดภัยสูง', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
  { id: 'slow', label: 'Slow Growers', desc: 'โตช้า แต่อิ่มตัวแล้ว มักจ่ายเงินปันผลสม่ำเสมอและค่อนข้างสูง', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
  { id: 'cyclical', label: 'Cyclicals', desc: 'หุ้นวัฏจักร ขึ้นลงตามเศรษฐกิจ เช่น พลังงาน รถยนต์ สินค้าโภคภัณฑ์', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
  { id: 'asset', label: 'Asset Plays', desc: 'หุ้นทรัพย์สินซ่อนเร้น มีทรัพย์สิน/เงินสดสูงกว่าราคาตลาดปัจจุบัน', color: 'text-teal-400 border-teal-500/20 bg-teal-500/5' },
  { id: 'turnaround', label: 'Turnarounds', desc: 'หุ้นฟื้นตัว กำลังเผชิญวิกฤตแต่มีแผนปฏิรูปธุรกิจ ลุ้นผลตอบแทนสูง', color: 'text-red-400 border-red-500/20 bg-red-500/5' },
]

export default function Home() {
  const navigate = useNavigate()
  const [tip, setTip] = useState('')
  const [starredList, setStarredList] = useState([])

  // Load random tip
  useEffect(() => {
    setTip(DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)])
  }, [])

  // Load watchlist items (top 3 stars)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('starred') || '[]')
      const items = STOCKS_DB.filter(s => saved.includes(s.s)).slice(0, 3)
      setStarredList(items)
    } catch {
      setStarredList([])
    }
  }, [])

  return (
    <PageTransition className="max-w-screen-xl mx-auto px-4 py-6">
      
      {/* ── Welcome Banner ── */}
      <div className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(64,138,113,0.2) 0%, rgba(16,185,129,0.08) 50%, rgba(9,20,19,0.1) 100%)',
          border: '1px solid rgba(64,138,113,0.2)'
        }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 10% 30%, #408a71 0%, transparent 50%), radial-gradient(circle at 90% 80%, #10b981 0%, transparent 40%)' }} />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Market Hub Overview
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">
            ยินดีต้อนรับสู่ <span className="gradient-text font-black">Vestly</span>
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            หน้าแรกของศูนย์ข้อมูลการลงทุน ค้นหาและคัดกรองหุ้นแบบพรีเมียม วิเคราะห์ความคุ้มค่าด้วยสูตร Peter Lynch, จำลองแผนการลงทุน DCA และรับการช่วยเหลืออัจฉริยะจาก AI ในคลิกเดียว
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/stocks')}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs p-3 px-5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Search size={14} /> เริ่มค้นหาหุ้น S&P 500
            </button>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 font-bold text-xs p-3 px-5 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <Bot size={14} className="text-emerald-400" /> คุยกับ AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* ── Daily Tip Banner ── */}
      {tip && (
        <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <div className="bg-amber-500/20 p-2.5 rounded-xl text-amber-400 shrink-0">
            <Lightbulb size={20} />
          </div>
          <div>
            <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-0.5">Vestly Academy 101</h4>
            <p className="text-gray-200 text-sm leading-relaxed">{tip}</p>
          </div>
        </div>
      )}

      {/* ── Market Snapshots (Lightweight Indexes) ── */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">ภาพรวมดัชนีสหรัฐฯ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'S&P 500', value: '5,431.20', change: '+0.42%', isUp: true, detail: 'ดัชนีหุ้นขนาดใหญ่ 500 ตัวแรก' },
            { name: 'Nasdaq Composite', value: '17,732.60', change: '+0.88%', isUp: true, detail: 'หุ้นเทคโนโลยีและการเติบโตสูง' },
            { name: 'Dow Jones 30', value: '39,127.14', change: '-0.15%', isUp: false, detail: 'หุ้นบลูชิปอุตสาหกรรมขนาดใหญ่' },
            { name: 'Russell 2000', value: '2,022.03', change: '+0.12%', isUp: true, detail: 'หุ้นขนาดกลางและขนาดเล็ก' }
          ].map(idx => (
            <div key={idx.name} className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs text-gray-400 mb-1">{idx.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-white">{idx.value}</span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${idx.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {idx.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {idx.change}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">{idx.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* ── Column 1: Main Gateway Cards (Quick Navigation) ── */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">เมนูเข้าถึงด่วน</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { to: '/stocks', label: 'Screener', desc: 'ค้นหา คัดกรอง และดูรายละเอียด หุ้น S&P 500 ครบครัน', icon: Search, color: 'from-blue-500/20' },
              { to: '/calendar', label: 'Calendar Hub', desc: 'ติดตามปฏิทินปันผล และผลกำไรประจำสัปดาห์', icon: Calendar, color: 'from-emerald-500/20' },
              { to: '/dca', label: 'DCA Calculator', desc: 'คำนวณและประเมินผลการออมหุ้นรายเดือนย้อนหลัง', icon: Calculator, color: 'from-amber-500/20' },
              { to: '/heatmap', label: 'Sector Heatmap', desc: 'แผนภูมิความร้อน เปรียบเทียบความแข็งแกร่งของแต่ละอุตสาหกรรม', icon: LayoutGrid, color: 'from-violet-500/20' },
            ].map(menu => {
              const Icon = menu.icon
              return (
                <div
                  key={menu.to}
                  onClick={() => navigate(menu.to)}
                  className={`p-5 rounded-2xl border cursor-pointer group hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-br to-transparent`}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div className="flex items-start justify-between">
                    <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 mb-4">
                      <Icon size={20} />
                    </div>
                    <ArrowRight size={14} className="text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-extrabold text-white text-base mb-1">{menu.label}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">{menu.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Column 2: Watchlist Preview ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">หุ้นติดดาวล่าสุด</h3>
          <div className="p-5 rounded-2xl border flex flex-col h-full justify-between" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="space-y-3">
              {starredList.length > 0 ? (
                starredList.map(stock => (
                  <div
                    key={stock.s}
                    onClick={() => navigate(`/stock/${stock.s}`)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800/80 transition-colors border border-gray-700/20 cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{stock.s}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{stock.n}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 font-medium block">{stock.sec}</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10 inline-block mt-1">
                        {stock.cap} Cap
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500 text-xs border border-dashed border-gray-700/80 rounded-xl flex flex-col items-center gap-2">
                  <Star size={20} className="text-gray-600" />
                  <p>ยังไม่มีหุ้นที่ถูกใจใช่ไหม?</p>
                  <p className="text-[10px] text-gray-600">กดติดดาว ⭐ ในหน้าตัวกรองเพื่อติดตามหุ้น</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => navigate('/watchlist')}
              className="w-full mt-4 flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold border text-gray-400 hover:text-white transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              ดู Watchlist ทั้งหมด <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Peter Lynch Strategies Section ── */}
      <div className="mt-8 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">หลักคิดแบบ Peter Lynch</h3>
            <p className="text-xs text-gray-500 mt-0.5">คัดกรองหุ้นตามสไตล์ของอดีตผู้จัดการกองทุนระดับโลก</p>
          </div>
          <button
            onClick={() => navigate('/hunter')}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-all cursor-pointer"
          >
            เปิด Hunter Scanner <ArrowRight size={12} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PETER_LYNCH_PRESETS.map(p => (
            <div
              key={p.id}
              onClick={() => navigate('/hunter')}
              className={`p-4 rounded-2xl border cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between`}
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div>
                <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border mb-2.5 ${p.color}`}>
                  {p.label}
                </span>
                <p className="text-gray-300 text-xs leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </PageTransition>
  )
}
