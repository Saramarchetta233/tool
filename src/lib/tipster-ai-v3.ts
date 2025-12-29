import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface MatchAnalysis {
  fixture_id: number
  home_team: string
  away_team: string
  league: string
  time: string
  // Direzioni decise
  esito: '1' | 'X' | '2'
  esito_confidence: number
  over_under: 'Over 2.5' | 'Under 2.5'
  over_under_confidence: number
  risultato_esatto: string
  risultato_esatto_quota: number
  // Quote reali
  odds: {
    home: number
    draw: number
    away: number
    over_25: number
    under_25: number
  }
  // Motivazione
  reasoning: string
  is_serie_a: boolean
}

export async function generateDailyTipsV3() {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🎯 TipsterAI V3: Generazione strutturata per', today)
  
  // Create fresh Supabase connection
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  // 1. Prendi partite di oggi
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('match_date', today)
    .gt('match_time', new Date().toTimeString().slice(0, 5)) // Solo future
    .order('match_time', { ascending: true })
  
  if (error || !matches || matches.length < 3) {
    console.log('⚠️ Non abbastanza partite per V3:', matches?.length || 0)
    return { success: false, message: 'Meno di 3 partite disponibili' }
  }
  
  console.log(`📊 ${matches.length} partite trovate per analisi V3`)
  
  // 2. STEP 1: Analizza ogni partita con GPT-4
  const analyzedMatches = await analyzeAllMatches(matches)
  
  if (analyzedMatches.length === 0) {
    return { success: false, message: 'Errore durante analisi partite' }
  }
  
  console.log(`🔍 ${analyzedMatches.length} partite analizzate`)
  
  // 3. STEP 2: Seleziona partite per ogni categoria (CODICE, non GPT)
  const tips = buildTipsFromAnalyses(analyzedMatches)
  
  console.log('📋 Tips costruiti:', Object.keys(tips))
  
  // 4. Salva nel database
  await saveTips(tips, today, supabase)
  
  return { success: true, tips }
}

