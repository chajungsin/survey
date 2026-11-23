import { createClient } from '@supabase/supabase-js'

// Supabase publishable key is designed for browser use.
// Database access is restricted by Row Level Security policies.
const SUPABASE_URL = 'https://yznaevegugrhsgkgbdjc.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Jg35HrLrDN0gipsj2HSa_g_WVUXnbCL'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})