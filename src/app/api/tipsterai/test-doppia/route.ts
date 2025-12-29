import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  const doppia = {
    tip_type: 'doppia',
    matches: [
      {
        fixture_id: 1419766,
        match: "Palermo vs Padova",
        league: "Serie B", 
        prediction: "1X",
        odds: 1.40,
        confidence: 70,
        reasoning: "Palermo forte in casa"
      },
      {
        fixture_id: 1379140,
        match: "Brentford vs Bournemouth",
        league: "Premier",
        prediction: "1X", 
        odds: 1.43,
        confidence: 68,
        reasoning: "Brentford difficile da battere in casa"
      }
    ],
    odds: 2.00,
    confidence: 'ALTA',
    reasoning: 'Doppia equilibrata con quote target ~2.00',
    valid_until: today,
    result: 'pending'
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .insert(doppia)
      .select()
    
    return NextResponse.json({
      success: !error,
      data,
      error: error?.message,
      errorDetails: error
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}