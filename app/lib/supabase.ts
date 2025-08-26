import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface OfflineStatus {
  id: number
  vehicle_number: string
  current_status: 'Online' | 'Parking/Garage' | 'Dashcam Issue' | 'Technical Problem'
  reason?: string
  updated_at: string
  updated_by?: string
}

// Create offline_status table if not exists
export async function initializeDatabase() {
  const { data, error } = await supabase
    .from('offline_status')
    .select('*')
    .limit(1)
  
  if (error && error.code === '42P01') { // Table doesn't exist
    // Create table using SQL
    const { error: createError } = await supabase.rpc('create_offline_status_table')
    if (createError) {
      console.error('Error creating table:', createError)
    }
  }
}
