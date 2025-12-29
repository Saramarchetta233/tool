import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateDailyTipsSimple() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'public' }, auth: { persistSession: false } }
  )

  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)
  
  console.log(`🎯 TipsterAI Simple: Generazione per ${today}`)
  
  // 1. Carica partite con TUTTE le quote
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('match_date', today)
    .gt('match_time', currentTime)
    .order('match_time', { ascending: true })
  
  if (error || !matches || matches.length < 5) {
    console.log('⚠️ Poche partite disponibili')
    return { success: false, message: 'Servono almeno 5 partite' }
  }
  
  console.log(`📊 ${matches.length} partite trovate`)
  
  // 2. Prepara dati per GPT-4 (con quote REALI già dentro)
  const matchesForGPT = matches.map(m => ({
    fixture_id: m.fixture_id,
    partita: `${m.home_team?.name || 'Casa'} vs ${m.away_team?.name || 'Ospite'}`,
    campionato: m.league_name,
    orario: m.match_time,
    is_serie_a: m.league_name?.includes('Serie A'),
    pronostico_api: m.predictions?.advice || '',
    quote: {
      '1': m.odds?.winner?.home || 2.00,
      'X': m.odds?.winner?.draw || 3.20,
      '2': m.odds?.winner?.away || 3.50,
      '1X': calcola1X(m.odds),
      'X2': calcolaX2(m.odds),
      'Over 2.5': m.odds?.goals?.over_2_5 || 1.80,
      'Under 2.5': m.odds?.goals?.under_2_5 || 1.90,
      'Over 1.5': m.odds?.goals?.over_1_5 || 1.25,
      'Under 1.5': m.odds?.goals?.under_1_5 || 4.00,
      'Over 3.5': m.odds?.goals?.over_3_5 || 3.50,
      'Under 3.5': m.odds?.goals?.under_3_5 || 1.30,
      'Gol': m.odds?.goals?.btts || 1.75,
      'NoGol': m.odds?.goals?.nobtts || 1.95
    }
  }))
  
  // 3. GPT-4 genera TUTTO
  const prompt = `Sei TipsterAI. Genera le 5 proposte del giorno analizzando le partite.

## PARTITE DISPONIBILI (con quote REALI)
${JSON.stringify(matchesForGPT, null, 2)}

## COSA DEVI GENERARE

1. **SINGOLA** - 1 partita, quota MINIMA 1.60 (no max)
2. **DOPPIA** - 2 partite, scegli con confidence ~70%
3. **TRIPLA** - 3 partite, scegli con confidence ~70%  
4. **MISTA** - 6-7 partite variegate
5. **BOMBA** - 3 risultati esatti

## REGOLE FONDAMENTALI

1. **PRIORITÀ SERIE A**: Se c'è Serie A, preferiscila per la SINGOLA
2. **USA LE QUOTE REALI**: Guarda il campo "quote" di ogni partita, NON inventare!
3. **ANALIZZA INTELLIGENTEMENTE**: Usa statistiche, forma, casa/trasferta per decidere
4. **VARIETÀ MISTA**: Mescola tipi diversi: 1, 2, 1X, X2, Over 2.5, Under 2.5, Gol, NoGol
5. **COERENZA**: Le motivazioni devono essere COERENTI con la selezione

## QUOTE RISULTATI ESATTI (per la BOMBA)
1-0: ~6.50, 0-1: ~7.50, 2-0: ~8.00, 0-2: ~9.00
2-1: ~8.50, 1-2: ~9.50, 1-1: ~6.00, 0-0: ~9.00
3-0: ~13.00, 0-3: ~15.00, 3-1: ~15.00, 1-3: ~17.00

## OUTPUT JSON RICHIESTO

{
  "singola": {
    "fixture_id": 123456,
    "partita": "AS Roma vs Genoa", 
    "campionato": "Serie A",
    "orario": "20:45",
    "selezione": "1",
    "quota": 1.62,
    "confidence": 80,
    "motivazione": "La Roma in casa è una sentenza, il Genoa non vince in trasferta da ottobre"
  },
  "doppia": {
    "partite": [
      {
        "fixture_id": 123456,
        "partita": "Milan vs Monza",
        "campionato": "Serie A",
        "orario": "18:00",
        "selezione": "1X",
        "quota": 1.25,
        "confidence": 85,
        "motivazione": "Milan superiore, difficilmente perde in casa"
      },
      {
        "fixture_id": 789012,
        "partita": "Norwich vs Watford",
        "campionato": "Championship",
        "orario": "20:45",
        "selezione": "Over 2.5",
        "quota": 1.80,
        "confidence": 70,
        "motivazione": "Entrambe segnano tanto, difese ballerine"
      }
    ],
    "quota_totale": 2.25,
    "confidence_media": 77,
    "strategia": "Due selezioni solide per raddoppio sicuro"
  },
  "tripla": {
    "partite": [...],
    "quota_totale": 3.85,
    "confidence_media": 72,
    "strategia": "Tre match equilibrati per moltiplicatore 3x"
  },
  "mista": {
    "partite": [...], 
    "quota_totale": 15.8,
    "confidence_media": 45,
    "strategia": "Mix variato per tentare il colpaccio"
  },
  "bomba": {
    "partite": [
      {
        "fixture_id": 123456,
        "partita": "AS Roma vs Genoa", 
        "campionato": "Serie A",
        "orario": "20:45",
        "selezione": "2-0",
        "quota": 8.00,
        "confidence": 15,
        "motivazione": "Roma vince con clean sheet classico"
      },
      ...
    ],
    "quota_totale": 480,
    "confidence_media": 10,
    "strategia": "Tre risultati esatti per quota stratosferica"
  }
}

IMPORTANTE: 
- Usa ESATTAMENTE le quote dal campo "quote" di ogni partita
- Calcola quota_totale moltiplicando le singole quote  
- Motivazioni ITALIANE, umane, non robotiche
- Per doppia/tripla punta a confidence ~70%`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
    
    const tips = JSON.parse(response.choices[0].message.content || '{}')
    console.log('✅ GPT-4 ha generato i tips')
    
    // 4. UNICO intervento: verifica quote (solo per sicurezza)
    const correctedTips = verificaQuote(tips, matchesForGPT)
    
    // 5. Salva nelle 5 tabelle separate
    await salvaTips(correctedTips, today, supabase, matchesForGPT)
    
    return { success: true, tips: correctedTips }
    
  } catch (error) {
    console.error('❌ Errore generazione:', error)
    return { success: false, message: 'Errore generazione tips' }
  }
}

