import { NextRequest, NextResponse } from 'next/server'
import { generateTodayAnalyses } from '@/lib/match-analysis'

export async function GET(request: NextRequest) {
  console.log('🧪 Manual analysis generation trigger...')
  
  try {
    const results = await generateTodayAnalyses()
    
    if (!results.success) {
      return NextResponse.json({
        success: false,
        error: results.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    console.log(`✅ Manual analysis generation completed: ${results.successful} successful, ${results.failed} failed`)
    
    return NextResponse.json({
      success: true,
      message: `Manually generated ${results.successful} analyses, ${results.failed} failed`,
      details: results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Manual analysis generation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}