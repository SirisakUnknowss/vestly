import { useState, useEffect } from 'react'
import { MessageSquarePlus, X, Star, Send, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const SUPABASE_URL = 'https://sqjllqilozhxbzvfjhra.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxamxscWlsb3poeGJ6dmZqaHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzQ4NzcsImV4cCI6MjA5NTQ1MDg3N30.jE514bJw8x550rR64ks7X2rN6bO_y7G1e0JjkBaf8xM'
const HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' }
const DONE_KEY = 'vestly_feedback_done'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60)   return 'เมื่อกี้'
  if (diff < 3600) return `${Math.floor(diff/60)} นาทีที่แล้ว`
  if (diff < 86400) return `${Math.floor(diff/3600)} ชั่วโมงที่แล้ว`
  return `${Math.floor(diff/86400)} วันที่แล้ว`
}

function StarRow({ value, onChange, size = 24, readonly = false }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onClick={() => !readonly && onChange(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}
          style={{ background: 'none', border: 'none', padding: 0 }}>
          <Star size={size}
            fill={(hover || value) >= n ? '#f59e0b' : 'none'}
            stroke={(hover || value) >= n ? '#f59e0b' : 'var(--text-muted)'}
          />
        </button>
      ))}
    </div>
  )
}

export default function FeedbackWidget() {
  const [open, setOpen]       = useState(false)
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [reviews, setReviews]   = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const alreadyDone = localStorage.getItem(DONE_KEY)

  // Load aggregate stats
  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/feedbacks?select=rating`, { headers: HEADERS })
      .then(r => r.json())
      .then(data => {
        if (!data.length) return
        setTotalCount(data.length)
        setAvgRating((data.reduce((s, x) => s + x.rating, 0) / data.length).toFixed(1))
      }).catch(() => {})
  }, [done])

  // Load reviews when panel opens
  useEffect(() => {
    if (!showReviews) return
    fetch(`${SUPABASE_URL}/rest/v1/feedbacks?select=rating,comment,created_at&order=created_at.desc&limit=20`, { headers: HEADERS })
      .then(r => r.json())
      .then(setReviews)
      .catch(() => {})
  }, [showReviews])

  const submit = async () => {
    if (!rating) return
    setLoading(true)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/feedbacks`, {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'return=minimal' },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      })
      localStorage.setItem(DONE_KEY, '1')
      setDone(true)
    } catch {}
    setLoading(false)
  }

  const ratingLabel = ['', 'ปรับปรุงได้', 'พอใช้', 'ดี', 'ดีมาก', 'ยอดเยี่ยม!']

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px var(--shadow)',
          color: 'var(--text-secondary)',
        }}
        title="ให้ feedback"
      >
        <MessageSquarePlus size={16} style={{ color: '#408A71' }} />
        <span>Feedback</span>
        {avgRating && (
          <span className="flex items-center gap-0.5 text-xs" style={{ color: '#f59e0b' }}>
            <Star size={11} fill="#f59e0b" stroke="#f59e0b" />
            {avgRating}
          </span>
        )}
      </button>

      {/* ── Modal ── */}
      {open && (
        <>
          <div className="fixed inset-0 z-50" style={{ backdropFilter: 'blur(2px)', backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setOpen(false)} />

          <div className="fixed bottom-36 right-6 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>ความคิดเห็น</div>
                {avgRating && (
                  <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
                    <span style={{ color: '#f59e0b' }} className="font-semibold">{avgRating}</span>
                    <span>จาก {totalCount} รีวิว</span>
                  </div>
                )}
              </div>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {done || alreadyDone ? (
                /* Thank you state */
                <div className="text-center py-4 space-y-2">
                  <CheckCircle size={36} className="mx-auto" style={{ color: '#408A71' }} />
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>ขอบคุณสำหรับ feedback! 🙏</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ความคิดเห็นของคุณช่วยพัฒนาเว็บให้ดีขึ้น</p>
                </div>
              ) : (
                /* Form */
                <>
                  <div className="text-center space-y-2">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>คุณชอบ Vestly แค่ไหน?</p>
                    <StarRow value={rating} onChange={setRating} size={28} />
                    {rating > 0 && (
                      <p className="text-xs font-medium" style={{ color: '#f59e0b' }}>{ratingLabel[rating]}</p>
                    )}
                  </div>

                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="บอกเราว่าชอบอะไร หรืออยากให้ปรับปรุงอะไร... (ไม่บังคับ)"
                    rows={3}
                    maxLength={300}
                    className="w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />

                  <button
                    onClick={submit}
                    disabled={!rating || loading}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             : <Send size={14} />}
                    {loading ? 'กำลังส่ง...' : 'ส่ง Feedback'}
                  </button>
                </>
              )}

              {/* Toggle reviews */}
              <button
                onClick={() => setShowReviews(s => !s)}
                className="w-full flex items-center justify-center gap-1 text-xs py-1 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {showReviews ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                {showReviews ? 'ซ่อนรีวิว' : `ดูรีวิวทั้งหมด (${totalCount})`}
              </button>
            </div>

            {/* Reviews list */}
            {showReviews && reviews.length > 0 && (
              <div className="max-h-52 overflow-y-auto px-4 pb-4 space-y-3"
                style={{ borderTop: '1px solid var(--border)' }}>
                {reviews.map((r, i) => (
                  <div key={i} className="pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <StarRow value={r.rating} onChange={() => {}} size={12} readonly />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(r.created_at)}</span>
                    </div>
                    {r.comment && (
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
