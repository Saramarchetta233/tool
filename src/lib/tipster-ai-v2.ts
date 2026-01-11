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
  // Sottrai 1 ora per compensare differenza fuso orario DB
  const adjustedTime = new Date(Date.now() - 60 * 60 * 1000).toTimeString().slice(0, 5)

  console.log(`🎯 TipsterAI V2: Generating tips for ${today}, filter time: ${adjustedTime}`)

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('match_date', today)
    .gt('match_time', adjustedTime) // Solo partite non ancora iniziate (con 1h di tolleranza)
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
  
  // REGOLE:
  // >= 5 partite: OBBLIGATORIO singola + doppia, PROVA tripla + mista + bomba
  // < 5 partite: genera quello che si può

  if (numMatches >= 5) {
    console.log(`🎯 Trovate ${numMatches} partite (>=5), generando TUTTE le proposte!`)

    // OBBLIGATORIO: Singola e Doppia
    const [singola, doppia] = await Promise.all([
      generateSingola(matchesData, supabase, today),
      generateDoppia(matchesData, supabase, today)
    ])
    results.singola = singola
    results.doppia = doppia

    // PROVA: Tripla, Mista, Bomba (se GPT riesce bene, altrimenti skip)
    console.log('🎲 Provando a generare TRIPLA, MISTA, BOMBA...')
    const [tripla, mista, bomba] = await Promise.all([
      generateTripla(matchesData, supabase, today),
      generateMista(matchesData, supabase, today),
      generateBomba(matchesData, supabase, today)
    ])
    results.tripla = tripla
    results.mista = mista
    results.bomba = bomba

  } else if (numMatches >= 3) {
    console.log(`🎯 Trovate ${numMatches} partite (3-4), generando quello che si può...`)

    const [singola, doppia, tripla] = await Promise.all([
      generateSingola(matchesData, supabase, today),
      generateDoppia(matchesData, supabase, today),
      generateTripla(matchesData, supabase, today)
    ])
    results.singola = singola
    results.doppia = doppia
    results.tripla = tripla

  } else if (numMatches >= 2) {
    console.log(`🎯 Trovate ${numMatches} partite, generando singola e doppia...`)
    const [singola, doppia] = await Promise.all([
      generateSingola(matchesData, supabase, today),
      generateDoppia(matchesData, supabase, today)
    ])
    results.singola = singola
    results.doppia = doppia

  } else if (numMatches >= 1) {
    console.log(`🎯 Trovata 1 partita, generando solo singola...`)
    results.singola = await generateSingola(matchesData, supabase, today)
  }
  
  // SERIE A: Cerca partite dell'intero TURNO (prossimi 4 giorni)
  console.log('🇮🇹 Cercando partite Serie A del turno (prossimi 4 giorni)...')

  const futureDates = []
  for (let i = 0; i < 4; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    futureDates.push(d.toISOString().split('T')[0])
  }

  const { data: allSerieAMatches } = await supabase
    .from('matches')
    .select('*')
    .ilike('league_name', '%Serie A%')
    .in('match_date', futureDates)
    .order('match_date')
    .order('match_time')

  if (allSerieAMatches && allSerieAMatches.length >= 3) {
    console.log(`🇮🇹 Trovate ${allSerieAMatches.length} partite Serie A nel turno!`)

    // Prepara dati partite Serie A
    const serieAData = allSerieAMatches.map(m => ({
      fixture_id: m.fixture_id,
      home_team: m.home_team?.name || 'Casa',
      away_team: m.away_team?.name || 'Ospite',
      league: m.league_name,
      time: m.match_time,
      date: m.match_date,
      odds: {
        winner: m.odds?.winner || {},
        doubleChance: m.odds?.doubleChance || {},
        goals: m.odds?.goals || {}
      }
    }))

    const serieA = await generateSerieASpecial(serieAData, serieAData, supabase, today)
    results.serieA = serieA
  } else {
    console.log('🇮🇹 Meno di 3 partite Serie A nel turno, skip mista Serie A')
  }
  
  console.log('✅ Generazione completata:', results)
  return results
}

