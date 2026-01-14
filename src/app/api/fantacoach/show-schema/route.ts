import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get the first row to see the structure
    const { data: firstRow, error } = await supabase
      .from('players_serie_a')
      .select('*')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      columns: (firstRow && firstRow.length > 0) ? Object.keys(firstRow[0]) : [],
      sample_row: (firstRow && firstRow.length > 0) ? firstRow[0] : null,
      rows_found: firstRow?.length || 0
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}