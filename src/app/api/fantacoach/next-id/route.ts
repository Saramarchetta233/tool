import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get all IDs
    const { data, error } = await supabase
      .from('players_serie_a')
      .select('id')
      .order('id', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const totalRows = data?.length || 0
    const maxId = totalRows > 0 ? data[0].id : 0
    
    // Use a much higher starting point to avoid conflicts
    const nextId = Math.max(maxId + 1, 100000)
    
    return NextResponse.json({ 
      max_id: maxId,
      next_id: nextId,
      total_rows: totalRows,
      all_ids: data?.slice(0, 10) || [] // Show first 10 IDs
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}