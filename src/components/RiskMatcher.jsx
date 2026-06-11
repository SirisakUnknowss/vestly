import { useState, useEffect } from 'react'
import { Target, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'

const PROFILES = [
  { id: 'safe', label: 'สายปลอดภัย (Safe)', desc: 'เน้นปันผลสม่ำเสมอ หุ้นใหญ่พื้นฐานแน่น' },
  { id: 'balanced', label: 'สายสมดุล (Balanced)', desc: 'ปันผลบ้าง เติบโตบ้าง ความเสี่ยงปานกลาง' },
  { id: 'growth', label: 'สายซิ่ง (Growth)', desc: 'เน้นหุ้นเติบโตสูง ยอมรับความผันผวนได้' }
]

export default function RiskMatcher({ lynchCat, divYield }) {
  const [profile, setProfile] = useState(() => localStorage.getItem('vestly_risk_profile'))
  const [isEditing, setIsEditing] = useState(false)

  const handleSetProfile = (id) => {
    localStorage.setItem('vestly_risk_profile', id)
    setProfile(id)
    setIsEditing(false)
  }

  if (!profile || isEditing) {
    return (
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-6 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="text-blue-400" size={18} />
          <h3 className="font-bold text-sm">ตั้งค่าโปรไฟล์ความเสี่ยงของคุณ</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">เพื่อให้เรารู้ว่าหุ้นตัวนี้เหมาะกับสไตล์การลงทุนของคุณหรือไม่</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROFILES.map(p => (
            <button
              key={p.id}
              onClick={() => handleSetProfile(p.id)}
              className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-xl p-3 text-left transition-colors"
            >
              <div className="font-semibold text-sm mb-1">{p.label}</div>
              <div className="text-[10px] text-gray-400 leading-tight">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Matching Logic
  let matchStatus = 'neutral' // 'match', 'warning', 'neutral'
  let message = ''

  if (profile === 'safe') {
    if (lynchCat === 'Stalwart' || lynchCat === 'Slow Grower' || divYield > 2) {
      matchStatus = 'match'
      message = 'เหมาะกับคุณ! หุ้นตัวนี้มีความมั่นคงสูง หรือมีปันผลสม่ำเสมอ'
    } else if (lynchCat === 'Fast Grower' || lynchCat === 'Turnaround') {
      matchStatus = 'warning'
      message = 'ระวัง! หุ้นตัวนี้อาจจะซิ่งและผันผวนเกินไปสำหรับสายปลอดภัย'
    } else {
      message = 'หุ้นตัวนี้มีความเสี่ยงระดับปานกลาง'
    }
  } else if (profile === 'growth') {
    if (lynchCat === 'Fast Grower' || lynchCat === 'Turnaround') {
      matchStatus = 'match'
      message = 'ถูกใจสายซิ่ง! หุ้นตัวนี้อยู่ในโหมดเติบโตสูง หรือกำลังฟื้นตัว'
    } else if (lynchCat === 'Slow Grower') {
      matchStatus = 'warning'
      message = 'หุ้นตัวนี้อาจจะโตช้าเกินไปสำหรับสไตล์ของคุณ (เน้นเติบโต)'
    } else {
      message = 'หุ้นตัวนี้มีแนวโน้มเติบโตแบบค่อยเป็นค่อยไป'
    }
  } else if (profile === 'balanced') {
    if (lynchCat === 'Turnaround') {
      matchStatus = 'warning'
      message = 'ระวัง! หุ้นที่กำลังฟื้นตัวอาจมีความเสี่ยงสูงเกินไปสำหรับคุณ'
    } else {
      matchStatus = 'match'
      message = 'อยู่ในระดับที่รับได้! เหมาะกับพอร์ตสมดุลของคุณ'
    }
  }

  const profileLabel = PROFILES.find(p => p.id === profile)?.label

  return (
    <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-6 mt-6 flex items-start gap-4">
      <div className={`p-2.5 rounded-full shrink-0 ${
        matchStatus === 'match' ? 'bg-green-500/20 text-green-400' :
        matchStatus === 'warning' ? 'bg-amber-500/20 text-amber-400' :
        'bg-blue-500/20 text-blue-400'
      }`}>
        {matchStatus === 'match' ? <CheckCircle2 size={20} /> :
         matchStatus === 'warning' ? <AlertTriangle size={20} /> :
         <ShieldCheck size={20} />}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-sm">
            {matchStatus === 'match' ? '✅ เหมาะกับสไตล์ของคุณ' :
             matchStatus === 'warning' ? '⚠️ อาจจะไม่ค่อยเหมาะกับคุณ' :
             'ℹ️ ความเสี่ยงระดับปานกลาง'}
          </h4>
          <button onClick={() => setIsEditing(true)} className="text-[10px] text-gray-500 hover:text-white underline">
            เปลี่ยนสไตล์ (ปัจจุบัน: {profileLabel})
          </button>
        </div>
        <p className="text-xs text-gray-400">{message}</p>
      </div>
    </div>
  )
}
