import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutGrid, 
  ArrowLeft, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  ChevronDown, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { useSP500Quotes } from '../hooks/useSP500Quotes'
import { STOCKS_DB } from '../data/stocksDB'
import { SP500 } from '../sp500'

// Sector visual config
const SECTOR_METADATA = {
  'Technology': { label: 'เทคโนโลยี (Tech)', icon: '💻', size: 'col-span-2 row-span-2' },
  'Finance': { label: 'การเงิน (Financials)', icon: '🏦', size: 'col-span-1 row-span-2' },
  'Healthcare': { label: 'สุขภาพ (Healthcare)', icon: '🏥', size: 'col-span-1 row-span-1' },
  'Consumer': { label: 'สินค้าอุปโภค (Consumer)', icon: '🛍️', size: 'col-span-2 row-span-1' },
  'Energy': { label: 'พลังงาน (Energy)', icon: '⚡', size: 'col-span-1 row-span-1' },
  'Utilities': { label: 'สาธารณูปโภค (Utilities)', icon: '🚰', size: 'col-span-1 row-span-1' },
  'Industrial': { label: 'อุตสาหกรรม (Industrials)', icon: '🏗️', size: 'col-span-1 row-span-1' },
  'Real Estate': { label: 'อสังหาริมทรัพย์ (REITs)', icon: '🏢', size: 'col-span-1 row-span-1' },
  'Materials': { label: 'วัสดุก่อสร้าง (Materials)', icon: '🧪', size: 'col-span-1 row-span-1' },
  'Communication': { label: 'สื่อสาร (Communication)', icon: '📡', size: 'col-span-1 row-span-1' },
}

