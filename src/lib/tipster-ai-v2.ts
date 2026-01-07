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
    bomba: false,
    serieA: false
  }
  
  // REGOLE FINALI:
  // 10+ partite: TUTTE le proposte (singola, doppia, tripla, mista, bomba)
  // 5+ partite: SINGOLA + DOPPIA (almeno queste due)
  // Meno di 5: regole progressive
  
  if (numMatches >= 10) {
    console.log(`🎯 Trovate ${numMatches} partite (>=10), generando TUTTE le proposte!`)
    
    // Genera tutto in parallelo per velocità
    const [singola, doppia, tripla, mista, bomba] = await Promise.all([
      generateSingola(matchesData, supabase, today),
      generateDoppia(matchesData, supabase, today),
      generateTripla(matchesData, supabase, today),
      generateMista(matchesData, supabase, today),
      generateBomba(matchesData, supabase, today)
    ])
    
    results.singola = singola
    results.doppia = doppia
    results.tripla = tripla
    results.mista = mista
    results.bomba = bomba
  } else if (numMatches >= 5) {
    console.log(`🎯 Trovate ${numMatches} partite (>=5), generando SINGOLA + DOPPIA obbligatorie + altre se possibili`)
    
    // SEMPRE singola e doppia con 5+ partite
    const [singola, doppia] = await Promise.all([
      generateSingola(matchesData, supabase, today),
      generateDoppia(matchesData, supabase, today)
    ])
    
    results.singola = singola
    results.doppia = doppia
    
    // Aggiungi altre se possibile
    if (numMatches >= 7) {
      console.log('🎲 Aggiungendo TRIPLA e BOMBA...')
      const [tripla, bomba] = await Promise.all([
        generateTripla(matchesData, supabase, today),
        generateBomba(matchesData, supabase, today)
      ])
      results.tripla = tripla
      results.bomba = bomba
    }
    
    if (numMatches >= 8) {
      console.log('🎲 Aggiungendo MISTA...')
      const mista = await generateMista(matchesData, supabase, today)
      results.mista = mista
    }
  } else {
    // Regole progressive per meno di 5 partite
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
      console.log('🎲 Generando TRIPLA...')
      const tripla = await generateTripla(matchesData, supabase, today)
      results.tripla = tripla
    }
  }
  
  // SEMPRE: Se ci sono partite di Serie A (anche domani), genera la sesta proposta
  const serieAMatches = matchesData.filter(m => m.league === 'Serie A' || m.league.includes('Serie A'))
  if (serieAMatches.length > 0) {
    console.log(`🇮🇹 Trovate ${serieAMatches.length} partite di Serie A oggi, generando proposta speciale Serie A...`)
    const serieA = await generateSerieASpecial(serieAMatches, matchesData, supabase, today)
    results.serieA = serieA
  } else {
    console.log('🇮🇹 Verifico partite Serie A per domani...')
    // Controlla anche domani per Serie A
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const { data: tomorrowMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('match_date', tomorrowStr)
      .or('league_name.ilike.%Serie A%')
      .order('match_time', { ascending: true })
    
    if (tomorrowMatches && tomorrowMatches.length > 0) {
      console.log(`🇮🇹 Trovate ${tomorrowMatches.length} partite Serie A domani, generando proposta speciale...`)
      
      // Prepara dati partite di domani
      const tomorrowData = tomorrowMatches.map(m => ({
        fixture_id: m.fixture_id,
        home_team: m.home_team?.name || 'Casa',
        away_team: m.away_team?.name || 'Ospite',
        league: m.league_name,
        time: m.match_time,
        date: m.match_date,
        api_prediction: {
          advice: m.predictions?.advice || null,
          home_percent: parseInt(m.predictions?.home) || 33,
          draw_percent: parseInt(m.predictions?.draw) || 33,
          away_percent: parseInt(m.predictions?.away) || 34,
          confidence: m.predictions?.confidence || 50
        },
        odds: {
          winner: m.odds?.winner || {},
          doubleChance: m.odds?.doubleChance || {},
          goals: m.odds?.goals || {}
        }
      }))
      
      const serieA = await generateSerieASpecial(tomorrowData, matchesData.concat(tomorrowData), supabase, today)
      results.serieA = serieA
    }
  }
  
  console.log('✅ Generazione completata:', results)
  return results
}

