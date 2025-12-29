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
        ...getIntelligentPredictions(match.home_team?.name, match.away_team?.name, match.league_name),
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

// PREDICTIONS INTELLIGENTI basate su forza reale delle squadre
function getIntelligentPredictions(homeTeam: string | undefined, awayTeam: string | undefined, league: string | undefined): {home: number, draw: number, away: number} {
  if (!homeTeam || !awayTeam) return {home: 33, draw: 33, away: 34}
  
  // Rating squadre (1-10)
  const teamRatings: { [key: string]: number } = {
    // Serie A
    'Inter': 9, 'Napoli': 9, 'Juventus': 8.5, 'Milan': 8, 'AC Milan': 8, 'Atalanta': 8, 
    'Roma': 7.5, 'Lazio': 7.5, 'Fiorentina': 7, 'Bologna': 6.5, 'Torino': 6,
    'Udinese': 5.5, 'Sassuolo': 5.5, 'Verona': 5, 'Genoa': 4.5, 'Empoli': 4.5, 
    'Lecce': 4, 'Monza': 4, 'Salernitana': 3.5, 'Spezia': 3.5, 'Cremonese': 3,
    
    // Premier League  
    'Manchester City': 9.5, 'Arsenal': 9, 'Liverpool': 9, 'Chelsea': 8, 'Manchester United': 8,
    'Newcastle': 7.5, 'Tottenham': 7.5, 'Aston Villa': 7, 'Brighton': 6.5, 'West Ham': 6,
    'Crystal Palace': 5.5, 'Brentford': 5.5, 'Fulham': 5.5, 'Wolves': 5, 'Everton': 5,
    'Nottingham Forest': 4.5, 'Bournemouth': 4.5, 'Burnley': 4, 'Luton': 3.5, 'Sheffield United': 3,
    
    // La Liga
    'Real Madrid': 9.5, 'Barcelona': 9, 'Atletico Madrid': 8.5, 'Real Sociedad': 7, 'Villarreal': 7,
    'Athletic Bilbao': 6.5, 'Valencia': 6, 'Sevilla': 6, 'Real Betis': 6, 'Osasuna': 5.5,
    
    // Bundesliga
    'Bayern Munich': 9.5, 'Borussia Dortmund': 8.5, 'RB Leipzig': 8, 'Bayer Leverkusen': 8,
    'Eintracht Frankfurt': 7, 'VfL Wolfsburg': 6.5, 'Union Berlin': 6, 'Borussia Monchengladbach': 6
  }
  
  const homeRating = teamRatings[homeTeam] || 5
  const awayRating = teamRatings[awayTeam] || 5
  
  // Fattore campo (+0.5 per casa)
  const adjustedHomeRating = homeRating + 0.5
  const ratingDiff = adjustedHomeRating - awayRating
  
  // Calcola percentuali basate su differenza rating
  let home: number, draw: number, away: number
  
  if (ratingDiff >= 3) {
    // Casa molto favorita (es: City vs Luton)
    home = 70; draw = 20; away = 10
  } else if (ratingDiff >= 2) {
    // Casa favorita (es: Arsenal vs Aston Villa)  
    home = 60; draw = 25; away = 15
  } else if (ratingDiff >= 1) {
    // Casa leggermente favorita
    home = 50; draw = 30; away = 20
  } else if (ratingDiff >= -1) {
    // Equilibrata
    home = 40; draw = 30; away = 30
  } else if (ratingDiff >= -2) {
    // Ospite leggermente favorito
    home = 30; draw = 30; away = 40
  } else {
    // Ospite favorito
    home = 20; draw = 25; away = 55
  }
  
  return {home, draw, away}
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

// Consigli INTELLIGENTI basati su logica calcistica con TESTO BELLO
function getSmartAdvice(predictions: any, homeTeam: string | undefined, awayTeam: string | undefined): string {
  if (!homeTeam || !awayTeam || !predictions) return `${homeTeam} non perde`
  
  const home = parseInt(predictions.home) || 33
  const draw = parseInt(predictions.draw) || 33
  const away = parseInt(predictions.away) || 34
  
  // Identifica il risultato più probabile
  const maxPercent = Math.max(home, draw, away)
  
  if (maxPercent === home) {
    // Casa favorita
    if (home >= 60) return `${homeTeam} vince`  // Vittoria netta
    else return `${homeTeam} non perde`  // Casa non perde
  } else if (maxPercent === away) {
    // Ospite favorito  
    if (away >= 60) return `${awayTeam} vince`  // Vittoria netta
    else return `${awayTeam} non perde`  // Ospite non perde  
  } else {
    // Pareggio più probabile
    if (draw >= 40) return 'Pareggio'
    else if (home > away) return `${homeTeam} non perde`
    else return `${awayTeam} non perde`
  }
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