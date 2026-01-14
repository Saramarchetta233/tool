import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mappa ruoli Fantacalcio -> nostri ruoli
const roleMapping: Record<string, 'P' | 'D' | 'C' | 'A'> = {
  'P': 'P', 'Por': 'P',
  'D': 'D', 'Dif': 'D', 'Dc': 'D', 'Dd': 'D', 'Ds': 'D', 'E': 'D',
  'C': 'C', 'Cen': 'C', 'Cc': 'C', 'M': 'C', 'T': 'C',
  'W': 'A', 'A': 'A', 'Att': 'A', 'Pc': 'A'
}

// ID squadre Serie A 2025-26 corretti
const teamIdMapping: Record<string, number> = {
  'Atalanta': 499, 'Bologna': 500, 'Cagliari': 490, 'Como': 1028,
  'Fiorentina': 502, 'Genoa': 495, 'Inter': 505, 'Juventus': 496,
  'Lazio': 487, 'Lecce': 867, 'Milan': 489, 'Monza': 1579,
  'Napoli': 492, 'Parma': 511, 'Roma': 497, 'Torino': 503,
  'Udinese': 494, 'Venezia': 517, 'Verona': 504, 'Empoli': 515
}

function calculateTitularity(price: number): number {
  // Stima titolarità basata su quotazione Fantacalcio
  if (price >= 25) return 90      // Top players
  if (price >= 15) return 80      // Titolari fissi  
  if (price >= 10) return 70      // Titolari/Riserve
  if (price >= 5) return 50       // Riserve
  return 30                       // Giovani/Panchinari
}

function calculateFantaVote(price: number, role: string): number {
  // Stima media voto basata su quotazione
  let base = 6.0
  if (price >= 30) base = 7.5     // Fenomeni
  else if (price >= 20) base = 7.0  // Top
  else if (price >= 10) base = 6.5  // Buoni
  else if (price >= 5) base = 6.2   // Medi
  
  // Bonus per ruolo (attaccanti hanno medie più alte)
  if (role === 'A') base += 0.2
  if (role === 'P') base += 0.1
  
  return Math.round(base * 10) / 10
}

