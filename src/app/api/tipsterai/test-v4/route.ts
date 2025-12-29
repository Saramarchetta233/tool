import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// Simula partite per test
const mockMatches = [
  {
    fixture_id: 1001,
    home_team: { name: 'Juventus' },
    away_team: { name: 'Empoli' },
    league_name: 'Serie A',
    match_time: '20:45',
    match_date: new Date().toISOString().split('T')[0],
    odds: {
      winner: { home: 1.45, draw: 4.20, away: 6.50 },
      goals: { over_2_5: 1.75, under_2_5: 2.00 },
      both_teams_score: { yes: 1.80, no: 1.95 }
    },
    predictions: {
      predictions: { home: '65', draw: '25', away: '10', advice: 'La Juventus in casa è solida' }
    }
  },
  {
    fixture_id: 1002,
    home_team: { name: 'Manchester City' },
    away_team: { name: 'Brighton' },
    league_name: 'Premier League',
    match_time: '16:00',
    match_date: new Date().toISOString().split('T')[0],
    odds: {
      winner: { home: 1.30, draw: 5.50, away: 9.00 },
      goals: { over_2_5: 1.50, under_2_5: 2.40 },
      both_teams_score: { yes: 1.65, no: 2.15 }
    },
    predictions: {
      predictions: { home: '75', draw: '18', away: '7', advice: 'City dominante contro Brighton' }
    }
  },
  {
    fixture_id: 1003,
    home_team: { name: 'Real Madrid' },
    away_team: { name: 'Getafe' },
    league_name: 'La Liga',
    match_time: '18:30',
    match_date: new Date().toISOString().split('T')[0],
    odds: {
      winner: { home: 1.25, draw: 6.00, away: 11.00 },
      goals: { over_2_5: 1.70, under_2_5: 2.05 },
      both_teams_score: { yes: 1.75, no: 2.00 }
    },
    predictions: {
      predictions: { home: '80', draw: '15', away: '5', advice: 'Real Madrid favorito netto' }
    }
  },
  {
    fixture_id: 1004,
    home_team: { name: 'Bayern Munich' },
    away_team: { name: 'Hoffenheim' },
    league_name: 'Bundesliga',
    match_time: '15:30',
    match_date: new Date().toISOString().split('T')[0],
    odds: {
      winner: { home: 1.35, draw: 5.00, away: 8.50 },
      goals: { over_2_5: 1.45, under_2_5: 2.60 },
      both_teams_score: { yes: 1.55, no: 2.30 }
    },
    predictions: {
      predictions: { home: '70', draw: '20', away: '10', advice: 'Bayern favorito ma Hoffenheim può sorprendere' }
    }
  },
  {
    fixture_id: 1005,
    home_team: { name: 'Roma' },
    away_team: { name: 'Lecce' },
    league_name: 'Serie A',
    match_time: '21:00',
    match_date: new Date().toISOString().split('T')[0],
    odds: {
      winner: { home: 1.75, draw: 3.60, away: 4.50 },
      goals: { over_2_5: 1.85, under_2_5: 1.90 },
      both_teams_score: { yes: 1.70, no: 2.05 }
    },
    predictions: {
      predictions: { home: '55', draw: '25', away: '20', advice: 'Roma favorita ma Lecce può resistere' }
    }
  },
  {
    fixture_id: 1006,
    home_team: { name: 'Arsenal' },
    away_team: { name: 'Crystal Palace' },
    league_name: 'Premier League',
    match_time: '17:30',
    match_date: new Date().toISOString().split('T')[0],
    odds: {
      winner: { home: 1.50, draw: 4.00, away: 6.00 },
      goals: { over_2_5: 1.60, under_2_5: 2.25 },
      both_teams_score: { yes: 1.75, no: 2.00 }
    },
    predictions: {
      predictions: { home: '60', draw: '25', away: '15', advice: 'Arsenal favorito all\'Emirates' }
    }
  },
  {
    fixture_id: 1007,
    home_team: { name: 'Napoli' },
    away_team: { name: 'Venezia' },
    league_name: 'Serie A',
    match_time: '19:00',
    match_date: new Date().toISOString().split('T')[0],
    odds: {
      winner: { home: 1.40, draw: 4.50, away: 7.50 },
      goals: { over_2_5: 1.70, under_2_5: 2.10 },
      both_teams_score: { yes: 1.85, no: 1.90 }
    },
    predictions: {
      predictions: { home: '68', draw: '22', away: '10', advice: 'Napoli netto favorito contro Venezia' }
    }
  },
  {
    fixture_id: 1008,
    home_team: { name: 'Liverpool' },
    away_team: { name: 'Fulham' },
    league_name: 'Premier League',
    match_time: '14:00',
    match_date: new Date().toISOString().split('T')[0],
    odds: {
      winner: { home: 1.60, draw: 3.80, away: 5.50 },
      goals: { over_2_5: 1.55, under_2_5: 2.35 },
      both_teams_score: { yes: 1.65, no: 2.15 }
    },
    predictions: {
      predictions: { home: '58', draw: '24', away: '18', advice: 'Liverpool favorito ad Anfield' }
    }
  }
]

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST() {
  try {
    console.log('🧪 Test TipsterAI V4 con partite simulate...')
    
    // Test analisi GPT
    const matchesForAnalysis = mockMatches.map(m => ({
      id: m.fixture_id,
      partita: `${m.home_team?.name || 'Casa'} vs ${m.away_team?.name || 'Ospite'}`,
      lega: m.league_name,
      ora: m.match_time,
      quote: {
        '1': m.odds?.winner?.home || null,
        'X': m.odds?.winner?.draw || null,
        '2': m.odds?.winner?.away || null,
        'Over 2.5': m.odds?.goals?.over_2_5 || null,
        'Under 2.5': m.odds?.goals?.under_2_5 || null,
        'Gol': m.odds?.both_teams_score?.yes || null,
        'NoGol': m.odds?.both_teams_score?.no || null
      },
      predizioni: {
        casa: m.predictions?.predictions?.home || null,
        pareggio: m.predictions?.predictions?.draw || null,
        ospite: m.predictions?.predictions?.away || null,
        consiglio: m.predictions?.predictions?.advice || null
      }
    }))
    
    const prompt = `Sei un esperto di scommesse calcistiche. Analizza queste partite e per OGNUNA:

1. Valuta attentamente quote e statistiche
2. Identifica il pronostico PIÙ PROBABILE considerando le quote reali
3. Suggerisci alternative (combo, over/under, gol)
4. Dai una confidence 0-100 basata sui dati
5. Scrivi una motivazione UMANA e NATURALE (NO percentuali!)

PARTITE:
${JSON.stringify(matchesForAnalysis, null, 2)}

REGOLE MOTIVAZIONI:
✅ "Il Milan in casa raramente delude, la difesa del Verona è in difficoltà"
✅ "Derby sempre equilibrato, meglio puntare sui gol"
❌ "Il Milan ha il 65% di vittoria"
❌ "Statisticamente probabile l'Over"

OUTPUT JSON:
{
  "analisi": [
    {
      "fixture_id": 123,
      "confidence": 75,
      "reasoning": "Juventus imbattuta in casa, Empoli senza vittorie fuori",
      "suggestions": {
        "esito": "1",
        "over_under": "Under 2.5",
        "gol": "NoGol",
        "combo": ["1X + Under 3.5", "1 + NoGol"],
        "risultato_esatto": "2-0"
      }
    }
  ]
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    console.log('✅ Test completato con successo')
    console.log('🔍 Analisi GPT:', result.analisi?.length || 0, 'partite')
    
    return NextResponse.json({
      success: true,
      message: 'Test completato con successo',
      data: {
        partite_simulate: mockMatches.length,
        analisi_gpt: result.analisi?.length || 0,
        samples: {
          partite: mockMatches.slice(0, 2),
          analisi: result.analisi?.slice(0, 2) || []
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Errore test V4:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore durante il test'
    }, { status: 500 })
  }
}