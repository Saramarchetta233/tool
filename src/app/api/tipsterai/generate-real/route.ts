import { NextResponse } from 'next/server'
import { generateDailyTipsV2 } from '@/lib/tipster-ai-v2'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🎯 GENERATING REAL TIPS with GPT-4o-mini...')
  
  try {
    // Create fresh connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )
    
    // 1. Clear fake tips
    console.log('🧹 Clearing fake tips...')
    await supabase
      .from('tips')
      .delete()
      .eq('valid_until', today)
    
    // 2. Generate real tips with GPT-4o-mini
    console.log('🤖 Generating tips with GPT-4o-mini using real matches...')
    const result = await generateDailyTipsV2()
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'message' in result ? result.message : 'Failed to generate tips',
        tips: null
      }, { status: 500 })
    }
    
    // 3. Verify what was generated
    const { data: newTips, error: verifyError } = await supabase
      .from('tips')
      .select('tip_type, odds, matches')
      .eq('valid_until', today)
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      success: true,
      message: 'Real tips generated successfully with GPT-4o-mini',
      generatedCount: result.savedCount || 0,
      totalTips: newTips?.length || 0,
      tips: newTips?.map(tip => ({
        type: tip.tip_type,
        odds: tip.odds,
        matches: tip.matches?.length || 0,
        firstMatch: tip.matches?.[0]?.match || 'No matches',
        prediction: tip.matches?.[0]?.prediction,
        realOdds: tip.matches?.[0]?.odds
      })) || []
    })
    
  } catch (error: any) {
    console.error('❌ Generate real tips error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}