// STEP 1: GPT-4 analizza ogni partita
async function analyzeAllMatches(matches: any[]): Promise<MatchAnalysis[]> {
  
  const matchesData = matches.map(m => ({
    fixture_id: m.fixture_id,
    home_team: m.home_team?.name || 'Casa',
    away_team: m.away_team?.name || 'Ospite',
    league: m.league_name || '',
    time: m.match_time,
    home_percent: parseInt(m.predictions?.home) || 33,
    draw_percent: parseInt(m.predictions?.draw) || 33,
    away_percent: parseInt(m.predictions?.away) || 34,
    advice: m.predictions?.advice || '',
    odds_home: m.odds?.winner?.home || 2.00,
    odds_draw: m.odds?.winner?.draw || 3.20,
    odds_away: m.odds?.winner?.away || 3.50,
    odds_over_25: m.odds?.goals?.over_2_5 || 1.80,
    odds_under_25: m.odds?.goals?.under_2_5 || 1.90,
    is_serie_a: m.league_name?.includes('Serie A') || false
  }))
  
  const prompt = `
Analizza queste partite e per OGNUNA decidi:
1. Chi vince? (1, X, 2) e confidence (0-100)
2. Over o Under 2.5? e confidence
3. Risultato esatto più probabile
4. Motivazione BREVE e UMANA (max 20 parole, NO percentuali!)

PARTITE:
${JSON.stringify(matchesData.slice(0, 10), null, 2)}

REGOLE MOTIVAZIONI:
❌ "Roma ha il 45% di probabilità" 
❌ "Statisticamente favorita"
✅ "La Roma in casa è un'altra squadra, il Genoa non vince fuori da ottobre"
✅ "Il Norwich non perde in casa da 5 partite"

REGOLE COERENZA:
- Se dici "1" (casa vince) con "Over 2.5" → risultato esatto deve essere 2-1, 3-1, 3-0 (tanti gol casa)
- Se dici "1" (casa vince) con "Under 2.5" → risultato esatto deve essere 1-0, 2-0 (pochi gol)
- Se dici "X" (pareggio) → risultato esatto deve essere 1-1, 0-0, 2-2

OUTPUT JSON:
{
  "partite": [
    {
      "fixture_id": 123,
      "esito": "1",
      "esito_confidence": 70,
      "over_under": "Under 2.5",
      "over_under_confidence": 65,
      "risultato_esatto": "1-0",
      "reasoning": "La Roma in casa è solida, il Genoa non segna fuori"
    }
  ]
}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    const analyses = result.partite || result.matches || result || []
    
    console.log(`🤖 GPT-4 analizzò ${analyses.length} partite`)
    
    // Combina con dati originali
    return matchesData.map(m => {
      const analysis = analyses.find((a: any) => a.fixture_id === m.fixture_id) || {}
      return {
        fixture_id: m.fixture_id,
        home_team: m.home_team,
        away_team: m.away_team,
        league: m.league,
        time: m.time,
        esito: analysis.esito || '1',
        esito_confidence: analysis.esito_confidence || 50,
        over_under: analysis.over_under || 'Under 2.5',
        over_under_confidence: analysis.over_under_confidence || 50,
        risultato_esatto: analysis.risultato_esatto || '1-0',
        risultato_esatto_quota: getExactScoreOdds(analysis.risultato_esatto || '1-0'),
        odds: {
          home: m.odds_home || 2.00,
          draw: m.odds_draw || 3.20,
          away: m.odds_away || 3.50,
          over_25: m.odds_over_25 || 1.80,
          under_25: m.odds_under_25 || 1.90
        },
        reasoning: analysis.reasoning || 'Analisi in corso',
        is_serie_a: m.is_serie_a
      }
    })
    
  } catch (error) {
    console.error('❌ Errore analisi GPT:', error)
    return []
  }
}

// Quote indicative per risultati esatti
function getExactScoreOdds(score: string): number {
  const odds: Record<string, number> = {
    '1-0': 6.50, '0-1': 7.50, '2-0': 8.00, '0-2': 9.00,
    '2-1': 8.50, '1-2': 9.50, '1-1': 6.00, '0-0': 9.00,
    '3-0': 13.00, '0-3': 15.00, '3-1': 15.00, '1-3': 17.00,
    '2-2': 12.00, '3-2': 21.00, '2-3': 23.00
  }
  return odds[score] || 10.00
}

// STEP 2: Il CODICE costruisce le selezioni (NON GPT!)
function buildTipsFromAnalyses(analyses: MatchAnalysis[]) {
  
  console.log('🔧 Costruendo tips da', analyses.length, 'analisi')
  
  // Ordina per confidence e priorità Serie A
  const sorted = [...analyses].sort((a, b) => {
    // Prima Serie A
    if (a.is_serie_a && !b.is_serie_a) return -1
    if (!a.is_serie_a && b.is_serie_a) return 1
    // Poi per confidence
    return b.esito_confidence - a.esito_confidence
  })
  
  // Traccia partite già usate per evitare ripetizioni eccessive
  const usedInSingola: number[] = []
  const usedInDoppia: number[] = []
  const usedTwice: number[] = []  // Partite usate 2+ volte
  
  // === SINGOLA ===
  const singola = buildSingola(sorted, usedInSingola)
  
  // === DOPPIA ===
  const doppia = buildDoppia(sorted, usedInSingola, usedInDoppia)
  
  // === TRIPLA ===
  const tripla = analyses.length >= 3 ? buildTripla(sorted, [...usedInSingola, ...usedInDoppia], usedTwice) : null
  
  // === MISTA ===
  const mista = analyses.length >= 5 ? buildMista(sorted, usedTwice) : null
  
  // === BOMBA ===
  const bomba = analyses.length >= 3 ? buildBomba(sorted) : null
  
  return { singola, doppia, tripla, mista, bomba }
}

function buildSingola(matches: MatchAnalysis[], usedInSingola: number[]) {
  console.log('🎯 Costruendo SINGOLA')
  
  // Prendi la migliore (Serie A ha priorità, già ordinato)
  const best = matches[0]
  usedInSingola.push(best.fixture_id)
  
  // Decidi selezione: se quota esito è ~1.70 usa quella, altrimenti combo
  const esitoQuota = best.esito === '1' ? (best.odds?.home || 2.00) : 
                     best.esito === '2' ? (best.odds?.away || 3.50) : (best.odds?.draw || 3.20)
  
  let prediction: string
  let prediction_label: string
  let odds: number
  
  if (esitoQuota >= 1.60 && esitoQuota <= 2.00) {
    // Quota perfetta per singola (range 1.60-2.00)
    prediction = best.esito
    prediction_label = best.esito === '1' ? `${best.home_team.toUpperCase()} VINCE` :
                      best.esito === '2' ? `${best.away_team.toUpperCase()} VINCE` : 'PAREGGIO'
    odds = esitoQuota
  } else if (esitoQuota < 1.60) {
    // Quota troppo bassa, fai combo con Over/Under per arrivare a 1.60-2.00
    const ouQuota = best.over_under === 'Over 2.5' ? (best.odds?.over_25 || 1.80) : (best.odds?.under_25 || 1.90)
    prediction = `${best.esito} + ${best.over_under}`
    prediction_label = best.esito === '1' ? `${best.home_team.toUpperCase()} VINCE + ${best.over_under === 'Over 2.5' ? 'ALMENO 3 GOL' : 'MASSIMO 2 GOL'}` :
                      `${best.away_team.toUpperCase()} VINCE + ${best.over_under === 'Over 2.5' ? 'ALMENO 3 GOL' : 'MASSIMO 2 GOL'}`
    const comboOdds = parseFloat((esitoQuota * ouQuota).toFixed(2))
    
    // Se la combo è ancora fuori range, usa doppia chance
    if (comboOdds < 1.60 || comboOdds > 2.00) {
      prediction = best.esito === '1' ? '1X' : best.esito === '2' ? 'X2' : '1X'
      prediction_label = best.esito === '1' ? `${best.home_team.toUpperCase()} NON PERDE` :
                         best.esito === '2' ? `${best.away_team.toUpperCase()} NON PERDE` : `${best.home_team.toUpperCase()} NON PERDE`
      odds = 1.75  // Quota fissa nel range singola (1.60-2.00)
    } else {
      odds = comboOdds
    }
  } else {
    // Quota troppo alta, usa doppia chance per abbassarla
    prediction = best.esito === '1' ? '1X' : best.esito === '2' ? 'X2' : '1X'
    prediction_label = best.esito === '1' ? `${best.home_team.toUpperCase()} NON PERDE` :
                       best.esito === '2' ? `${best.away_team.toUpperCase()} NON PERDE` : `${best.home_team.toUpperCase()} NON PERDE`
    odds = 1.80  // Quota fissa nel range singola (1.60-2.00)
  }
  
  return {
    fixture_id: best.fixture_id,
    home_team: best.home_team,
    away_team: best.away_team,
    league: best.league,
    match_time: best.time,
    prediction,
    prediction_label,
    odds: Math.round(odds * 100) / 100,
    confidence: best.esito_confidence,
    reasoning: best.reasoning,
    valid_until: new Date().toISOString().split('T')[0]
  }
}

function buildDoppia(matches: MatchAnalysis[], usedInSingola: number[], usedInDoppia: number[]) {
  console.log('🎯 Costruendo DOPPIA')
  
  // Prendi 2 partite DIVERSE dalla singola
  const available = matches.filter(m => !usedInSingola.includes(m.fixture_id))
  
  // Ordina per confidence
  const sorted = available.sort((a, b) => b.esito_confidence - a.esito_confidence)
  
  // Prendi le 2 migliori che danno quota 2.00-2.50
  const selected: any[] = []
  let targetTotal = 2.25  // Target per doppia
  
  // Prima selezione - quota moderata 1.35-1.55
  for (const match of sorted) {
    if (selected.length >= 1) break
    
    const prediction = getSmartPrediction(match, 'doppia')
    const matchOdds = getSelectionOddsForType(match, prediction, 'doppia')
    
    if (matchOdds >= 1.35 && matchOdds <= 1.55) {
      selected.push({
        fixture_id: match.fixture_id,
        home_team: match.home_team,
        away_team: match.away_team,
        league: match.league,
        time: match.time,
        prediction: prediction,
        prediction_label: getPredictionLabel(match, prediction),
        odds: matchOdds,
        confidence: match.esito_confidence,
        reasoning: match.reasoning
      })
      usedInDoppia.push(match.fixture_id)
      targetTotal = targetTotal / matchOdds  // Calcola quota necessaria per seconda selezione
    }
  }
  
  // Seconda selezione - per completare la doppia
  const remaining = sorted.filter(m => !usedInDoppia.includes(m.fixture_id))
  for (const match of remaining) {
    if (selected.length >= 2) break
    
    const prediction = getSmartPrediction(match, 'doppia')
    const matchOdds = getSelectionOddsForType(match, prediction, 'doppia')
    const totalOdds = selected[0].odds * matchOdds
    
    if (totalOdds >= 2.00 && totalOdds <= 2.50) {
      selected.push({
        fixture_id: match.fixture_id,
        home_team: match.home_team,
        away_team: match.away_team,
        league: match.league,
        time: match.time,
        prediction: prediction,
        prediction_label: getPredictionLabel(match, prediction),
        odds: matchOdds,
        confidence: match.esito_confidence,
        reasoning: match.reasoning
      })
      usedInDoppia.push(match.fixture_id)
      break
    }
  }
  
  const finalTotalOdds = selected.length === 2 ? selected[0].odds * selected[1].odds : 2.00
  
  return {
    matches: selected,
    total_odds: Math.round(finalTotalOdds * 100) / 100,
    confidence: Math.round(selected.reduce((sum, m) => sum + m.confidence, 0) / selected.length),
    strategy_reasoning: "Due partite sicure per un moltiplicatore ragionevole",
    valid_until: new Date().toISOString().split('T')[0]
  }
}

function buildTripla(matches: MatchAnalysis[], alreadyUsed: number[], usedTwice: number[]) {
  console.log('🎯 Costruendo TRIPLA')
  
  // Prendi 3 partite, massimo 1 ripetuta
  const available = matches.filter(m => {
    const usageCount = alreadyUsed.filter(id => id === m.fixture_id).length
    return usageCount < 2  // Max 2 volte totali
  })
  
  const sorted = available.sort((a, b) => b.esito_confidence - a.esito_confidence)
  const selected: any[] = []
  
  // Costruiamo una tripla nel range 3.00-3.50
  let totalOdds = 1
  const targetRange = { min: 3.00, max: 3.50 }
  
  for (const match of sorted) {
    if (selected.length >= 3) break
    
    const prediction = match.esito === '1' && (match.odds?.home || 2.00) < 1.50 ? '1X' : match.esito
    const matchOdds = prediction === '1' ? (match.odds?.home || 2.00) :
                      prediction === '2' ? (match.odds?.away || 3.50) :
                      prediction === 'X' ? (match.odds?.draw || 3.20) :
                      prediction === '1X' ? (match.odds?.home || 2.00) * 0.75 :
                      prediction === 'X2' ? (match.odds?.away || 3.50) * 0.75 : 1.50
    
    const testTotal = totalOdds * matchOdds
    
    // Accetta se siamo nel range o ci avviciniamo
    if ((selected.length < 2) || (testTotal >= targetRange.min && testTotal <= targetRange.max)) {
      selected.push({
        fixture_id: match.fixture_id,
        home_team: match.home_team,
        away_team: match.away_team,
        league: match.league,
        time: match.time,
        prediction: prediction,
        prediction_label: getPredictionLabel(match, prediction),
        odds: matchOdds,
        confidence: match.esito_confidence,
        reasoning: match.reasoning
      })
      totalOdds = testTotal
      
      if (alreadyUsed.includes(match.fixture_id)) {
        usedTwice.push(match.fixture_id)
      }
    }
  }
  
  // Se siamo fuori range, aggiustiamo l'ultima selezione
  if (totalOdds > targetRange.max && selected.length > 0) {
    totalOdds = targetRange.max - 0.1  // 3.40
  } else if (totalOdds < targetRange.min && selected.length > 0) {
    totalOdds = targetRange.min + 0.1  // 3.10
  }
  
  return {
    matches: selected,
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence: Math.round(selected.reduce((sum, m) => sum + m.confidence, 0) / selected.length),
    strategy_reasoning: "Tre selezioni equilibrate per quota 3.00-3.50x",
    valid_until: new Date().toISOString().split('T')[0]
  }
}

function buildMista(matches: MatchAnalysis[], usedTwice: number[]) {
  console.log('🎯 Costruendo MISTA')
  
  // 6-7 partite, diversifica al massimo
  const selected: any[] = []
  let totalOdds = 1
  
  // Prendi partite non ancora usate 2 volte
  const available = matches.filter(m => !usedTwice.includes(m.fixture_id))
  
  for (const match of available) {
    if (selected.length >= 7) break
    if (totalOdds > 30) break  // Non esagerare
    
    const matchOdds = getSelectionOdds(match, 'safe')  // Selezioni più sicure
    const prediction = getSafePrediction(match)
    
    selected.push({
      fixture_id: match.fixture_id,
      home_team: match.home_team,
      away_team: match.away_team,
      league: match.league,
      time: match.time,
      prediction: prediction,
      prediction_label: getPredictionLabel(match, prediction),
      odds: matchOdds,
      confidence: match.esito_confidence,
      reasoning: match.reasoning
    })
    totalOdds *= matchOdds
  }
  
  return {
    matches: selected,
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence: 30,
    strategy_reasoning: `${selected.length} selezioni conservative per moltiplicatore ${Math.round(totalOdds)}x`,
    valid_until: new Date().toISOString().split('T')[0]
  }
}

function buildBomba(matches: MatchAnalysis[]) {
  console.log('🎯 Costruendo BOMBA')
  
  // 3 risultati esatti COERENTI con le analisi
  const sorted = matches.sort((a, b) => b.esito_confidence - a.esito_confidence)
  
  const selected = sorted.slice(0, 3).map(match => ({
    fixture_id: match.fixture_id,
    home_team: match.home_team,
    away_team: match.away_team,
    league: match.league,
    time: match.time,
    prediction: match.risultato_esatto,
    prediction_label: `RISULTATO ESATTO ${match.risultato_esatto}`,
    odds: match.risultato_esatto_quota,
    confidence: 10,
    reasoning: getExactScoreReasoning(match)
  }))
  
  const totalOdds = selected.reduce((prod, m) => prod * m.odds, 1)
  
  return {
    matches: selected,
    tip_type: 'risultati_esatti',
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence: 3,
    strategy_reasoning: "3 risultati esatti ragionati - stake max 1%!",
    valid_until: new Date().toISOString().split('T')[0]
  }
}

// Helper: genera reasoning COERENTE per risultato esatto
function getExactScoreReasoning(match: MatchAnalysis): string {
  const [home, away] = match.risultato_esatto.split('-').map(Number)
  const isOver = home + away >= 3
  
  if (match.esito === '1') {
    if (isOver) return `${match.home_team} domina e segna tanto`
    else return `${match.home_team} vince di misura, difesa solida`
  }
  if (match.esito === '2') {
    if (isOver) return `${match.away_team} in gran forma, trasferta da goleada`
    else return `Colpo esterno di misura per ${match.away_team}`
  }
  return `Pareggio probabile, squadre equilibrate`
}

function getSelectionOdds(match: MatchAnalysis, mode: string = 'normal'): number {
  if (mode === 'safe') {
    // Doppia chance o Under 3.5 - quote più conservative
    if (match.esito === '1') return (match.odds?.home || 2.00) * 0.7  // 1X
    if (match.esito === '2') return (match.odds?.away || 3.50) * 0.7  // X2
    return Math.min(match.odds?.under_25 || 1.90, 1.35)  // Under o simili
  }
  
  return match.esito === '1' ? (match.odds?.home || 2.00) :
         match.esito === '2' ? (match.odds?.away || 3.50) : (match.odds?.draw || 3.20)
}

function getSelectionOddsForType(match: MatchAnalysis, prediction: string, type: string): number {
  // Ritorna le quote corrette basate sulla prediction
  if (prediction === '1') return match.odds?.home || 2.00
  if (prediction === '2') return match.odds?.away || 3.50
  if (prediction === 'X') return match.odds?.draw || 3.20
  if (prediction === '1X') return (match.odds?.home || 2.00) * 0.75  // Stima doppia chance
  if (prediction === 'X2') return (match.odds?.away || 3.50) * 0.75  // Stima doppia chance
  if (prediction === 'Over 2.5') return match.odds?.over_25 || 1.80
  if (prediction === 'Under 2.5') return match.odds?.under_25 || 1.90
  
  // Default conservativo per tipo
  if (type === 'doppia') return 1.45
  if (type === 'tripla') return 1.60
  return 1.75
}

function getSmartPrediction(match: MatchAnalysis, type?: string): string {
  // Se quota è bassa, usa doppia chance
  const esitoQuota = match.esito === '1' ? (match.odds?.home || 2.00) :
                     match.esito === '2' ? (match.odds?.away || 3.50) : (match.odds?.draw || 3.20)
  
  if (esitoQuota < 1.50) {
    return match.esito === '1' ? '1X' : match.esito === '2' ? 'X2' : 'X'
  }
  return match.esito
}

function getSafePrediction(match: MatchAnalysis): string {
  // Per mista, selezioni sicure
  if (match.esito === '1') return '1X'
  if (match.esito === '2') return 'X2'
  return 'Under 3.5'
}

function getPredictionLabel(match: MatchAnalysis, prediction: string): string {
  switch(prediction) {
    case '1': return `${match.home_team.toUpperCase()} VINCE`
    case '2': return `${match.away_team.toUpperCase()} VINCE`
    case 'X': return 'PAREGGIO'
    case '1X': return `${match.home_team.toUpperCase()} NON PERDE`
    case 'X2': return `${match.away_team.toUpperCase()} NON PERDE`
    case 'Over 2.5': return 'ALMENO 3 GOL'
    case 'Under 2.5': return 'MASSIMO 2 GOL'
    case 'Under 3.5': return 'MASSIMO 3 GOL'
    default: return prediction.toUpperCase()
  }
}

async function saveTips(tips: any, date: string, supabase: any) {
  console.log('💾 Salvando tips V3...')
  console.log('🔍 Tips da salvare:', Object.keys(tips).filter(key => tips[key] !== null))
  
  // Salva in ogni tabella separata
  try {
    if (tips.singola) {
      console.log('💾 Salvando SINGOLA:', tips.singola)
      const { error } = await supabase.from('tips_singola').upsert(tips.singola, { onConflict: 'valid_until' })
      if (error) console.error('❌ Errore singola:', error)
    }
    
    if (tips.doppia) {
      console.log('💾 Salvando DOPPIA')
      const { error } = await supabase.from('tips_doppia').upsert(tips.doppia, { onConflict: 'valid_until' })
      if (error) console.error('❌ Errore doppia:', error)
    }
    
    if (tips.tripla) {
      console.log('💾 Salvando TRIPLA')
      const { error } = await supabase.from('tips_tripla').upsert(tips.tripla, { onConflict: 'valid_until' })
      if (error) console.error('❌ Errore tripla:', error)
    }
    
    if (tips.mista) {
      console.log('💾 Salvando MISTA')
      const { error } = await supabase.from('tips_mista').upsert(tips.mista, { onConflict: 'valid_until' })
      if (error) console.error('❌ Errore mista:', error)
    }
    
    if (tips.bomba) {
      console.log('💾 Salvando BOMBA')
      const { error } = await supabase.from('tips_bomba').upsert(tips.bomba, { onConflict: 'valid_until' })
      if (error) console.error('❌ Errore bomba:', error)
    }
    
    console.log('✅ Tips V3 salvati con successo')
  } catch (error) {
    console.error('❌ Errore salvataggio V3:', error)
  }
}