// SINGOLA: 1 partita con analisi OpenAI intelligente
async function generateSingola(matches: any[], supabase: any, today: string): Promise<boolean> {
  console.log(`🎯 Generando SINGOLA con OpenAI da ${matches.length} partite disponibili`)

  // Prepara lista partite in formato semplice per GPT
  const matchList = matches.map(m => ({
    fixture_id: m.fixture_id,
    partita: `${m.home_team} vs ${m.away_team}`,
    lega: m.league,
    orario: m.time,
    quote: {
      '1': m.odds?.winner?.home,
      'X': m.odds?.winner?.draw,
      '2': m.odds?.winner?.away,
      'Over 2.5': m.odds?.goals?.over_2_5,
      'Under 2.5': m.odds?.goals?.under_2_5,
      'Gol': m.odds?.goals?.btts,
      'NoGol': m.odds?.goals?.nobtts
    }
  }))

  const prompt = `Sei TipsterAI, esperto di scommesse calcistiche. Analizza queste partite e scegli LA MIGLIORE SINGOLA.

PARTITE DISPONIBILI CON QUOTE REALI:
${JSON.stringify(matchList, null, 2)}

REGOLE:
1. DEVI scegliere UN fixture_id dalla lista sopra
2. DEVI usare una prediction tra: 1, X, 2, Over 2.5, Under 2.5, Gol, NoGol
3. USA la quota REALE dalla lista (non inventare!)
4. Scegli la scommessa con miglior rapporto valore/sicurezza

OUTPUT JSON (usa esattamente questo formato):
{
  "fixture_id": <numero dalla lista>,
  "home_team": "<squadra casa>",
  "away_team": "<squadra ospite>",
  "league": "<campionato>",
  "match_time": "<orario>",
  "prediction": "<1 o X o 2 o Over 2.5 o Under 2.5 o Gol o NoGol>",
  "odds": <quota reale dalla lista>,
  "confidence": <60-90>,
  "reasoning": "<analisi dettagliata in italiano>"
}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Tentativo ${attempt}/3 per generare singola`)
      console.log(`📝 Prompt length: ${prompt.length}, matches: ${matchList.length}`)

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const gptContent = response.choices[0].message.content || '{}'
      console.log(`🤖 GPT response: ${gptContent.substring(0, 200)}...`)

      const gptSingola = JSON.parse(gptContent)
      console.log(`📊 GPT fixture_id: ${gptSingola.fixture_id}, prediction: ${gptSingola.prediction}`)

      // Verifica che il fixture_id esista (usa Number per evitare mismatch string/number)
      const originalMatch = matches.find(m => Number(m.fixture_id) === Number(gptSingola.fixture_id))
      if (!originalMatch) {
        console.log(`⚠️ Tentativo ${attempt}: fixture_id ${gptSingola.fixture_id} non valido, riprovo...`)
        console.log(`📋 fixture_id disponibili: ${matches.map(m => m.fixture_id).join(', ')}`)
        continue
      }

      // Assegna quota REALE dal database
      console.log(`🔍 originalMatch.odds: ${JSON.stringify(originalMatch.odds).substring(0, 100)}...`)
      const realOdds = RealOddsManager.assignRealOdds(gptSingola.prediction, originalMatch.odds)
      console.log(`💰 RealOdds per "${gptSingola.prediction}": ${realOdds}`)

      if (!realOdds || isNaN(realOdds) || realOdds < 1.1 || realOdds > 10.0) {
        console.log(`⚠️ Tentativo ${attempt}: Quota ${realOdds} non valida per ${gptSingola.prediction}, riprovo...`)
        continue
      }

      const singola = {
        fixture_id: gptSingola.fixture_id,
        home_team: originalMatch.home_team,
        away_team: originalMatch.away_team,
        league: originalMatch.league,
        match_time: originalMatch.time,
        prediction: gptSingola.prediction,
        prediction_label: buildPredictionLabel(gptSingola.prediction, originalMatch.home_team, originalMatch.away_team),
        odds: Math.round(realOdds * 100) / 100,
        confidence: gptSingola.confidence || 70,
        reasoning: gptSingola.reasoning,
        valid_until: today
      }

      console.log(`📊 Singola:`, `${singola.home_team} vs ${singola.away_team} - ${singola.prediction} @${singola.odds}`)

      // Delete existing singola for today, then insert new one
      await supabase.from('tips_singola').delete().eq('valid_until', today)

      const { error } = await supabase
        .from('tips_singola')
        .insert(singola)

      if (error) {
        console.error('❌ Errore salvataggio singola:', JSON.stringify(error))
        return false
      }

      console.log('✅ Singola salvata')
      return true

    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt}:`, error)
      if (attempt === 3) return false
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return false
}

// DOPPIA: 2 partite con analisi OpenAI intelligente
async function generateDoppia(matches: any[], supabase: any, today: string): Promise<boolean> {
  console.log(`🎯 Generando DOPPIA con OpenAI da ${matches.length} partite disponibili`)

  // Prepara lista partite in formato semplice per GPT
  const matchList = matches.map(m => ({
    fixture_id: m.fixture_id,
    partita: `${m.home_team} vs ${m.away_team}`,
    lega: m.league,
    orario: m.time,
    quote: {
      '1': m.odds?.winner?.home,
      'X': m.odds?.winner?.draw,
      '2': m.odds?.winner?.away,
      'Over 2.5': m.odds?.goals?.over_2_5,
      'Under 2.5': m.odds?.goals?.under_2_5,
      'Gol': m.odds?.goals?.btts,
      'NoGol': m.odds?.goals?.nobtts
    }
  }))

  const prompt = `Sei TipsterAI, esperto di scommesse calcistiche. Analizza queste partite e crea LA MIGLIORE DOPPIA (2 selezioni).

