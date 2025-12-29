import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/client'

// Inizializza OpenAI solo se la chiave è disponibile
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null

// Carica tips direttamente da Supabase
async function loadTodayTips() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: tips, error } = await supabaseAdmin
      .from('tips')
      .select('*')
      .eq('valid_until', today)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading tips:', error)
      return []
    }

    return tips || []
  } catch (error) {
    console.error('Error in loadTodayTips:', error)
    return []
  }
}

// Formatta le predizioni per il contesto AI con NUOVO FORMATO
const formatPredictionsForContext = (tips: any[]) => {
  if (!tips || tips.length === 0) {
    return "Non ci sono proposte per oggi perché non ci sono partite dei campionati principali."
  }

  let context = "🎯 Le proposte TipsterAI di oggi sono:\n\n"
  
  tips.forEach((tip: any) => {
    const typeLabel = tip.tip_type.toUpperCase()
    context += `📋 ${typeLabel} (${tip.potential_multiplier || tip.total_odds + 'x'}):\n`
    
    if (tip.matches && Array.isArray(tip.matches)) {
      tip.matches.forEach((match: any) => {
        context += `• ${match.match}`
        if (match.league) context += ` (${match.league})`
        context += `: ${match.prediction} @${match.odds}`
        if (match.confidence) context += ` | Confidenza: ${match.confidence}%`
        context += '\n'
        
        if (match.reasoning) {
          context += `  💡 Analisi: ${match.reasoning}\n`
        }
      })
    }
    
    context += `📊 Quota totale: ${tip.total_odds || 'N/A'}\n`
    
    if (tip.description) {
      context += `📝 Descrizione: ${tip.description}\n`
    }
    
    if (tip.strategy_reasoning) {
      context += `🎯 Strategia: ${tip.strategy_reasoning}\n`
    }
    
    context += '\n'
  })
  
  return context
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Messaggio richiesto' },
        { status: 400 }
      )
    }

    // CARICA TIPS DIRETTAMENTE DA SUPABASE (non dipende più dal frontend)
    console.log('🔍 Loading tips from Supabase for chat...')
    const todayTips = await loadTodayTips()
    console.log(`📋 Loaded ${todayTips.length} tips for chat context`)

    // Se OpenAI non è configurato, usa risposte di fallback migliorate
    if (!openai) {
      let response = ''
      const msg = message.toLowerCase()
      
      const predictionsContext = formatPredictionsForContext(todayTips)
      
      if (msg.includes('perché') || msg.includes('perche')) {
        response = `Basandomi sulle proposte di oggi:\n\n${predictionsContext}\n\nOgni partita è selezionata analizzando forma recente, scontri diretti, statistiche di gol e infortuni. Se hai domande su una partita specifica, chiedimi pure!`
      } else if (msg.includes('quanto') && (msg.includes('giocare') || msg.includes('puntare'))) {
        response = "Ti consiglio di seguire il metodo spiegato in /metodo: mai più del 5% del tuo budget su una singola giocata. Per le singole e doppie puoi arrivare al 3-5%, per le triple 1-2%, e per BOMBA e multiple solo lo 0.5-1%. La gestione del bankroll è fondamentale!"
      } else {
        response = `Sono TipsterAI! Ecco le proposte di oggi:\n\n${predictionsContext}\n\nChiedimi qualsiasi cosa sulle partite!`
      }
      
      return NextResponse.json({ message: response })
    }

    // Costruisci il contesto del sistema con le predizioni reali DA SUPABASE
    const today = new Date().toLocaleDateString('it-IT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    const predictionsContext = formatPredictionsForContext(todayTips)
    
    const systemPrompt = `Sei TipsterAI, un esperto tutor di scommesse calcistiche che aiuta gli utenti con consigli basati su dati e analisi. 

Oggi è ${today}.

${predictionsContext}

🎯 REGOLE TipsterAI:
- Le proposte sono generate AUTOMATICAMENTE 2 volte al giorno usando solo partite REALI
- Ogni tip ha 5 tipi: SINGOLA (quota ≥1.70), DOPPIA (~2x), TRIPLA (~3x), MISTA (7-8 partite, 15-20x), BOMBA (3-5 upset, 50x+)
- Ogni partita è analizzata con predictions AI, odds reali e reasoning dettagliato
- CONOSCI PERFETTAMENTE ogni tip e puoi spiegare nel dettaglio PERCHÉ ogni partita è stata scelta
- Se chiedono di una partita specifica, usa il reasoning fornito e spiega la logica della selezione
- Gestione bankroll: SINGOLA/DOPPIA 3-5%, TRIPLA 1-2%, MISTA/BOMBA 0.5-1% del budget
- Mai promettere vincite sicure - il calcio è imprevedibile
- Per analisi H2H dettagliate suggerisci /matches
- Rispondi sempre in italiano con tono da tipster esperto
- Se una partita non è nelle proposte, significa che non aveva confidence sufficiente per essere inclusa

🔍 QUANDO TI CHIEDONO:
- "Perché questa partita?" → Usa il reasoning specifico del tip
- "Quanto giocare?" → Spiega le % del metodo TipsterAI  
- "È sicura?" → Spiega confidence + ricorda che nulla è garantito
- "Alternative?" → Spiega le altre proposte disponibili`

    // Prepara i messaggi per la conversazione
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Chiama OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    })

    const aiResponse = completion.choices[0].message.content || 'Mi dispiace, non sono riuscito a elaborare la risposta.'

    return NextResponse.json({
      message: aiResponse
    })

  } catch (error) {
    console.error('Error in chat:', error)
    
    // Fallback migliorato in caso di errore
    return NextResponse.json({
      message: "Ciao! Sono TipsterAI. Anche se ho qualche problema tecnico, posso comunque aiutarti! Guarda le proposte di oggi sopra e chiedimi perché ho scelto certe partite o quanto dovresti giocare. Ricorda sempre di consultare /metodo per la gestione del bankroll!"
    })
  }
}