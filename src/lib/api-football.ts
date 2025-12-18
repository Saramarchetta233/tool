import axios from 'axios'

const API_KEY = process.env.API_FOOTBALL_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

// League IDs for API-Football
export const LEAGUES = {
  'serie-a': 135,
  'serie-b': 136,
  'premier': 39,
  'la-liga': 140,
  'bundesliga': 78,
  'ligue-1': 61,
  'champions': 2,
  'europa': 3,
} as const

// Team logos mapping (some common ones)
export const TEAM_LOGOS = {
  'Juventus': '/images/teams/juventus.png',
  'Milan': '/images/teams/milan.png', 
  'Inter': '/images/teams/inter.png',
  'Napoli': '/images/teams/napoli.png',
  'Roma': '/images/teams/roma.png',
  'Lazio': '/images/teams/lazio.png',
  // Add more as needed
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': 'v3.football.api-sports.io',
  },
})

export interface ApiFootballFixture {
  fixture: {
    id: number
    date: string
    status: {
      long: string
      short: string
    }
    venue: {
      name: string
      city: string
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
    }
    away: {
      id: number
      name: string
      logo: string
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
}

export interface ApiFootballPrediction {
  predictions: {
    winner: {
      id: number
      name: string
      comment: string
    }
    win_or_draw: boolean
    under_over: string
    goals: {
      home: string
      away: string
    }
    advice: string
    percent: {
      home: string
      draw: string
      away: string
    }
  }
  teams: {
    home: ApiFootballFixture['teams']['home']
    away: ApiFootballFixture['teams']['away']
  }
}

export interface ApiFootballH2H {
  fixture: ApiFootballFixture['fixture']
  teams: ApiFootballFixture['teams']
  goals: ApiFootballFixture['goals']
}

export class ApiFootballService {
  // Get today's fixtures for a specific league
  static async getTodayFixtures(leagueKey: keyof typeof LEAGUES) {
    const leagueId = LEAGUES[leagueKey]
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const response = await apiClient.get<{response: ApiFootballFixture[]}>('/fixtures', {
        params: {
          date: today,
          league: leagueId,
          season: new Date().getFullYear(),
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching fixtures:', error)
      throw new Error('Failed to fetch fixtures')
    }
  }

  // Get fixtures for a date range
  static async getFixtures(leagueKey: keyof typeof LEAGUES, from: string, to: string) {
    const leagueId = LEAGUES[leagueKey]
    
    try {
      const response = await apiClient.get<{response: ApiFootballFixture[]}>('/fixtures', {
        params: {
          league: leagueId,
          season: new Date().getFullYear(),
          from,
          to,
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching fixtures:', error)
      throw new Error('Failed to fetch fixtures')
    }
  }

  // Get predictions for a specific fixture
  static async getPredictions(fixtureId: number) {
    try {
      const response = await apiClient.get<{response: ApiFootballPrediction[]}>('/predictions', {
        params: {
          fixture: fixtureId,
        },
      })
      
      return response.data.response[0] || null
    } catch (error) {
      console.error('Error fetching predictions:', error)
      throw new Error('Failed to fetch predictions')
    }
  }

  // Get head to head between two teams
  static async getHeadToHead(team1Id: number, team2Id: number, last: number = 10) {
    try {
      const response = await apiClient.get<{response: ApiFootballH2H[]}>('/fixtures/headtohead', {
        params: {
          h2h: `${team1Id}-${team2Id}`,
          last,
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching H2H:', error)
      throw new Error('Failed to fetch head to head')
    }
  }

  // Search teams by name
  static async searchTeams(query: string) {
    try {
      const response = await apiClient.get('/teams', {
        params: {
          search: query,
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error searching teams:', error)
      throw new Error('Failed to search teams')
    }
  }

  // Get team statistics for current season
  static async getTeamStats(teamId: number, leagueId: number) {
    try {
      const response = await apiClient.get('/teams/statistics', {
        params: {
          team: teamId,
          league: leagueId,
          season: new Date().getFullYear(),
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching team stats:', error)
      throw new Error('Failed to fetch team statistics')
    }
  }

  // Get injuries for a specific fixture
  static async getInjuries(fixtureId: number) {
    try {
      const response = await apiClient.get('/injuries', {
        params: {
          fixture: fixtureId,
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching injuries:', error)
      return [] // Return empty array if no injuries data
    }
  }
}

// Helper function to format match data for our frontend
export function formatMatchForFrontend(fixture: ApiFootballFixture): any {
  return {
    id: fixture.fixture.id.toString(),
    league: fixture.league.name,
    leagueName: fixture.league.name,
    date: fixture.fixture.date.split('T')[0],
    time: new Date(fixture.fixture.date).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    venue: `${fixture.fixture.venue.name}, ${fixture.fixture.venue.city}`,
    homeTeam: {
      id: fixture.teams.home.id,
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
    },
    awayTeam: {
      id: fixture.teams.away.id,
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
    },
    status: fixture.fixture.status.long === 'Not Started' ? 'scheduled' : 
            fixture.fixture.status.long === 'Match Finished' ? 'finished' : 'live',
  }
}