import OpenAI from 'openai'

const openai = (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-test-key-for-testing') ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null

interface MatchData {
  homeTeam: any
  awayTeam: any
  league: string
  date: string
  time: string
  venue: string
  predictions: any  // Da Supabase (CalcioAI predictions)
  odds: any         // Da Supabase (CalcioAI odds)
  h2h: any          // Head to head statistics (calculated with new function)
  injuries: any[]   // Infortuni
  teamStats?: {     // Team statistics
    home: any
    away: any
  }
  // NEW: Complete data for intelligent analysis
  homeTeamData?: {
    form: any       // Last 5 matches with results
    standing: any   // League position, points, etc
    stats: any      // Detailed season stats
  }
  awayTeamData?: {
    form: any       // Last 5 matches with results  
    standing: any   // League position, points, etc
    stats: any      // Detailed season stats
  }
  seasonInfo?: {
    season: number
    leagueId: number
  }
}

export interface AIAnalysisResult {
  previsione_ai: {
    esito_principale: "1" | "X" | "2"
    percentuali: { home: number; draw: number; away: number }
    motivazione: string
  }
  mercati: {
    risultato_finale: MarketAnalysis
    over_under: MarketAnalysis
    gol_nogol: MarketAnalysis
    doppia_chance: MarketAnalysis
    multigol: MarketAnalysis
  }
  mercati_combo?: Array<{
    tipo: string
    nome: string
    confidence: "ALTA" | "MEDIA" | "BASSA" | "ALTISSIMA"
    reasoning: string
  }>
  h2h: {
    totale_partite: number
    vittorie_casa: number
    pareggi: number
    vittorie_ospite: number
    media_gol: number
    ultimi_5: Array<{
      data: string
      risultato: string
      casa: string
      ospite: string
    }>
    trend: string
  }
  forma_squadre: {
    casa: {
      nome: string
      ultime_5: string[]
      ultime_5_dettaglio: Array<{
        avversario: string
        risultato: string
        casa_trasferta: 'C' | 'T'
        outcome: 'W' | 'D' | 'L'
      }>
      forma_stringa: string
      rendimento: string
    }
    ospite: {
      nome: string
      ultime_5: string[]
      ultime_5_dettaglio: Array<{
        avversario: string
        risultato: string
        casa_trasferta: 'C' | 'T'
        outcome: 'W' | 'D' | 'L'
      }>
      forma_stringa: string
      rendimento: string
    }
  }
  classifica: {
    casa: {
      posizione: number
      punti: number
      partite: number
      vittorie: number
      pareggi: number
      sconfitte: number
      gol_fatti: number
      gol_subiti: number
      differenza_reti: number
    } | null
    ospite: {
      posizione: number
      punti: number
      partite: number
      vittorie: number
      pareggi: number
      sconfitte: number
      gol_fatti: number
      gol_subiti: number
      differenza_reti: number
    } | null
  }
  risultati_esatti: Array<{
    risultato: string
    probabilita: number
    top: number
    reasoning: string
  }>
  value_bets: Array<{
    mercato: string
    quota: number
    probabilita_reale: number
    probabilita_quota: number
    edge: string
    spiegazione: string
  }>
  piano_scommessa: {
    tipo: "DOPPIA CHANCE" | "SINGOLA" | "COMBO" | "SKIP"
    selezione: string
    quota_reale?: number
    probabilita?: number
    stake_consigliato?: string
    reasoning: string
    rischio?: "BASSO" | "MEDIO" | "ALTO"
    alternativa?: string
    suggerimento?: string
  }
  scommessa_principale: {
    tipo: "DOPPIA CHANCE" | "SINGOLA" | "COMBO"
    selezione: string
    quota_target: string
    probabilita: number
    istruzioni: {
      gioca: string
      quota_minima: number
      timing: string
      bookmaker: string
      sicurezza: string
    }
  }
  strategie: {
    conservativa: Strategy
    aggressiva: Strategy
    live: LiveStrategy
  }
  report_narrativo: string
}

interface MarketAnalysis {
  consigliato: string
  confidence: "ALTA" | "MEDIA" | "BASSA"
  quota: number
  percentuale?: number
  value: boolean
  reasoning: string
}

interface Strategy {
  nome: string
  selezione: string
  quota: number
  stake: string
  win_rate: string
}

interface LiveStrategy {
  consiglio: string
  motivo: string
}

// Analyze Over/Under based on real H2H data
function analyzeOverUnder(h2hMatches: any[], avgGoals: number): {decision: string, reasoning: string} {
  if (!h2hMatches || h2hMatches.length === 0) {
    return {
      decision: avgGoals > 2.5 ? 'Over 2.5' : 'Under 2.5',
      reasoning: `Media storica di ${avgGoals} gol`
    }
  }
  
  // Count how many matches were over/under 2.5
  let overCount = 0
  let underCount = 0
  const results: string[] = []
  
  h2hMatches.forEach(match => {
    const totalGoals = (match.homeGoals || 0) + (match.awayGoals || 0)
    results.push(`${match.homeGoals}-${match.awayGoals}`)
    if (totalGoals > 2.5) overCount++
    else underCount++
  })
  
  // Decision based on majority
  if (overCount > underCount) {
    return {
      decision: 'Over 2.5',
      reasoning: `${overCount}/${h2hMatches.length} degli ultimi H2H sono Over 2.5 (${results.join(', ')})`
    }
  } else {
    return {
      decision: 'Under 2.5', 
      reasoning: `${underCount}/${h2hMatches.length} degli ultimi H2H sono Under 2.5 (${results.join(', ')})`
    }
  }
}

// Analyze BTTS based on real H2H data
function analyzeBTTS(h2hMatches: any[]): {decision: string, reasoning: string, cleanSheets: number} {
  if (!h2hMatches || h2hMatches.length === 0) {
    return {
      decision: 'NoGol',
      reasoning: 'Dati H2H non disponibili',
      cleanSheets: 0
    }
  }
  
  let bttsCount = 0
  let cleanSheets = 0
  
  h2hMatches.forEach(match => {
    if (match.homeGoals > 0 && match.awayGoals > 0) {
      bttsCount++
    }
    if (match.homeGoals === 0 || match.awayGoals === 0) {
      cleanSheets++
    }
  })
  
  if (bttsCount > h2hMatches.length / 2) {
    return {
      decision: 'Gol',
      reasoning: `Entrambe hanno segnato in ${bttsCount}/${h2hMatches.length} degli ultimi H2H`,
      cleanSheets
    }
  } else {
    return {
      decision: 'NoGol',
      reasoning: `Solo ${bttsCount}/${h2hMatches.length} partite con entrambe a segno`,
      cleanSheets
    }
  }
}

export async function generateMatchAnalysis(matchData: MatchData): Promise<AIAnalysisResult> {
  console.log('🤖 generateMatchAnalysis called for:', `${matchData.homeTeam.name} vs ${matchData.awayTeam.name}`)
  
  if (!openai) {
    console.log('❌ OpenAI not configured, using intelligent fallback analysis')
    return generateIntelligentFallbackAnalysis(matchData)
  }
  
  console.log('✅ OpenAI configured, proceeding with GPT-4o-mini analysis')

  try {
    // ESTRAI PERCENTUALI REALI DA API-FOOTBALL
    const realPercentages = {
      home: matchData.predictions?.winner?.home || 33,
      draw: matchData.predictions?.winner?.draw || 33,
      away: matchData.predictions?.winner?.away || 34
    }
    
    console.log('📊 PERCENTUALI REALI da API-Football:', realPercentages)
    
    // Calcola la direzione dell'analisi
    const maxProb = Math.max(realPercentages.home, realPercentages.draw, realPercentages.away)
    const direction = realPercentages.home === maxProb ? 'CASA' : 
                     realPercentages.away === maxProb ? 'OSPITE' : 'EQUILIBRIO'
    
    console.log(`🎯 DIREZIONE ANALISI: ${direction} (${maxProb}%)`)
    
    // PRE-DETERMINA LE DIREZIONI OVER/UNDER E GOL/NOGOL
    const h2hAvgGoals = matchData.h2h?.avgGoals || 2.5
    const h2hMatches = matchData.h2h?.matches || []
    const cleanSheets = h2hMatches.filter((m: any) => m.homeGoals === 0 || m.awayGoals === 0).length
    const totalMatches = matchData.h2h?.total || 1
    
    const DIREZIONE_OVER_UNDER = h2hAvgGoals > 2.5 ? 'OVER 2.5' : 'UNDER 2.5'
    const DIREZIONE_GOL_NOGOL = cleanSheets > totalMatches / 2 ? 'NOGOL' : 'GOL'
    
    console.log(`📌 DIREZIONI PRE-DETERMINATE:`)
    console.log(`   - Over/Under: ${DIREZIONE_OVER_UNDER} (media H2H: ${h2hAvgGoals})`)
    console.log(`   - Gol/NoGol: ${DIREZIONE_GOL_NOGOL} (clean sheets: ${cleanSheets}/${totalMatches})`)

    const prompt = `## 🚨🚨🚨 COERENZA TOTALE OBBLIGATORIA 🚨🚨🚨

🔴🔴🔴 LE DIREZIONI SONO GIÀ DECISE E NON PUOI CAMBIARLE! 🔴🔴🔴

📌 DEVI USARE QUESTE DIREZIONI IN OGNI SEZIONE:
- OVER/UNDER: ${DIREZIONE_OVER_UNDER}
- GOL/NOGOL: ${DIREZIONE_GOL_NOGOL}

⚠️ TUTTE LE SEZIONI DEVONO SEGUIRE QUESTE DIREZIONI:
- Se scegli UNDER 2.5 → TUTTI i risultati devono avere MAX 2 gol totali
- Se scegli NOGOL → TUTTI i risultati devono avere una squadra a 0
- Se scegli OVER 2.5 → TUTTI i risultati devono avere MINIMO 3 gol totali
- Se scegli GOL → TUTTI i risultati devono avere entrambe che segnano

❌ ESEMPIO SBAGLIATO:
- Mercati: Under 2.5, NoGol
- Risultati: 2-1, 3-1 (SBAGLIATO! Sono Over e Gol!)
- Combo: "1 + Over 2.5" (SBAGLIATO! Contraddice Under!)

✅ ESEMPIO CORRETTO:
- Mercati: Under 2.5, NoGol
- Risultati: 1-0, 0-1, 2-0 (GIUSTO! Max 2 gol, una a 0)
- Combo: "1 + Under 2.5" (GIUSTO! Coerente con Under)

## 🚨 REGOLA FONDAMENTALE: NON INVENTARE INFORMAZIONI!

USA SOLO i dati che ti ho fornito. NON aggiungere informazioni dalla tua conoscenza generale.

❌ VIETATO ASSOLUTO:
- Nomi di allenatori (NON li hai nei dati, non menzionarli MAI!)
- Nomi di giocatori specifici (a meno che non siano nei dati infortuni)
- Informazioni su trasferimenti, mercato, news recenti
- Qualsiasi cosa che non sia nei dati che ti ho passato
- Frasi come "la squadra di [Nome Allenatore]" o "con [Nome Giocatore]"

✅ PUOI MENZIONARE SOLO:
- Nomi delle squadre (sono nei dati): ${matchData.homeTeam.name} e ${matchData.awayTeam.name}
- Risultati H2H (sono nei dati)
- Classifica e punti (sono nei dati)
- Forma ultime 5 (sono nei dati)
- Statistiche gol (sono nei dati)
- Dati di venue/campionato forniti

ESEMPIO:
❌ "La squadra di Allegri è in difficoltà"
❌ "Con Vlahovic in attacco..."
✅ "${matchData.homeTeam.name} è in difficoltà" 
✅ "L'attacco del ${matchData.homeTeam.name}..."

Se non hai un dato, NON inventarlo. Limiti alle informazioni fornite.

---

## ⚠️ PERCENTUALI OBBLIGATORIE (NON MODIFICARE!)

Le percentuali sono GIÀ CALCOLATE dai nostri algoritmi API-Football:
- 1 (Casa - ${matchData.homeTeam.name}): ${realPercentages.home}%
- X (Pareggio): ${realPercentages.draw}%  
- 2 (Trasferta - ${matchData.awayTeam.name}): ${realPercentages.away}%

🚨 DEVI USARE ESATTAMENTE QUESTE PERCENTUALI nella sezione "previsione_ai"!
NON inventare altre percentuali! NON cambiare questi numeri!

## 🎯 DIREZIONE ANALISI OBBLIGATORIA: ${direction}

${direction === 'CASA' ? `
✅ CASA FAVORITA (${realPercentages.home}%)
→ Piano Scommessa: 1 o 1X
→ Report: parla BENE di ${matchData.homeTeam.name}, evidenzia problemi di ${matchData.awayTeam.name}
→ Risultati esatti: favorisci 1-0, 2-0, 2-1
→ Value bet: può essere 1, 1X, o mercato gol COERENTE
→ Over/Under: basati sui dati REALI` : direction === 'OSPITE' ? `
✅ OSPITE FAVORITA (${realPercentages.away}%)
→ Piano Scommessa: 2 o X2  
→ Report: parla BENE di ${matchData.awayTeam.name}, evidenzia problemi di ${matchData.homeTeam.name}
→ Risultati esatti: favorisci 0-1, 0-2, 1-2
→ Value bet: può essere 2, X2, o mercato gol COERENTE
→ Over/Under: basati sui dati REALI` : `
✅ PARTITA EQUILIBRATA (differenza < 10%)
→ Piano Scommessa: X, 1X o X2
→ Report: evidenzia l'equilibrio, nessuna squadra nettamente superiore
→ Risultati esatti: favorisci 1-1, 2-2, 0-0
→ Value bet: doppia chance o mercato gol
→ Over/Under: basati sui dati REALI`}

## 🎯 LE DIREZIONI SONO GIÀ STABILITE

DATI UTILIZZATI PER LA DECISIONE:
- Media H2H gol: ${h2hAvgGoals} → quindi USI ${DIREZIONE_OVER_UNDER}
- Clean sheets H2H: ${cleanSheets}/${totalMatches} → quindi USI ${DIREZIONE_GOL_NOGOL}

📌 LE TUE DIREZIONI OBBLIGATORIE SONO:
- OVER/UNDER: ${DIREZIONE_OVER_UNDER} ✅
- GOL/NOGOL: ${DIREZIONE_GOL_NOGOL} ✅

ORA APPLICA QUESTE SCELTE IN OGNI SEZIONE:

1. MERCATI → Consiglia quello che hai scelto sopra
2. RISULTATI ESATTI → SOLO risultati coerenti con ${DIREZIONE_OVER_UNDER} + ${DIREZIONE_GOL_NOGOL}:
${DIREZIONE_OVER_UNDER === 'UNDER 2.5' && DIREZIONE_GOL_NOGOL === 'NOGOL' ? 
'   ✅ USA SOLO: 1-0, 0-1, 2-0, 0-2, 0-0' :
DIREZIONE_OVER_UNDER === 'UNDER 2.5' && DIREZIONE_GOL_NOGOL === 'GOL' ?
'   ✅ USA SOLO: 1-1 (unico risultato possibile con Under+Gol!)' :
DIREZIONE_OVER_UNDER === 'OVER 2.5' && DIREZIONE_GOL_NOGOL === 'GOL' ?
'   ✅ USA SOLO: 2-1, 1-2, 2-2, 3-1, 1-3, 3-2, 2-3' :
'   ✅ USA SOLO: 3-0, 0-3, 4-0, 0-4, 4-1, 1-4'}
3. COMBO → SEMPRE con la direzione scelta (mai "1 + Over" se hai scelto Under!)
4. VALUE BETS → SOLO mercati coerenti con la scelta
5. PIANO SCOMMESSA → DEVE contenere la direzione scelta
6. STRATEGIE → TUTTE devono seguire la direzione
7. REPORT → MAI contraddire la direzione scelta

## ❌ REGOLA ANTI-CONTRADDIZIONE

DOPO aver deciso la direzione, TUTTE le sezioni devono seguirla:
- Se consigli UNDER nei mercati → NON dire Over nel report
- Se consigli 2 nel piano → NON dire "vittoria casa" nei value bet
- Se previsione favorisce away → NON parlare bene della casa nel report

❌ FRASI VIETATE (le usi sempre, BASTA!):
- "Per i più coraggiosi, Over 2.5 goal potrebbe essere una bella giocata"
- "Il multigol 1-3 è sempre una buona alternativa"
- "questa partita la vedo abbastanza chiara"
- "parliamoci chiaro"
- Qualsiasi frase generica che hai già scritto

## DATI PARTITA
- Casa: ${matchData.homeTeam.name}
- Ospite: ${matchData.awayTeam.name}
- Campionato: ${matchData.league}
- Data: ${matchData.date} ore ${matchData.time}
- Stadio: ${matchData.venue}

## PREDICTIONS CALCIOAI (PERCENTUALI REALI)
${JSON.stringify(matchData.predictions, null, 2)}

## ODDS BOOKMAKER (REALI)
${JSON.stringify(matchData.odds, null, 2)}

## 💰 PIANO DI SCOMMESSA REALISTICO - REGOLE OBBLIGATORIE

QUOTE REALI DISPONIBILI (DEVI USARE QUESTE!):
- 1 (Casa): ${matchData.odds?.winner?.home || matchData.odds?.home || 'N/D'}
- X (Pareggio): ${matchData.odds?.winner?.draw || matchData.odds?.draw || 'N/D'}
- 2 (Trasferta): ${matchData.odds?.winner?.away || matchData.odds?.away || 'N/D'}
- Over 2.5: ${matchData.odds?.goals?.over_2_5 || matchData.odds?.over_2_5 || 'N/D'}
- Under 2.5: ${matchData.odds?.goals?.under_2_5 || matchData.odds?.under_2_5 || 'N/D'}
- Gol: ${matchData.odds?.goals?.btts_yes || matchData.odds?.btts_yes || 'N/D'}
- NoGol: ${matchData.odds?.goals?.btts_no || matchData.odds?.btts_no || 'N/D'}
- 1X: ${matchData.odds?.doubleChance?.x1 || 'N/D'}
- X2: ${matchData.odds?.doubleChance?.x2 || 'N/D'}
- 12: ${matchData.odds?.doubleChance?.x12 || 'N/D'}

### REGOLA FONDAMENTALE: QUOTA MINIMA 1.40

MAI consigliare scommesse con quota < 1.40! Se il mercato migliore ha quota bassa:
- Calcola una COMBO (moltiplica le quote: Quota1 * Quota2)
- Proponi un mercato alternativo con quota più alta
- Oppure usa tipo: "SKIP" e suggerisci di andare su /tipsterai

ESEMPI CONCRETI per ${matchData.homeTeam.name} vs ${matchData.awayTeam.name}:

Se la quota del favorito è 1.08:
❌ SBAGLIATO: "Piano: 2 secco @1.08"
✅ CORRETTO: "Piano: 2 + Under 2.5 @${(1.08 * (matchData.odds?.goals?.under_2_5 || 1.85)).toFixed(2)}"

CALCOLA SEMPRE LE QUOTE COMBO:
- Es: 1.08 * 1.85 = 2.00
- Es: 1.25 * 1.40 = 1.75
- Es: 1.15 * 1.30 = 1.50

## HEAD TO HEAD COMPLETO
${JSON.stringify(matchData.h2h, null, 2)}

## FORMA SQUADRE - ULTIME 5 PARTITE
Home Team Form: ${JSON.stringify(matchData.homeTeamData?.form, null, 2)}
Away Team Form: ${JSON.stringify(matchData.awayTeamData?.form, null, 2)}

## CLASSIFICA ATTUALE
Home Standing: ${JSON.stringify(matchData.homeTeamData?.standing, null, 2)}
Away Standing: ${JSON.stringify(matchData.awayTeamData?.standing, null, 2)}

## STATISTICHE SQUADRE STAGIONE COMPLETA
Home Team Stats: ${JSON.stringify(matchData.teamStats?.home, null, 2)}
Away Team Stats: ${JSON.stringify(matchData.teamStats?.away, null, 2)}

## INFORTUNI/ASSENZE
${JSON.stringify(matchData.injuries, null, 2)}

---

🚨 IMPORTANTE: Genera un JSON PERFETTO, ben formato, senza errori di sintassi!

- Usa sempre virgolette doppie " per le chiavi
- Chiudi TUTTE le stringhe e oggetti  
- NO virgole finali dopo l'ultimo elemento
- Evita caratteri speciali nelle stringhe (usa \\n per newline)
- Mantieni le stringhe sotto i 300 caratteri per campo

## ESEMPIO DI ANALISI COERENTE (se scegli UNDER + NOGOL):

{
  "mercati": {
    "over_under": { "consigliato": "Under 2.5", ... },
    "gol_nogol": { "consigliato": "NoGol", ... }
  },
  "risultati_esatti": [
    { "risultato": "1-0", ... },
    { "risultato": "0-1", ... },
    { "risultato": "2-0", ... }
  ],
  "mercati_combo": [
    { "tipo": "1 + Under 2.5", ... },
    { "tipo": "X2 + Under 2.5", ... }
  ],
  "value_bets": [
    { "mercato": "Under 2.5", ... }
  ],
  "piano_scommessa": {
    "selezione": "1 + Under 2.5", ...
  }
}

Genera un'analisi JSON con questa struttura ESATTA:

{
  "previsione_ai": {
    "esito_principale": "${realPercentages.home >= realPercentages.draw && realPercentages.home >= realPercentages.away ? '1' : realPercentages.away >= realPercentages.draw && realPercentages.away >= realPercentages.home ? '2' : 'X'}",
    "percentuali": { "home": ${realPercentages.home}, "draw": ${realPercentages.draw}, "away": ${realPercentages.away} },
    "motivazione": "Motivazione SPECIFICA per questa partita basata sui dati REALI"
  },
  
  "mercati": {
    "risultato_finale": {
      "consigliato": "X" | "1" | "2",
      "confidence": "ALTA" | "MEDIA" | "BASSA",
      "quota": 3.40,
      "value": true,
      "reasoning": "Perché questo esito..."
    },
    "over_under": {
      "consigliato": "Over 2.5" | "Under 2.5" | "Over 1.5" | "Under 3.5",
      "confidence": "ALTA" | "MEDIA" | "BASSA", 
      "quota": 1.85,
      "percentuale": 65,
      "value": true,
      "reasoning": "Media gol H2H è 3.2, entrambe segnano molto..."
    },
    "gol_nogol": {
      "consigliato": "Gol" | "NoGol",
      "confidence": "ALTA" | "MEDIA" | "BASSA",
      "quota": 1.70,
      "percentuale": 58,
      "value": false,
      "reasoning": "..."
    },
    "doppia_chance": {
      "consigliato": "1X" | "X2" | "12",
      "confidence": "ALTA" | "MEDIA" | "BASSA",
      "quota": 1.35,
      "percentuale": 75,
      "value": true,
      "reasoning": "..."
    },
    "multigol": {
      "consigliato": "1-3" | "2-4" | "2-3" | "3-5",
      "confidence": "ALTA" | "MEDIA" | "BASSA",
      "quota": 1.65,
      "percentuale": 55,
      "reasoning": "..."
    }
  },
  
  "risultati_esatti": [
    { "risultato": "1-1", "probabilita": 18, "top": 1 },
    { "risultato": "2-1", "probabilita": 15, "top": 2 },
    { "risultato": "1-0", "probabilita": 12, "top": 3 }
  ],
  
  "value_bets": [
    {
      "mercato": "Over 2.5",
      "quota": 2.10,
      "probabilita_reale": 60,
      "probabilita_quota": 47.6,
      "edge": "+12.4%",
      "spiegazione": "La quota implica 47.6% ma i dati H2H mostrano 60% di Over 2.5"
    }
  ],
  
  "piano_scommessa": {
    "tipo": "COMBO" | "SINGOLA" | "SKIP",
    "selezione": "BASATA SU QUOTE REALI",
    "quota_reale": 1.52,
    "probabilita": 65,
    "stake_consigliato": "10-15% del budget giornaliero",
    "reasoning": "SPIEGA perché questa scommessa e non un'altra",
    "rischio": "BASSO" | "MEDIO" | "ALTO",
    "alternativa": "Proponi alternativa se esiste"
  },
  
  "scommessa_principale": {
    "tipo": "DOPPIA CHANCE" | "SINGOLA" | "COMBO",
    "selezione": "X2",
    "quota_target": "1.45 - 1.55",
    "probabilita": 70,
    "istruzioni": {
      "gioca": "X2 con stake 15-20% del budget giornaliero",
      "quota_minima": 1.45,
      "timing": "Piazza 2-3 ore prima del calcio d'inizio",
      "bookmaker": "Cerca la quota migliore su 3+ bookmaker",
      "sicurezza": "Mercato a basso rischio"
    }
  },
  
  "strategie": {
    "conservativa": {
      "nome": "Multi Sicura",
      "selezione": "1X + Under 3.5",
      "quota": 1.55,
      "stake": "25% budget",
      "win_rate": "~70%"
    },
    "aggressiva": {
      "nome": "Singola Rischiosa", 
      "selezione": "2 secco",
      "quota": 4.20,
      "stake": "5% budget",
      "win_rate": "~25%"
    },
    "live": {
      "consiglio": "Se 0-0 al 60', gioca Over 0.5 @1.30",
      "motivo": "Statisticamente il 78% delle partite con 0-0 al 60' finisce con almeno 1 gol"
    }
  },
  
  "h2h": {
    "totale_partite": ${matchData.h2h?.total || 0},
    "vittorie_casa": ${matchData.h2h?.homeWins || 0},
    "pareggi": ${matchData.h2h?.draws || 0},
    "vittorie_ospite": ${matchData.h2h?.awayWins || 0},
    "media_gol": ${matchData.h2h?.avgGoals || 0},
    "ultimi_5": [
      // Ultimi 5 scontri con data, risultato, squadre - USA I DATI REALI
      { "data": "2024-03-15", "risultato": "2-1", "casa": "${matchData.homeTeam.name}", "ospite": "${matchData.awayTeam.name}" }
    ],
    "trend": "${matchData.h2h?.trend || 'Primo confronto tra le squadre'}"
  },
  
  "forma_squadre": {
    "casa": {
      "nome": "${matchData.homeTeam.name}",
      "ultime_5": ["V", "P", "S", "P", "S"],
      "ultime_5_dettaglio": [
        // USA I DATI REALI dalla form
        { "avversario": "Spezia", "risultato": "2-1", "casa_trasferta": "C", "outcome": "W" }
      ],
      "forma_stringa": "VPSPS",
      "rendimento": "Analisi della forma BASATA sui dati reali"
    },
    "ospite": {
      "nome": "${matchData.awayTeam.name}",
      "ultime_5": ["V", "V", "P", "V", "V"],
      "ultime_5_dettaglio": [
        // USA I DATI REALI dalla form  
      ],
      "forma_stringa": "VVPVV",
      "rendimento": "Analisi della forma BASATA sui dati reali"
    }
  },
  
  "classifica": {
    "casa": {
      "posizione": ${matchData.homeTeamData?.standing?.position || 0},
      "punti": ${matchData.homeTeamData?.standing?.points || 0},
      "partite": ${matchData.homeTeamData?.standing?.played || 0},
      "vittorie": ${matchData.homeTeamData?.standing?.won || 0},
      "pareggi": ${matchData.homeTeamData?.standing?.draw || 0},
      "sconfitte": ${matchData.homeTeamData?.standing?.lost || 0},
      "gol_fatti": ${matchData.homeTeamData?.standing?.goalsFor || 0},
      "gol_subiti": ${matchData.homeTeamData?.standing?.goalsAgainst || 0},
      "differenza_reti": ${matchData.homeTeamData?.standing?.goalDiff || 0}
    },
    "ospite": {
      "posizione": ${matchData.awayTeamData?.standing?.position || 0},
      "punti": ${matchData.awayTeamData?.standing?.points || 0},
      "partite": ${matchData.awayTeamData?.standing?.played || 0},
      "vittorie": ${matchData.awayTeamData?.standing?.won || 0},
      "pareggi": ${matchData.awayTeamData?.standing?.draw || 0},
      "sconfitte": ${matchData.awayTeamData?.standing?.lost || 0},
      "gol_fatti": ${matchData.awayTeamData?.standing?.goalsFor || 0},
      "gol_subiti": ${matchData.awayTeamData?.standing?.goalsAgainst || 0},
      "differenza_reti": ${matchData.awayTeamData?.standing?.goalDiff || 0}
    }
  },
  
  "risultati_esatti": [
    { "risultato": "1-1", "probabilita": 18, "top": 1, "reasoning": "Spiegazione basata su H2H REALI" },
    { "risultato": "2-1", "probabilita": 15, "top": 2, "reasoning": "Risultato visto negli ultimi H2H" },
    { "risultato": "1-0", "probabilita": 12, "top": 3, "reasoning": "Coerente con le statistiche goal" }
  ],
  
  "mercati_combo": [
    {
      "tipo": "${direction === 'CASA' ? '1 + Over 1.5' : direction === 'OSPITE' ? '2 + Under 2.5' : 'X + Under 2.5'}",
      "nome": "Combo COERENTE con la direzione ${direction}",
      "confidence": "ALTA",
      "reasoning": "Reasoning SPECIFICO basato sulla direzione dell'analisi"
    },
    {
      "tipo": "${direction === 'CASA' ? '1X + Under 3.5' : direction === 'OSPITE' ? 'X2 + Under 3.5' : 'X2 + Under 2.5'}",
      "nome": "Copertura Sicura",
      "confidence": "ALTISSIMA", 
      "reasoning": "Copertura massima COERENTE"
    },
    {
      "tipo": "Multigol 1-3",
      "nome": "Range Goal Probabile",
      "confidence": "MEDIA",
      "reasoning": "Basato sulla media goal H2H: ${matchData.h2h?.avgGoals || '2.5'}"
    }
  ],
  
  "report_narrativo": "## REPORT NARRATIVO - LUNGO E DETTAGLIATO

Scrivi un report di ALMENO 400-500 parole per ${matchData.homeTeam.name} vs ${matchData.awayTeam.name}. Deve essere completo e utile.

🚨 IMPORTANTE: USA SOLO i dati forniti! NON menzionare allenatori, giocatori specifici o info dalla tua conoscenza generale!

STRUTTURA OBBLIGATORIA (ogni sezione deve avere almeno 3-4 frasi):

**🎯 Il Verdetto**
Inizia con la tua opinione chiara sulla partita. Chi vince e perché (direzione: ${direction}). Dai subito il consiglio principale basato sui ${realPercentages.home}%-${realPercentages.draw}%-${realPercentages.away}%. (minimo 50 parole)

**📊 La Situazione delle Squadre**
Analizza la classifica: ${matchData.homeTeam.name} #${matchData.homeTeamData?.standing?.position || '?'} con ${matchData.homeTeamData?.standing?.points || '?'} punti vs ${matchData.awayTeam.name} #${matchData.awayTeamData?.standing?.position || '?'} con ${matchData.awayTeamData?.standing?.points || '?'} punti. Spiega cosa significa per questa partita. (minimo 80 parole)

**🔥 Il Momento di Forma**
Analizza le forme: ${matchData.homeTeam.name} ${matchData.homeTeamData?.form?.formString || '?'} vs ${matchData.awayTeam.name} ${matchData.awayTeamData?.form?.formString || '?'}. Chi è in crescita? Chi è in crisi? Spiega i risultati recenti nel dettaglio usando i dati form. (minimo 80 parole)

**⚔️ I Precedenti**
Racconta la storia degli scontri diretti: ${matchData.h2h?.total || 0} partite totali. ${matchData.h2h?.homeWins || 0} vittorie ${matchData.homeTeam.name}, ${matchData.h2h?.awayWins || 0} vittorie ${matchData.awayTeam.name}, ${matchData.h2h?.draws || 0} pareggi. Media gol: ${matchData.h2h?.avgGoals || 0}. Analizza il trend. (minimo 60 parole)

**⚽ I Gol: Over o Under?**
Analizza le statistiche gol. Media H2H ${matchData.h2h?.avgGoals || 0}, goal fatti/subiti dalle squadre. Spiega perché consigli Over o Under basandoti sui DATI REALI. Usa le statistiche gol delle squadre. (minimo 60 parole)

**💰 Le Mie Giocate**
Dai 2-3 consigli concreti:
- Giocata principale (la più sicura) - direzione ${direction}
- Giocata alternativa 
- Giocata per chi vuole rischiare
Basa tutto sui dati forniti. (minimo 80 parole)

**⚠️ Attenzione A...**
Spiega i rischi basandoti sui dati. Cosa nelle statistiche potrebbe essere ingannevole? Perché non è una scommessa sicura al 100%? (minimo 40 parole)

**✅ Conclusione**
Riassumi in 2-3 frasi il consiglio finale. Conferma la direzione ${direction}. (minimo 30 parole)

DATI DISPONIBILI:
- ${matchData.homeTeam.name}: pos #${matchData.homeTeamData?.standing?.position || '?'}, ${matchData.homeTeamData?.standing?.points || '?'} pt, forma ${matchData.homeTeamData?.form?.formString || '?'}
- ${matchData.awayTeam.name}: pos #${matchData.awayTeamData?.standing?.position || '?'}, ${matchData.awayTeamData?.standing?.points || '?'} pt, forma ${matchData.awayTeamData?.form?.formString || '?'}
- H2H: ${matchData.h2h?.total || 0} partite, media ${matchData.h2h?.avgGoals || 0} gol
- Percentuali: ${realPercentages.home}%-${realPercentages.draw}%-${realPercentages.away}%

TONO: Amichevole, da tipster esperto che parla a un amico. Usa 'ti consiglio', 'secondo me'. NO linguaggio tecnico/robotico."
}

## ✅ VALIDAZIONE FINALE OBBLIGATORIA

PRIMA di rispondere, VERIFICA:
1. ✅ Le percentuali sono ESATTAMENTE ${realPercentages.home}/${realPercentages.draw}/${realPercentages.away}
2. ✅ TUTTI i consigli seguono la direzione ${direction}
3. ✅ Report parla SPECIFICAMENTE di ${matchData.homeTeam.name} vs ${matchData.awayTeam.name}
4. ✅ Mercati combo sono COERENTI con la direzione
5. ✅ Nessuna contraddizione Over vs Under tra sezioni

IMPORTANTE:
- USA i dati REALI forniti, non inventare
- Le quote devono essere quelle VERE dall'oggetto odds  
- Cita statistiche SPECIFICHE (posizioni, punti, goal reali)
- Report deve essere UNICO per questa partita, no frasi standard

## REGOLE FONDAMENTALI

1. **RISULTATI ESATTI INTELLIGENTI**:
   - ANALIZZA i dati H2H reali: se gli ultimi 5 scontri sono stati 2-1, 1-0, 3-2, 2-2, 1-1 → proponi risultati SIMILI
   - GUARDA la media goal H2H: se è 1.2 → proponi 1-0, 0-1, 1-1. Se è 3.4 → proponi 2-1, 3-2, 2-2
   - USA le forme delle squadre: se ${matchData.homeTeam.name} ha perso 0-2, 1-3, 0-1 nelle ultime 3 → NON proporre 3-0 per loro
   - CONSIDERA le statistiche goal: se ${matchData.homeTeam.name} segna ${matchData.teamStats?.home?.goals?.for?.avgTotal || '?'}/partita in casa
   - ❌ MAI risultati inventati tipo sempre 2-0, 1-0, 3-1
   - ✅ SEMPRE risultati basati su DATI REALI forniti

2. **COERENZA ASSOLUTA**:
   - Se previsione_ai dice X2, TUTTI i consigli devono supportare X2
   - Se consigli X2, NON puoi suggerire "Vittoria Casa" nei value_bets
   - I risultati_esatti devono essere COERENTI con l'esito principale
   - MAI contraddizioni tra sezioni - tutto deve puntare nella stessa direzione

3. **VALUE BETS REALI**:
   - Identifica VERI value bet calcolando edge = (probabilità_reale - probabilità_implicita_quota)
   - Considera le quote REALI fornite
   - Gestisci valori NaN con fallback appropriati

4. **DATI COMPLETI**:
   - USA tutti i dati forniti: H2H, forma squadre, classifica, statistiche
   - Cita sempre numeri specifici e reali
   - Il report deve essere lungo (400-500 parole) e dettagliato`

    console.log('📡 Making GPT-4o-mini API call...')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,  // Aumentato per evitare troncamenti
      temperature: 0.3,  // Ridotto per più consistenza
      response_format: { type: 'json_object' }
    })
    
    console.log('✅ GPT-4o-mini response received')
    
    const rawContent = response.choices[0]?.message?.content || '{}'
    console.log('📝 Raw response length:', rawContent.length, 'characters')
    
    let analysis
    try {
      analysis = JSON.parse(rawContent)
      console.log('✅ JSON parsed successfully')
    } catch (jsonError) {
      console.error('❌ JSON parse failed:', jsonError)
      console.log('🔍 Raw content preview:', rawContent.substring(0, 500) + '...')
      
      // Try to fix common JSON issues
      let fixedContent = rawContent
        .replace(/\n/g, ' ')  // Remove newlines
        .replace(/\t/g, ' ')  // Remove tabs  
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"/g, '\\"')   // Escape quotes in strings
        .replace(/\\"/g, '"')   // But keep JSON quotes
      
      try {
        analysis = JSON.parse(fixedContent)
        console.log('✅ JSON fixed and parsed successfully')
      } catch (secondError) {
        console.error('❌ JSON still invalid after fixing, using fallback')
        throw new Error('Invalid JSON from GPT-4o-mini: ' + jsonError.message)
      }
    }
    
    // === CORREZIONE AUTOMATICA PER COERENZA LOGICA ===
    if (analysis.mercati?.risultato_finale?.consigliato && 
        analysis.mercati?.over_under?.consigliato && 
        analysis.mercati?.gol_nogol?.consigliato) {
      
      const esito = analysis.mercati.risultato_finale.consigliato
      const overUnder = analysis.mercati.over_under.consigliato
      const golNogol = analysis.mercati.gol_nogol.consigliato
      
      // Correzione automatica per coerenza logica
      if (esito !== 'X' && overUnder === 'Under 2.5') {
        // Se una squadra vince con Under, quasi sempre è NoGol (1-0, 2-0, 0-1, 0-2)
        if (golNogol === 'Gol') {
          console.log('⚠️ Correzione: Under + Vittoria → NoGol')
          analysis.mercati.gol_nogol.consigliato = 'NoGol'
          analysis.mercati.gol_nogol.reasoning = 'Con Under 2.5 e vittoria netta, difficile che entrambe segnino'
        }
      }

      // Se Over 2.5, più probabile Gol
      if (overUnder === 'Over 2.5' && golNogol === 'NoGol') {
        // Over + NoGol è raro (tipo 3-0, 4-0), accettabile ma verifica
        console.log('ℹ️ Over + NoGol: scenario possibile ma raro')
      }
    }
    
    console.log('🔍 Validating and enriching analysis...')
    // Validate and ensure all required fields are present
    const enrichedAnalysis = validateAndEnrichAnalysis(analysis, matchData)
    
    // NUOVA VALIDAZIONE COERENZA TOTALE
    console.log('🔍 Validating total coherence...')
    const { analysis: coherentAnalysis, fixes } = validateAndFixCoherence(enrichedAnalysis)
    
    if (fixes.length > 0) {
      console.log(`✅ Applied ${fixes.length} coherence fixes`)
    }
    
    // Valida anche con la vecchia funzione per sicurezza
    const finalAnalysis = validateAnalysisCoherence(coherentAnalysis, matchData)
    
    // VALIDAZIONE FINALE delle percentuali reali
    finalAnalysis.previsione_ai.percentuali = {
      home: realPercentages.home,
      draw: realPercentages.draw, 
      away: realPercentages.away
    }
    
    console.log('✅ GPT-4o-mini analysis completed successfully')
    console.log('📊 Final percentages:', finalAnalysis.previsione_ai.percentuali)
    
    return finalAnalysis
    
  } catch (error) {
    console.error('❌ Error generating GPT-4o-mini analysis:', error)
    console.log('⚠️ Falling back to intelligent fallback analysis')
    return generateIntelligentFallbackAnalysis(matchData)
  }
}

