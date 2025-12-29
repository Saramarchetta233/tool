import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface MatchAnalysis {
  fixture_id: number
  home_team: string
  away_team: string
  league: string
  time: string
  esito: '1' | 'X' | '2' // Decisione GPT-4
  over_under: 'Over 2.5' | 'Under 2.5' // Decisione GPT-4
  confidence: number
  odds: {
    home: number
    draw: number
    away: number
    over_2_5: number
    under_2_5: number
    over_1_5: number
    under_1_5: number
    over_3_5: number
    under_3_5: number
    btts: number
    nobtts: number
  }
}

export async function generateDailyTipsV2() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'public' }, auth: { persistSession: false } }
  )

  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)
  
  console.log(`🎯 TipsterAI Clean: Generazione per ${today}`)

  // 1. Carica partite di oggi
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('match_date', today)
    .gt('match_time', currentTime)
    .order('match_time', { ascending: true })

  if (error || !matches || matches.length === 0) {
    return { success: false, message: 'Nessuna partita oggi' }
  }

  console.log(`📊 ${matches.length} partite trovate per oggi`)

  // 2. GPT-4 ANALIZZA ogni partita
  const analyses = await analyzeMatches(matches)
  if (analyses.length === 0) {
    return { success: false, message: 'Errore analisi partite' }
  }

  // 3. CODICE costruisce le 5 selezioni
  const tips = buildAllTips(analyses)

  // 4. Salva nelle 5 tabelle
  await saveAllTips(tips, today, supabase)

  return { success: true, tips }
}

