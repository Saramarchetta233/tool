import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  const today = new Date().toISOString().split('T')[0]
  
  // Controlla tutte le tabelle tips
  const [singola, doppia, tripla, mista, bomba, serieA] = await Promise.all([
    supabase.from('tips_singola').select('*').eq('valid_until', today),
    supabase.from('tips_doppia').select('*').eq('valid_until', today),
    supabase.from('tips_tripla').select('*').eq('valid_until', today),
    supabase.from('tips_mista').select('*').eq('valid_until', today),
    supabase.from('tips_bomba').select('*').eq('valid_until', today),
    supabase.from('tips_serie_a').select('*').eq('valid_until', today)
  ])
  
  return NextResponse.json({
    today,
    tables: {
      tips_singola: {
        count: singola.data?.length || 0,
        error: singola.error?.message || null,
        data: singola.data || []
      },
      tips_doppia: {
        count: doppia.data?.length || 0,
        error: doppia.error?.message || null,
        data: doppia.data || []
      },
      tips_tripla: {
        count: tripla.data?.length || 0,
        error: tripla.error?.message || null,
        data: tripla.data || []
      },
      tips_mista: {
        count: mista.data?.length || 0,
        error: mista.error?.message || null,
        data: mista.data || []
      },
      tips_bomba: {
        count: bomba.data?.length || 0,
        error: bomba.error?.message || null,
        data: bomba.data || []
      },
      tips_serie_a: {
        count: serieA.data?.length || 0,
        error: serieA.error?.message || null,
        data: serieA.data || []
      }
    }
  })
}