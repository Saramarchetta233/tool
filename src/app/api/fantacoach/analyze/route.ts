import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { type, roster, formation, fixtures } = await request.json()
    
    if (!roster || roster.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna rosa fornita' },
        { status: 400 }
      )
    }
    
    let prompt = ''
    
    if (type === 'formation') {
      prompt = `Sei FantaCoach, esperto di fantacalcio italiano.
      
L'utente ha questa rosa:
${roster.map((p: any) => `- ${p.name} (${p.role}) - ${p.team} - Media: ${p.avgRating} - Titolarità: ${p.titularity}% - Prossimo: ${p.nextOpponent}`).join('\n')}

Prossime partite Serie A:
${fixtures.map((f: any) => `- ${f.home.name} vs ${f.away.name} (${f.date} ${f.time})`).join('\n')}

Genera la formazione ottimale con modulo ${formation}.
Per ogni giocatore considera:
- Media voto stagionale
- Forma recente (ultimo voto)
- Avversario (facile/difficile, casa/trasferta)
- Titolarità (gioca sempre o rischia panchina?)
- Bonus attesi (rigorista? Assist-man? Clean sheet probabile?)

Rispondi in formato JSON:
{
  "formation": {
    "goalkeeper": { "name": "...", "reason": "..." },
    "defenders": [{ "name": "...", "reason": "..." }],
    "midfielders": [{ "name": "...", "reason": "..." }],
    "attackers": [{ "name": "...", "reason": "..." }]
  },
  "captain": { "name": "...", "reason": "..." },
  "viceCaptain": { "name": "...", "reason": "..." },
  "bench": [{ "name": "...", "priority": 1 }]
}`

    } else if (type === 'recommendations') {
      prompt = `Sei FantaCoach. Analizza i giocatori della rosa dell'utente per la prossima giornata.

Rosa utente:
${roster.map((p: any) => `- ${p.name} (${p.role}) - ${p.team} - Media: ${p.avgRating} - Ultimo: ${p.lastRating} - Titolarità: ${p.titularity}% - Prossimo: ${p.nextOpponent} (${p.difficulty})`).join('\n')}

Prossime partite:
${fixtures.map((f: any) => `- ${f.home.name} vs ${f.away.name}`).join('\n')}

Per ogni giocatore valuta:
- Gioca titolare? (controlla titolarità %)
- Avversario facile o difficile?
- Casa o trasferta?
- Forma recente?
- Possibilità bonus (gol, assist, clean sheet)?

Rispondi in formato JSON:
{
  "mustStart": [
    {
      "name": "...",
      "team": "...",
      "reason": "...",
      "prediction": 7.5,
      "confidence": "ALTA"
    }
  ],
  "doubts": [
    {
      "name": "...",
      "team": "...",
      "pros": "...",
      "cons": "...",
      "prediction": 6.5,
      "confidence": "MEDIA"
    }
  ],
  "avoid": [
    {
      "name": "...",
      "team": "...",
      "reason": "...",
      "risk": "ALTO"
    }
  ]
}`
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Sei FantaCoach, esperto di fantacalcio italiano. Rispondi sempre in formato JSON valido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    })
    
    const result = JSON.parse(completion.choices[0].message.content || '{}')
    
    return NextResponse.json({ 
      analysis: result,
      type,
      credits_used: type === 'formation' ? 3 : 2
    })
    
  } catch (error) {
    console.error('Error analyzing with GPT-4:', error)
    return NextResponse.json(
      { error: 'Failed to analyze' },
      { status: 500 }
    )
  }
}