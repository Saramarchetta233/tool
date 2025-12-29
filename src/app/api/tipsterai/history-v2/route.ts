import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  // Prendi tips passati (non di oggi) da tutte le 5 tabelle
  const [singola, doppia, tripla, mista, bomba] = await Promise.all([
    supabase.from('tips_singola').select('*').lt('valid_until', today).order('valid_until', { ascending: false }).limit(10),
    supabase.from('tips_doppia').select('*').lt('valid_until', today).order('valid_until', { ascending: false }).limit(10),
    supabase.from('tips_tripla').select('*').lt('valid_until', today).order('valid_until', { ascending: false }).limit(10),
    supabase.from('tips_mista').select('*').lt('valid_until', today).order('valid_until', { ascending: false }).limit(10),
    supabase.from('tips_bomba').select('*').lt('valid_until', today).order('valid_until', { ascending: false }).limit(10)
  ])
  
  // Combina tutti i tips
  const allHistoryTips: any[] = []
  
  // Singola
  if (singola.data) {
    singola.data.forEach(s => {
      allHistoryTips.push({
        id: `singola_${s.id}`,
        type: 'singola',
        matches: [{
          fixture_id: s.fixture_id,
          match: `${s.home_team} vs ${s.away_team}`,
          league: s.league,
          prediction: s.prediction,
          prediction_label: s.prediction_label,
          odds: s.odds,
          confidence: s.confidence,
          reasoning: s.reasoning
        }],
        total_odds: s.odds,
        result: s.result,
        confidence: s.confidence,
        created_at: s.created_at,
        valid_until: s.valid_until
      })
    })
  }
  
  // Doppia
  if (doppia.data) {
    doppia.data.forEach(d => {
      allHistoryTips.push({
        id: `doppia_${d.id}`,
        type: 'doppia',
        matches: d.matches.map((m: any) => ({
          fixture_id: m.fixture_id,
          match: `${m.home_team} vs ${m.away_team}`,
          league: m.league,
          prediction: m.prediction,
          prediction_label: m.prediction_label,
          odds: m.odds,
          confidence: m.confidence,
          reasoning: m.reasoning
        })),
        total_odds: d.total_odds,
        result: d.result,
        confidence: d.confidence,
        created_at: d.created_at,
        valid_until: d.valid_until
      })
    })
  }
  
  // Tripla
  if (tripla.data) {
    tripla.data.forEach(t => {
      allHistoryTips.push({
        id: `tripla_${t.id}`,
        type: 'tripla',
        matches: t.matches.map((m: any) => ({
          fixture_id: m.fixture_id,
          match: `${m.home_team} vs ${m.away_team}`,
          league: m.league,
          prediction: m.prediction,
          prediction_label: m.prediction_label,
          odds: m.odds,
          confidence: m.confidence,
          reasoning: m.reasoning
        })),
        total_odds: t.total_odds,
        result: t.result,
        confidence: t.confidence,
        created_at: t.created_at,
        valid_until: t.valid_until
      })
    })
  }
  
  // Mista
  if (mista.data) {
    mista.data.forEach(m => {
      allHistoryTips.push({
        id: `mista_${m.id}`,
        type: 'mista',
        matches: m.matches.map((match: any) => ({
          fixture_id: match.fixture_id,
          match: `${match.home_team} vs ${match.away_team}`,
          league: match.league,
          prediction: match.prediction,
          prediction_label: match.prediction_label,
          odds: match.odds,
          confidence: match.confidence,
          reasoning: match.reasoning
        })),
        total_odds: m.total_odds,
        result: m.result,
        confidence: m.confidence,
        created_at: m.created_at,
        valid_until: m.valid_until
      })
    })
  }
  
  // Bomba
  if (bomba.data) {
    bomba.data.forEach(b => {
      allHistoryTips.push({
        id: `bomba_${b.id}`,
        type: 'bomba',
        matches: b.matches.map((m: any) => ({
          fixture_id: m.fixture_id,
          match: `${m.home_team} vs ${m.away_team}`,
          league: m.league,
          prediction: m.prediction,
          prediction_label: m.prediction_label,
          odds: m.odds,
          confidence: m.confidence,
          reasoning: m.reasoning
        })),
        total_odds: b.total_odds,
        result: b.result,
        confidence: b.confidence,
        created_at: b.created_at,
        valid_until: b.valid_until,
        tip_type: b.tip_type
      })
    })
  }
  
  // Ordina per data
  allHistoryTips.sort((a, b) => new Date(b.valid_until).getTime() - new Date(a.valid_until).getTime())
  
  // Calcola statistiche
  const stats = {
    singola: { won: 0, lost: 0, pending: 0 },
    doppia: { won: 0, lost: 0, pending: 0 },
    tripla: { won: 0, lost: 0, pending: 0 },
    mista: { won: 0, lost: 0, pending: 0 },
    bomba: { won: 0, lost: 0, pending: 0 }
  }
  
  allHistoryTips.forEach(tip => {
    const type = tip.type as keyof typeof stats
    if (stats[type]) {
      if (tip.result === 'won') stats[type].won++
      else if (tip.result === 'lost') stats[type].lost++
      else stats[type].pending++
    }
  })

  // Calcola percentuali
  const formattedStats = {
    singole: {
      total: stats.singola.won + stats.singola.lost + stats.singola.pending,
      won: stats.singola.won,
      percentage: calculatePercentage(stats.singola.won, stats.singola.won + stats.singola.lost)
    },
    doppie: {
      total: stats.doppia.won + stats.doppia.lost + stats.doppia.pending,
      won: stats.doppia.won,
      percentage: calculatePercentage(stats.doppia.won, stats.doppia.won + stats.doppia.lost)
    },
    triple: {
      total: stats.tripla.won + stats.tripla.lost + stats.tripla.pending,
      won: stats.tripla.won,
      percentage: calculatePercentage(stats.tripla.won, stats.tripla.won + stats.tripla.lost)
    },
    miste: {
      total: stats.mista.won + stats.mista.lost + stats.mista.pending,
      won: stats.mista.won,
      percentage: calculatePercentage(stats.mista.won, stats.mista.won + stats.mista.lost)
    },
    bombe: {
      total: stats.bomba.won + stats.bomba.lost + stats.bomba.pending,
      won: stats.bomba.won,
      percentage: calculatePercentage(stats.bomba.won, stats.bomba.won + stats.bomba.lost)
    }
  }

  return NextResponse.json({
    history: allHistoryTips,
    tips: allHistoryTips, // Legacy
    stats: formattedStats
  })
}

function calculatePercentage(won: number, total: number): number {
  return total > 0 ? Math.round((won / total) * 100) : 0
}