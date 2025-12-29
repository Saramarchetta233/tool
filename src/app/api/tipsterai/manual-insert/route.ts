import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🔧 Manual insert using direct credentials...')
  
  // Use the exact same approach as our working test scripts
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    // First clear today's tips
    await supabase
      .from('tips')
      .delete()
      .eq('valid_until', today)
    
    // Insert all 5 tip types with proper structure
    const tips = [
      {
        tip_type: 'singola',
        matches: [{
          fixture_id: 1419764,
          match: "Sampdoria vs Reggiana",
          league: "Serie B",
          time: "15:00",
          prediction: "1X",
          odds: 1.70,
          confidence: 75,
          reasoning: "Sampdoria ha buone possibilità di non perdere in casa"
        }],
        odds: 1.70,
        confidence: 'ALTA',
        reasoning: 'Singola sicura con quota target 1.70',
        valid_until: today,
        result: 'pending'
      },
      {
        tip_type: 'doppia',
        matches: [
          {
            fixture_id: 1419766,
            match: "Palermo vs Padova",
            league: "Serie B",
            time: "15:30",
            prediction: "1X",
            odds: 1.40,
            confidence: 70,
            reasoning: "Palermo forte in casa"
          },
          {
            fixture_id: 1379140,
            match: "Brentford vs Bournemouth",
            league: "Premier",
            time: "16:00",
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
      },
      {
        tip_type: 'tripla',
        matches: [
          {
            fixture_id: 1419763,
            match: "Venezia vs Virtus Entella",
            league: "Serie B",
            time: "14:30",
            prediction: "1X",
            odds: 1.30,
            confidence: 68,
            reasoning: "Venezia non dovrebbe perdere"
          },
          {
            fixture_id: 1419767,
            match: "Catanzaro vs Cesena",
            league: "Serie B",
            time: "15:00",
            prediction: "1X",
            odds: 1.35,
            confidence: 65,
            reasoning: "Catanzaro solida in casa"
          },
          {
            fixture_id: 1379139,
            match: "Arsenal vs Brighton",
            league: "Premier",
            time: "17:30",
            prediction: "1",
            odds: 1.40,
            confidence: 70,
            reasoning: "Arsenal favorita in casa"
          }
        ],
        odds: 3.05,
        confidence: 'MEDIA',
        reasoning: 'Tripla con quote target ~3.00',
        valid_until: today,
        result: 'pending'
      },
      {
        tip_type: 'mista',
        matches: [
          { fixture_id: 1419763, match: "Venezia vs Virtus Entella", league: "Serie B", time: "14:30", prediction: "1X", odds: 1.25, confidence: 70, reasoning: "Conservative" },
          { fixture_id: 1419767, match: "Catanzaro vs Cesena", league: "Serie B", time: "15:00", prediction: "1X", odds: 1.30, confidence: 65, reasoning: "Conservative" },
          { fixture_id: 1379139, match: "Arsenal vs Brighton", league: "Premier", time: "17:30", prediction: "1X", odds: 1.20, confidence: 75, reasoning: "Conservative" },
          { fixture_id: 1379140, match: "Brentford vs Bournemouth", league: "Premier", time: "16:00", prediction: "1X", odds: 1.25, confidence: 68, reasoning: "Conservative" },
          { fixture_id: 1379141, match: "Burnley vs Everton", league: "Premier", time: "16:30", prediction: "X2", odds: 1.22, confidence: 60, reasoning: "Conservative" }
        ],
        odds: 12.50,
        confidence: 'MEDIA',
        reasoning: 'Multipla sicura con molte partite conservative',
        valid_until: today,
        result: 'pending'
      },
      {
        tip_type: 'bomba',
        matches: [
          {
            fixture_id: 1378027,
            match: "Lecce vs Como",
            league: "Serie A",
            time: "18:30",
            prediction: "2",
            odds: 2.80,
            confidence: 25,
            reasoning: "Como può sorprendere in trasferta"
          },
          {
            fixture_id: 1379146,
            match: "Nottingham vs Manchester City",
            league: "Premier",
            time: "19:00",
            prediction: "1",
            odds: 5.25,
            confidence: 15,
            reasoning: "UPSET: Nottingham può sorprendere il City"
          },
          {
            fixture_id: 1378029,
            match: "Parma vs Fiorentina",
            league: "Serie A",
            time: "20:45",
            prediction: "X",
            odds: 3.05,
            confidence: 20,
            reasoning: "Pareggio possibile tra squadre equilibrate"
          }
        ],
        odds: 45.0,
        confidence: 'BASSA',
        reasoning: 'Bomba ad altissimo rischio con upset possibili',
        valid_until: today,
        result: 'pending'
      }
    ]
    
    let inserted = 0
    let errors = []
    
    for (const tip of tips) {
      const { data, error } = await supabase
        .from('tips')
        .insert(tip)
        .select()
      
      if (error) {
        errors.push({ tip_type: tip.tip_type, error: error.message })
        console.error(`❌ Error inserting ${tip.tip_type}:`, error)
      } else {
        inserted++
        console.log(`✅ Inserted ${tip.tip_type}`)
      }
    }
    
    return NextResponse.json({
      success: inserted > 0,
      inserted,
      total: tips.length,
      errors,
      message: `Manually inserted ${inserted}/${tips.length} tips via API`
    })
    
  } catch (error: any) {
    console.error('❌ Manual insert error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}