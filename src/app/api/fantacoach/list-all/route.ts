import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Recupera TUTTI i giocatori dal database
    const { data, error, count } = await supabase
      .from('players_serie_a')
      .select('*', { count: 'exact' })
      .order('team', { ascending: true })
      .order('position', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) throw error
    
    // Raggruppa per squadra
    const byTeam: Record<string, any[]> = {}
    
    if (data) {
      data.forEach(player => {
        if (!byTeam[player.team]) {
          byTeam[player.team] = []
        }
        byTeam[player.team].push({
          id: player.id,
          name: player.name,
          role: player.position,
          goals: player.goals,
          assists: player.assists,
          titolarita: player.titolarita,
          media_voto: player.media_voto
        })
      })
    }
    
    // Conta per ruolo
    const stats = {
      totale: count || 0,
      portieri: data?.filter(p => p.position === 'P').length || 0,
      difensori: data?.filter(p => p.position === 'D').length || 0,
      centrocampisti: data?.filter(p => p.position === 'C').length || 0,
      attaccanti: data?.filter(p => p.position === 'A').length || 0
    }
    
    return NextResponse.json({
      success: true,
      stats,
      squadre: Object.keys(byTeam).length,
      giocatori_per_squadra: byTeam
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}