export default function SectorHeatmap() {
  const navigate = useNavigate()
  const { sp500Quotes, loading, progress, lastUpdated, refetch } = useSP500Quotes()
  
  // Selected sector for drill-down details
  const [selectedSector, setSelectedSector] = useState(null)

  // 1. Group S&P 500 Stocks by Sector and calculate average change %
  const sectorData = useMemo(() => {
    const sectors = {}
    
    // Group stocks by their defined sector in STOCKS_DB
    SP500.forEach(sym => {
      const match = STOCKS_DB.find(st => st.s === sym)
      const sec = match ? match.sec : 'Other'
      
      if (!sectors[sec]) {
        sectors[sec] = {
          name: sec,
          stocks: [],
          totalChange: 0,
          countWithChange: 0,
        }
      }
      
      const quote = sp500Quotes[sym]
      const changePct = quote?.changePct ?? null
      
      sectors[sec].stocks.push({
        symbol: sym,
        name: match ? match.n : sym,
        price: quote?.price ?? null,
        changePct: changePct,
        change: quote?.change ?? null,
      })
      
      if (changePct !== null) {
        sectors[sec].totalChange += changePct
        sectors[sec].countWithChange += 1
      }
    })

    // Calculate averages and sort sectors
    return Object.values(sectors).map(sec => {
      const avg = sec.countWithChange > 0 ? sec.totalChange / sec.countWithChange : 0
      
      // Sort stocks to find top gainers/losers in this sector
      const sortedStocks = [...sec.stocks].sort((a, b) => {
        if (a.changePct === null) return 1
        if (b.changePct === null) return -1
        return b.changePct - a.changePct
      })
      
      const gainers = sortedStocks.filter(s => s.changePct !== null && s.changePct > 0).slice(0, 5)
      const losers = [...sortedStocks].reverse().filter(s => s.changePct !== null && s.changePct < 0).slice(0, 5)
      
      return {
        name: sec.name,
        avgChange: avg,
        allStocksCount: sec.stocks.length,
        stocksLoaded: sec.countWithChange,
        gainers,
        losers,
        allStocks: sortedStocks,
      }
    }).sort((a, b) => b.avgChange - a.avgChange)
  }, [sp500Quotes])

  // Get color based on performance percentage
  const getPerformanceColor = (val) => {
    if (val >= 2.0) return 'bg-green-700/80 hover:bg-green-600 border-green-500/30 text-green-100'
    if (val >= 0.5) return 'bg-green-800/40 hover:bg-green-700/50 border-green-600/20 text-green-300'
    if (val <= -2.0) return 'bg-red-900/80 hover:bg-red-800 border-red-500/30 text-red-100'
    if (val <= -0.5) return 'bg-red-900/30 hover:bg-red-800/30 border-red-600/20 text-red-300'
    return 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
  }

  const handleSelectSector = (secName) => {
    setSelectedSector(prev => prev === secName ? null : secName)
  }

  const currentSectorDetails = useMemo(() => {
    return sectorData.find(s => s.name === selectedSector)
  }, [sectorData, selectedSector])

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
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Sector Heatmap</h1>
              <p className="text-sm text-gray-400 mt-1">
                แผนภาพความร้อนแสดงผลตอบแทนเฉลี่ยของหุ้นแต่ละกลุ่มอุตสาหกรรมในดัชนี S&P 500 ประจำวัน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {loading ? (
              <span className="text-xs text-indigo-400 animate-pulse font-medium">
                กำลังอัปเดต {progress}%
              </span>
            ) : lastUpdated && (
              <span className="text-xs text-gray-500 font-medium">
                รีเฟรชล่าสุด {lastUpdated.toLocaleTimeString('th-TH')}
              </span>
            )}
            <button
              onClick={refetch}
              disabled={loading}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg border border-gray-700 disabled:opacity-40 transition-colors"
              title="ดึงราคาล่าสุด"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Heatmap Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left/Main Block: Heatmap Cards */}
          <div className="lg:col-span-8 space-y-4">
            
            {loading && Object.keys(sp500Quotes).length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 bg-gray-800/10 border border-gray-800/50 rounded-2xl">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
                <p className="text-sm text-gray-400">กำลังดึงราคาหุ้น S&P 500 และประมวลผล Heatmap...</p>
              </div>
            )}

            {(!loading || Object.keys(sp500Quotes).length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {sectorData.map((sec) => {
                  const meta = SECTOR_METADATA[sec.name] || { label: sec.name, icon: '📈', size: 'col-span-1 row-span-1' }
                  const colorClass = getPerformanceColor(sec.avgChange)
                  const isSelected = selectedSector === sec.name
                  const isUp = sec.avgChange >= 0
                  
                  return (
                    <div
                      key={sec.name}
                      onClick={() => handleSelectSector(sec.name)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[110px] select-none ${colorClass} ${
                        isSelected ? 'ring-2 ring-indigo-500 border-transparent' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1.5">
                        <span className="text-xs font-bold tracking-tight truncate block">
                          {meta.icon} {meta.label}
                        </span>
                        <ChevronRight 
                          size={14} 
                          className={`text-gray-400 shrink-0 transition-transform ${isSelected ? 'rotate-90 text-white' : ''}`} 
                        />
                      </div>
                      
                      <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-xl font-black tracking-tight font-sans">
                          {isUp ? '+' : ''}{sec.avgChange.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-gray-400/80 font-semibold block">
                          {sec.stocksLoaded} / {sec.allStocksCount} หุ้น
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Beginner Heatmap Guide */}
            <div className="bg-gray-800/10 border border-gray-800/60 rounded-xl p-4 text-xs text-gray-500 flex items-start gap-2.5 leading-relaxed">
              <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-gray-400 mb-0.5">💡 การอ่านแผนภูมิความร้อน (Sector Heatmap)</strong>
                สีเขียวบ่งบอกกลุ่มหุ้นที่ราคาปรับขึ้นเฉลี่ยในวันนี้ และสีแดงบ่งบอกกลุ่มหุ้นที่ราคาลดลง การวิเคราะห์ Heatmap ช่วยให้นักลงทุนเข้าใจได้ทันทีว่ากระแสเงินลงทุนกำลังไหลเข้ากลุ่มอุตสาหกรรมไหน (Sector Rotation) เพื่อเก็งกำไรและกระจายความเสี่ยงอย่างเหมาะสม
              </div>
            </div>

          </div>

          {/* Right/Sidebar: Drill-Down Details */}
          <div className="lg:col-span-4">
            
            {/* If no sector selected */}
            {!selectedSector && (
              <div className="bg-gray-800/20 border border-gray-700/30 rounded-2xl p-6 text-center text-gray-500 h-full flex flex-col items-center justify-center min-h-[250px]">
                <Layers size={32} className="text-gray-600 mb-3" />
                <h4 className="font-bold text-gray-400 text-sm">คลิกเลือกกลุ่มอุตสาหกรรม</h4>
                <p className="text-xs text-gray-600 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  กดเลือกการ์ดอุตสาหกรรมฝั่งซ้าย เพื่อดูรายชื่อหุ้นดาวรุ่ง (Gainers) และหุ้นดาวร่วง (Losers) ในกลุ่มนั้น
                </p>
              </div>
            )}

            {/* If sector selected, show details */}
            {selectedSector && currentSectorDetails && (
              <div className="bg-gray-800/30 border border-gray-700/40 rounded-2xl p-5 space-y-5 sticky top-20">
                
                {/* Sector Header */}
                <div className="border-b border-gray-700/60 pb-3 flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {SECTOR_METADATA[currentSectorDetails.name]?.label || currentSectorDetails.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">
                      เจาะลึกความเคลื่อนไหวรายตัว
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedSector(null)}
                    className="text-gray-500 hover:text-white text-xs border border-gray-700/60 p-1 px-2 rounded-lg bg-gray-900"
                  >
                    ปิด x
                  </button>
                </div>

                {/* Performance Meter */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-500 block mb-0.5">ผลตอบแทนเฉลี่ยกลุ่ม</span>
                    <strong className={`text-base font-black ${currentSectorDetails.avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentSectorDetails.avgChange >= 0 ? '+' : ''}{currentSectorDetails.avgChange.toFixed(2)}%
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 block mb-0.5">หุ้นทั้งหมดในระบบ</span>
                    <strong className="text-white text-sm font-bold">
                      {currentSectorDetails.allStocksCount} หุ้น
                    </strong>
                  </div>
                </div>

                {/* Top Gainers inside sector */}
                <div className="space-y-2">
                  <span className="text-[10px] text-green-400 font-extrabold tracking-wider uppercase block flex items-center gap-1">
                    <TrendingUp size={11} /> Top 5 Gainers (ขึ้นมากสุด)
                  </span>
                  
                  {currentSectorDetails.gainers.length === 0 ? (
                    <span className="text-xs text-gray-600 block">ไม่มีหุ้นบวกในวันนี้</span>
                  ) : (
                    <div className="space-y-1.5">
                      {currentSectorDetails.gainers.map(st => (
                        <div 
                          key={st.symbol}
                          onClick={() => navigate(`/stock/${st.symbol}`)}
                          className="bg-gray-900/40 border border-gray-850 hover:border-green-500/30 rounded-lg p-2 flex justify-between items-center cursor-pointer transition-all hover:scale-[1.005]"
                        >
                          <div className="min-w-0">
                            <strong className="text-xs text-white block">{st.symbol}</strong>
                            <span className="text-[9px] text-gray-500 block truncate max-w-[150px]">{st.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-white block">${st.price?.toFixed(2)}</span>
                            <span className="text-[10px] font-bold text-green-400">+{st.changePct?.toFixed(2)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Losers inside sector */}
                <div className="space-y-2">
                  <span className="text-[10px] text-red-400 font-extrabold tracking-wider uppercase block flex items-center gap-1">
                    <TrendingDown size={11} /> Top 5 Losers (ลดมากสุด)
                  </span>
                  
                  {currentSectorDetails.losers.length === 0 ? (
                    <span className="text-xs text-gray-600 block">ไม่มีหุ้นลบในวันนี้</span>
                  ) : (
                    <div className="space-y-1.5">
                      {currentSectorDetails.losers.map(st => (
                        <div 
                          key={st.symbol}
                          onClick={() => navigate(`/stock/${st.symbol}`)}
                          className="bg-gray-900/40 border border-gray-850 hover:border-red-500/30 rounded-lg p-2 flex justify-between items-center cursor-pointer transition-all hover:scale-[1.005]"
                        >
                          <div className="min-w-0">
                            <strong className="text-xs text-white block">{st.symbol}</strong>
                            <span className="text-[9px] text-gray-500 block truncate max-w-[150px]">{st.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-white block">${st.price?.toFixed(2)}</span>
                            <span className="text-[10px] font-bold text-red-400">{st.changePct?.toFixed(2)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </PageTransition>
  )
}