// SINGOLA: 1 partita con analisi OpenAI intelligente (1.1-10.0)
async function generateSingola(matches: any[], supabase: any, today: string): Promise<boolean> {
  console.log(`🎯 Generando SINGOLA con OpenAI da ${matches.length} partite disponibili`)
  
  const prompt = `Sei TipsterAI, analizza le partite e crea la MIGLIORE SINGOLA per oggi.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

USA LE QUOTE REALI FORNITE! NON inventare quote.

CONSTRAINT DATABASE: odds DEVE essere tra 1.1 e 10.0 (obbligatorio per il salvataggio).

Scegli LA MIGLIORE partita e selezione basandoti su:
- Analisi tecnico-tattica delle squadre
- Form recente e motivazioni
- Quote value e probabilità reali
- Contesto della partita

OUTPUT JSON:
{
  "fixture_id": 123456,
  "home_team": "Milan",
  "away_team": "Monza",
  "league": "Serie A",
  "match_time": "15:00",
  "prediction": "1",
  "prediction_label": "MILAN VINCE",
  "odds": 1.65,
  "confidence": 80,
  "reasoning": "Milan in forma eccellente in casa, Monza in difficoltà in trasferta. Quote value interessante.",
  "valid_until": "${today}"
}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Tentativo ${attempt}/3 per generare singola`)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
      
      const gptSingola = JSON.parse(response.choices[0].message.content || '{}')
      
      // Trova il match originale per assegnare quote REALI
      const originalMatch = matches.find(m => m.fixture_id === gptSingola.fixture_id)
      if (!originalMatch || !originalMatch.odds) {
        throw new Error(`Match con fixture_id ${gptSingola.fixture_id} non trovato o senza odds`)
      }
      
      // Assegna quota REALE dal database
      const realOdds = RealOddsManager.assignRealOdds(gptSingola.prediction, originalMatch.odds)
      
      // VALIDAZIONE CONSTRAINT DATABASE: odds deve essere 1.1-10.0
      if (!realOdds || isNaN(realOdds) || realOdds < 1.1 || realOdds > 10.0) {
        console.log(`⚠️ Tentativo ${attempt}: Quota ${realOdds} non valida (range 1.1-10.0), rigenerando...`)
        continue
      }
      
      const singola = {
        fixture_id: gptSingola.fixture_id,
        home_team: gptSingola.home_team,
        away_team: gptSingola.away_team,
        league: gptSingola.league,
        match_time: gptSingola.match_time,
        prediction: gptSingola.prediction,
        prediction_label: buildPredictionLabel(gptSingola.prediction, gptSingola.home_team, gptSingola.away_team),
        odds: Math.round(realOdds * 100) / 100, // QUOTA REALE
        confidence: gptSingola.confidence,
        reasoning: gptSingola.reasoning,
        valid_until: today
      }
      
      console.log(`📊 Singola OpenAI (tentativo ${attempt}):`, {
        match: `${singola.home_team} vs ${singola.away_team}`,
        prediction: singola.prediction,
        odds: singola.odds,
        confidence: singola.confidence
      })
      
      // Salva nel database
      const { error } = await supabase
        .from('tips_singola')
        .upsert(singola, { onConflict: 'valid_until' })
      
      if (error) {
        console.error('❌ Errore salvataggio singola:', error)
        return false
      }
      
      console.log('✅ Singola OpenAI salvata con successo')
      return true
      
    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt} per singola:`, error)
      if (attempt === 3) {
        console.error('❌ Falliti tutti i tentativi per singola')
        return false
      }
      // Aspetta 1 secondo prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return false
}

// DOPPIA: 2 partite con analisi OpenAI intelligente (>=1.90)
async function generateDoppia(matches: any[], supabase: any, today: string): Promise<boolean> {
  console.log(`🎯 Generando DOPPIA con OpenAI da ${matches.length} partite disponibili`)
  
  const prompt = `Sei TipsterAI, analizza le partite e crea la MIGLIORE DOPPIA per oggi.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

USA LE QUOTE REALI FORNITE! NON inventare quote.

CONSTRAINT DATABASE: total_odds DEVE essere >= 1.90 (obbligatorio per il salvataggio).