// Calcolo quote doppie chance REALI
function calcola1X(odds: any): number {
  if (!odds?.winner?.home || !odds?.winner?.draw) return 1.20
  return Math.round((1 / (1/odds.winner.home + 1/odds.winner.draw)) * 100) / 100
}

function calcolaX2(odds: any): number {
  if (!odds?.winner?.draw || !odds?.winner?.away) return 1.25  
  return Math.round((1 / (1/odds.winner.draw + 1/odds.winner.away)) * 100) / 100
}

// Verifica e corregge quote se GPT ha sbagliato (solo backup)
function verificaQuote(tips: any, matchesData: any[]): any {
  
  const getQuotaReale = (fixtureId: number, selezione: string): number => {
    const match = matchesData.find(m => m.fixture_id === fixtureId)
    if (!match) return 2.00
    
    // Gestisci risultati esatti per la bomba
    if (selezione.includes('-')) {
      const exactOdds: Record<string, number> = {
        '1-0': 6.50, '0-1': 7.50, '2-0': 8.00, '0-2': 9.00,
        '2-1': 8.50, '1-2': 9.50, '1-1': 6.00, '0-0': 9.00,
        '3-0': 13.00, '0-3': 15.00, '3-1': 15.00, '1-3': 17.00,
        '3-2': 20.00, '2-3': 22.00, '4-0': 25.00, '0-4': 30.00
      }
      return exactOdds[selezione] || 10.00
    }
    
    return match.quote[selezione] || 2.00
  }
  
  // Verifica singola
  if (tips.singola) {
    const quotaReale = getQuotaReale(tips.singola.fixture_id, tips.singola.selezione)
    if (Math.abs(tips.singola.quota - quotaReale) > 0.1) {
      console.log(`📊 Correzione quota singola: ${tips.singola.quota} → ${quotaReale}`)
      tips.singola.quota = quotaReale
    }
  }
  
  // Verifica doppia
  if (tips.doppia?.partite) {
    let totale = 1
    for (const p of tips.doppia.partite) {
      const quotaReale = getQuotaReale(p.fixture_id, p.selezione)
      if (Math.abs(p.quota - quotaReale) > 0.1) {
        console.log(`📊 Correzione quota doppia: ${p.quota} → ${quotaReale}`)
        p.quota = quotaReale
      }
      totale *= p.quota
    }
    tips.doppia.quota_totale = Math.round(totale * 100) / 100
  }
  
  // Verifica tripla
  if (tips.tripla?.partite) {
    let totale = 1
    for (const p of tips.tripla.partite) {
      const quotaReale = getQuotaReale(p.fixture_id, p.selezione)
      if (Math.abs(p.quota - quotaReale) > 0.1) {
        console.log(`📊 Correzione quota tripla: ${p.quota} → ${quotaReale}`)
        p.quota = quotaReale
      }
      totale *= p.quota
    }
    tips.tripla.quota_totale = Math.round(totale * 100) / 100
  }
  
  // Verifica mista
  if (tips.mista?.partite) {
    let totale = 1
    for (const p of tips.mista.partite) {
      const quotaReale = getQuotaReale(p.fixture_id, p.selezione)
      if (Math.abs(p.quota - quotaReale) > 0.1) {
        console.log(`📊 Correzione quota mista: ${p.quota} → ${quotaReale}`)
        p.quota = quotaReale
      }
      totale *= p.quota
    }
    tips.mista.quota_totale = Math.round(totale * 100) / 100
  }
  
  // Bomba usa quote stimate, non correggere
  if (tips.bomba?.partite) {
    let totale = 1
    for (const p of tips.bomba.partite) {
      totale *= p.quota
    }
    tips.bomba.quota_totale = Math.round(totale * 100) / 100
  }
  
  return tips
}

