import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { generateDailyTipsSimple } from '@/lib/tipster-ai-simple'

export const dynamic = 'force-dynamic'

export async function POST() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🔄 Forzando rigenerazione tips per', today)
  
  try {
    // 1. Cancella tips esistenti dalle 5 tabelle
    await Promise.all([
      supabaseAdmin.from('tips_singola').delete().eq('valid_until', today),
      supabaseAdmin.from('tips_doppia').delete().eq('valid_until', today),
      supabaseAdmin.from('tips_tripla').delete().eq('valid_until', today),
      supabaseAdmin.from('tips_mista').delete().eq('valid_until', today),
      supabaseAdmin.from('tips_bomba').delete().eq('valid_until', today)
    ])
    
    // 2. Cancella anche da daily_tips se esiste
    await supabaseAdmin.from('daily_tips').delete().eq('date', today)
    
    console.log('🗑️ Tips vecchi cancellati da tutte le tabelle')
    
    // 3. Rigenera con il sistema SEMPLICE
    const result = await generateDailyTipsSimple()
    
    if (result.success) {
      console.log('✅ Nuovi tips generati con successo')
      
      // 4. Prendi i tips appena generati
      const { data: newTips } = await supabaseAdmin
        .from('tips_singola')
        .select('*')
        .eq('valid_until', today)
        .single()
      
      const { data: newDoppia } = await supabaseAdmin
        .from('tips_doppia')
        .select('*')
        .eq('valid_until', today)
        .single()
      
      return NextResponse.json({ 
        success: true, 
        message: 'Tips rigenerati con successo',
        tips: {
          singola: newTips,
          doppia: newDoppia,
          regenerated: true
        }
      })
    } else {
      console.error('❌ Errore rigenerazione:', result.message)
      return NextResponse.json({ 
        error: result.message || 'Errore nella rigenerazione' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Errore nel processo di rigenerazione:', error)
    return NextResponse.json({ 
      error: 'Errore interno durante la rigenerazione' 
    }, { status: 500 })
  }
}