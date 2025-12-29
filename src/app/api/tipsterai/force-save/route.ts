import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  // Prova a salvare un tip manualmente con la struttura esatta che usa GPT
  const testTip = {
    tip_type: 'doppia',
    matches: [
      {
        fixture_id: 1419766,
        home_team: "Palermo",
        away_team: "Padova", 
        league: "Serie B",
        time: "17:15",
        prediction: "1X",
        prediction_label: "PALERMO O PAREGGIO",
        odds: 1.51,
        confidence: 70,
        reasoning: "Test reasoning"
      },
      {
        fixture_id: 1379140,
        home_team: "Brentford",
        away_team: "Bournemouth",
        league: "Premier", 
        time: "16:00",
        prediction: "1X",
        prediction_label: "BRENTFORD O PAREGGIO",
        odds: 1.36,
        confidence: 68,
        reasoning: "Test reasoning"
      }
    ],
    odds: 2.05,
    confidence: 'ALTA',
    reasoning: 'Test doppia',
    valid_until: today,
    result: 'pending'
  }
  
  console.log('🧪 Testing manual save...', JSON.stringify(testTip, null, 2))
  
  try {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .insert(testTip)
      .select()
    
    return NextResponse.json({
      success: !error,
      data,
      error: error?.message || null,
      errorDetails: error
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}