import React, { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'

const GLOSSARY = {
  pe: {
    title: 'P/E Ratio (Price-to-Earnings)',
    desc: 'อัตราส่วนราคาหุ้นต่อกำไรสุทธิต่อหุ้น บอกว่าเรากำลังซื้อหุ้นในราคาเป็นกี่เท่าของกำไรประจำปี',
    rule: 'ยิ่งต่ำยิ่งดี (หุ้นถูก) แต่ควรเปรียบเทียบในกลุ่มอุตสาหกรรมเดียวกัน ค่าเฉลี่ยทั่วไปอยู่ที่ 15-25 เท่า',
  },
  peg: {
    title: 'PEG Ratio (P/E to Growth)',
    desc: 'อัตราส่วน P/E หารด้วยอัตราการเติบโตของกำไร ช่วยดูว่าอัตราการเติบโตคุ้มค่ากับราคาหุ้นหรือไม่',
    rule: 'PEG < 1.0 หมายถึงหุ้นราคาถูกเมื่อเทียบกับอนาคตที่กำลังเติบโต, PEG > 1.0 อาจหมายถึงหุ้นแพงเกินไป',
  },
  roe: {
    title: 'ROE (Return on Equity)',
    desc: 'อัตราผลตอบแทนต่อส่วนของผู้ถือหุ้น วัดประสิทธิภาพในการนำเงินทุนของผู้ถือหุ้นไปสร้างกำไรสุทธิ',
    rule: 'ค่า ROE ยิ่งสูงยิ่งดี โดยทั่วไปควรมากกว่า 15% บ่งบอกถึงความสามารถการแข่งขันและสร้างกำไรระดับสูง',
  },
  yield: {
    title: 'Dividend Yield (อัตราปันผล)',
    desc: 'ผลตอบแทนเงินปันผลเป็นเปอร์เซ็นต์ต่อปีเมื่อเทียบกับราคาหุ้นปัจจุบัน',
    rule: 'ปันผลที่ดีและปลอดภัยควรอยู่ที่ 3% - 7% หากสูงเกิน 10% อาจต้องระวังความเสี่ยงที่ปันผลจะถูกลดลงในอนาคต',
  },
  payout: {
    title: 'Payout Ratio (อัตราส่วนการจ่ายปันผล)',
    desc: 'สัดส่วนของกำไรสุทธิทั้งหมดที่นำมาจ่ายเป็นเงินปันผล (ที่เหลือเก็บสะสมไว้ลงทุนต่อ)',
    rule: 'ค่าที่ปลอดภัยคือ 30% - 60% หากมีค่าใกล้ 100% หรือติดลบ แปลว่ากำลังนำเงินเก็บหรือหนี้มาจ่ายปันผลซึ่งไม่ยั่งยืน',
  },
  growth5y: {
    title: '5Y Dividend Growth Rate',
    desc: 'อัตราการเติบโตเฉลี่ยต่อปีของเงินปันผลที่จ่ายสะสมในรอบ 5 ปีที่ผ่านมา',
    rule: 'ควรมีค่าเป็นบวกและสม่ำเสมอ บ่งบอกว่าบริษัทมีกำไรโตต่อเนื่องจนสามารถจ่ายปันผลเพิ่มขึ้นทุกปีได้',
  },
  eps: {
    title: 'EPS (Earnings Per Share)',
    desc: 'กำไรสุทธิต่อหุ้นคำนวณจาก กำไรสุทธิทั้งหมดหารด้วยจำนวนหุ้นสามัญที่ชำระแล้ว',
    rule: 'EPS ควรเติบโตอย่างต่อเนื่องทุกปี แสดงว่าบริษัทกำลังขยายกิจการและทำกำไรเพิ่มขึ้นจริง',
  },
  cap: {
    title: 'Market Capitalization (มูลค่าตลาด)',
    desc: 'มูลค่ารวมของบริษัทคำนวณจากราคาหุ้นปัจจุบันคูณด้วยจำนวนหุ้นทั้งหมด',
    rule: 'ใช้แยกขนาดของบริษัท (Large Cap > $10B, Mid Cap $2B-$10B, Small Cap < $2B) บริษัทขนาดใหญ่จะมั่นคงกว่า',
  },
  de: {
    title: 'D/E Ratio (Debt to Equity)',
    desc: 'อัตราส่วนหนี้สินรวมต่อส่วนของผู้ถือหุ้น วัดภาระหนี้สินและความปลอดภัยทางการเงินของบริษัท',
    rule: 'ค่าที่ดีควรต่ำกว่า 1.5 - 2.0 เท่า หากสูงเกินไปแปลว่าบริษัทมีความเสี่ยงทางการเงินสูงจากการกู้ยืมหนี้สิน',
  },
  freq: {
    title: 'Dividend Frequency (ความถี่ปันผล)',
    desc: 'รอบความถี่ในการจ่ายเงินปันผลของบริษัท เช่น รายเดือน (Monthly), รายไตรมาส (Quarterly), รายครึ่งปี (Semi-Annual), รายปี (Annual)',
    rule: 'นักลงทุนปันผลมักชอบรายเดือนหรือรายไตรมาสเพราะได้รับเงินสดปันผลมาหมุนเวียนบ่อยกว่า',
  },
  annual: {
    title: 'Annual Dividend (เงินปันผลต่อปี)',
    desc: 'มูลค่าเงินปันผลทั้งหมดที่บริษัทจ่ายในระยะเวลา 1 ปีเต็มต่อหุ้นสามัญ 1 หุ้น',
    rule: 'ปันผลที่ดีควรมีอัตราคงที่หรือเติบโตเพิ่มขึ้นเรื่อยๆ ตลอดหลายปีที่ผ่านมา',
  },
}

export default function MetricTooltip({ id, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef(null)
  const item = GLOSSARY[id.toLowerCase()]

  if (!item) return null

  useEffect(() => {
    function handleClickOutside(event) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <span className={`inline-flex items-center relative ${className}`} ref={tooltipRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-gray-500 hover:text-emerald-400 transition-colors ml-1 focus:outline-none"
        aria-label={`ข้อมูลของ ${item.title}`}
      >
        <HelpCircle size={12} className="inline-block cursor-pointer" />
      </button>

      {isOpen && (
        <span 
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 text-left text-xs pointer-events-auto leading-relaxed block"
          style={{ 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900 pointer-events-none" />
          
          <strong className="block text-emerald-400 font-bold mb-1 border-b border-gray-800 pb-1 text-[13px]">
            {item.title}
          </strong>
          <span className="block text-gray-300 font-normal mb-1.5">
            {item.desc}
          </span>
          <span className="block text-yellow-400 font-medium bg-yellow-400/5 p-1 px-1.5 rounded border border-yellow-400/10 text-[10px]">
            💡 {item.rule}
          </span>
        </span>
      )}
    </span>
  )
}
