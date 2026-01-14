import { NextResponse } from 'next/server'

interface ParsedPlayer {
  ruolo: string
  nome: string
  nome_completo: string
  squadra: string
  crediti?: number
  id: string // Generiamo un ID unico
}

function mapSquadra(sigla: string): string {
  const teamMap: Record<string, string> = {
    'ATA': 'Atalanta',
    'BOL': 'Bologna', 
    'TOR': 'Torino',
    'JUV': 'Juventus',
    'INT': 'Inter',
    'MIL': 'Milan',
    'CAG': 'Cagliari',
    'LAZ': 'Lazio',
    'COM': 'Como',
    'NAP': 'Napoli',
    'ROM': 'Roma',
    'FIO': 'Fiorentina',
    'UDI': 'Udinese',
    'VER': 'Verona',
    'GEN': 'Genoa',
    'LEC': 'Lecce',
    'MON': 'Monza',
    'PAR': 'Parma',
    'VEN': 'Venezia',
    'EMP': 'Empoli'
  }
  
  return teamMap[sigla.toUpperCase()] || sigla
}

function parseAndSaveRosa(text: string): ParsedPlayer[] {
  const lines = text.split('\n').filter(line => line.trim())
  const players: ParsedPlayer[] = []
  
  for (const line of lines) {
    // Formato: "P - Carnesecchi ATA (21)" o varianti
    const match = line.match(/^([PDCA])\s*-\s*(.+?)\s+([A-Z]{3})\s*(?:\((\d+)\))?$/)
    
    if (match) {
      const [, ruolo, nomeCompleto, siglaSq, creditiStr] = match
      
      // Pulisce il nome (rimuove iniziali tipo "L." da "Martinez L.")
      const nome = nomeCompleto.replace(/\s+[A-Z]\.$/, '').trim()
      const squadra = mapSquadra(siglaSq)
      const crediti = creditiStr ? parseInt(creditiStr) : undefined
      
      players.push({
        id: `${ruolo}_${nome.replace(/\s+/g, '_').toLowerCase()}_${squadra}`,
        ruolo,
        nome,
        nome_completo: nomeCompleto.trim(),
        squadra,
        crediti
      })
    } else {
      // Formato libero: prova a estrarre ruolo, nome e squadra
      const words = line.trim().split(/\s+/)
      if (words.length >= 3) {
        // Cerca pattern ruolo (P|D|C|A)
        const ruoloIndex = words.findIndex(w => /^[PDCA]$/i.test(w))
        
        if (ruoloIndex >= 0) {
          const ruolo = words[ruoloIndex].toUpperCase()
          const parole = [...words]
          parole.splice(ruoloIndex, 1) // Rimuovi ruolo
          
          // Prendi ultime 1-2 parole come squadra se sembrano sigle
          const ultimaParola = parole[parole.length - 1]
          let squadra = ''
          let nomeParole = parole
          
          if (ultimaParola && ultimaParola.length === 3 && /^[A-Z]+$/.test(ultimaParola)) {
            squadra = mapSquadra(ultimaParola)
            nomeParole = parole.slice(0, -1)
          } else {
            // Squadra = ultima parola
            squadra = ultimaParola || ''
            nomeParole = parole.slice(0, -1)
          }
          
          const nome = nomeParole.join(' ')
          
          if (nome.length > 1) {
            players.push({
              id: `${ruolo}_${nome.replace(/\s+/g, '_').toLowerCase()}_${squadra}`,
              ruolo,
              nome,
              nome_completo: nome,
              squadra,
            })
          }
        }
      }
    }
  }
  
  return players
}

export async function POST(request: Request) {
  try {
    const { rosterText } = await request.json()
    
    if (!rosterText || typeof rosterText !== 'string') {
      return NextResponse.json(
        { error: 'Testo rosa mancante o non valido' },
        { status: 400 }
      )
    }
    
    const players = parseAndSaveRosa(rosterText)
    
    if (players.length === 0) {
      return NextResponse.json(
        { error: 'Nessun giocatore riconosciuto. Formato supportato: "P - Carnesecchi ATA (21)"' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      players,
      count: players.length,
      message: `Parsed ${players.length} giocatori dalla rosa`
    })
    
  } catch (error) {
    console.error('Error parsing roster:', error)
    return NextResponse.json(
      { error: 'Errore nel parsing della rosa' },
      { status: 500 }
    )
  }
}