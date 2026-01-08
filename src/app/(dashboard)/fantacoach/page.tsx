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
  const [activeTab, setActiveTab] = useState<'roster' | 'lineup' | 'tips'>('roster')
  const [formation, setFormation] = useState('3-5-2')
  const [roster, setRoster] = useState<Player[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatedLineup, setGeneratedLineup] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
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
      if (data.players) {
        setAllPlayers(data.players)
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoading(false)
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

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
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
          // Mappa sigle squadre comuni
          const teamMap: Record<string, string[]> = {
            'ATA': ['Atalanta'],
            'BOL': ['Bologna'],
            'TOR': ['Torino'],
            'PIS': ['Juventus'], // Assuming PIS could be a typo for Juventus
            'JUV': ['Juventus'],
            'INT': ['Inter'],
            'CRE': ['Cremonese'],
            'MIL': ['Milan'],
            'CAG': ['Cagliari'],
            'LAZ': ['Lazio'],
            'COM': ['Como'],
            'NAP': ['Napoli'],
            'ROM': ['Roma'],
            'FIO': ['Fiorentina'],
            'UDI': ['Udinese'],
            'VER': ['Verona'],
            'GEN': ['Genoa'],
            'LEC': ['Lecce'],
            'MON': ['Monza'],
            'PAR': ['Parma'],
            'VEN': ['Venezia'],
            'EMP': ['Empoli']
          }
          
          // Cerca giocatore nei dati
          const player = allPlayers.find(p => {
            // Match del nome (più flessibile)
            const playerNameLower = p.name.toLowerCase().replace(/[^a-z ]/g, '')
            const searchNameLower = name.toLowerCase().replace(/[^a-z ]/g, '')
            
            const nameMatch = playerNameLower.includes(searchNameLower) || 
                             searchNameLower.includes(playerNameLower) ||
                             playerNameLower.split(' ').some(part => searchNameLower.includes(part))
            
            // Match della squadra (include sigle)
            let teamMatch = true
            if (team) {
              const possibleTeams = teamMap[team.toUpperCase()] || [team]
              teamMatch = possibleTeams.some(t => 
                p.team.toLowerCase().includes(t.toLowerCase()) || 
                t.toLowerCase().includes(p.team.toLowerCase())
              )
            }
            
            // Match del ruolo
            const roleMatch = !role || p.role === role
            
            return nameMatch && teamMatch && roleMatch
          })
            
            if (player) {
              // Evita duplicati
              if (!importedPlayers.find(ip => ip.id === player.id)) {
                importedPlayers.push(enrichPlayerData(player))
              }
            }
          }
        }
      })
      
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
        alert(`❌ Nessun giocatore riconosciuto nel file.\n\nFormati supportati:\n• CSV: "Nome,Ruolo,Squadra"\n• TXT: "Nome Ruolo Squadra" (uno per riga)\n• Fantacalcio.it export`)
      }
    }
    
    reader.readAsText(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
            onClick={() => setActiveTab('lineup')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'lineup'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Genera Formazione
          </button>
          <button
            onClick={() => {
              setActiveTab('tips')
              if (!recommendations) generateRecommendations()
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tips'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Chi Schierare
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
                  Importa la tua rosa da file CSV/TXT o aggiungila manualmente
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
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Giocatore
                  </Button>
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
                        {filteredPlayers.slice(0, 10).map(player => (
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

        {/* Lineup Generator Tab */}
        {activeTab === 'lineup' && (
          <div className="space-y-6">
            
            {/* Formation Selector */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="h-5 w-5 mr-2 text-emerald-500" />
                  Generatore Formazione AI
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Seleziona modulo e genera la formazione ottimale per questa giornata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                      Modulo
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
                    onClick={generateLineup}
                    disabled={roster.length < 11 || analyzing}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analizzando...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Genera Formazione (3 crediti)
                      </>
                    )}
                  </Button>
                  
                  {roster.length < 11 && (
                    <p className="text-sm text-red-400">
                      Aggiungi almeno 11 giocatori alla rosa per generare una formazione
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generated Lineup */}
            {generatedLineup && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    Formazione Consigliata - {formation}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Basata su: forma, avversario, probabilità titolarità, bonus/malus attesi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Captain & Vice */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="text-yellow-400 font-semibold mb-2">👑 CAPITANO</div>
                      <div className="text-white font-bold">{generatedLineup.captain?.name}</div>
                      <div className="text-sm text-slate-400">
                        {generatedLineup.captain?.reason}
                      </div>
                    </div>
                    
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <div className="text-slate-300 font-semibold mb-2">VICE-CAPITANO</div>
                      <div className="text-white font-bold">{generatedLineup.viceCaptain?.name}</div>
                      <div className="text-sm text-slate-400">
                        {generatedLineup.viceCaptain?.reason}
                      </div>
                    </div>
                  </div>

                  {/* Formation Visual */}
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-6">
                    <div className="text-center space-y-6">
                      <div className="text-emerald-400 font-semibold">FORMAZIONE {formation}</div>
                      
                      {/* Attackers */}
                      <div className="flex justify-center gap-8">
                        {generatedLineup.formation?.attackers?.map((player: any, i: number) => (
                          <div key={i} className="text-center">
                            <div className="w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mb-2">
                              <span className="text-red-400 text-xs font-bold">A</span>
                            </div>
                            <div className="text-white text-xs">{player.name}</div>
                          </div>
                        ))}
                      </div>

                      {/* Midfielders */}
                      <div className="flex justify-center gap-4">
                        {generatedLineup.formation?.midfielders?.map((player: any, i: number) => (
                          <div key={i} className="text-center">
                            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mb-1">
                              <span className="text-emerald-400 text-xs font-bold">C</span>
                            </div>
                            <div className="text-white text-xs">{player.name}</div>
                          </div>
                        ))}
                      </div>

                      {/* Defenders */}
                      <div className="flex justify-center gap-6">
                        {generatedLineup.formation?.defenders?.map((player: any, i: number) => (
                          <div key={i} className="text-center">
                            <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center mb-1">
                              <span className="text-blue-400 text-xs font-bold">D</span>
                            </div>
                            <div className="text-white text-xs">{player.name}</div>
                          </div>
                        ))}
                      </div>

                      {/* Goalkeeper */}
                      <div className="flex justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/50 rounded-full flex items-center justify-center mb-2">
                            <span className="text-purple-400 text-xs font-bold">P</span>
                          </div>
                          <div className="text-white text-xs">{generatedLineup.formation?.goalkeeper?.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bench */}
                  {generatedLineup.bench && generatedLineup.bench.length > 0 && (
                    <div>
                      <h4 className="text-white font-semibold mb-3">Panchina (ordine priorità)</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {generatedLineup.bench.map((player: any, i: number) => (
                          <div key={i} className="bg-slate-800 rounded p-3 text-center">
                            <div className="text-white font-medium">{player.name}</div>
                            <div className="text-slate-400 text-xs">{player.priority}° opzione</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tips & Recommendations Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-6">
            
            {!recommendations ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-slate-400">Analizzando la tua rosa...</p>
                  <p className="text-sm text-slate-500 mt-2">Questo potrebbe richiedere alcuni secondi</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Must Start Players */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                      ✅ MUST START
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Giocatori da schierare assolutamente questa giornata
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.mustStart?.map((player: any, i: number) => (
                        <div key={i} className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {i + 1}
                                </div>
                                <div>
                                  <div className="text-white font-bold">{player.name}</div>
                                  <div className="text-sm text-slate-400">{player.team}</div>
                                </div>
                              </div>
                              <p className="text-slate-300 text-sm">{player.reason}</p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-emerald-400 font-bold text-lg">{player.prediction}</div>
                              <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                                {player.confidence}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Doubts */}
                {recommendations.doubts && recommendations.doubts.length > 0 && (
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
                      <div className="space-y-4">
                        {recommendations.doubts.map((player: any, i: number) => (
                          <div key={i} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-white font-bold mb-2">{player.name}</div>
                                <p className="text-emerald-400 text-sm mb-1">✅ PRO: {player.pros}</p>
                                <p className="text-red-400 text-sm">❌ CONTRO: {player.cons}</p>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-yellow-400 font-bold text-lg">{player.prediction}</div>
                                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                  {player.confidence}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Players to Avoid */}
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
                    <div className="space-y-4">
                      {recommendations.avoid?.map((player: any, i: number) => (
                        <div key={i} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {i + 1}
                                </div>
                                <div>
                                  <div className="text-white font-bold">{player.name}</div>
                                  <div className="text-sm text-slate-400">{player.team}</div>
                                </div>
                              </div>
                              <p className="text-slate-300 text-sm">{player.reason}</p>
                            </div>
                            <Badge className="bg-red-500/20 text-red-400">
                              {player.risk}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
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
                Aggiorna Consigli (2 crediti)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}