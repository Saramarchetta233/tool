'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Target, TrendingUp, Shield, AlertTriangle, Plus, Download, Upload, BarChart3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Player {
  id: string
  name: string
  role: 'P' | 'D' | 'C' | 'A'
  team: string
  avgRating: number
  lastGames: number[]
  ownership: number
  nextOpponent: string
  difficulty: 'easy' | 'medium' | 'hard'
  prediction: number
}

export default function FantaCoachPage() {
  const [activeTab, setActiveTab] = useState<'roster' | 'lineup' | 'tips'>('roster')
  const [formation, setFormation] = useState('3-5-2')
  
  // Mock data for demonstration
  const mockRoster: Player[] = [
    {
      id: '1',
      name: 'Mike Maignan',
      role: 'P',
      team: 'Milan',
      avgRating: 6.8,
      lastGames: [7.5, 6.0, 7.0, 6.5, 8.0],
      ownership: 45,
      nextOpponent: 'Juventus (C)',
      difficulty: 'hard',
      prediction: 6.2
    },
    {
      id: '2', 
      name: 'Alessandro Bastoni',
      role: 'D',
      team: 'Inter',
      avgRating: 6.9,
      lastGames: [7.0, 6.5, 7.5, 6.0, 7.0],
      ownership: 78,
      nextOpponent: 'Monza (C)',
      difficulty: 'easy',
      prediction: 7.2
    },
    {
      id: '3',
      name: 'Khvicha Kvaratskhelia',
      role: 'A',
      team: 'Napoli',
      avgRating: 7.2,
      lastGames: [8.0, 6.5, 7.5, 7.0, 6.0],
      ownership: 92,
      nextOpponent: 'Roma (F)',
      difficulty: 'medium',
      prediction: 7.5
    },
    {
      id: '4',
      name: 'Nicolò Barella',
      role: 'C',
      team: 'Inter',
      avgRating: 6.8,
      lastGames: [7.0, 6.0, 7.5, 6.5, 7.0],
      ownership: 65,
      nextOpponent: 'Monza (C)',
      difficulty: 'easy',
      prediction: 7.0
    },
    {
      id: '5',
      name: 'Dusan Vlahovic',
      role: 'A',
      team: 'Juventus',
      avgRating: 6.5,
      lastGames: [6.0, 5.5, 7.0, 6.5, 6.0],
      ownership: 55,
      nextOpponent: 'Milan (F)',
      difficulty: 'hard',
      prediction: 6.0
    }
  ]

  const formations = ['3-5-2', '3-4-3', '4-3-3', '4-4-2', '4-5-1']

  const getDifficultyColor = (difficulty: string) => {
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

  const mustStart = [
    {
      name: 'Lookman',
      team: 'Atalanta',
      reason: 'Forma straordinaria, 3 gol in 4 partite, match facile vs Bologna (C)',
      prediction: 8.2,
      confidence: 'ALTA'
    },
    {
      name: 'Calhanoglu', 
      team: 'Inter',
      reason: 'Rigorista, casa vs Bologna, media 7.1 stagionale',
      prediction: 7.8,
      confidence: 'ALTA'
    },
    {
      name: 'Thuram',
      team: 'Inter', 
      reason: 'xG altissimo, coppia letale con Lautaro vs difesa debole',
      prediction: 7.5,
      confidence: 'MEDIA'
    }
  ]

  const avoidPlayers = [
    {
      name: 'Vlahovic',
      team: 'Juventus',
      reason: 'Dubbio convocazione, rischio panchina 60%',
      risk: 'ALTO'
    },
    {
      name: 'Koopmeiners',
      team: 'Juventus', 
      reason: 'Calo forma evidente, 5.5 ultima partita',
      risk: 'MEDIO'
    },
    {
      name: 'Theo Hernandez',
      team: 'Milan',
      reason: 'Diffidato + trasferta difficile vs Roma',
      risk: 'MEDIO'
    }
  ]

  const cleanSheets = [
    { team: 'Inter', opponent: 'Monza (C)', probability: 78, prediction: 'ALTA' },
    { team: 'Atalanta', opponent: 'Bologna (C)', probability: 65, prediction: 'MEDIA' },
    { team: 'Napoli', opponent: 'Lecce (C)', probability: 62, prediction: 'MEDIA' },
    { team: 'Milan', opponent: 'Juventus (F)', probability: 35, prediction: 'BASSA' },
    { team: 'Roma', opponent: 'Lazio (F)', probability: 32, prediction: 'BASSA' }
  ]

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/">
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
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
            onClick={() => setActiveTab('tips')}
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
                  Importa la tua rosa o aggiungila manualmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
                    <Upload className="h-4 w-4 mr-2" />
                    Importa CSV (Fantacalcio.it)
                  </Button>
                  <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                    <Download className="h-4 w-4 mr-2" />
                    Esporta Rosa
                  </Button>
                  <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Giocatore
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Players List */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Rosa Attuale ({mockRoster.length} giocatori)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRoster.map((player) => (
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
                          <div className="text-white font-semibold">
                            {player.lastGames[player.lastGames.length - 1]}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-400">Possesso</div>
                          <div className="text-white font-semibold">{player.ownership}%</div>
                        </div>
                        <div className="text-center min-w-0">
                          <div className="text-slate-400">Prossimo</div>
                          <Badge className={getDifficultyColor(player.difficulty)}>
                            {player.nextOpponent}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                    <div className="flex space-x-2">
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

                  <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Genera Formazione (3 crediti)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sample Generated Lineup */}
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
                    <div className="text-white font-bold">Khvicha Kvaratskhelia</div>
                    <div className="text-sm text-slate-400">
                      Napoli vs Roma (F) - Forma eccellente, match da gol
                    </div>
                  </div>
                  
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="text-slate-300 font-semibold mb-2">VICE-CAPITANO</div>
                    <div className="text-white font-bold">Alessandro Bastoni</div>
                    <div className="text-sm text-slate-400">
                      Inter vs Monza (C) - Clean sheet probabile + assist
                    </div>
                  </div>
                </div>

                {/* Formation Visual */}
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <div className="text-emerald-400 font-semibold">FORMAZIONE 3-5-2</div>
                    
                    {/* Attackers */}
                    <div className="flex justify-center space-x-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mb-2">
                          <span className="text-red-400 text-xs font-bold">A</span>
                        </div>
                        <div className="text-white text-xs">Kvaratskhelia</div>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mb-2">
                          <span className="text-red-400 text-xs font-bold">A</span>
                        </div>
                        <div className="text-white text-xs">Lookman</div>
                      </div>
                    </div>

                    {/* Midfielders */}
                    <div className="flex justify-center space-x-4">
                      {['Barella', 'Calhanoglu', 'Koopmeiners', 'Pellegrini', 'Frattesi'].map((name, i) => (
                        <div key={i} className="text-center">
                          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mb-1">
                            <span className="text-emerald-400 text-xs font-bold">C</span>
                          </div>
                          <div className="text-white text-xs">{name}</div>
                        </div>
                      ))}
                    </div>

                    {/* Defenders */}
                    <div className="flex justify-center space-x-6">
                      {['Bastoni', 'Bremer', 'Di Lorenzo'].map((name, i) => (
                        <div key={i} className="text-center">
                          <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center mb-1">
                            <span className="text-blue-400 text-xs font-bold">D</span>
                          </div>
                          <div className="text-white text-xs">{name}</div>
                        </div>
                      ))}
                    </div>

                    {/* Goalkeeper */}
                    <div className="flex justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/50 rounded-full flex items-center justify-center mb-2">
                          <span className="text-purple-400 text-xs font-bold">P</span>
                        </div>
                        <div className="text-white text-xs">Maignan</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bench */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Panchina (ordine priorità)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Vlahovic', role: 'A', priority: '1°' },
                      { name: 'Theo Hernandez', role: 'D', priority: '2°' },
                      { name: 'Zaniolo', role: 'C', priority: '3°' }
                    ].map((player, i) => (
                      <div key={i} className="bg-slate-800 rounded p-3 text-center">
                        <Badge className={getRoleColor(player.role)}>
                          {player.role}
                        </Badge>
                        <div className="text-white font-medium mt-1">{player.name}</div>
                        <div className="text-slate-400 text-xs">{player.priority}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tips & Recommendations Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-6">
            
            {/* Must Start Players */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                  ✅ MUST START (Top 3)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Giocatori da schierare assolutamente questa giornata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mustStart.map((player, i) => (
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

            {/* Players to Avoid */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  ⚠️ EVITA (Top 3)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Giocatori rischiosi per questa giornata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {avoidPlayers.map((player, i) => (
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

            {/* Clean Sheet Probabilities */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-emerald-500" />
                  Probabilità Clean Sheet
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Difese ordinate per probabilità di porta inviolata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cleanSheets.map((team, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="text-white font-semibold">{i + 1}.</div>
                        <div>
                          <div className="text-white font-medium">{team.team}</div>
                          <div className="text-sm text-slate-400">{team.opponent}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold">{team.probability}%</div>
                        <Badge 
                          className={
                            team.prediction === 'ALTA' ? 'bg-emerald-500/20 text-emerald-400' :
                            team.prediction === 'MEDIA' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }
                        >
                          {team.prediction}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="text-sm text-slate-400 space-y-1">
                  <div><strong>Legenda:</strong></div>
                  <div>• (C) = Casa | (F) = Fuori</div>
                  <div>• Predizione voto basata su: forma, avversario, statistiche xG, turnover risk</div>
                  <div>• I consigli sono generati dall'AI e non garantiscono risultati</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}