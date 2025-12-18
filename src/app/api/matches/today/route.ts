import { NextRequest, NextResponse } from 'next/server'
import { ApiFootballService, formatMatchForFrontend, LEAGUES } from '@/lib/api-football'

export async function GET(request: NextRequest) {
  try {
    // Get league from search params, default to Serie A
    const searchParams = request.nextUrl.searchParams
    const leagueParam = searchParams.get('league') || 'serie-a'
    
    // Validate league
    if (!Object.keys(LEAGUES).includes(leagueParam)) {
      return NextResponse.json(
        { error: 'Invalid league parameter' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.API_FOOTBALL_KEY) {
      return NextResponse.json(
        { 
          error: 'API Football not configured',
          message: 'Configura API_FOOTBALL_KEY nelle variabili d\'ambiente',
          mockData: true,
          matches: getMockMatches()
        },
        { status: 200 }
      )
    }

    const league = leagueParam as keyof typeof LEAGUES
    const fixtures = await ApiFootballService.getTodayFixtures(league)
    
    // Format matches for frontend
    const matches = fixtures.map(formatMatchForFrontend)
    
    return NextResponse.json({
      success: true,
      league: leagueParam,
      date: new Date().toISOString().split('T')[0],
      count: matches.length,
      matches,
    })
    
  } catch (error) {
    console.error('Error in /api/matches/today:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch matches',
        mockData: true,
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