import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDailyTipsV3 } from '@/lib/tipster-ai-v3'

export const dynamic = 'force-dynamic'

export async function POST() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🔄 Forzando rigenerazione V3 per', today)
  
  try {
    // Create fresh Supabase connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )
    
    // 1. Cancella tips esistenti dalle 5 tabelle
    console.log('🗑️ Cancellando tips V2 esistenti...')
    await Promise.all([
      supabase.from('tips_singola').delete().eq('valid_until', today),
      supabase.from('tips_doppia').delete().eq('valid_until', today),
      supabase.from('tips_tripla').delete().eq('valid_until', today),
      supabase.from('tips_mista').delete().eq('valid_until', today),
      supabase.from('tips_bomba').delete().eq('valid_until', today)
    ])
    
    console.log('✅ Tips vecchi cancellati')
    
    // 2. Rigenera con TipsterAI V3
    console.log('🎯 Generando nuovi tips con V3...')
    const result = await generateDailyTipsV3()
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message,
        version: 'V3'
      }, { status: 400 })
    }
    
    console.log('✅ Tips V3 generati con successo')
    
    // 3. Verifica i tips appena generati
    const [singola, doppia, tripla, mista, bomba] = await Promise.all([
      supabase.from('tips_singola').select('*').eq('valid_until', today).single(),
      supabase.from('tips_doppia').select('*').eq('valid_until', today).single(),
      supabase.from('tips_tripla').select('*').eq('valid_until', today).single(),
      supabase.from('tips_mista').select('*').eq('valid_until', today).single(),
      supabase.from('tips_bomba').select('*').eq('valid_until', today).single()
    ])
    
    return NextResponse.json({
      success: true,
      message: 'Tips V3 rigenerati con successo',
      version: 'V3',
      regenerated_at: new Date().toISOString(),
      tips: {
        singola: singola.data,
        doppia: doppia.data,
        tripla: tripla.data,
        mista: mista.data,
        bomba: bomba.data
      },
      summary: {
        singola: singola.data ? `${singola.data.home_team} vs ${singola.data.away_team} - ${singola.data.prediction}` : null,
        doppia: doppia.data ? `${doppia.data.matches?.length || 0} partite` : null,
        tripla: tripla.data ? `${tripla.data.matches?.length || 0} partite` : null,
        mista: mista.data ? `${mista.data.matches?.length || 0} partite` : null,
        bomba: bomba.data ? `${bomba.data.matches?.length || 0} risultati esatti` : null
      }
    })
    
  } catch (error: any) {
    console.error('❌ Errore rigenerazione V3:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Errore interno durante rigenerazione V3',
      version: 'V3'
    }, { status: 500 })
  }
}