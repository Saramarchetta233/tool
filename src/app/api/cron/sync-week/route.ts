import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🕐 CRON sync-week called at', new Date().toISOString())
  
  const cronSecret = request.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET
  
  // Log per debug
  console.log('CRON Secret check:', {
    hasSecret: !!cronSecret,
    hasExpectedSecret: !!expectedSecret,
    secretLength: cronSecret?.length || 0,
    expectedLength: expectedSecret?.length || 0
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
    // Chiama l'endpoint interno per il sync settimanale
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/matches/sync-week`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Sync week failed: ${data.error || response.statusText}`)
    }
    
    console.log(`✅ WEEKLY sync completed via cron: ${data.message}`)
    
    return NextResponse.json({
      success: true,
      message: `WEEKLY cron sync: ${data.message}`,
      data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ WEEKLY cron sync failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}