function validateAndEnrichAnalysis(analysis: any, matchData: MatchData): AIAnalysisResult {
  // Ensure all required fields exist with fallbacks
  return {
    previsione_ai: {
      esito_principale: analysis.previsione_ai?.esito_principale || "X",
      percentuali: analysis.previsione_ai?.percentuali || { home: 33, draw: 34, away: 33 },
      motivazione: analysis.previsione_ai?.motivazione || "Analisi basata sui dati disponibili"
    },
    mercati: {
      risultato_finale: analysis.mercati?.risultato_finale || {
        consigliato: "X",
        confidence: "MEDIA",
        quota: 3.20,
        value: false,
        reasoning: "Partita equilibrata"
      },
      over_under: analysis.mercati?.over_under || {
        consigliato: "Over 2.5",
        confidence: "MEDIA",
        quota: 1.85,
        percentuale: 55,
        value: false,
        reasoning: "Media storica supporta questo mercato"
      },
      gol_nogol: analysis.mercati?.gol_nogol || {
        consigliato: "Gol",
        confidence: "MEDIA",
        quota: 1.70,
        percentuale: 58,
        value: false,
        reasoning: "Entrambe le squadre tendono a segnare"
      },
      doppia_chance: analysis.mercati?.doppia_chance || {
        consigliato: "X2",
        confidence: "ALTA",
        quota: 1.45,
        percentuale: 67,
        value: true,
        reasoning: "Mercato sicuro per questa partita"
      },
      multigol: analysis.mercati?.multigol || {
        consigliato: "1-3",
        confidence: "MEDIA",
        quota: 1.75,
        percentuale: 52,
        reasoning: "Range di goal più probabile"
      }
    },
    // NEW: Complete H2H, form and standings data
    mercati_combo: analysis.mercati_combo || generateFallbackComboMarkets(matchData),
    h2h: analysis.h2h || generateFallbackH2H(matchData),
    forma_squadre: analysis.forma_squadre || generateFallbackTeamForm(matchData),
    classifica: analysis.classifica || generateFallbackStandings(matchData),
    risultati_esatti: (analysis.risultati_esatti || generateIntelligentExactScores(matchData)).map((re: any) => ({
      risultato: re.risultato,
      probabilita: re.probabilita,
      top: re.top,
      reasoning: re.reasoning || "Analisi basata sui dati disponibili"
    })),
    value_bets: analysis.value_bets || [],
    piano_scommessa: analysis.piano_scommessa || generateSmartBettingPlan(matchData),
    scommessa_principale: analysis.scommessa_principale || {
      tipo: "DOPPIA CHANCE",
      selezione: "X2",
      quota_target: "1.40 - 1.50",
      probabilita: 65,
      istruzioni: {
        gioca: "X2 con stake moderato",
        quota_minima: 1.40,
        timing: "Punta 2-3 ore prima del calcio d'inizio",
        bookmaker: "Confronta le quote su più bookmaker",
        sicurezza: "Mercato a rischio controllato"
      }
    },
    strategie: analysis.strategie || {
      conservativa: {
        nome: "Sicura",
        selezione: "X2",
        quota: 1.45,
        stake: "20% budget",
        win_rate: "~65%"
      },
      aggressiva: {
        nome: "Rischiosa",
        selezione: "Over 2.5",
        quota: 1.85,
        stake: "10% budget",
        win_rate: "~45%"
      },
      live: {
        consiglio: "Monitora il primo tempo per opportunità Over/Under",
        motivo: "Le quote live possono offrire valore maggiore"
      }
    },
    report_narrativo: analysis.report_narrativo || generateBasicReport(matchData)
  }
}

