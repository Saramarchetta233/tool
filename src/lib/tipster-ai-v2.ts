import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateDailyTipsV2() {
  // Create fresh connection to avoid cache issues
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )

  // 1. Prendi tutte le partite di oggi da Supabase
  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)
  
  console.log(`🎯 TipsterAI V2: Generating tips for ${today}, current time: ${currentTime}`)
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('match_date', today)
    .gt('match_time', currentTime) // Solo partite non ancora iniziate
    .order('match_time', { ascending: true })
  
  if (error || !matches || matches.length === 0) {
    console.log('⚠️ Nessuna partita oggi')
    return { 
      success: false, 
      message: matches?.length === 0 ? 'Nessuna partita disponibile oggi' : 'Errore nel recupero partite'
    }
  }
  
  const numMatches = matches.length
  console.log(`📊 Trovate ${numMatches} partite per oggi`)
  
  // 2. Prepara i dati COMPLETI per ogni partita
  const matchesData = matches.map(m => {    
    return {
      fixture_id: m.fixture_id,
      home_team: m.home_team?.name || 'Casa',
      away_team: m.away_team?.name || 'Ospite',
      league: m.league_name,
      time: m.match_time,
      
      // PREDICTIONS DA API-FOOTBALL
      api_prediction: {
        advice: m.predictions?.advice || null,
        home_percent: parseInt(m.predictions?.home) || 33,
        draw_percent: parseInt(m.predictions?.draw) || 33,
        away_percent: parseInt(m.predictions?.away) || 34,
        confidence: m.predictions?.confidence || 50
      },
      
      // ODDS REALI COMPLETI 
      odds: {
        home: m.odds?.winner?.home || null,
        draw: m.odds?.winner?.draw || null,
        away: m.odds?.winner?.away || null,
        home_draw: m.odds?.doubleChance?.x1 || null,
        away_draw: m.odds?.doubleChance?.x2 || null,
        home_away: m.odds?.doubleChance?.x12 || null,
        over_1_5: m.odds?.goals?.over_1_5 || null,
        under_1_5: m.odds?.goals?.under_1_5 || null,
        over_2_5: m.odds?.goals?.over_2_5 || null,
        under_2_5: m.odds?.goals?.under_2_5 || null,
        over_3_5: m.odds?.goals?.over_3_5 || null,
        under_3_5: m.odds?.goals?.under_3_5 || null,
        btts_yes: m.odds?.goals?.btts || null,
        btts_no: m.odds?.goals?.nobtts || null
      }
    }
  })
  
  console.log(`🎯 Dati preparati per ${matchesData.length} partite con predictions e odds`)
  
  // 3. Genera tips in base al numero di partite
  const results = {
    success: true,
    singola: false,
    doppia: false,
    tripla: false,
    mista: false,
    bomba: false
  }
  
  // REGOLE AGGIORNATE:
  // 1+ partite: Singola
  // 2+ partite: Singola + Doppia
  // 3+ partite: + Tripla e Bomba
  // 5+ partite: + Mista (TUTTI)
  
  if (numMatches >= 1) {
    console.log('🎲 Generando SINGOLA...')
    const singola = await generateSingola(matchesData, supabase, today)
    results.singola = singola
  }
  
  if (numMatches >= 2) {
    console.log('🎲 Generando DOPPIA...')
    const doppia = await generateDoppia(matchesData, supabase, today)
    results.doppia = doppia
  }
  
  if (numMatches >= 3) {
    console.log('🎲 Generando TRIPLA e BOMBA...')
    const [tripla, bomba] = await Promise.all([
      generateTripla(matchesData, supabase, today),
      generateBomba(matchesData, supabase, today)
    ])
    results.tripla = tripla
    results.bomba = bomba
  }
  
  if (numMatches >= 5) {
    console.log('🎲 Generando MISTA...')
    const mista = await generateMista(matchesData, supabase, today)
    results.mista = mista
  }
  
  console.log('✅ Generazione completata:', results)
  return results
}

