import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDailyTipsV4 } from '@/lib/tipster-ai-v4'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

export async function POST() {
  try {
    console.log('🔄 Rigenerando tips con fix BTTS -> Gol...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )
    
    const today = new Date().toISOString().split('T')[0]
    
    // 1. Cancella tutti i tips di oggi
    console.log('🗑️ Cancellando tips esistenti...')
    await Promise.all([
      supabase.from('tips_singola').delete().eq('valid_until', today),
      supabase.from('tips_doppia').delete().eq('valid_until', today),
      supabase.from('tips_tripla').delete().eq('valid_until', today),
      supabase.from('tips_mista').delete().eq('valid_until', today),
      supabase.from('tips_bomba').delete().eq('valid_until', today)
    ])
    
    console.log('✅ Tips esistenti cancellati')
    
    // 2. Genera nuovi tips con fix
    console.log('🎯 Generando nuovi tips...')
    const result = await generateDailyTipsV4(today)
    
    if (!result.success) {
      throw new Error(result.message || 'Errore nella generazione')
    }
    
    console.log('✅ Nuovi tips generati con fix BTTS -> Gol')
    
    return NextResponse.json({
      success: true,
      message: 'Tips rigenerati con successo! Ora vedrai "Gol" invece di "BTTS"',
      date: today,
      tips: result.tips
    })
    
  } catch (error) {
    console.error('❌ Errore rigenerazione:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}