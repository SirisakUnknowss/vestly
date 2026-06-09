import { useState, useEffect } from 'react'

const SUPABASE_URL = 'https://sqjllqilozhxbzvfjhra.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxamxscWlsb3poeGJ6dmZqaHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzQ4NzcsImV4cCI6MjA5NTQ1MDg3N30.jE514bJw8x550rR64ks7X2rN6bO_y7G1e0JjkBaf8xM'
const PAGE = 'vestly'
const SESSION_KEY = 'vestly_counted'

export function useVisitorCount() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    const alreadyCounted = sessionStorage.getItem(SESSION_KEY)

    if (alreadyCounted) {
      // Just read current count without incrementing
      fetch(`${SUPABASE_URL}/rest/v1/page_views?page=eq.${PAGE}&select=count`, {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      })
        .then(r => r.json())
        .then(data => setCount(data[0]?.count ?? null))
        .catch(() => {})
    } else {
      // Increment counter (once per session)
      fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_view`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_page: PAGE }),
      })
        .then(r => r.json())
        .then(newCount => {
          setCount(newCount)
          sessionStorage.setItem(SESSION_KEY, '1')
        })
        .catch(() => {})
    }
  }, [])

  return count
}
