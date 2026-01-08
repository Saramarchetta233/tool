import { NextResponse } from 'next/server'
import { generateDailyTipsV2 } from '@/lib/tipster-ai-v2'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('🔍 DEBUG: Running TipsterAI generation with full logging...')
  
  try {
    // Temporarily set console.log to capture all logs
    const logs: string[] = []
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    
    console.log = (...args) => {
      logs.push(`LOG: ${args.join(' ')}`)
      originalLog(...args)
    }
    console.warn = (...args) => {
      logs.push(`WARN: ${args.join(' ')}`)
      originalWarn(...args)
    }
    console.error = (...args) => {
      logs.push(`ERROR: ${args.join(' ')}`)
      originalError(...args)
    }
    
    // Generate tips
    const result = await generateDailyTipsV2()
    
    // Restore console
    console.log = originalLog
    console.warn = originalWarn
    console.error = originalError
    
    return NextResponse.json({
      result,
      logs,
      summary: {
        success: result.success,
        singola: 'singola' in result ? result.singola : false,
        doppia: 'doppia' in result ? result.doppia : false,
        tripla: 'tripla' in result ? result.tripla : false,
        mista: 'mista' in result ? result.mista : false,
        bomba: 'bomba' in result ? result.bomba : false,
        message: 'message' in result ? result.message : undefined
      }
    })
    
  } catch (error: any) {
    console.error('❌ Debug generation error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}