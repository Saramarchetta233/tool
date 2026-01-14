import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 secondi timeout

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ID squadre Serie A 2025-26 da API-Football
const SERIE_A_TEAMS_2025 = [
  { id: 499, name: 'Atalanta' },
  { id: 500, name: 'Bologna' },
  { id: 490, name: 'Cagliari' },
  { id: 895, name: 'Como' }, // Como promosso
  { id: 502, name: 'Fiorentina' },
  { id: 495, name: 'Genoa' },
  { id: 505, name: 'Inter' },
  { id: 496, name: 'Juventus' },
  { id: 487, name: 'Lazio' },
  { id: 867, name: 'Lecce' },
  { id: 489, name: 'Milan' },
  { id: 1579, name: 'Monza' },
  { id: 492, name: 'Napoli' },
  { id: 523, name: 'Parma' }, // Parma promosso
  { id: 497, name: 'Roma' },
  { id: 503, name: 'Torino' },
  { id: 494, name: 'Udinese' },
  { id: 517, name: 'Venezia' }, // Venezia promosso  
  { id: 504, name: 'Verona' },
  { id: 515, name: 'Empoli' }
]

const SERIE_A_LEAGUE_ID = 135
const CURRENT_SEASON = 2025 // Stagione 2025-26

function getFantaRole(position: string): 'P' | 'D' | 'C' | 'A' {
  if (!position) return 'C'
  
  const pos = position.toLowerCase()
  if (pos.includes('goalkeeper')) return 'P'
  if (pos.includes('defender')) return 'D'
  if (pos.includes('midfielder')) return 'C'
  if (pos.includes('attacker') || pos.includes('forward') || pos.includes('winger')) return 'A'
  return 'C'
}

function calculateTitularity(stats: any): number {
  const apps = stats.games?.appearences || 0
  const starts = stats.games?.lineups || 0
  
  if (apps === 0) return 0
  return Math.round((starts / apps) * 100)
}

function calculateFantaAverage(stats: any, position: string): number {
  const games = stats.games?.appearences || 0
  if (games === 0) return 6.0
  
  const goals = stats.goals?.total || 0
  const assists = stats.goals?.assists || 0
  const yellows = stats.cards?.yellow || 0
  const reds = stats.cards?.red || 0
  
  // Formula fantacalcio base
  let average = 6.0
  average += (goals * 3) / games
  average += (assists * 1) / games
  average -= (yellows * 0.5) / games
  average -= (reds * 1) / games
  
  // Bonus clean sheet per P e D
  if (position === 'P' || position === 'D') {
    const cleanSheets = stats.goals?.saves || 0
    average += (cleanSheets * 1) / games
  }
  
  return Math.max(4.0, Math.min(10.0, Math.round(average * 10) / 10))
}

export async function POST() {
  try {
    console.log('🚀 Starting Serie A 2025-26 import from API-Football...')
    
    const apiKey = process.env.API_FOOTBALL_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API_FOOTBALL_KEY not configured'
      }, { status: 500 })
    }
    
    const allPlayers: any[] = []
    let globalId = 1
    
    // Per ogni squadra della Serie A
    for (const team of SERIE_A_TEAMS_2025) {
      try {
        console.log(`📥 Fetching players for ${team.name}...`)
        
        // Ottieni giocatori della squadra - prova con page per avere tutti
        const response = await fetch(
          `https://v3.football.api-sports.io/players?team=${team.id}&season=${CURRENT_SEASON}&page=1`,
          {
            headers: {
              'x-apisports-key': apiKey
            }
          }
        )
        
        if (!response.ok) {
          console.error(`❌ Error fetching ${team.name}: ${response.status}`)
          continue
        }
        
        const data = await response.json()
        
        if (data.errors && Object.keys(data.errors).length > 0) {
          console.error(`❌ API errors for ${team.name}:`, data.errors)
          continue
        }
        
        const players = data.response || []
        const totalPages = data.paging?.total || 1
        console.log(`Found ${players.length} players for ${team.name} (page 1/${totalPages})`)
        
        // Se ci sono più pagine, prendi anche quelle
        if (totalPages > 1) {
          for (let page = 2; page <= Math.min(totalPages, 3); page++) {
            try {
              await new Promise(resolve => setTimeout(resolve, 150))
              const pageResponse = await fetch(
                `https://v3.football.api-sports.io/players?team=${team.id}&season=${CURRENT_SEASON}&page=${page}`,
                {
                  headers: {
                    'x-apisports-key': apiKey
                  }
                }
              )
              
              if (pageResponse.ok) {
                const pageData = await pageResponse.json()
                const pagePlayerss = pageData.response || []
                players.push(...pagePlayerss)
                console.log(`Added ${pagePlayerss.length} more players from page ${page}`)
              }
            } catch (err) {
              console.error(`Error fetching page ${page} for ${team.name}:`, err)
            }
          }
        }
        
        console.log(`Total players for ${team.name}: ${players.length}`)
        
        for (const playerData of players) {
          if (playerData.player && playerData.statistics?.[0]) {
            const player = playerData.player
            const stats = playerData.statistics[0]
            const position = getFantaRole(stats.games?.position || player.position || '')
            
            // Prendi TUTTI i giocatori nella rosa (anche senza presenze)
            allPlayers.push({
              id: globalId++,
              name: player.name || 'Unknown',
              position,
              team: team.name,
              team_id: team.id,
              goals: stats.goals?.total || 0,
              assists: stats.goals?.assists || 0,
              yellow_cards: stats.cards?.yellow || 0,
              red_cards: stats.cards?.red || 0,
              clean_sheets: (position === 'P' && stats.goals?.conceded === 0) ? stats.games?.appearences : 0,
              games_played: stats.games?.appearences || 0,
              titolarita: calculateTitularity(stats),
              media_voto: calculateFantaAverage(stats, position),
              updated_at: new Date().toISOString()
            })
          }
        }
        
        // Rate limiting - API-Football permette 10 richieste al secondo
        await new Promise(resolve => setTimeout(resolve, 150))
        
      } catch (error) {
        console.error(`❌ Error processing ${team.name}:`, error)
      }
    }
    
    console.log(`📊 Total players found: ${allPlayers.length}`)
    
    if (allPlayers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No players found',
        imported: 0
      })
    }
    
    // Pulisci database
    console.log('🗑️ Clearing old data...')
    const { error: deleteError } = await supabase
      .from('players_serie_a')
      .delete()
      .neq('id', 0) // Cancella tutto
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
    }
    
    // Inserisci nuovi dati in batch
    console.log('💾 Inserting new data...')
    const batchSize = 100
    let inserted = 0
    
    for (let i = 0; i < allPlayers.length; i += batchSize) {
      const batch = allPlayers.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('players_serie_a')
        .insert(batch)
      
      if (insertError) {
        console.error('Insert error:', insertError)
      } else {
        inserted += batch.length
        console.log(`Inserted ${inserted}/${allPlayers.length} players`)
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: inserted,
      total_found: allPlayers.length,
      season: '2025/2026',
      source: 'api-football',
      teams_processed: SERIE_A_TEAMS_2025.length,
      message: `Successfully imported ${inserted} Serie A players for season 2025-26`
    })
    
  } catch (error) {
    console.error('❌ Import error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      imported: 0
    }, { status: 500 })
  }
}