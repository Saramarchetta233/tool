import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || ''
    const groupBy = searchParams.get('groupBy') || 'date'
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )
    
    // Query base
    let query = supabase
      .from('matches')
      .select('*')
      .gte('match_date', startDate)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true })
    
    if (endDate) {
      query = query.lte('match_date', endDate)
    }
    
    const { data: matches, error } = await query
    
    if (error) throw error
    
    // Analisi per data
    const byDate: Record<string, any[]> = {}
    const byLeague: Record<string, any[]> = {}
    
    matches?.forEach(match => {
      // Per data
      if (!byDate[match.match_date]) {
        byDate[match.match_date] = []
      }
      byDate[match.match_date].push({
        time: match.match_time,
        teams: `${match.home_team?.name || 'TBD'} vs ${match.away_team?.name || 'TBD'}`,
        league: match.league_name,
        hasOdds: !!match.odds,
        hasPredictions: !!match.predictions
      })
      
      // Per lega
      if (!byLeague[match.league_name]) {
        byLeague[match.league_name] = []
      }
      byLeague[match.league_name].push({
        date: match.match_date,
        time: match.match_time,
        teams: `${match.home_team?.name || 'TBD'} vs ${match.away_team?.name || 'TBD'}`
      })
    })
    
    // Identifica date mancanti
    const missingDates: string[] = []
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (!byDate[dateStr]) {
        const dayName = d.toLocaleDateString('it-IT', { weekday: 'long' })
        missingDates.push(`${dateStr} (${dayName})`)
      }
    }
    
    // Statistiche
    const stats = {
      totalMatches: matches?.length || 0,
      uniqueDates: Object.keys(byDate).length,
      uniqueLeagues: Object.keys(byLeague).length,
      matchesWithOdds: matches?.filter(m => m.odds).length || 0,
      matchesWithPredictions: matches?.filter(m => m.predictions).length || 0
    }
    
    // Suggerimenti
    const suggestions: string[] = []
    
    if (missingDates.length > 0) {
      suggestions.push(`Mancano partite per ${missingDates.length} giorni. Esegui sync-week per recuperarle.`)
    }
    
    if (stats.matchesWithOdds < stats.totalMatches * 0.5) {
      suggestions.push('Molte partite non hanno quote. Potrebbe essere necessario un sync completo.')
    }
    
    const result = {
      success: true,
      dateRange: { from: startDate, to: endDate || 'next 7 days' },
      stats,
      missingDates,
      suggestions: suggestions.length > 0 ? suggestions : ['Database sembra completo'],
      data: groupBy === 'date' ? byDate : byLeague,
      rawMatchCount: matches?.length || 0
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error in debug-db:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}