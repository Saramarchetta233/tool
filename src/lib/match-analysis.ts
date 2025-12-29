import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
)

export interface MatchAnalysis {
  fixture_id: number
  match_date: string
  home_team: string
  away_team: string
  league: string
  analysis: {
    overall_prediction: {
      recommended_bet: string
      confidence: number
      reasoning: string
    }
    tactical_analysis: {
      formation_prediction: string
      key_battles: string[]
      tactical_advantage: string
    }
    statistical_insights: {
      form_analysis: string
      h2h_record: string
      scoring_trends: string
    }
    betting_recommendations: {
      primary_bet: {
        market: string
        selection: string
        odds: number
        confidence: number
        reasoning: string
      }
      secondary_bet: {
        market: string
        selection: string
        odds: number
        confidence: number
        reasoning: string
      }
      value_bets: Array<{
        market: string
        selection: string
        odds: number
        value_rating: number
        reasoning: string
      }>
    }
    risk_factors: string[]
    final_score_prediction: string
  }
  confidence_score: number
  created_at: string
}

// Generate comprehensive match analysis with OpenAI
export async function generateMatchAnalysis(match: any): Promise<MatchAnalysis | null> {
  try {
    console.log(`🤖 Generating analysis for ${match.home_team.name} vs ${match.away_team.name}...`)
    
    const prompt = `Sei un esperto analista di calcio con 15 anni di esperienza. Analizza questa partita e fornisci un'analisi completa.

MATCH DATA:
- Partita: ${match.home_team.name} vs ${match.away_team.name}
- Campionato: ${match.league_name}
- Data: ${match.match_date}
- Orario: ${match.match_time}

ODDS DISPONIBILI:
${JSON.stringify(match.odds, null, 2)}

PREDICTIONS API-FOOTBALL:
${JSON.stringify(match.predictions, null, 2)}

VENUE: ${match.venue?.name || 'TBD'}, ${match.venue?.city || ''}

Fornisci un'analisi DETTAGLIATA e PROFESSIONALE in formato JSON seguendo questa struttura:

{
  "overall_prediction": {
    "recommended_bet": "Migliore scommessa consigliata (es: 1X, Over 2.5, BTTS Yes)",
    "confidence": 75,
    "reasoning": "Spiegazione dettagliata della previsione principale basata su tattica, forma, statistiche"
  },
  "tactical_analysis": {
    "formation_prediction": "Formazioni previste e come si confronteranno tatticamente",
    "key_battles": ["Duello chiave 1", "Duello chiave 2", "Duello chiave 3"],
    "tactical_advantage": "Chi ha il vantaggio tattico e perché"
  },
  "statistical_insights": {
    "form_analysis": "Analisi della forma recente di entrambe le squadre",
    "h2h_record": "Storico scontri diretti e tendenze",
    "scoring_trends": "Tendenze gol, difesa, attacco di entrambe"
  },
  "betting_recommendations": {
    "primary_bet": {
      "market": "1X2",
      "selection": "1X",
      "odds": 1.45,
      "confidence": 80,
      "reasoning": "Spiegazione dettagliata del perché questa scommessa"
    },
    "secondary_bet": {
      "market": "Over/Under",
      "selection": "Over 2.5",
      "odds": 2.1,
      "confidence": 65,
      "reasoning": "Spiegazione della scommessa secondaria"
    },
    "value_bets": [
      {
        "market": "BTTS",
        "selection": "Yes",
        "odds": 1.8,
        "value_rating": 85,
        "reasoning": "Perché questa scommessa ha valore"
      }
    ]
  },
  "risk_factors": [
    "Fattore di rischio 1 (es: giocatori chiave squalificati)",
    "Fattore di rischio 2 (es: condizioni meteo)",
    "Fattore di rischio 3"
  ],
  "final_score_prediction": "2-1"
}

IMPORTANTE:
- Usa le quote REALI fornite
- Sii specifico e professionale
- Basa tutto su dati concreti
- La confidenza deve essere realistica (50-90%)
- Include sempre almeno 2-3 value bets
- Spiega SEMPRE il ragionamento`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
    
    const analysisContent = response.choices[0].message.content
    if (!analysisContent) {
      throw new Error('Empty response from OpenAI')
    }
    
    const analysis = JSON.parse(analysisContent)
    
    // Create the match analysis object
    const matchAnalysis: MatchAnalysis = {
      fixture_id: match.fixture_id,
      match_date: match.match_date,
      home_team: match.home_team.name,
      away_team: match.away_team.name,
      league: match.league_name,
      analysis,
      confidence_score: analysis.overall_prediction.confidence || 50,
      created_at: new Date().toISOString()
    }
    
    console.log(`✅ Analysis generated for ${match.home_team.name} vs ${match.away_team.name}`)
    return matchAnalysis
    
  } catch (error) {
    console.error(`❌ Error generating analysis for match ${match.fixture_id}:`, error)
    return null
  }
}

// Generate analyses for all today's matches
export async function generateTodayAnalyses() {
  console.log('🤖 Starting match analysis generation...')
  
  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)
  
  // Get matches that don't have analysis yet
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('match_date', today)
    .gte('match_time', currentTime)
    .order('match_time', { ascending: true })
  
  if (matchesError || !matches) {
    console.error('❌ Error fetching matches:', matchesError)
    return { success: false, error: 'Failed to fetch matches' }
  }
  
  console.log(`📊 Found ${matches.length} matches to analyze`)
  
  const results = []
  
  for (const match of matches) {
    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('match_analyses')
      .select('fixture_id')
      .eq('fixture_id', match.fixture_id)
      .single()
    
    if (existingAnalysis) {
      console.log(`⏭️ Analysis already exists for ${match.home_team.name} vs ${match.away_team.name}`)
      results.push({
        fixture_id: match.fixture_id,
        teams: `${match.home_team.name} vs ${match.away_team.name}`,
        status: 'skipped',
        reason: 'Analysis already exists'
      })
      continue
    }
    
    // Generate analysis
    const analysis = await generateMatchAnalysis(match)
    
    if (analysis) {
      // Save to database
      const { error: saveError } = await supabase
        .from('match_analyses')
        .upsert(analysis, { onConflict: 'fixture_id' })
      
      if (saveError) {
        console.error(`❌ Error saving analysis for match ${match.fixture_id}:`, saveError)
        results.push({
          fixture_id: match.fixture_id,
          teams: `${match.home_team.name} vs ${match.away_team.name}`,
          status: 'error',
          error: saveError.message
        })
      } else {
        console.log(`✅ Saved analysis for ${match.home_team.name} vs ${match.away_team.name}`)
        results.push({
          fixture_id: match.fixture_id,
          teams: `${match.home_team.name} vs ${match.away_team.name}`,
          status: 'success',
          confidence: analysis.confidence_score
        })
      }
    } else {
      results.push({
        fixture_id: match.fixture_id,
        teams: `${match.home_team.name} vs ${match.away_team.name}`,
        status: 'failed',
        error: 'Failed to generate analysis'
      })
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  const successful = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length
  
  console.log(`🏁 Analysis generation completed: ${successful} successful, ${failed} failed`)
  
  return {
    success: true,
    total: matches.length,
    successful,
    failed,
    results
  }
}

// Get analysis for a specific match
export async function getMatchAnalysis(fixtureId: number) {
  const { data, error } = await supabase
    .from('match_analyses')
    .select('*')
    .eq('fixture_id', fixtureId)
    .single()
  
  if (error) {
    console.error('Error fetching match analysis:', error)
    return null
  }
  
  return data
}