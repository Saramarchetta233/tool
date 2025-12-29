import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE() {
  console.log('🗑️ Force deleting ALL tips from V2 tables...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  // Delete from all 5 V2 tables
  const results = await Promise.all([
    supabase.from('tips_singola').delete().gte('id', 0),
    supabase.from('tips_doppia').delete().gte('id', 0),
    supabase.from('tips_tripla').delete().gte('id', 0),
    supabase.from('tips_mista').delete().gte('id', 0),
    supabase.from('tips_bomba').delete().gte('id', 0)
  ])
  
  const errors = results.filter(r => r.error).map(r => r.error)
  
  if (errors.length > 0) {
    console.error('❌ Errors during deletion:', errors)
    return NextResponse.json({ 
      error: 'Some deletions failed',
      details: errors 
    }, { status: 500 })
  }
  
  console.log('✅ All V2 tips deleted successfully')
  
  return NextResponse.json({ 
    message: 'All V2 tips deleted successfully',
    tables: ['tips_singola', 'tips_doppia', 'tips_tripla', 'tips_mista', 'tips_bomba']
  })
}

export async function GET() {
  return DELETE()
}