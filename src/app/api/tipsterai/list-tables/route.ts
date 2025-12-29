import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  console.log('🔍 Listing all tables and checking tips table schema...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    // Try to query the information schema to see all tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables') // This might not work, but let's try
      .then(result => result)
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }))
    
    // Check tips table structure
    const { data: tipsStructure, error: structureError } = await supabase
      .from('tips')
      .select('*')
      .limit(1)
    
    // Try to get all table names by querying a known system view
    const { data: systemTables, error: systemError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .then(result => result)
      .catch(() => ({ data: null, error: { message: 'Cannot access information_schema' } }))
    
    // Get current tips count and sample data
    const { data: currentTips, error: tipsError } = await supabase
      .from('tips')
      .select('id, tip_type, valid_until, created_at')
      .order('id', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      success: true,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeyEnd: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8),
      tables: {
        rpcResult: tables?.data || null,
        rpcError: tablesError?.message || null,
        systemTables: systemTables?.data || null,
        systemError: systemError?.message || null
      },
      tipsTable: {
        structure: tipsStructure?.[0] || null,
        structureError: structureError?.message || null,
        currentCount: currentTips?.length || 0,
        currentTips: currentTips || [],
        tipsError: tipsError?.message || null
      }
    })
    
  } catch (error: any) {
    console.error('❌ List tables error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}