function generateIntelligentFallbackAnalysis(matchData: MatchData): AIAnalysisResult {
  console.log('🛠️ FALLBACK: Generating intelligent fallback analysis for:', `${matchData.homeTeam.name} vs ${matchData.awayTeam.name}`)
  const { predictions, odds, h2h, teamStats } = matchData
  
  // Calculate basic analysis from available data
  const homeProb = predictions?.winner?.home || 33
  const drawProb = predictions?.winner?.draw || 34
  const awayProb = predictions?.winner?.away || 33
  
  const mostProbable = homeProb >= drawProb && homeProb >= awayProb ? "1" :
                      drawProb >= homeProb && drawProb >= awayProb ? "X" : "2" as "1" | "X" | "2"
  
  // ANALYZE REAL DATA for Over/Under and BTTS
  const h2hMatches = h2h?.matches || []
  const h2hAvgGoals = h2h?.avgGoals || 2.5
  const overUnderAnalysis = analyzeOverUnder(h2hMatches, h2hAvgGoals)
  const bttsAnalysis = analyzeBTTS(h2hMatches)
  
  console.log('🎯 FALLBACK using REAL data analysis:')
  console.log(`  - Over/Under: ${overUnderAnalysis.decision} (${overUnderAnalysis.reasoning})`)
  console.log(`  - BTTS: ${bttsAnalysis.decision} (${bttsAnalysis.reasoning})`)
  
  // Calculate value bets based on real odds vs predictions
  const valueBets = []
  if (odds?.winner?.home && homeProb > (100 / odds.winner.home)) {
    valueBets.push({
      mercato: "Vittoria Casa",
      quota: odds.winner.home,
      probabilita_reale: homeProb,
      probabilita_quota: Math.round((100 / odds.winner.home) * 10) / 10,
      edge: `+${(homeProb - (100 / odds.winner.home)).toFixed(1)}%`,
      spiegazione: `La nostra analisi indica ${homeProb}% di probabilità vs ${(100 / odds.winner.home).toFixed(1)}% implicita della quota`
    })
  }
  
  const analysis = {
    previsione_ai: {
      esito_principale: mostProbable,
      percentuali: { home: homeProb, draw: drawProb, away: awayProb },
      motivazione: `Analisi CalcioAI indica ${mostProbable === "1" ? "vittoria casa" : mostProbable === "X" ? "pareggio" : "vittoria trasferta"} come esito più probabile con ${Math.max(homeProb, drawProb, awayProb)}% di probabilità`
    },
    mercati: {
      risultato_finale: {
        consigliato: mostProbable,
        confidence: (Math.max(homeProb, drawProb, awayProb) > 50 ? "ALTA" : "MEDIA") as "ALTA" | "MEDIA" | "BASSA",
        quota: mostProbable === "1" ? odds?.winner?.home || 2.50 :
               mostProbable === "X" ? odds?.winner?.draw || 3.20 :
               odds?.winner?.away || 3.00,
        value: valueBets.length > 0,
        reasoning: `Esito con ${Math.max(homeProb, drawProb, awayProb)}% di probabilità secondo analisi CalcioAI`
      },
      over_under: {
        consigliato: overUnderAnalysis.decision,
        confidence: (overUnderAnalysis.decision === 'Over 2.5' && h2hAvgGoals > 3 ? "ALTA" : 
                   overUnderAnalysis.decision === 'Under 2.5' && h2hAvgGoals < 2 ? "ALTA" : "MEDIA") as "ALTA" | "MEDIA" | "BASSA",
        quota: overUnderAnalysis.decision === 'Over 2.5' ? (odds?.goals?.over_2_5 || 1.85) : (odds?.goals?.under_2_5 || 1.95),
        percentuale: overUnderAnalysis.decision === 'Over 2.5' ? (predictions?.goals?.over_2_5 || 55) : (predictions?.goals?.under_2_5 || 45),
        value: false,
        reasoning: overUnderAnalysis.reasoning
      },
      gol_nogol: {
        consigliato: bttsAnalysis.decision,
        confidence: (bttsAnalysis.cleanSheets > h2hMatches.length / 2 ? "ALTA" : "MEDIA") as "ALTA" | "MEDIA" | "BASSA",
        quota: bttsAnalysis.decision === 'Gol' ? (odds?.goals?.gol || 1.70) : (odds?.goals?.nogol || 2.10),
        percentuale: bttsAnalysis.decision === 'Gol' ? (predictions?.goals?.gol || 58) : (predictions?.goals?.nogol || 42),
        value: false,
        reasoning: bttsAnalysis.reasoning
      },
      doppia_chance: {
        consigliato: homeProb > awayProb ? "1X" : "X2",
        confidence: "ALTA" as "ALTA" | "MEDIA" | "BASSA",
        quota: homeProb > awayProb ? odds?.doubleChance?.x1 || 1.35 : odds?.doubleChance?.x2 || 1.45,
        percentuale: Math.round(homeProb > awayProb ? homeProb + drawProb : drawProb + awayProb),
        value: true,
        reasoning: `Mercato sicuro coprendo ${homeProb > awayProb ? 'casa e pareggio' : 'pareggio e trasferta'}`
      },
      multigol: {
        consigliato: "1-3",
        confidence: "MEDIA" as "ALTA" | "MEDIA" | "BASSA",
        quota: odds?.multigol?.mg_1_3 || 1.75,
        percentuale: predictions?.multigol?.mg_1_3 || 52,
        value: false,
        reasoning: "Range più probabile basato sulle statistiche"
      }
    },
    // NEW: Complete H2H, form and standings data (fallback)
    mercati_combo: generateFallbackComboMarkets(matchData),
    h2h: generateFallbackH2H(matchData),
    forma_squadre: generateFallbackTeamForm(matchData),
    classifica: generateFallbackStandings(matchData),
    risultati_esatti: generateIntelligentExactScores(matchData),
    value_bets: valueBets,
    piano_scommessa: generateSmartBettingPlan(matchData),
    scommessa_principale: {
      tipo: (Math.max(homeProb, drawProb, awayProb) > 55 ? "SINGOLA" : "DOPPIA CHANCE") as "DOPPIA CHANCE" | "SINGOLA" | "COMBO",
      selezione: homeProb > awayProb ? "1X" : "X2",
      quota_target: homeProb > awayProb ? "1.30 - 1.40" : "1.40 - 1.50",
      probabilita: Math.round(homeProb > awayProb ? homeProb + drawProb : drawProb + awayProb),
      istruzioni: {
        gioca: `${homeProb > awayProb ? "1X" : "X2"} con stake 15-20% del budget`,
        quota_minima: homeProb > awayProb ? 1.30 : 1.40,
        timing: "2-3 ore prima del calcio d'inizio",
        bookmaker: "Confronta quote su almeno 3 bookmaker",
        sicurezza: "Mercato a rischio controllato"
      }
    },
    strategie: {
      conservativa: {
        nome: "Doppia Chance Sicura",
        selezione: homeProb > awayProb ? "1X" : "X2",
        quota: homeProb > awayProb ? odds?.doubleChance?.x1 || 1.35 : odds?.doubleChance?.x2 || 1.45,
        stake: "25% budget",
        win_rate: "~65%"
      },
      aggressiva: {
        nome: "Risultato Esatto",
        selezione: mostProbable === "1" ? "1-0" : mostProbable === "X" ? "1-1" : "0-1",
        quota: mostProbable === "1" ? 8.00 : mostProbable === "X" ? 6.50 : 9.00,
        stake: "5% budget",
        win_rate: "~12%"
      },
      live: {
        consiglio: "Se pareggio 0-0 al 70', considera Over 0.5 goal",
        motivo: "Il 75% delle partite con 0-0 al 70' finisce con almeno 1 goal"
      }
    },
    report_narrativo: generateBasicReport(matchData)
  }
  
  // APPLICA VALIDAZIONE COERENZA TOTALE ANCHE AL FALLBACK
  console.log('🔍 Validating fallback analysis coherence...')
  const { analysis: coherentFallback, fixes } = validateAndFixCoherence(analysis)
  
  if (fixes.length > 0) {
    console.log(`✅ Applied ${fixes.length} coherence fixes to fallback`)
  }
  
  return validateAnalysisCoherence(coherentFallback, matchData)
}

