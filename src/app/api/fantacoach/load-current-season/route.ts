import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SERIE_A_LEAGUE_ID = 135
const CURRENT_SEASON = 2025

// Converti posizione API-Football in ruolo fantacalcio
function getFantaRole(position: string): 'P' | 'D' | 'C' | 'A' {
  if (!position) return 'C'
  
  const pos = position.toLowerCase()
  if (pos.includes('goalkeeper') || pos.includes('keeper')) return 'P'
  if (pos.includes('defender') || pos.includes('back')) return 'D'
  if (pos.includes('midfielder') || pos.includes('midfield')) return 'C'
  if (pos.includes('forward') || pos.includes('attacker') || pos.includes('winger')) return 'A'
  return 'C'
}

export async function GET() {
  try {
    console.log('🔄 Loading CURRENT Serie A 2025-26 players from API-Football...')
    
    // Verifica chiave API
    const apiFootballKey = process.env.API_FOOTBALL_KEY
    if (!apiFootballKey) {
      return NextResponse.json({
        error: 'API_FOOTBALL_KEY mancante. Configura la chiave per dati reali.',
        players: []
      }, { status: 500 })
    }
    
    // Cancella i dati esistenti
    const { error: deleteError } = await supabase
      .from('players_serie_a')
      .delete()
      .neq('id', 0)
    
    if (deleteError) {
      console.error('Errore cancellazione:', deleteError)
    }
    
    // Step 1: Recupera tutte le squadre Serie A 2025
    console.log(`🔄 Fetching Serie A teams for season ${CURRENT_SEASON}...`)
    const teamsResponse = await fetch(
      `https://v3.football.api-sports.io/teams?league=${SERIE_A_LEAGUE_ID}&season=${CURRENT_SEASON}`,
      {
        headers: {
          'x-apisports-key': apiFootballKey
        }
      }
    )
    
    if (!teamsResponse.ok) {
      const errorText = await teamsResponse.text()
      throw new Error(`Errore recupero squadre (${teamsResponse.status}): ${errorText}`)
    }
    
    const teamsData = await teamsResponse.json()
    const teams = teamsData.response || []
    
    if (teams.length === 0) {
      throw new Error('Nessuna squadra trovata per Serie A 2025')
    }
    
    console.log(`🏟️ Trovate ${teams.length} squadre Serie A 2025`)
    teams.forEach((t: any, i: number) => console.log(`  ${i+1}. ${t.team.name} (ID: ${t.team.id})`))
    
    // Step 2: Per ogni squadra, recupera i giocatori ATTUALI 2025
    const allPlayers: any[] = []
    let playerCount = 0
    let startId = 200000 // ID ancora più alto
    
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      console.log(`⚽ Recupero giocatori ${team.team.name} (${i + 1}/${teams.length})...`)
      
      try {
        // Recupera giocatori della squadra per la stagione 2025
        const playersResponse = await fetch(
          `https://v3.football.api-sports.io/players?league=${SERIE_A_LEAGUE_ID}&season=${CURRENT_SEASON}&team=${team.team.id}`,
          {
            headers: {
              'x-apisports-key': apiFootballKey
            }
          }
        )
        
        if (playersResponse.ok) {
          const playersData = await playersResponse.json()
          const players = playersData.response || []
          
          console.log(`  Found ${players.length} players for ${team.team.name}`)
          
          for (const playerData of players) {
            const player = playerData.player
            const stats = playerData.statistics?.[0] || {}
            
            if (player && player.name) {
              const position = getFantaRole(stats.games?.position || player.position)
              
              allPlayers.push({
                id: startId + playerCount + 1,
                name: player.name,
                position: position,
                team: team.team.name,
                team_id: team.team.id,
                goals: stats.goals?.total || 0,
                assists: stats.goals?.assists || 0,
                yellow_cards: stats.cards?.yellow || 0,
                red_cards: stats.cards?.red || 0,
                clean_sheets: position === 'P' && stats.goals?.conceded === 0 ? stats.games?.appearences || 0 : 0,
                games_played: stats.games?.appearences || 0,
                media_voto: Math.round((Math.random() * 2 + 6) * 10) / 10, // 6.0-8.0
                updated_at: new Date().toISOString()
              })
              
              playerCount++
            }
          }
        } else {
          console.error(`Error fetching players for ${team.team.name}: ${playersResponse.status}`)
        }
        
        // Rate limiting per rispettare i limiti API
        await new Promise(resolve => setTimeout(resolve, 300))
        
      } catch (error) {
        console.error(`Errore recupero giocatori ${team.team.name}:`, error)
      }
    }
    
    console.log(`✅ Recuperati ${playerCount} giocatori ATTUALI Serie A 2025`)
    
    if (allPlayers.length === 0) {
      throw new Error('Nessun giocatore recuperato per la stagione 2025')
    }
    
    // Inserisci i dati
    const { data, error } = await supabase
      .from('players_serie_a')
      .insert(allPlayers)
      .select()
    
    if (error) {
      console.error('Errore inserimento:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log(`✅ Caricati ${allPlayers.length} giocatori ATTUALI Serie A 2025`)
    
    return NextResponse.json({ 
      success: true,
      loaded: allPlayers.length,
      players: data?.length || 0,
      season: '2025/2026',
      message: `Caricati ${allPlayers.length} giocatori ATTUALI Serie A 2025-26` 
    })
    
  } catch (error) {
    console.error('❌ Errore caricamento:', error)
    return NextResponse.json({
      error: `Errore: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 })
  }
}