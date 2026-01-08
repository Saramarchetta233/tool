import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🧪 Testing Supabase connection and creating sample data...')
    
    // Test di connessione
    const { data: testData, error: testError } = await supabase
      .from('players_serie_a')
      .select('count(*)')
      .limit(1)
    
    if (testError) {
      console.log('❌ Tabella players_serie_a non esiste, creiamola tramite dashboard Supabase')
      
      // Ritorna le istruzioni per creare la tabella
      return NextResponse.json({
        success: false,
        message: 'Tabella players_serie_a non trovata. Creala tramite Supabase Dashboard:',
        sql: `
CREATE TABLE players_serie_a (
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
        `,
        error: testError.message
      })
    }
    
    console.log('✅ Tabella exists, inserting sample data...')
    
    // Dati di esempio per test
    const samplePlayers = [
      {
        id: 1,
        name: 'Lautaro Martinez',
        position: 'A',
        team: 'Inter',
        team_id: 505,
        goals: 10,
        assists: 4,
        yellow_cards: 3,
        red_cards: 0,
        clean_sheets: 0,
        games_played: 16,
        titolarita: 95,
        media_voto: 7.3
      },
      {
        id: 2,
        name: 'Khvicha Kvaratskhelia',
        position: 'A',
        team: 'Napoli',
        team_id: 492,
        goals: 6,
        assists: 7,
        yellow_cards: 2,
        red_cards: 0,
        clean_sheets: 0,
        games_played: 15,
        titolarita: 85,
        media_voto: 7.2
      },
      {
        id: 3,
        name: 'Alessandro Bastoni',
        position: 'D',
        team: 'Inter',
        team_id: 505,
        goals: 2,
        assists: 4,
        yellow_cards: 3,
        red_cards: 0,
        clean_sheets: 7,
        games_played: 16,
        titolarita: 88,
        media_voto: 6.9
      }
    ]
    
    // Cancella dati vecchi
    await supabase
      .from('players_serie_a')
      .delete()
      .neq('id', 0)
    
    // Inserisci dati di test
    const { data, error } = await supabase
      .from('players_serie_a')
      .insert(samplePlayers)
    
    if (error) {
      throw error
    }
    
    console.log('✅ Sample data inserted successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Dati di test inseriti con successo',
      inserted: samplePlayers.length,
      players: samplePlayers
    })
    
  } catch (error) {
    console.error('❌ Errore test setup:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}