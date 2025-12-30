import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🔧 Force cleaning BTTS from database...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )
    
    const today = new Date().toISOString().split('T')[0]
    
    console.log('🗑️ Step 1: Cancellando TUTTO da tips_tripla e tips_mista...')
    
    // Cancella TUTTO da tripla e mista per oggi
    const [deleteTriplaResult, deleteMistaResult] = await Promise.all([
      supabase.from('tips_tripla').delete().eq('valid_until', today),
      supabase.from('tips_mista').delete().eq('valid_until', today)
    ])
    
    console.log('✅ Cancellazione completata')
    console.log('  - Tripla:', deleteTriplaResult.error ? 'ERROR' : 'OK')
    console.log('  - Mista:', deleteMistaResult.error ? 'ERROR' : 'OK')
    
    // Verifica che siano davvero cancellati
    const [checkTripla, checkMista] = await Promise.all([
      supabase.from('tips_tripla').select('*').eq('valid_until', today),
      supabase.from('tips_mista').select('*').eq('valid_until', today)
    ])
    
    return NextResponse.json({
      success: true,
      message: 'tips_tripla e tips_mista cancellati! Ora rigenera con "Aggiorna Proposte"',
      verification: {
        tripla_remaining: checkTripla.data?.length || 0,
        mista_remaining: checkMista.data?.length || 0
      },
      nextSteps: [
        '1. Vai su /tipsterai',
        '2. Clicca "Aggiorna Proposte"', 
        '3. Verifica che tripla e mista ora mostrino "Gol" invece di "BTTS"'
      ]
    })
    
  } catch (error) {
    console.error('❌ Force clean failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}