Scegli 2 partite e selezioni migliori basandoti su:
- Analisi tecnico-tattica approfondita
- Value betting e probabilità reali
- Bilanciamento rischio/rendimento
- Form e motivazioni delle squadre

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
      "confidence": 75,
      "reasoning": "Milan dominante in casa, Monza fragile in trasferta"
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A",
      "time": "18:00",
      "prediction": "Over 2.5",
      "confidence": 70,
      "reasoning": "Inter attacco prolific, Como difesa vulnerabile"
    }
  ],
  "confidence": 72,
  "strategy_reasoning": "Due selezioni value con alta probabilità di successo"
}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Tentativo ${attempt}/3 per generare doppia`)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
      
      const gptDoppia = JSON.parse(response.choices[0].message.content || '{}')
      
      // Processa ogni match e assegna quote REALI
      const doppiaMatches = []
      let totalOdds = 1
      
      for (const gptMatch of gptDoppia.matches) {
        // Trova match originale
        const originalMatch = matches.find(m => m.fixture_id === gptMatch.fixture_id)
        if (!originalMatch || !originalMatch.odds) {
          throw new Error(`Match ${gptMatch.fixture_id} non trovato o senza odds`)
        }
        
        // Assegna quota REALE
        const realOdds = RealOddsManager.assignRealOdds(gptMatch.prediction, originalMatch.odds)
        
        if (!realOdds || isNaN(realOdds) || realOdds <= 0) {
          throw new Error(`Quota reale non valida per ${gptMatch.prediction}`)
        }
        
        const matchWithRealOdds = {
          fixture_id: gptMatch.fixture_id,
          home_team: gptMatch.home_team,
          away_team: gptMatch.away_team,
          league: gptMatch.league,
          time: gptMatch.time,
          prediction: gptMatch.prediction,
          prediction_label: buildPredictionLabel(gptMatch.prediction, gptMatch.home_team, gptMatch.away_team),
          odds: Math.round(realOdds * 100) / 100,
          confidence: gptMatch.confidence,
          reasoning: gptMatch.reasoning
        }
        
        doppiaMatches.push(matchWithRealOdds)
        totalOdds *= realOdds
      }
      
      // Arrotonda quota totale
      totalOdds = Math.round(totalOdds * 100) / 100
      
      // VALIDAZIONE CONSTRAINT DATABASE: total_odds >= 1.90
      if (totalOdds < 1.90) {
        console.log(`⚠️ Tentativo ${attempt}: Quota totale ${totalOdds} < 1.90, rigenerando...`)
        continue
      }
      
      const doppia = {
        matches: doppiaMatches,
        total_odds: totalOdds,
        confidence: gptDoppia.confidence,
        strategy_reasoning: gptDoppia.strategy_reasoning,
        valid_until: today
      }
      
      console.log(`📊 Doppia OpenAI (tentativo ${attempt}):`, {
        totalOdds,
        matches: doppiaMatches.map(m => `${m.home_team} vs ${m.away_team} - ${m.prediction}@${m.odds}`)
      })
      
      // Salva nel database
      const { error } = await supabase
        .from('tips_doppia')
        .upsert(doppia, { onConflict: 'valid_until' })
      
      if (error) {
        console.error('❌ Errore salvataggio doppia:', error)
        return false
      }
      
      console.log('✅ Doppia OpenAI salvata con successo')
      return true
      
    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt} per doppia:`, error)
      if (attempt === 3) {
        console.error('❌ Falliti tutti i tentativi per doppia')
        return false
      }
      // Aspetta 1 secondo prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return false
}

