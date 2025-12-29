import { NextResponse } from 'next/server'
import { generateDailyTips } from '@/lib/tipster-ai'

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
    const result = await generateDailyTips()
    
    // Restore console
    console.log = originalLog
    console.warn = originalWarn
    console.error = originalError
    
    return NextResponse.json({
      result,
      logs,
      summary: {
        success: result.success,
        tips: result.tips ? Object.keys(result.tips).map(type => ({
          type,
          available: result.tips[type].available,
          odds: result.tips[type].total_odds || result.tips[type].odds,
          message: result.tips[type].message
        })) : []
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