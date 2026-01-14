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
    
    // Controlla cache prima - SEMPLIFICATO
    if (!search) {
      console.log('🔍 Checking for cached Serie A players...')
      
      // Prendi tutti i giocatori in batch per aggirare il limite 1000 di Supabase
      let allCachedPlayers: any[] = []
      let offset = 0
      const batchSize = 1000
      let totalFetched = 0
      
      while (true) {
        const { data: batchPlayers, error } = await supabase
          .from('players_serie_a')
          .select('*')
          .order('name')
          .range(offset, offset + batchSize - 1)
        
        if (error) {
          console.error('Error fetching batch:', error)
          break
        }
        
        if (!batchPlayers || batchPlayers.length === 0) {
          break // Nessun altro dato
        }
        
        allCachedPlayers.push(...batchPlayers)
        totalFetched += batchPlayers.length
        offset += batchSize
        
        console.log(`📦 Batch ${Math.ceil(offset/batchSize)}: fetched ${batchPlayers.length} players (total: ${totalFetched})`)
        
        if (batchPlayers.length < batchSize) {
          break // Ultimo batch parziale
        }
      }
      
      console.log(`📊 Total fetched: ${allCachedPlayers.length} players`)
      
      if (allCachedPlayers && allCachedPlayers.length > 0) {
        console.log(`📝 Found ${allCachedPlayers.length} cached Serie A players`)
        
        return NextResponse.json({ 
          players: allCachedPlayers.map(p => ({
            id: p.id,
            name: p.name,
            role: p.position,
            team: p.team,
            team_id: p.team_id || 0,
            avgRating: p.media_voto,
            lastRating: p.media_voto,
            titularity: p.titularita || 75, // Default value se manca
            goals: p.goals,
            assists: p.assists,
            yellowCards: p.yellow_cards,
            redCards: p.red_cards || 0,
            cleanSheets: p.clean_sheets || 0,
            gamesPlayed: p.games_played
          })),
          cached: true,
          season: '2025/2026'
        })
      } else {
        console.log('❌ No cached players found - database is empty')
        // Ritorna lista vuota invece di provare API
        return NextResponse.json({ 
          players: [],
          cached: false,
          season: '2025/2026',
          message: 'Database vuoto. Usa il pulsante per caricare i giocatori Serie A.'
        })
      }
    }
    
    // Se arriviamo qui con search, cerchiamo nei dati già presenti
    if (search) {
      const { data: searchPlayers } = await supabase
        .from('players_serie_a')
        .select('*')
        .ilike('name', `%${search}%`)
        .order('name')
      
      if (searchPlayers) {
        return NextResponse.json({ 
          players: searchPlayers.map(p => ({
            id: p.id,
            name: p.name,
            role: p.position,
            team: p.team,
            team_id: p.team_id || 0,
            avgRating: p.media_voto,
            lastRating: p.media_voto,
            titularity: p.titularita || 75, // Default value se manca
            goals: p.goals,
            assists: p.assists,
            yellowCards: p.yellow_cards,
            redCards: p.red_cards || 0,
            cleanSheets: p.clean_sheets || 0,
            gamesPlayed: p.games_played
          })),
          cached: true,
          season: '2025/2026'
        })
      }
    }
    
    // Fallback: ritorna lista vuota
    return NextResponse.json({ 
      players: [],
      cached: false,
      season: '2025/2026',
      message: 'Nessun giocatore trovato'
    })
    
  } catch (error) {
    console.error('❌ Errore API fantacoach/players:', error)
    return NextResponse.json({
      error: `Errore recupero giocatori: ${error instanceof Error ? error.message : 'Unknown error'}`,
      players: []
    }, { status: 500 })
  }
}