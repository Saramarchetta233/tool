import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Priorità campionati
const LEAGUE_PRIORITY = {
  'Serie A': 1,
  'Premier League': 2,
  'La Liga': 3,
  'Bundesliga': 4,
  'Ligue 1': 5,
  'Serie B': 6,
}

interface Match {
  fixture_id: number
  home_team: { name: string }
  away_team: { name: string }
  league_name: string
  match_time: string
  match_date: string
  odds: {
    winner?: { home: number; draw: number; away: number }
    goals?: { over_2_5: number; under_2_5: number; over_1_5: number; under_1_5: number }
    both_teams_score?: { yes: number; no: number }
  }
  predictions?: {
    predictions?: { home: string; draw: string; away: string; advice: string }
    stats?: any
  }
}

interface MatchAnalysis {
  fixture_id: number
  home_team: string
  away_team: string
  league: string
  time: string
  confidence: number
  reasoning: string
  suggestions: {
    esito: '1' | 'X' | '2'
    over_under: 'Over 2.5' | 'Under 2.5' | 'Over 1.5' | 'Under 1.5'
    gol: 'Gol' | 'NoGol'
    combo: string[]
    risultato_esatto: string
  }
  odds: {
    home: number
    draw: number
    away: number
    over_25: number
    under_25: number
    over_15: number
    under_15: number
    gol: number
    nogol: number
  }
  priority: number
}

interface TipSelection {
  fixture_id: number
  home_team: string
  away_team: string
  league: string
  time: string
  prediction: string
  prediction_label: string
  odds: number
  confidence: number
  reasoning: string
}

export async function generateDailyTipsV4(targetDate?: string) {
  const today = targetDate || new Date().toISOString().split('T')[0]
  
  console.log('🎯 TipsterAI V4: Generazione intelligente per', today)
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false }
    }
  )
  
  // 1. Prendi partite del giorno specificato
  let query = supabase
    .from('matches')
    .select('*')
    .eq('match_date', today)
    .order('match_time', { ascending: true })
  
  // Solo per oggi filtra per orari futuri
  if (today === new Date().toISOString().split('T')[0]) {
    query = query.gt('match_time', new Date().toTimeString().slice(0, 5))
  }
  
  const { data: matches, error } = await query
  
  if (error || !matches || matches.length < 5) {
    console.log('⚠️ Non abbastanza partite:', matches?.length || 0)
    return { success: false, message: 'Servono almeno 5 partite per generare i tips' }
  }
  
  console.log(`📊 ${matches.length} partite trovate`)
  
  // 2. Ordina per priorità campionati
  const sortedMatches = sortMatchesByPriority(matches)
  
  // 3. Analizza tutte le partite in modo intelligente
  const analyzedMatches = await analyzeMatchesIntelligently(sortedMatches)
  
  if (analyzedMatches.length === 0) {
    return { success: false, message: 'Errore durante analisi partite' }
  }
  
  // 4. Costruisci tips con logica migliorata
  const tips = buildSmartTips(analyzedMatches, matches.length)
  
  // 5. Salva nel database
  await saveTipsV4(tips, today, supabase)
  
  return { success: true, tips }
}

function sortMatchesByPriority(matches: Match[]): Match[] {
  return matches.sort((a, b) => {
    const priorityA = LEAGUE_PRIORITY[a.league_name] || 999
    const priorityB = LEAGUE_PRIORITY[b.league_name] || 999
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // A parità di priorità, ordina per orario
    return a.match_time.localeCompare(b.match_time)
  })
}

