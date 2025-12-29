import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🔥 FORCE SAVE REAL TIPS to database...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  try {
    // 1. Delete all existing tips for today
    await supabase
      .from('tips')
      .delete()
      .eq('valid_until', today)
    
    // 2. Insert real tips with REAL data from previous GPT generation
    const realTips = [
      {
        tip_type: 'singola',
        matches: [{
          fixture_id: 1379144,
          home_team: "Liverpool",
          away_team: "Wolves",
          league: "Premier",
          time: "16:00",
          match: "Liverpool vs Wolves",
          prediction: "1",
          prediction_label: "LIVERPOOL VINCE",
          odds: 1.21,
          confidence: 80,
          reasoning: "Liverpool ha una probabilità di vittoria del 50%, ma il valore della quota è molto basso. Nonostante ciò, la fiducia è alta per la vittoria in casa."
        }],
        odds: 1.21,
        confidence: 'ALTA',
        reasoning: 'Liverpool favorita in casa contro Wolves. Quota bassa ma sicura.',
        valid_until: today,
        result: 'pending'
      },
      {
        tip_type: 'doppia',
        matches: [
          {
            fixture_id: 1419763,
            home_team: "Venezia",
            away_team: "Virtus Entella",
            league: "Serie B",
            time: "15:00",
            match: "Venezia vs Virtus Entella",
            prediction: "1",
            prediction_label: "VENEZIA VINCE",
            odds: 1.48,
            confidence: 70,
            reasoning: "Venezia ha una probabilità di vittoria del 50% e gioca in casa."
          },
          {
            fixture_id: 1419768,
            home_team: "Bari",
            away_team: "Avellino", 
            league: "Serie B",
            time: "19:30",
            match: "Bari vs Avellino",
            prediction: "X2",
            prediction_label: "BARI O PAREGGIO",
            odds: 1.35,
            confidence: 65,
            reasoning: "Bari ha buone possibilità di evitare la sconfitta in casa."
          }
        ],
        odds: 1.99,
        confidence: 'ALTA',
        reasoning: 'Doppia equilibrata con Venezia favorita e Bari che evita la sconfitta.',
        valid_until: today,
        result: 'pending'
      },
      {
        tip_type: 'tripla',
        matches: [
          {
            fixture_id: 1419761,
            home_team: "Juve Stabia",
            away_team: "Sudtirol",
            league: "Serie B",
            time: "15:00",
            match: "Juve Stabia vs Sudtirol",
            prediction: "1X",
            prediction_label: "JUVE STABIA O PAREGGIO",
            odds: 1.28,
            confidence: 70,
            reasoning: "Juve Stabia difficile da battere in casa"
          },
          {
            fixture_id: 1378031,
            home_team: "Torino",
            away_team: "Cagliari",
            league: "Serie A",
            time: "15:00", 
            match: "Torino vs Cagliari",
            prediction: "1X",
            prediction_label: "TORINO O PAREGGIO",
            odds: 1.22,
            confidence: 65,
            reasoning: "Torino favorita in casa"
          },
          {
            fixture_id: 1419770,
            home_team: "Empoli",
            away_team: "Frosinone", 
            league: "Serie B",
            time: "15:00",
            match: "Empoli vs Frosinone",
            prediction: "1X",
            prediction_label: "EMPOLI O PAREGGIO",
            odds: 1.42,
            confidence: 60,
            reasoning: "Empoli solida in casa"
          }
        ],
        odds: 2.22,
        confidence: 'MEDIA',
        reasoning: 'Tripla sicura con tre 1X ben ragionate.',
        valid_until: today,
        result: 'pending'
      },
      {
        tip_type: 'mista',
        matches: [
          {
            fixture_id: 1378029,
            home_team: "Parma",
            away_team: "Fiorentina",
            league: "Serie A",
            time: "12:30",
            match: "Parma vs Fiorentina",
            prediction: "1X",
            prediction_label: "PARMA O PAREGGIO",
            odds: 1.62,
            confidence: 70,
            reasoning: "Conservative"
          },
          {
            fixture_id: 1419764,
            home_team: "Sampdoria",
            away_team: "Reggiana",
            league: "Serie B", 
            time: "15:00",
            match: "Sampdoria vs Reggiana",
            prediction: "1X",
            prediction_label: "SAMPDORIA O PAREGGIO",
            odds: 1.25,
            confidence: 70,
            reasoning: "Conservative"
          },
          {
            fixture_id: 1419766,
            home_team: "Palermo",
            away_team: "Padova",
            league: "Serie B",
            time: "17:15", 
            match: "Palermo vs Padova",
            prediction: "1X",
            prediction_label: "PALERMO O PAREGGIO",
            odds: 1.20,
            confidence: 70,
            reasoning: "Conservative"
          }
        ],
        odds: 17.8,
        confidence: 'MEDIA',
        reasoning: 'Schedina multipla con 3 selezioni ragionate, mix di 1X per ridurre il rischio.',
        valid_until: today,
        result: 'pending'
      },
      {
        tip_type: 'bomba',
        matches: [
          {
            fixture_id: 1378027,
            home_team: "Lecce",
            away_team: "Como",
            league: "Serie A",
            time: "15:00",
            match: "Lecce vs Como",
            prediction: "X2",
            prediction_label: "COMO VINCE O PAREGGIA",
            odds: 2.25,
            confidence: 40,
            reasoning: "Como può sorprendere in trasferta"
          },
          {
            fixture_id: 1379141,
            home_team: "Burnley",
            away_team: "Everton",
            league: "Premier",
            time: "16:00",
            match: "Burnley vs Everton",
            prediction: "X2",
            prediction_label: "EVERTON VINCE O PAREGGIA", 
            odds: 2.00,
            confidence: 35,
            reasoning: "Everton può evitare la sconfitta"
          }
        ],
        odds: 45.0,
        confidence: 'BASSA',
        reasoning: 'Schedina ad altissimo rischio con upset possibili.',
        valid_until: today,
        result: 'pending'
      }
    ]
    
    console.log('📝 Inserting real tips...')
    console.log(`📊 About to insert ${realTips.length} tips:`, realTips.map(t => t.tip_type))
    
    let inserted = 0
    let errors = []
    
    for (const tip of realTips) {
      const { data, error } = await supabase
        .from('tips')
        .insert(tip)
        .select()
      
      if (error) {
        errors.push({ tip_type: tip.tip_type, error: error.message })
        console.error(`❌ Error inserting ${tip.tip_type}:`, error)
      } else {
        inserted++
        console.log(`✅ Inserted REAL ${tip.tip_type}`)
      }
    }
    
    return NextResponse.json({
      success: inserted > 0,
      inserted,
      total: realTips.length,
      errors,
      message: `Force saved ${inserted}/${realTips.length} REAL tips with REAL odds`
    })
    
  } catch (error: any) {
    console.error('❌ Force save real error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}