// SINGOLA: 1 partita con combo se necessario (1.70-2.50)
async function generateSingola(matches: any[], supabase: any, today: string) {
  const prompt = `Sei TipsterAI. Trova la MIGLIORE SINGOLA per oggi.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

DEVI trovare UNA partita con quota 1.70-2.50.
Se un favorito ha quota < 1.70, USA UNA COMBO:
- "1 + Over 1.5" 
- "1X + Under 3.5"
- "X2 + Over 1.5"
- "Multigol 1-3"

OUTPUT JSON:
{
  "fixture_id": 123,
  "home_team": "Milan",
  "away_team": "Monza",
  "league": "Serie A",
  "match_time": "15:00",
  "prediction": "1 + Over 1.5",
  "prediction_label": "MILAN VINCE + ALMENO 2 GOL",
  "odds": 1.85,
  "confidence": 75,
  "reasoning": "Milan favorito (65%), attacco prolifico. Combo offre valore."
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
    
    const singola = JSON.parse(response.choices[0].message.content || '{}')
    
    // Salva in tips_singola
    const { error } = await supabase
      .from('tips_singola')
      .upsert({
        ...singola,
        valid_until: today
      })
    
    if (error) {
      console.error('❌ Errore salvataggio singola:', error)
      return false
    }
    
    console.log('✅ Singola salvata')
    return true
    
  } catch (error) {
    console.error('❌ Errore generazione singola:', error)
    return false
  }
}

// DOPPIA: 2 partite combinate (1.90-3.50)
async function generateDoppia(matches: any[], supabase: any, today: string) {
  const prompt = `Sei TipsterAI. Crea la MIGLIORE DOPPIA per oggi.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

COMBINA 2 selezioni per ottenere quota totale 1.90-3.50.
Usa mercati diversi se necessario:
- 1X favoriti + Over/Under
- Due X2 non perdenti
- Combo creative

OUTPUT JSON:
{
  "matches": [
    {
      "fixture_id": 123,
      "home_team": "Milan",
      "away_team": "Monza",
      "league": "Serie A",
      "time": "15:00",
      "prediction": "1X",
      "prediction_label": "MILAN NON PERDE",
      "odds": 1.30,
      "confidence": 80,
      "reasoning": "Milan favorito in casa"
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A",
      "time": "18:00",
      "prediction": "Over 2.5",
      "prediction_label": "ALMENO 3 GOL",
      "odds": 1.65,
      "confidence": 70,
      "reasoning": "Partita aperta, attacchi prolifici"
    }
  ],
  "total_odds": 2.15,
  "confidence": 75,
  "strategy_reasoning": "Doppia equilibrata con favorito + over"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
    
    const doppia = JSON.parse(response.choices[0].message.content || '{}')
    
    // Salva in tips_doppia
    const { error } = await supabase
      .from('tips_doppia')
      .upsert({
        matches: doppia.matches,
        total_odds: doppia.total_odds,
        confidence: doppia.confidence,
        strategy_reasoning: doppia.strategy_reasoning,
        valid_until: today
      })
    
    if (error) {
      console.error('❌ Errore salvataggio doppia:', error)
      return false
    }
    
    console.log('✅ Doppia salvata')
    return true
    
  } catch (error) {
    console.error('❌ Errore generazione doppia:', error)
    return false
  }
}

