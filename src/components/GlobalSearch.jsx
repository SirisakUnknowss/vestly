import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, TrendingUp } from 'lucide-react'
import { STOCKS_DB } from '../data/stocksDB'

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Filter stocks based on query
  const results = query.trim() === '' ? [] : STOCKS_DB.filter(stock => 
    stock.s.toLowerCase().includes(query.toLowerCase()) || 
    stock.n.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8) // Limit to top 8 results

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results.length > 0) {
          handleSelect(results[selectedIndex].s)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  const handleSelect = (symbol) => {
    onClose()
    navigate(`/stock/${symbol}`)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Search Input */}
              <div className="flex items-center px-4 py-4 border-b border-gray-800">
                <Search size={22} className="text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาชื่อหุ้น หรือ ตัวย่อ (เช่น AAPL, Tesla)..."
                  className="flex-1 bg-transparent border-none outline-none px-4 text-lg text-white placeholder-gray-500"
                />
                <button 
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {query.trim() === '' ? (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                    <TrendingUp size={32} className="opacity-20" />
                    <p>พิมพ์ชื่อหุ้นเพื่อเริ่มค้นหา</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-gray-800 rounded text-xs">AAPL</span>
                      <span className="px-2 py-1 bg-gray-800 rounded text-xs">TSLA</span>
                      <span className="px-2 py-1 bg-gray-800 rounded text-xs">MSFT</span>
                    </div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((stock, index) => (
                      <button
                        key={stock.s}
                        onClick={() => handleSelect(stock.s)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-left ${
                          index === selectedIndex ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-gray-800 border border-transparent'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{stock.s}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                              stock.sec === 'Technology' ? 'bg-blue-500/20 text-blue-400' :
                              stock.sec === 'Healthcare' ? 'bg-red-500/20 text-red-400' :
                              stock.sec === 'Finance' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-800 text-gray-400'
                            }`}>
                              {stock.sec}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-0.5">{stock.n}</p>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          Enter ↵
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>ไม่พบหุ้น "{query}" ในระบบ</p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-800 bg-gray-950 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><kbd className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 font-mono">↑</kbd> <kbd className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 font-mono">↓</kbd> เลื่อน</span>
                  <span className="flex items-center gap-1"><kbd className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 font-mono">↵</kbd> เลือก</span>
                  <span className="flex items-center gap-1"><kbd className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 font-mono">ESC</kbd> ปิด</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