function generateCorrectScoresFromData(predictions: any, odds: any): Array<{risultato: string; probabilita: number; top: number}> {
  const scores = []
  
  if (odds?.correctScore) {
    const sortedScores = Object.entries(odds.correctScore)
      .sort(([,a], [,b]) => (a as number) - (b as number))
      .slice(0, 3)
    
    sortedScores.forEach(([score], index) => {
      scores.push({
        risultato: score,
        probabilita: Math.round((Math.random() * 10 + 10) * 10) / 10, // Generate varied probabilities
        top: index + 1
      })
    })
  } else {
    // Generate varied scores based on predictions - no more fixed results
    const { home, draw, away } = predictions?.winner || { home: 33, draw: 34, away: 33 }
    
    if (draw >= home && draw >= away) {
      // Draw favored - varied draw results
      scores.push(
        { risultato: "1-1", probabilita: 18, top: 1 },
        { risultato: "0-0", probabilita: 12, top: 2 },
        { risultato: "2-2", probabilita: 8, top: 3 }
      )
    } else if (home >= away) {
      // Home favored - varied home wins
      scores.push(
        { risultato: "2-0", probabilita: 15, top: 1 },
        { risultato: "1-0", probabilita: 13, top: 2 },
        { risultato: "3-1", probabilita: 10, top: 3 }
      )
    } else {
      // Away favored - varied away wins  
      scores.push(
        { risultato: "0-2", probabilita: 15, top: 1 },
        { risultato: "0-1", probabilita: 13, top: 2 },
        { risultato: "1-3", probabilita: 10, top: 3 }
      )
    }
  }
  
  return scores
}