PARTITE DISPONIBILI CON QUOTE REALI:
${JSON.stringify(matchList, null, 2)}

REGOLE:
1. Scegli 2 partite DIVERSE dalla lista (2 fixture_id diversi!)
2. Per ogni partita scegli una prediction tra: 1, X, 2, Over 2.5, Under 2.5, Gol, NoGol
3. USA le quote REALI dalla lista (non inventare!)
4. Obiettivo: quota totale tra 2.00 e 3.50

OUTPUT JSON:
{
  "matches": [
    {
      "fixture_id": <numero>,
      "prediction": "<1/X/2/Over 2.5/Under 2.5/Gol/NoGol>",
      "reasoning": "<analisi in italiano>"
    },
    {
      "fixture_id": <numero diverso>,
      "prediction": "<1/X/2/Over 2.5/Under 2.5/Gol/NoGol>",
      "reasoning": "<analisi in italiano>"
    }
  ],
  "confidence": <60-85>,
  "strategy_reasoning": "<strategia complessiva>"
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

      if (!gptDoppia.matches || gptDoppia.matches.length < 2) {
        console.log(`⚠️ Tentativo ${attempt}: GPT non ha restituito 2 match, riprovo...`)
        continue
      }

      // Verifica e costruisci le selezioni
      const doppiaMatches = []
      let totalOdds = 1
      const usedIds = new Set<number>()

      for (const gptMatch of gptDoppia.matches) {
        if (doppiaMatches.length >= 2) break
        if (usedIds.has(gptMatch.fixture_id)) continue

        const originalMatch = matches.find(m => Number(m.fixture_id) === Number(gptMatch.fixture_id))
        if (!originalMatch) {
          console.log(`⚠️ fixture_id ${gptMatch.fixture_id} non trovato`)
          continue
        }

        const realOdds = RealOddsManager.assignRealOdds(gptMatch.prediction, originalMatch.odds)
        if (!realOdds || isNaN(realOdds) || realOdds <= 1.0) {
          console.log(`⚠️ Quota non valida per ${gptMatch.prediction}`)
          continue
        }

        usedIds.add(gptMatch.fixture_id)
        doppiaMatches.push({
          fixture_id: originalMatch.fixture_id,
          home_team: originalMatch.home_team,
          away_team: originalMatch.away_team,
          league: originalMatch.league,
          time: originalMatch.time,
          prediction: gptMatch.prediction,
          prediction_label: buildPredictionLabel(gptMatch.prediction, originalMatch.home_team, originalMatch.away_team),
          odds: Math.round(realOdds * 100) / 100,
          confidence: gptDoppia.confidence || 70,
          reasoning: gptMatch.reasoning
        })
        totalOdds *= realOdds
      }

      if (doppiaMatches.length < 2) {
        console.log(`⚠️ Tentativo ${attempt}: Solo ${doppiaMatches.length} match validi, riprovo...`)
        continue
      }

      totalOdds = Math.round(totalOdds * 100) / 100

      const doppia = {
        matches: doppiaMatches,
        total_odds: totalOdds,
        confidence: gptDoppia.confidence || 70,
        strategy_reasoning: gptDoppia.strategy_reasoning,
        valid_until: today
      }

      console.log(`📊 Doppia:`, doppiaMatches.map(m => `${m.home_team} vs ${m.away_team} - ${m.prediction} @${m.odds}`).join(' | '), `TOT: @${totalOdds}`)

      // Delete existing doppia for today, then insert new one
      await supabase.from('tips_doppia').delete().eq('valid_until', today)

      const { error } = await supabase
        .from('tips_doppia')
        .insert(doppia)

      if (error) {
        console.error('❌ Errore salvataggio doppia:', JSON.stringify(error))
        return false
      }

      console.log('✅ Doppia salvata')
      return true

    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt}:`, error)
      if (attempt === 3) return false
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return false
}

// TRIPLA: 3 partite con analisi OpenAI intelligente (2.80-5.00)
async function generateTripla(matches: any[], supabase: any, today: string): Promise<boolean> {
  console.log(`🎯 Generando TRIPLA con OpenAI da ${matches.length} partite disponibili`)

  // Prepara lista partite in formato semplice per GPT (come singola/doppia)
  const matchList = matches.map(m => ({
    fixture_id: m.fixture_id,
    partita: `${m.home_team} vs ${m.away_team}`,
    lega: m.league,
    orario: m.time,
    quote: {
      '1': m.odds?.winner?.home,
      'X': m.odds?.winner?.draw,
      '2': m.odds?.winner?.away,
      '1X': m.odds?.doubleChance?.x1,
      'X2': m.odds?.doubleChance?.x2,
      'Over 2.5': m.odds?.goals?.over_2_5,
      'Under 2.5': m.odds?.goals?.under_2_5,
      'Gol': m.odds?.goals?.btts,
      'NoGol': m.odds?.goals?.nobtts
    }
  }))

  const prompt = `Sei TipsterAI, esperto di scommesse calcistiche. Crea LA MIGLIORE TRIPLA (3 selezioni).