// TRIPLA: 3 partite con analisi OpenAI intelligente (2.80-5.00)
async function generateTripla(matches: any[], supabase: any, today: string): Promise<boolean> {
  console.log(`🎯 Generando TRIPLA con OpenAI da ${matches.length} partite disponibili`)
  
  const prompt = `Sei TipsterAI, analizza le partite e crea la MIGLIORE TRIPLA per oggi.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

USA LE QUOTE REALI FORNITE! NON inventare quote.

CONSTRAINT: La quota totale deve essere preferibilmente tra 2.80-5.00 per equilibrio rischio/rendimento.

COMBINA 3 selezioni INTELLIGENTI basandoti su:
- Analisi tattica approfondita
- Mix di mercati per diversificazione
- Value betting con quote reali
- Balance rischio/rendimento ottimale

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
      "confidence": 75,
      "reasoning": "Milan in forma smagliante, Monza in crisi difensiva"
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A",
      "time": "18:00",
      "prediction": "Over 2.5",
      "confidence": 70,
      "reasoning": "Entrambe le squadre giocano a viso aperto"
    },
    {
      "fixture_id": 789,
      "home_team": "Roma",
      "away_team": "Lecce",
      "league": "Serie A",
      "time": "20:45",
      "prediction": "1X",
      "confidence": 80,
      "reasoning": "Roma in casa quasi imbattibile contro squadre di fascia bassa"
    }
  ],
  "confidence": 68,
  "strategy_reasoning": "Mix equilibrato: favorito + goals + sicurezza per tripla intelligente"
}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Tentativo ${attempt}/3 per generare tripla`)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
      
      const gptTripla = JSON.parse(response.choices[0].message.content || '{}')
      
      // Processa ogni match e assegna quote REALI
      const triplaMatches = []
      let totalOdds = 1
      
      for (const gptMatch of gptTripla.matches) {
        // Trova match originale
        const originalMatch = matches.find(m => m.fixture_id === gptMatch.fixture_id)
        if (!originalMatch || !originalMatch.odds) {
          throw new Error(`Match ${gptMatch.fixture_id} non trovato o senza odds`)
        }
        
        // Assegna quota REALE
        const realOdds = RealOddsManager.assignRealOdds(gptMatch.prediction, originalMatch.odds)
        
        if (!realOdds || isNaN(realOdds) || realOdds <= 0) {
          throw new Error(`Quota reale non valida per ${gptMatch.prediction}`)
        }
        
        const matchWithRealOdds = {
          fixture_id: gptMatch.fixture_id,
          home_team: gptMatch.home_team,
          away_team: gptMatch.away_team,
          league: gptMatch.league,
          time: gptMatch.time,
          prediction: gptMatch.prediction,
          prediction_label: buildPredictionLabel(gptMatch.prediction, gptMatch.home_team, gptMatch.away_team),
          odds: Math.round(realOdds * 100) / 100,
          confidence: gptMatch.confidence,
          reasoning: gptMatch.reasoning
        }
        
        triplaMatches.push(matchWithRealOdds)
        totalOdds *= realOdds
      }
      
      // Arrotonda quota totale
      totalOdds = Math.round(totalOdds * 100) / 100
      
      const tripla = {
        matches: triplaMatches,
        total_odds: totalOdds,
        confidence: gptTripla.confidence,
        strategy_reasoning: gptTripla.strategy_reasoning,
        valid_until: today
      }
      
      console.log(`📊 Tripla OpenAI (tentativo ${attempt}):`, {
        totalOdds,
        targetRange: '2.80-5.00',
        matches: triplaMatches.map(m => `${m.home_team} vs ${m.away_team} - ${m.prediction}@${m.odds}`)
      })
      
      // Salva nel database
      const { error } = await supabase
        .from('tips_tripla')
        .upsert(tripla, { onConflict: 'valid_until' })
      
      if (error) {
        console.error('❌ Errore salvataggio tripla:', error)
        return false
      }
      
      console.log(`✅ Tripla OpenAI salvata: ${triplaMatches.length} match @${totalOdds}`)
      return true
      
    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt} per tripla:`, error)
      if (attempt === 3) {
        console.error('❌ Falliti tutti i tentativi per tripla')
        return false
      }
      // Aspetta 1 secondo prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return false
}

// MISTA: 5-8 partite conservative con analisi OpenAI intelligente (10-30x)
async function generateMista(matches: any[], supabase: any, today: string): Promise<boolean> {
  console.log(`🎯 Generando MISTA con OpenAI da ${matches.length} partite disponibili`)
  
  const prompt = `Sei TipsterAI, analizza le partite e crea la MIGLIORE MISTA per oggi.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

USA LE QUOTE REALI FORNITE! NON inventare quote.

Crea una MISTA INTELLIGENTE con 6-7 selezioni per quota totale OBIETTIVO 10-30x:
- Mix strategico di mercati per diversificare il rischio
- Selezioni conservative ma value (doppie chance + risultati sicuri + goals)
- Analisi tattica approfondita per ogni scelta
- Balance perfetto tra sicurezza e moltiplicatore

