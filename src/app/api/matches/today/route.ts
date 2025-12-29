import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { COMPLETE_LEAGUES } from '@/lib/football-api-complete'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get league and date from search params
    const searchParams = request.nextUrl.searchParams
    const leagueParam = searchParams.get('league') || 'all'
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const currentTime = new Date().toTimeString().slice(0, 5)
    
    console.log(`🔍 Fetching matches for ${leagueParam} on ${dateParam}`)
    
    // Build query per il database completo
    let query = supabase
      .from('matches')
      .select('*')
      .eq('match_date', dateParam)
      .order('match_time', { ascending: true })
    
    // Solo per oggi filtra per orari futuri, per altre date mostra tutto
    if (dateParam === new Date().toISOString().split('T')[0]) {
      query = query.gte('match_time', currentTime)
    }
    
    // Filter by specific league se richiesto
    if (leagueParam !== 'all' && COMPLETE_LEAGUES[leagueParam as keyof typeof COMPLETE_LEAGUES]) {
      const leagueId = COMPLETE_LEAGUES[leagueParam as keyof typeof COMPLETE_LEAGUES]
      query = query.eq('league_id', leagueId)
    }
    
    const { data: matches, error } = await query
    
    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        { 
          error: 'Database error',
          message: error.message,
          matches: getMockMatches()
        },
        { status: 500 }
      )
    }
    
    if (!matches || matches.length === 0) {
      console.log(`⚠️ No matches found for ${leagueParam} on ${dateParam}`)
      return NextResponse.json({
        success: true,
        league: leagueParam,
        date: dateParam,
        count: 0,
        matches: [],
        message: 'Nessuna partita trovata. Prova con un\'altra data o campionato.'
      })
    }
    
    // Format matches for frontend (COMPLETO)
    const formattedMatches = matches.map(match => ({
      id: match.fixture_id.toString(),
      league: match.league_name,
      leagueName: match.league_name,
      date: match.match_date,
      time: match.match_time,
      venue: match.venue?.name 
        ? `${match.venue.name}, ${match.venue.city || ''}`.replace(', ,', ',').replace(/,$/, '') 
        : getVenueByTeam(match.home_team?.name) || `Stadio ${match.home_team?.name || 'TBD'}`,
      homeTeam: {
        id: match.home_team?.id || 0,
        name: match.home_team?.name || 'Home',
        logo: match.home_team?.logo || ''
      },
      awayTeam: {
        id: match.away_team?.id || 0,
        name: match.away_team?.name || 'Away', 
        logo: match.away_team?.logo || ''
      },
      status: 'scheduled',
      predictions: match.predictions ? {
        home: parseInt(match.predictions.home) || 33,
        draw: parseInt(match.predictions.draw) || 33,
        away: parseInt(match.predictions.away) || 34,
        confidence: getSmartConfidence(match.predictions, match.home_team?.name, match.away_team?.name),
        advice: getSmartAdvice(match.predictions, match.home_team?.name, match.away_team?.name)
      } : undefined,
      odds: match.odds || null,
      // Aggiungi info complete
      api_predictions: match.predictions,
      complete_odds: match.odds,
      venue_details: match.venue
    }))
    
    console.log(`✅ Found ${formattedMatches.length} matches for ${leagueParam}`)
    
    return NextResponse.json({
      success: true,
      league: leagueParam,
      date: dateParam,
      count: formattedMatches.length,
      matches: formattedMatches,
      leagues_available: Object.keys(COMPLETE_LEAGUES),
      database_source: true
    })
    
  } catch (error) {
    console.error('❌ Error in /api/matches/today:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch matches',
        message: error instanceof Error ? error.message : 'Unknown error',
        matches: getMockMatches()
      },
      { status: 500 }
    )
  }
}

// Logica INTELLIGENTE per confidence basata su forza squadre
function getSmartConfidence(predictions: any, homeTeam: string | undefined, awayTeam: string | undefined): 'ALTA' | 'MEDIA' | 'BASSA' {
  if (!homeTeam || !awayTeam || !predictions) return 'BASSA'
  
  const home = parseInt(predictions.home) || 33
  const draw = parseInt(predictions.draw) || 33  
  const away = parseInt(predictions.away) || 34
  
  // Squadre top in Serie A (sempre confidence alta)
  const topTeams = ['Inter', 'Juventus', 'Milan', 'AC Milan', 'Napoli', 'Roma', 'Atalanta', 'Lazio']
  const midTeams = ['Fiorentina', 'Bologna', 'Torino', 'Udinese', 'Sassuolo', 'Verona']
  const bottomTeams = ['Genoa', 'Empoli', 'Lecce', 'Monza', 'Salernitana', 'Spezia', 'Cremonese', 'Frosinone']
  
  // Top teams in Premier League
  const topPL = ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United', 'Newcastle', 'Tottenham']
  const midPL = ['Brighton', 'Aston Villa', 'West Ham', 'Crystal Palace', 'Brentford', 'Fulham']
  
  const isHomeTop = topTeams.includes(homeTeam) || topPL.includes(homeTeam)
  const isAwayTop = topTeams.includes(awayTeam) || topPL.includes(awayTeam)
  const isHomeBottom = bottomTeams.includes(homeTeam)
  const isAwayBottom = bottomTeams.includes(awayTeam)
  
  // ALTA confidence: top vs bottom, o grande differenza %
  if ((isHomeTop && isAwayBottom) || (isAwayTop && isHomeBottom)) {
    return 'ALTA'
  }
  
  // Differenza netta nelle percentuali
  const maxPercent = Math.max(home, draw, away)
  if (maxPercent >= 60) return 'ALTA'
  if (maxPercent >= 45) return 'MEDIA'
  
  return 'BASSA'
}

