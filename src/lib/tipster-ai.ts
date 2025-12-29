import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateDailyTips() {
  const today = new Date().toISOString().split('T')[0]
  
  // 1. Prendi partite di oggi da Supabase
  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('match_date', today)
    .order('match_time', { ascending: true })
  
  if (!matches || matches.length < 5) {
    console.log('⚠️ Meno di 5 partite oggi, tips limitati')
    return { success: false, message: 'Poche partite disponibili' }
  }
  
  console.log(`📊 ${matches.length} partite disponibili per oggi`)
  
  // 2. Prepara dati per GPT-4
  const matchesData = matches.map(m => ({
    fixture_id: m.fixture_id,
    home_team: m.home_team?.name || 'Casa',
    away_team: m.away_team?.name || 'Ospite',
    league: m.league_name,
    time: m.match_time,
    // PREDICTIONS da API-Football
    home_percent: parseInt(m.predictions?.predictions?.percent?.home) || 33,
    draw_percent: parseInt(m.predictions?.predictions?.percent?.draw) || 33,
    away_percent: parseInt(m.predictions?.predictions?.percent?.away) || 34,
    advice: m.predictions?.predictions?.advice || '',
    // QUOTE REALI
    odds_home: m.odds?.home || 2.00,
    odds_draw: m.odds?.draw || 3.20,
    odds_away: m.odds?.away || 3.50,
    odds_over_25: m.odds?.over_2_5 || 1.80,
    odds_under_25: m.odds?.under_2_5 || 1.90,
    odds_btts_yes: m.odds?.btts_yes || 1.75,
    odds_btts_no: m.odds?.btts_no || 2.00
  }))
  
  // 3. Genera tips con GPT-4o-mini
  const tips = await generateTipsWithGPT4(matchesData)
  
  // 4. Salva nel database
  await saveTipsToDatabase(tips, today)
  
  return { success: true, tips }
}

