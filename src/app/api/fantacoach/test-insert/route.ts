import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('🧪 Test: inserting single player...')
    
    const testPlayer = {
      name: "Test Player Como",
      position: "A",
      team: "Como",
      team_id: 477,
      goals: 5,
      assists: 3,
      yellow_cards: 2,
      red_cards: 0,
      clean_sheets: 0,
      games_played: 15,
      titolarita: 75,
      media_voto: 6.5,
      updated_at: new Date().toISOString()
    }
    
    console.log('Test player data:', testPlayer)
    
    const { data, error } = await supabase
      .from('players_serie_a')
      .insert([testPlayer])
      .select()
    
    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ 
        success: false,
        error: error.message,
        error_details: error
      })
    }
    
    console.log('✅ Insert successful:', data)
    
    return NextResponse.json({ 
      success: true,
      inserted: data,
      message: 'Test player inserted successfully'
    })
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}