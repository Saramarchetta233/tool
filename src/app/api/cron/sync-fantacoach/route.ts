import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  try {
    // Verifica autorizzazione
    const authHeader = headers().get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('🔄 CRON: Aggiornamento settimanale FantaCoach...')
    
    const baseUrl = request.url.split('/api/')[0]
    
    // 1. Sync tutti i giocatori Serie A (completo)
    const syncResponse = await fetch(`${baseUrl}/api/fantacoach/sync-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Timeout 5 minuti per sync completo
      signal: AbortSignal.timeout(300000)
    })
    
    const syncResult = await syncResponse.json()
    
    // 2. Pulisci cache vecchia
    const cleanResponse = await fetch(`${baseUrl}/api/fantacoach/clean-cache`, {
      method: 'POST'
    })
    
    const cleanResult = await cleanResponse.json()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sync: syncResult,
      cleanup: cleanResult,
      nextRun: 'tra 7 giorni'
    })
    
  } catch (error) {
    console.error('❌ CRON Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Per trigger manuale
  return GET(request)
}