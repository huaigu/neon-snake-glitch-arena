
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wisshvyxmgjcydgjkike.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc3Nodnl4bWdqY3lkZ2praWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjcwMDAsImV4cCI6MjA2NTY0MzAwMH0.V5Y3U2TS65iDVOChlsIDX5CLPpQ2onwLMVKUsV5UzP0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
