import { NextResponse } from 'next/server'
import { syncCompleteMatchesForDate } from '@/lib/football-api-complete'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  console.log('🔄 FORCE SYNC: Starting manual sync for next 7 days...')
  
  try {
    const results = []
    const today = new Date()
    
    // Sincronizza per i prossimi 7 giorni partendo da oggi
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + i)
      const dateStr = targetDate.toISOString().split('T')[0]
      
      console.log(`📅 Force syncing ${dateStr}...`)
      
      try {
        const dayResults = await syncCompleteMatchesForDate(dateStr)
        results.push({
          date: dateStr,
          results: dayResults,
          matches: dayResults.reduce((sum, r) => sum + r.fixtures, 0)
        })
        
        console.log(`✅ ${dateStr}: ${dayResults.reduce((sum, r) => sum + r.fixtures, 0)} matches`)
        
        // Pausa tra le chiamate per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`❌ Error syncing ${dateStr}:`, error)
        results.push({
          date: dateStr,
          error: error instanceof Error ? error.message : 'Unknown error',
          matches: 0
        })
      }
    }
    
    const totalMatches = results.reduce((sum, r) => sum + (r.matches || 0), 0)
    console.log(`🏆 Force sync completed: ${totalMatches} total matches`)
    
    return NextResponse.json({
      success: true,
      message: `Force sync completed: ${totalMatches} matches for 7 days`,
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Force sync failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}