// TRIPLA: 3 partite combinate (2.80-5.00)
async function generateTripla(matches: any[], supabase: any, today: string) {
  const prompt = `Sei TipsterAI. Crea la MIGLIORE TRIPLA per oggi.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

COMBINA 3 selezioni per ottenere quota totale 2.80-5.00.
MIX di mercati per bilanciare il rischio.

OUTPUT JSON:
{
  "matches": [
    {
      "fixture_id": 123,
      "home_team": "Milan",
      "away_team": "Monza",
      "league": "Serie A",
      "time": "15:00",
      "prediction": "1",
      "prediction_label": "MILAN VINCE",
      "odds": 1.65,
      "confidence": 70,
      "reasoning": "Milan favorito in casa"
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A",
      "time": "18:00",
      "prediction": "Over 2.5",
      "prediction_label": "ALMENO 3 GOL",
      "odds": 1.55,
      "confidence": 65,
      "reasoning": "Partita aperta con attacchi prolifici"
    },
    {
      "fixture_id": 789,
      "home_team": "Roma",
      "away_team": "Lecce",
      "league": "Serie A",
      "time": "20:45",
      "prediction": "1X",
      "prediction_label": "ROMA NON PERDE",
      "odds": 1.30,
      "confidence": 75,
      "reasoning": "Roma solida in casa"
    }
  ],
  "total_odds": 3.85,
  "confidence": 60,
  "strategy_reasoning": "Tripla bilanciata con favoriti e over goals"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
    
    const tripla = JSON.parse(response.choices[0].message.content || '{}')
    
    const { error } = await supabase
      .from('tips_tripla')
      .upsert({
        matches: tripla.matches,
        total_odds: tripla.total_odds,
        confidence: tripla.confidence,
        strategy_reasoning: tripla.strategy_reasoning,
        valid_until: today
      })
    
    return !error
    
  } catch (error) {
    console.error('❌ Errore generazione tripla:', error)
    return false
  }
}

// MISTA: 5-8 partite conservative (10-30x)
async function generateMista(matches: any[], supabase: any, today: string) {
  const prompt = `Sei TipsterAI. Crea la MIGLIORE MISTA per oggi.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

USA 6-8 selezioni conservative (quote 1.20-1.60) per arrivare a 10-30x totale.
Favoriti, Under 3.5, BTTS No, 1X/X2 sicuri.

OUTPUT JSON:
{
  "matches": [
    {
      "fixture_id": 123,
      "home_team": "Milan",
      "away_team": "Monza",
      "league": "Serie A",
      "time": "15:00",
      "prediction": "1X",
      "prediction_label": "MILAN NON PERDE",
      "odds": 1.25,
      "confidence": 85,
      "reasoning": "Milan squadra di categoria superiore, in casa difficilmente perde. Quota bassa ma sicura per la mista."
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A", 
      "time": "18:00",
      "prediction": "1",
      "prediction_label": "INTER VINCE",
      "odds": 1.30,
      "confidence": 80,
      "reasoning": "Inter capolista contro ultima in classifica. Vittoria praticamente certa, ideale per costruire la base della mista."
    }
    // ... altre 4-6 partite con stesso formato
  ],
  "total_odds": 18.5,
  "confidence": 30,
  "strategy_reasoning": "Combina 7 selezioni a basso rischio: favoriti netti, Under sicuri e doppia chance. Ogni scelta ha alta probabilità individuale per costruire un moltiplicatore interessante con rischio contenuto. Perfetta per puntate piccole con potenziale ritorno significativo."
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
    
    const mista = JSON.parse(response.choices[0].message.content || '{}')
    
    const { error } = await supabase
      .from('tips_mista')
      .upsert({
        matches: mista.matches,
        total_odds: mista.total_odds,
        confidence: mista.confidence,
        strategy_reasoning: mista.strategy_reasoning,
        valid_until: today
      })
    
    return !error
    
  } catch (error) {
    console.error('❌ Errore generazione mista:', error)
    return false
  }
}

// BOMBA: Risultati esatti o upset (30x+)
async function generateBomba(matches: any[], supabase: any, today: string) {
  const prompt = `Sei TipsterAI. Crea la MIGLIORE BOMBA per oggi con SOLO 3 RISULTATI ESATTI.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

DEVI scegliere SOLO 3 partite e prevedere il RISULTATO ESATTO (es: 2-1, 1-0, 2-2).
Usa le percentuali di vittoria e i pattern di gol per scegliere.

OUTPUT JSON:
{
  "matches": [
    {
      "fixture_id": 123,
      "home_team": "Milan", 
      "away_team": "Monza",
      "league": "Serie A",
      "time": "15:00",
      "prediction": "2-1",
      "prediction_label": "RISULTATO ESATTO 2-1",
      "odds": 8.5,
      "confidence": 15,
      "reasoning": "Milan favorito, difesa Monza vulnerabile"
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A",
      "time": "18:00", 
      "prediction": "3-0",
      "prediction_label": "RISULTATO ESATTO 3-0",
      "odds": 11.0,
      "confidence": 12,
      "reasoning": "Inter domina, Como in difficoltà"
    },
    {
      "fixture_id": 789,
      "home_team": "Roma",
      "away_team": "Lecce", 
      "league": "Serie A",
      "time": "20:45",
      "prediction": "1-0",
      "prediction_label": "RISULTATO ESATTO 1-0",
      "odds": 7.0,
      "confidence": 18,
      "reasoning": "Partita bloccata, pochi gol previsti"
    }
  ],
  "tip_type": "risultati_esatti",
  "total_odds": 654.5,
  "confidence": 5,
  "strategy_reasoning": "3 risultati esatti basati su favoriti e pattern storici di gol"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
    
    const bomba = JSON.parse(response.choices[0].message.content || '{}')
    
    const { error } = await supabase
      .from('tips_bomba')
      .upsert({
        matches: bomba.matches,
        tip_type: bomba.tip_type || 'risultati_esatti',
        total_odds: bomba.total_odds,
        confidence: bomba.confidence,
        strategy_reasoning: bomba.strategy_reasoning,
        valid_until: today
      })
    
    return !error
    
  } catch (error) {
    console.error('❌ Errore generazione bomba:', error)
    return false
  }
}

// FUNZIONE PER LEGGERE TUTTI I TIPS DEL GIORNO
export async function getTodayTipsV2() {
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
  
  return {
    singola: singola.data,
    doppia: doppia.data,
    tripla: tripla.data,
    mista: mista.data,
    bomba: bomba.data
  }
}