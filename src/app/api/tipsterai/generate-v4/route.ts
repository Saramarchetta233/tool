import { NextResponse } from 'next/server'
import { generateDailyTipsV4 } from '@/lib/tipster-ai-v4'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const targetDate = body.date
    
    console.log('🚀 Generazione tips V4 iniziata per', targetDate || 'oggi')
    
    const result = await generateDailyTipsV4(targetDate)
    
    if (result.success) {
      console.log('✅ Tips V4 generati con successo')
      return NextResponse.json({
        success: true,
        message: 'Tips generati con successo',
        tips: result.tips
      })
    } else {
      console.log('❌ Generazione fallita:', result.message)
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Errore generazione V4:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore durante la generazione dei tips'
    }, { status: 500 })
  }
}