function generateBasicReport(matchData: MatchData): string {
  const { homeTeam, awayTeam, league, predictions, h2h, teamStats, homeTeamData, awayTeamData } = matchData
  
  const homeProb = predictions?.winner?.home || 33
  const drawProb = predictions?.winner?.draw || 34
  const awayProb = predictions?.winner?.away || 33
  
  // Use standing data for more accurate stats
  const homeStanding = homeTeamData?.standing
  const awayStanding = awayTeamData?.standing
  const homeForm = homeTeamData?.form
  const awayForm = awayTeamData?.form
  
  // Safe number formatting to avoid NaN with realistic fallbacks
  const safeNum = (val: any, fallback: number = 5) => isNaN(Number(val)) || Number(val) === 0 ? fallback : Number(val)
  const safeAvg = (val: any, fallback: string = '1.2') => isNaN(Number(val)) ? fallback : Number(val).toFixed(1)
  
  // Determine strategy based on REAL probabilities from API-Football
  const maxProb = Math.max(homeProb, drawProb, awayProb)
  const direction = homeProb === maxProb ? 'CASA' : awayProb === maxProb ? 'OSPITE' : 'EQUILIBRIO'
  const strategy = direction === 'CASA' ? '1' : direction === 'OSPITE' ? '2' : 'X2'
  
  // Create UNIQUE opening based on specific teams and percentages
  const getUniqueOpening = () => {
    const homePos = homeStanding?.position || 'metà classifica'
    const awayPos = awayStanding?.position || 'metà classifica'
    const formComparison = (homeForm?.wins || 0) - (awayForm?.wins || 0)
    
    if (direction === 'CASA') {
      return `${homeTeam.name}, ${homePos}° posto con ${homeStanding?.points || '?'} punti, riceve un ${awayTeam.name} che viaggia in ${awayPos}° posizione. I numeri parlano chiaro: ${homeProb}% contro ${awayProb}%, il fattore campo qui può pesare eccome.`
    } else if (direction === 'OSPITE') {
      return `In trasferta il ${awayTeam.name} (${awayPos}°, ${awayStanding?.points || '?'} pt) va a far visita al ${homeTeam.name} di casa (${homePos}°, ${homeStanding?.points || '?'} pt). Ma attenzione: gli ospiti hanno il ${awayProb}% di probabilità, più del ${homeProb}% dei padroni di casa.`
    } else {
      return `${homeTeam.name} vs ${awayTeam.name}, una sfida che sulla carta vale ${homeProb}%-${drawProb}%-${awayProb}%. Praticamente un terno al lotto! ${Math.abs((homeForm?.wins || 0) - (awayForm?.wins || 0)) <= 1 ? 'Anche la forma recente è simile' : formComparison > 0 ? homeTeam.name + ' ha vinto di più ultimamente' : awayTeam.name + ' è più in forma'}.`
    }
  }
  
  // SPECIFIC team analysis based on REAL data
  const getSpecificTeamAnalysis = (team: any, standing: any, form: any, isHome: boolean) => {
    const teamName = team.name
    const location = isHome ? 'in casa' : 'in trasferta'
    const games = isHome ? standing?.won || 0 : standing?.won || 0 // This should be away-specific in real implementation
    const goals = standing?.goalsFor || 0
    const conceded = standing?.goalsAgainst || 0
    const recentForm = form?.formString || 'NNNNN'
    
    if (games >= 8) {
      return `${teamName} ${location} ha raccolto ${games} vittorie quest'anno, con ${goals} goal fatti e ${conceded} subiti. La forma dice "${recentForm}" - ${form?.wins >= 3 ? 'stanno andando forte' : form?.wins <= 1 ? 'momento difficile' : 'altalenanti'}.`
    } else if (games >= 4) {
      return `${teamName} ${location} ha fatto ${games} vittorie. Numeri che dicono ${goals > conceded ? 'attacco meglio della difesa' : conceded > goals ? 'difesa che balla un po\'' : 'squadra equilibrata'}. ${recentForm} nell'ultima forma.`
    } else {
      return `${teamName} ${location} è ancora in rodaggio con ${games} vittorie, ma ${form?.wins >= 2 ? 'ultimamente gira meglio' : 'fatica a decollare'}.`
    }
  }
  
  // UNIQUE H2H analysis with REAL reasoning
  const getUniqueH2HAnalysis = () => {
    if (!h2h || h2h.total === 0) {
      return `Primi scontri recenti tra ${homeTeam.name} e ${awayTeam.name}, quindi tutto può succedere. Senza precedenti, mi baso solo sulla forma attuale.`
    }
    
    // REAL ANALYSIS of Over/Under
    const h2hMatches = h2h.matches || []
    const h2hAvgGoals = h2h.avgGoals || 2.5
    const overUnderAnalysis = analyzeOverUnder(h2hMatches, h2hAvgGoals)
    const bttsAnalysis = analyzeBTTS(h2hMatches)
    
    const lastMatch = h2h.matches?.[0]
    const lastScore = lastMatch ? `${lastMatch.homeGoals}-${lastMatch.awayGoals}` : 'N/A'
    const dominance = h2h.homeWins > h2h.awayWins ? homeTeam.name : 
                     h2h.awayWins > h2h.homeWins ? awayTeam.name : 'nessuno'
    const results = h2h.results || []
    
    return `Negli ultimi ${h2h.total} scontri: ${dominance === 'nessuno' ? 'equilibrio totale' : dominance + ' domina'}. 
Risultati: ${results.slice(0, 5).join(', ')} (media ${h2hAvgGoals.toFixed(1)} gol).
${overUnderAnalysis.reasoning}. ${bttsAnalysis.reasoning}.`
  }
  
  // COHERENT betting advice
  const getBettingAdvice = () => {
    if (direction === 'CASA') {
      return `Punto tutto su ${homeTeam.name}. ${homeProb}% di probabilità non si rifiutano, soprattutto ${homeStanding?.won >= 6 ? 'con questo ruolino casalingo' : 'davanti al proprio pubblico'}. ${awayStanding?.goalsAgainst >= 12 ? awayTeam.name + ' prende troppi goal in trasferta' : 'Vittoria casalinga convincente'}.`
    } else if (direction === 'OSPITE') {
      return `${awayTeam.name} in trasferta vale il ${awayProb}%, più di quanto dica la classifica. ${awayForm?.wins >= 3 ? 'Sono in un momento d\'oro' : 'Sanno fare risultato lontano da casa'}. ${homeStanding?.won <= 3 ? homeTeam.name + ' in casa fa fatica' : 'Colpo esterno probabile'}.`
    } else {
      return `Partita troppo equilibrata per rischiare sulla singola. X2 è la mossa giusta: ${drawProb + awayProb}% di copertura. ${homeForm?.wins <= awayForm?.wins ? 'Anche la forma è simile' : 'Non vedo un netto favorito'}.`
    }
  }
  
  // Generate UNIQUE conclusion with REAL data reasoning
  const getUniqueConclusion = () => {
    const h2hMatches = h2h?.matches || []
    const h2hAvgGoals = h2h?.avgGoals || 2.5
    const overUnderAnalysis = analyzeOverUnder(h2hMatches, h2hAvgGoals)
    const bttsAnalysis = analyzeBTTS(h2hMatches)
    
    const suffix = overUnderAnalysis.decision
    
    if (direction === 'CASA') {
      return `La combo vincente? ${homeTeam.name} + ${suffix}. 
${overUnderAnalysis.reasoning}, quindi ${suffix} è la scelta logica. 
${bttsAnalysis.decision === 'Gol' ? 'Occhio che entrambe potrebbero segnare.' : 'Difficile che segnino entrambe.'}`
    } else if (direction === 'OSPITE') {
      return `Consiglio forte: ${awayTeam.name} + ${suffix}. 
${overUnderAnalysis.reasoning}. 
${awayStanding?.position < homeStanding?.position ? 'Squadra più in alto che vince fuori casa.' : 'Colpo esterno possibile.'}`
    } else {
      return `Vista l'analisi: X2 + ${suffix}. 
${overUnderAnalysis.reasoning}. 
Copri pareggio e vittoria ospite con la tendenza goal giusta.`
    }
  }
  
  return `## ${homeTeam.name} vs ${awayTeam.name} - Analisi Esclusiva

**La situazione in campo**
${getUniqueOpening()}

**Come arrivano le squadre**
${getSpecificTeamAnalysis(homeTeam, homeStanding, homeForm, true)}

${getSpecificTeamAnalysis(awayTeam, awayStanding, awayForm, false)}

**I precedenti raccontano**
${getUniqueH2HAnalysis()}

**La mia giocata**
${getBettingAdvice()}

**Il colpo finale**
${getUniqueConclusion()}

---
*CalcioAI • Analisi del ${new Date().toLocaleDateString('it-IT')} 🎯*`
}

interface AnalysisValidation {
  isCoherent: boolean
  fixes: string[]
}

