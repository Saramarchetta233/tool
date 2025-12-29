import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiFootballService, formatOddsForFrontend, calculateProbabilitiesFromOdds, getDefaultOdds } from '@/lib/api-football'
// import { generateMatchNarrative, generateBettingTips } from '@/lib/openai-helper'
import { generateMatchAnalysis, AIAnalysisResult } from '@/lib/match-analysis-ai'
import { getH2H, getTeamForm, getStandings, getTeamStats, calculateH2HStats, formatTeamForm, getCurrentSeason } from '@/lib/football-api'

// TEMP: Usa client admin per risolvere problema RLS
// TODO: Configurare RLS policies corrette in Supabase

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const matchId = params.id
  const fixtureId = parseInt(matchId)
  
  console.log('=== MATCH ANALYSIS REQUEST START ===')
  console.log('🔍 Fixture ID:', fixtureId)
  console.log('🕐 Request timestamp:', new Date().toISOString())
  
  try {
    if (isNaN(fixtureId)) {
      console.log('❌ Invalid fixture ID:', matchId)
      return NextResponse.json(
        { error: 'Invalid match ID' },
        { status: 400 }
      )
    }

    console.log('🔍 Checking cache for cached AI analysis...')

    // 1. Check for cached AI analysis first (not expired)
    const { data: cachedAnalysis, error: cacheError } = await supabaseAdmin
      .from('match_analyses')
      .select('analysis, created_at, expires_at')
      .eq('fixture_id', fixtureId)
      .gt('expires_at', new Date().toISOString())
      .single()

    console.log('📋 Cache result:', {
      found: !!cachedAnalysis,
      error: cacheError?.message || 'none',
      expires: cachedAnalysis?.expires_at || 'n/a'
    })

    if (cachedAnalysis && cachedAnalysis.analysis) {
      console.log('🎯 CACHE HIT! Found saved analysis')
      console.log('💾 Cache created at:', cachedAnalysis.created_at)
      console.log('⏰ Cache expires at:', cachedAnalysis.expires_at)
      console.log('💰 SAVING MONEY: No GPT-4 call needed!')
      
      // Get match data for the response
      const { data: match } = await supabaseAdmin
        .from('matches')
        .select('*')
        .eq('fixture_id', fixtureId)
        .single()
      
      if (!match) {
        console.error(`❌ Match not found for cached analysis: ${fixtureId}`)
        return NextResponse.json(
          { error: 'Match not found' },
          { status: 404 }
        )
      }
      
      const cachedResponse = {
        ...cachedAnalysis.analysis,
        match: {
          id: matchId,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          date: match.match_date,
          time: match.match_time,
          venue: match.venue,
          league: match.league_name
        },
        dataSource: 'ai-cached',
        cacheHit: true,
        cachedAt: cachedAnalysis.created_at
      }
      
      console.log('✅ RETURNING CACHED ANALYSIS - ZERO COST!')
      console.log('=== CACHED RESPONSE SENT ===')
      return NextResponse.json(cachedResponse)
    }

    console.log('📭 No valid cache found, generating NEW analysis with GPT-4...')

    // 2. Get match data from Supabase
    const { data: match, error } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('fixture_id', fixtureId)
      .single()

    if (error || !match) {
      console.error(`❌ Match not found in Supabase: ${fixtureId}`)
      return NextResponse.json(
        { 
          error: 'Match not found',
          message: 'Questa partita non è stata trovata nel database. Potrebbe non essere ancora stata sincronizzata.'
        },
        { status: 404 }
      )
    }

    console.log(`✅ Found match: ${match.home_team.name} vs ${match.away_team.name} - generating fresh AI analysis`)

    // 3. Fetch comprehensive data from API-Football for AI analysis
    console.log('🔄 Fetching COMPLETE match data with new API functions...')
    
    const season = getCurrentSeason()
    const homeTeamId = match.home_team.id
    const awayTeamId = match.away_team.id
    const leagueId = match.league_id
    
    const [predictionsResult, oddsResult, h2hResult, homeFormResult, awayFormResult, standingsResult, homeStatsResult, awayStatsResult, injuriesResult] = await Promise.allSettled([
      ApiFootballService.getPredictions(fixtureId),
      ApiFootballService.getOdds(fixtureId),
      getH2H(homeTeamId, awayTeamId),
      getTeamForm(homeTeamId, leagueId, season),
      getTeamForm(awayTeamId, leagueId, season),
      getStandings(leagueId, season),
      getTeamStats(homeTeamId, leagueId, season),
      getTeamStats(awayTeamId, leagueId, season),
      ApiFootballService.getInjuries(fixtureId)
    ])

    // Process all data for AI analysis
    const realPredictions = predictionsResult.status === 'fulfilled' && predictionsResult.value
      ? formatApiPredictions(predictionsResult.value, match.homeTeam, match.awayTeam)
      : formatPredictions(match.predictions)

    // Process complete data using new functions
    const h2hMatches = h2hResult.status === 'fulfilled' ? h2hResult.value : []
    const homeForm = homeFormResult.status === 'fulfilled' ? homeFormResult.value : []
    const awayForm = awayFormResult.status === 'fulfilled' ? awayFormResult.value : []
    const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : []
    const homeStatsData = homeStatsResult.status === 'fulfilled' ? homeStatsResult.value : null
    const awayStatsData = awayStatsResult.status === 'fulfilled' ? awayStatsResult.value : null
    const injuriesData = injuriesResult.status === 'fulfilled' ? formatInjuries(injuriesResult.value) : []

    // Calculate comprehensive H2H statistics
    const h2hStats = calculateH2HStats(h2hMatches, match.home_team.name)
    
    // Format team form data
    const homeFormData = formatTeamForm(homeForm)
    const awayFormData = formatTeamForm(awayForm)
    
    // Find teams in standings
    const homeStanding = standings.find(s => s.teamId === homeTeamId)
    const awayStanding = standings.find(s => s.teamId === awayTeamId)
    
    console.log(`📊 Complete data loaded:`)
    console.log(`  - H2H: ${h2hStats.total} matches, avg ${h2hStats.avgGoals} goals`)
    console.log(`  - Home form: ${homeFormData.formString} (${homeFormData.wins}W-${homeFormData.draws}D-${homeFormData.losses}L)`)
    console.log(`  - Away form: ${awayFormData.formString} (${awayFormData.wins}W-${awayFormData.draws}D-${awayFormData.losses}L)`)
    console.log(`  - Standings: Home #${homeStanding?.position || '?'}, Away #${awayStanding?.position || '?'}`)

    const realOdds = oddsResult.status === 'fulfilled' && oddsResult.value
      ? formatApiOdds(oddsResult.value, realPredictions, h2hStats, homeStatsData, awayStatsData)
      : generateRealisticOdds(realPredictions)

    // 4. Generate comprehensive AI analysis using GPT-4 with COMPLETE data
    console.log('🤖 Generating comprehensive AI analysis with ALL data...')
    
    const completeMatchData = {
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      league: match.league_name,
      date: match.match_date,
      time: match.match_time,
      venue: match.venue,
      predictions: realPredictions,
      odds: realOdds,
      h2h: h2hStats,
      injuries: injuriesData,
      teamStats: {
        home: homeStatsData,
        away: awayStatsData
      },
      // NEW: Complete data for intelligent analysis
      homeTeamData: {
        form: homeFormData,
        standing: homeStanding,
        stats: homeStatsData
      },
      awayTeamData: {
        form: awayFormData,
        standing: awayStanding, 
        stats: awayStatsData
      },
      seasonInfo: {
        season,
        leagueId
      }
    }
    
    console.log('🤖 Generating AI analysis with complete data...')
    const aiAnalysis: AIAnalysisResult = await generateMatchAnalysis(completeMatchData)
    
    // Ensure aiAnalysis has proper structure
    if (!aiAnalysis || typeof aiAnalysis !== 'object') {
      throw new Error('AI analysis generation failed')
    }

    // 5. Cache the AI analysis (expires when match starts OR 6 hours from now)
    const matchStart = new Date(`${match.match_date}T${match.match_time}:00`)
    const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000)
    const expiresAt = matchStart < sixHoursFromNow ? matchStart : sixHoursFromNow

    console.log('💾 Saving AI analysis to cache...')
    console.log('📅 Cache expires at:', expiresAt.toISOString())
    console.log('🔍 Analysis data size:', JSON.stringify(aiAnalysis).length, 'bytes')

    try {
      const { data: savedCache, error: saveError } = await supabaseAdmin
        .from('match_analyses')
        .upsert({
          fixture_id: fixtureId,
          analysis: aiAnalysis,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'fixture_id'
        })
        .select()
      
      if (saveError) {
        console.error('❌ Error saving to cache:', saveError)
      } else {
        console.log('✅ AI analysis cached successfully')
        console.log('📋 Cache record saved:', !!savedCache)
      }
    } catch (cacheError) {
      console.error('❌ Exception saving to cache:', cacheError)
      // Continue without caching
    }

    // 6. Return the comprehensive AI analysis with ALL new data
    const finalResponse = {
      ...aiAnalysis,
      match: {
        id: matchId,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        date: match.match_date,
        time: match.match_time,
        venue: match.venue,
        league: match.league_name
      },
      // NEW: Raw data for frontend sections
      completeData: {
        h2h: {
          matches: h2hStats.matches.slice(0, 5), // Latest 5 H2H
          stats: {
            total: h2hStats.total,
            homeWins: h2hStats.homeWins,
            draws: h2hStats.draws,
            awayWins: h2hStats.awayWins,
            avgGoals: h2hStats.avgGoals,
            trend: h2hStats.trend
          }
        },
        homeTeam: {
          name: match.home_team.name,
          form: {
            last5: homeFormData.formArray,
            matches: homeFormData.matches,
            record: `${homeFormData.wins}W-${homeFormData.draws}D-${homeFormData.losses}L`
          },
          standing: homeStanding ? {
            position: homeStanding.position,
            points: homeStanding.points,
            played: homeStanding.played,
            won: homeStanding.won,
            draw: homeStanding.draw,
            lost: homeStanding.lost,
            goalsFor: homeStanding.goalsFor,
            goalsAgainst: homeStanding.goalsAgainst,
            goalDiff: homeStanding.goalDiff
          } : null,
          stats: homeStatsData
        },
        awayTeam: {
          name: match.away_team.name,
          form: {
            last5: awayFormData.formArray,
            matches: awayFormData.matches,
            record: `${awayFormData.wins}W-${awayFormData.draws}D-${awayFormData.losses}L`
          },
          standing: awayStanding ? {
            position: awayStanding.position,
            points: awayStanding.points,
            played: awayStanding.played,
            won: awayStanding.won,
            draw: awayStanding.draw,
            lost: awayStanding.lost,
            goalsFor: awayStanding.goalsFor,
            goalsAgainst: awayStanding.goalsAgainst,
            goalDiff: awayStanding.goalDiff
          } : null,
          stats: awayStatsData
        }
      },
      dataSource: 'ai-generated',
      cacheHit: false,
      generatedAt: new Date().toISOString()
    }
    
    console.log('✅ Returning FRESH AI analysis')
    console.log('=== MATCH ANALYSIS REQUEST END ===')
    
    return NextResponse.json(finalResponse)
    
  } catch (error) {
    console.error('❌ Error in /api/matches/[id]:', error)
    
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Errore nel recupero dell\'analisi',
        message: 'Impossibile ottenere l\'analisi della partita. Riprova più tardi.',
        debug: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Process REAL predictions from API-Football 
function formatApiPredictions(apiPrediction: any, homeTeam?: any, awayTeam?: any) {
  console.log('🔍 Processing API-Football predictions:', JSON.stringify(apiPrediction, null, 2))
  
  if (!apiPrediction || !apiPrediction.predictions) {
    console.log('❌ No predictions found, using fallback')
    return {
      winner: { home: 33, draw: 33, away: 34 },
      confidence: 'MEDIA',
      advice: 'Sconsigliamo la giocata per questa partita'
    }
  }

  const { percent, advice, winner } = apiPrediction.predictions
  
  // Parse percentages and ensure they sum to 100%
  let home = parseInt(percent.home.replace('%', '')) || 33
  let draw = parseInt(percent.draw.replace('%', '')) || 33  
  let away = parseInt(percent.away.replace('%', '')) || 34
  
  // Normalize to ensure total = 100%
  const total = home + draw + away
  if (total !== 100) {
    const factor = 100 / total
    home = Math.round(home * factor)
    draw = Math.round(draw * factor)
    away = Math.round(away * factor)
    
    // Final adjustment to ensure exactly 100%
    const newTotal = home + draw + away
    if (newTotal !== 100) {
      const diff = 100 - newTotal
      if (home >= draw && home >= away) home += diff
      else if (draw >= home && draw >= away) draw += diff  
      else away += diff
    }
  }
  
  console.log(`✅ Normalized percentages: 1=${home}% X=${draw}% 2=${away}% (total=${home+draw+away}%)`)

  // Calculate additional markets based on winner predictions
  const goalPredictions = calculateGoalPredictions(home, draw, away)
  const doubleChancePredictions = calculateDoubleChancePredictions(home, draw, away)
  const multigoalPredictions = calculateMultigoalPredictions(home, draw, away)

  return {
    winner: { home, draw, away },
    goals: goalPredictions,
    doubleChance: doubleChancePredictions,
    multigol: multigoalPredictions,
    confidence: getConfidenceFromAdvice(advice),
    advice: translateAdvice(advice, homeTeam?.name, awayTeam?.name) || 'Analisi basata su algoritmi CalcioAI',
    mostProbable: home >= draw && home >= away ? 'home' : 
                 draw >= home && draw >= away ? 'draw' : 'away',
    mostProbablePercent: Math.max(home, draw, away)
  }
}

// Process real odds from API-Football
function formatApiOdds(apiOdds: any, predictions: any, h2h?: any, homeStats?: any, awayStats?: any) {
  console.log('📊 formatApiOdds called with predictions:', predictions.winner)
  const apiResult = formatOddsForFrontend(apiOdds)
  
  if (!apiResult) {
    console.log('⚠️ API-Football returned no odds, using realistic odds based on predictions')
    return generateRealisticOdds(predictions)
  }
  
  // Check if API returned meaningful data for our key markets
  const hasRealData = (
    Object.keys(apiResult.correctScore || {}).length > 0 ||
    (apiResult.firstGoalscorer && apiResult.firstGoalscorer.length > 0) ||
    Object.values(apiResult.multigol || {}).some(odd => odd !== 1.00)
  )
  
  if (!hasRealData) {
    console.log('⚠️ API-Football data incomplete, supplementing with realistic odds')
    const realisticOdds = generateRealisticOdds(predictions)
    
    // Merge API data with realistic fallback
    return {
      ...apiResult,
      correctScore: (() => {
        console.log('🎯 Processing correct scores...', {
          hasApiScores: !!apiResult.correctScore,
          apiScoreCount: Object.keys(apiResult.correctScore || {}).length,
          predictions: predictions.winner
        })
        
        if (apiResult.correctScore && Object.keys(apiResult.correctScore).length > 0) {
          console.log('📋 Using filterCoherentCorrectScores')
          return filterCoherentCorrectScores(apiResult.correctScore, predictions)
        } else {
          console.log('🤖 Using generateIntelligentCorrectScores')
          return generateIntelligentCorrectScores(predictions, h2h, homeStats, awayStats)
        }
      })(),
      firstGoalscorer: (apiResult.firstGoalscorer && apiResult.firstGoalscorer.length > 0) ? apiResult.firstGoalscorer : [],
      anytimeGoalscorer: (apiResult.anytimeGoalscorer && apiResult.anytimeGoalscorer.length > 0) ? apiResult.anytimeGoalscorer : [],
      multigol: realisticOdds.multigol // Always use calculated multigol since API often doesn't have it
    }
  }
  
  return apiResult
}


// Convert API advice to our confidence levels
function getConfidenceFromAdvice(advice: string): string {
  if (!advice) return 'MEDIA'
  
  const lowerAdvice = advice.toLowerCase()
  if (lowerAdvice.includes('strong') || lowerAdvice.includes('clear') || lowerAdvice.includes('favorite')) {
    return 'ALTA'
  }
  if (lowerAdvice.includes('uncertain') || lowerAdvice.includes('difficult') || lowerAdvice.includes('close')) {
    return 'BASSA'
  }
  return 'MEDIA'
}

// Traduce i consigli da inglese a italiano
function translateAdvice(advice: string, homeTeam?: string, awayTeam?: string): string {
  if (!advice) return advice
  
  let translated = advice
  
  // Traduzioni comuni
  translated = translated.replace(/Double chance/gi, 'Doppia chance')
  translated = translated.replace(/\bor\b/gi, 'o')
  translated = translated.replace(/\band\b/gi, 'e')
  translated = translated.replace(/\bdraw\b/gi, 'pareggio')
  translated = translated.replace(/\baway\b/gi, 'trasferta')
  translated = translated.replace(/\bhome\b/gi, 'casa')
  translated = translated.replace(/\bwin\b/gi, 'vittoria')
  translated = translated.replace(/\bto win\b/gi, 'vincerà')
  translated = translated.replace(/\bover\b/gi, 'over')
  translated = translated.replace(/\bunder\b/gi, 'under')
  translated = translated.replace(/\bgoals\b/gi, 'gol')
  translated = translated.replace(/\bBoth teams to score\b/gi, 'Entrambe segnano')
  translated = translated.replace(/\bNo\b/gi, 'No')
  translated = translated.replace(/\bYes\b/gi, 'Sì')
  
  // Sostituzioni specifiche con nomi squadre (se disponibili)
  if (homeTeam && awayTeam) {
    // Pattern come "Parma or draw" -> "Parma o pareggio"
    const homeOrDrawPattern = new RegExp(`${homeTeam}\\s+or\\s+draw`, 'gi')
    const awayOrDrawPattern = new RegExp(`${awayTeam}\\s+or\\s+draw`, 'gi')
    const homeAndAwayPattern = new RegExp(`${homeTeam}\\s+and\\s+${awayTeam}`, 'gi')
    
    translated = translated.replace(homeOrDrawPattern, `${homeTeam} o pareggio`)
    translated = translated.replace(awayOrDrawPattern, `${awayTeam} o pareggio`)
    translated = translated.replace(homeAndAwayPattern, `${homeTeam} e ${awayTeam}`)
  }
  
  return translated
}

// Generate intelligent strategy using OpenAI (enhanced version)
async function generateIntelligentStrategy(match: any, predictions: any, odds: any) {
  try {
    // For now, use enhanced local logic. Later we can add OpenAI here
    return generateEnhancedStrategy(match, predictions, odds)
  } catch (error) {
    console.error('Error generating intelligent strategy:', error)
    return generateEnhancedStrategy(match, predictions, odds)
  }
}

function generateEnhancedStrategy(match: any, predictions: any, odds: any) {
  if (!predictions?.winner) {
    return {
      suggestedBet: 'ANALISI NON DISPONIBILE',
      valueRange: 'N/A',
      solidMarket: 'Dati non disponibili',
      analysis: 'Predizioni non disponibili per questa partita',
      alternatives: ['Controlla più tardi per analisi aggiornate'],
      valueBetCheck: ['Analisi non disponibile'],
      mostProbableOutcome: null
    }
  }

  const { home, draw, away } = predictions.winner
  const mostProbable = predictions.mostProbable
  const mostProbablePercent = predictions.mostProbablePercent
  
  // Get outcome labels with proper typing
  const outcomeLabels: Record<string, string> = {
    home: '1 (Casa)',
    draw: 'X (Pareggio)', 
    away: '2 (Trasferta)'
  }
  
  // Calculate value bets based on REAL odds from API-Football
  const homeOdds = odds?.winner?.home || 2.0
  const drawOdds = odds?.winner?.draw || 3.0  
  const awayOdds = odds?.winner?.away || 3.5
  
  console.log(`🎯 Real odds from API: 1=${homeOdds} X=${drawOdds} 2=${awayOdds}`)
  
  // Calculate implied probabilities vs API-Football predictions
  const impliedHome = (1 / homeOdds) * 100
  const impliedDraw = (1 / drawOdds) * 100  
  const impliedAway = (1 / awayOdds) * 100
  
  const homeValue = home - impliedHome
  const drawValue = draw - impliedDraw
  const awayValue = away - impliedAway
  
  const bestValue = Math.max(homeValue, drawValue, awayValue)
  let valueBet = 'Nessun value bet significativo trovato'
  let valueBetOutcome: string | null = null
  
  if (bestValue > 3) { // At least 3% edge for value
    if (bestValue === homeValue) {
      valueBet = `Esito "1" - Value bet con edge del +${homeValue.toFixed(1)}%`
      valueBetOutcome = 'home'
    } else if (bestValue === drawValue) {
      valueBet = `Esito "X" - Value bet con edge del +${drawValue.toFixed(1)}%`
      valueBetOutcome = 'draw'
    } else {
      valueBet = `Esito "2" - Value bet con edge del +${awayValue.toFixed(1)}%`
      valueBetOutcome = 'away'
    }
  }

  // Determine suggested bet type based on confidence
  let suggestedBet = mostProbablePercent >= 55 ? 'SINGOLA' : 
                    mostProbablePercent >= 45 ? 'DOPPIA CHANCE' : 'EVITARE'

  return {
    suggestedBet,
    valueRange: `${(1/mostProbablePercent * 100 * 0.95).toFixed(2)} - ${(1/mostProbablePercent * 100 * 1.05).toFixed(2)}`,
    solidMarket: outcomeLabels[mostProbable] || 'N/A',
    analysis: `Analisi CalcioAI: ${outcomeLabels[mostProbable] || 'N/A'} ha ${mostProbablePercent}% di probabilità secondo i nostri algoritmi. ${valueBet}`,
    alternatives: [
      mostProbablePercent >= 50 ? 'Combo sicura con Under 3.5 goal' : 'Aspettare odds migliori',
      valueBetOutcome ? `Value bet su ${outcomeLabels[valueBetOutcome]}` : 'Cercare value in altri mercati',
      'Live betting per quotes dinamiche'
    ],
    valueBetCheck: [
      `Esito "1": ${homeValue > 0 ? `+${homeValue.toFixed(1)}%` : homeValue.toFixed(1) + '%'} (odds ${homeOdds})`,
      `Esito "X": ${drawValue > 0 ? `+${drawValue.toFixed(1)}%` : drawValue.toFixed(1) + '%'} (odds ${drawOdds})`, 
      `Esito "2": ${awayValue > 0 ? `+${awayValue.toFixed(1)}%` : awayValue.toFixed(1) + '%'} (odds ${awayOdds})`
    ],
    mostProbableOutcome: {
      outcome: mostProbable,
      label: outcomeLabels[mostProbable],
      percentage: mostProbablePercent,
      odds: mostProbable === 'home' ? homeOdds : mostProbable === 'draw' ? drawOdds : awayOdds
    }
  }
}

function formatPredictions(predictions: any) {
  // Se predictions non esiste o non ha la struttura corretta, usa fallback
  if (!predictions || typeof predictions !== 'object') {
    const home = 33, draw = 33, away = 34
    return {
      winner: { home, draw, away },
      goals: calculateGoalPredictions(home, draw, away),
      doubleChance: calculateDoubleChancePredictions(home, draw, away),
      multigol: calculateMultigoalPredictions(home, draw, away),
      confidence: 'MEDIA',
      advice: 'Nessuna proposta per questa partita',
      mostProbable: 'draw',
      mostProbablePercent: 34
    }
  }

  let home: number, draw: number, away: number

  // Se predictions esiste ma non ha winner, crea la struttura corretta
  if (!predictions.winner) {
    // Se ha home, draw, away direttamente nelle predictions
    if (typeof predictions.home === 'number' && typeof predictions.draw === 'number' && typeof predictions.away === 'number') {
      home = predictions.home
      draw = predictions.draw  
      away = predictions.away
    } else {
      // Fallback se la struttura è sconosciuta
      home = 33; draw = 33; away = 34
    }
  } else {
    // Se predictions.winner esiste, usa quei valori
    home = predictions.winner.home || 33
    draw = predictions.winner.draw || 33
    away = predictions.winner.away || 34
  }

  return {
    winner: { home, draw, away },
    goals: calculateGoalPredictions(home, draw, away),
    doubleChance: calculateDoubleChancePredictions(home, draw, away),
    multigol: calculateMultigoalPredictions(home, draw, away),
    confidence: predictions.confidence || 'MEDIA',
    advice: predictions.advice || 'Analisi basata su dati storici',
    mostProbable: home >= draw && home >= away ? 'home' : 
                  draw >= home && draw >= away ? 'draw' : 'away',
    mostProbablePercent: Math.max(home, draw, away)
  }
}

function generateStrategy(match: any) {
  if (!match.predictions || !match.predictions.winner) {
    return {
      suggestedBet: 'ANALISI NON DISPONIBILE',
      valueRange: 'N/A',
      solidMarket: 'Dati non disponibili',
      analysis: 'Predizioni non disponibili per questa partita',
      alternatives: ['Controlla più tardi per analisi aggiornate'],
      valueBetCheck: ['Analisi non disponibile']
    }
  }

  const { home, draw, away } = match.predictions.winner
  const maxPercent = Math.max(home, draw, away)
  const maxOutcome = maxPercent === home ? '1' : 
                    maxPercent === draw ? 'X' : '2'

  return {
    suggestedBet: 'SINGOLA',
    valueRange: '1.70 - 2.10',
    solidMarket: maxPercent >= 50 ? `Esito ${maxOutcome}` : 'Doppia Chance',
    analysis: `Con probabilità del ${maxPercent}% per l'esito più probabile, ${match.predictions.advice || 'partita equilibrata'}`,
    alternatives: [
      'Combo sicura con Under 3.5',
      'Multipla con altra partita alta confidence',
      'Mercato goal (BTTS) se equilibrata'
    ],
    valueBetCheck: [
      `Se quota > ${(100/home * 1.05).toFixed(2)} per "1" è VALUE`,
      `Se quota > ${(100/draw * 1.05).toFixed(2)} per "X" è VALUE`,
      `Se quota > ${(100/away * 1.05).toFixed(2)} per "2" è VALUE`
    ]
  }
}

function formatH2H(h2h: any[]) {
  if (!h2h || h2h.length === 0) {
    return {
      homeWins: 0, draws: 0, awayWins: 0, totalGames: 0, avgGoals: '0',
      lastResult: null
    }
  }

  const homeWins = h2h.filter(match => 
    match.goals.home > match.goals.away
  ).length
  const draws = h2h.filter(match => 
    match.goals.home === match.goals.away
  ).length
  const awayWins = h2h.filter(match => 
    match.goals.home < match.goals.away
  ).length

  const totalGoals = h2h.reduce((sum, match) => 
    sum + (match.goals.home || 0) + (match.goals.away || 0), 0
  )

  return {
    homeWins,
    draws,
    awayWins,
    totalGames: h2h.length,
    avgGoals: h2h.length > 0 ? (totalGoals / h2h.length).toFixed(1) : '0',
    lastResult: h2h[0] ? {
      date: h2h[0].fixture.date.split('T')[0],
      homeScore: h2h[0].goals.home || 0,
      awayScore: h2h[0].goals.away || 0,
    } : null,
  }
}

function formatInjuries(injuries: any[]) {
  if (!injuries || injuries.length === 0) return []
  
  return injuries.map(injury => ({
    team: injury.team.name.includes('home') ? 'home' : 'away',
    player: injury.player.name,
    status: injury.player.reason === 'Injured' ? 'out' : 'doubt',
    impact: 'medium',
  }))
}

// Calculate goal predictions based on main winner predictions
function calculateGoalPredictions(home: number, draw: number, away: number) {
  // Logic: higher confidence in outcomes often correlates with more goals
  const maxProb = Math.max(home, draw, away)
  const offensive = maxProb < 40 ? 65 : maxProb > 60 ? 55 : 60 // More uncertainty = more goals
  
  return {
    over_1_5: Math.round(Math.min(85, offensive + 20)),
    under_1_5: Math.round(Math.max(15, 100 - (offensive + 20))),
    over_2_5: Math.round(offensive),
    under_2_5: Math.round(100 - offensive),
    over_3_5: Math.round(Math.max(25, offensive - 25)),
    under_3_5: Math.round(Math.min(75, 100 - (offensive - 25))),
    gol: Math.round(Math.max(35, Math.min(65, 50 + (draw - 33) / 2))), // Changed from btts to gol
    nogol: Math.round(Math.min(65, Math.max(35, 50 - (draw - 33) / 2))) // Changed from nobtts to nogol
  }
}

// Calculate double chance predictions
function calculateDoubleChancePredictions(home: number, draw: number, away: number) {
  return {
    x1: Math.round(home + draw),
    x2: Math.round(draw + away), 
    x12: Math.round(home + away)
  }
}

// Calculate multigol predictions  
function calculateMultigoalPredictions(home: number, draw: number, away: number) {
  // Logic based on how competitive the match is
  const competitiveness = 100 - Math.max(home, draw, away) // Lower = more competitive
  
  return {
    mg_1_2: Math.round(Math.max(25, 50 - competitiveness / 3)),
    mg_2_3: Math.round(Math.max(30, 45 - competitiveness / 4)),
    mg_3_4: Math.round(Math.max(28, 42 - competitiveness / 4)),
    mg_4_5: Math.round(Math.max(15, 25 - competitiveness / 3)),
    mg_1_3: Math.round(Math.max(35, 60 - competitiveness / 3)),
    mg_2_4: Math.round(Math.max(40, 65 - competitiveness / 4)),
    mg_3_5: Math.round(Math.max(20, 35 - competitiveness / 2))
  }
}

// Generate realistic odds based on predictions
function generateRealisticOdds(predictions: any) {
  const convertToOdd = (percentage: number) => {
    // More realistic conversion: 65% should give 1.53 (1/0.65 = 1.54)
    return Math.round((100 / percentage) * 100) / 100 
  }
  
  console.log('🎯 Converting predictions to odds:')
  console.log(`  mg_2_4: ${predictions.multigol?.mg_2_4}% → ${convertToOdd(predictions.multigol?.mg_2_4 || 65)}`)

  return {
    winner: {
      home: convertToOdd(predictions.winner.home),
      draw: convertToOdd(predictions.winner.draw), 
      away: convertToOdd(predictions.winner.away)
    },
    goals: {
      over_0_5: 1.05, under_0_5: 12.00,
      over_1_5: convertToOdd(predictions.goals.over_1_5),
      under_1_5: convertToOdd(predictions.goals.under_1_5),
      over_2_5: convertToOdd(predictions.goals.over_2_5),
      under_2_5: convertToOdd(predictions.goals.under_2_5),
      over_3_5: convertToOdd(predictions.goals.over_3_5),
      under_3_5: convertToOdd(predictions.goals.under_3_5),
      over_4_5: 4.00, under_4_5: 1.25,
      over_5_5: 8.00, under_5_5: 1.10,
      gol: convertToOdd(predictions.goals.gol),
      nogol: convertToOdd(predictions.goals.nogol)
    },
    doubleChance: {
      x1: convertToOdd(predictions.doubleChance.x1),
      x2: convertToOdd(predictions.doubleChance.x2),
      x12: convertToOdd(predictions.doubleChance.x12)
    },
    multigol: {
      mg_1_2: convertToOdd(predictions.multigol.mg_1_2),
      mg_2_3: convertToOdd(predictions.multigol.mg_2_3), 
      mg_3_4: convertToOdd(predictions.multigol.mg_3_4),
      mg_4_5: convertToOdd(predictions.multigol.mg_4_5),
      mg_1_3: convertToOdd(predictions.multigol.mg_1_3),
      mg_2_4: convertToOdd(predictions.multigol.mg_2_4),
      mg_3_5: convertToOdd(predictions.multigol.mg_3_5)
    },
    correctScore: generateTopCorrectScores(predictions),
    firstHalf: {
      winner: { home: 2.80, draw: 2.20, away: 4.20 },
      over_0_5: 1.40, under_0_5: 2.80,
      over_1_5: 2.60, under_1_5: 1.45
    },
    combo: {},
    handicap: {},
    firstGoalscorer: [],
    anytimeGoalscorer: []
  }
}

// Filter correct scores from API to be coherent with our predictions
function filterCoherentCorrectScores(apiScores: Record<string, number>, predictions: any): Record<string, number> {
  const { home, draw, away } = predictions.winner
  console.log('🎯 Filtering API correct scores for coherence with predictions')
  
  // Convert scores object to array for easier filtering
  const scoresArray = Object.entries(apiScores)
    .map(([score, odds]) => {
      const [h, a] = score.split(/[-:]/).map(Number)
      if (isNaN(h) || isNaN(a)) return null
      
      const isDraw = h === a
      const isHomeWin = h > a
      const isAwayWin = h < a
      
      // Calculate match coherence
      let coherence = 0
      if (isDraw && draw >= home && draw >= away) coherence = draw
      else if (isHomeWin && home >= draw && home >= away) coherence = home
      else if (isAwayWin && away >= draw && away >= home) coherence = away
      else if (isDraw) coherence = draw / 2 // Partial coherence for draws
      else if (isHomeWin) coherence = home / 2 
      else if (isAwayWin) coherence = away / 2
      
      return { score, odds: Number(odds), homeGoals: h, awayGoals: a, coherence }
    })
    .filter(item => item !== null)
    .sort((a, b) => {
      // Sort by coherence first, then by odds (lower = more likely)
      if (b!.coherence !== a!.coherence) return b!.coherence - a!.coherence
      return a!.odds - b!.odds
    })
  
  // Take top 2 most coherent & probable scores
  const topScores = scoresArray.slice(0, 2)
  const result: Record<string, number> = {}
  
  topScores.forEach(item => {
    if (item) result[item.score] = item.odds
  })
  
  console.log('✅ Filtered coherent scores:', result)
  return result
}

// Generate intelligent correct scores based on multiple factors
function generateIntelligentCorrectScores(
  predictions: any, 
  h2h: any,
  homeStats: any,
  awayStats: any
): Record<string, number> {
  const { home, draw, away } = predictions.winner
  const avgGoals = parseFloat(h2h?.avgGoals || '2.5')
  
  console.log('🤖 Generating intelligent correct scores')
  console.log(`   Home win: ${home}%, Draw: ${draw}%, Away win: ${away}%`)
  console.log(`   Historical avg goals: ${avgGoals}`)
  
  // Analyze team scoring patterns
  const homeAvgScored = homeStats?.avgGoalsPerGame || 1.3
  const homeAvgConceded = homeStats?.avgConcededPerGame || 1.1
  const awayAvgScored = awayStats?.avgGoalsPerGame || 1.2
  const awayAvgConceded = awayStats?.avgConcededPerGame || 1.2
  
  // Calculate expected goals for this match
  const homeExpectedGoals = (homeAvgScored + awayAvgConceded) / 2
  const awayExpectedGoals = (awayAvgScored + homeAvgConceded) / 2
  
  console.log(`   Expected goals: Home ${homeExpectedGoals.toFixed(1)}, Away ${awayExpectedGoals.toFixed(1)}`)
  
  // Generate scores based on probabilities and expected goals
  let topScores: Record<string, number> = {}
  
  if (draw >= home && draw >= away) {
    // Draw most likely
    if (avgGoals < 2) {
      topScores = { '0-0': 8.50, '1-1': 6.50 }
    } else if (avgGoals > 3) {
      topScores = { '2-2': 12.00, '1-1': 7.00 }
    } else {
      topScores = { '1-1': 6.00, '0-0': 9.00 }
    }
  } else if (away >= home) {
    // Away team favored
    const goalDiff = Math.round(awayExpectedGoals - homeExpectedGoals)
    if (avgGoals < 2.2) {
      topScores = goalDiff > 1 ? { '0-2': 11.00, '0-1': 8.50 } : { '0-1': 8.00, '1-2': 11.00 }
    } else if (avgGoals > 3) {
      topScores = goalDiff > 1 ? { '1-3': 18.00, '2-4': 25.00 } : { '1-2': 10.00, '2-3': 16.00 }
    } else {
      topScores = { '0-1': 9.00, '1-2': 11.50 }
    }
  } else {
    // Home team favored
    const goalDiff = Math.round(homeExpectedGoals - awayExpectedGoals)
    if (avgGoals < 2.2) {
      topScores = goalDiff > 1 ? { '2-0': 10.00, '1-0': 7.50 } : { '1-0': 7.00, '2-1': 10.50 }
    } else if (avgGoals > 3) {
      topScores = goalDiff > 1 ? { '3-1': 16.00, '4-2': 28.00 } : { '2-1': 9.00, '3-2': 20.00 }
    } else {
      topScores = { '2-1': 9.50, '1-0': 8.00 }
    }
  }
  
  console.log('🎯 Generated intelligent scores:', topScores)
  return topScores
}

// Generate basic correct scores (fallback function)
function generateTopCorrectScores(predictions: any) {
  const { home, draw, away } = predictions.winner
  
  console.log(`🎯 Generating correct scores for: Home ${home}%, Draw ${draw}%, Away ${away}%`)
  
  // Determine the two most likely correct scores based on probabilities
  let topScores = {}
  
  // Check if it's truly balanced (all within 40-60% range)
  const isBalanced = home <= 40 && draw >= 30 && away <= 40
  
  if (draw >= home && draw >= away) {
    // Draw is most likely - focus on draw results
    console.log('🤝 Draw is most likely')
    if (draw >= 40) {
      // Clear draw favorite
      topScores = { '1-1': 6.00, '0-0': 9.00 }
    } else {
      // Draw slightly ahead, include one from second favorite
      if (away > home) {
        topScores = { '1-1': 6.50, '1-2': 10.00 } // Draw + away win
      } else {
        topScores = { '1-1': 6.50, '2-1': 11.00 } // Draw + home win
      }
    }
  } else if (away > home && away >= draw) {
    // Away team favorite  
    console.log('✈️ Away team is favorite')
    if (away > 55) {
      topScores = { '0-2': 8.50, '1-2': 10.00 } // Away strong favorite
    } else if (away > 45) {
      topScores = { '0-1': 9.00, '1-2': 11.00 } // Away slight favorite  
    } else if (draw >= 35) {
      topScores = { '1-1': 7.00, '0-1': 10.00 } // Away slight with draw chance
    } else {
      topScores = { '0-1': 9.00, '1-2': 11.00 } // Away slight favorite
    }
  } else {
    // Home team favorite
    console.log('🏠 Home team is favorite')
    if (home > 55) {
      topScores = { '2-0': 7.50, '2-1': 9.00 } // Home strong favorite
    } else if (home > 45) {
      topScores = { '1-0': 8.00, '2-1': 10.00 } // Home slight favorite
    } else if (draw >= 35) {
      topScores = { '1-1': 7.00, '1-0': 9.00 } // Home slight with draw chance
    } else {
      topScores = { '1-0': 8.00, '2-1': 10.00 } // Home slight favorite
    }
  }
  
  console.log(`🎯 Generated correct scores:`, topScores)
  return topScores
}

// Format team statistics for enriched AI analysis
function formatTeamStats(stats: any, teamType: 'home' | 'away') {
  if (!stats) return null
  
  try {
    return {
      // Form and performance
      wins: stats.fixtures?.wins?.total || 0,
      losses: stats.fixtures?.loses?.total || 0,
      draws: stats.fixtures?.draws?.total || 0,
      winPercentage: Math.round(((stats.fixtures?.wins?.total || 0) / (stats.fixtures?.played?.total || 1)) * 100),
      
      // Goals statistics  
      goalsScored: stats.goals?.for?.total || 0,
      goalsConceded: stats.goals?.against?.total || 0,
      avgGoalsPerGame: Number(((stats.goals?.for?.total || 0) / (stats.fixtures?.played?.total || 1)).toFixed(1)),
      avgConcededPerGame: Number(((stats.goals?.against?.total || 0) / (stats.fixtures?.played?.total || 1)).toFixed(1)),
      
      // Home/Away specific
      homeAwayForm: {
        played: teamType === 'home' ? stats.fixtures?.played?.home || 0 : stats.fixtures?.played?.away || 0,
        wins: teamType === 'home' ? stats.fixtures?.wins?.home || 0 : stats.fixtures?.wins?.away || 0,
        draws: teamType === 'home' ? stats.fixtures?.draws?.home || 0 : stats.fixtures?.draws?.away || 0,
        losses: teamType === 'home' ? stats.fixtures?.loses?.home || 0 : stats.fixtures?.loses?.away || 0,
        goalsFor: teamType === 'home' ? stats.goals?.for?.home || 0 : stats.goals?.for?.away || 0,
        goalsAgainst: teamType === 'home' ? stats.goals?.against?.home || 0 : stats.goals?.against?.away || 0,
      },
      
      // Additional metrics
      cleanSheets: stats.clean_sheet?.total || 0,
      failedToScore: stats.failed_to_score?.total || 0,
      penaltyScored: stats.penalty?.scored?.total || 0,
      
      // League position and points (if available)
      position: stats.league?.position || null,
      points: stats.league?.points || null,
      
      // Recent form string (last 5 matches)
      form: stats.league?.form || 'WWDWL'
    }
  } catch (error) {
    console.error('Error formatting team stats:', error)
    return null
  }
}