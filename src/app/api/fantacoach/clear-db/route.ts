import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🗑️ Clearing all fake data from database...')
    
    // Count before
    const { count: beforeCount } = await supabase
      .from('players_serie_a')
      .select('*', { count: 'exact', head: true })
    
    // Delete all records
    const { error: deleteError } = await supabase
      .from('players_serie_a')
      .delete()
      .neq('id', 0) // Delete everything where id != 0 (which is everything)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: deleteError.message
      }, { status: 500 })
    }
    
    // Count after
    const { count: afterCount } = await supabase
      .from('players_serie_a')
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ Database cleared: ${beforeCount} → ${afterCount} records`)
    
    return NextResponse.json({
      success: true,
      deleted: beforeCount,
      remaining: afterCount,
      message: `Cleared ${beforeCount} fake records from database`
    })
    
  } catch (error) {
    console.error('❌ Clear error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Show current database contents for debugging
    const { data, count } = await supabase
      .from('players_serie_a')
      .select('id, name, position, team', { count: 'exact' })
      .limit(10)
    
    return NextResponse.json({
      total_records: count,
      sample_records: data,
      message: count === 0 ? 'Database is empty' : `Database has ${count} records`
    })
    
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}