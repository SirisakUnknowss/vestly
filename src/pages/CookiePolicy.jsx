import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CookiePolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>ย้อนกลับ</span>
        </button>

        <h1 className="text-3xl font-bold mb-6 gradient-text">นโยบายการใช้คุกกี้ (Cookie Policy)</h1>
        
        <div className="space-y-6 text-gray-300 leading-relaxed">
          <p>
            เว็บไซต์ Vestly ("เรา", "พวกเรา", หรือ "ของเรา") ใช้คุกกี้และเทคโนโลยีการจัดเก็บข้อมูลที่คล้ายคลึงกัน (เช่น Local Storage) 
            เพื่อเพิ่มประสิทธิภาพและประสบการณ์ที่ดีในการใช้งานเว็บไซต์ของคุณ
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. คุกกี้ (Cookies) คืออะไร?</h2>
            <p>
              คุกกี้คือไฟล์ข้อมูลขนาดเล็กที่ถูกดาวน์โหลดไปยังอุปกรณ์ของคุณเมื่อคุณเข้าชมเว็บไซต์ของเรา 
              ช่วยให้เว็บไซต์สามารถจดจำอุปกรณ์และรูปแบบการใช้งานของคุณได้
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. เราใช้คุกกี้ประเภทใดบ้าง?</h2>
            <p className="mb-2">เราใช้ข้อมูลเหล่านี้เพื่อให้บริการหลักของแอปพลิเคชันทำงานได้ตามปกติ:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">คุกกี้ที่จำเป็นอย่างยิ่ง (Strictly Necessary Cookies):</strong> 
                ใช้เพื่อจดจำข้อมูลสำคัญเช่น รายการหุ้นใน Watchlist, หุ้นที่ติดดาว (Starred), หรือการตั้งค่า Theme (Light/Dark mode) 
                ซึ่งเป็นการเก็บข้อมูลไว้บนเครื่องของคุณ (Local Storage) โดยไม่ระบุตัวตน
              </li>
              <li>
                <strong className="text-white">คุกกี้เพื่อการวิเคราะห์ (Analytics Cookies):</strong> 
                ใช้เพื่อทำความเข้าใจว่าผู้ใช้งานเข้าชมและโต้ตอบกับเว็บไซต์ของเราอย่างไร 
                เพื่อนำไปพัฒนาบริการให้ดียิ่งขึ้น (กรณีที่คุณกดยอมรับคุกกี้)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. การจัดการคุกกี้</h2>
            <p>
              คุณสามารถจัดการและปฏิเสธคุกกี้ที่ไม่จำเป็นได้ผ่านแบนเนอร์ขอความยินยอมเมื่อเข้าเว็บไซต์ครั้งแรก 
              หรือสามารถตั้งค่าเบราว์เซอร์ของคุณเพื่อบล็อกหรือลบข้อมูลใน Local Storage ได้ตลอดเวลา
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. การอัปเดตนโยบาย</h2>
            <p>
              เราอาจมีการอัปเดตนโยบายการใช้คุกกี้นี้เพื่อให้สอดคล้องกับการเปลี่ยนแปลงทางกฎหมายและเทคโนโลยี 
              โปรดตรวจสอบหน้านี้เป็นระยะๆ
            </p>
          </section>

          <div className="pt-8 mt-8 border-t border-gray-700 text-sm text-gray-500">
            อัปเดตล่าสุด: มิถุนายน 2026
          </div>
        </div>
      </div>
    </div>
  )
}
