import { NextResponse } from 'next/server'
import { syncCompleteMatchesForDate } from '@/lib/football-api-complete'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST() {
  console.log('🔄 Starting historical sync for last 14 days...')
  
  try {
    const results = []
    const today = new Date()
    
    // Sincronizza per gli ultimi 7 giorni (incluso oggi)
    // Questo assicura che abbiamo tutti i risultati delle partite finite recenti
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() - i)
      const dateStr = targetDate.toISOString().split('T')[0]
      
      console.log(`📅 Syncing historical ${dateStr}...`)
      
      try {
        const dayResults = await syncCompleteMatchesForDate(dateStr)
        results.push({
          date: dateStr,
          results: dayResults,
          matches: dayResults.reduce((sum, r) => sum + r.fixtures, 0),
          daysAgo: i
        })
        
        console.log(`✅ ${dateStr} (${i} days ago): ${dayResults.reduce((sum, r) => sum + r.fixtures, 0)} matches`)
        
        // Pausa tra le chiamate per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`❌ Error syncing historical ${dateStr}:`, error)
        results.push({
          date: dateStr,
          error: error instanceof Error ? error.message : 'Unknown error',
          matches: 0,
          daysAgo: i
        })
      }
    }
    
    const totalMatches = results.reduce((sum, r) => sum + (r.matches || 0), 0)
    const successfulSyncs = results.filter(r => !r.error).length
    
    console.log(`🏆 Historical sync completed: ${totalMatches} total matches over 7 days`)
    console.log(`📊 Success rate: ${successfulSyncs}/7 days synced successfully`)
    
    return NextResponse.json({
      success: true,
      message: `Historical sync completed: ${totalMatches} matches over 7 days`,
      results,
      stats: {
        totalMatches,
        successfulSyncs,
        totalDays: 7
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Historical sync failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}