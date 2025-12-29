import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
)

// League configurations
export const FOOTBALL_LEAGUES = {
  'serie-a': 135,
  'serie-b': 136,
  'premier': 39,
  'la-liga': 140,
  'bundesliga': 78,
  'ligue-1': 61,
  'champions': 2,
  'europa': 3,
}

const API_KEY = process.env.API_FOOTBALL_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

// Fetch fixtures from API-Football
async function fetchFixturesFromAPI(leagueId: number, date: string) {
  const response = await fetch(`${BASE_URL}/fixtures?date=${date}&league=${leagueId}&season=${new Date().getFullYear()}`, {
    headers: {
      'X-RapidAPI-Key': API_KEY!,
      'X-RapidAPI-Host': 'v3.football.api-sports.io',
    },
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  return await response.json()
}

// Fetch odds from API-Football
async function fetchOddsFromAPI(fixtureId: number) {
  try {
    const response = await fetch(`${BASE_URL}/odds?fixture=${fixtureId}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY!,
        'X-RapidAPI-Host': 'v3.football.api-sports.io',
      },
    })
    
    if (!response.ok) {
      console.warn(`Could not fetch odds for fixture ${fixtureId}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.warn(`Error fetching odds for fixture ${fixtureId}:`, error)
    return null
  }
}

// Fetch predictions from API-Football
async function fetchPredictionsFromAPI(fixtureId: number) {
  try {
    const response = await fetch(`${BASE_URL}/predictions?fixture=${fixtureId}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY!,
        'X-RapidAPI-Host': 'v3.football.api-sports.io',
      },
    })
    
    if (!response.ok) {
      console.warn(`Could not fetch predictions for fixture ${fixtureId}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.warn(`Error fetching predictions for fixture ${fixtureId}:`, error)
    return null
  }
}

// Sync matches for a specific date
export async function syncMatchesForDate(date: string) {
  console.log(`🔄 Syncing matches for ${date}...`)
  
  const results = []
  
  for (const [leagueKey, leagueId] of Object.entries(FOOTBALL_LEAGUES)) {
    console.log(`📥 Fetching ${leagueKey} fixtures...`)
    
    try {
      const fixturesData = await fetchFixturesFromAPI(leagueId, date)
      const fixtures = fixturesData?.response || []
      
      console.log(`Found ${fixtures.length} fixtures for ${leagueKey}`)
      
      for (const fixture of fixtures) {
        // Fetch additional data
        const [oddsData, predictionsData] = await Promise.all([
          fetchOddsFromAPI(fixture.fixture.id),
          fetchPredictionsFromAPI(fixture.fixture.id)
        ])
        
        // Process odds
        let processedOdds = null
        if (oddsData?.response?.[0]) {
          const odds = oddsData.response[0]
          const bookmaker = odds.bookmakers?.[0] // Take first bookmaker
          
          processedOdds = {
            winner: {},
            doubleChance: {},
            goals: {}
          }
          
          bookmaker?.bets?.forEach((bet: any) => {
            if (bet.name === 'Match Winner') {
              bet.values.forEach((value: any) => {
                if (value.value === 'Home') processedOdds.winner.home = parseFloat(value.odd)
                if (value.value === 'Draw') processedOdds.winner.draw = parseFloat(value.odd)
                if (value.value === 'Away') processedOdds.winner.away = parseFloat(value.odd)
              })
            }
            if (bet.name === 'Double Chance') {
              bet.values.forEach((value: any) => {
                if (value.value === '1X') processedOdds.doubleChance.x1 = parseFloat(value.odd)
                if (value.value === 'X2') processedOdds.doubleChance.x2 = parseFloat(value.odd)
                if (value.value === '12') processedOdds.doubleChance.x12 = parseFloat(value.odd)
              })
            }
            if (bet.name === 'Goals Over/Under') {
              bet.values.forEach((value: any) => {
                if (value.value === 'Over 1.5') processedOdds.goals.over_1_5 = parseFloat(value.odd)
                if (value.value === 'Under 1.5') processedOdds.goals.under_1_5 = parseFloat(value.odd)
                if (value.value === 'Over 2.5') processedOdds.goals.over_2_5 = parseFloat(value.odd)
                if (value.value === 'Under 2.5') processedOdds.goals.under_2_5 = parseFloat(value.odd)
                if (value.value === 'Over 3.5') processedOdds.goals.over_3_5 = parseFloat(value.odd)
                if (value.value === 'Under 3.5') processedOdds.goals.under_3_5 = parseFloat(value.odd)
              })
            }
            if (bet.name === 'Both Teams Score') {
              bet.values.forEach((value: any) => {
                if (value.value === 'Yes') processedOdds.goals.btts = parseFloat(value.odd)
                if (value.value === 'No') processedOdds.goals.nobtts = parseFloat(value.odd)
              })
            }
          })
        }
        
        // Process predictions
        let processedPredictions = null
        if (predictionsData?.response?.[0]) {
          const pred = predictionsData.response[0].predictions
          processedPredictions = {
            advice: pred.advice,
            home: pred.percent.home,
            draw: pred.percent.draw,
            away: pred.percent.away,
            confidence: parseInt(pred.percent.home) > 60 ? 'high' : parseInt(pred.percent.home) > 40 ? 'medium' : 'low'
          }
        }
        
        // Format match data for Supabase
        const matchData = {
          fixture_id: fixture.fixture.id,
          match_date: date,
          match_time: new Date(fixture.fixture.date).toTimeString().slice(0, 5),
          league_name: fixture.league.name,
          league_id: leagueId,
          home_team: {
            id: fixture.teams.home.id,
            name: fixture.teams.home.name,
            logo: fixture.teams.home.logo
          },
          away_team: {
            id: fixture.teams.away.id,
            name: fixture.teams.away.name,
            logo: fixture.teams.away.logo
          },
          venue: {
            name: fixture.fixture.venue?.name || 'TBD',
            city: fixture.fixture.venue?.city || 'TBD'
          },
          status: fixture.fixture.status.long,
          odds: processedOdds,
          predictions: processedPredictions,
          updated_at: new Date().toISOString()
        }
        
        // Upsert to Supabase
        const { error } = await supabase
          .from('matches')
          .upsert(matchData, { 
            onConflict: 'fixture_id',
            ignoreDuplicates: false 
          })
        
        if (error) {
          console.error(`❌ Error saving match ${fixture.fixture.id}:`, error)
        } else {
          console.log(`✅ Saved match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`)
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      results.push({
        league: leagueKey,
        fixtures: fixtures.length,
        success: true
      })
      
    } catch (error) {
      console.error(`❌ Error syncing ${leagueKey}:`, error)
      results.push({
        league: leagueKey,
        fixtures: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  console.log(`🏁 Sync completed for ${date}`)
  return results
}

// Sync today's matches
export async function syncTodayMatches() {
  const today = new Date().toISOString().split('T')[0]
  return syncMatchesForDate(today)
}

// Sync matches for a date range
export async function syncMatchesForDateRange(startDate: string, endDate: string) {
  const results = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0]
    const result = await syncMatchesForDate(dateStr)
    results.push({ date: dateStr, results: result })
  }
  
  return results
}