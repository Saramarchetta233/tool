import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
)

// Tutti i campionati che avevamo configurato
export const COMPLETE_LEAGUES = {
  'serie-a': 135,
  'serie-b': 136,
  'premier': 39,
  'la-liga': 140,
  'bundesliga': 78,
  'ligue-1': 61,
  'champions': 2,
  'europa': 3,
  'serie-c': 137, // Serie C italiana
  'eredivisie': 88, // Olanda
  'primeira': 94, // Portogallo
} as const

const API_KEY = process.env.API_FOOTBALL_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

// Fetch da API-Football con retry
async function fetchWithRetry(url: string, options: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.warn(`Tentativo ${i + 1} fallito:`, error)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// Funzione helper per determinare la stagione corretta
function getCurrentSeason(date: string) {
  const targetDate = new Date(date)
  const year = targetDate.getFullYear()
  const month = targetDate.getMonth() + 1 // getMonth() è 0-based
  
  // La stagione calcistica va da agosto a maggio
  // Se siamo tra gennaio e luglio, usiamo l'anno precedente (siamo nella seconda metà della stagione)
  // Se siamo tra agosto e dicembre, usiamo l'anno corrente (siamo nella prima metà della stagione)
  if (month >= 1 && month <= 7) {
    return year - 1
  } else {
    return year
  }
}

// Fetch fixtures complete
async function fetchFixturesComplete(leagueId: number, date: string) {
  const season = getCurrentSeason(date)
  console.log(`📅 Fetching fixtures for date: ${date}, season: ${season}`)
  
  const url = `${BASE_URL}/fixtures?date=${date}&league=${leagueId}&season=${season}`
  return fetchWithRetry(url, {
    headers: {
      'X-RapidAPI-Key': API_KEY!,
      'X-RapidAPI-Host': 'v3.football.api-sports.io',
    },
  })
}

// Fetch odds complete
async function fetchOddsComplete(fixtureId: number) {
  const url = `${BASE_URL}/odds?fixture=${fixtureId}&bookmaker=1` // Bet365
  return fetchWithRetry(url, {
    headers: {
      'X-RapidAPI-Key': API_KEY!,
      'X-RapidAPI-Host': 'v3.football.api-sports.io',
    },
  })
}

// Fetch predictions complete
async function fetchPredictionsComplete(fixtureId: number) {
  const url = `${BASE_URL}/predictions?fixture=${fixtureId}`
  return fetchWithRetry(url, {
    headers: {
      'X-RapidAPI-Key': API_KEY!,
      'X-RapidAPI-Host': 'v3.football.api-sports.io',
    },
  })
}

// Sync completo per una data
export async function syncCompleteMatchesForDate(date: string) {
  console.log(`🔄 Starting COMPLETE sync for ${date}...`)
  
  const results = []
  
  for (const [leagueKey, leagueId] of Object.entries(COMPLETE_LEAGUES)) {
    console.log(`📥 Syncing ${leagueKey} (${leagueId})...`)
    
    try {
      // 1. Fetch fixtures
      const fixturesData = await fetchFixturesComplete(leagueId, date)
      const fixtures = fixturesData?.response || []
      
      console.log(`Found ${fixtures.length} fixtures for ${leagueKey}`)
      
      for (const fixture of fixtures) {
        // 2. Fetch odds e predictions in parallelo
        const [oddsResult, predictionsResult] = await Promise.allSettled([
          fetchOddsComplete(fixture.fixture.id),
          fetchPredictionsComplete(fixture.fixture.id)
        ])
        
        // 3. Process odds
        let processedOdds: any = null
        if (oddsResult.status === 'fulfilled' && oddsResult.value?.response?.[0]) {
          const odds = oddsResult.value.response[0]
          const bookmaker = odds.bookmakers?.[0]
          
          processedOdds = {
            winner: {} as any,
            doubleChance: {} as any,
            goals: {} as any
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
        
        // 4. Process predictions
        let processedPredictions: any = null
        if (predictionsResult.status === 'fulfilled' && predictionsResult.value?.response?.[0]) {
          const pred = predictionsResult.value.response[0].predictions
          processedPredictions = {
            advice: pred.advice,
            home: pred.percent.home,
            draw: pred.percent.draw,
            away: pred.percent.away,
            confidence: parseInt(pred.percent.home) > 60 ? 'high' : 
                      parseInt(pred.percent.home) > 40 ? 'medium' : 'low'
          }
        }
        
        // 5. Save to matches table
        const matchData: any = {
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
        
        // 6. Add match result if the game is finished
        if (fixture.fixture.status.short === 'FT' && fixture.goals) {
          matchData.result = {
            home: fixture.goals.home,
            away: fixture.goals.away
          }
          console.log(`📊 Match finished: ${fixture.teams.home.name} ${fixture.goals.home}-${fixture.goals.away} ${fixture.teams.away.name}`)
        }
        
        const { error } = await supabase
          .from('matches')
          .upsert(matchData, { 
            onConflict: 'fixture_id',
            ignoreDuplicates: false 
          })
        
        if (error) {
          console.error(`❌ Error saving match ${fixture.fixture.id}:`, error)
        } else {
          console.log(`✅ Saved: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`)
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
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
  
  console.log(`🏁 Complete sync finished for ${date}`)
  return results
}

// Sync per oggi
export async function syncTodayComplete() {
  const today = new Date().toISOString().split('T')[0]
  return syncCompleteMatchesForDate(today)
}

// Sync per range di date
export async function syncDateRangeComplete(startDate: string, endDate: string) {
  const results = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0]
    const result = await syncCompleteMatchesForDate(dateStr)
    results.push({ date: dateStr, results: result })
  }
  
  return results
}