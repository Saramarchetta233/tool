import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  console.log('💥 FORCE DELETING ALL TIPS...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  try {
    // Delete ALL tips from database - Delete specific ID first
    const { data: deleteData, error: deleteError } = await supabase
      .from('tips')
      .delete()
      .eq('id', 38) // Delete that persistent tip
    
    console.log('🗑️ Delete tip 38 result:', { deleteData, deleteError })
    
    // Then delete everything else  
    const { data, error } = await supabase
      .from('tips')
      .delete()
      .gte('id', 0) // Delete all rows including ID 0 and above
    
    if (error) {
      console.error('❌ Delete error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }
    
    console.log('✅ ALL TIPS DELETED')
    
    // Verify deletion
    const { data: remaining, error: countError } = await supabase
      .from('tips')
      .select('count', { count: 'exact' })
    
    return NextResponse.json({
      success: true,
      message: `ALL tips deleted from database`,
      remaining_tips: remaining?.length || 0
    })
    
  } catch (error: any) {
    console.error('❌ Force delete error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}