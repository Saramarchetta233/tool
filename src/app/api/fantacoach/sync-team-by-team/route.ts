import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SERIE_A_LEAGUE_ID = 135

// Lista manuale delle squadre Serie A 2025/2026 con i loro ID
const SERIE_A_TEAMS = [
  { id: 487, name: 'Lazio' },
  { id: 489, name: 'AC Milan' },
  { id: 490, name: 'Cagliari' },
  { id: 492, name: 'Napoli' },
  { id: 494, name: 'Udinese' },
  { id: 495, name: 'Genoa' },
  { id: 496, name: 'Juventus' },
  { id: 497, name: 'AS Roma' },
  { id: 499, name: 'Atalanta' },
  { id: 500, name: 'Bologna' },
  { id: 502, name: 'Fiorentina' },
  { id: 503, name: 'Torino' },
  { id: 504, name: 'Verona' },
  { id: 505, name: 'Inter' },
  { id: 867, name: 'Lecce' },
  { id: 895, name: 'Como' },
  { id: 523, name: 'Parma' },
  { id: 1106, name: 'Venezia' },
  { id: 513, name: 'Monza' },
  { id: 502, name: 'Empoli' }
]

export async function POST() {
  try {
    const apiFootballKey = process.env.API_FOOTBALL_KEY
    if (!apiFootballKey) {
      return NextResponse.json({ error: 'API key mancante' }, { status: 500 })
    }
    
    console.log('🔄 SYNC TEAM-BY-TEAM: Sincronizzazione squadra per squadra...')
    
    // 1. Prima pulisco COMPLETAMENTE il database
    console.log('🧹 Pulizia completa database...')
    const { error: deleteError } = await supabase
      .from('players_serie_a')
      .delete()
      .gte('id', 0)
    
    if (deleteError) {
      console.error('❌ Errore pulizia:', deleteError)
    }
    
    const results: any[] = []
    let totalPlayers = 0
    
    // 2. Processo ogni squadra individualmente
    for (const team of SERIE_A_TEAMS) {
      console.log(`\n⚽ Processing ${team.name} (ID: ${team.id})...`)
      
      try {
        // Scarica giocatori della squadra
        const playersResponse = await fetch(
          `https://v3.football.api-sports.io/players?league=${SERIE_A_LEAGUE_ID}&season=2025&team=${team.id}`,
          {
            headers: { 'x-apisports-key': apiFootballKey }
          }
        )
        
        if (!playersResponse.ok) {
          console.error(`   ❌ Errore API per ${team.name}: ${playersResponse.status}`)
          results.push({ team: team.name, status: 'error', players: 0 })
          continue
        }
        
        const data = await playersResponse.json()
        const players = data.response || []
        
        console.log(`   → Trovati ${players.length} giocatori`)
        
        const teamPlayers: any[] = []
        
        for (const p of players) {
          if (p.player && p.statistics?.[0]) {
            const stats = p.statistics[0]
            const position = getPosition(stats.games?.position)
            
            teamPlayers.push({
              id: p.player.id,
              name: p.player.name,
              position,
              team: team.name,
              team_id: team.id,
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
        
        // Salva giocatori di questa squadra
        if (teamPlayers.length > 0) {
          const { data: savedData, error: insertError } = await supabase
            .from('players_serie_a')
            .upsert(teamPlayers, { onConflict: 'id' })
            .select()
          
          if (insertError) {
            console.error(`   ❌ Errore salvataggio ${team.name}:`, insertError)
            results.push({ team: team.name, status: 'error', players: 0, error: insertError.message })
          } else {
            console.log(`   ✅ Salvati ${savedData?.length || 0} giocatori`)
            totalPlayers += savedData?.length || 0
            results.push({ 
              team: team.name, 
              status: 'success', 
              players: savedData?.length || 0,
              sample: teamPlayers.slice(0, 3).map(p => p.name)
            })
          }
        }
        
        // Pausa tra le squadre per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500))
        
      } catch (error) {
        console.error(`   ❌ Errore processing ${team.name}:`, error)
        results.push({ team: team.name, status: 'error', players: 0 })
      }
    }
    
    // 3. Verifica finale
    const { count } = await supabase
      .from('players_serie_a')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\n✅ SYNC COMPLETATO!`)
    console.log(`   → Giocatori totali nel database: ${count}`)
    
    return NextResponse.json({
      success: true,
      totalTeams: SERIE_A_TEAMS.length,
      totalPlayers: totalPlayers,
      databaseCount: count,
      details: results,
      timestamp: new Date().toISOString()
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