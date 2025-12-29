import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log(`🐛 DEBUG: Fetching raw tips for ${today}...`)
  console.log(`🔗 Using Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`🔑 Service key ends with: ...${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8)}`)
  
  // Use direct createClient instead of imported supabaseAdmin
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Just get all tips without any filtering
    const { data: allTips, error } = await supabase
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log(`🔍 Raw query result: ${allTips?.length || 0} tips found`)
    
    // Manual filter for today
    const todayTips = allTips?.filter(tip => tip.valid_until === today) || []
    
    console.log(`📅 Tips for today: ${todayTips.length}`)
    
    return NextResponse.json({
      success: true,
      today,
      allTipsCount: allTips?.length || 0,
      todayTipsCount: todayTips.length,
      allTips: allTips?.map(tip => ({
        id: tip.id,
        tip_type: tip.tip_type,
        valid_until: tip.valid_until,
        odds: tip.odds,
        match_count: tip.matches?.length || 0,
        first_match: tip.matches?.[0]?.match || 'no matches',
        created_at: tip.created_at
      })),
      todayTips: todayTips.map(tip => ({
        id: tip.id,
        tip_type: tip.tip_type,
        odds: tip.odds,
        match_count: tip.matches?.length || 0
      })),
      error: error?.message || null
    })
  } catch (err: any) {
    console.error('❌ Debug endpoint error:', err)
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
}