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
    
    console.log('🔄 SYNC FIX: Scarico TUTTI i giocatori Serie A con nuovo approccio...')
    
    // 1. Prima pulisco COMPLETAMENTE il database
    console.log('🧹 Pulizia completa database...')
    const { error: truncateError } = await supabase
      .from('players_serie_a')
      .delete()
      .gte('id', 0) // Cancella TUTTO
    
    if (truncateError) {
      console.error('❌ Errore pulizia:', truncateError)
      throw truncateError
    }
    
    // 2. Recupera TUTTE le squadre Serie A
    const teamsResponse = await fetch(
      `https://v3.football.api-sports.io/teams?league=${SERIE_A_LEAGUE_ID}&season=2025`,
      {
        headers: { 'x-apisports-key': apiFootballKey }
      }
    )
    
    const teamsData = await teamsResponse.json()
    const teams = teamsData.response || []
    
    if (teams.length === 0) {
      throw new Error('Nessuna squadra trovata')
    }
    
    console.log(`📊 Trovate ${teams.length} squadre Serie A`)
    
    const allPlayers: any[] = []
    let processedTeams = 0
    const teamNames: string[] = []
    
    // 3. SCARICA TUTTE LE SQUADRE
    for (const team of teams) {
      processedTeams++
      teamNames.push(team.team.name)
      console.log(`⚽ [${processedTeams}/${teams.length}] Scarico ${team.team.name}...`)
      
      try {
        const playersResponse = await fetch(
          `https://v3.football.api-sports.io/players?league=${SERIE_A_LEAGUE_ID}&season=2025&team=${team.team.id}`,
          {
            headers: { 'x-apisports-key': apiFootballKey }
          }
        )
        
        if (playersResponse.ok) {
          const data = await playersResponse.json()
          const players = data.response || []
          
          console.log(`   → Trovati ${players.length} giocatori`)
          
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
                clean_sheets: position === 'P' ? (stats.goals?.conceded || 0) : 0,
                games_played: stats.games?.appearences || 0,
                titolarita: calculateTitularity(stats),
                media_voto: calculateRating(stats, position),
                updated_at: new Date().toISOString()
              })
            }
          }
        } else {
          console.error(`   ❌ Errore API per ${team.team.name}: ${playersResponse.status}`)
        }
        
        // Pausa più lunga per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`❌ Errore team ${team.team.name}:`, error)
      }
    }
    
    console.log(`\n📊 RIEPILOGO:`)
    console.log(`   → Squadre processate: ${teams.length}`)
    console.log(`   → Giocatori totali: ${allPlayers.length}`)
    console.log(`   → Squadre: ${teamNames.join(', ')}`)
    
    // 4. Salva TUTTO in una volta sola
    if (allPlayers.length > 0) {
      console.log('\n💾 Salvataggio in database (unica operazione)...')
      
      const { data, error: insertError } = await supabase
        .from('players_serie_a')
        .insert(allPlayers)
        .select()
      
      if (insertError) {
        console.error('❌ Errore inserimento:', insertError)
        throw insertError
      }
      
      console.log(`✅ SALVATI ${data?.length || 0} giocatori!`)
      
      // 5. Verifica finale
      const { count } = await supabase
        .from('players_serie_a')
        .select('*', { count: 'exact', head: true })
      
      console.log(`\n🔍 VERIFICA FINALE: ${count} giocatori nel database`)
    }
    
    // Statistiche finali
    const stats = {
      portieri: allPlayers.filter(p => p.position === 'P').length,
      difensori: allPlayers.filter(p => p.position === 'D').length,
      centrocampisti: allPlayers.filter(p => p.position === 'C').length,
      attaccanti: allPlayers.filter(p => p.position === 'A').length
    }
    
    return NextResponse.json({
      success: true,
      totale_giocatori: allPlayers.length,
      squadre: teams.length,
      squadre_nomi: teamNames,
      statistiche: stats,
      message: `Sync completato: ${allPlayers.length} giocatori da ${teams.length} squadre Serie A`,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Errore sync completo:', error)
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