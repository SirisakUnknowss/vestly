import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bot, 
  Send, 
  ArrowLeft, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Trash2,
  ChevronRight,
  User,
  HelpCircle
} from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import PageTransition from '../components/PageTransition'

// Decrypted key from AiAnalyst.jsx
const apiKey = atob('QVEuQWI4Uk42SWFIci13VEVtNDE2dUZqNHo3S00xa3ZSS08tLUtmbm9ablJ4VGtqc2plcUE=')
const genAI = new GoogleGenerativeAI(apiKey)

const SUGGESTED_PROMPTS = [
  'หลักการจัดหมวดหมู่หุ้นของ Peter Lynch 6 แบบมีอะไรบ้าง?',
  'เปรียบเทียบหุ้น Apple (AAPL) และ Microsoft (MSFT) ตัวไหนเด่นอะไร?',
  'แนะนำวิธีเลือกหุ้นปันผลสำหรับมือใหม่ ควรดูตัวชี้วัดใดบ้าง?',
  'อธิบายความต่างของหุ้นปันผล (Dividend) และหุ้นเติบโต (Growth)',
]

export default function AiAssistant() {
  const navigate = useNavigate()
  
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('vestly_ai_chat')
      return saved ? JSON.parse(saved) : [
        {
          id: 'welcome',
          sender: 'ai',
          text: 'สวัสดีครับยินดีต้อนรับสู่ Vestly AI Assistant! 🤖 ผมเป็นผู้ช่วยการลงทุนส่วนตัวของคุณ สามารถสอบถามข้อมูลเรื่องหุ้น ตัวชี้วัดการเงิน วิธีคัดกรอง หรือให้เปรียบเทียบหุ้นยอดนิยมต่างๆ ได้เลยครับ',
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        }
      ]
    } catch {
      return [
        {
          id: 'welcome',
          sender: 'ai',
          text: 'สวัสดีครับยินดีต้อนรับสู่ Vestly AI Assistant! 🤖 ผมเป็นผู้ช่วยการลงทุนส่วนตัวของคุณ สามารถสอบถามข้อมูลเรื่องหุ้น ตัวชี้วัดการเงิน วิธีคัดกรอง หรือให้เปรียบเทียบหุ้นยอดนิยมต่างๆ ได้เลยครับ',
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        }
      ]
    }
  })

  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const messagesEndRef = useRef(null)

  // Save chat log to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('vestly_ai_chat', JSON.stringify(messages))
    } catch {}
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Simulated AI response fallback for offline/errors
  const getSimulatedResponse = (text) => {
    const input = text.toLowerCase()
    
    if (input.includes('lynch') || input.includes('ลินซ์') || input.includes('หมวดหมู่')) {
      return `ประเภทหุ้นตามหลักของ Peter Lynch มีทั้งหมด 6 ประเภทครับ:
1. 🐌 **Slow Growers (หุ้นโตช้า):** หุ้นบริษัทใหญ่ ปันผลสม่ำเสมอ แต่โตช้ากว่า GDP (เช่น Utility, Telecom)
2. 🏢 **Stalwarts (หุ้นแข็งแกร่ง):** หุ้นบริษัทใหญ่ชั้นนำ กำไรโตสม่ำเสมอ 10-12% ต่อปี (เช่น AAPL, KO, PG)
3. 🚀 **Fast Growers (หุ้นโตเร็ว):** หุ้นดาวรุ่ง กำไรโตมากกว่า 20% ต่อปี เสี่ยงสูงแต่ผลตอบแทนสูงมาก (เช่น NVDA, PLTR)
4. 🔄 **Cyclicals (หุ้นวัฏจักร):** ยอดขายและกำไรผันผวนตามรอบเศรษฐกิจ เช่น ท่องเที่ยว พลังงาน รถยนต์ (เช่น CVX, DAL)
5. 💎 **Turnarounds (หุ้นฟื้นตัว):** หุ้นเคยวิกฤตแต่กำลังฟื้นตัวกลับมา กำไรอาจพุ่งแรงหากแก้ปัญหาสำเร็จ (เช่น GE ยุคใหม่)
6. 🪵 **Asset Plays (หุ้นทรัพย์สินมาก):** หุ้นที่มีมูลค่าทรัพย์สินแอบแฝงสูงแต่ตลาดมองข้าม เช่น ที่ดิน ลิขสิทธิ์ หรือเงินสดสะสมเยอะ

คุณสนใจหุ้นประเภทไหนเป็นพิเศษไหมครับ?`
    }
    
    if (input.includes('aapl') && input.includes('msft') || input.includes('apple') && input.includes('microsoft')) {
      return `เปรียบเทียบ **Apple (AAPL)** vs **Microsoft (MSFT)**:
*   🍎 **Apple (AAPL):** จัดเป็นหุ้น **Stalwarts** ที่มีฐานผู้ใช้งาน (iOS Ecosystem) หนาแน่น มีกระแสเงินสดแข็งแกร่งมาก จุดเด่นคือแบรนด์แกร่งและอำนาจการต่อรองราคาสูง มี Yield ปันผลต่ำแต่มั่นคง
*   💻 **Microsoft (MSFT):** เป็นทั้ง **Stalwarts** และมีกลิ่นอายของ **Fast Growers** จากธุรกิจคลาวด์ Azure และการผนวก AI (Copilot) เข้ากับซอฟต์แวร์ Office มีความได้เปรียบเชิงโครงสร้าง B2B สูงมาก
*   📊 **สรุป:** ถ้าชอบความปลอดภัยจากสินค้าผู้บริโภค เลือก AAPL, แต่หากเน้นการเติบโตเกาะกระแสคลาวด์และ AI เลือก MSFT ครับ`
    }
    
    if (input.includes('ปันผล') || input.includes('dividend') || input.includes('yield')) {
      return `สำหรับการเลือกหุ้นปันผลที่ดีสำหรับมือใหม่ แนะนำให้ตรวจสอบตัวชี้วัด 4 ตัวนี้เป็นหลักครับ:
1. 📈 **Dividend Yield (อัตราปันผล):** ควรอยู่ระหว่าง **3% - 7%** หากสูงเกิน 10% มักมีความเสี่ยงสูงที่บริษัทจะลดปันผลลงภายหลัง
2. 📊 **Payout Ratio (อัตราการจ่ายปันผล):** ควรอยู่ในช่วง **30% - 60%** บ่งบอกว่าบริษัทนำกำไรส่วนใหญ่ไปแบ่งปันและยังเหลือเก็บไว้เติบโต
3. ⏳ **5Y Dividend Growth:** ควรมีแนวโน้มเติบโตต่อเนื่องในรอบ 5 ปี แสดงถึงความมั่นคงของกระแสเงินสดของบริษัท
4. 🛡️ **D/E Ratio (หนี้สิน/ทุน):** ควรต่ำกว่า 1.5 เท่า เพื่อลดโอกาสที่บริษัทจะตัดงบปันผลไปจ่ายดอกเบี้ยเงินกู้ยืม

คุณสามารถใช้หน้า **Dividends Screener** ของ Vestly ในการช่วยกรองหุ้นเหล่านี้ได้โดยตรงเลยนะครับ!`
    }
    
    if (input.includes('dca') || input.includes('ออมหุ้น')) {
      return `แผนการลงทุนแบบ DCA (Dollar-Cost Averaging) เป็นกลยุทธ์ที่ดีที่สุดสำหรับนักลงทุนมือใหม่ครับ:
*   ช่วยขจัดอารมณ์ความตื่นตระหนกของตลาด
*   สร้างวินัยการออมที่สม่ำเสมอ
*   ได้ต้นทุนถัวเฉลี่ยที่ดีในระยะยาวโดยไม่ต้องกังวลการจับจังหวะตลาด (Market Timing)
*   แนะนำให้ทำ DCA ในหุ้นกลุ่ม **Stalwarts** หรือดัชนีภาพรวมตลาดอย่าง S&P 500

คุณสามารถเข้าใช้งานเครื่องจำลอง **DCA Calculator** ของ Vestly เพื่อลองจำลองผลการออมย้อนหลังของหุ้นแต่ละตัวได้เลยครับ!`
    }

    return `ขออภัยครับ ข้อมูลสัญลักษณ์หรือคำถามนี้ผมอาจไม่มีข้อมูลเชิงลึกในโหมดออฟไลน์ แต่สามารถสรุปได้ว่า:
*   การลงทุนที่ดีควรเริ่มจากบริษัทที่มี P/E สมเหตุสมผล และมี ROE > 15%
*   กรุณากระจายความเสี่ยงในหลากหลายอุตสาหกรรมโดยศึกษาจากหน้า **Sector Heatmap**
*   *คำเตือน: ข้อมูลนี้เป็นไปเพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำในการลงทุนซื้อ/ขาย*

มีคำถามอื่นเกี่ยวกับหุ้นสหรัฐฯ อีกไหมครับ?`
  }

  const handleSendMessage = async (textToSend) => {
    const trimmed = textToSend.trim()
    if (!trimmed) return
    
    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    }
    
    setMessages(prev => [...prev, userMsg])
    setInputMessage('')
    setLoading(true)
    setError(null)
    
    try {
      // System prompt configuration
      const systemInstruction = `
        You are Vestly's friendly, expert AI financial assistant. You help Thai investors understand stock parameters, company earnings, dividend metrics, Peter Lynch categories, and market conditions.
        Rules:
        1. Always respond in polite, clear Thai language (using ครับ/ค่ะ).
        2. Keep descriptions clear and easy to understand for beginners. Use bullet points and bold headers for readibility.
        3. Never promise guaranteed profits. End replies with a polite financial disclaimer that this is educational content and not financial advice.
      `
      
      const fullPrompt = `${systemInstruction}\n\nUser Question: ${trimmed}`
      
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent(fullPrompt)
      const responseText = result.response.text()
      
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      }
      
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error(err)
      // Fallback to simulated offline helper
      const fallbackText = getSimulatedResponse(trimmed)
      
      setTimeout(() => {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, aiMsg])
      }, 600)
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    if (window.confirm('คุณต้องการล้างประวัติการสนทนาทั้งหมดหรือไม่?')) {
      const reset = [
        {
          id: 'welcome',
          sender: 'ai',
          text: 'ประวัติการแชตถูกล้างเรียบร้อยแล้วครับ! มีอะไรเกี่ยวกับหุ้นที่คุณต้องการสอบถามผมเพิ่มไหมครับ? 🤖',
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        }
      ]
      setMessages(reset)
      try {
        sessionStorage.removeItem('vestly_ai_chat')
      } catch {}
    }
  }

  return (
    <PageTransition className="min-h-screen">
      <div className="max-w-screen-md mx-auto px-4 py-6 h-[88vh] flex flex-col">
        
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg border border-gray-700 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bot size={18} />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white leading-tight">AI Assistant</h1>
                <span className="text-[10px] text-gray-500">Gemini 1.5 Financial Intelligence</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleClearChat}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg border border-transparent hover:border-red-950/20 transition-all"
            title="ล้างแชต"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Chat Logs Window */}
        <div className="flex-1 bg-gray-800/15 border border-gray-700/40 rounded-2xl overflow-y-auto p-4 space-y-4 mb-4 backdrop-blur-xl">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai'
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold border ${
                  isAi 
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {isAi ? <Bot size={14} /> : <User size={14} />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed font-normal whitespace-pre-line border ${
                    isAi 
                      ? 'bg-gray-800/40 border-gray-700/40 text-gray-200 rounded-tl-none' 
                      : 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-600 block px-1 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            )
          })}
          
          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                <Bot size={14} />
              </div>
              <div className="bg-gray-800/40 border border-gray-700/40 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Grid */}
        {messages.length <= 2 && !loading && (
          <div className="mb-3 shrink-0">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 px-1 flex items-center gap-1">
              <Sparkles size={11} className="text-yellow-400" /> คำแนะนำการถามผู้ช่วย AI:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-2.5 bg-gray-800/30 border border-gray-700/50 hover:border-indigo-500/40 text-[11px] text-gray-400 hover:text-white rounded-xl transition-all hover:scale-[1.005] truncate flex items-center justify-between"
                >
                  <span className="truncate">{prompt}</span>
                  <ChevronRight size={12} className="text-gray-500 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input Box */}
        <div className="shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(inputMessage)
            }}
            className="flex gap-2 relative bg-gray-900 border border-gray-700 rounded-xl p-1.5 focus-within:border-indigo-500 transition-colors"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="พิมพ์คำถามของคุณเกี่ยวกับหุ้น เช่น 'วิเคราะห์หุ้น O'..."
              className="flex-1 bg-transparent px-3 text-xs text-white placeholder-gray-600 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-indigo-600 shrink-0 transition-colors cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
          <span className="text-[9px] text-gray-655 text-center block mt-1.5">
            AI สามารถประมวลผลผิดพลาดได้ กรุณาตรวจสอบข้อมูลอีกครั้งก่อนตัดสินใจซื้อขายจริง
          </span>
        </div>

      </div>
    </PageTransition>
  )
}
