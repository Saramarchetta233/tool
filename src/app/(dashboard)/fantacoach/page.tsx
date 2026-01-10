'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Trophy, Users, Target, TrendingUp, Shield, AlertTriangle, Plus, Download, Upload, BarChart3, ArrowLeft, Search, X, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Player {
  id: number
  name: string
  role: 'P' | 'D' | 'C' | 'A'
  team: string
  team_id: number
  avgRating: number
  lastRating: number
  titularity: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  cleanSheets: number
  gamesPlayed: number
  // Aggiunti per l'UI
  nextOpponent?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  prediction?: number
}

interface Fixture {
  fixture_id: number
  date: string
  time: string
  home: { id: number; name: string; rank: number }
  away: { id: number; name: string; rank: number }
  venue: string
  homeDifficulty: 'easy' | 'medium' | 'hard'
  awayDifficulty: 'easy' | 'medium' | 'hard'
}

export default function FantaCoachPage() {
  const [activeTab, setActiveTab] = useState<'roster' | 'analysis'>('roster')
  const [formation, setFormation] = useState('3-5-2')
  const [roster, setRoster] = useState<Player[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatedLineup, setGeneratedLineup] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [showTextImport, setShowTextImport] = useState(false)
  const [rosterText, setRosterText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const formations = ['3-5-2', '3-4-3', '4-3-3', '4-4-2', '4-5-1']

  useEffect(() => {
    // Carica rosa da localStorage
    const savedRoster = localStorage.getItem('fantacoach-roster')
    if (savedRoster) {
      setRoster(JSON.parse(savedRoster))
    }
    
    // Carica giocatori e prossime partite
    fetchPlayers()
    fetchFixtures()
  }, [])

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/fantacoach/players')
      const data = await response.json()
      if (data.players && data.players.length > 0) {
        setAllPlayers(data.players)
      } else {
        console.log('No players found, database might be empty')
        setAllPlayers([])
      }
    } catch (error) {
      console.error('Error fetching players:', error)
      setAllPlayers([])
    } finally {
      setLoading(false)
    }
  }

  const loadSerieAPlayers = async () => {
    try {
      setLoadingPlayers(true)
      const response = await fetch('/api/fantacoach/load-fantacalcio-2025')
      const data = await response.json()
      
      if (response.ok) {
        alert(`✅ Caricati ${data.loaded} giocatori da Fantacalcio.it 2025-26!`)
        await fetchPlayers() // Ricarica i giocatori
      } else {
        alert(`❌ Errore: ${data.error}`)
      }
    } catch (error) {
      console.error('Error loading Serie A players:', error)
      alert('❌ Errore nel caricamento dei giocatori')
    } finally {
      setLoadingPlayers(false)
    }
  }

  const importSerieAPlayers = async () => {
    try {
      setIsImporting(true)
      const response = await fetch('/api/fantacoach/import-serie-a-2025', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        alert(`✅ Importati ${data.imported} giocatori Serie A 2025-26 da API-Football!`)
        await fetchPlayers() // Ricarica i giocatori
      } else {
        alert(`❌ Errore: ${data.error}`)
      }
    } catch (error) {
      console.error('Error importing Serie A players:', error)
      alert('❌ Errore nell\'importazione dei giocatori')
    } finally {
      setIsImporting(false)
    }
  }

  const importFantacalcioReal = async () => {
    try {
      setIsImporting(true)
      const response = await fetch('/api/fantacoach/import-fantacalcio-real-2025', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        alert(`✅ Importati ${data.imported} giocatori REALI Serie A 2025-26 da Fantacalcio.it!`)
        await fetchPlayers() // Ricarica i giocatori
      } else {
        alert(`❌ Errore: ${data.error}`)
      }
    } catch (error) {
      console.error('Error importing real players:', error)
      alert('❌ Errore nell\'importazione dei giocatori reali')
    } finally {
      setIsImporting(false)
    }
  }

  const fetchFixtures = async () => {
    try {
      const response = await fetch('/api/fantacoach/fixtures')
      const data = await response.json()
      if (data.fixtures) {
        setFixtures(data.fixtures)
      }
    } catch (error) {
      console.error('Error fetching fixtures:', error)
    }
  }

  const saveRoster = (newRoster: Player[]) => {
    setRoster(newRoster)
    localStorage.setItem('fantacoach-roster', JSON.stringify(newRoster))
  }

  const addPlayer = (player: Player) => {
    if (!roster.find(p => p.id === player.id)) {
      const enrichedPlayer = enrichPlayerData(player)
      saveRoster([...roster, enrichedPlayer])
    }
    setShowSearch(false)
    setSearchQuery('')
  }

  const removePlayer = (playerId: number) => {
    saveRoster(roster.filter(p => p.id !== playerId))
  }

  const enrichPlayerData = (player: Player): Player => {
    // Trova prossima partita per la squadra del giocatore
    const nextMatch = fixtures.find(f => 
      f.home.id === player.team_id || f.away.id === player.team_id
    )
    
    if (nextMatch) {
      const isHome = nextMatch.home.id === player.team_id
      const opponent = isHome ? nextMatch.away : nextMatch.home
      const difficulty = isHome ? nextMatch.homeDifficulty : nextMatch.awayDifficulty
      
      return {
        ...player,
        nextOpponent: `${opponent.name} (${isHome ? 'C' : 'T'})`,
        difficulty,
        prediction: calculatePrediction(player, difficulty, isHome)
      }
    }
    
    return player
  }

  const calculatePrediction = (player: Player, difficulty: string, isHome: boolean): number => {
    let prediction = player.avgRating
    
    if (difficulty === 'easy') prediction += 0.5
    else if (difficulty === 'hard') prediction -= 0.5
    
    if (isHome) prediction += 0.3
    
    if (player.lastRating > player.avgRating) prediction += 0.3
    else if (player.lastRating < player.avgRating) prediction -= 0.3
    
    return Math.round(prediction * 10) / 10
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      
      try {
        setIsImporting(true)
        
        // Usa la nuova API per il parsing diretto
        const response = await fetch('/api/fantacoach/parse-roster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rosterText: text })
        })
        
        const data = await response.json()
        
        if (response.ok && data.players) {
          // Converte i giocatori parsati nel formato Player dell'UI
          const importedPlayers: Player[] = data.players.map((p: any) => ({
            id: Math.random(), // ID temporaneo
            name: p.nome,
            role: p.ruolo as 'P' | 'D' | 'C' | 'A',
            team: p.squadra,
            team_id: 0,
            avgRating: 6.5, // Valori di default
            lastRating: 6.5,
            titularity: 80,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            cleanSheets: 0,
            gamesPlayed: 0
          })).map((p: Player) => enrichPlayerData(p))
          
          // Evita duplicati con la rosa esistente
          const newPlayers = importedPlayers.filter(ip => 
            !roster.find(rp => rp.name.toLowerCase() === ip.name.toLowerCase() && rp.team === ip.team)
          )
          
          if (newPlayers.length > 0) {
            saveRoster([...roster, ...newPlayers])
            alert(`✅ Importati ${newPlayers.length} nuovi giocatori da ${data.count} riconosciuti!\n\nUsando GPT-4 per statistiche e consigli avanzati.`)
          } else {
            alert('⚠️ Tutti i giocatori riconosciuti sono già presenti nella rosa')
          }
        } else {
          // Fallback al vecchio sistema se il nuovo parsing fallisce
          console.warn('New parsing failed, falling back to old system:', data.error)
          handleOldImportCSV(text)
        }
      } catch (error) {
        console.error('Error with new parsing system:', error)
        // Fallback al vecchio sistema
        handleOldImportCSV(text)
      } finally {
        setIsImporting(false)
      }
    }
    
    reader.readAsText(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Sistema di fallback (vecchio parsing con matching nel database)
  const handleOldImportCSV = (text: string) => {
    const lines = text.split('\n')
    const importedPlayers: Player[] = []
    let startLine = 0
    
    // Rileva se c'è un header
    const firstLine = lines[0]?.toLowerCase()
    if (firstLine && (firstLine.includes('nome') || firstLine.includes('name') || firstLine.includes('player'))) {
      startLine = 1
    }
    
    lines.slice(startLine).forEach((line, index) => {
      if (!line.trim()) return
      
      // Parsing per formato fantacalcio con trattini
      let parts: string[] = []
      let name = ''
      let role = ''
      let team = ''
      
      // Rimuovi crediti tra parentesi
      line = line.replace(/\(\d+\)/, '').trim()
      
      // Formato: "P - Carnesecchi ATA" o "D - Cuadrado PIS"
      if (line.includes(' - ')) {
        const dashParts = line.split(' - ')
        if (dashParts.length >= 2) {
          role = dashParts[0].trim().toUpperCase()
          const nameTeamPart = dashParts[1].trim()
          
          // Divide nome e squadra (squadra è tipicamente le ultime 3 lettere)
          const words = nameTeamPart.split(' ')
          if (words.length >= 2) {
            team = words[words.length - 1] // Ultima parola è la squadra
            name = words.slice(0, -1).join(' ') // Tutto tranne l'ultima parola
          } else {
            name = nameTeamPart
          }
        }
      } else {
        // Formato standard: supporta sia CSV che formato separato da spazi/tab
        const separators = [',', ';', '\t', '  ', ' ']
        
        for (const sep of separators) {
          if (line.includes(sep)) {
            parts = line.split(sep).map(s => s.trim()).filter(s => s)
            break
          }
        }
        
        // Se non trova separatori, prova a dividere per spazi singoli
        if (parts.length === 0) {
          parts = line.split(' ').filter(s => s.trim())
        }
        
        if (parts.length >= 2) {
          name = parts[0]
          
          // Cerca ruolo (P, D, C, A)
          const rolePattern = /^[PDCA]$/i
          const roleIndex = parts.findIndex(p => rolePattern.test(p))
          
          if (roleIndex !== -1) {
            role = parts[roleIndex].toUpperCase()
            team = parts.slice(roleIndex + 1).join(' ') || parts.slice(1, roleIndex).join(' ')
          } else {
            // Se non trova ruolo, assume nome e resto come squadra
            team = parts.slice(1).join(' ')
          }
        }
      }
      
      if (name && name.length > 1) {
        // Debug: mostra cosa ha estratto
        console.log(`Parsed line: "${line}" -> Name: "${name}", Role: "${role}", Team: "${team}"`)
        
        // Mappa sigle squadre comuni (aggiunte varianti)
        const teamMap: Record<string, string[]> = {
          'ATA': ['Atalanta', 'Atalanta BC'],
          'BOL': ['Bologna', 'Bologna FC'],
          'TOR': ['Torino', 'Torino FC'],
          'PIS': ['Pisa', 'Pisa SC'], // PIS è Pisa, non Juventus
          'JUV': ['Juventus', 'Juventus FC'],
          'INT': ['Inter', 'Inter Milan', 'Internazionale'],
          'CRE': ['Cremonese', 'US Cremonese'],
          'MIL': ['Milan', 'AC Milan'],
          'CAG': ['Cagliari', 'Cagliari Calcio'],
          'LAZ': ['Lazio', 'SS Lazio'],
          'COM': ['Como', 'Como 1907'],
          'NAP': ['Napoli', 'SSC Napoli'],
          'ROM': ['Roma', 'AS Roma'],
          'FIO': ['Fiorentina', 'ACF Fiorentina'],
          'UDI': ['Udinese', 'Udinese Calcio'],
          'VER': ['Verona', 'Hellas Verona'],
          'GEN': ['Genoa', 'Genoa CFC'],
          'LEC': ['Lecce', 'US Lecce'],
          'MON': ['Monza', 'AC Monza'],
          'PAR': ['Parma', 'Parma Calcio'],
          'VEN': ['Venezia', 'Venezia FC'],
          'EMP': ['Empoli', 'Empoli FC']
        }
        
        // Cerca giocatore nei dati con matching SUPER FLESSIBILE  
        const player = allPlayers.find(p => {
          // Normalizza i nomi: rimuovi accenti, puntini, caratteri speciali
          const normalizeText = (text: string) => {
            return text
              .toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Rimuovi accenti
              .replace(/[^a-z\s]/g, '') // Solo lettere e spazi
              .replace(/\s+/g, ' ') // Spazi singoli
              .trim()
          }
          
          const playerNameNorm = normalizeText(p.name)
          const searchNameNorm = normalizeText(name)
          
          // 1. NOME ESATTO (dopo normalizzazione)
          if (playerNameNorm === searchNameNorm) return true
          
          // 2. COGNOME MATCH - prendi l'ultima parola di entrambi
          const playerLastName = playerNameNorm.split(' ').pop() || ''
          const searchLastName = searchNameNorm.split(' ').pop() || ''
          if (playerLastName && searchLastName && 
              playerLastName === searchLastName && searchLastName.length > 3) {
            return true
          }
          
          // 3. COGNOME CONTENUTO - es: "Vlaho" trova "Vlahovic"
          if (searchNameNorm.length > 4 && playerNameNorm.includes(searchNameNorm)) {
            return true
          }
          
          // 4. COGNOME CONTENUTO AL CONTRARIO - es: "Vlahovic" trova "D Vlahovic"
          if (searchLastName.length > 4 && playerNameNorm.includes(searchLastName)) {
            return true
          }
          
          // 5. MATCH PAROLE - almeno una parola in comune lunga >3 caratteri
          const searchWords = searchNameNorm.split(' ').filter(w => w.length > 3)
          const playerWords = playerNameNorm.split(' ').filter(w => w.length > 3)
          if (searchWords.some(sw => playerWords.some(pw => pw.includes(sw) || sw.includes(pw)))) {
            return true
          }
          
          return false
        })
        
        // Verifica squadra se fornita
        if (player && team) {
          const possibleTeams = teamMap[team.toUpperCase()] || [team]
          const teamMatch = possibleTeams.some(t => 
              player.team.toLowerCase().includes(t.toLowerCase()) || 
              t.toLowerCase().includes(player.team.toLowerCase())
          )
          
          // Se la squadra non corrisponde, ignora questo match
          if (!teamMatch) {
            return null
          }
        }
        
        // Verifica ruolo se fornito
        if (player && role && player.role !== role) {
          return null
        }
        
        // Debug per vedere cosa ha trovato
        if (player) {
          console.log(`✅ FOUND: "${name}" -> ${player.name} (${player.team}, ${player.role})`)
          // Evita duplicati
          if (!importedPlayers.find(ip => ip.id === player.id)) {
            importedPlayers.push(enrichPlayerData(player))
          }
        } else {
          console.log(`❌ NOT FOUND: ${name} (${role}) from ${team} - No match in database`)
        }
      }
    })
    
    // Debug: mostra alcuni giocatori disponibili nel database
    if (importedPlayers.length === 0 && allPlayers.length > 0) {
      console.log('🔍 Sample players in database:')
      allPlayers.slice(0, 10).forEach(p => {
        console.log(`  - ${p.name} (${p.team}, ${p.role})`)
      })
    }
    
    console.log(`📊 Import result: ${importedPlayers.length} players imported`)
    
    if (importedPlayers.length > 0) {
      // Evita duplicati con la rosa esistente
      const newPlayers = importedPlayers.filter(ip => 
        !roster.find(rp => rp.id === ip.id)
      )
      
      if (newPlayers.length > 0) {
        saveRoster([...roster, ...newPlayers])
        alert(`✅ Importati ${newPlayers.length} nuovi giocatori!`)
      } else {
        alert('⚠️ Tutti i giocatori sono già presenti nella rosa')
      }
    } else {
      alert(`❌ Nessun giocatore riconosciuto nel file.\n\nFormati supportati:\n• Fantacalcio: "P - Carnesecchi ATA (21)"\n• CSV: "Nome,Ruolo,Squadra"\n• TXT: "Nome Ruolo Squadra"\n\nControlla la Console (F12) per debug dettagliato.`)
    }
  }

  const handleTextImport = async () => {
    if (!rosterText.trim()) {
      alert('Inserisci il testo della rosa')
      return
    }

    try {
      setIsImporting(true)
      
      const response = await fetch('/api/fantacoach/parse-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosterText })
      })
      
      const data = await response.json()
      
      if (response.ok && data.players) {
        // Converte i giocatori parsati nel formato Player dell'UI
        const importedPlayers: Player[] = data.players.map((p: any) => ({
          id: Math.random(),
          name: p.nome,
          role: p.ruolo as 'P' | 'D' | 'C' | 'A',
          team: p.squadra,
          team_id: 0,
          avgRating: 6.5,
          lastRating: 6.5,
          titularity: 80,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          cleanSheets: 0,
          gamesPlayed: 0
        })).map((p: Player) => enrichPlayerData(p))
        
        // Evita duplicati con la rosa esistente
        const newPlayers = importedPlayers.filter(ip => 
          !roster.find(rp => rp.name.toLowerCase() === ip.name.toLowerCase() && rp.team === ip.team)
        )
        
        if (newPlayers.length > 0) {
          saveRoster([...roster, ...newPlayers])
          alert(`✅ Importati ${newPlayers.length} nuovi giocatori!\n\nOra GPT-4 li analizza direttamente senza dipendere dal database.`)
          setRosterText('')
          setShowTextImport(false)
        } else {
          alert('⚠️ Tutti i giocatori sono già presenti nella rosa')
        }
      } else {
        alert(`❌ Errore nel parsing: ${data.error}`)
      }
    } catch (error) {
      console.error('Error importing text:', error)
      alert('❌ Errore nell\'importazione del testo')
    } finally {
      setIsImporting(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Nome', 'Ruolo', 'Squadra', 'Media']
    const rows = roster.map(p => [p.name, p.role, p.team, p.avgRating])
    
    const csv = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fantacoach_rosa.csv'
    link.click()
  }

  const generateLineup = async () => {
    if (roster.length < 11) {
      alert('Aggiungi almeno 11 giocatori alla rosa!')
      return
    }
    
    setAnalyzing(true)
    try {
      const rosterWithData = roster.map(p => enrichPlayerData(p))
      
      const response = await fetch('/api/fantacoach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'formation',
          roster: rosterWithData,
          formation,
          fixtures
        })
      })
      
      const data = await response.json()
      if (data.analysis) {
        setGeneratedLineup(data.analysis)
      }
    } catch (error) {
      console.error('Error generating lineup:', error)
      alert('Errore nella generazione della formazione')
    } finally {
      setAnalyzing(false)
    }
  }

  const generateRecommendations = async () => {
    if (roster.length === 0) {
      alert('Aggiungi giocatori alla rosa!')
      return
    }
    
    setAnalyzing(true)
    try {
      const rosterWithData = roster.map(p => enrichPlayerData(p))
      
      const response = await fetch('/api/fantacoach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recommendations',
          roster: rosterWithData,
          fixtures
        })
      })
      
      const data = await response.json()
      if (data.analysis) {
        setRecommendations(data.analysis)
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
      alert('Errore nella generazione dei consigli')
    } finally {
      setAnalyzing(false)
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-500/20 text-emerald-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'  
      case 'hard': return 'bg-red-500/20 text-red-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'P': return 'bg-purple-500/20 text-purple-400'
      case 'D': return 'bg-blue-500/20 text-blue-400'
      case 'C': return 'bg-emerald-500/20 text-emerald-400'
      case 'A': return 'bg-red-500/20 text-red-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const filteredPlayers = allPlayers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.team.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Debug per capire quanti giocatori abbiamo
  console.log(`🔍 Debug: allPlayers=${allPlayers.length}, searchQuery="${searchQuery}", filteredPlayers=${filteredPlayers.length}`)

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold gradient-text">FantaCoach</h1>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xl text-slate-400">
            Il tuo assistente AI per dominare il fantacalcio italiano
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-slate-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'roster' 
                ? 'bg-emerald-500 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            La Mia Rosa
          </button>
          <button
            onClick={() => {
              setActiveTab('analysis')
              if (!recommendations) generateRecommendations()
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🧠 Analisi AI Completa
          </button>
        </div>

        {/* Roster Management Tab */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            
            {/* Import/Export Actions */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-emerald-500" />
                  Gestione Rosa
                </CardTitle>
                <CardDescription className="text-slate-400">
                  🧠 <strong>NUOVO:</strong> Usa "Incolla Rosa GPT" per importare direttamente - riconosce TUTTI i giocatori senza database! 
                  <br />Oppure usa i metodi tradizionali: file CSV/TXT o ricerca manuale.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => setShowTextImport(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    🧠 Incolla Rosa GPT
                  </Button>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importa CSV/TXT
                  </Button>
                  <Button 
                    onClick={exportCSV}
                    variant="outline" 
                    className="border-slate-700 text-white hover:bg-slate-800"
                    disabled={roster.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Esporta Rosa
                  </Button>
                  <Button 
                    onClick={() => setShowSearch(true)}
                    variant="outline" 
                    className="border-slate-700 text-white hover:bg-slate-800"
                    disabled={allPlayers.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Giocatore
                  </Button>
                  
                  <div className="flex gap-2">
                    {allPlayers.length === 0 && (
                      <Button 
                        onClick={loadSerieAPlayers}
                        disabled={loadingPlayers}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        {loadingPlayers ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Caricando...
                          </>
                        ) : (
                          '⚽ Carica da Fantacalcio.it'
                        )}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={importFantacalcioReal}
                      disabled={isImporting}
                      className="bg-red-500 hover:bg-red-600"
                      title="Importa giocatori REALI Serie A 2025-26 da Fantacalcio.it"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          🔥 DATI REALI 2025-26
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={importSerieAPlayers}
                      disabled={isImporting}
                      className="bg-gray-600 hover:bg-gray-700"
                      title="Importa da API-Football (dati vecchi)"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          API-Football (vecchi)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Formato Import Help */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-white font-medium mb-3">📄 Formati supportati per l'import:</h4>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div>
                      <span className="text-emerald-400 font-medium">CSV:</span> 
                      <code className="ml-2 px-2 py-1 bg-slate-700 rounded text-xs">Nome,Ruolo,Squadra</code>
                    </div>
                    <div>
                      <span className="text-blue-400 font-medium">TXT:</span> 
                      <code className="ml-2 px-2 py-1 bg-slate-700 rounded text-xs">Nome Ruolo Squadra</code>
                      <span className="text-slate-400 ml-2">(uno per riga)</span>
                    </div>
                    <div>
                      <span className="text-purple-400 font-medium">Esempio (Fantacalcio):</span>
                      <div className="mt-2 p-2 bg-slate-700 rounded text-xs font-mono">
                        P - Carnesecchi ATA (21)<br/>
                        D - Cuadrado JUV (10)<br/>
                        C - Calhanoglu INT (40)<br/>
                        A - Martinez L. INT (156)
                      </div>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-medium">Formato semplice:</span>
                      <div className="mt-2 p-2 bg-slate-700 rounded text-xs font-mono">
                        Lautaro Martinez A Inter<br/>
                        Theo Hernandez D Milan
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs mt-2">
                      💡 Il sistema riconosce automaticamente nome e squadra anche senza il ruolo
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Modal */}
            {showSearch && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Cerca Giocatore</span>
                    <Button
                      onClick={() => {
                        setShowSearch(false)
                        setSearchQuery('')
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Cerca per nome o squadra..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                        autoFocus
                      />
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {filteredPlayers.slice(0, 50).map(player => (
                          <div
                            key={player.id}
                            onClick={() => addPlayer(player)}
                            className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <Badge className={getRoleColor(player.role)}>
                                {player.role}
                              </Badge>
                              <div>
                                <div className="text-white font-medium">{player.name}</div>
                                <div className="text-sm text-slate-400">{player.team}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white">Media: {player.avgRating}</div>
                              <div className="text-xs text-slate-400">Tit. {player.titularity}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Text Import Modal */}
            {showTextImport && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>🧠 Incolla Rosa da Fantacalcio</span>
                    <Button
                      onClick={() => {
                        setShowTextImport(false)
                        setRosterText('')
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Incolla direttamente la lista dei giocatori - GPT-4 li riconoscerà automaticamente!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <textarea
                      value={rosterText}
                      onChange={(e) => setRosterText(e.target.value)}
                      placeholder={`Incolla qui la rosa in formato Fantacalcio, ad esempio:

P - Carnesecchi ATA (21)
D - Theo Hernandez MIL (38)  
D - Bastoni INT (35)
C - Calhanoglu INT (40)
C - Kvaratskhelia NAP (45)
A - Martinez L. INT (156)
A - Vlahovic JUV (78)

GPT-4 riconoscerà automaticamente tutti i nomi!`}
                      className="w-full h-48 bg-slate-800 border border-slate-700 text-white p-3 rounded-md resize-none"
                      autoFocus
                    />
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleTextImport}
                        disabled={!rosterText.trim() || isImporting}
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Elaborando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Importa con GPT-4
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          setShowTextImport(false)
                          setRosterText('')
                        }}
                        variant="outline"
                        className="border-slate-700 text-white hover:bg-slate-800"
                      >
                        Annulla
                      </Button>
                    </div>
                    
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>💡 <strong>Vantaggi del nuovo approccio:</strong></p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Riconosce TUTTI i giocatori (anche con nomi difficili come "Pašalić")</li>
                        <li>Non dipende dal database - funziona sempre</li>
                        <li>GPT-4 conosce statistiche, forma, titolarità e infortuni aggiornati</li>
                        <li>Costo: ~1-2 cent per importazione</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Players List */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Rosa Attuale ({roster.length} giocatori)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roster.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>Nessun giocatore nella rosa</p>
                    <p className="text-sm mt-2">Aggiungi giocatori manualmente o importa un CSV</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roster.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge className={getRoleColor(player.role)}>
                            {player.role}
                          </Badge>
                          <div>
                            <div className="font-semibold text-white">{player.name}</div>
                            <div className="text-sm text-slate-400">{player.team}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-center">
                            <div className="text-slate-400">Media</div>
                            <div className="text-white font-semibold">{player.avgRating}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-slate-400">Ultima</div>
                            <div className="text-white font-semibold">{player.lastRating}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-slate-400">Tit.</div>
                            <div className="text-white font-semibold">{player.titularity}%</div>
                          </div>
                          {player.nextOpponent && (
                            <div className="text-center min-w-0">
                              <div className="text-slate-400">Prossimo</div>
                              <Badge className={getDifficultyColor(player.difficulty)}>
                                {player.nextOpponent}
                              </Badge>
                            </div>
                          )}
                          <Button
                            onClick={() => removePlayer(player.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            
            {/* AI Analysis Controller */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="h-5 w-5 mr-2 text-emerald-500" />
                  🧠 Analisi AI Completa
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Un'unica analisi intelligente: chi schierare + formazione ottimale (priorità alle 3 punte)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                      Modulo preferito
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formations.map((form) => (
                        <Button
                          key={form}
                          variant={formation === form ? 'default' : 'outline'}
                          className={formation === form 
                            ? 'bg-emerald-500 hover:bg-emerald-600' 
                            : 'border-slate-700 text-white hover:bg-slate-800'
                          }
                          onClick={() => setFormation(form)}
                        >
                          {form}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={generateRecommendations}
                    disabled={roster.length === 0 || analyzing}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analizzando...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        🧠 Analisi Completa (~2¢)
                      </>
                    )}
                  </Button>
                  
                  {roster.length === 0 && (
                    <p className="text-sm text-red-400">
                      Aggiungi giocatori alla rosa per ottenere l'analisi AI
                    </p>
                  )}

                  <div className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                    <p className="font-medium mb-1">🎯 Cosa include l'analisi:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Chi schierare assolutamente (con motivazioni)</li>
                      <li>Formazione ottimale con le 3 punte migliori</li>
                      <li>Capitano e vice-capitano consigliati</li>
                      <li>Disclaimer su limiti dei dati GPT-4</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Results */}
            {recommendations && (
              <div className="space-y-6">
                
                {/* Disclaimer sui dati GPT-4 */}
                {recommendations.disclaimer && (
                  <Card className="bg-yellow-900/20 border-yellow-600/30">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-yellow-200 font-medium">⚠️ Informazioni sui dati</p>
                          <p className="text-yellow-100/80 text-sm mt-1">{recommendations.disclaimer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sezione TOP 3 ATTACCANTI */}
                {recommendations.analysis?.topAttackers && recommendations.analysis.topAttackers.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Target className="h-5 w-5 mr-2 text-red-500" />
                        🎯 TOP 3 ATTACCANTI (Priorità Assoluta)
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Le tue 3 punte migliori - da schierare sempre!
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        {recommendations.analysis.topAttackers.map((player: any, i: number) => (
                          <div key={i} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-white font-bold">{player.priority || i + 1}</span>
                              </div>
                              <div className="text-white font-bold">{player.name}</div>
                              <div className="text-sm text-red-400">{player.team}</div>
                              <p className="text-slate-300 text-xs mt-2">{player.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Formazione Completa */}
                {recommendations.formation && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white">
                        🏆 Formazione Ottimale - {recommendations.formation.module || formation}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Formazione completa con priorità alle 3 punte migliori
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      {/* Captain & Vice */}
                      {(recommendations.formation.captain || recommendations.formation.viceCaptain) && (
                        <div className="grid md:grid-cols-2 gap-4">
                          {recommendations.formation.captain && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                              <div className="text-yellow-400 font-semibold mb-2">👑 CAPITANO</div>
                              <div className="text-white font-bold">{recommendations.formation.captain.name}</div>
                              <div className="text-sm text-slate-400">{recommendations.formation.captain.reason}</div>
                            </div>
                          )}
                          
                          {recommendations.formation.viceCaptain && (
                            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                              <div className="text-slate-300 font-semibold mb-2">VICE-CAPITANO</div>
                              <div className="text-white font-bold">{recommendations.formation.viceCaptain.name}</div>
                              <div className="text-sm text-slate-400">{recommendations.formation.viceCaptain.reason}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Formation Visual */}
                      {recommendations.formation.lineup && (
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-6">
                          <div className="text-center space-y-6">
                            <div className="text-emerald-400 font-semibold">FORMAZIONE {recommendations.formation.module || formation}</div>
                            
                            {/* Attackers */}
                            {recommendations.formation.lineup.attackers && recommendations.formation.lineup.attackers.length > 0 && (
                              <div>
                                <div className="text-red-400 text-sm mb-2">ATTACCANTI</div>
                                <div className="flex justify-center gap-4 flex-wrap">
                                  {recommendations.formation.lineup.attackers.map((player: any, i: number) => (
                                    <div key={i} className="text-center">
                                      <div className="w-14 h-14 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mb-1">
                                        <span className="text-red-400 text-xs font-bold">A</span>
                                      </div>
                                      <div className="text-white text-xs font-medium">{player.name}</div>
                                      <div className="text-xs text-slate-400 max-w-20 truncate">{player.reason}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Midfielders */}
                            {recommendations.formation.lineup.midfielders && recommendations.formation.lineup.midfielders.length > 0 && (
                              <div>
                                <div className="text-emerald-400 text-sm mb-2">CENTROCAMPISTI</div>
                                <div className="flex justify-center gap-3 flex-wrap">
                                  {recommendations.formation.lineup.midfielders.map((player: any, i: number) => (
                                    <div key={i} className="text-center">
                                      <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mb-1">
                                        <span className="text-emerald-400 text-xs font-bold">C</span>
                                      </div>
                                      <div className="text-white text-xs">{player.name}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Defenders */}
                            {recommendations.formation.lineup.defenders && recommendations.formation.lineup.defenders.length > 0 && (
                              <div>
                                <div className="text-blue-400 text-sm mb-2">DIFENSORI</div>
                                <div className="flex justify-center gap-3 flex-wrap">
                                  {recommendations.formation.lineup.defenders.map((player: any, i: number) => (
                                    <div key={i} className="text-center">
                                      <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center mb-1">
                                        <span className="text-blue-400 text-xs font-bold">D</span>
                                      </div>
                                      <div className="text-white text-xs">{player.name}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Goalkeeper */}
                            {recommendations.formation.lineup.goalkeeper && (
                              <div>
                                <div className="text-purple-400 text-sm mb-2">PORTIERE</div>
                                <div className="flex justify-center">
                                  <div className="text-center">
                                    <div className="w-14 h-14 bg-purple-500/20 border border-purple-500/50 rounded-full flex items-center justify-center mb-1">
                                      <span className="text-purple-400 text-xs font-bold">P</span>
                                    </div>
                                    <div className="text-white text-xs font-medium">{recommendations.formation.lineup.goalkeeper.name}</div>
                                    <div className="text-xs text-slate-400">{recommendations.formation.lineup.goalkeeper.reason}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Loading State */}
            {!recommendations && analyzing && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-slate-400">🧠 GPT-4 sta analizzando la tua rosa...</p>
                  <p className="text-sm text-slate-500 mt-2">Creando analisi completa con priorità alle 3 punte</p>
                </CardContent>
              </Card>
            )}

            {/* Analysis Sections */}
            {recommendations?.analysis && (
              <div className="space-y-6">
                
                {/* Must Start Players */}
                {recommendations.analysis.mustStart && recommendations.analysis.mustStart.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                        ✅ MUST START
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Giocatori da schierare assolutamente (oltre alle 3 punte)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recommendations.analysis.mustStart.map((player: any, i: number) => (
                          <div key={i} className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <Badge className={getRoleColor(player.role || 'C')}>
                                    {player.role || 'N/A'}
                                  </Badge>
                                  <div>
                                    <div className="text-white font-bold">{player.name}</div>
                                    <div className="text-sm text-slate-400">{player.team}</div>
                                  </div>
                                </div>
                                <p className="text-slate-300 text-sm">{player.reason}</p>
                              </div>
                              {player.prediction && (
                                <div className="text-right ml-4">
                                  <div className="text-emerald-400 font-bold text-lg">{player.prediction}</div>
                                  {player.confidence && (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                                      {player.confidence}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommended Players */}
                {recommendations.analysis.recommended && recommendations.analysis.recommended.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-500" />
                        👍 CONSIGLIATI
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Buone opzioni da considerare
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recommendations.analysis.recommended.map((player: any, i: number) => (
                          <div key={i} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <Badge className={getRoleColor(player.role || 'C')}>
                                    {player.role || 'N/A'}
                                  </Badge>
                                  <div>
                                    <div className="text-white font-bold">{player.name}</div>
                                    <div className="text-sm text-slate-400">{player.team}</div>
                                  </div>
                                </div>
                                <p className="text-slate-300 text-sm">{player.reason}</p>
                              </div>
                              {player.prediction && (
                                <div className="text-right ml-4">
                                  <div className="text-blue-400 font-bold text-lg">{player.prediction}</div>
                                  {player.confidence && (
                                    <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                                      {player.confidence}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Doubts */}
                {recommendations.analysis.doubts && recommendations.analysis.doubts.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                        🤔 DUBBI
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Valuta attentamente questi giocatori
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recommendations.analysis.doubts.map((player: any, i: number) => (
                          <div key={i} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <Badge className={getRoleColor(player.role || 'C')}>
                                    {player.role || 'N/A'}
                                  </Badge>
                                  <div>
                                    <div className="text-white font-bold">{player.name}</div>
                                    <div className="text-sm text-slate-400">{player.team}</div>
                                  </div>
                                </div>
                                {player.pros && <p className="text-emerald-400 text-sm mb-1">✅ PRO: {player.pros}</p>}
                                {player.cons && <p className="text-red-400 text-sm">❌ CONTRO: {player.cons}</p>}
                              </div>
                              {player.prediction && (
                                <div className="text-right ml-4">
                                  <div className="text-yellow-400 font-bold text-lg">{player.prediction}</div>
                                  {player.confidence && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                      {player.confidence}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Players to Avoid */}
                {recommendations.analysis.avoid && recommendations.analysis.avoid.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        ⚠️ DA EVITARE
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Giocatori rischiosi per questa giornata
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recommendations.analysis.avoid.map((player: any, i: number) => (
                          <div key={i} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <Badge className={getRoleColor(player.role || 'C')}>
                                    {player.role || 'N/A'}
                                  </Badge>
                                  <div>
                                    <div className="text-white font-bold">{player.name}</div>
                                    <div className="text-sm text-slate-400">{player.team}</div>
                                  </div>
                                </div>
                                <p className="text-slate-300 text-sm">{player.reason}</p>
                              </div>
                              {player.risk && (
                                <Badge className="bg-red-500/20 text-red-400">
                                  {player.risk}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Refresh Button */}
            <div className="text-center">
              <Button 
                onClick={generateRecommendations}
                disabled={analyzing || roster.length === 0}
                variant="outline" 
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                🧠 Aggiorna Analisi (~2¢)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

