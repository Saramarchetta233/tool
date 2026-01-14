import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get all teams and their player counts
    const { data: allPlayers, error } = await supabase
      .from('players_serie_a')
      .select('team, name')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!allPlayers) {
      return NextResponse.json({ teams: [], total: 0 })
    }
    
    // Group by team and count players
    const teamCounts = allPlayers.reduce((acc: Record<string, string[]>, player) => {
      if (!acc[player.team]) {
        acc[player.team] = []
      }
      acc[player.team].push(player.name)
      return acc
    }, {})
    
    const teams = Object.entries(teamCounts).map(([team, playerNames]) => ({
      team,
      count: playerNames.length,
      players: playerNames.slice(0, 5) // First 5 players as sample
    })).sort((a, b) => a.team.localeCompare(b.team))
    
    return NextResponse.json({ 
      teams,
      total_teams: teams.length,
      total_players: allPlayers.length,
      has_como: teams.some(t => t.team.toLowerCase().includes('como'))
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}