STRATEGIA CONSIGLIATA:
- 2-3 doppie chance sicure (1X, X2) su favoriti
- 2-3 risultati diretti su value bets
- 2-3 mercati goals (Over/Under, Gol/NoGol) 

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
      "reasoning": "Milan dominante in casa, Monza non vince in trasferta da mesi. Sicurezza massima."
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A",
      "time": "18:00",
      "prediction": "Over 1.5",
      "confidence": 80,
      "reasoning": "Inter attacco devastante, Como difesa fragile. Almeno 2 gol quasi certi."
    }
  ],
  "confidence": 45,
  "strategy_reasoning": "Mix intelligente di sicurezze e value per moltiplicatore interessante con rischio controllato"
}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Tentativo ${attempt}/3 per generare mista`)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
      
      const gptMista = JSON.parse(response.choices[0].message.content || '{}')
      
      // Assegna quote REALI a ogni match
      const matchesWithRealOdds = []
      let totalOdds = 1
      
      for (const gptMatch of gptMista.matches) {
        // Trova il match nel database
        const originalMatch = matches.find(m => m.fixture_id === gptMatch.fixture_id)
        if (!originalMatch || !originalMatch.odds) {
          throw new Error(`Match ${gptMatch.fixture_id} non trovato o senza odds`)
        }
        
        // Assegna quota REALE
        const realOdds = RealOddsManager.assignRealOdds(gptMatch.prediction, originalMatch.odds)
        
        if (!realOdds || isNaN(realOdds) || realOdds <= 0) {
          throw new Error(`Quota reale non valida per ${gptMatch.prediction}`)
        }
        
        const matchWithRealOdds = {
          fixture_id: gptMatch.fixture_id,
          home_team: gptMatch.home_team,
          away_team: gptMatch.away_team,
          league: gptMatch.league,
          time: gptMatch.time,
          prediction: gptMatch.prediction,
          prediction_label: buildPredictionLabel(gptMatch.prediction, gptMatch.home_team, gptMatch.away_team),
          odds: Math.round(realOdds * 100) / 100, // QUOTA REALE!
          confidence: gptMatch.confidence,
          reasoning: gptMatch.reasoning
        }
        
        matchesWithRealOdds.push(matchWithRealOdds)
        totalOdds *= realOdds
        
        console.log(`📊 Mista match ${attempt}: ${gptMatch.prediction} @${realOdds} (REALE)`)
      }
      
      // Arrotonda quota totale
      totalOdds = Math.round(totalOdds * 100) / 100
      
      const mista = {
        matches: matchesWithRealOdds,
        total_odds: totalOdds,
        confidence: gptMista.confidence,
        strategy_reasoning: gptMista.strategy_reasoning,
        valid_until: today
      }
      
      console.log(`📊 Mista OpenAI (tentativo ${attempt}):`, {
        selections: matchesWithRealOdds.length,
        totalOdds,
        targetRange: '10-30x',
        matches: matchesWithRealOdds.map(m => `${m.prediction}@${m.odds}`)
      })
      
      // Salva nel database
      const { error } = await supabase
        .from('tips_mista')
        .upsert(mista, { onConflict: 'valid_until' })
      
      if (error) {
        console.error('❌ Errore salvataggio mista:', error)
        return false
      }
      
      console.log(`✅ Mista OpenAI salvata: ${matchesWithRealOdds.length} selezioni @${totalOdds}`)
      return true
      
    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt} per mista:`, error)
      if (attempt === 3) {
        console.error('❌ Falliti tutti i tentativi per mista')
        return false
      }
      // Aspetta 1 secondo prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return false
}

