import axios from 'axios'

const API_KEY = process.env.API_FOOTBALL_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

// League IDs for API-Football - Easily extensible
export const LEAGUES = {
  // Italian Leagues
  'serie-a': 135,
  'serie-b': 136,
  'supercoppa': 547,
  
  // English Leagues
  'premier': 39,
  'championship': 40,
  
  // Spanish Leagues
  'la-liga': 140,
  'la-liga-2': 141,
  
  // German Leagues
  'bundesliga': 78,
  'bundesliga-2': 79,
  
  // French Leagues
  'ligue-1': 61,
  'ligue-2': 62,
  
  // European Competitions
  'champions': 2,
  'europa': 3,
  
  // New Leagues - Easy to add more here!
  'elf-cup': 48,           // ELF Cup
  'primeira-liga': 94,     // Primeira Liga Portuguesa
} as const

// Helper function to get all available leagues
export function getAllLeagueKeys(): (keyof typeof LEAGUES)[] {
  return Object.keys(LEAGUES) as (keyof typeof LEAGUES)[]
}

// Helper function to get league display info
export function getLeagueDisplayInfo() {
  return [
    { key: 'all', name: 'Tutti i Campionati', flag: '🌍' },
    { key: 'serie-a', name: 'Serie A', flag: '🇮🇹' },
    { key: 'serie-b', name: 'Serie B', flag: '🇮🇹' },
    { key: 'supercoppa', name: 'Supercoppa Italiana', flag: '🇮🇹' },
    { key: 'premier', name: 'Premier League', flag: '🇬🇧' },
    { key: 'la-liga', name: 'La Liga', flag: '🇪🇸' },
    { key: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪' },
    { key: 'ligue-1', name: 'Ligue 1', flag: '🇫🇷' },
    { key: 'champions', name: 'Champions League', flag: '🏆' },
    { key: 'europa', name: 'Europa League', flag: '🏆' },
    { key: 'elf-cup', name: 'ELF Cup', flag: '⚽' },
    { key: 'primeira-liga', name: 'Primeira Liga', flag: '🇵🇹' },
  ]
}

// Helper function to get current season based on date
function getCurrentSeason(): number {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  // La stagione calcistica europea va da agosto a luglio
  // Se siamo tra gennaio e luglio, siamo nella seconda metà della stagione (anno precedente)
  // Se siamo tra agosto e dicembre, siamo nella prima metà della stagione (anno corrente)
  if (currentMonth >= 1 && currentMonth <= 7) {
    return currentYear - 1 // es. gennaio 2026 = stagione 2025-2026
  } else {
    return currentYear // es. settembre 2026 = stagione 2026-2027
  }
}

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
    'x-apisports-key': API_KEY,
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

export interface ApiFootballOdds {
  fixture: {
    id: number
    timezone: string
    date: string
    timestamp: number
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
  bookmakers: Array<{
    id: number
    name: string
    bets: Array<{
      id: number
      name: string
      values: Array<{
        value: string
        odd: string
      }>
    }>
  }>
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
          season: getCurrentSeason(),
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
          season: getCurrentSeason(),
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

  // Get fixtures for next 7 days
  static async getNext7DaysFixtures(leagueKey: keyof typeof LEAGUES) {
    const today = new Date()
    const from = today.toISOString().split('T')[0]
    
    const to = new Date(today)
    to.setDate(to.getDate() + 7)
    const toDate = to.toISOString().split('T')[0]
    
    return this.getFixtures(leagueKey, from, toDate)
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
          season: getCurrentSeason(),
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching team stats:', error)
      throw new Error('Failed to fetch team statistics')
    }
  }

  // Get odds for a specific fixture
  static async getOdds(fixtureId: number) {
    try {
      const response = await apiClient.get<{response: ApiFootballOdds[]}>('/odds', {
        params: {
          fixture: fixtureId,
        },
      })
      
      return response.data.response[0] || null
    } catch (error) {
      console.error('Error fetching odds:', error)
      return null // Return null instead of throwing to allow fallback to mock data
    }
  }

  // Get odds for live/pre-match games
  static async getLiveOdds(fixtureId: number) {
    try {
      const response = await apiClient.get<{response: ApiFootballOdds[]}>('/odds/live', {
        params: {
          fixture: fixtureId,
        },
      })
      
      return response.data.response[0] || null
    } catch (error) {
      console.error('Error fetching live odds:', error)
      return null
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

  // Get transfers for a specific team
  static async getTeamTransfers(teamId: number) {
    try {
      const response = await apiClient.get('/transfers', {
        params: {
          team: teamId,
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching transfers:', error)
      return []
    }
  }

  // Get player statistics for current season
  static async getPlayerStats(playerId: number, season?: number) {
    try {
      const response = await apiClient.get('/players', {
        params: {
          id: playerId,
          season: season || getCurrentSeason(),
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching player stats:', error)
      return []
    }
  }

  // Get team players/squad
  static async getTeamPlayers(teamId: number) {
    try {
      const response = await apiClient.get('/players/squads', {
        params: {
          team: teamId,
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching team players:', error)
      return []
    }
  }

  // Get standings for a league
  static async getLeagueStandings(leagueId: number, season?: number) {
    try {
      const response = await apiClient.get('/standings', {
        params: {
          league: leagueId,
          season: season || getCurrentSeason(),
        },
      })
      
      return response.data.response[0]?.league?.standings[0] || []
    } catch (error) {
      console.error('Error fetching standings:', error)
      return []
    }
  }

  // Get recent team form (last 5 matches)
  static async getTeamForm(teamId: number, last: number = 5) {
    try {
      const response = await apiClient.get('/fixtures', {
        params: {
          team: teamId,
          last,
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching team form:', error)
      return []
    }
  }

  // Get live fixtures
  static async getLiveFixtures() {
    try {
      const response = await apiClient.get<{response: ApiFootballFixture[]}>('/fixtures', {
        params: {
          live: 'all',
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching live fixtures:', error)
      return []
    }
  }

  // Get top scorers for a league
  static async getTopScorers(leagueId: number, season?: number) {
    try {
      const response = await apiClient.get('/players/topscorers', {
        params: {
          league: leagueId,
          season: season || getCurrentSeason(),
        },
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching top scorers:', error)
      return []
    }
  }

  // Get coachs for teams
  static async getCoaches(teamId?: number) {
    try {
      const response = await apiClient.get('/coachs', {
        params: teamId ? { team: teamId } : {},
      })
      
      return response.data.response
    } catch (error) {
      console.error('Error fetching coaches:', error)
      return []
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

// Get default odds as fallback - WITH ALL MARKETS
export function getDefaultOdds() {
  return {
    winner: { home: 2.00, draw: 3.00, away: 3.50 },
    goals: {
      over_0_5: 1.05, under_0_5: 12.00,
      over_1_5: 1.30, under_1_5: 3.50,
      over_2_5: 1.80, under_2_5: 2.00,
      over_3_5: 2.50, under_3_5: 1.50,
      over_4_5: 4.00, under_4_5: 1.25,
      over_5_5: 8.00, under_5_5: 1.10,
      gol: 1.70, nogol: 2.10 // Changed from btts/nobtts
    },
    doubleChance: { x1: 1.25, x2: 1.75, x12: 1.35 },
    multigol: { 
      mg_1_2: 2.50, mg_2_3: 2.80, mg_3_4: 4.00, mg_4_5: 8.50,
      mg_1_3: 1.75, mg_2_4: 1.53, mg_3_5: 3.50
    },
    correctScore: {
      '1-0': 8.50, '2-0': 12.00, '2-1': 9.50, '3-0': 25.00, '3-1': 22.00,
      '0-0': 7.50, '1-1': 6.00, '2-2': 14.00, '3-3': 45.00,
      '0-1': 11.00, '0-2': 18.00, '1-2': 11.50, '1-3': 35.00
    },
    firstHalf: {
      winner: { home: 2.80, draw: 2.20, away: 4.20 },
      over_0_5: 1.40, under_0_5: 2.80,
      over_1_5: 2.60, under_1_5: 1.45
    },
    combo: {
      'Home/Home': 2.50, 'Home/Draw': 15.00, 'Home/Away': 25.00,
      'Draw/Home': 8.00, 'Draw/Draw': 4.50, 'Draw/Away': 8.50,
      'Away/Home': 35.00, 'Away/Draw': 18.00, 'Away/Away': 5.50
    },
    handicap: {
      'Home -1': 3.20, 'Home +1': 1.35, 'Away -1': 4.50, 'Away +1': 1.28
    },
    firstGoalscorer: [],
    anytimeGoalscorer: []
  }
}

// Helper function to process API Football odds and convert to our format
export function formatOddsForFrontend(oddsData: ApiFootballOdds | null) {
  console.log('🎲 formatOddsForFrontend received data:', JSON.stringify(oddsData, null, 2))
  
  if (!oddsData || !oddsData.bookmakers.length) {
    console.log('❌ No odds data available, returning null')
    return null
  }

  console.log(`📊 Processing ${oddsData.bookmakers.length} bookmaker(s)`)

  // Get the first bookmaker's odds (you could average multiple bookmakers)
  const bookmaker = oddsData.bookmakers[0]
  console.log(`🏢 Using bookmaker: ${bookmaker.name} with ${bookmaker.bets.length} bet types`)
  console.log(`📋 Available bet types: ${bookmaker.bets.map(bet => bet.name).join(', ')}`)
  
  // Initialize with fallback odds from getDefaultOdds() instead of 1.00
  const defaultOdds = getDefaultOdds()
  const odds: any = {
    winner: { ...defaultOdds.winner },
    goals: { ...defaultOdds.goals },
    doubleChance: { ...defaultOdds.doubleChance },
    multigol: { ...defaultOdds.multigol },
    correctScore: { ...defaultOdds.correctScore },
    firstHalf: { ...defaultOdds.firstHalf },
    combo: { ...defaultOdds.combo },
    handicap: { ...defaultOdds.handicap },
    firstGoalscorer: [...defaultOdds.firstGoalscorer],
    anytimeGoalscorer: [...defaultOdds.anytimeGoalscorer]
  }

  // Process each bet type
  bookmaker.bets.forEach((bet, index) => {
    console.log(`📈 Processing bet ${index + 1}/${bookmaker.bets.length}: "${bet.name}" with ${bet.values.length} values`)
    
    switch(bet.name) {
      case 'Match Winner':
        console.log('🎯 Processing Match Winner odds')
        bet.values.forEach(value => {
          console.log(`  - ${value.value}: ${value.odd}`)
          if (value.value === 'Home') odds.winner.home = parseFloat(value.odd)
          if (value.value === 'Draw') odds.winner.draw = parseFloat(value.odd)
          if (value.value === 'Away') odds.winner.away = parseFloat(value.odd)
        })
        break
      
      case 'Goals Over/Under':
        bet.values.forEach(value => {
          if (value.value === 'Over 0.5') odds.goals.over_0_5 = parseFloat(value.odd)
          if (value.value === 'Under 0.5') odds.goals.under_0_5 = parseFloat(value.odd)
          if (value.value === 'Over 1.5') odds.goals.over_1_5 = parseFloat(value.odd)
          if (value.value === 'Under 1.5') odds.goals.under_1_5 = parseFloat(value.odd)
          if (value.value === 'Over 2.5') odds.goals.over_2_5 = parseFloat(value.odd)
          if (value.value === 'Under 2.5') odds.goals.under_2_5 = parseFloat(value.odd)
          if (value.value === 'Over 3.5') odds.goals.over_3_5 = parseFloat(value.odd)
          if (value.value === 'Under 3.5') odds.goals.under_3_5 = parseFloat(value.odd)
          if (value.value === 'Over 4.5') odds.goals.over_4_5 = parseFloat(value.odd)
          if (value.value === 'Under 4.5') odds.goals.under_4_5 = parseFloat(value.odd)
          if (value.value === 'Over 5.5') odds.goals.over_5_5 = parseFloat(value.odd)
          if (value.value === 'Under 5.5') odds.goals.under_5_5 = parseFloat(value.odd)
        })
        break

      case 'Both Teams Score':
        bet.values.forEach(value => {
          if (value.value === 'Yes') odds.goals.gol = parseFloat(value.odd)
          if (value.value === 'No') odds.goals.nogol = parseFloat(value.odd)
        })
        break

      case 'Double Chance':
        bet.values.forEach(value => {
          if (value.value === 'Home/Draw') odds.doubleChance.x1 = parseFloat(value.odd)
          if (value.value === 'Draw/Away') odds.doubleChance.x2 = parseFloat(value.odd)
          if (value.value === 'Home/Away') odds.doubleChance.x12 = parseFloat(value.odd)
        })
        break

      case 'Correct Score':
      case 'Exact Score':
        console.log('🎯 Processing Correct Score/Exact Score odds')
        // Get all scores, let filterCoherentCorrectScores do the filtering later
        bet.values.forEach(value => {
          const odd = parseFloat(value.odd)
          if (!isNaN(odd)) {
            console.log(`  - ${value.value}: ${odd}`)
            odds.correctScore[value.value] = odd
          }
        })
        break

      case 'Multigol':
      case 'Total Team Goals':
      case 'Goals':
      case 'Total Goals Number By Ranges':
        console.log('🎯 Processing Multigol/Total Goals Number By Ranges odds')
        bet.values.forEach(value => {
          console.log(`  - ${value.value}: ${value.odd}`)
          // Parse multigol markets like "1-2", "2-3", "3-4", etc.
          const match = value.value.match(/(\d+)-(\d+)/)
          if (match) {
            const key = `mg_${match[1]}_${match[2]}`
            console.log(`    Mapping ${value.value} to ${key}`)
            odds.multigol[key] = parseFloat(value.odd)
          }
        })
        break

      case 'First Half Winner':
      case 'Half Time Result':
        bet.values.forEach(value => {
          if (value.value === 'Home') odds.firstHalf.winner.home = parseFloat(value.odd)
          if (value.value === 'Draw') odds.firstHalf.winner.draw = parseFloat(value.odd)
          if (value.value === 'Away') odds.firstHalf.winner.away = parseFloat(value.odd)
        })
        break

      case 'First Half Goals Over/Under':
        bet.values.forEach(value => {
          if (value.value === 'Over 0.5') odds.firstHalf.over_0_5 = parseFloat(value.odd)
          if (value.value === 'Under 0.5') odds.firstHalf.under_0_5 = parseFloat(value.odd)
          if (value.value === 'Over 1.5') odds.firstHalf.over_1_5 = parseFloat(value.odd)
          if (value.value === 'Under 1.5') odds.firstHalf.under_1_5 = parseFloat(value.odd)
        })
        break

      case 'Half Time/Full Time':
      case 'HT/FT Double':
        bet.values.forEach(value => {
          // Combinations like "Home/Home", "Draw/Away", etc.
          odds.combo[value.value] = parseFloat(value.odd)
        })
        break

      case 'Asian Handicap':
      case 'Handicap':
        bet.values.forEach(value => {
          odds.handicap[value.value] = parseFloat(value.odd)
        })
        break

      case 'First Goalscorer':
      case 'First Goal Scorer':
        console.log('🎯 Processing First Goal Scorer odds')
        odds.firstGoalscorer = [] // Clear defaults
        bet.values
          .filter(value => value.value && value.value !== 'No Goalscorer' && value.value !== 'No Goal Scorer')
          .sort((a, b) => parseFloat(a.odd) - parseFloat(b.odd)) // Sort by odds (lower = more likely)
          .slice(0, 2) // Take only top 2 most likely scorers
          .forEach(value => {
            console.log(`  - ${value.value}: ${value.odd}`)
            odds.firstGoalscorer.push({
              player: value.value,
              odds: parseFloat(value.odd)
            })
          })
        break

      case 'Anytime Goalscorer':
      case 'Anytime Goal Scorer':
        console.log('🎯 Processing Anytime Goal Scorer odds')
        odds.anytimeGoalscorer = [] // Clear defaults
        bet.values
          .filter(value => value.value && value.value !== 'No Goalscorer' && value.value !== 'No Goal Scorer')
          .sort((a, b) => parseFloat(a.odd) - parseFloat(b.odd)) // Sort by odds (lower = more likely)
          .slice(0, 2) // Take only top 2 most likely scorers  
          .forEach(value => {
            console.log(`  - ${value.value}: ${value.odd}`)
            odds.anytimeGoalscorer.push({
              player: value.value,
              odds: parseFloat(value.odd)
            })
          })
        break

      default:
        console.log(`⚠️ Unhandled bet type: "${bet.name}" - skipping`)
        break
    }
  })

  console.log('🎯 Final formatted odds:', {
    hasCorrectScore: Object.keys(odds.correctScore).length > 0,
    correctScoreKeys: Object.keys(odds.correctScore),
    hasFirstGoalscorer: odds.firstGoalscorer.length > 0,
    firstGoalscorerCount: odds.firstGoalscorer.length,
    multigolMg12: odds.multigol.mg_1_2,
    winnerHome: odds.winner.home,
    hasRealMultigol: Object.values(odds.multigol).some(odd => odd !== 1.00 && odd !== odds.multigol.mg_1_2)
  })

  // If we didn't get real data from API, use intelligent fallback
  if (Object.keys(odds.correctScore).length === 0) {
    console.log('⚠️ No real correct scores from API, using intelligent fallback')
    // Keep only the default correct scores (already intelligent)
  }

  if (odds.firstGoalscorer.length === 0 && odds.anytimeGoalscorer.length === 0) {
    console.log('⚠️ No real goalscorers from API, leaving empty (no fake data)')
  }

  return odds
}

// Calculate probabilities from odds (implied probability)
export function calculateProbabilitiesFromOdds(odds: any) {
  return {
    winner: {
      home: Math.round((1 / odds.winner.home) * 100),
      draw: Math.round((1 / odds.winner.draw) * 100),
      away: Math.round((1 / odds.winner.away) * 100)
    },
    goals: {
      over_1_5: Math.round((1 / odds.goals.over_1_5) * 100),
      under_1_5: Math.round((1 / odds.goals.under_1_5) * 100),
      over_2_5: Math.round((1 / odds.goals.over_2_5) * 100),
      under_2_5: Math.round((1 / odds.goals.under_2_5) * 100),
      over_3_5: Math.round((1 / odds.goals.over_3_5) * 100),
      under_3_5: Math.round((1 / odds.goals.under_3_5) * 100),
      gol: Math.round((1 / odds.goals.gol) * 100),
      nogol: Math.round((1 / odds.goals.nogol) * 100)
    },
    doubleChance: {
      x1: Math.round((1 / odds.doubleChance.x1) * 100),
      x2: Math.round((1 / odds.doubleChance.x2) * 100),
      x12: Math.round((1 / odds.doubleChance.x12) * 100)
    },
    multigol: {
      mg_1_2: 45, // Will need to calculate or estimate these
      mg_2_3: 38,
      mg_2_4: 52,
      mg_3_5: 28
    }
  }
}