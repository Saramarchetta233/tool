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

// Calcola media voto fantacalcio
function calculateFantaAverage(stats: any, position: string): number {
  const games = stats.games?.appearences || 0
  if (games === 0) return 6.0
  
  const goals = stats.goals?.total || 0
  const assists = stats.goals?.assists || 0
  const yellows = stats.cards?.yellow || 0
  const reds = stats.cards?.red || 0
  
  // Formula fantacalcio semplificata: 6.0 base + bonus/malus
  let average = 6.0
  average += (goals * 3) / games  // +3 per gol
  average += (assists * 1) / games  // +1 per assist
  average -= (yellows * 0.5) / games  // -0.5 per giallo
  average -= (reds * 1) / games  // -1 per rosso
  
  // Bonus clean sheet per portieri e difensori
  if (position === 'P' || position === 'D') {
    const cleanSheets = stats.goals?.conceded === 0 ? games : 0
    average += (cleanSheets * 1) / games
  }
  
  return Math.max(4.0, Math.min(10.0, Math.round(average * 10) / 10))
}

// Calcola titolarità
function calculateTitularity(stats: any): number {
  const appearences = stats.games?.appearences || 0
  const lineups = stats.games?.lineups || 0
  
  if (appearences === 0) return 0
  return Math.round((lineups / appearences) * 100)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    // Verifica chiave API
    const apiFootballKey = process.env.API_FOOTBALL_KEY
    if (!apiFootballKey) {
      return NextResponse.json({
        error: 'API_FOOTBALL_KEY mancante. Configura la chiave per dati reali.',
        players: []
      }, { status: 500 })
    }
    
    // Controlla cache prima (24 ore)
    if (!search) {
      const { data: cachedData } = await supabase
        .from('players_serie_a')
        .select('*')
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
      
      if (cachedData && cachedData.length > 0) {
        console.log('📝 Returning cached Serie A players')
        
        // Recupera tutti i giocatori dalla cache
        const { data: allCachedPlayers } = await supabase
          .from('players_serie_a')
          .select('*')
          .order('name')
        
        return NextResponse.json({ 
          players: allCachedPlayers?.map(p => ({
            id: p.id,
            name: p.name,
            role: p.position,
            team: p.team,
            team_id: p.team_id || 0,
            avgRating: p.media_voto,
            lastRating: p.media_voto,
            titularity: p.titularita,
            goals: p.goals,
            assists: p.assists,
            yellowCards: p.yellow_cards,
            redCards: p.red_cards || 0,
            cleanSheets: p.clean_sheets || 0,
            gamesPlayed: p.games_played
          })) || [],
          cached: true,
          season: '2025/2026'
        })
      }
    }
    
    console.log('🔄 Fetching fresh Serie A players from API-Football...')
    
    // Step 1: Recupera tutte le squadre Serie A 2025
    const teamsResponse = await fetch(
      `https://v3.football.api-sports.io/teams?league=${SERIE_A_LEAGUE_ID}&season=2025`,
      {
        headers: {
          'x-apisports-key': apiFootballKey
        }
      }
    )
    
    if (!teamsResponse.ok) {
      throw new Error(`Errore recupero squadre: ${teamsResponse.status}`)
    }
    
    const teamsData = await teamsResponse.json()
    const teams = teamsData.response || []
    
    if (teams.length === 0) {
      throw new Error('Nessuna squadra trovata per Serie A')
    }
    
    console.log(`🏟️ Trovate ${teams.length} squadre Serie A`)
    
    // Step 2: Per ogni squadra, recupera i giocatori con statistiche
    const allPlayers: any[] = []
    let playerCount = 0
    
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      console.log(`⚽ Recupero giocatori ${team.team.name} (${i + 1}/${teams.length})...`)
      
      try {
        // Recupera giocatori della squadra con statistiche 2025
        const playersResponse = await fetch(
          `https://v3.football.api-sports.io/players?league=${SERIE_A_LEAGUE_ID}&season=2025&team=${team.team.id}`,
          {
            headers: {
              'x-apisports-key': apiFootballKey
            }
          }
        )
        
        if (playersResponse.ok) {
          const playersData = await playersResponse.json()
          const players = playersData.response || []
          
          for (const playerData of players) {
            const player = playerData.player
            const stats = playerData.statistics?.[0] || {}
            
            if (player && player.name) {
              const position = getFantaRole(stats.games?.position || player.position)
              
              allPlayers.push({
                id: player.id,
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
                titolarita: calculateTitularity(stats),
                media_voto: calculateFantaAverage(stats, position),
                updated_at: new Date().toISOString()
              })
              
              playerCount++
            }
          }
        }
        
        // Rate limiting per rispettare i limiti API
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        console.error(`Errore recupero giocatori ${team.team.name}:`, error)
      }
    }
    
    console.log(`✅ Recuperati ${playerCount} giocatori totali`)
    
    if (allPlayers.length === 0) {
      throw new Error('Nessun giocatore recuperato')
    }
    
    // Step 3: Salva in cache Supabase
    if (!search) {
      console.log('💾 Salvando giocatori in cache Supabase...')
      
      // Prima cancella cache vecchia
      await supabase
        .from('players_serie_a')
        .delete()
        .neq('id', 0)  // Cancella tutto
      
      // Inserisci nuovi dati in batch
      const { error: insertError } = await supabase
        .from('players_serie_a')
        .insert(allPlayers)
      
      if (insertError) {
        console.error('Errore salvataggio cache:', insertError)
      } else {
        console.log('✅ Cache salvata con successo')
      }
    }
    
    // Step 4: Filtra se c'è una ricerca
    let players = allPlayers
    if (search) {
      players = allPlayers.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.team.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Step 5: Converti al formato frontend
    const formattedPlayers = players.map(p => ({
      id: p.id,
      name: p.name,
      role: p.position,
      team: p.team,
      team_id: p.team_id,
      avgRating: p.media_voto,
      lastRating: p.media_voto,
      titularity: p.titolarita,
      goals: p.goals,
      assists: p.assists,
      yellowCards: p.yellow_cards,
      redCards: p.red_cards,
      cleanSheets: p.clean_sheets,
      gamesPlayed: p.games_played
    }))
    
    return NextResponse.json({ 
      players: formattedPlayers,
      cached: false,
      season: '2025/2026',
      total: formattedPlayers.length
    })
    
  } catch (error) {
    console.error('❌ Errore API fantacoach/players:', error)
    return NextResponse.json({
      error: `Errore recupero giocatori: ${error instanceof Error ? error.message : 'Unknown error'}`,
      players: []
    }, { status: 500 })
  }
}