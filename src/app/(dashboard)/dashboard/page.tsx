'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Users, Target, Calendar, Clock, Trophy, Calculator, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

interface QuickMatch {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  league: string
  confidence: 'ALTA' | 'MEDIA' | 'BASSA'
  homeProb: number
}

export default function DashboardPage() {
  const [todayMatches, setTodayMatches] = useState<QuickMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching today's top matches
    setTimeout(() => {
      setTodayMatches([
        {
          id: 'mock-1',
          homeTeam: 'Juventus',
          awayTeam: 'Milan', 
          time: '20:45',
          league: 'Serie A',
          confidence: 'ALTA',
          homeProb: 52
        },
        {
          id: 'mock-2',
          homeTeam: 'Inter',
          awayTeam: 'Napoli',
          time: '18:00', 
          league: 'Serie A',
          confidence: 'MEDIA',
          homeProb: 45
        },
        {
          id: 'mock-3',
          homeTeam: 'Real Madrid',
          awayTeam: 'Barcelona',
          time: '21:00',
          league: 'La Liga', 
          confidence: 'ALTA',
          homeProb: 58
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const stats = [
    { label: 'Analisi Oggi', value: '24', change: '+12%', trend: 'up' },
    { label: 'Accuracy Media', value: '92.3%', change: '+2.1%', trend: 'up' },
    { label: 'Value Bets', value: '8', change: '+5', trend: 'up' },
    { label: 'Utenti Online', value: '2.4K', change: '+18%', trend: 'up' }
  ]

  const quickTools = [
    {
      title: 'Match Center',
      description: 'Analizza le partite di oggi',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/matches',
      color: 'emerald'
    },
    {
      title: 'FantaCoach', 
      description: 'Ottimizza la tua formazione',
      icon: <Trophy className="h-6 w-6" />,
      href: '/fantacoach',
      color: 'purple'
    },
    {
      title: 'Metodo AI',
      description: 'Calcolatori e strategie',
      icon: <Calculator className="h-6 w-6" />,
      href: '/metodo', 
      color: 'blue'
    }
  ]

  const recentInsights = [
    {
      type: 'value-bet',
      title: 'Value Bet Detected',
      description: 'Atalanta vs Bologna - Over 2.5 Goals',
      value: '+15.3%',
      time: '2 min fa'
    },
    {
      type: 'hot-tip',
      title: 'Hot Tip',
      description: 'Lookman in forma straordinaria',
      value: '8.2 predicted',
      time: '5 min fa'
    },
    {
      type: 'analysis',
      title: 'Match Analysis Ready',
      description: 'Inter vs Monza - Confidence ALTA',
      value: '78% win prob',
      time: '8 min fa'
    }
  ]

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

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center space-x-2 mb-8">
          <BarChart3 className="h-8 w-8 text-emerald-500" />
          <h1 className="text-3xl font-bold gradient-text">CalcioAI Dashboard</h1>
        </div>

        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border-emerald-500/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Benvenuto in CalcioAI 👋
                </h2>
                <p className="text-slate-300">
                  Oggi, {new Date().toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-sm">I tuoi crediti</div>
                <div className="text-2xl font-bold text-emerald-400">87</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 text-sm">{stat.label}</div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stat.change}
                    </div>
                    <TrendingUp className={`h-4 w-4 ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400 rotate-180'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Today's Top Matches */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-emerald-500" />
                    Partite in Evidenza Oggi
                  </CardTitle>
                  <Link href="/matches">
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                      Vedi tutto
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <CardDescription className="text-slate-400">
                  Le migliori opportunità selezionate dall'AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse bg-slate-800 h-16 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayMatches.map((match) => (
                      <div key={match.id} className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-white font-semibold">{match.homeTeam}</div>
                              <div className="text-slate-400 text-sm">vs</div>
                              <div className="text-white font-semibold">{match.awayTeam}</div>
                            </div>
                            <div className="text-slate-400">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{match.time}</span>
                              </div>
                              <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs mt-1">
                                {match.league}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-emerald-400 font-bold text-lg">{match.homeProb}%</div>
                              <div className="text-slate-400 text-xs">Casa</div>
                            </div>
                            {getConfidenceBadge(match.confidence)}
                            <Link href={`/matches/${match.id}`}>
                              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                                Analizza
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Insights */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="h-5 w-5 mr-2 text-emerald-500" />
                  Insights Recenti
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Le ultime analisi e opportunità rilevate dall'AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInsights.map((insight, i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 bg-slate-800 rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        insight.type === 'value-bet' ? 'bg-emerald-500/20 text-emerald-400' :
                        insight.type === 'hot-tip' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {insight.type === 'value-bet' ? '💰' : 
                         insight.type === 'hot-tip' ? '🔥' : '📊'}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{insight.title}</div>
                        <div className="text-slate-400 text-sm">{insight.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-semibold">{insight.value}</div>
                        <div className="text-slate-500 text-xs">{insight.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Quick Tools */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Strumenti Rapidi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickTools.map((tool, i) => (
                    <Link key={i} href={tool.href}>
                      <div className={`p-4 rounded-lg border cursor-pointer transition-all hover:-translate-y-1 ${
                        tool.color === 'emerald' ? 'bg-emerald-900/20 border-emerald-500/30 hover:border-emerald-500/50' :
                        tool.color === 'purple' ? 'bg-purple-900/20 border-purple-500/30 hover:border-purple-500/50' :
                        'bg-blue-900/20 border-blue-500/30 hover:border-blue-500/50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`${
                            tool.color === 'emerald' ? 'text-emerald-400' :
                            tool.color === 'purple' ? 'text-purple-400' :
                            'text-blue-400'
                          }`}>
                            {tool.icon}
                          </div>
                          <div>
                            <div className="text-white font-medium">{tool.title}</div>
                            <div className="text-slate-400 text-sm">{tool.description}</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-emerald-500" />
                  Programma Oggi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Serie A</span>
                    <span className="text-white font-semibold">6 partite</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Premier League</span>
                    <span className="text-white font-semibold">4 partite</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">La Liga</span>
                    <span className="text-white font-semibold">3 partite</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Champions League</span>
                    <span className="text-white font-semibold">2 partite</span>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-700">
                    <Link href="/matches">
                      <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800">
                        Vedi Tutte le Partite
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                  Performance AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Accuracy questa settimana</span>
                      <span className="text-emerald-400 font-semibold">94.2%</span>
                    </div>
                    <div className="mt-2 bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: '94.2%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Value bets identificate</span>
                      <span className="text-emerald-400 font-semibold">23</span>
                    </div>
                    <div className="mt-2 bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: '76%'}}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">ROI teorico</span>
                      <span className="text-emerald-400 font-semibold">+12.8%</span>
                    </div>
                    <div className="mt-2 bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: '64%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}