import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Generate a simple random session ID if one doesn't exist
export const getSessionId = () => {
  let sessionId = sessionStorage.getItem('vestly_session_id')
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('vestly_session_id', sessionId)
  }
  return sessionId
}

export function useAnalytics() {
  const location = useLocation()
  
  useEffect(() => {
    const sessionId = getSessionId()
    
    // Ignore tracking admin pages
    if (location.pathname.startsWith('/admin')) return

    const trackPageView = async () => {
      try {
        // Track page view
        await supabase.from('page_views').insert([
          { path: location.pathname, session_id: sessionId }
        ])
        
        // Update active session (upsert based on session_id)
        await supabase.from('active_sessions').upsert(
          { session_id: sessionId, last_seen: new Date().toISOString() },
          { onConflict: 'session_id' }
        )

        // If it's a stock detail page, track the specific stock view
        if (location.pathname.startsWith('/stock/')) {
          const symbol = location.pathname.split('/')[2]
          if (symbol) {
            await supabase.from('stock_views').insert([
              { symbol: symbol.toUpperCase(), session_id: sessionId }
            ])
          }
        }
      } catch (err) {
        // Silently fail if tracking fails
        console.error("Analytics tracking failed:", err)
      }
    }

    trackPageView()
  }, [location.pathname])
}
