import { NextRequest, NextResponse } from 'next/server'
import { generateTodayCompleteAnalyses } from '@/lib/openai-match-analysis'

export async function GET(request: NextRequest) {
  const cronSecret = request.nextUrl.searchParams.get('secret')
  
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('🤖 Starting COMPLETE analysis generation...')
  
  try {
    const results = await generateTodayCompleteAnalyses()
    
    if (!results.success) {
      return NextResponse.json({
        success: false,
        error: results.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    console.log(`✅ COMPLETE analysis completed: ${results.successful} successful, ${results.failed} failed`)
    
    return NextResponse.json({
      success: true,
      message: `COMPLETE analysis: ${results.successful} analyses generated, ${results.failed} failed`,
      details: results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ COMPLETE analysis failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}