// Funzione per generare risultati coerenti
function generateCoherentResults(isOver: boolean, isUnder: boolean, isGol: boolean, isNoGol: boolean): any[] {
  if (isUnder && isNoGol) {
    // Pochi gol, una sola squadra segna
    return [
      { risultato: '1-0', probabilita: 20, top: 1, reasoning: 'Vittoria di misura, pochi gol' },
      { risultato: '0-1', probabilita: 18, top: 2, reasoning: 'Vittoria esterna di misura' },
      { risultato: '2-0', probabilita: 15, top: 3, reasoning: 'Vittoria netta con clean sheet' },
      { risultato: '0-0', probabilita: 10, top: 4, reasoning: 'Pareggio a reti inviolate' },
      { risultato: '0-2', probabilita: 8, top: 5, reasoning: 'Vittoria esterna netta' }
    ]
  } else if (isUnder && isGol) {
    // Pochi gol, entrambe segnano
    return [
      { risultato: '1-1', probabilita: 25, top: 1, reasoning: 'Pareggio con gol, partita equilibrata' },
      { risultato: '2-1', probabilita: 15, top: 2, reasoning: 'Vittoria di misura con gol subito' },
      { risultato: '1-2', probabilita: 12, top: 3, reasoning: 'Vittoria esterna in rimonta' }
    ]
  } else if (isOver && isGol) {
    // Tanti gol, entrambe segnano
    return [
      { risultato: '2-2', probabilita: 18, top: 1, reasoning: 'Pareggio spettacolare' },
      { risultato: '3-2', probabilita: 15, top: 2, reasoning: 'Vittoria in partita ricca di gol' },
      { risultato: '2-3', probabilita: 14, top: 3, reasoning: 'Vittoria esterna spettacolare' },
      { risultato: '3-1', probabilita: 12, top: 4, reasoning: 'Vittoria netta con gol subito' },
      { risultato: '2-1', probabilita: 10, top: 5, reasoning: 'Vittoria di misura ma con gol' }
    ]
  } else if (isOver && isNoGol) {
    // Tanti gol, una sola squadra segna (raro ma possibile)
    return [
      { risultato: '3-0', probabilita: 18, top: 1, reasoning: 'Vittoria schiacciante' },
      { risultato: '0-3', probabilita: 16, top: 2, reasoning: 'Tracollo casalingo' },
      { risultato: '4-0', probabilita: 10, top: 3, reasoning: 'Goleada storica' },
      { risultato: '0-4', probabilita: 8, top: 4, reasoning: 'Disfatta totale' }
    ]
  }
  
  // Default bilanciato
  return [
    { risultato: '1-1', probabilita: 15, top: 1, reasoning: 'Pareggio equilibrato' },
    { risultato: '1-0', probabilita: 14, top: 2, reasoning: 'Vittoria di misura' },
    { risultato: '0-1', probabilita: 13, top: 3, reasoning: 'Colpo esterno' },
    { risultato: '2-1', probabilita: 12, top: 4, reasoning: 'Vittoria con brivido' },
    { risultato: '1-2', probabilita: 11, top: 5, reasoning: 'Rimonta ospite' }
  ]
}

// Validazione e correzione coerenza totale
function validateAndFixCoherence(analysis: any): { analysis: any, fixes: string[] } {
  const fixes: string[] = []
  
  // === 1. DETERMINA LA DIREZIONE GOL ===
  const overUnderChoice = analysis.mercati?.over_under?.consigliato?.toLowerCase() || ''
  const isOver = overUnderChoice.includes('over 2.5')
  const isUnder = overUnderChoice.includes('under 2.5')
  
  console.log(`🎯 Direzione Over/Under: ${isOver ? 'OVER' : isUnder ? 'UNDER' : 'NON DEFINITA'}`)
  
  // === 2. DETERMINA LA DIREZIONE BTTS ===
  const bttsChoice = analysis.mercati?.gol_nogol?.consigliato?.toLowerCase() || ''
  const isGol = bttsChoice === 'gol'
  const isNoGol = bttsChoice === 'nogol'
  
  console.log(`🎯 Direzione BTTS: ${isGol ? 'GOL' : isNoGol ? 'NOGOL' : 'NON DEFINITA'}`)
  
  // === 3. VALIDA E CORREGGI RISULTATI ESATTI ===
  if (analysis.risultati_esatti && Array.isArray(analysis.risultati_esatti)) {
    let needsRegeneration = false
    let invalidCount = 0
    
    // Filtra risultati validi
    const validResults = analysis.risultati_esatti.filter((r: any) => {
      const [home, away] = r.risultato.split('-').map(Number)
      const totalGoals = home + away
      const bothScored = home > 0 && away > 0
      
      let isValid = true
      
      // Verifica coerenza con Over/Under
      if (isUnder && totalGoals > 2) {
        fixes.push(`❌ Risultato ${r.risultato} (${totalGoals} gol) incompatibile con Under 2.5`)
        isValid = false
        invalidCount++
      }
      
      if (isOver && totalGoals < 3) {
        fixes.push(`❌ Risultato ${r.risultato} (${totalGoals} gol) incompatibile con Over 2.5`)
        isValid = false
        invalidCount++
      }
      
      // Verifica coerenza con BTTS
      if (isNoGol && bothScored) {
        fixes.push(`❌ Risultato ${r.risultato} incompatibile con NoGol (entrambe segnano)`)
        isValid = false
        invalidCount++
      }
      
      if (isGol && !bothScored && totalGoals > 0) {
        fixes.push(`❌ Risultato ${r.risultato} incompatibile con Gol (solo una segna)`)
        isValid = false
        invalidCount++
      }
      
      return isValid
    })
    
    // Se più del 50% dei risultati sono invalidi, rigenera tutto
    if (invalidCount > analysis.risultati_esatti.length / 2 || validResults.length < 3) {
      console.log('⚠️ Troppi risultati incoerenti, rigenerando tutti...')
      analysis.risultati_esatti = generateCoherentResults(isOver, isUnder, isGol, isNoGol).slice(0, 3)
      fixes.push('✅ Tutti i risultati esatti rigenerati per coerenza')
    } else if (validResults.length < analysis.risultati_esatti.length) {
      // Altrimenti usa solo i risultati validi
      console.log('⚠️ Alcuni risultati incoerenti, usando solo quelli validi...')
      analysis.risultati_esatti = validResults.slice(0, 3)
      // Se servono più risultati, aggiungi da quelli coerenti
      if (analysis.risultati_esatti.length < 3) {
        const coherentResults = generateCoherentResults(isOver, isUnder, isGol, isNoGol)
        const needed = 3 - analysis.risultati_esatti.length
        analysis.risultati_esatti.push(...coherentResults.slice(0, needed))
      }
      fixes.push(`✅ Filtrati ${invalidCount} risultati incoerenti`)
    }
  }
  
  // === 4. VALIDA E CORREGGI COMBO ===
  if (analysis.mercati_combo && Array.isArray(analysis.mercati_combo)) {
    analysis.mercati_combo = analysis.mercati_combo.map((combo: any) => {
      const comboLower = combo.tipo.toLowerCase()
      let fixed = false
      
      // Correggi Over/Under nelle combo
      if (isUnder && comboLower.includes('over 2.5')) {
        combo.tipo = combo.tipo.replace(/over 2\.5/gi, 'Under 2.5')
        combo.nome = combo.nome?.replace(/over 2\.5/gi, 'Under 2.5')
        combo.reasoning = combo.reasoning?.replace(/over 2\.5/gi, 'Under 2.5')
        fixes.push(`✅ Combo "${combo.tipo}" corretta da Over a Under`)
        fixed = true
      }
      
      if (isOver && comboLower.includes('under 2.5')) {
        combo.tipo = combo.tipo.replace(/under 2\.5/gi, 'Over 2.5')
        combo.nome = combo.nome?.replace(/under 2\.5/gi, 'Over 2.5')
        combo.reasoning = combo.reasoning?.replace(/under 2\.5/gi, 'Over 2.5')
        fixes.push(`✅ Combo "${combo.tipo}" corretta da Under a Over`)
        fixed = true
      }
      
      // Correggi Gol/NoGol nelle combo
      if (isGol && comboLower.includes('nogol')) {
        combo.tipo = combo.tipo.replace(/nogol/gi, 'Gol')
        combo.nome = combo.nome?.replace(/nogol/gi, 'Gol')
        combo.reasoning = combo.reasoning?.replace(/nogol/gi, 'Gol')
        fixes.push(`✅ Combo corretta da NoGol a Gol`)
        fixed = true
      }
      
      if (isNoGol && comboLower.includes('gol') && !comboLower.includes('nogol')) {
        combo.tipo = combo.tipo.replace(/gol/gi, 'NoGol')
        combo.nome = combo.nome?.replace(/gol/gi, 'NoGol')
        combo.reasoning = combo.reasoning?.replace(/entrambe segnano/gi, 'almeno una non segna')
        fixes.push(`✅ Combo corretta da Gol a NoGol`)
        fixed = true
      }
      
      return combo
    })
  }
  
  // === 5. VALIDA E CORREGGI PIANO SCOMMESSA ===
  if (analysis.piano_scommessa && analysis.piano_scommessa.selezione) {
    const pianoLower = analysis.piano_scommessa.selezione.toLowerCase()
    
    // Correggi Over/Under nel piano
    if (isOver && pianoLower.includes('under')) {
      analysis.piano_scommessa.selezione = analysis.piano_scommessa.selezione.replace(/under 2\.5/gi, 'Over 2.5')
      if (analysis.piano_scommessa.reasoning) {
        analysis.piano_scommessa.reasoning = analysis.piano_scommessa.reasoning.replace(/under 2\.5/gi, 'Over 2.5')
      }
      fixes.push(`✅ Piano scommessa corretto da Under a Over`)
    }
    
    if (isUnder && pianoLower.includes('over')) {
      analysis.piano_scommessa.selezione = analysis.piano_scommessa.selezione.replace(/over 2\.5/gi, 'Under 2.5')
      if (analysis.piano_scommessa.reasoning) {
        analysis.piano_scommessa.reasoning = analysis.piano_scommessa.reasoning.replace(/over 2\.5/gi, 'Under 2.5')
      }
      fixes.push(`✅ Piano scommessa corretto da Over a Under`)
    }
  }
  
  // === 6. VALIDA STRATEGIE ===
  if (analysis.strategie) {
    ['conservativa', 'aggressiva'].forEach(tipo => {
      if (analysis.strategie[tipo]?.selezione) {
        const stratLower = analysis.strategie[tipo].selezione.toLowerCase()
        
        if (isUnder && stratLower.includes('over')) {
          analysis.strategie[tipo].selezione = analysis.strategie[tipo].selezione.replace(/over 2\.5/gi, 'Under 2.5')
          fixes.push(`✅ Strategia ${tipo} corretta da Over a Under`)
        }
        
        if (isOver && stratLower.includes('under')) {
          analysis.strategie[tipo].selezione = analysis.strategie[tipo].selezione.replace(/under 2\.5/gi, 'Over 2.5')
          fixes.push(`✅ Strategia ${tipo} corretta da Under a Over`)
        }
      }
    })
  }
  
  // === 7. VALIDA REPORT NARRATIVO ===
  if (analysis.report_narrativo) {
    const reportLower = analysis.report_narrativo.toLowerCase()
    let reportFixed = false
    
    // Conta menzioni di over/under nel report
    const overMentions = (reportLower.match(/over 2\.5/g) || []).length
    const underMentions = (reportLower.match(/under 2\.5/g) || []).length
    
    // Se dice Under ma report parla di Over
    if (isUnder && overMentions > underMentions) {
      analysis.report_narrativo = analysis.report_narrativo.replace(/over 2\.5/gi, 'Under 2.5')
      analysis.report_narrativo = analysis.report_narrativo.replace(/molti gol/gi, 'pochi gol')
      analysis.report_narrativo = analysis.report_narrativo.replace(/partita spettacolare/gi, 'partita chiusa')
      fixes.push(`✅ Report narrativo corretto per coerenza con Under 2.5`)
      reportFixed = true
    }
    
    // Se dice Over ma report parla di Under
    if (isOver && underMentions > overMentions) {
      analysis.report_narrativo = analysis.report_narrativo.replace(/under 2\.5/gi, 'Over 2.5')
      analysis.report_narrativo = analysis.report_narrativo.replace(/pochi gol/gi, 'molti gol')
      analysis.report_narrativo = analysis.report_narrativo.replace(/partita chiusa/gi, 'partita spettacolare')
      fixes.push(`✅ Report narrativo corretto per coerenza con Over 2.5`)
      reportFixed = true
    }
  }
  
  // === 8. VALIDAZIONE FINALE COMPLETA ===
  // Ricontrolla tutto ancora una volta
  const finalCheck = {
    mercatiOk: analysis.mercati?.over_under?.consigliato?.includes(isOver ? 'Over' : 'Under'),
    bttsOk: analysis.mercati?.gol_nogol?.consigliato === (isGol ? 'Gol' : 'NoGol'),
    risultatiOk: true,
    comboOk: true,
    pianoOk: true
  }
  
  // Check risultati finali
  if (analysis.risultati_esatti) {
    for (const r of analysis.risultati_esatti) {
      const [h, a] = r.risultato.split('-').map(Number)
      const tot = h + a
      const both = h > 0 && a > 0
      
      if ((isUnder && tot > 2) || (isOver && tot < 3) || (isNoGol && both) || (isGol && !both && tot > 0)) {
        finalCheck.risultatiOk = false
        console.error(`❌ ANCORA INCOERENTE: Risultato ${r.risultato}`)
      }
    }
  }
  
  // Check combo finali
  if (analysis.mercati_combo) {
    for (const combo of analysis.mercati_combo) {
      const comboLower = combo.tipo.toLowerCase()
      if ((isUnder && comboLower.includes('over')) || (isOver && comboLower.includes('under'))) {
        finalCheck.comboOk = false
        console.error(`❌ ANCORA INCOERENTE: Combo ${combo.tipo}`)
      }
    }
  }
  
  // Check piano finale
  if (analysis.piano_scommessa?.selezione) {
    const pianoLower = analysis.piano_scommessa.selezione.toLowerCase()
    if ((isUnder && pianoLower.includes('over')) || (isOver && pianoLower.includes('under'))) {
      finalCheck.pianoOk = false
      console.error(`❌ ANCORA INCOERENTE: Piano ${analysis.piano_scommessa.selezione}`)
    }
  }
  
  const allOk = Object.values(finalCheck).every(v => v)
  
  // === 9. LOG DELLE CORREZIONI ===
  if (fixes.length > 0) {
    console.log('🔧 Correzioni applicate per coerenza:')
    fixes.forEach(fix => console.log(`   - ${fix}`))
    console.log(allOk ? '✅ VALIDAZIONE FINALE: Tutto coerente!' : '⚠️ VALIDAZIONE FINALE: Ancora problemi di coerenza')
  } else {
    console.log('✅ Analisi già coerente, nessuna correzione necessaria')
  }
  
  return { analysis, fixes }
}

