import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)
  
  console.log(`📊 Fetching TipsterAI tips for ${today}...`)
  console.log(`⏰ Current time: ${currentTime}`)
  
  // FORCE: Create completely fresh connection with timestamp to avoid any cache
  const timestamp = Date.now()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { 
        schema: 'public'
      },
      auth: { 
        persistSession: false,
        storageKey: `supabase-${timestamp}` // Force new connection
      },
      global: {
        headers: {
          'x-cache-bust': timestamp.toString()
        }
      }
    }
  )
  
  // Prendi tips di oggi con ORDER BY id per consistency
  const { data: allTips, error } = await supabase
    .from('tips')
    .select('*')
    .order('id', { ascending: false })
  
  // Filtra manualmente per oggi
  const tips = allTips?.filter(tip => tip.valid_until === today) || []
  
  console.log(`🔍 Raw query result:`, { 
    error, 
    allTipsCount: allTips?.length || 0,
    todayTipsCount: tips?.length || 0, 
    queryToday: today,
    allTips: allTips?.map(t => ({ id: t.id, tip_type: t.tip_type, valid_until: t.valid_until, first_match: t.matches?.[0]?.match })),
    todayTips: tips?.map(t => ({ id: t.id, tip_type: t.tip_type, valid_until: t.valid_until, first_match: t.matches?.[0]?.match }))
  })
  
  if (error) {
    console.error('Error fetching tips:', error)
    return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 })
  }
  
  if (!tips || tips.length === 0) {
    console.log('❌ No tips found for today in database')
    return NextResponse.json({
      predictions: [],
      noMatchesMessage: true,
      message: 'Nessuna proposta per oggi, torna domani! Le proposte vengono generate automaticamente 2 volte al giorno.',
      debugInfo: { today, currentTime, tipsFound: tips?.length || 0 }
    })
  }
  
  console.log(`✅ Found ${tips.length} tips for today`)

  // Filtra partite già iniziate da ogni tip
  const filteredTips = tips.map(tip => {
    if (!tip.matches) return tip
    
    const activeMatches = tip.matches.filter((match: any) => {
      // Se la partita è già iniziata, escludila
      if (match.time && match.time <= currentTime) {
        return false
      }
      return true
    })
    
    // Se non ci sono più partite attive, marca come non disponibile
    if (activeMatches.length === 0) {
      return { ...tip, available: false }
    }
    
    return {
      ...tip,
      matches: activeMatches,
      available: true
    }
  }).filter(tip => tip.available !== false)

  // Ordina i tips secondo l'ordine richiesto: Singola, Doppia, Tripla, Mista, Bomba
  const tipOrder = ['singola', 'doppia', 'tripla', 'mista', 'bomba']
  const sortedTips = filteredTips.sort((a, b) => {
    const indexA = tipOrder.indexOf(a.tip_type)
    const indexB = tipOrder.indexOf(b.tip_type)
    return indexA - indexB
  })

  // Formatta per il frontend  
  const formattedPredictions = sortedTips.map(tip => {
    return {
      type: tip.tip_type,
      matches: (tip.matches || []).map((match: any) => ({
        fixture_id: match.fixture_id,
        match: match.match || `${match.home_team} vs ${match.away_team}`,
        league: match.league,
        prediction: match.prediction,
        odds: match.odds,
        confidence: match.confidence,
        reasoning: match.reasoning
      })),
      total_odds: tip.odds || tip.total_odds || 0,
      potential_multiplier: `${(tip.odds || tip.total_odds || 0).toFixed(1)}x`,
      description: getTypeDescription(tip.tip_type),
      strategy_reasoning: tip.reasoning || 'Analisi generata da TipsterAI',
      confidence: tip.confidence || 'MEDIA',
      result: tip.result || 'pending',
      validUntil: tip.valid_until,
      // Legacy per compatibilità
      totalOdds: tip.odds || tip.total_odds || 0
    }
  })

  return NextResponse.json({
    tips: formattedPredictions,
    predictions: formattedPredictions, // Legacy
    date: today,
    generated_at: tips?.[0]?.created_at,
    debug: {
      rawTipsCount: allTips?.length || 0,
      todayTipsCount: tips?.length || 0,
      filteredTipsCount: filteredTips?.length || 0,
      currentTime,
      allTipTypes: tips?.map(t => t.tip_type)
    }
  })
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