import { NextRequest, NextResponse } from 'next/server'
import { generateDailyTipsV2 } from '@/lib/tipster-ai-v2'

export async function POST(request: NextRequest) {
  try {
    // Verifica secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🎯 Starting TipsterAI V2 generation with separate tables...')

    const result = await generateDailyTipsV2()
    
    console.log('✅ TipsterAI V2 generation completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Tips V2 generated with separate tables',
      result
    })

  } catch (error) {
    console.error('❌ TipsterAI V2 generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Tips generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Permetti anche GET per test manuale
export async function GET(request: NextRequest) {
  return POST(request)
}