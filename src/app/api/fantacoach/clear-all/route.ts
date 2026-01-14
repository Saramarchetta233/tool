import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('🗑️ Clearing all players...')
    
    // First check what's there
    const { data: beforeData, error: beforeError } = await supabase
      .from('players_serie_a')
      .select('team, count(*)', { count: 'exact' })
    
    console.log('Before delete:', beforeData)
    
    // Delete everything
    const { error } = await supabase
      .from('players_serie_a')
      .delete()
      .neq('id', -99999) // This should delete everything
    
    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Check what's left
    const { data: afterData, error: afterError } = await supabase
      .from('players_serie_a')
      .select('*', { count: 'exact' })
    
    console.log('After delete:', afterData?.length)
    
    return NextResponse.json({ 
      success: true,
      before_count: beforeData?.length || 0,
      after_count: afterData?.length || 0,
      message: 'All players cleared'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}