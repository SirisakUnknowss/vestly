import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if the user has already made a choice
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setIsVisible(false)
    // TODO: Initialize analytics/tracking scripts here
  }

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected')
    setIsVisible(false)
    // TODO: Ensure no tracking scripts are loaded
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-gray-900 border-t border-gray-700 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="text-sm text-gray-300">
          <strong className="text-white block mb-1 text-base">การใช้และการจัดการคุกกี้</strong>
          vestly มีการใช้เทคโนโลยี เช่น คุกกี้ (cookies) และเทคโนโลยีที่คล้ายคลึงกันบนเว็บไซต์ของเรา เพื่อพัฒนาประสบการณ์การใช้งานเว็บไซต์ของท่านให้ดียิ่งขึ้น โปรดอ่านรายละเอียดเพิ่มเติมที่ <Link to="/cookie-policy" className="text-blue-400 hover:underline">นโยบายการใช้คุกกี้ของเรา</Link>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <button 
            onClick={handleReject}
            className="flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border border-gray-600"
          >
            ปฏิเสธทั้งหมด
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            ยอมรับ
          </button>
        </div>
      </div>
    </div>
  )
}
