import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET() {
  try {
    // Rimuovi il tip di test
    const { error } = await supabaseAdmin
      .from('tips')
      .delete()
      .eq('tip_type', 'singola')
      .eq('valid_until', '2025-12-27')
      .like('matches->0->match', '%Test vs Test%')
    
    return NextResponse.json({
      success: true,
      message: 'Test tip removed',
      error
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}