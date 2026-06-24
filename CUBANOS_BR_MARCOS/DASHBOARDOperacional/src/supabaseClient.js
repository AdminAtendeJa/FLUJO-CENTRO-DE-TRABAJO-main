import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("Missing Supabase credentials! Please set VITE_SUPABASE_URL and VITE_SUPABASE_SECRET_KEY in your .env file.")
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseSecretKey || 'placeholder')
