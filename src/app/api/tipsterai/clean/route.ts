import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🧹 Pulizia completa tips per', today)
  
  try {
    await Promise.all([
      supabaseAdmin.from('tips_singola').delete().eq('valid_until', today),
      supabaseAdmin.from('tips_doppia').delete().eq('valid_until', today),
      supabaseAdmin.from('tips_tripla').delete().eq('valid_until', today),
      supabaseAdmin.from('tips_mista').delete().eq('valid_until', today),
      supabaseAdmin.from('tips_bomba').delete().eq('valid_until', today)
    ])
    
    console.log('✅ Pulizia completata')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tutti i tips cancellati' 
    })
    
  } catch (error) {
    console.error('❌ Errore pulizia:', error)
    return NextResponse.json({ 
      error: 'Errore durante la pulizia' 
    }, { status: 500 })
  }
}