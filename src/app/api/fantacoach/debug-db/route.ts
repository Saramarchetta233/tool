import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('🔍 Debug: testing Supabase connection...')
    
    // Test 1: Check if table exists
    const { data: tableData, error: tableError } = await supabase
      .from('players_serie_a')
      .select('*', { count: 'exact', head: true })
    
    if (tableError) {
      console.error('Table error:', tableError)
      return NextResponse.json({ 
        success: false,
        error: 'Table error: ' + tableError.message,
        step: 'checking_table'
      })
    }
    
    console.log('✅ Table exists, count:', tableData)
    
    // Test 2: Try to get a few rows
    const { data: sampleData, error: sampleError } = await supabase
      .from('players_serie_a')
      .select('*')
      .limit(5)
    
    if (sampleError) {
      console.error('Sample query error:', sampleError)
      return NextResponse.json({ 
        success: false,
        error: 'Sample query error: ' + sampleError.message,
        step: 'getting_sample_data'
      })
    }
    
    return NextResponse.json({ 
      success: true,
      table_exists: true,
      total_count: tableData,
      sample_data: sampleData,
      sample_count: sampleData?.length || 0
    })
    
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'general_error'
    })
  }
}