import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)
  
  console.log(`📊 Fetching TipsterAI V2 tips for ${today}...`)
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  // Leggi da tutte e 5 le tabelle
  const [singola, doppia, tripla, mista, bomba] = await Promise.all([
    supabase.from('tips_singola').select('*').eq('valid_until', today).single(),
    supabase.from('tips_doppia').select('*').eq('valid_until', today).single(),
    supabase.from('tips_tripla').select('*').eq('valid_until', today).single(),
    supabase.from('tips_mista').select('*').eq('valid_until', today).single(),
    supabase.from('tips_bomba').select('*').eq('valid_until', today).single()
  ])
  
  // Costruisci array di tips disponibili
  const tips = []
  
  // SINGOLA
  if (singola.data) {
    tips.push({
      type: 'singola',
      matches: [{
        fixture_id: singola.data.fixture_id,
        match: `${singola.data.home_team} vs ${singola.data.away_team}`,
        league: singola.data.league,
        time: singola.data.match_time,
        prediction: singola.data.prediction,
        prediction_label: singola.data.prediction_label,
        odds: singola.data.odds,
        confidence: singola.data.confidence,
        reasoning: singola.data.reasoning
      }],
      total_odds: singola.data.odds,
      potential_multiplier: `${singola.data.odds}x`,
      description: 'La selezione più sicura del giorno con quota interessante',
      strategy_reasoning: singola.data.reasoning,
      confidence: singola.data.confidence,
      result: singola.data.result,
      validUntil: singola.data.valid_until
    })
  }
  
  // DOPPIA
  if (doppia.data) {
    tips.push({
      type: 'doppia',
      matches: doppia.data.matches.map((m: any) => ({
        fixture_id: m.fixture_id,
        match: `${m.home_team} vs ${m.away_team}`,
        league: m.league,
        time: m.time,
        prediction: m.prediction || '1X2',
        prediction_label: m.prediction_label || m.prediction || '1X2',
        odds: m.odds || 1.50,
        confidence: m.confidence || 50,
        reasoning: m.reasoning || ''
      })),
      total_odds: doppia.data.total_odds,
      potential_multiplier: `${doppia.data.total_odds}x`,
      description: 'Due partite solide combinate per raddoppiare la puntata',
      strategy_reasoning: doppia.data.strategy_reasoning,
      confidence: doppia.data.confidence,
      result: doppia.data.result,
      validUntil: doppia.data.valid_until
    })
  }
  
  // TRIPLA
  if (tripla.data) {
    // Se tripla ha la struttura corretta con prediction
    if (tripla.data.matches && tripla.data.matches[0] && tripla.data.matches[0].prediction) {
      tips.push({
        type: 'tripla',
        matches: tripla.data.matches.map((m: any) => ({
          fixture_id: m.fixture_id,
          match: `${m.home_team} vs ${m.away_team}`,
          league: m.league,
          time: m.time,
          prediction: m.prediction,
          prediction_label: m.prediction_label,
          odds: m.odds,
          confidence: m.confidence,
          reasoning: m.reasoning
        })),
        total_odds: tripla.data.total_odds,
        potential_multiplier: `${tripla.data.total_odds}x`,
        description: 'Tre partite ragionate per un moltiplicatore interessante',
        strategy_reasoning: tripla.data.strategy_reasoning,
        confidence: tripla.data.confidence,
        result: tripla.data.result,
        validUntil: tripla.data.valid_until
      })
    } else {
      // Fallback per struttura vecchia - genera predictions basate su API advice
      const triplMatches = tripla.data.matches.map((m: any) => {
        let prediction = '1X2'
        let prediction_label = '1X2'
        let selectedOdds = 1.50
        let confidence = 50
        
        // Usa API prediction advice per decidere
        if (m.api_prediction && m.api_prediction.advice) {
          if (m.api_prediction.advice.includes(m.home_team)) {
            prediction = '1'
            prediction_label = m.home_team.toUpperCase() + ' VINCE'
            selectedOdds = m.odds.home || 1.50
            confidence = m.api_prediction.home_percent || 50
          } else if (m.api_prediction.advice.includes('draw')) {
            prediction = '1X'
            prediction_label = m.home_team.toUpperCase() + ' NON PERDE'
            selectedOdds = m.odds.home_draw || 1.30
            confidence = 70
          } else {
            prediction = 'Over 2.5'
            prediction_label = 'ALMENO 3 GOL'
            selectedOdds = m.odds.over_2_5 || 1.80
            confidence = 60
          }
        }
        
        return {
          fixture_id: m.fixture_id,
          match: `${m.home_team} vs ${m.away_team}`,
          league: m.league,
          time: m.time,
          prediction,
          prediction_label,
          odds: selectedOdds,
          confidence,
          reasoning: `Basato su ${m.api_prediction?.advice?.toLowerCase() || 'analisi statistica'}. ${m.api_prediction?.confidence === 'ALTA' ? 'Fiducia elevata' : 'Probabilità buona'} per questa scelta equilibrata.`
        }
      })
      
      tips.push({
        type: 'tripla',
        matches: triplMatches,
        total_odds: tripla.data.total_odds,
        potential_multiplier: `${tripla.data.total_odds}x`,
        description: 'Tre partite ragionate per un moltiplicatore interessante',
        strategy_reasoning: tripla.data.strategy_reasoning,
        confidence: tripla.data.confidence,
        result: tripla.data.result,
        validUntil: tripla.data.valid_until
      })
    }
  }
  
  // MISTA
  if (mista.data) {
    // Se mista ha la struttura corretta con prediction
    if (mista.data.matches && mista.data.matches[0] && mista.data.matches[0].prediction) {
      tips.push({
        type: 'mista',
        matches: mista.data.matches.map((m: any) => ({
          fixture_id: m.fixture_id,
          match: `${m.home_team} vs ${m.away_team}`,
          league: m.league,
          time: m.time,
          prediction: m.prediction,
          prediction_label: m.prediction_label,
          odds: m.odds,
          confidence: m.confidence,
          reasoning: m.reasoning
        })),
        total_odds: mista.data.total_odds,
        potential_multiplier: `${mista.data.total_odds}x`,
        description: 'Schedina con molte partite per puntate piccole e grandi vincite',
        strategy_reasoning: mista.data.strategy_reasoning,
        confidence: mista.data.confidence,
        result: mista.data.result,
        validUntil: mista.data.valid_until
      })
    } else {
      // Fallback per struttura vecchia - selezioni conservative
      const mistaMatches = mista.data.matches.map((m: any) => {
        let prediction = '1X'
        let prediction_label = m.home_team.toUpperCase() + ' NON PERDE'
        let selectedOdds = m.odds.home_draw || 1.30
        
        // Per favoriti assoluti
        if (m.odds.home && m.odds.home < 1.40) {
          prediction = '1'
          prediction_label = m.home_team.toUpperCase() + ' VINCE'
          selectedOdds = m.odds.home
        }
        // Per partite equilibrate usa Under
        else if (m.odds.under_3_5 && m.odds.under_3_5 < 1.35) {
          prediction = 'Under 3.5'
          prediction_label = 'MENO DI 4 GOL'
          selectedOdds = m.odds.under_3_5
        }
        
        return {
          fixture_id: m.fixture_id,
          match: `${m.home_team} vs ${m.away_team}`,
          league: m.league,
          time: m.time,
          prediction,
          prediction_label,
          odds: selectedOdds,
          confidence: 75,
          reasoning: `${m.home_team} ${selectedOdds < 1.50 ? 'è nettamente favorito con' : 'ha buone chance con'} quota ${selectedOdds.toFixed(2)}. ${prediction.includes('Under') ? 'Partita che si preannuncia bloccata' : 'Scelta sicura per accumulare moltiplicatore'}.`
        }
      })
      
      tips.push({
        type: 'mista',
        matches: mistaMatches,
        total_odds: mista.data.total_odds,
        potential_multiplier: `${mista.data.total_odds}x`,
        description: 'Schedina con molte partite per puntate piccole e grandi vincite',
        strategy_reasoning: mista.data.strategy_reasoning,
        confidence: mista.data.confidence,
        result: mista.data.result,
        validUntil: mista.data.valid_until
      })
    }
  }
  
  // BOMBA
  if (bomba.data) {
    // Se bomba ha la struttura corretta con prediction
    if (bomba.data.matches && bomba.data.matches[0] && bomba.data.matches[0].prediction) {
      tips.push({
        type: 'bomba',
        matches: bomba.data.matches.map((m: any) => ({
          fixture_id: m.fixture_id,
          match: `${m.home_team} vs ${m.away_team}`,
          league: m.league,
          time: m.time,
          prediction: m.prediction,
          prediction_label: m.prediction_label,
          odds: m.odds,
          confidence: m.confidence,
          reasoning: m.reasoning
        })),
        total_odds: bomba.data.total_odds,
        potential_multiplier: `${bomba.data.total_odds}x`,
        description: 'Alto rischio, altissimo reward - solo per i più coraggiosi!',
        strategy_reasoning: bomba.data.strategy_reasoning,
        confidence: bomba.data.confidence,
        result: bomba.data.result,
        validUntil: bomba.data.valid_until,
        tip_type: bomba.data.tip_type
      })
    } else {
      // Fallback per struttura vecchia - usa risultati esatti
      const bombaMatches = bomba.data.matches.slice(0, 3).map((m: any) => ({
        fixture_id: m.fixture_id,
        match: `${m.home_team} vs ${m.away_team}`,
        league: m.league || 'Serie A',
        time: m.time || '15:00',
        prediction: m.predicted_score || '2-1',
        prediction_label: `RISULTATO ESATTO ${m.predicted_score || '2-1'}`,
        odds: m.odds || 8.0,
        confidence: 15,
        reasoning: 'Risultato esatto basato su pattern storici'
      }))
      
      tips.push({
        type: 'bomba',
        matches: bombaMatches,
        total_odds: bomba.data.total_odds,
        potential_multiplier: `${bomba.data.total_odds}x`,
        description: 'Alto rischio, altissimo reward - solo per i più coraggiosi!',
        strategy_reasoning: bomba.data.strategy_reasoning,
        confidence: bomba.data.confidence,
        result: bomba.data.result,
        validUntil: bomba.data.valid_until,
        tip_type: bomba.data.tip_type
      })
    }
  }
  
  // Se non ci sono tips
  if (tips.length === 0) {
    return NextResponse.json({
      predictions: [],
      tips: [],
      noMatchesMessage: true,
      message: 'Nessuna proposta per oggi, torna domani!',
      debug: { 
        today, 
        currentTime,
        singola: singola.error?.message || 'no data',
        doppia: doppia.error?.message || 'no data',
        tripla: tripla.error?.message || 'no data',
        mista: mista.error?.message || 'no data',
        bomba: bomba.error?.message || 'no data'
      }
    })
  }
  
  // Ordina: Singola, Doppia, Tripla, Mista, Bomba
  const tipOrder = ['singola', 'doppia', 'tripla', 'mista', 'bomba']
  const sortedTips = tips.sort((a, b) => {
    const indexA = tipOrder.indexOf(a.type)
    const indexB = tipOrder.indexOf(b.type)
    return indexA - indexB
  })
  
  return NextResponse.json({
    tips: sortedTips,
    predictions: sortedTips, // Legacy compatibility
    date: today,
    generated_at: new Date().toISOString(),
    debug: {
      tipsCount: tips.length,
      currentTime,
      hasSingola: !!singola.data,
      hasDoppia: !!doppia.data,
      hasTripla: !!tripla.data,
      hasMista: !!mista.data,
      hasBomba: !!bomba.data
    }
  })
}