import { NextResponse } from 'next/server'
import { generateDailyTips } from '@/lib/tipster-ai'

export async function GET() {
  console.log('🧪 Testing TipsterAI generation system...')
  
  try {
    const result = await generateDailyTips()
    
    return NextResponse.json({
      success: true,
      test: 'TipsterAI Generation Test',
      timestamp: new Date().toISOString(),
      result,
      message: result.success ? 'Tips generati con successo!' : result.message
    })
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}