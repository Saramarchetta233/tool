import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { RealOddsManager, type RealOdds, type Selection, EXACT_SCORE_ODDS } from './real-odds-manager'

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
  
  if (numMatches < 3) {
    console.log(`⚠️ Non abbastanza partite per tripla (servono >=3, trovate ${numMatches})`)
  }
  
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
      
      // ODDS REALI COMPLETI - Struttura corretta per RealOddsManager
      odds: {
        winner: {
          home: m.odds?.winner?.home || null,
          draw: m.odds?.winner?.draw || null,
          away: m.odds?.winner?.away || null
        },
        doubleChance: {
          x1: m.odds?.doubleChance?.x1 || null,
          x2: m.odds?.doubleChance?.x2 || null,
          x12: m.odds?.doubleChance?.x12 || null
        },
        goals: {
          over_1_5: m.odds?.goals?.over_1_5 || null,
          under_1_5: m.odds?.goals?.under_1_5 || null,
          over_2_5: m.odds?.goals?.over_2_5 || null,
          under_2_5: m.odds?.goals?.under_2_5 || null,
          over_3_5: m.odds?.goals?.over_3_5 || null,
          under_3_5: m.odds?.goals?.under_3_5 || null,
          btts: m.odds?.goals?.btts || null,
          nobtts: m.odds?.goals?.nobtts || null
        }
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
  // OVERRIDE: Se c'è Roma vs Genoa, la forza come singola
  const romaMatch = matches.find(m => 
    (m.home_team === 'AS Roma' && m.away_team === 'Genoa') ||
    (m.league === 'Serie A' && (m.home_team?.includes('Roma') || m.away_team?.includes('Roma')))
  )
  
  if (romaMatch) {
    console.log('🇮🇹 OVERRIDE: Forzando Roma vs Genoa come singola (priorità Serie A)')
    
    // Chiedi a GPT-4 di scegliere la migliore selezione per Roma vs Genoa
    const romaPrompt = `Analizza questa partita Serie A e scegli la MIGLIORE selezione per singola.

PARTITA: ${romaMatch.home_team} vs ${romaMatch.away_team} (${romaMatch.league})

Quote disponibili:
- Casa (1): ${romaMatch.odds?.winner?.home || 'N/A'}
- Pareggio (X): ${romaMatch.odds?.winner?.draw || 'N/A'}  
- Ospite (2): ${romaMatch.odds?.winner?.away || 'N/A'}
- Casa non perde (1X): ${romaMatch.odds?.doubleChance?.x1 || 'N/A'}
- Ospite non perde (X2): ${romaMatch.odds?.doubleChance?.x2 || 'N/A'}
- Over 2.5: ${romaMatch.odds?.goals?.over_2_5 || 'N/A'}
- Under 2.5: ${romaMatch.odds?.goals?.under_2_5 || 'N/A'}
- Entrambe segnano: ${romaMatch.odds?.goals?.btts || 'N/A'}
- Non entrambe segnano: ${romaMatch.odds?.goals?.nobtts || 'N/A'}

NON c'è range di quota. Scegli la selezione PIÙ SENSATA per questa partita.
Roma in casa difficilmente perde. Considera 1, 1X, Under 2.5, Over 2.5, Gol, NoGol.
MAI X2 per squadra di casa forte!

OUTPUT JSON:
{
  "prediction": "Under 2.5",
  "confidence": 75,
  "reasoning": "La Roma gioca con prudenza in casa, il Genoa si difende"
}`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: romaPrompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
      
      const romaDecision = JSON.parse(response.choices[0].message.content || '{}')
      
      // Prendi la quota REALE per la decisione di GPT-4
      const realOdds = romaMatch.odds
      const realQuota = RealOddsManager.assignRealOdds(romaDecision.prediction, realOdds)
      
      const singola = {
        fixture_id: romaMatch.fixture_id,
        home_team: romaMatch.home_team,
        away_team: romaMatch.away_team,
        league: romaMatch.league,
        match_time: romaMatch.time,
        prediction: romaDecision.prediction,
        prediction_label: buildPredictionLabel(romaDecision.prediction, romaMatch.home_team, romaMatch.away_team),
        odds: realQuota,
        confidence: romaDecision.confidence,
        reasoning: romaDecision.reasoning,
        valid_until: today
      }
      
      console.log(`📊 Roma singola GPT-4: ${romaDecision.prediction} @${realQuota}`)
      
      const { error } = await supabase
        .from('tips_singola')
        .upsert(singola, { onConflict: 'valid_until' })
      
      if (!error) {
        console.log('✅ ROMA SINGOLA (GPT-4 + quote reali) salvata')
        return true
      } else {
        console.error('❌ Errore salvataggio Roma singola:', error)
        return false
      }
      
    } catch (error) {
      console.error('❌ Errore GPT-4 per Roma:', error)
      // Fallback al normale flusso
    }
  }

  const prompt = `Sei TipsterAI. Trova la MIGLIORE SINGOLA per oggi.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

## REGOLE PRIORITÀ CAMPIONATI (OBBLIGATORIO!)
1. 🇮🇹 Serie A - SEMPRE prioritaria se disponibile!
2. 🏴 Premier League, 🇪🇸 La Liga, 🇩🇪 Bundesliga  
3. 🇫🇷 Ligue 1, 🇮🇹 Serie B
4. Altri campionati

Se c'è Roma vs Genoa o altra Serie A, DEVE essere la singola!

## VERIFICA SERIE A
Partita disponibile: AS Roma vs Genoa alle 20:45 (Serie A)
QUESTA deve essere la singola se disponibile!

## STILE MOTIVAZIONI:
❌ ROBOTICO: "Roma ha il 45% di probabilità"
✅ UMANO: "La Roma in casa è devastante, il Genoa non vince fuori da ottobre"

⚠️ IMPORTANTE: NON generare quote! Il sistema le calcolerà dalle quote REALI del database.

COMPITO: Scegli SOLO:
1. Quale partita
2. Quale tipo di selezione (1, X, 2, 1X, X2, Over 2.5, Under 2.5, etc.)

Le quote verranno assegnate AUTOMATICAMENTE dal sistema.

OUTPUT JSON:
{
  "fixture_id": 123,
  "home_team": "Milan",
  "away_team": "Monza", 
  "league": "Serie A",
  "match_time": "15:00",
  "prediction": "1X",
  "confidence": 75,
  "reasoning": "Milan favorito in casa, doppia chance sicura"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
    
    const gptSelection = JSON.parse(response.choices[0].message.content || '{}')
    
    // Trova il match corrispondente per le quote reali
    const selectedMatch = matches.find(m => m.fixture_id === gptSelection.fixture_id)
    if (!selectedMatch) {
      console.error('❌ Match non trovato per fixture_id:', gptSelection.fixture_id)
      return false
    }
    
    // Assegna quota REALE dal database
    const realOdds = selectedMatch.odds as RealOdds
    if (!realOdds) {
      console.error('❌ Odds non disponibili per match:', selectedMatch.fixture_id)
      return false
    }
    
    let realQuota = RealOddsManager.assignRealOdds(gptSelection.prediction, realOdds)
    
    // La quota ora ha sempre un fallback ragionevole
    
    // Verifica che sia nel range singola
    if (!RealOddsManager.validateOddsRange(realQuota, 'singola')) {
      console.warn(`⚠️ Quota ${realQuota} fuori range singola, cerco alternativa...`)
      
      // Trova alternativa nel range DATABASE
      const bestSelection = RealOddsManager.findBestSelectionForTarget(realOdds, 1.70, 2.50)
      
      if (bestSelection.odds === 0) {
        console.error(`❌ Nessuna quota reale alternativa disponibile per singola`)
        return false
      }
      
      gptSelection.prediction = bestSelection.prediction
      realQuota = bestSelection.odds
    }
    
    const singola = {
      ...gptSelection,
      prediction_label: buildPredictionLabel(
        gptSelection.prediction,
        selectedMatch.home_team?.name || selectedMatch.home_team,
        selectedMatch.away_team?.name || selectedMatch.away_team
      ),
      odds: realQuota,  // QUOTA REALE!
      valid_until: today
    }
    
    console.log(`📊 Singola con quota REALE: ${singola.prediction} @${singola.odds}`)
    
    // Salva in tips_singola (tabella separata)
    const { error } = await supabase
      .from('tips_singola')
      .upsert(singola, { onConflict: 'valid_until' })
    
    if (error) {
      console.error('❌ Errore salvataggio singola:', error)
      return false
    }
    
    console.log('✅ Singola (quote reali) salvata')
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

## REGOLE DIVERSIFICAZIONE (OBBLIGATORIO!)
- USA partite DIVERSE dalla singola (massimo 1 uguale, se coerente)
- Se nella singola c'è Roma, nella doppia usa altre partite
- Obiettivo: se una partita va male, non si perde tutto

## REGOLE COERENZA
Se usi una partita della singola:
- Over → Over o simile (NON Under)
- Under → Under o simile (NON Over) 
- 1 → 1 o 1X (NON 2 o X2)

## STILE MOTIVAZIONI:
✅ UMANO: "Norwich non perde in casa da 5 partite, Watford in crisi"

⚠️ IMPORTANTE: NON generare quote! Il sistema le calcolerà dalle quote REALI del database.

COMPITO: Scegli SOLO 2 partite e i tipi di selezione. Varia: usa 1, X, 2, 1X, X2, Over 2.5, Under 2.5, Gol, NoGol.

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
      "confidence": 80,
      "reasoning": "Milan favorito in casa, difficile che perda"
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A", 
      "time": "18:00",
      "prediction": "Over 2.5",
      "confidence": 70,
      "reasoning": "Partita aperta, entrambe segnano"
    }
  ],
  "confidence": 75,
  "strategy_reasoning": "Due selezioni sicure combinate"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
    
    const gptDoppia = JSON.parse(response.choices[0].message.content || '{}')
    
    // Assegna quote REALI a ogni match
    const matchesWithRealOdds = []
    let totalOdds = 1
    
    for (const gptMatch of gptDoppia.matches) {
      // Trova il match nel database
      const dbMatch = matches.find(m => m.fixture_id === gptMatch.fixture_id)
      if (!dbMatch || !dbMatch.odds) {
        console.error('❌ Match o odds non trovate per fixture_id:', gptMatch.fixture_id)
        continue
      }
      
      // Assegna quota REALE
      const realOdds = dbMatch.odds as RealOdds
      const realQuota = RealOddsManager.assignRealOdds(gptMatch.prediction, realOdds)
      
      // Le quote ora hanno sempre un fallback
      
      const matchWithRealOdds = {
        ...gptMatch,
        prediction_label: buildPredictionLabel(
          gptMatch.prediction,
          gptMatch.home_team,
          gptMatch.away_team
        ),
        odds: realQuota  // QUOTA REALE!
      }
      
      matchesWithRealOdds.push(matchWithRealOdds)
      totalOdds *= realQuota
      
      console.log(`📊 Doppia match: ${gptMatch.prediction} @${realQuota} (REALE)`)
    }
    
    // Verifica range doppia DATABASE (1.90-3.50)
    if (totalOdds < 1.90 || totalOdds > 3.50) {
      console.warn(`⚠️ Doppia fuori range database: @${totalOdds.toFixed(2)}, ma salvando comunque`)
    }
    
    const doppia = {
      matches: matchesWithRealOdds,
      total_odds: Math.round(totalOdds * 100) / 100,
      confidence: gptDoppia.confidence,
      strategy_reasoning: gptDoppia.strategy_reasoning || "Due selezioni combinate con quote reali",
      valid_until: today
    }
    
    // Salva in tips_doppia (tabella separata)
    const { error } = await supabase
      .from('tips_doppia')
      .upsert(doppia, { onConflict: 'valid_until' })
    
    if (error) {
      console.error('❌ Errore salvataggio doppia:', error)
      return false
    }
    
    console.log('✅ Doppia (quote reali) salvata')
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

COMBINA 3 selezioni per ottenere quota totale 3.00-3.50 (OBBLIGATORIO!).
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
      }, { onConflict: 'valid_until' })
    
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

⚠️ IMPORTANTE: NON generare quote! Il sistema le calcolerà dalle quote REALI del database.

USA 6-7 selezioni per quota totale MINIMO 10.0. MESCOLA:
- MAX 2 doppie chance conservative (1X, X2) @1.2-1.4  
- 2-3 risultati favoriti (1, 2) @1.6-2.2
- 2-3 Goals/BTTS (Over 2.5, Under 2.5, Gol, NoGol) @1.7-2.1

OBIETTIVO: 7 selezioni che moltiplicate danno 10-25x

STILE MOTIVAZIONI:
✅ UMANO: "La Roma in casa è solida, solitamente fa meno di 3 gol"
❌ ROBOTICO: "Quota reale da database"

COMPITO: Scegli SOLO 6-7 partite e tipi di selezione. Le quote verranno assegnate dal sistema.

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
      "confidence": 85,
      "reasoning": "Milan squadra di categoria superiore, in casa difficilmente perde"
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A", 
      "time": "18:00",
      "prediction": "Over 1.5",
      "confidence": 80,
      "reasoning": "Inter attacco prolifico, Como difesa permeabile"
    }
    // ... altre 4-5 partite con varietà di mercati
  ],
  "confidence": 30,
  "strategy_reasoning": "Selezioni conservative variegate per moltiplicatore interessante"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
    
    const gptMista = JSON.parse(response.choices[0].message.content || '{}')
    
    // Assegna quote REALI a ogni match
    const matchesWithRealOdds = []
    let totalOdds = 1
    
    for (const gptMatch of gptMista.matches) {
      // Trova il match nel database
      const dbMatch = matches.find(m => m.fixture_id === gptMatch.fixture_id)
      if (!dbMatch || !dbMatch.odds) {
        console.error('❌ Match o odds non trovate per fixture_id:', gptMatch.fixture_id)
        continue
      }
      
      // Assegna quota REALE
      const realOdds = dbMatch.odds as RealOdds
      const realQuota = RealOddsManager.assignRealOdds(gptMatch.prediction, realOdds)
      
      // Le quote ora hanno sempre un fallback
      
      const matchWithRealOdds = {
        ...gptMatch,
        prediction_label: buildPredictionLabel(
          gptMatch.prediction,
          gptMatch.home_team,
          gptMatch.away_team
        ),
        odds: realQuota  // QUOTA REALE!
      }
      
      matchesWithRealOdds.push(matchWithRealOdds)
      totalOdds *= realQuota
      
      console.log(`📊 Mista match: ${gptMatch.prediction} @${realQuota} (REALE)`)
    }
    
    const mista = {
      matches: matchesWithRealOdds,
      total_odds: Math.round(totalOdds * 100) / 100,
      confidence: gptMista.confidence,
      strategy_reasoning: gptMista.strategy_reasoning || "Selezioni conservative variegate con quote reali",
      valid_until: today
    }
    
    const { error } = await supabase
      .from('tips_mista')
      .upsert(mista, { onConflict: 'valid_until' })
    
    if (error) {
      console.error('❌ Errore salvataggio mista:', error)
      return false
    }
    
    console.log('✅ Mista (quote reali) salvata')
    return true
    
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
      }, { onConflict: 'valid_until' })
    
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

// Helper function per Roma reasoning coerente con prediction
function getRomaReasoning(prediction: string): string {
  switch(prediction.toLowerCase().trim()) {
    case '1':
      return `La Roma in casa è devastante, il Genoa non vince in trasferta da mesi`
    case 'x':
      return `Partita equilibrata, Roma senza pressioni e Genoa che sa difendersi`
    case '2':
      return `Il Genoa ha bisogno di punti, la Roma attraversa un momento difficile`
    case '1x':
      return `La Roma in casa difficilmente perde, il Genoa non è in grande forma`
    case 'x2':
      return `Il Genoa può strappare almeno un punto, la Roma non è imbattibile`
    case 'over 2.5':
      return `Entrambe le squadre hanno attacchi prolifici, partita aperta`
    case 'under 2.5':
      return `La Roma gioca con prudenza, il Genoa si chiude dietro`
    case 'gol':
    case 'btts':
      return `Entrambe segnano: la Roma in attacco e il Genoa ha bisogno di fare gol`
    case 'nogol':
      return `Una delle due non segna: difese attente e pochi spazi`
    default:
      return `La Roma favorita ma il Genoa può dire la sua`
  }
}

// Helper function per costruire label prediction
function buildPredictionLabel(prediction: string, homeTeam: string, awayTeam: string): string {
  const home = homeTeam?.toUpperCase() || 'CASA'
  const away = awayTeam?.toUpperCase() || 'OSPITE'
  
  switch(prediction.toLowerCase().trim()) {
    case '1': return `${home} VINCE`
    case 'x': return 'PAREGGIO'
    case '2': return `${away} VINCE`
    case '1x': return `${home} NON PERDE`
    case 'x2': return `${away} NON PERDE`
    case '12': return 'VITTORIA (CASA O OSPITE)'
    case 'over 1.5': return 'ALMENO 2 GOL'
    case 'under 1.5': return 'MASSIMO 1 GOL'
    case 'over 2.5': return 'ALMENO 3 GOL'
    case 'under 2.5': return 'MASSIMO 2 GOL'
    case 'over 3.5': return 'ALMENO 4 GOL'
    case 'under 3.5': return 'MASSIMO 3 GOL'
    case 'gol': case 'btts': return 'ENTRAMBE SEGNANO'
    case 'nogol': case 'no btts': return 'NON ENTRAMBE SEGNANO'
    default: return prediction.toUpperCase()
  }
}