async function generateTipsWithGPT4(matches: any[]) {
  const numPartite = matches.length
  const showAll = numPartite >= 15
  
  const prompt = `
Sei TipsterAI, un esperto tipster italiano amichevole. Genera le proposte del giorno.

## PARTITE DISPONIBILI (${numPartite})
${JSON.stringify(matches, null, 2)}

## COSA GENERARE
${showAll ? '- SINGOLA, DOPPIA, TRIPLA, MISTA, BOMBA (tutte)' : '- SINGOLA e DOPPIA (solo queste, ci sono poche partite)'}

## REGOLE FONDAMENTALI

### PRIORITÀ CAMPIONATI (OBBLIGATORIO!)
Quando scegli le partite, dai PRIORITÀ in questo ordine:
1. 🇮🇹 Serie A - SEMPRE includere se disponibile e sensata!
2. 🏴 Premier League, 🇪🇸 La Liga, 🇩🇪 Bundesliga
3. 🇫🇷 Ligue 1, 🇮🇹 Serie B
4. Altri campionati

Se c'è Roma vs Genoa in Serie A, DEVE apparire in almeno una selezione!

### DIVERSIFICAZIONE (OBBLIGATORIO!)
- NON usare la stessa partita in più di 2 selezioni
- Se Norwich è in SINGOLA e DOPPIA → nelle altre metti partite DIVERSE
- Obiettivo: se una partita va male, non si perde tutto

❌ SBAGLIATO:
- Singola: Norwich 1X
- Doppia: Norwich 1X, Hull Under
- Tripla: Norwich 1X, Portsmouth 1
- Mista: Norwich 1X, ... (TROPPO NORWICH!)

✅ CORRETTO:
- Singola: Norwich 1X
- Doppia: Hull Under, Portsmouth 1  
- Tripla: Roma 1, Birmingham X2, Southampton Under
- Mista: Mix di TUTTE le partite diverse

### COERENZA STESSA PARTITA (IMPORTANTE!)
Se usi la stessa partita in più selezioni:
- Over → Over o simile (NON Under)
- Under → Under o simile (NON Over)
- 1 → 1 o 1X (NON 2 o X2)
- 2 → 2 o X2 (NON 1 o 1X)

❌ Singola: Middlesbrough 1 + Over 1.5 → Doppia: Middlesbrough Under (confusionario!)
✅ Singola: Middlesbrough 1 + Over 1.5 → Doppia: altra partita

### 1. SINGOLA (quota ~1.70)
- Scegli LA partita più sicura (priorità Serie A!)
- Puoi usare: 1, X, 2, 1X, X2, Over 2.5, Under 2.5, Gol, NoGol
- Oppure COMBO: "1 + Over 1.5" se la quota singola è troppo bassa
- Motivazione: breve, umana, convincente (NON "ha il 45%")

### 2. DOPPIA (quota totale ~2.00)
- 2 partite, massimo 1 uguale alla singola (se coerente)
- Moltiplica le quote: es. 1.45 × 1.38 = 2.00

### 3. TRIPLA (quota totale ~3.00) ${showAll ? '' : '- SKIP'}
- 3 partite, massimo 1 uguale alle precedenti
- Moltiplica le quote per arrivare a ~3.00

### 4. MISTA (moltiplicatore ~10x) ${showAll ? '' : '- SKIP'}
- 6-7 partite, tutte DIVERSE dalle altre selezioni
- Target: 10x il capitale

### 5. BOMBA (moltiplicatore 30x+) ${showAll ? '' : '- SKIP'}
- ESATTAMENTE 3 risultati esatti
- Quote indicative realistiche:
  * 1-0, 0-1: @6-8
  * 2-1, 1-2: @8-11  
  * 2-0, 0-2: @8-10
  * 1-1: @6-7
  * 3-1, 1-3: @13-17
  * 2-2: @11-14
- Scegli 3 risultati che moltiplicati diano 30+
- Es: 2-1 (@9) × 1-0 (@7) × 1-1 (@6) = 378 ✓

## STILE MOTIVAZIONI

❌ ROBOTICO: "Roma ha il 45% di probabilità di vittoria"
❌ GENERICO: "Squadra in forma"
✅ UMANO: "La Roma in casa è devastante, il Genoa non vince fuori da ottobre"
✅ SPECIFICO: "Il Norwich non perde in casa da 5 partite, il Watford è in crisi nera"

## OUTPUT JSON

{
  "singola": {
    "match": {
      "fixture_id": 123,
      "home_team": "...",
      "away_team": "...",
      "league": "...",
      "time": "..."
    },
    "prediction": "1 + Over 1.5",
    "odds": 1.72,
    "confidence": 75,
    "reasoning": "Motivazione breve e convincente, come la direbbe un amico"
  },
  
  "doppia": {
    "matches": [
      {
        "fixture_id": 123,
        "home_team": "...",
        "away_team": "...",
        "league": "...",
        "time": "...",
        "prediction": "1X",
        "odds": 1.44,
        "reasoning": "Motivazione breve"
      },
      {
        "fixture_id": 456,
        "home_team": "...",
        "away_team": "...",
        "league": "...",
        "time": "...",
        "prediction": "Under 2.5",
        "odds": 1.40,
        "reasoning": "Motivazione breve"
      }
    ],
    "total_odds": 2.02,
    "confidence": 70,
    "strategy": "Spiegazione della strategia complessiva"
  },
  
  ${showAll ? `
  "tripla": {
    "matches": [...],
    "total_odds": 3.05,
    "confidence": 62,
    "strategy": "..."
  },
  
  "mista": {
    "matches": [...],
    "total_odds": 10.5,
    "confidence": 35,
    "strategy": "..."
  },
  
  "bomba": {
    "matches": [
      {
        "fixture_id": 123,
        "home_team": "...",
        "away_team": "...",
        "prediction": "2-1",
        "odds": 8.50,
        "reasoning": "Perché questo risultato esatto"
      }
    ],
    "total_odds": 35.0,
    "confidence": 5,
    "strategy": "3 risultati esatti ragionati, non a caso"
  }
  ` : ''}
}

IMPORTANTE: Usa SOLO le quote fornite nei dati (odds_home, odds_draw, etc). NON inventare quote!
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' }
    })
    
    const tips = JSON.parse(response.choices[0].message.content || '{}')
    
    // Valida coerenza
    validateTipsCoherence(tips)
    
    console.log('✅ Tips generati con successo')
    return tips
    
  } catch (error) {
    console.error('❌ Errore GPT-4:', error)
    return null
  }
}

function validateTipsCoherence(tips: any) {
  // Mappa partita -> selezione
  const selections: Record<number, string[]> = {}
  
  const addSelection = (fixtureId: number, prediction: string) => {
    if (!selections[fixtureId]) selections[fixtureId] = []
    selections[fixtureId].push(prediction)
  }
  
  // Raccogli tutte le selezioni
  if (tips.singola?.match) {
    addSelection(tips.singola.match.fixture_id, tips.singola.prediction)
  }
  
  tips.doppia?.matches?.forEach((m: any) => addSelection(m.fixture_id, m.prediction))
  tips.tripla?.matches?.forEach((m: any) => addSelection(m.fixture_id, m.prediction))
  tips.mista?.matches?.forEach((m: any) => addSelection(m.fixture_id, m.prediction))
  tips.bomba?.matches?.forEach((m: any) => addSelection(m.fixture_id, m.prediction))
  
  // Verifica diversificazione
  for (const [fixtureId, preds] of Object.entries(selections)) {
    if (preds.length > 2) {
      console.warn(`⚠️ Troppa ripetizione fixture ${fixtureId}: ${preds.length} volte - ${preds.join(', ')}`)
    }
    
    if (preds.length > 1) {
      // Controlla contraddizioni
      const has1 = preds.some(p => p === '1' || p.includes('1 +'))
      const has2 = preds.some(p => p === '2' || p.includes('2 +'))
      const has1X = preds.some(p => p === '1X')
      const hasX2 = preds.some(p => p === 'X2')
      const hasOver = preds.some(p => p.includes('Over'))
      const hasUnder = preds.some(p => p.includes('Under'))
      
      // Contraddizioni risultato
      if ((has1 || has1X) && (has2 || hasX2)) {
        console.warn(`⚠️ Contraddizione risultato fixture ${fixtureId}: ${preds.join(', ')}`)
      }
      
      // Contraddizioni Over/Under
      if (hasOver && hasUnder) {
        console.warn(`⚠️ Contraddizione Over/Under fixture ${fixtureId}: ${preds.join(', ')}`)
      }
    }
  }
  
  // Verifica priorità Serie A
  const allMatches = [
    ...(tips.singola?.match ? [tips.singola.match] : []),
    ...(tips.doppia?.matches || []),
    ...(tips.tripla?.matches || []),
    ...(tips.mista?.matches || []),
    ...(tips.bomba?.matches || [])
  ]
  
  const hasSerieA = allMatches.some((m: any) => m.league?.includes('Serie A'))
  if (!hasSerieA) {
    console.log('⚠️ Nessuna partita di Serie A inclusa nei tips')
  } else {
    console.log('✅ Serie A presente nei tips')
  }
}

async function saveTipsToDatabase(tips: any, date: string) {
  if (!tips) return
  
  // Salva in daily_tips per il nuovo sistema
  const { error: dailyError } = await supabaseAdmin
    .from('daily_tips')
    .upsert({
      date: date,
      tips: tips,
      created_at: new Date().toISOString()
    }, { onConflict: 'date' })
  
  if (dailyError) {
    console.error('❌ Errore salvataggio daily_tips:', dailyError)
  }
  
  // Salva anche nelle 5 tabelle separate per compatibilità
  await saveTo5Tables(tips, date)
  
  console.log('💾 Tips salvati per', date)
}

async function saveTo5Tables(tips: any, date: string) {
  // SINGOLA
  if (tips.singola) {
    await supabaseAdmin.from('tips_singola').upsert({
      fixture_id: tips.singola.match.fixture_id,
      home_team: tips.singola.match.home_team,
      away_team: tips.singola.match.away_team,
      league: tips.singola.match.league,
      match_time: tips.singola.match.time,
      prediction: tips.singola.prediction,
      prediction_label: tips.singola.prediction.toUpperCase(),
      odds: tips.singola.odds,
      confidence: tips.singola.confidence,
      reasoning: tips.singola.reasoning,
      valid_until: date
    }, { onConflict: 'valid_until' })
  }
  
  // DOPPIA
  if (tips.doppia) {
    await supabaseAdmin.from('tips_doppia').upsert({
      matches: tips.doppia.matches,
      total_odds: tips.doppia.total_odds,
      confidence: tips.doppia.confidence,
      reasoning: tips.doppia.strategy,
      valid_until: date
    }, { onConflict: 'valid_until' })
  }
  
  // TRIPLA
  if (tips.tripla) {
    await supabaseAdmin.from('tips_tripla').upsert({
      matches: tips.tripla.matches,
      total_odds: tips.tripla.total_odds,
      confidence: tips.tripla.confidence,
      reasoning: tips.tripla.strategy,
      valid_until: date
    }, { onConflict: 'valid_until' })
  }
  
  // MISTA
  if (tips.mista) {
    await supabaseAdmin.from('tips_mista').upsert({
      matches: tips.mista.matches,
      total_odds: tips.mista.total_odds,
      confidence: tips.mista.confidence,
      reasoning: tips.mista.strategy,
      valid_until: date
    }, { onConflict: 'valid_until' })
  }
  
  // BOMBA
  if (tips.bomba) {
    await supabaseAdmin.from('tips_bomba').upsert({
      matches: tips.bomba.matches,
      total_odds: tips.bomba.total_odds,
      confidence: tips.bomba.confidence,
      reasoning: tips.bomba.strategy,
      valid_until: date
    }, { onConflict: 'valid_until' })
  }
  
  console.log('💾 Tips salvati anche nelle 5 tabelle separate')
}