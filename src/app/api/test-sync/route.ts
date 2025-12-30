import { NextResponse } from 'next/server'
import { syncCompleteMatchesForDate } from '@/lib/football-api-complete'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    console.log('🧪 Test sync starting...')
    
    // Sincronizza solo oggi per test veloce
    const today = new Date().toISOString().split('T')[0]
    const results = await syncCompleteMatchesForDate(today)
    
    const totalMatches = results.reduce((sum, r) => sum + r.fixtures, 0)
    
    return NextResponse.json({
      success: true,
      message: `Test sync OK! ${totalMatches} partite sincronizzate per oggi`,
      date: today,
      results,
      note: 'Il CRON automatico funzionerà stanotte alle 00:00'
    })
    
  } catch (error) {
    console.error('Test sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}