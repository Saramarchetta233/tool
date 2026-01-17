import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateDailyTips } from '@/lib/tipster-ai'

export const dynamic = 'force-dynamic'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  // Prova a prendere tips esistenti
  const { data: existing } = await supabaseAdmin
    .from('daily_tips')
    .select('tips, created_at')
    .eq('date', today)
    .single()
  
  if (existing?.tips) {
    console.log('✅ Returning cached tips for', today)
    return NextResponse.json({
      tips: existing.tips,
      predictions: formatForLegacyFrontend(existing.tips),
      date: today,
      cached: true
    })
  }
  
  // Se non esistono, genera nuovi tips
  console.log('📊 Generating new tips for', today)
  const result = await generateDailyTips()
  
  if (result.success) {
    return NextResponse.json({
      tips: result.tips,
      predictions: formatForLegacyFrontend(result.tips),
      date: today,
      cached: false
    })
  } else {
    return NextResponse.json({
      error: result.message,
      tips: null,
      predictions: []
    }, { status: 500 })
  }
}

// Formatta per compatibilità con il frontend esistente
function formatForLegacyFrontend(tips: any) {
  if (!tips) return []
  
  const formatted = []
  
  // Singola
  if (tips.singola) {
    formatted.push({
      type: 'singola',
      matches: [tips.singola.match ? {
        fixture_id: tips.singola.match.fixture_id,
        match: `${tips.singola.match.home_team} vs ${tips.singola.match.away_team}`,
        league: tips.singola.match.league,
        prediction: tips.singola.prediction,
        odds: tips.singola.odds,
        confidence: tips.singola.confidence,
        reasoning: tips.singola.reasoning
      } : null].filter(Boolean),
      total_odds: tips.singola.odds,
      description: 'La selezione più sicura del giorno',
      strategy_reasoning: tips.singola.reasoning,
      confidence: tips.singola.confidence
    })
  }
  
  // Doppia
  if (tips.doppia) {
    formatted.push({
      type: 'doppia', 
      matches: tips.doppia.matches?.map((m: any) => ({
        fixture_id: m.fixture_id,
        match: `${m.home_team} vs ${m.away_team}`,
        league: m.league,
        prediction: m.prediction,
        odds: m.odds,
        reasoning: m.reasoning
      })) || [],
      total_odds: tips.doppia.total_odds,
      description: 'Due partite solide combinate',
      strategy_reasoning: tips.doppia.strategy,
      confidence: tips.doppia.confidence
    })
  }
  
  // Tripla, Mista, Bomba (se presenti)
  ['tripla', 'mista', 'bomba'].forEach(type => {
    if (tips[type]) {
      formatted.push({
        type,
        matches: tips[type].matches?.map((m: any) => ({
          fixture_id: m.fixture_id,
          match: `${m.home_team} vs ${m.away_team}`,
          league: m.league || '',
          prediction: m.prediction,
          odds: m.odds,
          reasoning: m.reasoning
        })) || [],
        total_odds: tips[type].total_odds,
        description: getTypeDescription(type),
        strategy_reasoning: tips[type].strategy,
        confidence: tips[type].confidence
      })
    }
  })
  
  return formatted
}

function getTypeDescription(tipType: string): string {
  switch (tipType) {
    case 'singola':
      return 'La selezione più sicura del giorno con quota interessante'
    case 'doppia':  
      return 'Due partite solide combinate per raddoppiare la puntata'
    case 'tripla':
      return 'Tre partite ragionate per un moltiplicatore interessante'
    case 'mista':
      return 'Schedina con molte partite per puntate piccole e grandi vincite'
    case 'bomba':
      return 'Alto rischio, altissimo reward - solo per i più coraggiosi!'
    default:
      return 'Selezione TipsterAI'
  }
}