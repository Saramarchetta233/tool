import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SERIE_A_LEAGUE_ID = 135

export async function POST() {
  try {
    const apiFootballKey = process.env.API_FOOTBALL_KEY
    if (!apiFootballKey) {
      return NextResponse.json({ error: 'API key mancante' }, { status: 500 })
    }
    
    console.log('🔄 SYNC VELOCE: Scarico solo prime 3 squadre per test...')
    
    // Recupera squadre Serie A
    const teamsResponse = await fetch(
      `https://v3.football.api-sports.io/teams?league=${SERIE_A_LEAGUE_ID}&season=2024`,
      {
        headers: { 'x-apisports-key': apiFootballKey }
      }
    )
    
    const teamsData = await teamsResponse.json()
    const teams = teamsData.response || []
    
    if (teams.length === 0) {
      throw new Error('Nessuna squadra trovata')
    }
    
    const allPlayers: any[] = []
    
    // LIMITE: Solo prime 3 squadre per test veloce
    for (let i = 0; i < Math.min(3, teams.length); i++) {
      const team = teams[i]
      console.log(`⚽ Recupero ${team.team.name}...`)
      
      try {
        const playersResponse = await fetch(
          `https://v3.football.api-sports.io/players?league=${SERIE_A_LEAGUE_ID}&season=2024&team=${team.team.id}`,
          {
            headers: { 'x-apisports-key': apiFootballKey }
          }
        )
        
        if (playersResponse.ok) {
          const data = await playersResponse.json()
          const players = data.response || []
          
          for (const p of players) {
            if (p.player && p.statistics?.[0]) {
              const stats = p.statistics[0]
              const position = getPosition(stats.games?.position)
              
              allPlayers.push({
                id: p.player.id,
                name: p.player.name,
                position,
                team: team.team.name,
                team_id: team.team.id,
                goals: stats.goals?.total || 0,
                assists: stats.goals?.assists || 0,
                yellow_cards: stats.cards?.yellow || 0,
                red_cards: stats.cards?.red || 0,
                clean_sheets: position === 'P' && stats.goals?.conceded === 0 ? 1 : 0,
                games_played: stats.games?.appearences || 0,
                titolarita: calculateTitularity(stats),
                media_voto: calculateRating(stats, position),
                updated_at: new Date().toISOString()
              })
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Errore team ${team.team.name}:`, error)
      }
    }
    
    if (allPlayers.length > 0) {
      // Pulisci database
      await supabase
        .from('players_serie_a')
        .delete()
        .neq('id', 0)
      
      // Inserisci nuovi
      const { error } = await supabase
        .from('players_serie_a')
        .insert(allPlayers)
      
      if (error) throw error
      
      console.log(`✅ Salvati ${allPlayers.length} giocatori`)
    }
    
    return NextResponse.json({
      success: true,
      players: allPlayers.length,
      teams: Math.min(3, teams.length),
      message: `Sync completato: ${allPlayers.length} giocatori da ${Math.min(3, teams.length)} squadre`
    })
    
  } catch (error) {
    console.error('❌ Errore sync:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getPosition(pos: string): 'P' | 'D' | 'C' | 'A' {
  if (!pos) return 'C'
  const p = pos.toLowerCase()
  if (p.includes('goalkeeper')) return 'P'
  if (p.includes('defender')) return 'D'
  if (p.includes('midfielder')) return 'C'
  if (p.includes('attacker') || p.includes('forward')) return 'A'
  return 'C'
}

function calculateTitularity(stats: any): number {
  const apps = stats.games?.appearences || 0
  const starts = stats.games?.lineups || 0
  return apps > 0 ? Math.round((starts / apps) * 100) : 0
}

function calculateRating(stats: any, position: string): number {
  const games = stats.games?.appearences || 0
  if (games === 0) return 6.0
  
  let rating = 6.0
  rating += (stats.goals?.total || 0) * 3 / games
  rating += (stats.goals?.assists || 0) * 1 / games
  rating -= (stats.cards?.yellow || 0) * 0.5 / games
  rating -= (stats.cards?.red || 0) * 1 / games
  
  return Math.max(4.0, Math.min(10.0, Math.round(rating * 10) / 10))
}