// Enhanced coherence validation with REAL DATA checks
function validateAnalysisCoherence(analysis: AIAnalysisResult, matchData?: MatchData): AIAnalysisResult {
  const mainPrediction = analysis.previsione_ai.esito_principale
  const percentages = analysis.previsione_ai.percentuali
  
  console.log(`🔍 Validating coherence for: ${mainPrediction} (${percentages.home}%-${percentages.draw}%-${percentages.away}%)`)
  
  // 1. Validate Over/Under against real H2H data if available
  if (matchData?.h2h) {
    const h2hAvgGoals = matchData.h2h.avgGoals || 2.5
    const overUnderDecision = analysis.mercati.over_under.consigliato
    
    // Fix if Over/Under doesn't match H2H data
    if (h2hAvgGoals < 2.2 && overUnderDecision.includes('Over')) {
      console.error(`❌ FIXING: Suggested Over but H2H avg is only ${h2hAvgGoals}`)
      analysis.mercati.over_under.consigliato = 'Under 2.5'
      analysis.mercati.over_under.reasoning = `Media H2H di ${h2hAvgGoals} gol supporta Under`
    }
    
    if (h2hAvgGoals > 2.8 && overUnderDecision.includes('Under')) {
      console.error(`❌ FIXING: Suggested Under but H2H avg is ${h2hAvgGoals}`)
      analysis.mercati.over_under.consigliato = 'Over 2.5'
      analysis.mercati.over_under.reasoning = `Media H2H di ${h2hAvgGoals} gol supporta Over`
    }
  }
  
  // 2. Ensure risultati_esatti are coherent with Over/Under
  const isUnder = analysis.mercati.over_under.consigliato.includes('Under')
  let coherentResults: Array<{risultato: string; probabilita: number; top: number; reasoning: string}>
  
  if (mainPrediction === "1") {
    // Home wins - adjust for Over/Under
    coherentResults = isUnder ? [
      { risultato: "1-0", probabilita: 16, top: 1, reasoning: "Vittoria casalinga con pochi gol" },
      { risultato: "2-0", probabilita: 14, top: 2, reasoning: "Vittoria casalinga netta" },
      { risultato: "2-1", probabilita: 11, top: 3, reasoning: "Vittoria casalinga combattuta" }
    ] : [
      { risultato: "2-1", probabilita: 16, top: 1, reasoning: "Vittoria casalinga con molti gol" },
      { risultato: "3-1", probabilita: 14, top: 2, reasoning: "Vittoria casalinga spettacolare" },
      { risultato: "3-2", probabilita: 11, top: 3, reasoning: "Partita ad alta intensità" }
    ]
  } else if (mainPrediction === "2") {
    // Away wins - adjust for Over/Under
    coherentResults = isUnder ? [
      { risultato: "0-1", probabilita: 16, top: 1, reasoning: "Vittoria esterna di misura" },
      { risultato: "0-2", probabilita: 14, top: 2, reasoning: "Vittoria esterna netta" },
      { risultato: "1-2", probabilita: 11, top: 3, reasoning: "Vittoria esterna combattuta" }
    ] : [
      { risultato: "1-2", probabilita: 16, top: 1, reasoning: "Vittoria esterna con molti gol" },
      { risultato: "1-3", probabilita: 14, top: 2, reasoning: "Vittoria esterna convincente" },
      { risultato: "2-3", probabilita: 11, top: 3, reasoning: "Partita spettacolare" }
    ]
  } else {
    // Draw - adjust for Over/Under
    coherentResults = isUnder ? [
      { risultato: "0-0", probabilita: 18, top: 1, reasoning: "Pareggio a reti bianche" },
      { risultato: "1-1", probabilita: 13, top: 2, reasoning: "Pareggio equilibrato" },
      { risultato: "0-1", probabilita: 12, top: 3, reasoning: "Risultato di misura" }
    ] : [
      { risultato: "2-2", probabilita: 18, top: 1, reasoning: "Pareggio spettacolare" },
      { risultato: "1-1", probabilita: 13, top: 2, reasoning: "Pareggio equilibrato" },
      { risultato: "3-3", probabilita: 12, top: 3, reasoning: "Pareggio ad alta intensità" }
    ]
  }
  
  // 3. Filter value_bets to be coherent
  const filteredValueBets = analysis.value_bets.filter(bet => {
    if (mainPrediction === "X" && bet.mercato.includes("Vittoria Casa")) return false
    if (mainPrediction === "1" && bet.mercato.includes("Vittoria Trasferta")) return false
    return true
  })
  
  // 4. Fix combo markets to match Over/Under
  const coherentCombos = analysis.mercati_combo?.map(combo => {
    let newType = combo.tipo
    
    // Force coherence with Over/Under
    if (isUnder && combo.tipo.toLowerCase().includes('over')) {
      newType = combo.tipo.replace(/over \d\.\d/gi, 'Under 2.5')
    } else if (!isUnder && combo.tipo.toLowerCase().includes('under')) {
      newType = combo.tipo.replace(/under \d\.\d/gi, 'Over 2.5')
    }
    
    return { ...combo, tipo: newType }
  }) || []
  
  console.log(`✅ Coherence validated: Over/Under=${analysis.mercati.over_under.consigliato}, Combos fixed`)
  
  return {
    ...analysis,
    risultati_esatti: coherentResults,
    value_bets: filteredValueBets,
    mercati_combo: coherentCombos
  }
}

// Generate fallback H2H data when GPT-4 doesn't provide it
function generateFallbackH2H(matchData: MatchData) {
  const h2h = matchData.h2h || {}
  const matches = Array.isArray(h2h.matches) ? h2h.matches : []
  
  return {
    totale_partite: h2h.total || 0,
    vittorie_casa: h2h.homeWins || 0,
    pareggi: h2h.draws || 0,
    vittorie_ospite: h2h.awayWins || 0,
    media_gol: h2h.avgGoals || 0,
    ultimi_5: matches.slice(0, 5).map((match: any) => ({
      data: match.date?.split('T')[0] || '2024-01-01',
      risultato: `${match.homeGoals || 0}-${match.awayGoals || 0}`,
      casa: match.homeTeam || (matchData.homeTeam?.name || 'Casa'),
      ospite: match.awayTeam || (matchData.awayTeam?.name || 'Ospite')
    })),
    trend: h2h.trend || 'Primo confronto recente tra le squadre'
  }
}

// Generate fallback team form data
function generateFallbackTeamForm(matchData: MatchData) {
  const homeForm = matchData.homeTeamData?.form || { formArray: ['N','N','N','N','N'], matches: [], wins: 0, draws: 0, losses: 0, formString: 'NNNNN' }
  const awayForm = matchData.awayTeamData?.form || { formArray: ['N','N','N','N','N'], matches: [], wins: 0, draws: 0, losses: 0, formString: 'NNNNN' }
  
  const homeMatches = Array.isArray(homeForm.matches) ? homeForm.matches : []
  const awayMatches = Array.isArray(awayForm.matches) ? awayForm.matches : []
  
  console.log('🔍 Team form debug:')
  console.log(`  Home matches count: ${homeMatches.length}`)
  console.log(`  Away matches count: ${awayMatches.length}`)
  if (homeMatches.length > 0) {
    console.log('  Home matches sample:', homeMatches.slice(0, 2))
  }
  if (awayMatches.length > 0) {
    console.log('  Away matches sample:', awayMatches.slice(0, 2))
  }
  
  return {
    casa: {
      nome: matchData.homeTeam?.name || 'Casa',
      ultime_5: homeForm.formArray || ['N','N','N','N','N'],
      ultime_5_dettaglio: homeMatches.slice(0,5).map((match: any) => ({
        avversario: match.opponent || 'N/A',
        risultato: match.result || '0-0',
        casa_trasferta: match.isHome ? 'C' : 'T',
        outcome: match.outcome || 'N'
      })),
      forma_stringa: homeForm.formString || 'NNNNN',
      rendimento: `Forma recente: ${homeForm.wins || 0}V-${homeForm.draws || 0}N-${homeForm.losses || 0}P`
    },
    ospite: {
      nome: matchData.awayTeam?.name || 'Ospite',
      ultime_5: awayForm.formArray || ['N','N','N','N','N'],
      ultime_5_dettaglio: awayMatches.slice(0,5).map((match: any) => ({
        avversario: match.opponent || 'N/A',
        risultato: match.result || '0-0',
        casa_trasferta: match.isHome ? 'C' : 'T',
        outcome: match.outcome || 'N'
      })),
      forma_stringa: awayForm.formString || 'NNNNN',
      rendimento: `Forma recente: ${awayForm.wins || 0}V-${awayForm.draws || 0}N-${awayForm.losses || 0}P`
    }
  }
}

// Generate fallback standings data
function generateFallbackStandings(matchData: MatchData) {
  return {
    casa: matchData.homeTeamData?.standing ? {
      posizione: matchData.homeTeamData.standing.position,
      punti: matchData.homeTeamData.standing.points,
      partite: matchData.homeTeamData.standing.played,
      vittorie: matchData.homeTeamData.standing.won,
      pareggi: matchData.homeTeamData.standing.draw,
      sconfitte: matchData.homeTeamData.standing.lost,
      gol_fatti: matchData.homeTeamData.standing.goalsFor,
      gol_subiti: matchData.homeTeamData.standing.goalsAgainst,
      differenza_reti: matchData.homeTeamData.standing.goalDiff
    } : null,
    ospite: matchData.awayTeamData?.standing ? {
      posizione: matchData.awayTeamData.standing.position,
      punti: matchData.awayTeamData.standing.points,
      partite: matchData.awayTeamData.standing.played,
      vittorie: matchData.awayTeamData.standing.won,
      pareggi: matchData.awayTeamData.standing.draw,
      sconfitte: matchData.awayTeamData.standing.lost,
      gol_fatti: matchData.awayTeamData.standing.goalsFor,
      gol_subiti: matchData.awayTeamData.standing.goalsAgainst,
      differenza_reti: matchData.awayTeamData.standing.goalDiff
    } : null
  }
}

