import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SERIE_A_LEAGUE_ID = 135

export async function GET() {
  try {
    // Verifica chiave API
    const apiFootballKey = process.env.API_FOOTBALL_KEY
    if (!apiFootballKey) {
      return NextResponse.json({
        error: 'API_FOOTBALL_KEY mancante. Configura la chiave per dati reali.',
        fixtures: []
      }, { status: 500 })
    }
    
    // Controlla cache prima (6 ore)
    const { data: cachedData } = await supabase
      .from('fantacoach_fixtures_cache')
      .select('*')
      .gte('cached_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .single()
    
    if (cachedData) {
      console.log('📝 Returning cached fixtures')
      return NextResponse.json({ 
        fixtures: cachedData.fixtures,
        round: cachedData.round,
        cached: true 
      })
    }
    
    console.log('🔄 Fetching fresh fixtures from API-Football...')
    
    // Recupera prossime 10 partite Serie A
    const fixturesResponse = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${SERIE_A_LEAGUE_ID}&season=2025&next=10`,
      {
        headers: {
          'x-apisports-key': apiFootballKey
        }
      }
    )
    
    if (!fixturesResponse.ok) {
      throw new Error(`Errore recupero partite: ${fixturesResponse.status}`)
    }
    
    const fixturesData = await fixturesResponse.json()
    const fixtures = fixturesData.response || []
    
    if (fixtures.length === 0) {
      throw new Error('Nessuna partita trovata')
    }
    
    // Estrai round dalla prima partita
    const round = fixtures[0]?.league?.round || 'Regular Season'
    
    // Formatta le partite
    const formattedFixtures = fixtures.map((fixture: any) => {
      const date = new Date(fixture.fixture.date)
      
      // Calcola difficoltà basata sui ranking (simulato per ora)
      const homeRank = getTeamRank(fixture.teams.home.name)
      const awayRank = getTeamRank(fixture.teams.away.name)
      
      return {
        fixture_id: fixture.fixture.id,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        time: date.toTimeString().slice(0, 5), // HH:MM
        home: {
          id: fixture.teams.home.id,
          name: fixture.teams.home.name,
          rank: homeRank
        },
        away: {
          id: fixture.teams.away.id,
          name: fixture.teams.away.name,
          rank: awayRank
        },
        venue: fixture.fixture.venue?.name || 'TBD',
        homeDifficulty: getMatchDifficulty(homeRank, awayRank, true),
        awayDifficulty: getMatchDifficulty(awayRank, homeRank, false)
      }
    })
    
    // Salva in cache
    await supabase
      .from('fantacoach_fixtures_cache')
      .upsert({
        round: round,
        fixtures: formattedFixtures,
        cached_at: new Date().toISOString()
      })
    
    console.log(`✅ Recuperate ${formattedFixtures.length} partite`)
    
    return NextResponse.json({ 
      fixtures: formattedFixtures,
      round: round,
      cached: false
    })
    
  } catch (error) {
    console.error('❌ Errore API fantacoach/fixtures:', error)
    return NextResponse.json({
      error: `Errore recupero partite: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fixtures: []
    }, { status: 500 })
  }
}

// Ranking simulato squadre Serie A (da aggiornare con dati reali)
function getTeamRank(teamName: string): number {
  const rankings: Record<string, number> = {
    'Inter': 1,
    'Napoli': 2,
    'Atalanta': 3,
    'Lazio': 4,
    'Juventus': 5,
    'Roma': 6,
    'Milan': 7,
    'Bologna': 8,
    'Fiorentina': 9,
    'Torino': 10,
    'Udinese': 11,
    'Empoli': 12,
    'Parma': 13,
    'Como': 14,
    'Monza': 15,
    'Verona': 16,
    'Cagliari': 17,
    'Genoa': 18,
    'Lecce': 19,
    'Venezia': 20
  }
  
  return rankings[teamName] || 10
}

// Calcola difficoltà partita
function getMatchDifficulty(teamRank: number, opponentRank: number, isHome: boolean): 'easy' | 'medium' | 'hard' {
  const rankDiff = opponentRank - teamRank
  
  if (isHome) {
    if (rankDiff > 8) return 'easy'
    if (rankDiff > 3) return 'medium'
    return 'hard'
  } else {
    if (rankDiff > 10) return 'easy'
    if (rankDiff > 5) return 'medium'
    return 'hard'
  }
}