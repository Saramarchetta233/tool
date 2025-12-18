import { NextRequest, NextResponse } from 'next/server'
import { ApiFootballService } from '@/lib/api-football'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id
    
    // Check if API key is configured
    if (!process.env.API_FOOTBALL_KEY) {
      return NextResponse.json(
        getMockMatchAnalysis(matchId),
        { status: 200 }
      )
    }

    const fixtureId = parseInt(matchId)
    if (isNaN(fixtureId)) {
      return NextResponse.json(
        { error: 'Invalid match ID' },
        { status: 400 }
      )
    }

    // Get predictions and other data in parallel
    const [predictions, injuries] = await Promise.allSettled([
      ApiFootballService.getPredictions(fixtureId),
      ApiFootballService.getInjuries(fixtureId),
    ])

    const predictionData = predictions.status === 'fulfilled' ? predictions.value : null
    const injuryData = injuries.status === 'fulfilled' ? injuries.value : []

    if (!predictionData) {
      return NextResponse.json(
        { error: 'Match not found or no predictions available' },
        { status: 404 }
      )
    }

    // Get H2H data
    const h2h = await ApiFootballService.getHeadToHead(
      predictionData.teams.home.id,
      predictionData.teams.away.id
    )

    // Format response
    const analysis = {
      match: {
        id: matchId,
        homeTeam: predictionData.teams.home,
        awayTeam: predictionData.teams.away,
      },
      predictions: {
        winner: {
          home: parseInt(predictionData.predictions.percent.home),
          draw: parseInt(predictionData.predictions.percent.draw),
          away: parseInt(predictionData.predictions.percent.away),
        },
        advice: predictionData.predictions.advice,
        confidence: getConfidenceLevel(
          Math.max(
            parseInt(predictionData.predictions.percent.home),
            parseInt(predictionData.predictions.percent.draw),
            parseInt(predictionData.predictions.percent.away)
          )
        ),
      },
      headToHead: formatH2H(h2h),
      injuries: formatInjuries(injuryData),
      strategy: generateStrategy(predictionData),
    }

    return NextResponse.json(analysis)
    
  } catch (error) {
    console.error('Error in /api/matches/[id]:', error)
    
    return NextResponse.json(
      getMockMatchAnalysis(params.id),
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