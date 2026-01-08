import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SERIE_A_LEAGUE_ID = 135
const JUVENTUS_ID = 496

export async function POST() {
  try {
    const apiFootballKey = process.env.API_FOOTBALL_KEY
    if (!apiFootballKey) {
      return NextResponse.json({ error: 'API key mancante' }, { status: 500 })
    }
    
    console.log('⚫⚪ SYNC JUVENTUS: Scarico solo i giocatori della Juventus...')
    
    // 1. Verifica che Juventus esista nell'API
    const teamsResponse = await fetch(
      `https://v3.football.api-sports.io/teams?id=${JUVENTUS_ID}`,
      {
        headers: { 'x-apisports-key': apiFootballKey }
      }
    )
    
    const teamsData = await teamsResponse.json()
    console.log('Team check:', teamsData)
    
    // 2. Scarica giocatori Juventus
    const playersResponse = await fetch(
      `https://v3.football.api-sports.io/players?league=${SERIE_A_LEAGUE_ID}&season=2025&team=${JUVENTUS_ID}`,
      {
        headers: { 'x-apisports-key': apiFootballKey }
      }
    )
    
    if (!playersResponse.ok) {
      throw new Error(`API Error: ${playersResponse.status}`)
    }
    
    const playersData = await playersResponse.json()
    const players = playersData.response || []
    
    console.log(`📊 Trovati ${players.length} giocatori Juventus`)
    
    const juventusPlayers: any[] = []
    
    for (const p of players) {
      if (p.player && p.statistics?.[0]) {
        const stats = p.statistics[0]
        const position = getPosition(stats.games?.position)
        
        juventusPlayers.push({
          id: p.player.id,
          name: p.player.name,
          position,
          team: 'Juventus',
          team_id: JUVENTUS_ID,
          goals: stats.goals?.total || 0,
          assists: stats.goals?.assists || 0,
          yellow_cards: stats.cards?.yellow || 0,
          red_cards: stats.cards?.red || 0,
          clean_sheets: position === 'P' ? (stats.goals?.conceded || 0) : 0,
          games_played: stats.games?.appearences || 0,
          titolarita: calculateTitularity(stats),
          media_voto: calculateRating(stats, position),
          updated_at: new Date().toISOString()
        })
      }
    }
    
    console.log('Giocatori processati:', juventusPlayers.length)
    console.log('Primi 5:', juventusPlayers.slice(0, 5).map(p => p.name))
    
    // 3. Salva nel database
    if (juventusPlayers.length > 0) {
      const { data, error } = await supabase
        .from('players_serie_a')
        .insert(juventusPlayers)
        .select()
      
      if (error) {
        console.error('Errore database:', error)
        throw error
      }
      
      console.log(`✅ Salvati ${data?.length || 0} giocatori Juventus`)
      
      return NextResponse.json({
        success: true,
        team: 'Juventus',
        players_found: juventusPlayers.length,
        players_saved: data?.length || 0,
        sample: juventusPlayers.slice(0, 10).map(p => ({
          name: p.name,
          position: p.position,
          goals: p.goals
        }))
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Nessun giocatore trovato'
    })
    
  } catch (error) {
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