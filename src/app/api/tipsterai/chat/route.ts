import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { message, conversationHistory } = await request.json()
  
  // 1. Carica i tips di oggi dalle tabelle separate
  const today = new Date().toISOString().split('T')[0]
  
  const [singola, doppia, tripla, mista, bomba] = await Promise.all([
    supabaseAdmin.from('tips_singola').select('*').eq('valid_until', today).single(),
    supabaseAdmin.from('tips_doppia').select('*').eq('valid_until', today).single(),
    supabaseAdmin.from('tips_tripla').select('*').eq('valid_until', today).single(),
    supabaseAdmin.from('tips_mista').select('*').eq('valid_until', today).single(),
    supabaseAdmin.from('tips_bomba').select('*').eq('valid_until', today).single()
  ])
  
  // 2. Carica le partite per contesto aggiuntivo
  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('match_date', today)
    .order('match_time', { ascending: true })

  // 3. Costruisci informazioni complete sui tips
  const availableTips = []
  
  if (singola.data) {
    availableTips.push({
      tipo: 'SINGOLA',
      partita: `${singola.data.home_team} vs ${singola.data.away_team}`,
      lega: singola.data.league,
      ora: singola.data.match_time,
      predizione: singola.data.prediction,
      dettagli: singola.data.prediction_label,
      quota: singola.data.odds,
      confidence: singola.data.confidence,
      motivazione: singola.data.reasoning
    })
  }
  
  if (doppia.data) {
    availableTips.push({
      tipo: 'DOPPIA',
      partite: doppia.data.matches?.map((m: any) => ({
        partita: `${m.home_team} vs ${m.away_team}`,
        lega: m.league,
        predizione: m.prediction_label || m.prediction,
        quota: m.odds,
        motivazione: m.reasoning
      })),
      quota_totale: doppia.data.total_odds,
      confidence: doppia.data.confidence,
      strategia: doppia.data.strategy_reasoning
    })
  }
  
  if (tripla.data) {
    availableTips.push({
      tipo: 'TRIPLA',
      partite: tripla.data.matches?.map((m: any) => ({
        partita: `${m.home_team} vs ${m.away_team}`,
        lega: m.league,
        predizione: m.prediction_label || m.prediction,
        quota: m.odds,
        motivazione: m.reasoning
      })),
      quota_totale: tripla.data.total_odds,
      confidence: tripla.data.confidence,
      strategia: tripla.data.strategy_reasoning
    })
  }
  
  if (mista.data) {
    availableTips.push({
      tipo: 'MISTA',
      partite: mista.data.matches?.map((m: any) => ({
        partita: `${m.home_team} vs ${m.away_team}`,
        lega: m.league,
        predizione: m.prediction_label || m.prediction,
        quota: m.odds
      })),
      quota_totale: mista.data.total_odds,
      strategia: mista.data.strategy_reasoning
    })
  }
  
  if (bomba.data) {
    availableTips.push({
      tipo: 'BOMBA',
      partite: bomba.data.matches?.map((m: any) => ({
        partita: `${m.home_team} vs ${m.away_team}`,
        lega: m.league,
        predizione: m.prediction_label || m.prediction,
        quota: m.odds,
        motivazione: m.reasoning
      })),
      quota_totale: bomba.data.total_odds,
      strategia: bomba.data.strategy_reasoning
    })
  }

  const systemPrompt = `Sei TipsterAI, un esperto di scommesse calcistiche italiano molto competente e amichevole.

## LE MIE PROPOSTE DI OGGI
${JSON.stringify(availableTips, null, 2)}

## PARTITE DISPONIBILI OGGI
${JSON.stringify(matches?.slice(0, 15).map(m => ({
  partita: `${m.home_team?.name} vs ${m.away_team?.name}`,
  lega: m.league_name,
  ora: m.match_time,
  quote: {
    casa: m.odds?.winner?.home,
    pareggio: m.odds?.winner?.draw,
    ospite: m.odds?.winner?.away,
    over25: m.odds?.goals?.over_2_5,
    under25: m.odds?.goals?.under_2_5
  },
  statistiche: {
    casa_perc: m.predictions?.predictions?.home,
    pareggio_perc: m.predictions?.predictions?.draw,
    ospite_perc: m.predictions?.predictions?.away,
    consiglio: m.predictions?.predictions?.advice
  }
})), null, 2)}

## COME RISPONDERE

### SE CHIEDONO DELLE MIE PROPOSTE:
- Spiega SEMPRE il ragionamento dietro ogni scelta usando le motivazioni fornite
- Menziona le quote reali e perché sono interessanti
- Se chiedono "perché hai scelto X?" → usa le motivazioni specifiche di quella partita
- Spiega la differenza tra singola (sicurezza), doppia (equilibrio), tripla (rischio moderato), mista (alto rischio), bomba (pura fortuna)

### SE CHIEDONO CONSIGLI GENERICI:
- Analizza le partite disponibili usando quote e statistiche
- Suggerisci alternative alle mie proposte se richiesto
- Considera sempre i campionati: Serie A ha SEMPRE priorità, poi Premier, Liga, etc.
- Proponi scommesse multiple (1X, X2, Over/Under combo)

### SE CHIEDONO CAMBI O ALTERNATIVE:
- Puoi suggerire modifiche ragionate
- Analizza partite non incluse nelle mie proposte
- Proponi quote diverse (es. se ho messo 1, puoi suggerire 1X per sicurezza)

### REGOLE SEMPRE:
- Rispondi SEMPRE in italiano colloquiale
- Stile: amico competente al bar ("guarda", "secondo me", "ti dico")
- NEVER promettere vincite sicure ("potrebbe", "secondo me", "rischio c'è sempre")
- Ricorda: "Gioca responsabile, mai più di quello che puoi permetterti"
- Se non hai dati sufficienti per rispondere, dillo chiaramente

### ESEMPI DI RISPOSTE CORRETTE:
❌ "La Roma ha il 75% di probabilità di vincere"
✅ "Guarda, ho messo la Roma perché in casa raramente delude, e il Lecce viene da 3 sconfitte. Quota 1.75 è interessante"

❌ "Questa è una vincita sicura"  
✅ "Secondo me è una buona scelta, ma il rischio c'è sempre nel calcio"

❌ "Statisticamente conviene"
✅ "Ti dico, guardando le quote e la forma, mi convincerebbe"`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory || []),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
    
    return NextResponse.json({
      message: response.choices[0].message.content
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Errore nella chat' }, { status: 500 })
  }
}