import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCompleteMatchAnalysis } from '@/lib/openai-match-analysis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fixtureId = parseInt(id)
    
    if (!fixtureId || isNaN(fixtureId)) {
      return NextResponse.json(
        { error: 'Invalid fixture ID' },
        { status: 400 }
      )
    }
    
    console.log(`🔍 Fetching COMPLETE match data for fixture ${fixtureId}`)
    
    // Get match data from database
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('fixture_id', fixtureId)
      .single()
    
    if (matchError || !match) {
      console.log(`❌ Match not found: ${fixtureId}`)
      return NextResponse.json(
        getMockMatchAnalysis(id),
        { status: 200 }
      )
    }
    
    // Get COMPLETE OpenAI analysis
    const completeAnalysis = await getCompleteMatchAnalysis(fixtureId)
    
    // Format response with COMPLETE data
    if (completeAnalysis) {
      const response = {
        success: true,
        match: {
          id: match.fixture_id.toString(),
          date: match.match_date,
          time: match.match_time,
          league: match.league_name,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          venue: match.venue,
          odds: match.odds,
          predictions: match.predictions,
          status: match.status || 'scheduled'
        },
        // COMPLETE OpenAI analysis
        analysis: completeAnalysis.analysis,
        confidence: completeAnalysis.confidence_score,
        hasAnalysis: true,
        analysisType: 'OpenAI_GPT4_Complete',
        credits: 2
      }
      
      return NextResponse.json(response)
    } else {
      // Match esiste ma analisi non ancora disponibile
      const response = {
        success: true,
        match: {
          id: match.fixture_id.toString(),
          date: match.match_date,
          time: match.match_time,
          league: match.league_name,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          venue: match.venue,
          odds: match.odds,
          predictions: match.predictions,
          status: match.status || 'scheduled'
        },
        analysis: null,
        confidence: null,
        hasAnalysis: false,
        message: 'Analisi OpenAI in corso... Riprova tra qualche minuto.',
        analysisType: 'pending'
      }
      
      return NextResponse.json(response)
    }
    
  } catch (error) {
    console.error('❌ Error fetching COMPLETE match:', error)
    
    const { id } = await params
    return NextResponse.json(
      getMockMatchAnalysis(id),
      { status: 200 }
    )
  }
}

function getConfidenceLevel(maxPercentage: number): 'ALTA' | 'MEDIA' | 'BASSA' {
  if (maxPercentage >= 60) return 'ALTA'
  if (maxPercentage >= 40) return 'MEDIA'
  return 'BASSA'
}

function formatH2H(h2h: any[]) {
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
  return injuries.map(injury => ({
    team: injury.team.name.includes('home') ? 'home' : 'away',
    player: injury.player.name,
    status: injury.player.reason === 'Injured' ? 'out' : 'doubt',
    impact: 'medium', // Could be enhanced with more logic
  }))
}

function generateStrategy(prediction: any) {
  const homePercent = parseInt(prediction.predictions.percent.home)
  const drawPercent = parseInt(prediction.predictions.percent.draw)
  const awayPercent = parseInt(prediction.predictions.percent.away)
  
  const maxPercent = Math.max(homePercent, drawPercent, awayPercent)
  const maxOutcome = maxPercent === homePercent ? '1' : 
                    maxPercent === drawPercent ? 'X' : '2'

  return {
    suggestedBet: 'SINGOLA',
    valueRange: '1.70 - 2.10',
    solidMarket: maxPercent >= 50 ? `Esito ${maxOutcome}` : 'Doppia Chance',
    analysis: `Con probabilità del ${maxPercent}% per l'esito più probabile, ${prediction.predictions.advice}`,
    alternatives: [
      'Combo sicura con Under 3.5',
      'Multipla con altra partita alta confidence',
      'Mercato goal (BTTS) se equilibrata'
    ],
    valueBetCheck: [
      `Se quota > ${(100/homePercent * 1.05).toFixed(2)} per "1" è VALUE`,
      `Se quota > ${(100/drawPercent * 1.05).toFixed(2)} per "X" è VALUE`,
      `Se quota > ${(100/awayPercent * 1.05).toFixed(2)} per "2" è VALUE`
    ]
  }
}

function getMockMatchAnalysis(matchId: string) {
  return {
    match: {
      id: matchId,
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
    },
    predictions: {
      winner: {
        home: 52,
        draw: 26,
        away: 22,
      },
      advice: 'Match equilibrato con leggero favore per la squadra di casa',
      confidence: 'MEDIA',
    },
    headToHead: {
      homeWins: 12,
      draws: 5,
      awayWins: 8,
      totalGames: 25,
      avgGoals: '2.4',
      lastResult: {
        date: '2024-03-15',
        homeScore: 2,
        awayScore: 1,
      },
    },
    injuries: [
      {
        team: 'home',
        player: 'Federico Chiesa',
        status: 'out',
        impact: 'high',
      },
      {
        team: 'away',
        player: 'Mike Maignan',
        status: 'doubt',
        impact: 'medium',
      },
    ],
    strategy: {
      suggestedBet: 'SINGOLA',
      valueRange: '1.70 - 2.10',
      solidMarket: '1X (78% confidence)',
      analysis: 'Con probabilità casa del 52% e storico H2H favorevole, una singola sul mercato 1X offre il miglior rapporto rischio/rendimento.',
      alternatives: [
        'Doppia: abbina con altra partita ALTA confidence',
        'Combo sicura: 1X + Under 3.5 (~1.40)',
        'Higher risk: 1 secco (quota ~1.90)',
      ],
      valueBetCheck: [
        'Se quota > 1.92 per "1" è VALUE ✅',
        'Se quota > 3.85 per "X" è VALUE ✅',
        'Se quota > 4.55 per "2" è VALUE ✅',
      ],
    },
  }
}