const API_KEY = process.env.API_FOOTBALL_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

interface ApiResponse<T> {
  get: string
  parameters: any
  errors: any[]
  results: number
  paging: {
    current: number
    total: number
  }
  response: T
}

interface H2HMatch {
  date: string
  homeTeam: string
  awayTeam: string
  homeGoals: number | null
  awayGoals: number | null
  winner: 'home' | 'away' | 'draw'
  status: string
}

interface TeamFormMatch {
  date: string
  home: string
  away: string
  homeGoals: number | null
  awayGoals: number | null
  isHome: boolean
  result: 'W' | 'L' | 'D'
  status: string
  opponent: string
}

interface StandingTeam {
  position: number
  teamId: number
  teamName: string
  played: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form: string
}

interface TeamStats {
  form: string
  fixtures: {
    played: { home: number; away: number; total: number }
    wins: { home: number; away: number; total: number }
    draws: { home: number; away: number; total: number }
    loses: { home: number; away: number; total: number }
  }
  goals: {
    for: { 
      home: number
      away: number
      total: number
      avgHome: string
      avgAway: string
      avgTotal: string
    }
    against: { 
      home: number
      away: number  
      total: number
      avgHome: string
      avgAway: string
      avgTotal: string
    }
  }
  cleanSheet: { home: number; away: number; total: number }
  failedToScore: { home: number; away: number; total: number }
}