// BOMBA: Risultati esatti con analisi OpenAI intelligente (30x+)
async function generateBomba(matches: any[], supabase: any, today: string): Promise<boolean> {
  console.log(`🎯 Generando BOMBA con OpenAI da ${matches.length} partite disponibili`)
  
  const prompt = `Sei TipsterAI, analizza le partite e crea la MIGLIORE BOMBA per oggi con SOLO 3 RISULTATI ESATTI.

PARTITE DISPONIBILI:
${JSON.stringify(matches, null, 2)}

Crea una BOMBA INTELLIGENTE con 3 risultati esatti:
- Analizza patterns di gol, difese, attacchi
- Studia form recente e statistiche head-to-head
- Considera motivazioni e contesto tattico
- Scegli risultati plausibili ma ad alta quota

DEVI prevedere SOLO RISULTATI ESATTI (es: 2-1, 1-0, 2-2, 3-1, ecc.)
USA quote realistiche dal database EXACT_SCORE_ODDS.

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
      "confidence": 15,
      "reasoning": "Milan domina ma Monza segna in contropiede. Difesa casa vulnerabile sui cross."
    },
    {
      "fixture_id": 456,
      "home_team": "Inter",
      "away_team": "Como",
      "league": "Serie A",
      "time": "18:00",
      "prediction": "3-0",
      "confidence": 12,
      "reasoning": "Inter devastante in casa, Como privo di alternative offensive. Goleada probabile."
    },
    {
      "fixture_id": 789,
      "home_team": "Roma",
      "away_team": "Lecce",
      "league": "Serie A",
      "time": "20:45",
      "prediction": "1-0",
      "confidence": 18,
      "reasoning": "Partita tattica, Lecce si chiude. Roma vince di misura con episodio."
    }
  ],
  "confidence": 8,
  "strategy_reasoning": "Tre risultati esatti basati su analisi tattica e pattern statistici"
}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Tentativo ${attempt}/3 per generare bomba`)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      })
      
      const gptBomba = JSON.parse(response.choices[0].message.content || '{}')
      
      // Processa ogni match e assegna quote REALI dai risultati esatti
      const bombaMatches = []
      let totalOdds = 1
      
      for (const gptMatch of gptBomba.matches) {
        // Trova match originale per verifica
        const originalMatch = matches.find(m => m.fixture_id === gptMatch.fixture_id)
        if (!originalMatch) {
          throw new Error(`Match ${gptMatch.fixture_id} non trovato`)
        }
        
        // Assegna quota REALE dal mapping risultati esatti
        const exactScoreOdds = EXACT_SCORE_ODDS[gptMatch.prediction] || 15.0
        
        const matchWithRealOdds = {
          fixture_id: gptMatch.fixture_id,
          home_team: gptMatch.home_team,
          away_team: gptMatch.away_team,
          league: gptMatch.league,
          time: gptMatch.time,
          prediction: gptMatch.prediction,
          prediction_label: `RISULTATO ESATTO ${gptMatch.prediction}`,
          odds: exactScoreOdds, // QUOTA REALE DA EXACT_SCORE_ODDS
          confidence: gptMatch.confidence,
          reasoning: gptMatch.reasoning
        }
        
        bombaMatches.push(matchWithRealOdds)
        totalOdds *= exactScoreOdds
      }
      
      // Arrotonda quota totale
      totalOdds = Math.round(totalOdds * 100) / 100
      
      const bomba = {
        matches: bombaMatches,
        tip_type: 'risultati_esatti',
        total_odds: totalOdds,
        confidence: gptBomba.confidence,
        strategy_reasoning: gptBomba.strategy_reasoning,
        valid_until: today
      }
      
      console.log(`📊 Bomba OpenAI (tentativo ${attempt}):`, {
        totalOdds,
        targetRange: '30x+',
        results: bombaMatches.map(m => `${m.prediction}@${m.odds}`)
      })
      
      // Salva nel database
      const { error } = await supabase
        .from('tips_bomba')
        .upsert(bomba, { onConflict: 'valid_until' })
      
      if (error) {
        console.error('❌ Errore salvataggio bomba:', error)
        return false
      }
      
      console.log(`✅ Bomba OpenAI salvata: 3 risultati esatti @${totalOdds}`)
      return true
      
    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt} per bomba:`, error)
      if (attempt === 3) {
        console.error('❌ Falliti tutti i tentativi per bomba')
        return false
      }
      // Aspetta 1 secondo prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return false
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
    case 'gol': case 'btts': return 'Gol'
    case 'nogol': case 'no btts': return 'NoGol'
    default: return prediction.toUpperCase()
  }
}

// SERIE A SPECIAL: Mista con analisi OpenAI intelligente solo Serie A (3-5 partite)
async function generateSerieASpecial(serieAMatches: any[], allMatches: any[], supabase: any, today: string): Promise<boolean> {
  console.log(`🇮🇹 Generando proposta speciale SOLO Serie A con OpenAI da ${serieAMatches.length} partite disponibili`)
  
  // Ordina per orario
  const sortedMatches = serieAMatches.sort((a, b) => {
    if (a.date !== b.date) {
      return new Date(a.date || today).getTime() - new Date(b.date || today).getTime()
    }
    return a.time.localeCompare(b.time)
  })
  
  // Prendi al massimo 5 partite Serie A
  const matchesToUse = sortedMatches.slice(0, 5)
  
  const prompt = `🇮🇹 Sei TipsterAI, analizza e crea la MIGLIORE PROPOSTA SPECIALE SOLO SERIE A.