async function analyzeMatchesIntelligently(matches: Match[]): Promise<MatchAnalysis[]> {
  // Prepara dati per GPT con quote reali
  const matchesForAnalysis = matches.slice(0, 20).map(m => ({
    id: m.fixture_id,
    partita: `${m.home_team?.name || 'Casa'} vs ${m.away_team?.name || 'Ospite'}`,
    lega: m.league_name,
    ora: m.match_time,
    quote: {
      '1': m.odds?.winner?.home || null,
      'X': m.odds?.winner?.draw || null,
      '2': m.odds?.winner?.away || null,
      'Over 2.5': m.odds?.goals?.over_2_5 || null,
      'Under 2.5': m.odds?.goals?.under_2_5 || null,
      'Gol': m.odds?.both_teams_score?.yes || null,
      'NoGol': m.odds?.both_teams_score?.no || null
    },
    predizioni: {
      casa: m.predictions?.predictions?.home || null,
      pareggio: m.predictions?.predictions?.draw || null,
      ospite: m.predictions?.predictions?.away || null,
      consiglio: m.predictions?.predictions?.advice || null
    }
  }))
  
  const prompt = `Sei un esperto di scommesse calcistiche. Analizza queste partite e per OGNUNA:

1. Valuta attentamente quote e statistiche
2. Identifica il pronostico PIÙ PROBABILE considerando le quote reali
3. Suggerisci alternative (combo, over/under, gol)
4. Dai una confidence 0-100 basata sui dati
5. Scrivi una motivazione UMANA e NATURALE (NO percentuali!)

PARTITE:
${JSON.stringify(matchesForAnalysis, null, 2)}

REGOLE MOTIVAZIONI:
✅ "Il Milan in casa raramente delude, la difesa del Verona è in difficoltà"
✅ "Derby sempre equilibrato, meglio puntare sui gol"
❌ "Il Milan ha il 65% di vittoria"
❌ "Statisticamente probabile l'Over"

OUTPUT JSON:
{
  "analisi": [
    {
      "fixture_id": 123,
      "confidence": 75,
      "reasoning": "Juventus imbattuta in casa, Empoli senza vittorie fuori",
      "suggestions": {
        "esito": "1",
        "over_under": "Under 2.5",
        "gol": "NoGol",
        "combo": ["1X + Under 3.5", "1 + NoGol"],
        "risultato_esatto": "2-0"
      }
    }
  ]
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    const analyses = result.analisi || []
    
    // Combina con dati originali
    return matches.map((m, idx) => {
      const analysis = analyses.find((a: any) => a.fixture_id === m.fixture_id) || analyses[idx] || {}
      const priority = LEAGUE_PRIORITY[m.league_name] || 999
      
      return {
        fixture_id: m.fixture_id,
        home_team: m.home_team?.name || 'Casa',
        away_team: m.away_team?.name || 'Ospite',
        league: m.league_name,
        time: m.match_time,
        confidence: analysis.confidence || 50,
        reasoning: analysis.reasoning || 'Partita equilibrata, scelta basata su forma recente',
        suggestions: analysis.suggestions || {
          esito: '1',
          over_under: 'Under 2.5',
          gol: 'NoGol',
          combo: ['1X', '1 + Under 3.5'],
          risultato_esatto: '1-0'
        },
        odds: {
          home: m.odds?.winner?.home || 2.00,
          draw: m.odds?.winner?.draw || 3.20,
          away: m.odds?.winner?.away || 3.50,
          over_25: m.odds?.goals?.over_2_5 || 1.80,
          under_25: m.odds?.goals?.under_2_5 || 1.90,
          over_15: m.odds?.goals?.over_1_5 || 1.30,
          under_15: m.odds?.goals?.under_1_5 || 3.20,
          gol: m.odds?.both_teams_score?.yes || 1.75,
          nogol: m.odds?.both_teams_score?.no || 1.95
        },
        priority
      }
    })
    
  } catch (error) {
    console.error('❌ Errore analisi GPT:', error)
    return []
  }
}

function buildSmartTips(analyses: MatchAnalysis[], totalMatches: number) {
  console.log('🔧 Costruendo tips intelligenti...')
  
  // Ordina per confidence e priorità
  const sorted = [...analyses].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return b.confidence - a.confidence
  })
  
  const usedMatches = new Set<number>()
  
  // SINGOLA - Quota 1.60-2.00
  const singola = buildSmartSingola(sorted, usedMatches)
  
  // DOPPIA - Quota totale 2.00-2.50
  const doppia = buildSmartDoppia(sorted, usedMatches)
  
  // Da 15+ partite aggiungi anche tripla, mista e bomba
  const tripla = totalMatches >= 15 ? buildSmartTripla(sorted, usedMatches) : null
  const mista = totalMatches >= 15 ? buildSmartMista(sorted, usedMatches) : null
  const bomba = totalMatches >= 15 ? buildSmartBomba(sorted, usedMatches) : null
  
  return { singola, doppia, tripla, mista, bomba }
}

function buildSmartSingola(matches: MatchAnalysis[], usedMatches: Set<number>): any {
  console.log('🎯 SINGOLA: Cerco quota 1.60-2.00')
  
  for (const match of matches) {
    if (usedMatches.has(match.fixture_id)) continue
    
    // Trova selezione con quota nel range
    const selections = getSelectionsForMatch(match)
    
    for (const sel of selections) {
      if (sel.odds >= 1.60 && sel.odds <= 2.00) {
        usedMatches.add(match.fixture_id)
        
        return {
          fixture_id: match.fixture_id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_time: match.time,
          prediction: sel.type,
          prediction_label: sel.label,
          odds: sel.odds,
          confidence: match.confidence,
          reasoning: match.reasoning,
          valid_until: new Date().toISOString().split('T')[0]
        }
      }
    }
  }
  
  // Fallback: prendi la migliore e aggiusta quota
  const best = matches[0]
  usedMatches.add(best.fixture_id)
  
  return {
    fixture_id: best.fixture_id,
    home_team: best.home_team,
    away_team: best.away_team,
    league: best.league,
    match_time: best.time,
    prediction: '1X',
    prediction_label: `${best.home_team} NON PERDE`,
    odds: 1.75,
    confidence: best.confidence,
    reasoning: best.reasoning,
    valid_until: new Date().toISOString().split('T')[0]
  }
}

function buildSmartDoppia(matches: MatchAnalysis[], usedMatches: Set<number>): any {
  console.log('🎯 DOPPIA: Cerco 2 partite per quota totale 2.00-2.50')
  
  const selections: TipSelection[] = []
  let totalOdds = 1
  
  // Prima selezione: quota 1.30-1.50
  for (const match of matches) {
    if (usedMatches.has(match.fixture_id)) continue
    if (selections.length > 0) break
    
    const sels = getSelectionsForMatch(match)
    for (const sel of sels) {
      if (sel.odds >= 1.30 && sel.odds <= 1.50) {
        selections.push({
          fixture_id: match.fixture_id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          time: match.time,
          prediction: sel.type,
          prediction_label: sel.label,
          odds: sel.odds,
          confidence: match.confidence,
          reasoning: match.reasoning
        })
        usedMatches.add(match.fixture_id)
        totalOdds *= sel.odds
        break
      }
    }
  }
  
  // Seconda selezione: completa per arrivare a 2.00-2.50
  const targetOdds = 2.25 / totalOdds
  for (const match of matches) {
    if (usedMatches.has(match.fixture_id)) continue
    if (selections.length >= 2) break
    
    const sels = getSelectionsForMatch(match)
    for (const sel of sels) {
      const newTotal = totalOdds * sel.odds
      if (newTotal >= 2.00 && newTotal <= 2.50) {
        selections.push({
          fixture_id: match.fixture_id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          time: match.time,
          prediction: sel.type,
          prediction_label: sel.label,
          odds: sel.odds,
          confidence: match.confidence,
          reasoning: match.reasoning
        })
        usedMatches.add(match.fixture_id)
        totalOdds = newTotal
        break
      }
    }
  }
  
  // Assicurati di avere esattamente 2 selezioni
  if (selections.length < 2) {
    const remaining = matches.filter(m => !usedMatches.has(m.fixture_id))
    if (remaining.length > 0) {
      const match = remaining[0]
      selections.push({
        fixture_id: match.fixture_id,
        home_team: match.home_team,
        away_team: match.away_team,
        league: match.league,
        time: match.time,
        prediction: 'Under 3.5',
        prediction_label: 'MASSIMO 3 GOL',
        odds: 1.25,
        confidence: match.confidence,
        reasoning: match.reasoning
      })
      totalOdds = 2.25 // Forza nel range
    }
  }
  
  return {
    matches: selections,
    total_odds: Math.min(Math.max(totalOdds, 2.00), 2.50),
    confidence: Math.round(selections.reduce((sum, s) => sum + s.confidence, 0) / selections.length),
    strategy_reasoning: "Due selezioni bilanciate per raddoppiare la posta",
    valid_until: new Date().toISOString().split('T')[0]
  }
}

function buildSmartTripla(matches: MatchAnalysis[], usedMatches: Set<number>): any {
  console.log('🎯 TRIPLA: Cerco 3 partite per quota totale 3.00-3.50')
  
  const selections: TipSelection[] = []
  let totalOdds = 1
  
  // Cerca 3 partite con quote intorno a 1.50 ciascuna
  for (const match of matches) {
    if (selections.length >= 3) break
    if (usedMatches.size > 0 && usedMatches.has(match.fixture_id)) {
      continue // Salta solo se già usata, permettendo qualche ripetizione
    }
    
    const sels = getSelectionsForMatch(match)
    for (const sel of sels) {
      if (sel.odds >= 1.40 && sel.odds <= 1.60) {
        selections.push({
          fixture_id: match.fixture_id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          time: match.time,
          prediction: sel.type,
          prediction_label: sel.label,
          odds: sel.odds,
          confidence: match.confidence,
          reasoning: match.reasoning
        })
        totalOdds *= sel.odds
        break
      }
    }
  }
  
  // Aggiusta per il range 3.00-3.50
  totalOdds = Math.min(Math.max(totalOdds, 3.00), 3.50)
  
  return {
    matches: selections,
    total_odds: totalOdds,
    confidence: Math.round(selections.reduce((sum, s) => sum + s.confidence, 0) / selections.length),
    strategy_reasoning: "Tre partite ragionate per triplicare l'investimento",
    valid_until: new Date().toISOString().split('T')[0]
  }
}

function buildSmartMista(matches: MatchAnalysis[], usedMatches: Set<number>): any {
  console.log('🎯 MISTA: 6-7 partite per moltiplicatore 10x+')
  
  const selections: TipSelection[] = []
  let totalOdds = 1
  
  // Prendi partite con selezioni sicure (quote basse)
  for (const match of matches) {
    if (selections.length >= 7) break
    if (totalOdds > 25) break
    
    const sels = getSafeSelectionsForMatch(match)
    for (const sel of sels) {
      if (sel.odds >= 1.20 && sel.odds <= 1.50) {
        selections.push({
          fixture_id: match.fixture_id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          time: match.time,
          prediction: sel.type,
          prediction_label: sel.label,
          odds: sel.odds,
          confidence: match.confidence,
          reasoning: match.reasoning
        })
        totalOdds *= sel.odds
        break
      }
    }
  }
  
  return {
    matches: selections,
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence: 30,
    strategy_reasoning: `${selections.length} selezioni conservative per quota ${Math.round(totalOdds)}x`,
    valid_until: new Date().toISOString().split('T')[0]
  }
}

function buildSmartBomba(matches: MatchAnalysis[], usedMatches: Set<number>): any {
  console.log('🎯 BOMBA: 3 risultati esatti')
  
  const sorted = [...matches].sort((a, b) => b.confidence - a.confidence)
  const selections = sorted.slice(0, 3).map(match => ({
    fixture_id: match.fixture_id,
    home_team: match.home_team,
    away_team: match.away_team,
    league: match.league,
    time: match.time,
    prediction: match.suggestions.risultato_esatto,
    prediction_label: `ESATTO ${match.suggestions.risultato_esatto}`,
    odds: getExactScoreOdds(match.suggestions.risultato_esatto),
    confidence: 10,
    reasoning: generateExactScoreReasoning(match)
  }))
  
  const totalOdds = selections.reduce((prod, s) => prod * s.odds, 1)
  
  return {
    matches: selections,
    tip_type: 'risultati_esatti',
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence: 3,
    strategy_reasoning: "Tenta la fortuna con 3 risultati esatti - max 1% stake!",
    valid_until: new Date().toISOString().split('T')[0]
  }
}

function getSelectionsForMatch(match: MatchAnalysis): Array<{type: string, label: string, odds: number}> {
  const selections = []
  
  // Esito
  if (match.suggestions.esito === '1') {
    selections.push({
      type: '1',
      label: `${match.home_team} VINCE`,
      odds: match.odds.home
    })
    selections.push({
      type: '1X',
      label: `${match.home_team} NON PERDE`,
      odds: match.odds.home * 0.65
    })
  } else if (match.suggestions.esito === '2') {
    selections.push({
      type: '2',
      label: `${match.away_team} VINCE`,
      odds: match.odds.away
    })
    selections.push({
      type: 'X2',
      label: `${match.away_team} NON PERDE`,
      odds: match.odds.away * 0.65
    })
  } else {
    selections.push({
      type: 'X',
      label: 'PAREGGIO',
      odds: match.odds.draw
    })
  }
  
  // Over/Under
  selections.push({
    type: match.suggestions.over_under,
    label: match.suggestions.over_under === 'Over 2.5' ? 'ALMENO 3 GOL' : 
           match.suggestions.over_under === 'Under 2.5' ? 'MASSIMO 2 GOL' :
           match.suggestions.over_under === 'Over 1.5' ? 'ALMENO 2 GOL' : 'MASSIMO 1 GOL',
    odds: match.suggestions.over_under === 'Over 2.5' ? match.odds.over_25 :
          match.suggestions.over_under === 'Under 2.5' ? match.odds.under_25 :
          match.suggestions.over_under === 'Over 1.5' ? match.odds.over_15 : match.odds.under_15
  })
  
  // Gol/NoGol
  selections.push({
    type: match.suggestions.gol,
    label: match.suggestions.gol === 'Gol' ? 'ENTRAMBE SEGNANO' : 'ALMENO UNA NON SEGNA',
    odds: match.suggestions.gol === 'Gol' ? match.odds.gol : match.odds.nogol
  })
  
  // Combo
  if (match.suggestions.combo && match.suggestions.combo.length > 0) {
    const combo = match.suggestions.combo[0]
    const comboOdds = calculateComboOdds(combo, match)
    selections.push({
      type: combo,
      label: getComboLabel(combo, match),
      odds: comboOdds
    })
  }
  
  // Filtra quote valide e ordina per odds crescente
  return selections
    .filter(s => s.odds > 1.01 && s.odds < 50)
    .sort((a, b) => a.odds - b.odds)
}

function getSafeSelectionsForMatch(match: MatchAnalysis): Array<{type: string, label: string, odds: number}> {
  const selections = []
  
  // Doppia chance sempre sicura
  if (match.suggestions.esito === '1') {
    selections.push({
      type: '1X',
      label: `${match.home_team} NON PERDE`,
      odds: match.odds.home * 0.65
    })
  } else if (match.suggestions.esito === '2') {
    selections.push({
      type: 'X2', 
      label: `${match.away_team} NON PERDE`,
      odds: match.odds.away * 0.65
    })
  }
  
  // Under alti sempre sicuri
  selections.push({
    type: 'Under 4.5',
    label: 'MASSIMO 4 GOL',
    odds: 1.15
  })
  selections.push({
    type: 'Under 3.5',
    label: 'MASSIMO 3 GOL',
    odds: 1.25
  })
  
  return selections.filter(s => s.odds > 1.01 && s.odds < 1.60)
}

function calculateComboOdds(combo: string, match: MatchAnalysis): number {
  // Calcola quote combo basate su singoli componenti
  if (combo.includes('+')) {
    const parts = combo.split('+').map(p => p.trim())
    let odds = 1
    
    for (const part of parts) {
      if (part === '1') odds *= match.odds.home
      else if (part === 'X') odds *= match.odds.draw
      else if (part === '2') odds *= match.odds.away
      else if (part === '1X') odds *= match.odds.home * 0.65
      else if (part === 'X2') odds *= match.odds.away * 0.65
      else if (part.includes('Over')) odds *= match.odds.over_25 || 1.80
      else if (part.includes('Under')) odds *= match.odds.under_25 || 1.90
      else if (part === 'Gol') odds *= match.odds.gol || 1.75
      else if (part === 'NoGol') odds *= match.odds.nogol || 1.95
    }
    
    return Math.round(odds * 100) / 100
  }
  
  return 2.00 // Default
}

function getComboLabel(combo: string, match: MatchAnalysis): string {
  const labels: Record<string, string> = {
    '1': match.home_team + ' VINCE',
    '2': match.away_team + ' VINCE',
    'X': 'PAREGGIO',
    '1X': match.home_team + ' NON PERDE',
    'X2': match.away_team + ' NON PERDE',
    'Over 2.5': 'ALMENO 3 GOL',
    'Under 2.5': 'MASSIMO 2 GOL',
    'Over 1.5': 'ALMENO 2 GOL',
    'Under 1.5': 'MASSIMO 1 GOL',
    'Over 3.5': 'ALMENO 4 GOL',
    'Under 3.5': 'MASSIMO 3 GOL',
    'Gol': 'ENTRAMBE SEGNANO',
    'NoGol': 'ALMENO UNA NON SEGNA'
  }
  
  if (combo.includes('+')) {
    const parts = combo.split('+').map(p => p.trim())
    return parts.map(p => labels[p] || p).join(' + ')
  }
  
  return labels[combo] || combo
}

function getExactScoreOdds(score: string): number {
  const odds: Record<string, number> = {
    '1-0': 6.50, '0-1': 7.50, '2-0': 8.00, '0-2': 9.00,
    '2-1': 8.50, '1-2': 9.50, '1-1': 6.00, '0-0': 9.00,
    '3-0': 13.00, '0-3': 15.00, '3-1': 15.00, '1-3': 17.00,
    '2-2': 12.00, '3-2': 21.00, '2-3': 23.00, '4-0': 25.00,
    '0-4': 30.00, '4-1': 28.00, '1-4': 35.00, '3-3': 40.00
  }
  return odds[score] || 10.00
}

function generateExactScoreReasoning(match: MatchAnalysis): string {
  const [home, away] = match.suggestions.risultato_esatto.split('-').map(Number)
  
  if (home > away) {
    if (home - away > 1) {
      return `${match.home_team} dominante, vittoria netta probabile`
    }
    return `${match.home_team} favorito ma ${match.away_team} segnerà`
  } else if (away > home) {
    if (away - home > 1) {
      return `${match.away_team} in trasferta devastante`
    }
    return `Colpaccio esterno di misura per ${match.away_team}`
  } else {
    if (home === 0) {
      return `Partita bloccata, difese impenetrabili`
    }
    return `Spettacolo garantito, entrambe a segno`
  }
}

async function saveTipsV4(tips: any, date: string, supabase: any) {
  console.log('💾 Salvando tips V4...')
  
  const errors: string[] = []
  
  // Salva ogni tipo di tip
  if (tips.singola) {
    const { error } = await supabase.from('tips_singola').upsert(tips.singola, { onConflict: 'valid_until' })
    if (error) errors.push(`Singola: ${error.message}`)
    else console.log('✅ Singola salvata')
  }
  
  if (tips.doppia) {
    const { error } = await supabase.from('tips_doppia').upsert(tips.doppia, { onConflict: 'valid_until' })
    if (error) errors.push(`Doppia: ${error.message}`)
    else console.log('✅ Doppia salvata')
  }
  
  if (tips.tripla) {
    const { error } = await supabase.from('tips_tripla').upsert(tips.tripla, { onConflict: 'valid_until' })
    if (error) errors.push(`Tripla: ${error.message}`)
    else console.log('✅ Tripla salvata')
  }
  
  if (tips.mista) {
    const { error } = await supabase.from('tips_mista').upsert(tips.mista, { onConflict: 'valid_until' })
    if (error) errors.push(`Mista: ${error.message}`)
    else console.log('✅ Mista salvata')
  }
  
  if (tips.bomba) {
    const { error } = await supabase.from('tips_bomba').upsert(tips.bomba, { onConflict: 'valid_until' })
    if (error) errors.push(`Bomba: ${error.message}`)
    else console.log('✅ Bomba salvata')
  }
  
  if (errors.length > 0) {
    console.error('❌ Errori durante il salvataggio:', errors)
  } else {
    console.log('✅ Tutti i tips salvati con successo')
  }
}