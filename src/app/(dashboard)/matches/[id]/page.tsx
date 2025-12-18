'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, Users, Clock, MapPin, AlertTriangle, Target, BarChart3, Trophy, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface MatchAnalysis {
  match: {
    id: string
    homeTeam: { id: number; name: string; logo: string }
    awayTeam: { id: number; name: string; logo: string }
    date: string
    time: string
    venue: string
    league: string
  }
  predictions: {
    winner: { home: number; draw: number; away: number }
    goals: { over_2_5: number; under_2_5: number; btts: number }
    advice: string
    confidence: 'ALTA' | 'MEDIA' | 'BASSA'
  }
  headToHead: {
    homeWins: number
    draws: number
    awayWins: number
    totalGames: number
    avgGoals: string
    lastResult: { date: string; homeScore: number; awayScore: number }
  }
  form: {
    home: { last5: ('W'|'D'|'L')[]; points: number; trend: string; xG: number; xGA: number }
    away: { last5: ('W'|'D'|'L')[]; points: number; trend: string; xG: number; xGA: number }
  }
  injuries: Array<{
    team: 'home' | 'away'
    player: string
    status: 'out' | 'doubt'
    impact: 'high' | 'medium' | 'low'
  }>
  strategy: {
    suggestedBet: string
    valueRange: string
    solidMarket: string
    analysis: string
    alternatives: string[]
    valueBetCheck: string[]
  }
  aiReport?: string
}

