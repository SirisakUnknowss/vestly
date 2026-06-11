import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If URL or Key is missing, we create a dummy client that doesn't crash but logs a warning
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        insert: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        select: () => Promise.resolve({ data: [], error: null }),
        upsert: () => Promise.resolve({ error: null })
      })
    }

// Log a warning in development if Supabase is missing
if (!supabaseUrl && import.meta.env.DEV) {
  console.warn('Supabase URL or Anon Key is missing. Analytics tracking will be disabled. Please check your .env file.')
}