// Generate intelligent exact scores based on real data
function generateIntelligentExactScores(matchData: MatchData) {
  const h2h = matchData.h2h
  const homeStats = matchData.teamStats?.home
  const awayStats = matchData.teamStats?.away
  const homeForm = matchData.homeTeamData?.form
  const awayForm = matchData.awayTeamData?.form
  
  const avgGoals = h2h?.avgGoals || 2.5
  const predictions = matchData.predictions
  
  console.log('🤖 Generating intelligent exact scores from real data')
  console.log(`   H2H avg goals: ${avgGoals}`)
  console.log(`   Recent H2H results: ${h2h?.matches?.slice(0,3).map((m:any) => `${m.homeGoals}-${m.awayGoals}`).join(', ') || 'none'}`)
  
  let scores = []
  
  // Analyze H2H patterns first
  if (h2h?.matches && Array.isArray(h2h.matches) && h2h.matches.length > 0) {
    const recentResults = h2h.matches.slice(0, 3).map((match: any) => ({
      home: match.homeGoals || 0,
      away: match.awayGoals || 0,
      result: `${match.homeGoals || 0}-${match.awayGoals || 0}`
    }))
    
    // Extract common score patterns from H2H
    const scorePatterns: Record<string, number> = {}
    h2h.matches.forEach((match: any) => {
      const score = `${match.homeGoals || 0}-${match.awayGoals || 0}`
      scorePatterns[score] = (scorePatterns[score] || 0) + 1
    })
    
    // Sort by frequency and take top patterns
    const sortedPatterns = Object.entries(scorePatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
    
    if (sortedPatterns.length > 0) {
      sortedPatterns.forEach(([score, frequency], index) => {
        scores.push({
          risultato: score,
          probabilita: Math.max(8, 20 - index * 3),
          top: index + 1,
          reasoning: `Risultato visto ${frequency} volte negli ultimi ${h2h.total} H2H`
        })
      })
    }
  }
  
  // If no H2H data or need more scores, use statistical approach
  if (scores.length < 3) {
    const homeWinProb = predictions?.winner?.home || 33
    const drawProb = predictions?.winner?.draw || 33
    const awayWinProb = predictions?.winner?.away || 34
    
    if (avgGoals < 2.0) {
      // Low-scoring match expectation
      if (homeWinProb > awayWinProb) {
        scores.push({ risultato: '1-0', probabilita: 16, top: 1, reasoning: 'Vittoria casalinga di misura' })
        scores.push({ risultato: '2-0', probabilita: 12, top: 2, reasoning: 'Vittoria casalinga netta' })
      } else if (awayWinProb > homeWinProb) {
        scores.push({ risultato: '0-1', probabilita: 16, top: 1, reasoning: 'Vittoria esterna di misura' })
        scores.push({ risultato: '0-2', probabilita: 12, top: 2, reasoning: 'Vittoria esterna netta' })
      } else {
        scores.push({ risultato: '0-0', probabilita: 14, top: 1, reasoning: 'Partita chiusa, pochi goal attesi' })
        scores.push({ risultato: '1-1', probabilita: 16, top: 2, reasoning: 'Pareggio più probabile' })
      }
    } else if (avgGoals > 3.0) {
      // High-scoring match expectation
      scores.push({ risultato: '2-1', probabilita: 14, top: 1, reasoning: 'Match con molti goal attesi' })
      scores.push({ risultato: '2-2', probabilita: 12, top: 2, reasoning: 'Pareggio spettacolare' })
      scores.push({ risultato: '3-2', probabilita: 10, top: 3, reasoning: 'Risultato spettacolare' })
    } else {
      // Medium-scoring match
      scores.push({ risultato: '1-1', probabilita: 16, top: 1, reasoning: 'Pareggio equilibrato' })
      scores.push({ risultato: '2-1', probabilita: 12, top: 2, reasoning: 'Vittoria di misura' })
      scores.push({ risultato: '1-0', probabilita: 14, top: 3, reasoning: 'Risultato classico' })
    }
  }
  
  return scores.slice(0, 3)
}

// Calcola quota combo
function calcolaQuotaCombo(quota1: number, quota2: number): number {
  return parseFloat((quota1 * quota2).toFixed(2))
}

// Generate smart betting plan with real odds
function generateSmartBettingPlan(matchData: MatchData): any {
  const odds = matchData.odds || {}
  const predictions = matchData.predictions || {}
  
  // Extract real odds
  const oddsHome = odds.winner?.home || odds.home || 0
  const oddsDraw = odds.winner?.draw || odds.draw || 0
  const oddsAway = odds.winner?.away || odds.away || 0
  const oddsOver = odds.goals?.over_2_5 || odds.over_2_5 || 1.85
  const oddsUnder = odds.goals?.under_2_5 || odds.under_2_5 || 1.85
  const odds1X = odds.doubleChance?.x1 || 0
  const oddsX2 = odds.doubleChance?.x2 || 0
  
  // Get probabilities
  const homeProb = predictions.winner?.home || 33
  const drawProb = predictions.winner?.draw || 33
  const awayProb = predictions.winner?.away || 34
  
  // Determine favorite and best single bet
  const favorite = homeProb >= drawProb && homeProb >= awayProb ? '1' :
                  awayProb >= drawProb && awayProb >= homeProb ? '2' : 'X'
  
  const favoriteOdds = favorite === '1' ? oddsHome : favorite === '2' ? oddsAway : oddsDraw
  
  // If favorite odds too low, create combo or skip
  if (favoriteOdds < 1.40 && favoriteOdds > 0) {
    // Try double chance first
    const dcOdds = favorite === '1' ? odds1X : favorite === '2' ? oddsX2 : 0
    
    if (dcOdds >= 1.40) {
      return {
        tipo: 'DOPPIA CHANCE',
        selezione: favorite === '1' ? '1X' : favorite === '2' ? 'X2' : '12',
        quota_reale: dcOdds,
        probabilita: favorite === '1' ? homeProb + drawProb : favorite === '2' ? drawProb + awayProb : homeProb + awayProb,
        stake_consigliato: '15-20% del budget giornaliero',
        reasoning: `Il favorito ha quota ${favoriteOdds.toFixed(2)} (troppo bassa). La doppia chance offre maggior valore a ${dcOdds.toFixed(2)}.`,
        rischio: 'BASSO',
        alternativa: 'Considera anche mercati Over/Under se le quote sono migliori'
      }
    }
    
    // Try combo with Over/Under
    const comboUnder = calcolaQuotaCombo(favoriteOdds, oddsUnder)
    const comboOver = calcolaQuotaCombo(favoriteOdds, oddsOver)
    
    if (comboUnder >= 1.40 || comboOver >= 1.40) {
      const useUnder = comboUnder > comboOver
      return {
        tipo: 'COMBO',
        selezione: `${favorite} + ${useUnder ? 'Under 2.5' : 'Over 2.5'}`,
        quota_reale: useUnder ? comboUnder : comboOver,
        probabilita: Math.round((favoriteOdds === oddsHome ? homeProb : favoriteOdds === oddsAway ? awayProb : drawProb) * 0.6),
        stake_consigliato: '10-15% del budget giornaliero',
        reasoning: `Quota ${favorite} troppo bassa (${favoriteOdds.toFixed(2)}). Combo con ${useUnder ? 'Under' : 'Over'} 2.5 porta la quota a ${(useUnder ? comboUnder : comboOver).toFixed(2)}.`,
        rischio: 'MEDIO',
        alternativa: dcOdds > 0 ? `In alternativa: doppia chance ${favorite === '1' ? '1X' : 'X2'} @${dcOdds.toFixed(2)}` : undefined
      }
    }
    
    // If nothing works, skip
    return {
      tipo: 'SKIP',
      selezione: 'NESSUNA',
      reasoning: `Partita senza valore. Il favorito (${favorite}) quota ${favoriteOdds.toFixed(2)}, combo non superano 1.40.`,
      suggerimento: 'Vai su /tipsterai per proposte più interessanti oggi'
    }
  }
  
  // Good odds for single bet
  if (favoriteOdds >= 1.40) {
    return {
      tipo: 'SINGOLA',
      selezione: favorite,
      quota_reale: favoriteOdds,
      probabilita: favorite === '1' ? homeProb : favorite === '2' ? awayProb : drawProb,
      stake_consigliato: '15-20% del budget giornaliero',
      reasoning: `${favorite === '1' ? matchData.homeTeam.name : favorite === '2' ? matchData.awayTeam.name : 'Il pareggio'} con quota ${favoriteOdds.toFixed(2)} offre buon valore.`,
      rischio: favoriteOdds < 2 ? 'BASSO' : favoriteOdds < 3 ? 'MEDIO' : 'ALTO',
      alternativa: oddsUnder > 2 ? `Alternativa interessante: Under 2.5 @${oddsUnder.toFixed(2)}` : undefined
    }
  }
  
  // Default fallback
  return {
    tipo: 'DOPPIA CHANCE',
    selezione: homeProb > awayProb ? '1X' : 'X2',
    quota_reale: homeProb > awayProb ? odds1X : oddsX2,
    probabilita: homeProb > awayProb ? homeProb + drawProb : drawProb + awayProb,
    stake_consigliato: '15-20% del budget giornaliero',
    reasoning: 'Mercato bilanciato, doppia chance per maggior sicurezza.',
    rischio: 'BASSO'
  }
}

// Generate fallback combo markets COHERENT with Over/Under
function generateFallbackComboMarkets(matchData: MatchData) {
  const predictions = matchData.predictions
  const homeProb = predictions?.winner?.home || 33
  const drawProb = predictions?.winner?.draw || 33
  const awayProb = predictions?.winner?.away || 34
  
  const direction = homeProb >= drawProb && homeProb >= awayProb ? 'CASA' : 
                   awayProb >= drawProb && awayProb >= homeProb ? 'OSPITE' : 'EQUILIBRIO'
  
  const homeTeamName = matchData.homeTeam?.name || 'Casa'
  const awayTeamName = matchData.awayTeam?.name || 'Ospite'
  
  // REAL ANALYSIS for Over/Under
  const h2hMatches = matchData.h2h?.matches || []
  const h2hAvgGoals = matchData.h2h?.avgGoals || 2.5
  const overUnderAnalysis = analyzeOverUnder(h2hMatches, h2hAvgGoals)
  const overUnderSuffix = overUnderAnalysis.decision
  
  if (direction === 'CASA') {
    return [
      {
        tipo: `1 + ${overUnderSuffix}`,
        nome: `${homeTeamName} Vince + ${overUnderSuffix}`,
        confidence: 'ALTA' as const,
        reasoning: `${homeProb}% per la vittoria casalinga. ${overUnderAnalysis.reasoning}`
      },
      {
        tipo: overUnderSuffix.includes('Under') ? '1X + Under 3.5' : '1X + Over 1.5',
        nome: overUnderSuffix.includes('Under') ? 'Casa Non Perde + Max 3 Gol' : 'Casa Non Perde + Almeno 2 Gol',
        confidence: 'ALTISSIMA' as const,
        reasoning: `Copertura coerente con analisi ${overUnderSuffix}`
      },
      {
        tipo: overUnderSuffix.includes('Under') ? 'Multigol 1-2' : 'Multigol 2-4',
        nome: overUnderSuffix.includes('Under') ? 'Da 1 a 2 Gol Totali' : 'Da 2 a 4 Gol Totali',
        confidence: 'MEDIA' as const,
        reasoning: `Range coerente con media H2H di ${h2hAvgGoals} gol`
      }
    ]
  } else if (direction === 'OSPITE') {
    return [
      {
        tipo: `2 + ${overUnderSuffix}`,
        nome: `${awayTeamName} Vince + ${overUnderSuffix}`,
        confidence: 'ALTA' as const,
        reasoning: `${awayProb}% per la vittoria esterna. ${overUnderAnalysis.reasoning}`
      },
      {
        tipo: overUnderSuffix.includes('Under') ? 'X2 + Under 3.5' : 'X2 + Over 1.5',
        nome: overUnderSuffix.includes('Under') ? 'Ospite Non Perde + Max 3 Gol' : 'Ospite Non Perde + Almeno 2 Gol',
        confidence: 'ALTISSIMA' as const,
        reasoning: `Copertura coerente con analisi ${overUnderSuffix}`
      },
      {
        tipo: overUnderSuffix.includes('Under') ? 'Multigol 0-2' : 'Multigol 2-3',
        nome: overUnderSuffix.includes('Under') ? 'Da 0 a 2 Gol Totali' : 'Da 2 a 3 Gol Totali',
        confidence: 'ALTA' as const,
        reasoning: `Range tipico con media H2H ${h2hAvgGoals}`
      }
    ]
  } else {
    return [
      {
        tipo: `X + ${overUnderSuffix}`,
        nome: `Pareggio + ${overUnderSuffix}`,
        confidence: 'MEDIA' as const,
        reasoning: `Partita equilibrata. ${overUnderAnalysis.reasoning}`
      },
      {
        tipo: overUnderSuffix.includes('Under') ? 'X2 + Under 2.5' : '1X + Over 1.5',
        nome: overUnderSuffix.includes('Under') ? 'Non Vince Casa + Max 2 Gol' : 'Non Vince Ospite + Almeno 2 Gol',
        confidence: 'ALTA' as const,
        reasoning: `Copertura per equilibrio con ${overUnderSuffix}`
      },
      {
        tipo: overUnderSuffix.includes('Under') ? 'Multigol 0-1' : 'Multigol 1-3',
        nome: overUnderSuffix.includes('Under') ? 'Max 1 Gol' : 'Da 1 a 3 Gol Totali',
        confidence: 'ALTA' as const,
        reasoning: `Equilibri tipicamente ${overUnderSuffix.includes('Under') ? 'chiusi' : 'aperti'}`
      }
    ]
  }
}