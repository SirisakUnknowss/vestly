import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, Plus, Trash2, Download, Printer, Save, 
  ArrowLeft, Search, X, Sparkles, AlertCircle, Edit2, Calendar
} from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { STOCKS_DB } from '../data/stocksDB'

const THESIS_CATEGORIES = [
  { id: 'value', label: 'Value (หุ้นคุณค่า / PE ต่ำ)', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 'growth', label: 'Growth (หุ้นเติบโตเร็ว)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { id: 'dividend', label: 'Dividend (หุ้นปันผลมั่นคง)', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'turnaround', label: 'Turnaround (หุ้นฟื้นตัว / แก้ไขวิกฤต)', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { id: 'speculative', label: 'Speculative (หุ้นเก็งกำไร / สินทรัพย์เสี่ยง)', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
]

export default function InvestmentJournal() {
  const navigate = useNavigate()

  // Journal state
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('vestly_journal_v1')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Form states
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [symbol, setSymbol] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [targetExit, setTargetExit] = useState('')
  const [category, setCategory] = useState('value')
  const [thesisText, setThesisText] = useState('')
  
  // Search & autocomplete
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vestly_journal_v1', JSON.stringify(entries))
    } catch (e) {
      console.error('Failed to save journal', e)
    }
  }, [entries])

  // Autocomplete matching
  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const lower = searchQuery.toLowerCase()
    return STOCKS_DB.filter(
      st => st.s.toLowerCase().includes(lower) || st.n.toLowerCase().includes(lower)
    ).slice(0, 6)
  }, [searchQuery])

  const handleSelectStock = (st) => {
    setSymbol(st.s)
    setSearchQuery('')
    setShowDropdown(false)
  }

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!symbol) return

    const newEntry = {
      id: editingId || `entry-${Date.now()}`,
      symbol: symbol.toUpperCase(),
      name: STOCKS_DB.find(st => st.s.toUpperCase() === symbol.toUpperCase())?.n || symbol,
      entryPrice: parseFloat(entryPrice) || null,
      targetExit: parseFloat(targetExit) || null,
      category,
      thesisText,
      date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    if (editingId) {
      setEntries(prev => prev.map(item => item.id === editingId ? newEntry : item))
      setEditingId(null)
    } else {
      setEntries(prev => [newEntry, ...prev])
    }

    // Reset Form
    setIsAdding(false)
    setSymbol('')
    setEntryPrice('')
    setTargetExit('')
    setCategory('value')
    setThesisText('')
  }

  // Handle Delete
  const handleDelete = (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบการบันทึกการลงทุนนี้?')) {
      setEntries(prev => prev.filter(item => item.id !== id))
    }
  }

  // Handle Edit Setup
  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setSymbol(item.symbol)
    setEntryPrice(item.entryPrice || '')
    setTargetExit(item.targetExit || '')
    setCategory(item.category)
    setThesisText(item.thesisText)
    setIsAdding(true)
  }

  // Export Specific Entry to Markdown file
  const handleExportMarkdown = (item) => {
    const content = `# บันทึกการลงทุน Vestly: ${item.symbol} (${item.name})
วันที่บันทึก: ${item.date}
ประเภทสมมติฐาน: ${THESIS_CATEGORIES.find(c => c.id === item.category)?.label || item.category}

## 📊 ข้อมูลราคา
- ราคาเข้าซื้อที่วางแผน: ${item.entryPrice ? `$${item.entryPrice.toFixed(2)}` : 'ไม่ระบุ'}
- เป้าหมายราคาทางออก (Exit Target): ${item.targetExit ? `$${item.targetExit.toFixed(2)}` : 'ไม่ระบุ'}
- อัตราผลตอบแทนเป้าหมาย: ${item.entryPrice && item.targetExit ? `${(((item.targetExit - item.entryPrice) / item.entryPrice) * 100).toFixed(1)}%` : 'ไม่ระบุ'}

## 📓 สมมติฐานการลงทุน (Investment Thesis)
${item.thesisText || 'ไม่ได้ระบุรายละเอียดข้อความสมมติฐาน'}

---
*บันทึกโดยแอป Vestly Stock Tracker*
`
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Vestly_Journal_${item.symbol}_${item.id}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <PageTransition className="min-h-screen print:bg-white print:text-black">
      <div className="max-w-screen-xl mx-auto px-4 py-6 print:px-0 print:py-0">
        
        {/* Breadcrumb - Hide on print */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors mb-4 print:hidden"
        >
          <ArrowLeft size={14} /> Back to Markets
        </button>

        {/* Header - Hide on print */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-200 dark:border-gray-850 pb-5 print:hidden">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Investment Journal</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                จดบันทึกสมมติฐานการลงทุน (Investment Thesis) ของคุณเพื่อรักษาวินัย ติดตามเหตุผลการเข้าซื้อ และวิเคราะห์สภาวะจิตวิทยาการลงทุน
              </p>
            </div>
          </div>
          
          {!isAdding && (
            <button
              onClick={() => {
                setEditingId(null)
                setIsAdding(true)
              }}
              className="btn-primary text-white text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Plus size={16} /> เขียนบันทึกใหม่
            </button>
          )}
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Add / Edit Form Panel */}
          {isAdding && (
            <div className="lg:col-span-4 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5 space-y-4 print:hidden">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center justify-between">
                <span>{editingId ? 'แก้ไขบันทึก' : 'บันทึกสมมติฐานการลงทุน'}</span>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                {/* Autocomplete Ticker Search */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">เลือกหุ้น</label>
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
                      placeholder={symbol ? `หุ้นที่เลือกอยู่: ${symbol}` : "ค้นหาเพื่อเลือกสัญลักษณ์..."}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                    />
                    {symbol && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {symbol}
                      </span>
                    )}
                  </div>

                  {/* Dropdown Auto-complete */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                      {searchResults.map(st => (
                        <button
                          key={st.s}
                          type="button"
                          onClick={() => handleSelectStock(st)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-100 dark:border-gray-700/40 last:border-0 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <strong className="text-gray-900 dark:text-white mr-1.5">{st.s}</strong>
                            <span className="text-[10px] text-gray-500">{st.n}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && (
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  )}
                </div>

                {/* Categories */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">ประเภทสมมติฐานการซื้อ</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {THESIS_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Entry & Exit Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">ราคาเข้าซื้อ ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      placeholder="เช่น 120.50"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">ราคาเป้าหมายขาย ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={targetExit}
                      onChange={(e) => setTargetExit(e.target.value)}
                      placeholder="เช่น 180.00"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Thesis details text */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">รายละเอียดสมมติฐาน (Thesis details)</label>
                  <textarea
                    rows="6"
                    value={thesisText}
                    onChange={(e) => setThesisText(e.target.value)}
                    placeholder="บันทึกทำไมถึงเลือกซื้อหุ้นตัวนี้ในราคานี้? คาดหวังการเติบโตจากอะไร? ข้อมูลผลประกอบการอะไรเป็นตัวยืนยัน? และกรณีใดที่จะถือว่าทฤษฎีนี้เปลี่ยนไป..."
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 placeholder-gray-400 leading-relaxed"
                  />
                </div>

                {/* Action Buttons */}
                <button
                  type="submit"
                  disabled={!symbol}
                  className="w-full btn-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-xs cursor-pointer"
                >
                  <Save size={14} /> {editingId ? 'บันทึกการแก้ไข' : 'บันทึกสมมติฐานลงในเครื่อง'}
                </button>
              </form>
            </div>
          )}

          {/* List of Entries Panel */}
          <div className={`${isAdding ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            
            {entries.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/10 border border-gray-200 dark:border-gray-800/50 rounded-2xl text-gray-500 space-y-3">
                <BookOpen size={40} className="text-gray-400 mx-auto" />
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">ยังไม่มีการบันทึกการลงทุน</h4>
                <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                  เริ่มฝึกเขียนสมมติฐานหุ้นตัวแรกที่คุณสนใจ เพื่อวางแนวคิดการลงทุนอย่างเป็นระบบและลดการเทรดโดยใช้อารมณ์
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="p-2 px-4 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all cursor-pointer"
                >
                  เขียนบันทึกชิ้นแรก
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Print Banner - visible only when printing */}
                <div className="hidden print:block mb-8 border-b-2 border-gray-200 pb-3">
                  <h1 className="text-3xl font-extrabold text-black">Vestly Investment Journals</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    ประวัติสมมติฐานการลงทุนและวิเคราะห์กลยุทธ์หุ้นสหรัฐฯ
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {entries.map((item) => {
                    const thesisConfig = THESIS_CATEGORIES.find(c => c.id === item.category) || THESIS_CATEGORIES[0]
                    const potentialReturn = item.entryPrice && item.targetExit 
                      ? (((item.targetExit - item.entryPrice) / item.entryPrice) * 100).toFixed(1)
                      : null

                    return (
                      <div 
                        key={item.id}
                        className="bg-white dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700/40 rounded-2xl p-5 hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-4 print:border-gray-300 print:shadow-none print:my-4 print:break-inside-avoid"
                      >
                        {/* Upper Section: Stock & Details */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white shrink-0">
                              {item.symbol}
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
                                <span>{item.name}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${thesisConfig.color} uppercase`}>
                                  {thesisConfig.id}
                                </span>
                              </h4>
                              <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                <Calendar size={10} /> {item.date}
                              </p>
                            </div>
                          </div>

                          {/* Price targets stats */}
                          <div className="flex gap-4 text-xs font-semibold">
                            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800/40 px-3 py-1.5 rounded-xl text-center min-w-[70px]">
                              <span className="text-[9px] text-gray-500 block uppercase font-bold">Entry Price</span>
                              <strong className="text-gray-900 dark:text-white">{item.entryPrice ? `$${item.entryPrice.toFixed(2)}` : '—'}</strong>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800/40 px-3 py-1.5 rounded-xl text-center min-w-[70px]">
                              <span className="text-[9px] text-gray-500 block uppercase font-bold">Target Exit</span>
                              <strong className="text-gray-900 dark:text-white">{item.targetExit ? `$${item.targetExit.toFixed(2)}` : '—'}</strong>
                            </div>
                            {potentialReturn && (
                              <div className="bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-xl text-center min-w-[70px]">
                                <span className="text-[9px] text-emerald-500 dark:text-emerald-400 block uppercase font-extrabold">Upside</span>
                                <strong className="text-emerald-600 dark:text-emerald-300">+{potentialReturn}%</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle Section: Thesis Note */}
                        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/50 rounded-xl p-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                          {item.thesisText || <em className="text-gray-500 text-[10px]">ไม่ได้ระบุข้อมูลวิเคราะห์สมมติฐานการลงทุนไว้</em>}
                        </div>

                        {/* Lower Section: Action Tools - Hide on print */}
                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800/60 pt-3 print:hidden">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleExportMarkdown(item)}
                              className="flex items-center gap-1 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-[10px] font-bold text-gray-400 hover:text-white rounded-lg border border-gray-200 dark:border-gray-700 transition-all cursor-pointer"
                              title="ดาวน์โหลดเป็น Markdown"
                            >
                              <Download size={11} /> Markdown
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="flex items-center gap-1 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-[10px] font-bold text-gray-400 hover:text-white rounded-lg border border-gray-200 dark:border-gray-700 transition-all cursor-pointer"
                              title="สั่งพิมพ์ / บันทึก PDF"
                            >
                              <Printer size={11} /> Print PDF
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-gray-500 hover:text-yellow-400 border border-transparent hover:border-yellow-500/10 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขบันทึก"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="ลบล็อกบันทึก"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </PageTransition>
  )
}