// Consigli INTELLIGENTI basati su logica calcistica
function getSmartAdvice(predictions: any, homeTeam: string | undefined, awayTeam: string | undefined): string {
  if (!homeTeam || !awayTeam || !predictions) return '1X'
  
  const home = parseInt(predictions.home) || 33
  const draw = parseInt(predictions.draw) || 33
  const away = parseInt(predictions.away) || 34
  
  // Identifica il risultato più probabile
  const maxPercent = Math.max(home, draw, away)
  let prediction = ''
  
  if (maxPercent === home) {
    // Casa favorita
    if (home >= 60) prediction = '1'  // Vittoria netta
    else if (home >= 45) prediction = '1X'  // Casa non perde
    else prediction = '1X'
  } else if (maxPercent === away) {
    // Ospite favorito  
    if (away >= 60) prediction = '2'  // Vittoria netta
    else if (away >= 45) prediction = 'X2'  // Ospite non perde  
    else prediction = 'X2'
  } else {
    // Pareggio più probabile
    if (draw >= 40) prediction = 'X'
    else if (home > away) prediction = '1X'
    else prediction = 'X2'
  }
  
  // Correzioni per squadre famose in casa (fattore campo)
  const strongAtHome = ['Inter', 'Juventus', 'Liverpool', 'Manchester City', 'Arsenal', 'Chelsea']
  if (strongAtHome.includes(homeTeam) && prediction.includes('2')) {
    prediction = prediction.includes('X') ? '1X' : '1'
  }
  
  return prediction
}

// Mapping stadi per squadre italiane
function getVenueByTeam(teamName: string | undefined): string | null {
  if (!teamName) return null
  
  const venues: { [key: string]: string } = {
    'Juventus': 'Allianz Stadium, Torino',
    'Inter': 'San Siro, Milano', 
    'AC Milan': 'San Siro, Milano',
    'Milan': 'San Siro, Milano',
    'Roma': 'Stadio Olimpico, Roma',
    'Lazio': 'Stadio Olimpico, Roma',
    'Napoli': 'Stadio Diego Armando Maradona, Napoli',
    'Atalanta': 'Gewiss Stadium, Bergamo',
    'Fiorentina': 'Stadio Artemio Franchi, Firenze',
    'Bologna': 'Stadio Renato Dall\'Ara, Bologna',
    'Torino': 'Stadio Olimpico Grande Torino, Torino',
    'Genoa': 'Stadio Luigi Ferraris, Genova',
    'Sampdoria': 'Stadio Luigi Ferraris, Genova',
    'Udinese': 'Dacia Arena, Udine',
    'Sassuolo': 'Mapei Stadium, Reggio Emilia',
    'Verona': 'Stadio Marcantonio Bentegodi, Verona',
    'Spezia': 'Stadio Alberto Picco, La Spezia',
    'Salernitana': 'Stadio Arechi, Salerno',
    'Cagliari': 'Unipol Domus, Cagliari',
    'Venezia': 'Stadio Pier Luigi Penzo, Venezia',
    'Empoli': 'Stadio Carlo Castellani, Empoli',
    'Lecce': 'Stadio Via del Mare, Lecce',
    'Monza': 'U-Power Stadium, Monza',
    'Cremonese': 'Stadio Giovanni Zini, Cremona',
    'Frosinone': 'Stadio Benito Stirpe, Frosinone'
  }
  
  return venues[teamName] || null
}

// Mock data for when API is not configured
function getMockMatches() {
  return [
    {
      id: 'mock-1',
      league: 'Serie A',
      leagueName: 'Serie A',
      date: new Date().toISOString().split('T')[0],
      time: '20:45',
      venue: 'Allianz Stadium, Torino',
      homeTeam: {
        id: 1,
        name: 'Juventus',
        logo: '/images/teams/juventus.png',
      },
      awayTeam: {
        id: 2,
        name: 'Milan',
        logo: '/images/teams/milan.png',
      },
      status: 'scheduled',
      predictions: {
        home: 52,
        draw: 26,
        away: 22,
        confidence: 'ALTA'
      }
    },
    {
      id: 'mock-2',
      league: 'Serie A',
      leagueName: 'Serie A',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      venue: 'Stadio Olimpico, Roma',
      homeTeam: {
        id: 3,
        name: 'Roma',
        logo: '/images/teams/roma.png',
      },
      awayTeam: {
        id: 4,
        name: 'Napoli',
        logo: '/images/teams/napoli.png',
      },
      status: 'scheduled',
      predictions: {
        home: 45,
        draw: 28,
        away: 27,
        confidence: 'MEDIA'
      }
    },
    {
      id: 'mock-3',
      league: 'Serie A', 
      leagueName: 'Serie A',
      date: new Date().toISOString().split('T')[0],
      time: '15:00',
      venue: 'San Siro, Milano',
      homeTeam: {
        id: 5,
        name: 'Inter',
        logo: '/images/teams/inter.png',
      },
      awayTeam: {
        id: 6,
        name: 'Lazio',
        logo: '/images/teams/lazio.png',
      },
      status: 'scheduled',
      predictions: {
        home: 58,
        draw: 24,
        away: 18,
        confidence: 'ALTA'
      }
    }
  ]
}