PARTITE DISPONIBILI CON QUOTE REALI:
${JSON.stringify(matchList, null, 2)}

REGOLE IMPORTANTI:
1. Scegli ESATTAMENTE 3 partite DIVERSE dalla lista (3 fixture_id diversi!)
2. Per ogni partita scegli UNA SOLA prediction tra QUESTE OPZIONI ESATTE:
   - "1" (vittoria casa)
   - "X" (pareggio)
   - "2" (vittoria ospite)
   - "1X" (casa non perde)
   - "X2" (ospite non perde)
   - "Over 2.5" (almeno 3 gol)
   - "Under 2.5" (massimo 2 gol)
   - "Gol" (entrambe segnano)
   - "NoGol" (almeno una non segna)
3. NON inventare altri formati! Solo quelli sopra!
4. USA le quote REALI dalla lista
5. Obiettivo: quota totale tra 2.80 e 5.00

OUTPUT JSON:
{
  "matches": [
    {
      "fixture_id": <numero dalla lista>,
      "home_team": "<squadra casa>",
      "away_team": "<squadra ospite>",
      "league": "<campionato>",
      "time": "<orario>",
      "prediction": "<SOLO: 1 o X o 2 o 1X o X2 o Over 2.5 o Under 2.5 o Gol o NoGol>",
      "confidence": <60-85>,
      "reasoning": "<analisi breve>"
    }
  ],
  "confidence": <60-80>,
  "strategy_reasoning": "<strategia complessiva>"
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

      const gptContent = response.choices[0].message.content || '{}'
      console.log(`🤖 GPT Tripla response: ${gptContent.substring(0, 300)}...`)

      const gptTripla = JSON.parse(gptContent)

      if (!gptTripla.matches || gptTripla.matches.length < 3) {
        console.log(`⚠️ Tentativo ${attempt}: GPT non ha restituito 3 match, riprovo...`)
        continue
      }

      // Processa ogni match e assegna quote REALI
      const triplaMatches = []
      let totalOdds = 1
      const usedIds = new Set<number>()

      for (const gptMatch of gptTripla.matches) {
        if (triplaMatches.length >= 3) break
        if (usedIds.has(Number(gptMatch.fixture_id))) continue

        // Trova match originale (usa Number per evitare mismatch string/number)
        const originalMatch = matches.find(m => Number(m.fixture_id) === Number(gptMatch.fixture_id))
        if (!originalMatch) {
          console.log(`⚠️ fixture_id ${gptMatch.fixture_id} non trovato`)
          continue
        }

        // Assegna quota REALE
        const realOdds = RealOddsManager.assignRealOdds(gptMatch.prediction, originalMatch.odds)
        console.log(`📊 Tripla: ${gptMatch.prediction} → quota reale: ${realOdds}`)

        if (!realOdds || isNaN(realOdds) || realOdds <= 1.0) {
          console.log(`⚠️ Quota non valida per ${gptMatch.prediction}`)
          continue
        }

        usedIds.add(Number(gptMatch.fixture_id))
        triplaMatches.push({
          fixture_id: originalMatch.fixture_id,
          home_team: originalMatch.home_team,
          away_team: originalMatch.away_team,
          league: originalMatch.league,
          time: originalMatch.time,
          prediction: gptMatch.prediction,
          prediction_label: buildPredictionLabel(gptMatch.prediction, originalMatch.home_team, originalMatch.away_team),
          odds: Math.round(realOdds * 100) / 100,
          confidence: gptMatch.confidence || 70,
          reasoning: gptMatch.reasoning
        })
        totalOdds *= realOdds
      }

      if (triplaMatches.length < 3) {
        console.log(`⚠️ Tentativo ${attempt}: Solo ${triplaMatches.length} match validi, riprovo...`)
        continue
      }

      // Arrotonda quota totale
      totalOdds = Math.round(totalOdds * 100) / 100

      const tripla = {
        matches: triplaMatches,
        total_odds: totalOdds,
        confidence: gptTripla.confidence || 70,
        strategy_reasoning: gptTripla.strategy_reasoning,
        valid_until: today
      }

      console.log(`📊 Tripla:`, triplaMatches.map(m => `${m.home_team} vs ${m.away_team} - ${m.prediction} @${m.odds}`).join(' | '), `TOT: @${totalOdds}`)

      // Delete existing tripla for today, then insert new one
      await supabase.from('tips_tripla').delete().eq('valid_until', today)

      const { error } = await supabase
        .from('tips_tripla')
        .insert(tripla)

      if (error) {
        console.error('❌ Errore salvataggio tripla:', JSON.stringify(error))
        return false
      }

      console.log(`✅ Tripla salvata: ${triplaMatches.length} match @${totalOdds}`)
      return true

    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt} per tripla:`, error)
      if (attempt === 3) {
        console.error('❌ Falliti tutti i tentativi per tripla')
        return false
      }
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
        // Trova il match nel database (usa Number per evitare mismatch string/number)
        const originalMatch = matches.find(m => Number(m.fixture_id) === Number(gptMatch.fixture_id))
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
      
      // Delete existing mista for today, then insert new one
      await supabase.from('tips_mista').delete().eq('valid_until', today)

      const { error } = await supabase
        .from('tips_mista')
        .insert(mista)

      if (error) {
        console.error('❌ Errore salvataggio mista:', JSON.stringify(error))
        return false
      }

      console.log(`✅ Mista salvata: ${matchesWithRealOdds.length} selezioni @${totalOdds}`)
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
        // Trova match originale per verifica (usa Number per evitare mismatch string/number)
        const originalMatch = matches.find(m => Number(m.fixture_id) === Number(gptMatch.fixture_id))
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
      
      // Delete existing bomba for today, then insert new one
      await supabase.from('tips_bomba').delete().eq('valid_until', today)

      const { error } = await supabase
        .from('tips_bomba')
        .insert(bomba)

      if (error) {
        console.error('❌ Errore salvataggio bomba:', JSON.stringify(error))
        return false
      }

      console.log(`✅ Bomba salvata: 3 risultati esatti @${totalOdds}`)
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
        // Trova match originale (usa Number per evitare mismatch string/number)
        const originalMatch = matchesToUse.find(m => Number(m.fixture_id) === Number(gptMatch.fixture_id))
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
      
      // Delete existing serie_a for today, then insert new one
      await supabase.from('tips_serie_a').delete().eq('valid_until', today)

      const { error } = await supabase
        .from('tips_serie_a')
        .insert(serieASpecial)

      if (error) {
        console.error('❌ Errore salvataggio Serie A:', JSON.stringify(error))
        return false
      }

      console.log(`✅ Serie A salvata: ${serieAMatches.length} partite @${totalOdds}`)
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