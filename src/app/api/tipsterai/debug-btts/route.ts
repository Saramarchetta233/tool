import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )
    
    const today = new Date().toISOString().split('T')[0]
    
    // Controlla tutti i tips di oggi
    const [singola, doppia, tripla, mista, bomba] = await Promise.all([
      supabase.from('tips_singola').select('*').eq('valid_until', today),
      supabase.from('tips_doppia').select('*').eq('valid_until', today),
      supabase.from('tips_tripla').select('*').eq('valid_until', today),
      supabase.from('tips_mista').select('*').eq('valid_until', today),
      supabase.from('tips_bomba').select('*').eq('valid_until', today)
    ])
    
    // Cerca BTTS nei matches di tripla e mista
    const bttsInTripla = tripla.data?.flatMap(tip => 
      tip.matches?.filter(match => 
        match.prediction?.includes('BTTS') || 
        match.prediction_label?.includes('BTTS')
      ) || []
    ) || []
    
    const bttsInMista = mista.data?.flatMap(tip => 
      tip.matches?.filter(match => 
        match.prediction?.includes('BTTS') || 
        match.prediction_label?.includes('BTTS')
      ) || []
    ) || []
    
    return NextResponse.json({
      success: true,
      date: today,
      counts: {
        singola: singola.data?.length || 0,
        doppia: doppia.data?.length || 0,
        tripla: tripla.data?.length || 0,
        mista: mista.data?.length || 0,
        bomba: bomba.data?.length || 0
      },
      bttsFound: {
        tripla: bttsInTripla.length,
        mista: bttsInMista.length,
        examples: {
          tripla: bttsInTripla.slice(0, 2),
          mista: bttsInMista.slice(0, 2)
        }
      },
      rawData: {
        tripla: tripla.data?.[0]?.matches || [],
        mista: mista.data?.[0]?.matches || []
      }
    })
    
  } catch (error) {
    console.error('Error debugging BTTS:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}