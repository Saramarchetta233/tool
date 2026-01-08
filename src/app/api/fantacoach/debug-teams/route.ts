import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SERIE_A_LEAGUE_ID = 135

export async function GET() {
  try {
    const apiFootballKey = process.env.API_FOOTBALL_KEY
    if (!apiFootballKey) {
      return NextResponse.json({ error: 'API key mancante' }, { status: 500 })
    }
    
    // 1. Check API per vedere tutte le squadre
    const teamsResponse = await fetch(
      `https://v3.football.api-sports.io/teams?league=${SERIE_A_LEAGUE_ID}&season=2025`,
      {
        headers: { 'x-apisports-key': apiFootballKey }
      }
    )
    
    const teamsData = await teamsResponse.json()
    const apiTeams = teamsData.response || []
    
    // 2. Check database per vedere cosa è salvato
    const { data: dbPlayers, error } = await supabase
      .from('players_serie_a')
      .select('team, team_id')
      .order('team', { ascending: true })
    
    if (error) throw error
    
    // 3. Conta giocatori per squadra
    const teamCounts: Record<string, number> = {}
    const uniqueTeams = new Set<string>()
    
    if (dbPlayers) {
      dbPlayers.forEach(player => {
        uniqueTeams.add(player.team)
        teamCounts[player.team] = (teamCounts[player.team] || 0) + 1
      })
    }
    
    // 4. Controlla Juventus specificamente
    const juventusPlayers = dbPlayers?.filter(p => 
      p.team.toLowerCase().includes('juv') || 
      p.team_id === 496 // ID Juventus
    )
    
    // 5. Prepara report dettagliato
    const squadreApi = apiTeams.map((t: any) => ({
      id: t.team.id,
      name: t.team.name,
      inDatabase: uniqueTeams.has(t.team.name),
      playerCount: teamCounts[t.team.name] || 0
    }))
    
    return NextResponse.json({
      api: {
        totalTeams: apiTeams.length,
        teams: squadreApi
      },
      database: {
        totalTeams: uniqueTeams.size,
        totalPlayers: dbPlayers?.length || 0,
        teamsList: Array.from(uniqueTeams).sort(),
        playersByTeam: teamCounts
      },
      juventus: {
        found: juventusPlayers?.length || 0,
        players: juventusPlayers?.slice(0, 5) // primi 5 per debug
      },
      missingTeams: squadreApi.filter((t: any) => !t.inDatabase).map((t: any) => t.name)
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}