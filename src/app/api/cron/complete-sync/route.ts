import { NextRequest, NextResponse } from 'next/server'
import { syncTodayComplete } from '@/lib/football-api-complete'

export async function GET(request: NextRequest) {
  const cronSecret = request.nextUrl.searchParams.get('secret')
  
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('🔄 Starting COMPLETE daily sync...')
  
  try {
    const results = await syncTodayComplete()
    
    const totalMatches = results.reduce((sum, r) => sum + r.fixtures, 0)
    const successfulLeagues = results.filter(r => r.success).length
    
    console.log(`✅ COMPLETE sync completed: ${totalMatches} matches from ${successfulLeagues} leagues`)
    
    return NextResponse.json({
      success: true,
      message: `COMPLETE sync: ${totalMatches} matches from ${successfulLeagues} leagues`,
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ COMPLETE sync failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}