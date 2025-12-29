import { NextRequest, NextResponse } from 'next/server'
import { generateDailyTipsV4 } from '@/lib/tipster-ai-v4'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const cronSecret = request.nextUrl.searchParams.get('secret')
  
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('🎯 Starting automatic tips generation...')
  
  try {
    // Genera tips per oggi
    const today = new Date().toISOString().split('T')[0]
    const results = await generateDailyTipsV4(today)
    
    if (results.success) {
      const tipTypes = Object.keys(results.tips).filter(key => results.tips[key] !== null)
      
      console.log(`✅ Tips generated successfully: ${tipTypes.join(', ')}`)
      
      return NextResponse.json({
        success: true,
        message: `Tips generated for ${today}`,
        tips: tipTypes,
        details: results.tips,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log(`ℹ️ No tips generated: ${results.message}`)
      
      return NextResponse.json({
        success: true,
        message: results.message,
        tips: [],
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('❌ Tips generation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}