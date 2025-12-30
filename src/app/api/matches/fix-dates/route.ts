import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncCompleteMatchesForDate } from '@/lib/football-api-complete'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  try {
    console.log('🔧 FIX DATES: Starting comprehensive date fix...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )
    
    // Step 1: Pulisci TUTTO il database
    console.log('🗑️ Step 1: Clearing all matches...')
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .gte('fixture_id', 0) // Elimina tutto
    
    if (deleteError) {
      console.error('Error clearing matches:', deleteError)
    } else {
      console.log('✅ All matches cleared')
    }
    
    // Step 2: Sincronizza i prossimi 7 giorni correttamente
    console.log('📅 Step 2: Syncing next 7 days...')
    const results = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + i)
      const dateStr = targetDate.toISOString().split('T')[0]
      const dayName = targetDate.toLocaleDateString('it-IT', { weekday: 'long' })
      
      console.log(`📅 Syncing ${dateStr} (${dayName})...`)
      
      try {
        const dayResults = await syncCompleteMatchesForDate(dateStr)
        const totalMatches = dayResults.reduce((sum, r) => sum + r.fixtures, 0)
        
        results.push({
          date: dateStr,
          dayName,
          success: true,
          matches: totalMatches,
          leagues: dayResults.map(r => ({
            league: r.league,
            count: r.fixtures
          }))
        })
        
        console.log(`✅ ${dateStr}: ${totalMatches} matches synced`)
        
        // Pausa per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500))
        
      } catch (error) {
        console.error(`❌ Error syncing ${dateStr}:`, error)
        results.push({
          date: dateStr,
          dayName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          matches: 0
        })
      }
    }
    
    // Step 3: Verifica domenica 4 gennaio specificamente
    const sunday4Jan = results.find(r => r.dayName === 'domenica')
    
    const totalMatches = results.reduce((sum, r) => sum + (r.matches || 0), 0)
    console.log(`🏆 Fix dates completed: ${totalMatches} total matches`)
    
    return NextResponse.json({
      success: true,
      message: `Database fixed! ${totalMatches} matches synced for next 7 days`,
      sunday4January: sunday4Jan || { status: 'NOT FOUND' },
      results,
      timestamp: new Date().toISOString(),
      nextSteps: [
        'Vai su /matches per vedere le partite',
        'Seleziona domenica per vedere le partite di domenica 4 gennaio'
      ]
    })
    
  } catch (error) {
    console.error('❌ Fix dates failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}