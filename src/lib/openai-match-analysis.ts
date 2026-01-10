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

export interface CompleteMatchAnalysis {
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

// Genera analisi completa con OpenAI GPT-4
export async function generateCompleteAnalysis(match: any): Promise<{ analysis: CompleteMatchAnalysis | null, error?: string }> {
  try {
    console.log(`🤖 Generating COMPLETE analysis for ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}...`)

    // Verifica dati necessari
    if (!match.home_team?.name || !match.away_team?.name) {
      const error = `Missing team data: home_team=${JSON.stringify(match.home_team)}, away_team=${JSON.stringify(match.away_team)}`
      console.error(`❌ ${error}`)
      return { analysis: null, error }
    }

    const prompt = `Sei un analista esperto di calcio con 20 anni di esperienza. Analizza questa partita in modo DETTAGLIATO e PROFESSIONALE.

DATI PARTITA:
- Partita: ${match.home_team.name} vs ${match.away_team.name}
- Campionato: ${match.league_name}
- Data: ${match.match_date} alle ${match.match_time}
- Stadio: ${match.venue?.name}, ${match.venue?.city}

ODDS REALI DISPONIBILI:
${JSON.stringify(match.odds, null, 2)}

PREDICTIONS API-FOOTBALL:
${JSON.stringify(match.predictions, null, 2)}

GENERA un'analisi COMPLETA e PROFESSIONALE in formato JSON seguendo ESATTAMENTE questa struttura:

{
  "overall_prediction": {
    "recommended_bet": "La migliore scommessa consigliata (es: 1X, Over 2.5, BTTS Yes)",
    "confidence": 78,
    "reasoning": "Spiegazione dettagliata della previsione principale basata su tattica, forma, statistiche e analisi completa"
  },
  "tactical_analysis": {
    "formation_prediction": "Formazioni previste e come si confronteranno tatticamente sul campo",
    "key_battles": ["Duello chiave centrocampo", "Battaglia sulle fasce", "Scontro tra difesa e attacco"],
    "tactical_advantage": "Quale squadra ha il vantaggio tattico e perché in dettaglio"
  },
  "statistical_insights": {
    "form_analysis": "Analisi dettagliata della forma recente di entrambe le squadre negli ultimi 5-10 match",
    "h2h_record": "Storico degli scontri diretti, tendenze, risultati precedenti e pattern ricorrenti",
    "scoring_trends": "Tendenze gol, media reti, efficacia difensiva, rendimento in casa/trasferta di entrambe"
  },
  "betting_recommendations": {
    "primary_bet": {
      "market": "1X2",
      "selection": "1X",
      "odds": 1.45,
      "confidence": 85,
      "reasoning": "Spiegazione dettagliata del perché questa è la scommessa principale raccomandata"
    },
    "secondary_bet": {
      "market": "Over/Under",
      "selection": "Over 2.5",
      "odds": 2.1,
      "confidence": 72,
      "reasoning": "Spiegazione della scommessa secondaria e perché ha valore"
    },
    "value_bets": [
      {
        "market": "BTTS",
        "selection": "Yes",
        "odds": 1.8,
        "value_rating": 88,
        "reasoning": "Perché questa scommessa offre valore superiore alle odds indicate"
      },
      {
        "market": "Risultato Esatto",
        "selection": "2-1",
        "odds": 8.5,
        "value_rating": 75,
        "reasoning": "Analisi del perché questo risultato è probabile"
      }
    ]
  },
  "risk_factors": [
    "Giocatori chiave squalificati o infortunati",
    "Condizioni meteo avverse previste",
    "Pressione psicologica o situazione di classifica",
    "Fattori esterni che potrebbero influenzare l'esito"
  ],
  "final_score_prediction": "2-1"
}

IMPORTANTE:
- Usa SEMPRE le quote REALI fornite nei dati
- Basa tutto su analisi CONCRETE e PROFESSIONAL
- Sii specifico nelle spiegazioni
- La confidenza deve essere realistica (60-90%)
- Include SEMPRE almeno 3 value bets
- Ogni reasoning deve essere dettagliato e professionale
- Analizza tattiche, forma, statistiche H2H, condizioni di gioco`

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
    
    const completeAnalysis: CompleteMatchAnalysis = {
      fixture_id: match.fixture_id,
      match_date: match.match_date,
      home_team: match.home_team.name,
      away_team: match.away_team.name,
      league: match.league_name,
      analysis,
      confidence_score: analysis.overall_prediction.confidence || 70,
      created_at: new Date().toISOString()
    }
    
    console.log(`✅ COMPLETE analysis generated for ${match.home_team.name} vs ${match.away_team.name}`)
    return { analysis: completeAnalysis }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`❌ Error generating COMPLETE analysis for match ${match.fixture_id}:`, errorMessage)
    return { analysis: null, error: errorMessage }
  }
}

// Genera analisi per tutte le partite di oggi
export async function generateTodayCompleteAnalyses() {
  console.log('🤖 Starting COMPLETE match analysis generation...')
  
  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)
  
  // Fetch matches senza analisi
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
    // Check se esiste già analisi
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
    
    // Genera analisi
    const result = await generateCompleteAnalysis(match)

    if (result.analysis) {
      // Salva nel database
      const { error: saveError } = await supabase
        .from('match_analyses')
        .upsert(result.analysis, { onConflict: 'fixture_id' })

      if (saveError) {
        console.error(`❌ Error saving analysis for match ${match.fixture_id}:`, saveError)
        results.push({
          fixture_id: match.fixture_id,
          teams: `${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}`,
          status: 'error',
          error: saveError.message
        })
      } else {
        console.log(`✅ Saved COMPLETE analysis for ${match.home_team.name} vs ${match.away_team.name}`)
        results.push({
          fixture_id: match.fixture_id,
          teams: `${match.home_team.name} vs ${match.away_team.name}`,
          status: 'success',
          confidence: result.analysis.confidence_score
        })
      }
    } else {
      results.push({
        fixture_id: match.fixture_id,
        teams: `${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}`,
        status: 'failed',
        error: result.error || 'Failed to generate analysis'
      })
    }
    
    // Rate limiting per OpenAI
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  const successful = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length
  
  console.log(`🏁 COMPLETE analysis generation completed: ${successful} successful, ${failed} failed`)
  
  return {
    success: true,
    total: matches.length,
    successful,
    failed,
    results
  }
}

// Get analisi per match specifico
export async function getCompleteMatchAnalysis(fixtureId: number) {
  const { data, error } = await supabase
    .from('match_analyses')
    .select('*')
    .eq('fixture_id', fixtureId)
    .single()
  
  if (error) {
    console.error('Error fetching COMPLETE match analysis:', error)
    return null
  }
  
  return data
}