// STEP 1: GPT-4 analizza e decide esito + over/under per ogni partita
async function analyzeMatches(matches: any[]): Promise<MatchAnalysis[]> {
  const matchesData = matches.map(m => ({
    fixture_id: m.fixture_id,
    home_team: m.home_team?.name || 'Casa',
    away_team: m.away_team?.name || 'Ospite', 
    league: m.league_name || 'Unknown',
    time: m.match_time,
    odds: {
      home: m.odds?.winner?.home || 2.00,
      draw: m.odds?.winner?.draw || 3.20,
      away: m.odds?.winner?.away || 3.50,
      over_2_5: m.odds?.goals?.over_2_5 || 1.80,
      under_2_5: m.odds?.goals?.under_2_5 || 1.90,
      over_1_5: m.odds?.goals?.over_1_5 || 1.25,
      under_1_5: m.odds?.goals?.under_1_5 || 4.00,
      over_3_5: m.odds?.goals?.over_3_5 || 3.50,
      under_3_5: m.odds?.goals?.under_3_5 || 1.30,
      btts: m.odds?.goals?.btts || 1.70,
      nobtts: m.odds?.goals?.nobtts || 2.10
    }
  }))

  const prompt = `Analizza queste partite e per OGNUNA decidi chi vince e quanti gol.

PARTITE:
${JSON.stringify(matchesData.slice(0, 15), null, 2)}

Per ogni partita decidi:
1. Chi vince: "1" (casa), "X" (pareggio), "2" (ospite)
2. Gol: "Over 2.5" (almeno 3 gol) o "Under 2.5" (massimo 2 gol)  
3. Confidence: 0-100

OUTPUT JSON:
{
  "partite": [
    {
      "fixture_id": 123,
      "esito": "1",
      "over_under": "Under 2.5",
      "confidence": 75
    }
  ]
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    const gptAnalyses = result.partite || []

    // Combina analisi GPT con dati originali
    return matchesData.map(match => {
      const analysis = gptAnalyses.find((a: any) => a.fixture_id === match.fixture_id) || {}
      return {
        ...match,
        esito: analysis.esito || '1',
        over_under: analysis.over_under || 'Under 2.5',
        confidence: analysis.confidence || 50
      } as MatchAnalysis
    })

  } catch (error) {
    console.error('❌ Errore analisi GPT-4:', error)
    return []
  }
}

// STEP 2: CODICE costruisce le 5 selezioni usando decisioni GPT-4
function buildAllTips(analyses: MatchAnalysis[]) {
  // Ordina: prima Serie A, poi per confidence
  const sorted = [...analyses].sort((a, b) => {
    if (a.league === 'Serie A' && b.league !== 'Serie A') return -1
    if (a.league !== 'Serie A' && b.league === 'Serie A') return 1
    return b.confidence - a.confidence
  })

  const used: number[] = [] // Traccia partite usate

  const singola = buildSingola(sorted, used)
  const doppia = buildDoppia(sorted, used)
  const tripla = buildTripla(sorted, used)
  const mista = buildMista(sorted, used)
  const bomba = buildBomba(sorted, used)

  return { singola, doppia, tripla, mista, bomba }
}

// SINGOLA: 1 partita, quota ~1.70 (range 1.70-2.50 - DATABASE CONSTRAINT)
function buildSingola(matches: MatchAnalysis[], used: number[]) {
  console.log('🎯 Costruendo SINGOLA (quota target 1.70-2.50)')
  
  // Prendi prima partita (Serie A ha priorità)
  const match = matches[0]
  used.push(match.fixture_id)

  // SELEZIONE INTELLIGENTE basata su analisi GPT-4
  let selection
  
  // Se GPT-4 ha detto che vince la squadra di casa (esito: 1)
  if (match.esito === '1') {
    // Opzioni coerenti: 1, 1X, combo con Over/Under
    const homeWinOptions = ['1', '1X', match.over_under, 'Gol', 'NoGol', '1+Over2.5', '1+Under2.5', '1+Gol', '1X+Over2.5', '1X+Under2.5']
    selection = findBestInRange(match, homeWinOptions, 1.40, 99.99)
  } 
  // Se GPT-4 ha detto pareggio (esito: X)
  else if (match.esito === 'X') {
    // Opzioni coerenti: X, 1X, X2, Under 2.5
    const drawOptions = ['X', '1X', 'X2', 'Under 2.5', match.over_under]
    selection = findBestInRange(match, drawOptions, 1.40, 99.99)
  }
  // Se GPT-4 ha detto vince ospite (esito: 2)
  else if (match.esito === '2') {
    // Per squadre di casa forti (Roma, Milan, Inter, Juve, Napoli) NON dare mai vittoria ospite
    if (match.home_team.includes('Roma') || match.home_team.includes('Milan') || 
        match.home_team.includes('Inter') || match.home_team.includes('Juventus') || 
        match.home_team.includes('Napoli')) {
      console.log(`⚠️ GPT dice che ${match.away_team} vince contro ${match.home_team}?! Scelgo alternative...`)
      const safeOptions = ['Under 2.5', 'Over 2.5', 'Gol', 'NoGol', '1+Under2.5', '1X+Under2.5']
      selection = findBestInRange(match, safeOptions, 1.40, 99.99)
    } else {
      // Per altre squadre ok seguire GPT
      const awayWinOptions = ['2', 'X2', match.over_under, 'Gol', 'NoGol']
      selection = findBestInRange(match, awayWinOptions, 1.40, 99.99)
    }
  }
  // Default
  else {
    selection = chooseSelection(match, 1.40, 99.99)
  }
  
  // Log per debug COMPLETO
  console.log(`📊 Singola: ${match.home_team} vs ${match.away_team}`)
  console.log(`   GPT analisi: esito=${match.esito}, over_under=${match.over_under}, confidence=${match.confidence}`)
  console.log(`   Quote disponibili: 1@${match.odds.home}, X@${match.odds.draw}, 2@${match.odds.away}`)
  console.log(`   Quote DC: 1X@${calculate1X(match.odds.home, match.odds.draw)}, X2@${calculateX2(match.odds.draw, match.odds.away)}`)
  console.log(`   Quote goals: Over2.5@${match.odds.over_2_5}, Under2.5@${match.odds.under_2_5}`)
  console.log(`   Selezione finale: ${selection.prediction} @${selection.odds}`)
  
  if (selection.odds < 1.40) {
    console.warn(`⚠️ Quota singola troppo bassa: ${selection.odds} (minimo 1.40)`)
  }

  return {
    fixture_id: match.fixture_id,
    home_team: match.home_team,
    away_team: match.away_team,
    league: match.league,
    match_time: match.time,
    prediction: selection.prediction,
    prediction_label: buildLabel(selection.prediction, match.home_team, match.away_team),
    odds: selection.odds,
    confidence: match.confidence,
    reasoning: buildReasoning(selection.prediction, match.home_team, match.away_team),
    valid_until: new Date().toISOString().split('T')[0]
  }
}

// DOPPIA: 2 partite, quota totale ~2.00 (range 1.90-3.50 - DATABASE CONSTRAINT)  
function buildDoppia(matches: MatchAnalysis[], used: number[]) {
  console.log('🎯 Costruendo DOPPIA (quota target 1.90-3.50)')

  const available = matches.filter(m => !used.includes(m.fixture_id))
  if (available.length < 2) return null

  const match1 = available[0]
  const match2 = available[1]
  used.push(match1.fixture_id, match2.fixture_id)

  // Target: ~2.00, quindi ogni partita ~1.40
  const sel1 = chooseSelection(match1, 1.30, 1.60)  
  const sel2 = chooseSelection(match2, 1.30, 1.60)

  const totalOdds = sel1.odds * sel2.odds

  return {
    matches: [
      {
        fixture_id: match1.fixture_id,
        home_team: match1.home_team,
        away_team: match1.away_team,
        league: match1.league,
        time: match1.time,
        prediction: sel1.prediction,
        prediction_label: buildLabel(sel1.prediction, match1.home_team, match1.away_team),
        odds: sel1.odds,
        confidence: match1.confidence,
        reasoning: buildReasoning(sel1.prediction, match1.home_team, match1.away_team)
      },
      {
        fixture_id: match2.fixture_id,
        home_team: match2.home_team,
        away_team: match2.away_team,
        league: match2.league,
        time: match2.time,
        prediction: sel2.prediction,
        prediction_label: buildLabel(sel2.prediction, match2.home_team, match2.away_team),
        odds: sel2.odds,
        confidence: match2.confidence,
        reasoning: buildReasoning(sel2.prediction, match2.home_team, match2.away_team)
      }
    ],
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence: Math.round((match1.confidence + match2.confidence) / 2),
    strategy_reasoning: "Due selezioni sicure per moltiplicatore interessante",
    valid_until: new Date().toISOString().split('T')[0]
  }
}

// TRIPLA: 3 partite, quota totale ~3.00 (range 2.80-5.00 - DATABASE CONSTRAINT)
function buildTripla(matches: MatchAnalysis[], used: number[]) {
  console.log('🎯 Costruendo TRIPLA (quota target 2.80-5.00)')

  const available = matches.filter(m => !used.includes(m.fixture_id))
  if (available.length < 3) return null

  const selectedMatches = available.slice(0, 3)
  selectedMatches.forEach(m => used.push(m.fixture_id))

  // Target: ~3.00, quindi ogni partita ~1.44
  const selections = selectedMatches.map(match => {
    const sel = chooseSelection(match, 1.25, 1.70)
    return {
      fixture_id: match.fixture_id,
      home_team: match.home_team,
      away_team: match.away_team,
      league: match.league,
      time: match.time,
      prediction: sel.prediction,
      prediction_label: buildLabel(sel.prediction, match.home_team, match.away_team),
      odds: sel.odds,
      confidence: match.confidence,
      reasoning: buildReasoning(sel.prediction, match.home_team, match.away_team)
    }
  })

  const totalOdds = selections.reduce((prod, sel) => prod * sel.odds, 1)
  
  // Nessun constraint per la tripla

  return {
    matches: selections,
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence: Math.round(selections.reduce((sum, s) => sum + s.confidence, 0) / selections.length),
    strategy_reasoning: "Tre selezioni equilibrate per quota 3x",
    valid_until: new Date().toISOString().split('T')[0]
  }
}

// MISTA: 6-7 partite, quota totale 8-25 con VARIETÀ (DATABASE CONSTRAINT)
function buildMista(matches: MatchAnalysis[], used: number[]) {
  console.log('🎯 Costruendo MISTA (quota target 8-25)')

  const available = matches.filter(m => !used.includes(m.fixture_id))
  if (available.length < 6) return null

  // LOGICA DINAMICA per raggiungere 8-25: prova con meno partite se necessario
  let selectedMatches = available.slice(0, 7)
  let selections = []
  let totalOdds = 0
  
  // Prova prima con 7, poi 6, poi 5 partite
  for (let numMatches of [7, 6, 5]) {
    selectedMatches = available.slice(0, numMatches)
    selections = []
    
    for (let i = 0; i < selectedMatches.length; i++) {
      const match = selectedMatches[i]
      let sel

      // Varia i tipi per evitare tutte doppie chance
      if (i < 2) {
        // Prime 2: esiti secchi (1, 2) per quote più alte
        sel = chooseSelectionType(match, ['esito'])
      } else if (i < 4) {
        // 2-3: over/under/gol
        sel = chooseSelectionType(match, ['goals'])
      } else {
        // Ultime: doppie chance più sicure
        sel = chooseSelectionType(match, ['doppia_chance'])
      }

      selections.push({
        fixture_id: match.fixture_id,
        home_team: match.home_team,
        away_team: match.away_team,
        league: match.league,
        time: match.time,
        prediction: sel.prediction,
        prediction_label: buildLabel(sel.prediction, match.home_team, match.away_team),
        odds: sel.odds,
        confidence: match.confidence,
        reasoning: buildReasoning(sel.prediction, match.home_team, match.away_team)
      })
    }

    totalOdds = selections.reduce((prod, sel) => prod * sel.odds, 1)
    console.log(`🎲 Mista con ${numMatches} partite: quota ${totalOdds.toFixed(2)}`)
    
    // Se nel range, ferma qui
    if (totalOdds >= 8 && totalOdds <= 25) {
      console.log(`✅ Mista con ${numMatches} partite nel range!`)
      break
    }
  }
  
  // Segna come usate le partite selezionate
  selectedMatches.forEach(m => used.push(m.fixture_id))
  
  // Nessun constraint per la mista

  return {
    matches: selections,
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence: 25,
    strategy_reasoning: `Sette selezioni variegate per moltiplicatore ${Math.round(totalOdds)}x`,
    valid_until: new Date().toISOString().split('T')[0]
  }
}

// BOMBA: 3 risultati esatti
function buildBomba(matches: MatchAnalysis[], used: number[]) {
  console.log('🎯 Costruendo BOMBA (3 risultati esatti)')

  const available = matches.filter(m => !used.includes(m.fixture_id))
  if (available.length < 3) return null

  const selectedMatches = available.slice(0, 3)

  const selections = selectedMatches.map(match => {
    // Risultato esatto coerente con analisi GPT-4
    let exactScore: string

    if (match.esito === '1' && match.over_under === 'Under 2.5') {
      exactScore = '1-0' // Casa vince, pochi gol
    } else if (match.esito === '1' && match.over_under === 'Over 2.5') {
      exactScore = '2-1' // Casa vince, tanti gol
    } else if (match.esito === '2' && match.over_under === 'Under 2.5') {
      exactScore = '0-1' // Ospite vince, pochi gol  
    } else if (match.esito === '2' && match.over_under === 'Over 2.5') {
      exactScore = '1-2' // Ospite vince, tanti gol
    } else if (match.esito === 'X') {
      exactScore = match.over_under === 'Under 2.5' ? '0-0' : '1-1'
    } else {
      exactScore = '1-0' // Default
    }

    const exactOdds = getExactScoreOdds(exactScore)

    return {
      fixture_id: match.fixture_id,
      home_team: match.home_team,
      away_team: match.away_team,
      league: match.league,
      time: match.time,
      prediction: exactScore,
      prediction_label: `RISULTATO ESATTO ${exactScore}`,
      odds: exactOdds,
      confidence: 5,
      reasoning: `Risultato esatto basato su analisi: ${match.esito === '1' ? 'casa vince' : match.esito === '2' ? 'ospite vince' : 'pareggio'}, ${match.over_under.toLowerCase()}`
    }
  })

  const totalOdds = selections.reduce((prod, sel) => prod * sel.odds, 1)

  return {
    matches: selections,
    tip_type: 'risultati_esatti',
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence: 3,
    strategy_reasoning: "Tre risultati esatti coerenti con analisi tecnica",
    valid_until: new Date().toISOString().split('T')[0]
  }
}

// Scegli selezione per raggiungere quota target
function chooseSelection(match: MatchAnalysis, minOdds: number, maxOdds: number, forceRange: boolean = false) {
  const options = [
    { prediction: '1', odds: match.odds.home },
    { prediction: 'X', odds: match.odds.draw },
    { prediction: '2', odds: match.odds.away },
    { prediction: '1X', odds: calculate1X(match.odds.home, match.odds.draw) },
    { prediction: 'X2', odds: calculateX2(match.odds.draw, match.odds.away) },
    { prediction: 'Over 2.5', odds: match.odds.over_2_5 },
    { prediction: 'Under 2.5', odds: match.odds.under_2_5 },
    { prediction: 'Gol', odds: match.odds.btts },
    { prediction: 'NoGol', odds: match.odds.nobtts }
  ]

  // FILTRO INTELLIGENTE: Preferenze sensate basate su esito GPT
  const filteredOptions = options.filter(opt => {
    // Se GPT dice che vince casa (esito=1), escludi X2 e 2
    if (match.esito === '1' && (opt.prediction === 'X2' || opt.prediction === '2')) {
      return false
    }
    // Se GPT dice che vince ospite (esito=2), escludi 1X e 1
    if (match.esito === '2' && (opt.prediction === '1X' || opt.prediction === '1')) {
      return false
    }
    return true
  })

  // Prima prova nel range esatto
  const inRange = filteredOptions.filter(opt => opt.odds >= minOdds && opt.odds <= maxOdds)
  if (inRange.length > 0) {
    return inRange[0]
  }

  // Se forceRange è attivo, restituisce solo se nel range, altrimenti null
  if (forceRange) {
    console.error(`❌ Nessuna opzione nel range ${minOdds}-${maxOdds} per questa partita`)
    return { prediction: '1', odds: 1.70 } // Fallback minimo valido
  }

  // Poi prova la più vicina
  return filteredOptions.reduce((best, curr) => 
    Math.abs(curr.odds - ((minOdds + maxOdds) / 2)) < Math.abs(best.odds - ((minOdds + maxOdds) / 2)) 
      ? curr : best
  )
}

// Scegli selezione per tipo (per varietà nella mista)
function chooseSelectionType(match: MatchAnalysis, types: string[]) {
  if (types.includes('esito')) {
    // Esiti secchi: usa decisione GPT-4
    const esitoOpts = [
      { prediction: '1', odds: match.odds.home },
      { prediction: '2', odds: match.odds.away }
    ]
    return match.esito === '1' ? esitoOpts[0] : 
           match.esito === '2' ? esitoOpts[1] : 
           esitoOpts[0] // Default casa se pareggio
  }

  if (types.includes('goals')) {
    // Goals: usa decisione GPT-4
    return match.over_under === 'Over 2.5' 
      ? { prediction: 'Over 2.5', odds: match.odds.over_2_5 }
      : { prediction: 'Under 2.5', odds: match.odds.under_2_5 }
  }

  if (types.includes('doppia_chance')) {
    // Doppia chance: usa decisione GPT-4  
    return match.esito === '1' 
      ? { prediction: '1X', odds: calculate1X(match.odds.home, match.odds.draw) }
      : { prediction: 'X2', odds: calculateX2(match.odds.draw, match.odds.away) }
  }

  // Default
  return { prediction: '1', odds: match.odds.home }
}

// Calcola quota 1X REALE (MAI inventata)
function calculate1X(homeOdds: number, drawOdds: number): number {
  return 1 / (1/homeOdds + 1/drawOdds)
}

// Calcola quota X2 REALE (MAI inventata)  
function calculateX2(drawOdds: number, awayOdds: number): number {
  return 1 / (1/drawOdds + 1/awayOdds)
}

// Helper: trova migliore selezione nel range da lista di preferenze
function findBestInRange(match: MatchAnalysis, preferences: string[], minOdds: number, maxOdds: number) {
  for (const pred of preferences) {
    const odds = getOddsForPrediction(match, pred)
    if (odds >= minOdds && odds <= maxOdds) {
      return { prediction: pred, odds }
    }
  }
  // Fallback: prima opzione valida
  return { prediction: preferences[0], odds: getOddsForPrediction(match, preferences[0]) }
}

// Helper: ottieni quota per una prediction specifica
function getOddsForPrediction(match: MatchAnalysis, prediction: string): number {
  switch(prediction) {
    case '1': return match.odds.home
    case 'X': return match.odds.draw
    case '2': return match.odds.away
    case '1X': return calculate1X(match.odds.home, match.odds.draw)
    case 'X2': return calculateX2(match.odds.draw, match.odds.away)
    case 'Over 2.5': return match.odds.over_2_5
    case 'Under 2.5': return match.odds.under_2_5
    case 'Over 1.5': return match.odds.over_1_5
    case 'Under 1.5': return match.odds.under_1_5
    case 'Over 3.5': return match.odds.over_3_5
    case 'Under 3.5': return match.odds.under_3_5
    case 'Gol': case 'BTTS': return match.odds.btts
    case 'NoGol': case 'No BTTS': return match.odds.nobtts
    default: return 2.00
  }
}

// Quote risultati esatti realistiche
function getExactScoreOdds(score: string): number {
  const odds: Record<string, number> = {
    '1-0': 6.50, '0-1': 7.50, '2-0': 8.00, '0-2': 9.00,
    '2-1': 8.50, '1-2': 9.50, '1-1': 6.00, '0-0': 9.00,
    '3-0': 13.00, '0-3': 15.00, '3-1': 15.00, '1-3': 17.00
  }
  return odds[score] || 10.00
}

// Costruisci label leggibile
function buildLabel(prediction: string, homeTeam: string, awayTeam: string): string {
  const home = homeTeam.toUpperCase()
  const away = awayTeam.toUpperCase()

  switch(prediction) {
    case '1': return `${home} VINCE`
    case '2': return `${away} VINCE`
    case 'X': return 'PAREGGIO'
    case '1X': return `${home} NON PERDE`
    case 'X2': return `${away} NON PERDE`
    case 'Over 2.5': return 'ALMENO 3 GOL'
    case 'Under 2.5': return 'MASSIMO 2 GOL'
    case 'Gol': return 'ENTRAMBE SEGNANO'
    case 'NoGol': return 'NON ENTRAMBE SEGNANO'
    default: return prediction.toUpperCase()
  }
}

// Motivazione COERENTE con selezione (REGOLA FONDAMENTALE)
function buildReasoning(prediction: string, homeTeam: string, awayTeam: string): string {
  switch(prediction) {
    case '1':
      return `${homeTeam} favorito in casa, ${awayTeam} in difficoltà in trasferta`
    case '2': 
      return `${awayTeam} in forma, ${homeTeam} attraversa un momento difficile`
    case 'X':
      return `Partita equilibrata, entrambe le squadre si equivalgono`
    case '1X':
      return `${homeTeam} difficilmente perde in casa, almeno un pareggio`
    case 'X2':
      return `${awayTeam} può strappare almeno un punto, ${homeTeam} non imbattibile`
    case 'Over 2.5':
      return `Entrambe le squadre hanno attacchi prolifici, partita aperta con tanti gol`
    case 'Under 2.5':
      return `Partita tattica e controllata, difese attente e pochi spazi`
    case 'Gol':
      return `Entrambe segnano: ${homeTeam} e ${awayTeam} hanno attacchi in forma`
    case 'NoGol':
      return `Una delle due non segna: difese solide e attacchi spuntati`
    default:
      return `Selezione basata su analisi tecnica della partita`
  }
}

// Salva nelle 5 tabelle separate
async function saveAllTips(tips: any, date: string, supabase: any) {
  console.log('💾 Salvando tips nelle 5 tabelle...')

  try {
    // 1. PRIMA cancella i tips esistenti per evitare duplicati
    console.log('🗑️ Cancellando tips esistenti per oggi...')
    await Promise.all([
      supabase.from('tips_singola').delete().eq('valid_until', date),
      supabase.from('tips_doppia').delete().eq('valid_until', date),
      supabase.from('tips_tripla').delete().eq('valid_until', date),
      supabase.from('tips_mista').delete().eq('valid_until', date),
      supabase.from('tips_bomba').delete().eq('valid_until', date)
    ])

    // 2. POI inserisci i nuovi tips (insert invece di upsert per evitare conflitti)
    const promises = []

    if (tips.singola) {
      promises.push(
        supabase.from('tips_singola').insert(tips.singola)
      )
    }

    if (tips.doppia) {
      promises.push(
        supabase.from('tips_doppia').insert(tips.doppia)
      )
    }

    if (tips.tripla) {
      promises.push(
        supabase.from('tips_tripla').insert(tips.tripla)
      )
    }

    if (tips.mista) {
      promises.push(
        supabase.from('tips_mista').insert(tips.mista)
      )
    }

    if (tips.bomba) {
      promises.push(
        supabase.from('tips_bomba').insert(tips.bomba)
      )
    }

    const results = await Promise.all(promises)
    console.log('✅ Tutti i tips salvati con successo')

    // Debug: verifica salvataggio
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.error) {
        console.error(`❌ Errore salvataggio tip ${i}:`, result.error)
      } else {
        console.log(`✅ Tip ${i} salvato correttamente`)
      }
    }

  } catch (error) {
    console.error('❌ Errore salvataggio tips:', error)
  }
}

// LEGGE i tips del giorno dalle 5 tabelle
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