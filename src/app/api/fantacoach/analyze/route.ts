import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to get next Serie A matches info (simplified, as per your approach)
function getNextSerieAMatchesInfo(fixtures: any[]): string {
  if (!fixtures || fixtures.length === 0) {
    return "Nessuna informazione sulle prossime partite disponibile."
  }
  
  return fixtures.slice(0, 10).map(f => 
    `${f.home.name} vs ${f.away.name} (${f.date || 'Data TBD'})`
  ).join('\n')
}

export async function POST(request: Request) {
  try {
    const { type, roster, formation, fixtures } = await request.json()
    
    if (!roster || roster.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna rosa fornita' },
        { status: 400 }
      )
    }
    
    // NUOVO APPROCCIO UNIFICATO
    const prompt = `Sei FantaCoach, esperto di fantacalcio italiano. 

⚠️ **DISCLAIMER**: I miei dati sono aggiornati fino al mio training. Per info recentissime (infortuni di ieri, formazioni) potresti avere dati più freschi di me.

## ROSA DELL'UTENTE
${roster.map((p: any) => `${p.role} - ${p.name} (${p.team})`).join('\n')}

## PROSSIME PARTITE SERIE A
${getNextSerieAMatchesInfo(fixtures)}

## COMPITO
Fai un'analisi COMPLETA e UNICA che include:
1. **CHI SCHIERARE** (con motivazioni)
2. **FORMAZIONE OTTIMALE** con modulo ${formation || '3-5-2'} 

## REGOLE PRIORITARIE
🎯 **PRIORITÀ ASSOLUTA**: Le 3 punte migliori SEMPRE titolari
🏆 **Poi**: I migliori per ogni ruolo
⚠️ **Mai**: giocatori che secondo le mie conoscenze hanno problemi

## ANALISI RICHIESTA
Per ogni giocatore, valuta con le mie conoscenze:
- Titolarità abituale nella squadra reale
- Forma generale (se la conosco)
- Caratteristiche (rigorista, assist-man, ecc.)
- Considerazioni su avversario (se le partite sono note)

⚠️ **IMPORTANTE**: Se non sono sicuro su un dato recente, lo specifico nel consiglio.

## OUTPUT JSON UNIFICATO
{
  "disclaimer": "I dati sono aggiornati al mio training. Verifica sempre info recentissime su infortuni e formazioni.",
  
  "analysis": {
    "topAttackers": [
      { "name": "...", "team": "...", "reason": "Migliore attaccante disponibile, sempre titolare", "priority": 1 },
      { "name": "...", "team": "...", "reason": "Seconda punta ideale, in forma", "priority": 2 },
      { "name": "...", "team": "...", "reason": "Terza opzione solida", "priority": 3 }
    ],
    
    "mustStart": [
      { "name": "...", "role": "A", "team": "...", "reason": "Top attaccante, sempre da schierare" },
      { "name": "...", "role": "C", "team": "...", "reason": "Centrocampista chiave, rigorista" }
    ],
    
    "recommended": [
      { "name": "...", "role": "D", "team": "...", "reason": "Difensore affidabile" }
    ],
    
    "doubts": [
      { "name": "...", "role": "C", "team": "...", "pros": "Qualità tecnica", "cons": "Potrebbero esserci dubbi su titolarità (verifica ultime notizie)" }
    ],
    
    "avoid": [
      { "name": "...", "role": "D", "team": "...", "reason": "Dalle mie conoscenze aveva problemi di forma/titolarità (verifica)" }
    ]
  },
  
  "formation": {
    "module": "${formation || '3-5-2'}",
    "lineup": {
      "goalkeeper": { "name": "...", "reason": "Portiere più affidabile" },
      "defenders": [
        { "name": "...", "reason": "Titolare fisso" }
      ],
      "midfielders": [
        { "name": "...", "reason": "Centrocampista chiave" }
      ],
      "attackers": [
        { "name": "...", "reason": "Prima punta" },
        { "name": "...", "reason": "Seconda punta" },
        { "name": "...", "reason": "Terza punta" }
      ]
    },
    "captain": { "name": "...", "reason": "Migliore opzione per la fascia" },
    "viceCaptain": { "name": "...", "reason": "Alternativa sicura" }
  }
}`
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using newer, more cost-effective model
      messages: [
        {
          role: "system",
          content: `Sei FantaCoach, esperto di fantacalcio italiano.

🎯 **TUE CONOSCENZE**:
- Hai informazioni sui giocatori Serie A fino al tuo training
- Conosci le caratteristiche generali: chi di solito è titolare, rigoristi, ecc.
- Conosci le squadre e i loro stili di gioco

⚠️ **LIMITI CHIARI**:
- I tuoi dati non sono aggiornati in tempo reale
- Per infortuni recenti o cambi di formazione potresti non essere aggiornato
- Quando non sei sicuro, dillo chiaramente

🎯 **PRIORITÀ FANTACALCIO**:
1. **ATTACCANTI SEMPRE PRIORITÀ**: Le 3 punte migliori vanno sempre giocate
2. **Sicurezza**: Meglio un 6 sicuro che un potenziale 8 rischioso
3. **Onestà**: Se non sei sicuro di un dato recente, ammettilo

🏆 **OBIETTIVO**: Dare consigli utili basati sulle tue conoscenze, essendo onesto sui limiti.

Rispondi SEMPRE in JSON valido con motivazioni chiare e disclaimer quando necessari.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3 // Lower temperature for more consistent analysis
    })
    
    const result = JSON.parse(completion.choices[0].message.content || '{}')
    
    return NextResponse.json({ 
      analysis: result,
      type: 'unified', // Sempre tipo unificato ora
      credits_used: 2, // Costo fisso per analisi completa
      model_used: "gpt-4o-mini"
    })
    
  } catch (error) {
    console.error('Error analyzing with GPT-4:', error)
    return NextResponse.json(
      { error: 'Errore nell\'analisi AI: ' + (error as Error).message },
      { status: 500 }
    )
  }
}