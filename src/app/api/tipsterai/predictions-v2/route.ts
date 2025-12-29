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
  
  // Leggi dalle 5 tabelle separate (RIPRISTINATO)
  const [singola, doppia, tripla, mista, bomba] = await Promise.all([
    supabase.from('tips_singola').select('*').eq('valid_until', today).single(),
    supabase.from('tips_doppia').select('*').eq('valid_until', today).single(),
    supabase.from('tips_tripla').select('*').eq('valid_until', today).single(),
    supabase.from('tips_mista').select('*').eq('valid_until', today).single(),
    supabase.from('tips_bomba').select('*').eq('valid_until', today).single()
  ])
  
  // Costruisci array di tips disponibili
  const tips = []
  
  // SINGOLA (struttura originale ripristinata)
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
      result: 'pending',
      validUntil: singola.data.valid_until
    })
  }
  
  // DOPPIA (struttura originale ripristinata)
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
      result: 'pending',
      validUntil: doppia.data.valid_until
    })
  }
  
  // TRIPLA (struttura originale ripristinata)
  if (tripla.data) {
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
      result: 'pending',
      validUntil: tripla.data.valid_until
    })
  }
  
  // MISTA (struttura originale ripristinata)
  if (mista.data) {
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
      result: 'pending',
      validUntil: mista.data.valid_until
    })
  }
  
  // BOMBA (struttura originale ripristinata)
  if (bomba.data) {
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
      result: 'pending',
      validUntil: bomba.data.valid_until,
      tip_type: bomba.data.tip_type || 'risultati_esatti'
    })
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
        singola: singola.data ? 'found' : 'missing',
        doppia: doppia.data ? 'found' : 'missing',
        tripla: tripla.data ? 'found' : 'missing',
        mista: mista.data ? 'found' : 'missing',
        bomba: bomba.data ? 'found' : 'missing'
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