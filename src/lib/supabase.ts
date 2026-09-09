import { createClient } from '@supabase/supabase-js'

// URL is public and constant for this project; anon key is the only secret needed
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? 'https://vjrbavvfjghxwbwozddl.supabase.co'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is missing. Add it as a repo secret (GitHub) or to your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
