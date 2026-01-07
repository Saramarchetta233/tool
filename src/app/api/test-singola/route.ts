import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function DELETE() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  const today = new Date().toISOString().split('T')[0]
  
  try {
    // Cancella la singola di test
    const { error } = await supabase
      .from('tips_singola')
      .delete()
      .eq('fixture_id', 999999)
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message })
    }
    
    return NextResponse.json({ success: true, message: 'Test singola rimossa' })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  const today = new Date().toISOString().split('T')[0]
  
  // Test diretto: inserisci una singola semplice
  const testSingola = {
    fixture_id: 999999,
    home_team: 'Test Team A',
    away_team: 'Test Team B',
    league: 'Test League',
    match_time: '15:00',
    prediction: '1',
    prediction_label: 'TEST TEAM A VINCE',
    odds: 2.00,
    confidence: 75,
    reasoning: 'Test per verificare se la tabella funziona',
    valid_until: today
  }
  
  console.log('🧪 Inserendo test singola:', testSingola)
  
  try {
    // Prima cancella eventuali record esistenti per oggi
    await supabase
      .from('tips_singola')
      .delete()
      .eq('valid_until', today)
    
    // Poi inserisci il test
    const { error, data } = await supabase
      .from('tips_singola')
      .insert(testSingola)
      .select()
    
    if (error) {
      console.error('❌ Errore inserimento test singola:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }
    
    console.log('✅ Test singola inserita:', data)
    
    // Ora prova a leggerla
    const { data: readData, error: readError } = await supabase
      .from('tips_singola')
      .select('*')
      .eq('valid_until', today)
      .single()
    
    return NextResponse.json({
      success: true,
      message: 'Test singola completato',
      inserted: data,
      read: readData,
      readError: readError?.message || null
    })
    
  } catch (error) {
    console.error('❌ Errore test singola:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}