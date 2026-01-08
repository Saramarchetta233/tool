import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mappa ruoli Fantacalcio.it -> nostri ruoli
const roleMapping: Record<string, 'P' | 'D' | 'C' | 'A'> = {
  'P': 'P',
  'Por': 'P',
  'D': 'D',
  'Dif': 'D', 
  'Dc': 'D',
  'Dd': 'D',
  'Ds': 'D',
  'E': 'D',
  'C': 'C',
  'Cen': 'C',
  'Cc': 'C',
  'M': 'C',
  'T': 'C',
  'W': 'A',
  'A': 'A',
  'Att': 'A',
  'Pc': 'A'
}

// Mappa squadre Fantacalcio -> ID API-Football
const teamIdMapping: Record<string, number> = {
  'Atalanta': 499,
  'Bologna': 500,
  'Cagliari': 523,
  'Como': 867,
  'Empoli': 511,
  'Fiorentina': 502,
  'Genoa': 515,
  'Inter': 505,
  'Juventus': 496,
  'Lazio': 503,
  'Lecce': 514,
  'Milan': 489,
  'Monza': 520,
  'Napoli': 492,
  'Parma': 523,
  'Roma': 504,
  'Torino': 506,
  'Udinese': 524,
  'Venezia': 5890,
  'Verona': 517
}

export async function POST() {
  try {
    console.log('🔄 Importazione giocatori da Fantacalcio.it...')
    
    // URL delle quotazioni Fantacalcio.it
    const url = 'https://www.fantacalcio.it/quotazioni-fantacalcio/fantacalcio'
    
    // Scarica la pagina
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Errore download quotazioni')
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const players: any[] = []
    let playerId = 1
    
    // Trova tutti i giocatori nella tabella
    $('.player-list tbody tr').each((index, element) => {
      try {
        const $row = $(element)
        
        // Estrai dati giocatore
        const name = $row.find('.player-name a').text().trim()
        const roleRaw = $row.find('.player-role').text().trim()
        const team = $row.find('.player-team').text().trim()
        const price = parseInt($row.find('.player-price').text().replace(/[^\d]/g, '') || '0')
        const avgRating = parseFloat($row.find('.player-avg').text().replace(',', '.') || '6.0')
        
        // Mappa ruolo
        const role = roleMapping[roleRaw] || 'C'
        const teamId = teamIdMapping[team] || 0
        
        if (name && team && teamId) {
          players.push({
            id: playerId++,
            name,
            position: role,
            team,
            team_id: teamId,
            goals: 0, // Da aggiornare con statistiche reali
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
            clean_sheets: 0,
            games_played: 0,
            titolarita: price > 10 ? 80 : price > 5 ? 60 : 40, // Stima basata su prezzo
            media_voto: avgRating,
            updated_at: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('Errore parsing giocatore:', err)
      }
    })
    
    console.log(`📊 Trovati ${players.length} giocatori`)
    
    if (players.length === 0) {
      // Fallback: usa API-Football
      console.log('⚠️ Nessun giocatore da Fantacalcio.it, uso API-Football...')
      
      const apiFootballKey = process.env.API_FOOTBALL_KEY
      if (!apiFootballKey) {
        throw new Error('API key mancante')
      }
      
      // Recupera da API-Football (codice esistente)
      const teamsResponse = await fetch(
        'https://v3.football.api-sports.io/teams?league=135&season=2024',
        {
          headers: { 'x-apisports-key': apiFootballKey }
        }
      )
      
      if (!teamsResponse.ok) {
        throw new Error(`API-Football error: ${teamsResponse.status}`)
      }
      
      const teamsData = await teamsResponse.json()
      const teams = teamsData.response || []
      
      // Per ogni squadra recupera giocatori
      for (const team of teams.slice(0, 3)) { // Limita a 3 squadre per test
        try {
          const playersResponse = await fetch(
            `https://v3.football.api-sports.io/players?league=135&season=2024&team=${team.team.id}`,
            {
              headers: { 'x-apisports-key': apiFootballKey }
            }
          )
          
          if (playersResponse.ok) {
            const data = await playersResponse.json()
            const teamPlayers = data.response || []
            
            for (const p of teamPlayers) {
              if (p.player && p.statistics?.[0]) {
                const stats = p.statistics[0]
                const position = getPosition(stats.games?.position)
                
                players.push({
                  id: p.player.id,
                  name: p.player.name,
                  position,
                  team: team.team.name,
                  team_id: team.team.id,
                  goals: stats.goals?.total || 0,
                  assists: stats.goals?.assists || 0,
                  yellow_cards: stats.cards?.yellow || 0,
                  red_cards: stats.cards?.red || 0,
                  clean_sheets: 0,
                  games_played: stats.games?.appearences || 0,
                  titolarita: calculateTitularity(stats),
                  media_voto: calculateRating(stats, position),
                  updated_at: new Date().toISOString()
                })
              }
            }
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (err) {
          console.error(`Errore team ${team.team.name}:`, err)
        }
      }
    }
    
    // Salva in database
    if (players.length > 0) {
      console.log('💾 Salvando in database...')
      
      // Cancella vecchi dati
      await supabase
        .from('players_serie_a')
        .delete()
        .neq('id', 0)
      
      // Inserisci nuovi in batch da 100
      const batches = []
      for (let i = 0; i < players.length; i += 100) {
        batches.push(players.slice(i, i + 100))
      }
      
      for (const batch of batches) {
        const { error } = await supabase
          .from('players_serie_a')
          .insert(batch)
        
        if (error) {
          console.error('Errore inserimento batch:', error)
        }
      }
      
      console.log('✅ Import completato!')
    }
    
    return NextResponse.json({
      success: true,
      imported: players.length,
      source: players.length > 0 ? 'mixed' : 'none',
      message: `Importati ${players.length} giocatori`
    })
    
  } catch (error) {
    console.error('❌ Errore import:', error)
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