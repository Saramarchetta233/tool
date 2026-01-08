import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Conta giocatori in cache
    const { count, error } = await supabase
      .from('players_serie_a')
      .select('*', { count: 'exact', head: true })
    
    // Controlla ultima data aggiornamento
    const { data: lastUpdate } = await supabase
      .from('players_serie_a')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    // Controlla se ci sono dati nelle ultime 24h
    const isCacheValid = lastUpdate && 
      new Date(lastUpdate.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    return NextResponse.json({
      totalPlayers: count || 0,
      lastUpdate: lastUpdate?.updated_at || null,
      cacheValid: isCacheValid,
      cacheAge: lastUpdate ? 
        Math.round((Date.now() - new Date(lastUpdate.updated_at).getTime()) / 1000 / 60) + ' minuti' : 
        'mai aggiornato',
      apiStatus: 'online',
      message: count && count > 0 ? 
        `Database contiene ${count} giocatori Serie A` : 
        'Database vuoto, chiamare /api/fantacoach/players per popolare'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      totalPlayers: 0,
      apiStatus: 'error'
    }, { status: 500 })
  }
}