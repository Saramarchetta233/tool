import { NextRequest, NextResponse } from 'next/server'
import { syncTodayMatches } from '@/lib/football-data-sync'

export async function GET(request: NextRequest) {
  console.log('🧪 Manual sync trigger - fetching today\'s matches...')
  
  try {
    const results = await syncTodayMatches()
    
    const totalMatches = results.reduce((sum, r) => sum + r.fixtures, 0)
    const successfulLeagues = results.filter(r => r.success).length
    const failedLeagues = results.filter(r => !r.success)
    
    console.log(`✅ Manual sync completed: ${totalMatches} matches from ${successfulLeagues} leagues`)
    
    return NextResponse.json({
      success: true,
      message: `Manually synced ${totalMatches} matches from ${successfulLeagues} leagues`,
      details: {
        totalMatches,
        successfulLeagues,
        failedLeagues: failedLeagues.length,
        failedDetails: failedLeagues.map(l => ({ league: l.league, error: l.error }))
      },
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Manual sync failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}