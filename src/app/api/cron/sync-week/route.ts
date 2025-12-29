import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cronSecret = request.nextUrl.searchParams.get('secret')
  
  if (cronSecret !== process.env.CRON_SECRET) {
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