import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Crea tabella players_serie_a
    const { error: playersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS players_serie_a (
          id INTEGER PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          position VARCHAR(1) NOT NULL CHECK (position IN ('P', 'D', 'C', 'A')),
          team VARCHAR(255) NOT NULL,
          team_id INTEGER,
          goals INTEGER DEFAULT 0,
          assists INTEGER DEFAULT 0,
          yellow_cards INTEGER DEFAULT 0,
          red_cards INTEGER DEFAULT 0,
          clean_sheets INTEGER DEFAULT 0,
          games_played INTEGER DEFAULT 0,
          titolarita INTEGER DEFAULT 0 CHECK (titolarita >= 0 AND titolarita <= 100),
          media_voto DECIMAL(3,1) DEFAULT 6.0 CHECK (media_voto >= 4.0 AND media_voto <= 10.0),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_players_name ON players_serie_a(name);
        CREATE INDEX IF NOT EXISTS idx_players_team ON players_serie_a(team);
        CREATE INDEX IF NOT EXISTS idx_players_position ON players_serie_a(position);
        CREATE INDEX IF NOT EXISTS idx_players_updated_at ON players_serie_a(updated_at);
      `
    })

    if (playersError) {
      console.error('Errore creazione tabella players_serie_a:', playersError)
    } else {
      console.log('✅ Tabella players_serie_a creata')
    }

    // Crea tabella fantacoach_fixtures_cache (se non esiste già)
    const { error: fixturesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS fantacoach_fixtures_cache (
          id SERIAL PRIMARY KEY,
          round VARCHAR(255),
          fixtures JSONB NOT NULL,
          cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_fixtures_cached_at ON fantacoach_fixtures_cache(cached_at);
      `
    })

    if (fixturesError) {
      console.error('Errore creazione tabella fixtures cache:', fixturesError)
    } else {
      console.log('✅ Tabella fantacoach_fixtures_cache creata')
    }

    return NextResponse.json({
      success: true,
      message: 'Tabelle create con successo',
      tables: ['players_serie_a', 'fantacoach_fixtures_cache'],
      errors: {
        players: playersError?.message || null,
        fixtures: fixturesError?.message || null
      }
    })

  } catch (error) {
    console.error('❌ Errore setup tabelle:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}