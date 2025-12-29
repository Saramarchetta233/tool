import { NextResponse } from 'next/server'
import { generateDailyTipsV4 } from '@/lib/tipster-ai-v4'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST() {
  try {
    console.log('🔄 Rigenerazione tips V4 iniziata...')
    
    const result = await generateDailyTipsV4()
    
    if (result.success) {
      console.log('✅ Tips V4 rigenerati con successo')
      return NextResponse.json({
        success: true,
        message: 'Tips rigenerati con successo',
        tips: result.tips,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ Rigenerazione fallita:', result.message)
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Errore rigenerazione V4:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore durante la rigenerazione dei tips'
    }, { status: 500 })
  }
}