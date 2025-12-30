import { NextRequest, NextResponse } from 'next/server'
import { syncCompleteMatchesForDate } from '@/lib/football-api-complete'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const executionStart = Date.now()
  const timestamp = new Date()
  
  // Enhanced timezone and execution logging
  const timeInfo = {
    utc: timestamp.toISOString(),
    italy: new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(timestamp),
    utcHour: timestamp.getUTCHours(),
    utcMinute: timestamp.getUTCMinutes(),
    expectedSchedule: '00:01 UTC (01:01/02:01 Italy time)'
  }
  
  console.log('🕐 CRON sync-week called')
  console.log('⏰ Execution timing:', timeInfo)
  
  // Enhanced request logging
  const requestInfo = {
    userAgent: request.headers.get('user-agent') || 'Unknown',
    vercelCron: request.headers.get('x-vercel-cron') || 'Not present',
    vercelRegion: request.headers.get('x-vercel-deployment-url') || 'Unknown',
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  }
  
  console.log('📡 Request context:', requestInfo)
  
  const cronSecret = request.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET
  
  // Enhanced secret logging
  console.log('🔐 CRON Secret validation:', {
    hasSecret: !!cronSecret,
    hasExpectedSecret: !!expectedSecret,
    secretLength: cronSecret?.length || 0,
    expectedLength: expectedSecret?.length || 0,
    secretPreview: cronSecret ? `${cronSecret.substring(0, 4)}...${cronSecret.substring(cronSecret.length - 4)}` : 'None',
    isScheduledExecution: timeInfo.utcHour === 0 && timeInfo.utcMinute <= 5
  })
  
  if (!expectedSecret) {
    console.error('❌ CRON_SECRET not configured in environment variables!')
    return NextResponse.json({ 
      error: 'Server configuration error', 
      message: 'CRON_SECRET not set'
    }, { status: 500 })
  }
  
  if (cronSecret !== expectedSecret) {
    console.error('❌ CRON authentication failed')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('🔄 Starting WEEKLY sync from cron...')
  
  try {
    // Sincronizza direttamente i prossimi 7 giorni
    const results = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + i)
      const dateStr = targetDate.toISOString().split('T')[0]
      
      console.log(`📅 CRON syncing ${dateStr}...`)
      
      try {
        const dayResults = await syncCompleteMatchesForDate(dateStr)
        results.push({
          date: dateStr,
          matches: dayResults.reduce((sum, r) => sum + r.fixtures, 0)
        })
        
        // Pausa tra le chiamate
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`❌ Error syncing ${dateStr}:`, error)
        results.push({
          date: dateStr,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    const totalMatches = results.reduce((sum, r) => sum + (r.matches || 0), 0)
    
    const executionTime = Date.now() - executionStart
    console.log(`✅ WEEKLY sync completed via cron: ${data.message}`)
    console.log(`⚡ Total execution time: ${executionTime}ms`)
    
    return NextResponse.json({
      success: true,
      message: `CRON sync completato: ${totalMatches} partite per 7 giorni`,
      results,
      totalMatches,
      executionTime: `${executionTime}ms`,
      timing: timeInfo,
      context: requestInfo,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const executionTime = Date.now() - executionStart
    console.error('❌ WEEKLY cron sync failed:', error)
    console.log(`⚡ Failed execution time: ${executionTime}ms`)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: `${executionTime}ms`,
      timing: timeInfo,
      context: requestInfo,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}