export async function POST() {
  try {
    console.log('🚀 Importazione REAL 2025-26 da Fantacalcio.it...')
    
    // URL quotazioni Serie A 2025-26 AGGIORNATE
    const url = 'https://www.fantacalcio.it/quotazioni-fantacalcio'
    
    console.log('📥 Fetching da Fantacalcio.it...')
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const players: any[] = []
    let playerId = 1
    
    console.log('🔍 Parsing HTML con struttura corretta Fantacalcio.it...')
    
    // Usa la struttura identificata: table tbody tr
    const rows = $('table tbody tr')
    console.log(`Found ${rows.length} table rows`)
    let foundPlayers = false
    
    if (rows.length > 0) {
      foundPlayers = true
      
      rows.each((index, element) => {
        try {
          const $row = $(element)
          const cells = $row.find('td')
          
          if (cells.length >= 4) {
            // Struttura Fantacalcio.it:
            // Colonna 1: Nome giocatore (con link)
            // Colonna 2: Squadra (abbreviazione)  
            // Colonna 3: QI Classic (quotazione iniziale)
            // Colonna 4: QA Classic (quotazione attuale)
            
            const name = $(cells[0]).find('a').text().trim() || $(cells[0]).text().trim()
            const teamAbbrev = $(cells[1]).text().trim()
            const priceText = $(cells[3]).text().trim() || $(cells[2]).text().trim() // QA o QI
            
            // Debug primi 5 per capire la struttura
            if (index < 5) {
              console.log(`Row ${index}: cells=${cells.length}, name="${name}", team="${teamAbbrev}", price="${priceText}"`)
              for (let i = 0; i < Math.min(cells.length, 8); i++) {
                console.log(`  Cell ${i}: "${$(cells[i]).text().trim()}"`)
              }
            }
            
            if (name && name.length > 2 && teamAbbrev) {
              // Mappa abbreviazioni squadre a nomi completi
              const teamMapping: Record<string, string> = {
                'ATA': 'Atalanta', 'BOL': 'Bologna', 'CAG': 'Cagliari', 'COM': 'Como',
                'FIO': 'Fiorentina', 'GEN': 'Genoa', 'INT': 'Inter', 'JUV': 'Juventus',
                'LAZ': 'Lazio', 'LEC': 'Lecce', 'MIL': 'Milan', 'MON': 'Monza',
                'NAP': 'Napoli', 'PAR': 'Parma', 'ROM': 'Roma', 'TOR': 'Torino',
                'UDI': 'Udinese', 'VEN': 'Venezia', 'VER': 'Verona', 'EMP': 'Empoli'
              }
              
              const team = teamMapping[teamAbbrev] || teamAbbrev
              const teamId = teamIdMapping[team] || 0
              const price = parseInt(priceText.replace(/[^\d]/g, '') || '1')
              
              // Deduce il ruolo dal nome/posizione o usa logica euristica
              let role: 'P' | 'D' | 'C' | 'A' = 'C' // Default centrocampista
              
              // Euristica per dedurre il ruolo (migliorabile)
              const nameLower = name.toLowerCase()
              if (nameLower.includes('keeper') || nameLower.includes('szczesny') || 
                  nameLower.includes('handanovic') || nameLower.includes('maignan')) {
                role = 'P'
              } else if (price >= 25) {
                role = 'A' // Attaccanti costosi
              } else if (price >= 15) {
                role = 'C' // Centrocampisti/trequartisti
              } else if (price >= 8) {
                role = 'D' // Difensori
              } // Altrimenti rimane 'C'
              
              if (teamId > 0) {
                players.push({
                  id: playerId++,
                  name: name,
                  position: role,
                  team: team,
                  team_id: teamId,
                  goals: 0,
                  assists: 0,
                  yellow_cards: 0,
                  red_cards: 0,
                  clean_sheets: 0,
                  games_played: 0,
                  titolarita: calculateTitularity(price),
                  media_voto: calculateFantaVote(price, role),
                  quotazione: price,
                  updated_at: new Date().toISOString()
                })
                
                // Debug primi 10 giocatori
                if (playerId <= 11) {
                  console.log(`Player ${playerId-1}: ${name} (${role}) - ${team} - €${price}`)
                }
              }
            }
          }
        } catch (err) {
          console.error('Errore parsing row:', err)
        }
      })
    }
    
    if (!foundPlayers) {
      // Fallback: scraping alternativo o dati hardcoded
      console.log('⚠️ Scraping fallito, usando dati base...')
      
      // Qui potresti aggiungere alcuni giocatori base hardcoded
      // per la stagione 2025-26 se lo scraping non funziona
    }
    
    console.log(`📊 Total players extracted: ${players.length}`)
    
    if (players.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nessun giocatore estratto da Fantacalcio.it',
        imported: 0
      })
    }
    
    // Salva nel database
    console.log('🗑️ Clearing old data...')
    await supabase.from('players_serie_a').delete().neq('id', 0)
    
    console.log('💾 Inserting new data...')
    const batches = []
    for (let i = 0; i < players.length; i += 100) {
      batches.push(players.slice(i, i + 100))
    }
    
    let inserted = 0
    for (const batch of batches) {
      const { error } = await supabase
        .from('players_serie_a')
        .insert(batch)
      
      if (error) {
        console.error('Insert error:', error)
      } else {
        inserted += batch.length
        console.log(`Inserted ${inserted}/${players.length} players`)
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: inserted,
      total_found: players.length,
      season: '2025/2026',
      source: 'fantacalcio.it-real',
      message: `Successfully imported ${inserted} REAL Serie A players for 2025-26`
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