PARTITE SERIE A DISPONIBILI:
${JSON.stringify(matchesToUse, null, 2)}

USA LE QUOTE REALI FORNITE! NON inventare quote.

Crea una SCHEDINA SERIE A INTELLIGENTE con 3-5 partite:
- Analisi tattica approfondita del calcio italiano
- Conosci le dinamiche delle squadre di Serie A
- Mix di mercati per diversificare (1X2, doppie chance, gol, over/under)
- Quota totale target 8.00-25.00 per value interessante
- Considera rivalità, form casalinga, motivazioni

FOCUS SERIE A:
- Analizza le caratteristiche tattiche italiane
- Considera il fattore casa in Serie A
- Bilancia sicurezza e rendimento
- Sfrutta la conoscenza delle squadre

OUTPUT JSON:
{
  "matches": [
    {
      "fixture_id": 123456,
      "home_team": "Juventus", 
      "away_team": "Torino",
      "league": "Serie A",
      "time": "18:00",
      "date": "2026-01-07",
      "prediction": "1X",
      "confidence": 75,
      "reasoning": "Derby della Mole, Juventus in casa raramente perde contro il Torino. Fattore casa decisivo."
    }
  ],
  "confidence": 65,
  "strategy_reasoning": "Mix intelligente di favoriti e scommesse sui gol, sfruttando le caratteristiche del calcio italiano"
}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Tentativo ${attempt}/3 per generare Serie A Special`)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
      
      const gptSerieA = JSON.parse(response.choices[0].message.content || '{}')
      
      // Assegna quote REALI per ogni selezione
      const serieAMatches = []
      let totalOdds = 1
      
      for (const gptMatch of gptSerieA.matches) {
        // Trova match originale
        const originalMatch = matchesToUse.find(m => m.fixture_id === gptMatch.fixture_id)
        if (!originalMatch || !originalMatch.odds) {
          throw new Error(`Match Serie A ${gptMatch.fixture_id} non trovato o senza odds`)
        }
        
        // Assegna quota REALE
        const realOdds = RealOddsManager.assignRealOdds(gptMatch.prediction, originalMatch.odds)
        
        if (!realOdds || isNaN(realOdds) || realOdds <= 0) {
          throw new Error(`Quota reale non valida per ${gptMatch.prediction}`)
        }
        
        const matchWithRealOdds = {
          fixture_id: gptMatch.fixture_id,
          home_team: gptMatch.home_team,
          away_team: gptMatch.away_team,
          league: gptMatch.league,
          time: gptMatch.time,
          date: gptMatch.date || today,
          prediction: gptMatch.prediction,
          prediction_label: buildPredictionLabel(gptMatch.prediction, gptMatch.home_team, gptMatch.away_team),
          odds: Math.round(realOdds * 100) / 100, // QUOTA REALE
          confidence: gptMatch.confidence,
          reasoning: gptMatch.reasoning
        }
        
        serieAMatches.push(matchWithRealOdds)
        totalOdds *= realOdds
        
        console.log(`🇮🇹 Serie A match ${attempt}: ${gptMatch.prediction} @${realOdds} (REALE)`)
      }
      
      // Arrotonda quota totale
      totalOdds = Math.round(totalOdds * 100) / 100
      
      const serieASpecial = {
        matches: serieAMatches,
        total_odds: totalOdds,
        confidence: gptSerieA.confidence,
        strategy_reasoning: gptSerieA.strategy_reasoning,
        valid_until: today
      }
      
      console.log(`📊 Serie A Special OpenAI (tentativo ${attempt}):`, {
        partite: serieAMatches.length,
        totalOdds,
        targetRange: '8.00-25.00',
        matches: serieAMatches.map(m => `${m.prediction}@${m.odds}`)
      })
      
      // Salva nella tabella tips_serie_a
      const { error } = await supabase
        .from('tips_serie_a')
        .upsert(serieASpecial, { onConflict: 'valid_until' })
      
      if (error) {
        console.error('❌ Errore salvataggio Serie A Special:', error)
        return false
      }
      
      console.log(`✅ Serie A Special OpenAI salvata: ${serieAMatches.length} partite @${totalOdds}`)
      return true
      
    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt} per Serie A Special:`, error)
      if (attempt === 3) {
        console.error('❌ Falliti tutti i tentativi per Serie A Special')
        return false
      }
      // Aspetta 1 secondo prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return false
}