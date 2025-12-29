import { NextRequest, NextResponse } from 'next/server'
import { syncTodayMatches } from '@/lib/football-data-sync'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = request.nextUrl.searchParams.get('secret')
  
  // Check authentication
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('🔄 Starting match data sync...')
  
  try {
    const results = await syncTodayMatches()
    
    const totalMatches = results.reduce((sum, r) => sum + r.fixtures, 0)
    const successfulLeagues = results.filter(r => r.success).length
    
    console.log(`✅ Sync completed: ${totalMatches} matches from ${successfulLeagues} leagues`)
    
    return NextResponse.json({
      success: true,
      message: `Synced ${totalMatches} matches from ${successfulLeagues} leagues`,
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Match sync failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}