export default function MatchAnalysisPage() {
  const params = useParams()
  const matchId = params.id as string
  
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [regeneratingReport, setRegeneratingReport] = useState(false)

  useEffect(() => {
    fetchAnalysis()
  }, [matchId])

  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/matches/${matchId}`)
      const data = await response.json()
      
      // Add mock additional data for complete analysis
      const completeData: MatchAnalysis = {
        ...data,
        match: {
          ...data.match,
          date: new Date().toISOString().split('T')[0],
          time: '20:45',
          venue: 'Allianz Stadium, Torino',
          league: 'Serie A'
        },
        form: {
          home: {
            last5: ['W', 'W', 'D', 'L', 'W'],
            points: 10,
            trend: 'In crescita',
            xG: 1.8,
            xGA: 1.2
          },
          away: {
            last5: ['L', 'W', 'W', 'D', 'L'],
            points: 7,
            trend: 'Stabile', 
            xG: 1.5,
            xGA: 1.4
          }
        },
        predictions: {
          ...data.predictions,
          goals: {
            over_2_5: 62,
            under_2_5: 38,
            btts: 58
          }
        }
      }
      
      setAnalysis(completeData)
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const regenerateReport = async () => {
    setRegeneratingReport(true)
    // Simulate AI report generation
    setTimeout(() => {
      if (analysis) {
        setAnalysis({
          ...analysis,
          aiReport: "Il match Juventus vs Milan si preannuncia equilibrato con un leggero favore per i padroni di casa. La Juventus arriva da una serie positiva con 10 punti nelle ultime 5, mentre il Milan ha mostrato alti e bassi. I dati xG evidenziano una maggiore solidità difensiva della Juve (1.2 xGA vs 1.4). L'assenza di Chiesa potrebbe influire sull'attacco bianconero, ma la statistica sui precedenti (12W-5D-8L) sorride alla squadra di Allegri. Il mercato più interessante appare la doppia chance 1X, con valore se quota sopra 1.28."
        })
      }
      setRegeneratingReport(false)
    }, 2000)
  }

  const getFormBadge = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return <span className="bg-emerald-500 text-white px-2 py-1 rounded text-xs">V</span>
      case 'D': return <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs">P</span>
      case 'L': return <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">S</span>
    }
  }

  const getInjuryIcon = (status: string) => {
    return status === 'out' ? '🔴' : '🟡'
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'ALTA':
        return <Badge variant="alta">ALTA</Badge>
      case 'MEDIA':
        return <Badge variant="media">MEDIA</Badge>
      default:
        return <Badge variant="bassa">BASSA</Badge>
    }
  }

  const otherMarkets = [
    { market: 'Over 2.5', prob: analysis?.predictions.goals.over_2_5 || 62, confidence: 'MEDIA' },
    { market: 'Under 2.5', prob: analysis?.predictions.goals.under_2_5 || 38, confidence: '-' },
    { market: 'Goal (BTTS)', prob: analysis?.predictions.goals.btts || 58, confidence: 'MEDIA' },
    { market: 'NoGoal', prob: 100 - (analysis?.predictions.goals.btts || 58), confidence: '-' },
    { market: 'Over 1.5', prob: 78, confidence: 'ALTA' },
    { market: 'Multigol 2-4', prob: 54, confidence: 'MEDIA' },
    { market: '1X', prob: 78, confidence: 'ALTA' },
    { market: 'X2', prob: 48, confidence: '-' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-32 bg-slate-800 rounded-lg mb-6"></div>
            <div className="grid lg:grid-cols-4 gap-6 mb-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-40 bg-slate-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Analisi non trovata</h1>
          <Link href="/matches">
            <Button>Torna alle partite</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/matches">
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle partite
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
            <span className="text-slate-400">Analisi Completa</span>
          </div>
        </div>

        {/* Match Header */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {analysis.match.league}
              </Badge>
              {getConfidenceBadge(analysis.predictions.confidence)}
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Home Team */}
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {analysis.match.homeTeam.name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">{analysis.match.homeTeam.name}</h2>
              </div>

              {/* Match Info */}
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-400 mb-2">VS</div>
                <div className="space-y-1 text-slate-400">
                  <div className="flex items-center justify-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{analysis.match.time}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{analysis.match.venue}</span>
                  </div>
                </div>
              </div>

              {/* Away Team */}
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {analysis.match.awayTeam.name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">{analysis.match.awayTeam.name}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Predictions */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-center">Probabilità Principale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-slate-400 mb-2">HOME WIN</div>
                <div className="text-3xl font-bold text-emerald-400 mb-2">{analysis.predictions.winner.home}%</div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-emerald-500 h-3 rounded-full" 
                    style={{ width: `${analysis.predictions.winner.home}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-slate-400 mb-2">DRAW</div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">{analysis.predictions.winner.draw}%</div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-yellow-500 h-3 rounded-full" 
                    style={{ width: `${analysis.predictions.winner.draw}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-slate-400 mb-2">AWAY WIN</div>
                <div className="text-3xl font-bold text-red-400 mb-2">{analysis.predictions.winner.away}%</div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full" 
                    style={{ width: `${analysis.predictions.winner.away}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          
          {/* Expected Goals */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="h-5 w-5 mr-2 text-emerald-500" />
                Expected Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">xG Stagionale</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{analysis.form.home.xG}</span>
                  <span className="text-slate-400">vs</span>
                  <span className="font-semibold text-white">{analysis.form.away.xG}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">xGA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{analysis.form.home.xGA}</span>
                  <span className="text-slate-400">vs</span>
                  <span className="font-semibold text-white">{analysis.form.away.xGA}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-700">
                <div className="text-xs text-slate-400">
                  Confronto offensivo/difensivo tra le squadre
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                Forma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-2">{analysis.match.homeTeam.name}</div>
                <div className="flex space-x-1 mb-1">
                  {analysis.form.home.last5.map((result, i) => (
                    <div key={i}>{getFormBadge(result)}</div>
                  ))}
                </div>
                <div className="text-xs text-slate-400">Punti: {analysis.form.home.points}/15 - {analysis.form.home.trend}</div>
              </div>
              
              <div>
                <div className="text-sm text-slate-400 mb-2">{analysis.match.awayTeam.name}</div>
                <div className="flex space-x-1 mb-1">
                  {analysis.form.away.last5.map((result, i) => (
                    <div key={i}>{getFormBadge(result)}</div>
                  ))}
                </div>
                <div className="text-xs text-slate-400">Punti: {analysis.form.away.points}/15 - {analysis.form.away.trend}</div>
              </div>
            </CardContent>
          </Card>

          {/* Head to Head */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-emerald-500" />
                Head to Head
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{analysis.headToHead.homeWins}</div>
                  <div className="text-xs text-slate-400">Vittorie Casa</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{analysis.headToHead.draws}</div>
                  <div className="text-xs text-slate-400">Pareggi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{analysis.headToHead.awayWins}</div>
                  <div className="text-xs text-slate-400">Vittorie Ospite</div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Ultimo: {analysis.headToHead.lastResult.homeScore}-{analysis.headToHead.lastResult.awayScore}
                </div>
                <div className="text-xs text-slate-400">
                  Media gol: {analysis.headToHead.avgGoals} per partita
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Injuries */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-emerald-500" />
                Assenze
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.injuries.length > 0 ? (
                <div className="space-y-3">
                  {analysis.injuries.map((injury, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{injury.player}</div>
                        <div className="text-xs text-slate-400">
                          {injury.team === 'home' ? analysis.match.homeTeam.name : analysis.match.awayTeam.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div>{getInjuryIcon(injury.status)}</div>
                        <div className="text-xs text-slate-400">{injury.status === 'out' ? 'Out' : 'Dubbio'}</div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-700">
                    <div className="text-xs text-slate-400">Impatto stimato: ALTO</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-4">
                  <Trophy className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm">Nessuna assenza rilevante</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Other Markets */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Altri Mercati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherMarkets.map((market, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-800 rounded">
                  <span className="text-white">{market.market}</span>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold">{market.prob}%</div>
                    {market.confidence !== '-' && (
                      <div className="text-xs text-slate-400">{market.confidence}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strategy AI */}
        <Card className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border-emerald-500/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-xl">
              🎯 STRATEGIA AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-300">Tipo giocata consigliata:</span>
                  <span className="ml-2 font-bold text-emerald-400">{analysis.strategy.suggestedBet}</span>
                </div>
                <div>
                  <span className="text-slate-300">Range quota value:</span>
                  <span className="ml-2 font-bold text-emerald-400">{analysis.strategy.valueRange}</span>
                </div>
                <div>
                  <span className="text-slate-300">Mercato più solido:</span>
                  <span className="ml-2 font-bold text-emerald-400">{analysis.strategy.solidMarket}</span>
                </div>
              </div>
              
              <div>
                <div className="text-slate-300 mb-2">💡 Analisi:</div>
                <p className="text-white text-sm leading-relaxed">
                  {analysis.strategy.analysis}
                </p>
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-4">
              <div className="text-slate-300 mb-3">📊 Opzioni alternative:</div>
              <div className="space-y-1">
                {analysis.strategy.alternatives.map((alt, i) => (
                  <div key={i} className="text-sm text-slate-400">• {alt}</div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-4">
              <div className="text-slate-300 mb-3">⚠️ Value Bet Check:</div>
              <div className="space-y-1">
                {analysis.strategy.valueBetCheck.map((check, i) => (
                  <div key={i} className="text-sm text-emerald-400">✅ {check}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Report */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Report Narrativo AI</CardTitle>
              <Button 
                onClick={regenerateReport}
                disabled={regeneratingReport}
                variant="outline"
                size="sm"
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                {regeneratingReport ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Rigenera (1 credito)
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {analysis.aiReport ? (
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-300 leading-relaxed">{analysis.aiReport}</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Button 
                  onClick={regenerateReport}
                  disabled={regeneratingReport}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500"
                >
                  {regeneratingReport ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generando report AI...
                    </>
                  ) : (
                    'Genera Report AI (1 credito)'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}