// Salva nelle 5 tabelle separate
async function salvaTips(tips: any, date: string, supabase: any, matchesForGPT: any[]) {
  console.log('💾 Salvando tips nelle 5 tabelle...')
  
  try {
    // Prima cancella i vecchi
    await Promise.all([
      supabase.from('tips_singola').delete().eq('valid_until', date),
      supabase.from('tips_doppia').delete().eq('valid_until', date),
      supabase.from('tips_tripla').delete().eq('valid_until', date),
      supabase.from('tips_mista').delete().eq('valid_until', date),
      supabase.from('tips_bomba').delete().eq('valid_until', date)
    ])
    
    // Poi salva i nuovi
    const promises = []
    
    // SINGOLA
    if (tips.singola) {
      promises.push(
        supabase.from('tips_singola').insert({
          fixture_id: tips.singola.fixture_id,
          home_team: tips.singola.partita.split(' vs ')[0],
          away_team: tips.singola.partita.split(' vs ')[1],
          league: tips.singola.campionato,
          match_time: tips.singola.orario,
          prediction: tips.singola.selezione,
          prediction_label: buildLabel(tips.singola.selezione, tips.singola.partita),
          odds: tips.singola.quota,
          confidence: tips.singola.confidence,
          reasoning: tips.singola.motivazione,
          valid_until: date
        })
      )
    }
    
    // DOPPIA
    if (tips.doppia) {
      promises.push(
        supabase.from('tips_doppia').insert({
          matches: tips.doppia.partite.map((p: any) => ({
            fixture_id: p.fixture_id,
            home_team: p.partita.split(' vs ')[0],
            away_team: p.partita.split(' vs ')[1],
            league: p.campionato,
            time: p.orario,
            prediction: p.selezione,
            prediction_label: buildLabel(p.selezione, p.partita),
            odds: p.quota,
            confidence: p.confidence,
            reasoning: p.motivazione
          })),
          total_odds: tips.doppia.quota_totale,
          confidence: tips.doppia.confidence_media,
          strategy_reasoning: tips.doppia.strategia,
          valid_until: date
        })
      )
    }
    
    // TRIPLA
    if (tips.tripla) {
      promises.push(
        supabase.from('tips_tripla').insert({
          matches: tips.tripla.partite.map((p: any) => ({
            fixture_id: p.fixture_id,
            home_team: p.partita.split(' vs ')[0],
            away_team: p.partita.split(' vs ')[1],
            league: p.campionato,
            time: p.orario,
            prediction: p.selezione,
            prediction_label: buildLabel(p.selezione, p.partita),
            odds: p.quota,
            confidence: p.confidence,
            reasoning: p.motivazione
          })),
          total_odds: tips.tripla.quota_totale,
          confidence: tips.tripla.confidence_media,
          strategy_reasoning: tips.tripla.strategia,
          valid_until: date
        })
      )
    }
    
    // MISTA
    if (tips.mista) {
      promises.push(
        supabase.from('tips_mista').insert({
          matches: tips.mista.partite.map((p: any) => ({
            fixture_id: p.fixture_id,
            home_team: p.partita.split(' vs ')[0],
            away_team: p.partita.split(' vs ')[1],
            league: p.campionato,
            time: p.orario,
            prediction: p.selezione,
            prediction_label: buildLabel(p.selezione, p.partita),
            odds: p.quota,
            confidence: p.confidence,
            reasoning: p.motivazione
          })),
          total_odds: tips.mista.quota_totale,
          confidence: tips.mista.confidence_media,
          strategy_reasoning: tips.mista.strategia,
          valid_until: date
        })
      )
    }
    
    // BOMBA
    if (tips.bomba) {
      promises.push(
        supabase.from('tips_bomba').insert({
          matches: tips.bomba.partite.map((p: any) => ({
            fixture_id: p.fixture_id,
            home_team: p.partita.split(' vs ')[0],
            away_team: p.partita.split(' vs ')[1],
            league: p.campionato,
            time: p.orario,
            prediction: p.selezione,
            prediction_label: `RISULTATO ESATTO ${p.selezione}`,
            odds: p.quota,
            confidence: p.confidence,
            reasoning: p.motivazione
          })),
          tip_type: 'risultati_esatti',
          total_odds: tips.bomba.quota_totale,
          confidence: tips.bomba.confidence_media,
          strategy_reasoning: tips.bomba.strategia,
          valid_until: date
        })
      )
    }
    
    await Promise.all(promises)
    console.log('✅ Tutti i tips salvati con successo')
    
  } catch (error) {
    console.error('❌ Errore salvataggio:', error)
  }
}

