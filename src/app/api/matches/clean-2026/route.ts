import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )
    
    // Prima conta quante partite del 2026 ci sono
    const { data: matches2026, error: countError } = await supabase
      .from('matches')
      .select('fixture_id, match_date, home_team, away_team')
      .gte('match_date', '2026-01-01')
    
    if (countError) throw countError
    
    console.log(`🗑️ Trovate ${matches2026?.length || 0} partite del 2026 da eliminare`)
    
    // Elimina tutte le partite del 2026
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .gte('match_date', '2026-01-01')
    
    if (deleteError) throw deleteError
    
    return NextResponse.json({
      success: true,
      message: `Eliminate ${matches2026?.length || 0} partite del 2026`,
      deletedMatches: matches2026?.length || 0,
      sampleDeleted: matches2026?.slice(0, 5).map(m => ({
        date: m.match_date,
        match: `${m.home_team?.name || 'TBD'} vs ${m.away_team?.name || 'TBD'}`
      })),
      nextStep: 'Ora esegui /api/matches/force-sync-week per scaricare le partite corrette'
    })
    
  } catch (error) {
    console.error('Error cleaning 2026 matches:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}