import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🧪 COMPREHENSIVE TEST: Insert and read in same API call...')
  
  // Create TWO different connection instances to test
  const supabase1 = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const supabase2 = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    // Step 1: Clear and count
    console.log('Step 1: Clearing tips...')
    await supabase1.from('tips').delete().eq('valid_until', today)
    
    const { data: afterClear } = await supabase1.from('tips').select('*')
    console.log(`After clear: ${afterClear?.length || 0} total tips`)
    
    // Step 2: Insert ONE tip
    console.log('Step 2: Inserting ONE tip...')
    const testTip = {
      tip_type: 'singola',
      matches: [{
        fixture_id: 999999,
        match: "TEST vs TEST",
        league: "TEST",
        time: "23:59",
        prediction: "1",
        odds: 1.50,
        confidence: 80,
        reasoning: "Test comprehensive"
      }],
      odds: 1.50,
      confidence: 'ALTA',
      reasoning: 'Comprehensive test tip',
      valid_until: today,
      result: 'pending'
    }
    
    const { data: insertResult, error: insertError } = await supabase1
      .from('tips')
      .insert(testTip)
      .select()
    
    console.log('Insert result:', insertResult ? 'SUCCESS' : 'FAILED')
    if (insertError) console.log('Insert error:', insertError)
    
    // Step 3: Read immediately with SAME connection
    console.log('Step 3: Reading with SAME connection...')
    const { data: tips1, error: error1 } = await supabase1
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Step 4: Read with DIFFERENT connection
    console.log('Step 4: Reading with DIFFERENT connection...')
    const { data: tips2, error: error2 } = await supabase2
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Step 5: Read using the app's supabaseAdmin
    console.log('Step 5: Reading with app supabaseAdmin...')
    const { supabaseAdmin } = await import('@/lib/supabase/client')
    const { data: tips3, error: error3 } = await supabaseAdmin
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      success: true,
      today,
      step1_afterClear: afterClear?.length || 0,
      step2_insertSuccess: !insertError,
      step2_insertError: insertError?.message || null,
      step3_sameConnection: {
        count: tips1?.length || 0,
        tips: tips1?.map(t => ({ id: t.id, tip_type: t.tip_type, match: t.matches?.[0]?.match })) || []
      },
      step4_differentConnection: {
        count: tips2?.length || 0,
        tips: tips2?.map(t => ({ id: t.id, tip_type: t.tip_type, match: t.matches?.[0]?.match })) || []
      },
      step5_appSupabaseAdmin: {
        count: tips3?.length || 0,
        tips: tips3?.map(t => ({ id: t.id, tip_type: t.tip_type, match: t.matches?.[0]?.match })) || []
      },
      urls_match: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keys_match: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8)
    })
    
  } catch (error: any) {
    console.error('❌ Comprehensive test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}