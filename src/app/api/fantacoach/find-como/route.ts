import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Search for Como specifically
    const { data: comoPlayers, error } = await supabase
      .from('players_serie_a')
      .select('*')
      .eq('team', 'Como')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Also search for anything containing "como"
    const { data: comoLike, error: likeError } = await supabase
      .from('players_serie_a')
      .select('*')
      .ilike('team', '%como%')
    
    if (likeError) {
      return NextResponse.json({ error: likeError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      como_exact: comoPlayers?.length || 0,
      como_like: comoLike?.length || 0,
      como_players: comoPlayers || [],
      como_like_players: comoLike || []
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}