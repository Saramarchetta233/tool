import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get all players with their IDs to see what's in the database
    const { data: allPlayers, error } = await supabase
      .from('players_serie_a')
      .select('id, name, team, updated_at')
      .order('id')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!allPlayers) {
      return NextResponse.json({ total: 0, players: [] })
    }
    
    // Group by ID ranges
    const idRanges = {
      '1-99999': allPlayers.filter(p => p.id < 100000).length,
      '100000-199999': allPlayers.filter(p => p.id >= 100000 && p.id < 200000).length,
      '200000+': allPlayers.filter(p => p.id >= 200000).length
    }
    
    // Group by teams
    const teamCounts = allPlayers.reduce((acc: Record<string, number>, player) => {
      acc[player.team] = (acc[player.team] || 0) + 1
      return acc
    }, {})
    
    const teams = Object.entries(teamCounts).map(([team, count]) => ({
      team,
      count: count as number
    })).sort((a, b) => a.team.localeCompare(b.team))
    
    // Show some sample players from each ID range
    const samplePlayers = {
      old_data: allPlayers.filter(p => p.id >= 100000 && p.id < 200000).slice(0, 3),
      new_data: allPlayers.filter(p => p.id >= 200000).slice(0, 5)
    }
    
    return NextResponse.json({ 
      total: allPlayers.length,
      id_ranges: idRanges,
      teams,
      total_teams: teams.length,
      sample_players: samplePlayers,
      has_como: teams.some(t => t.team === 'Como')
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}