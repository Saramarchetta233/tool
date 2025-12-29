import { NextResponse } from 'next/server'
import { generateDailyTipsV3 } from '@/lib/tipster-ai-v3'

export const dynamic = 'force-dynamic'

export async function POST() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🚀 Starting TipsterAI V3 generation for', today)
  
  try {
    const result = await generateDailyTipsV3()
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message,
        date: today
      }, { status: 400 })
    }
    
    console.log('✅ TipsterAI V3 generation completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'TipsterAI V3 tips generated successfully',
      date: today,
      tips: result.tips,
      generated_at: new Date().toISOString(),
      version: 'V3'
    })
    
  } catch (error: any) {
    console.error('❌ TipsterAI V3 generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error during V3 generation',
      date: today
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'TipsterAI V3 Generator',
    description: 'Structured analysis + code-driven selection for coherent tips',
    features: [
      'GPT-4 analyzes each match individually',
      'Code logic builds selections respecting rules',
      'Max 2 appearances per match across all tips',
      'Serie A priority',
      'Coherent exact scores with main analysis'
    ],
    usage: 'POST to generate new V3 tips'
  })
}