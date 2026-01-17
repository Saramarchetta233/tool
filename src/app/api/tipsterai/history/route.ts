import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  // Prendi tips passati (non di oggi)
  const { data: history, error } = await supabaseAdmin
    .from('tips')
    .select('*')
    .lt('valid_until', today)
    .order('valid_until', { ascending: false })
    .limit(50)
  
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }

  const allHistoryTips = history || []

  // Calcola statistiche
  const stats = {
    singola: { won: 0, lost: 0, pending: 0 },
    doppia: { won: 0, lost: 0, pending: 0 },
    tripla: { won: 0, lost: 0, pending: 0 },
    mista: { won: 0, lost: 0, pending: 0 },
    bomba: { won: 0, lost: 0, pending: 0 }
  }
  
  allHistoryTips.forEach(tip => {
    const type = tip.tip_type as keyof typeof stats
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

  // Formatta tips per frontend
  const formattedTips = allHistoryTips.map(tip => ({
    id: tip.id || `${tip.tip_type}_${tip.valid_until}`,
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
    result: tip.result || 'pending',
    confidence: tip.confidence,
    created_at: tip.created_at,
    valid_until: tip.valid_until
  }))

  return NextResponse.json({
    history: formattedTips,
    tips: formattedTips, // Legacy
    stats: formattedStats
  })
}

function calculatePercentage(won: number, total: number): number {
  return total > 0 ? Math.round((won / total) * 100) : 0
}