// Head to Head - Ultimi 10 scontri diretti
export async function getH2H(team1Id: number, team2Id: number): Promise<H2HMatch[]> {
  if (!API_KEY) {
    console.log('⚠️ API_FOOTBALL_KEY not configured, using fallback H2H data')
    return []
  }

  try {
    const response = await fetch(
      `${BASE_URL}/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=10`,
      { 
        headers: { 'x-apisports-key': API_KEY },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: ApiResponse<any[]> = await response.json()
    
    if (data.errors.length > 0) {
      console.error('API Football H2H errors:', data.errors)
      return []
    }
    
    return data.response
      .filter(match => match.fixture.status.short === 'FT') // Solo partite finite
      .map(match => ({
        date: match.fixture.date,
        homeTeam: match.teams.home.name,
        awayTeam: match.teams.away.name,
        homeGoals: match.goals.home,
        awayGoals: match.goals.away,
        winner: (match.teams.home.winner === true ? 'home' : 
                match.teams.away.winner === true ? 'away' : 'draw') as 'home' | 'away' | 'draw',
        status: match.fixture.status.short
      }))
      .slice(0, 10) // Assicurati di avere max 10 risultati
    
  } catch (error) {
    console.error('Error fetching H2H data:', error)
    return []
  }
}

// Ultime 5 partite di una squadra - versione ibrida con fallback database
export async function getTeamForm(teamId: number, leagueId: number, season: number): Promise<TeamFormMatch[]> {
  if (!API_KEY) {
    console.log('⚠️ API_FOOTBALL_KEY not configured, using fallback team form data')
    return []
  }

  try {
    console.log(`📊 Fetching team form for ${teamId} (season ${season})...`)
    
    // 1. Try API-Football first (shorter cache time for freshness)
    const response = await fetch(
      `${BASE_URL}/fixtures?team=${teamId}&league=${leagueId}&season=${season}&last=10&status=FT`,
      { 
        headers: { 'x-apisports-key': API_KEY },
        next: { revalidate: 1800 } // Reduced cache time: 30 minutes instead of 1 hour
      }
    )
    
    if (!response.ok) {
      console.warn(`⚠️ API-Football returned ${response.status}, trying database fallback...`)
      return await getTeamFormFromDatabase(teamId, leagueId, season)
    }
    
    const data: ApiResponse<any[]> = await response.json()
    
    if (data.errors.length > 0) {
      console.error('API Football team form errors:', data.errors)
      console.log('🔄 Falling back to database data...')
      return await getTeamFormFromDatabase(teamId, leagueId, season)
    }
    
    const apiMatches = data.response.map(match => {
      const isHome = match.teams.home.id === teamId
      let result: 'W' | 'L' | 'D' = 'D'
      
      if (match.teams.home.winner === true) {
        result = isHome ? 'W' : 'L'
      } else if (match.teams.away.winner === true) {
        result = isHome ? 'L' : 'W'
      }
      
      return {
        date: match.fixture.date,
        home: match.teams.home.name,
        away: match.teams.away.name,
        homeGoals: match.goals.home,
        awayGoals: match.goals.away,
        isHome,
        result,
        status: match.fixture.status.short,
        opponent: isHome ? match.teams.away.name : match.teams.home.name
      }
    }).slice(0, 5)
    
    console.log(`✅ Team ${teamId} form from API: ${apiMatches.length} matches`)
    console.log(`📅 Latest match: ${apiMatches[0]?.date || 'none'} vs ${apiMatches[0]?.opponent || 'none'}`)
    
    // 2. Validate freshness - if API data seems stale, supplement with database
    if (apiMatches.length > 0) {
      const latestMatch = new Date(apiMatches[0].date)
      const daysSinceLatest = Math.floor((Date.now() - latestMatch.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceLatest > 14) {
        console.log(`⚠️ API data may be stale (${daysSinceLatest} days old), checking database for newer matches...`)
        const dbMatches = await getTeamFormFromDatabase(teamId, leagueId, season)
        
        if (dbMatches.length > 0) {
          const dbLatest = new Date(dbMatches[0].date)
          if (dbLatest > latestMatch) {
            console.log('🔄 Database has newer data, using hybrid approach...')
            // Merge API and DB data, prioritizing freshness
            const allMatches = [...dbMatches, ...apiMatches]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
            return allMatches
          }
        }
      }
    }
    
    return apiMatches
    
  } catch (error) {
    console.error('Error fetching team form from API:', error)
    console.log('🔄 Falling back to database data...')
    return await getTeamFormFromDatabase(teamId, leagueId, season)
  }
}

// Fallback: Get team form from our database
async function getTeamFormFromDatabase(teamId: number, leagueId: number, season: number): Promise<TeamFormMatch[]> {
  try {
    // Import supabase here to avoid circular dependencies
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )

    // Calculate season date range
    const seasonStart = `${season}-08-01`
    const seasonEnd = `${season + 1}-07-31`
    
    console.log(`🔍 Querying database for team ${teamId} matches between ${seasonStart} and ${seasonEnd}`)
    
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        fixture_id,
        match_date,
        match_time,
        home_team,
        away_team,
        league_id,
        league_name,
        result
      `)
      .or(`home_team.id.eq.${teamId},away_team.id.eq.${teamId}`)
      .eq('league_id', leagueId)
      .gte('match_date', seasonStart)
      .lte('match_date', seasonEnd)
      .not('result', 'is', null)
      .order('match_date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Database query error:', error)
      return []
    }

    if (!matches || matches.length === 0) {
      console.log('📭 No finished matches found in database')
      return []
    }

    const formMatches: TeamFormMatch[] = matches.map(match => {
      const isHome = match.home_team?.id === teamId
      const homeGoals = match.result?.home || 0
      const awayGoals = match.result?.away || 0
      
      let result: 'W' | 'L' | 'D' = 'D'
      if (homeGoals > awayGoals) {
        result = isHome ? 'W' : 'L'
      } else if (awayGoals > homeGoals) {
        result = isHome ? 'L' : 'W'
      }

      return {
        date: match.match_date,
        home: match.home_team?.name || 'Unknown',
        away: match.away_team?.name || 'Unknown', 
        homeGoals,
        awayGoals,
        isHome,
        result,
        status: 'FT',
        opponent: isHome ? match.away_team?.name || 'Unknown' : match.home_team?.name || 'Unknown'
      }
    })

    console.log(`💾 Database form data: ${formMatches.length} matches found`)
    if (formMatches.length > 0) {
      console.log(`📅 Latest match from DB: ${formMatches[0].date} vs ${formMatches[0].opponent}`)
    }

    return formMatches
    
  } catch (error) {
    console.error('Error fetching team form from database:', error)
    return []
  }
}

// Classifica del campionato
export async function getStandings(leagueId: number, season: number): Promise<StandingTeam[]> {
  if (!API_KEY) {
    console.log('⚠️ API_FOOTBALL_KEY not configured, using fallback standings data')
    return []
  }

  try {
    const response = await fetch(
      `${BASE_URL}/standings?league=${leagueId}&season=${season}`,
      { 
        headers: { 'x-apisports-key': API_KEY },
        next: { revalidate: 7200 } // Cache for 2 hours - standings change less frequently
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: ApiResponse<any[]> = await response.json()
    
    if (data.errors.length > 0) {
      console.error('API Football standings errors:', data.errors)
      return []
    }
    
    if (!data.response?.[0]?.league?.standings?.[0]) {
      console.warn('No standings data found')
      return []
    }
    
    return data.response[0].league.standings[0].map((team: any) => ({
      position: team.rank,
      teamId: team.team.id,
      teamName: team.team.name,
      played: team.all.played,
      won: team.all.win,
      draw: team.all.draw,
      lost: team.all.lose,
      goalsFor: team.all.goals.for,
      goalsAgainst: team.all.goals.against,
      goalDiff: team.goalsDiff,
      points: team.points,
      form: team.form || 'NNNNN' // "WWDLW" format, fallback if missing
    }))
    
  } catch (error) {
    console.error('Error fetching standings data:', error)
    return []
  }
}

// Statistiche squadra (gol fatti/subiti, clean sheet, ecc)
export async function getTeamStats(teamId: number, leagueId: number, season: number): Promise<TeamStats | null> {
  if (!API_KEY) {
    console.log('⚠️ API_FOOTBALL_KEY not configured, using fallback team stats data')
    return null
  }

  try {
    const response = await fetch(
      `${BASE_URL}/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`,
      { 
        headers: { 'x-apisports-key': API_KEY },
        next: { revalidate: 7200 }
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: ApiResponse<any> = await response.json()
    
    if (data.errors.length > 0) {
      console.error('API Football team stats errors:', data.errors)
      return null
    }
    
    if (!data.response) {
      console.warn('No team stats data found')
      return null
    }
    
    const stats = data.response
    
    return {
      form: stats.form || 'NNNNN',
      fixtures: {
        played: { 
          home: stats.fixtures.played.home || 0, 
          away: stats.fixtures.played.away || 0,
          total: stats.fixtures.played.total || 0
        },
        wins: { 
          home: stats.fixtures.wins.home || 0, 
          away: stats.fixtures.wins.away || 0,
          total: stats.fixtures.wins.total || 0
        },
        draws: { 
          home: stats.fixtures.draws.home || 0, 
          away: stats.fixtures.draws.away || 0,
          total: stats.fixtures.draws.total || 0
        },
        loses: { 
          home: stats.fixtures.loses.home || 0, 
          away: stats.fixtures.loses.away || 0,
          total: stats.fixtures.loses.total || 0
        }
      },
      goals: {
        for: { 
          home: stats.goals.for.total.home || 0, 
          away: stats.goals.for.total.away || 0,
          total: stats.goals.for.total.total || 0,
          avgHome: stats.goals.for.average.home || '0.0',
          avgAway: stats.goals.for.average.away || '0.0',
          avgTotal: stats.goals.for.average.total || '0.0'
        },
        against: { 
          home: stats.goals.against.total.home || 0, 
          away: stats.goals.against.total.away || 0,
          total: stats.goals.against.total.total || 0,
          avgHome: stats.goals.against.average.home || '0.0',
          avgAway: stats.goals.against.average.away || '0.0',
          avgTotal: stats.goals.against.average.total || '0.0'
        }
      },
      cleanSheet: { 
        home: stats.clean_sheet?.home || 0, 
        away: stats.clean_sheet?.away || 0,
        total: stats.clean_sheet?.total || 0
      },
      failedToScore: { 
        home: stats.failed_to_score?.home || 0, 
        away: stats.failed_to_score?.away || 0,
        total: stats.failed_to_score?.total || 0
      }
    }
    
  } catch (error) {
    console.error('Error fetching team stats data:', error)
    return null
  }
}

// Helper function to calculate H2H statistics
export function calculateH2HStats(h2hMatches: H2HMatch[], homeTeamName: string) {
  if (h2hMatches.length === 0) {
    return {
      matches: [],
      total: 0,
      homeWins: 0,
      awayWins: 0,
      draws: 0,
      avgGoals: 0,
      results: [],
      trend: 'Non ci sono precedenti recenti tra le squadre.'
    }
  }

  const homeWins = h2hMatches.filter(m => 
    (m.homeTeam === homeTeamName && m.winner === 'home') ||
    (m.awayTeam === homeTeamName && m.winner === 'away')
  ).length

  const awayWins = h2hMatches.filter(m => 
    (m.homeTeam === homeTeamName && m.winner === 'away') ||
    (m.awayTeam === homeTeamName && m.winner === 'home')
  ).length

  const draws = h2hMatches.filter(m => m.winner === 'draw').length

  const avgGoals = h2hMatches.reduce((sum, m) => 
    sum + (m.homeGoals || 0) + (m.awayGoals || 0), 0
  ) / h2hMatches.length

  const results = h2hMatches.map(m => `${m.homeGoals}-${m.awayGoals}`)

  // Generate trend analysis
  let trend = ''
  const last3 = h2hMatches.slice(0, 3)
  const homeTeamWinsInLast3 = last3.filter(m => 
    (m.homeTeam === homeTeamName && m.winner === 'home') ||
    (m.awayTeam === homeTeamName && m.winner === 'away')
  ).length

  if (homeTeamWinsInLast3 === 3) {
    trend = `${homeTeamName} ha vinto le ultime 3 partite contro questa squadra.`
  } else if (homeTeamWinsInLast3 === 0) {
    const opponentName = h2hMatches[0].homeTeam === homeTeamName ? h2hMatches[0].awayTeam : h2hMatches[0].homeTeam
    trend = `${homeTeamName} non batte ${opponentName} da ${last3.length} partite.`
  } else if (draws >= h2hMatches.length / 2) {
    trend = 'Gli scontri diretti sono spesso equilibrati con molti pareggi.'
  } else {
    trend = 'Storia recente alterna tra le due squadre.'
  }

  return {
    matches: h2hMatches,
    total: h2hMatches.length,
    homeWins,
    awayWins,
    draws,
    avgGoals: Number(avgGoals.toFixed(1)),
    results,
    trend
  }
}

// Helper function to format team form
export function formatTeamForm(formMatches: TeamFormMatch[]) {
  if (formMatches.length === 0) {
    return {
      formString: 'NNNNN',
      formArray: ['N', 'N', 'N', 'N', 'N'],
      wins: 0,
      draws: 0,
      losses: 0,
      matches: []
    }
  }

  // Convert to Italian format: W→V, L→S, D→P
  const convertResultToItalian = (result: string): string => {
    switch(result) {
      case 'W': return 'V' // Vittoria
      case 'L': return 'S' // Sconfitta  
      case 'D': return 'P' // Pareggio
      default: return result
    }
  }

  const formArray = formMatches.map(m => convertResultToItalian(m.result))
  const formString = formArray.join('')
  
  const wins = formArray.filter(r => r === 'V').length
  const draws = formArray.filter(r => r === 'P').length
  const losses = formArray.filter(r => r === 'S').length

  return {
    formString,
    formArray,
    wins,
    draws,
    losses,
    matches: formMatches.map(m => ({
      opponent: m.opponent,
      result: `${m.homeGoals}-${m.awayGoals}`,
      isHome: m.isHome,
      outcome: convertResultToItalian(m.result),
      date: m.date
    }))
  }
}

// Get current season based on date
export function getCurrentSeason(): number {
  const now = new Date()
  const month = now.getMonth() + 1 // JavaScript months are 0-indexed
  const year = now.getFullYear()
  
  // La stagione calcistica europea va da agosto a luglio
  // Se siamo tra gennaio e luglio, siamo nella seconda metà della stagione (anno precedente)
  // Se siamo tra agosto e dicembre, siamo nella prima metà della stagione (anno corrente)
  if (month >= 1 && month <= 7) {
    return year - 1 // es. gennaio 2026 = stagione 2025-2026
  } else {
    return year // es. settembre 2026 = stagione 2026-2027
  }
}