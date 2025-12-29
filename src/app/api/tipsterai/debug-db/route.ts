import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Query diretta per vedere tutti i tips di oggi
    const { data: allTips, error } = await supabaseAdmin
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('🔍 Debug database query:', {
      today,
      allTipsCount: allTips?.length || 0,
      error
    })
    
    // Filtra per oggi
    const todayTips = allTips?.filter(tip => tip.valid_until === today) || []
    
    return NextResponse.json({
      success: true,
      today,
      allTipsCount: allTips?.length || 0,
      todayTipsCount: todayTips.length,
      allTips,
      todayTips,
      error
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}