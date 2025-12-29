import { NextRequest, NextResponse } from 'next/server'
import { generateTodayAnalyses } from '@/lib/match-analysis'

export async function GET(request: NextRequest) {
  const cronSecret = request.nextUrl.searchParams.get('secret')
  
  // Check authentication
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('🤖 Starting automated match analysis generation...')
  
  try {
    const results = await generateTodayAnalyses()
    
    if (!results.success) {
      return NextResponse.json({
        success: false,
        error: results.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    console.log(`✅ Analysis generation completed: ${results.successful} successful, ${results.failed} failed`)
    
    return NextResponse.json({
      success: true,
      message: `Generated ${results.successful} analyses, ${results.failed} failed`,
      details: results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Analysis generation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}