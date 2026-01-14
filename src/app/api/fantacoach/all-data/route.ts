import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get ALL players
    const { data: allPlayers, error } = await supabase
      .from('players_serie_a')
      .select('id, name, team, updated_at')
      .order('updated_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!allPlayers) {
      return NextResponse.json({ total: 0, players: [] })
    }
    
    // Group by teams
    const teamCounts = allPlayers.reduce((acc: Record<string, any[]>, player) => {
      if (!acc[player.team]) {
        acc[player.team] = []
      }
      acc[player.team].push(player)
      return acc
    }, {})
    
    const teams = Object.entries(teamCounts).map(([team, players]) => ({
      team,
      count: players.length,
      latest_update: players[0]?.updated_at,
      sample_players: players.slice(0, 3).map(p => p.name)
    })).sort((a, b) => a.team.localeCompare(b.team))
    
    // Show recent players
    const recentPlayers = allPlayers.slice(0, 10)
    
    return NextResponse.json({ 
      total: allPlayers.length,
      teams,
      total_teams: teams.length,
      recent_players: recentPlayers,
      has_como: teams.some(t => t.team === 'Como')
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}