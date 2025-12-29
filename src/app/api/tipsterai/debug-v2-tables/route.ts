import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const today = new Date().toISOString().split('T')[0]
  
  const [singola, doppia, tripla, mista, bomba] = await Promise.all([
    supabase.from('tips_singola').select('*').eq('valid_until', today).single(),
    supabase.from('tips_doppia').select('*').eq('valid_until', today).single(),
    supabase.from('tips_tripla').select('*').eq('valid_until', today).single(),
    supabase.from('tips_mista').select('*').eq('valid_until', today).single(),
    supabase.from('tips_bomba').select('*').eq('valid_until', today).single()
  ])
  
  return NextResponse.json({
    singola: singola.data || singola.error,
    doppia: doppia.data || doppia.error,
    tripla: tripla.data || tripla.error,
    mista: mista.data || mista.error,
    bomba: bomba.data || bomba.error
  })
}