// Helper per creare label
function buildLabel(prediction: string, partita: string): string {
  const [home, away] = partita.split(' vs ')
  
  switch(prediction) {
    case '1': return `${home.toUpperCase()} VINCE`
    case 'X': return 'PAREGGIO' 
    case '2': return `${away.toUpperCase()} VINCE`
    case '1X': return `${home.toUpperCase()} NON PERDE`
    case 'X2': return `${away.toUpperCase()} NON PERDE`
    case '12': return 'VITTORIA (NO PAREGGIO)'
    case 'Over 1.5': return 'ALMENO 2 GOL'
    case 'Under 1.5': return 'MASSIMO 1 GOL'
    case 'Over 2.5': return 'ALMENO 3 GOL'
    case 'Under 2.5': return 'MASSIMO 2 GOL' 
    case 'Over 3.5': return 'ALMENO 4 GOL'
    case 'Under 3.5': return 'MASSIMO 3 GOL'
    case 'Gol': case 'BTTS': return 'ENTRAMBE SEGNANO'
    case 'NoGol': case 'No BTTS': return 'NON ENTRAMBE SEGNANO'
    default: 
      if (prediction.includes('-')) return `RISULTATO ESATTO ${prediction}`
      return prediction.toUpperCase()
  }
}

// Export per leggere i tips
export async function getTodayTipsSimple() {
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