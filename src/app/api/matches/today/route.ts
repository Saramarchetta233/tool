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
      .gte('match_time', currentTime) // Solo partite future
      .order('match_time', { ascending: true })
    
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
      venue: match.venue ? `${match.venue.name}, ${match.venue.city}` : 'TBD',
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
        confidence: match.predictions.confidence === 'high' ? 'ALTA' : 
                   match.predictions.confidence === 'medium' ? 'MEDIA' : 'BASSA'
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