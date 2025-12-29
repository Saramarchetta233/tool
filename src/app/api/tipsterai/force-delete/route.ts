import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  console.log('🔥 FORCE DELETE: Eliminando definitivamente i tips di test...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    // Prima vediamo cosa c'è
    const { data: beforeDelete, error: queryError } = await supabase
      .from('tips')
      .select('id, tip_type, valid_until, matches')
      .order('id')
    
    console.log('📊 Tips prima della cancellazione:')
    beforeDelete?.forEach(tip => {
      console.log(`ID ${tip.id}: ${tip.tip_type} - ${tip.valid_until} - ${tip.matches?.[0]?.match}`)
    })
    
    // Elimina specificamente il tip ID 7 (Test vs Test)
    const { error: deleteError1 } = await supabase
      .from('tips')
      .delete()
      .eq('id', 7)
    
    if (deleteError1) {
      console.error('❌ Errore cancellazione ID 7:', deleteError1)
    } else {
      console.log('✅ Cancellato tip ID 7')
    }
    
    // Elimina anche ID 6 (Modena vs Monza)
    const { error: deleteError2 } = await supabase
      .from('tips')
      .delete()
      .eq('id', 6)
    
    if (deleteError2) {
      console.error('❌ Errore cancellazione ID 6:', deleteError2)
    } else {
      console.log('✅ Cancellato tip ID 6')
    }
    
    // Elimina tutti i tips che contengono "Test" nel match
    const { error: deleteError3 } = await supabase
      .from('tips')
      .delete()
      .ilike('reasoning', '%test%')
    
    if (deleteError3) {
      console.error('❌ Errore cancellazione tips test:', deleteError3)
    } else {
      console.log('✅ Cancellati tutti i tips di test')
    }
    
    // Verifica finale
    const { data: afterDelete, error: finalError } = await supabase
      .from('tips')
      .select('id, tip_type, valid_until, matches')
      .order('id')
    
    console.log('📊 Tips dopo cancellazione:')
    afterDelete?.forEach(tip => {
      console.log(`ID ${tip.id}: ${tip.tip_type} - ${tip.valid_until} - ${tip.matches?.[0]?.match}`)
    })
    
    return NextResponse.json({
      success: true,
      before: beforeDelete?.length || 0,
      after: afterDelete?.length || 0,
      deleted: (beforeDelete?.length || 0) - (afterDelete?.length || 0),
      remainingTips: afterDelete?.map(tip => ({
        id: tip.id,
        tip_type: tip.tip_type,
        match: tip.matches?.[0]?.match
      })) || []
    })
    
  } catch (error: any) {
    console.error('❌ Force delete error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}