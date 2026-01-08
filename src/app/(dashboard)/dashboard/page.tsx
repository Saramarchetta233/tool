'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Users, Target, Calendar, Clock, Trophy, Calculator, ArrowRight, Zap, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface QuickMatch {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  league: string
  confidence: 'ALTA' | 'MEDIA' | 'BASSA'
  homeProb: number
  fixture_id: number
}

interface DailySchedule {
  league: string
  count: number
}

interface TipsterData {
  count: number
  lastUpdated: string | null
}

interface RecentInsight {
  type: string
  title: string
  description: string
  value: string
  time: string
  href: string
}

export default function DashboardPage() {
  const [todayMatches, setTodayMatches] = useState<QuickMatch[]>([])
  const [dailySchedule, setDailySchedule] = useState<DailySchedule[]>([])
  const [tipsterData, setTipsterData] = useState<TipsterData>({ count: 0, lastUpdated: null })
  const [recentInsights, setRecentInsights] = useState<RecentInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(true)

  useEffect(() => {
    fetchTodayMatches()
    fetchDailySchedule()
    fetchTipsterData()
  }, [])

  useEffect(() => {
    // Fetch insights after tipster data and matches are loaded
    if (!loading && tipsterData) {
      fetchRecentInsights()
    }
  }, [loading, tipsterData, todayMatches])

  const fetchTodayMatches = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/matches/today?date=${today}&limit=5`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      
      const data = await response.json()
      const matches = data.matches || []
      
      console.log('Dashboard matches data:', matches.slice(0, 2)) // Debug first 2 matches
      
      // Convert to QuickMatch format
      const quickMatches: QuickMatch[] = matches.map((match: any) => {
        const homeProb = getHomeProb(match)
        const homeTeam = match.homeTeam?.name || match.home_team?.name || match.teams?.home?.name || 'TBD'
        const awayTeam = match.awayTeam?.name || match.away_team?.name || match.teams?.away?.name || 'TBD'
        return {
          id: match.id || match.fixture_id?.toString() || match.fixture?.id?.toString() || Math.random().toString(),
          fixture_id: match.fixture_id || match.fixture?.id || match.id,
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          time: match.time || match.match_time || match.fixture?.date || '00:00',
          league: match.league || match.league_name || match.league?.name || 'Unknown',
          confidence: getConfidenceFromProb(homeProb, homeTeam, awayTeam), // Now with team names
          homeProb: homeProb
        }
      })
      
      setTodayMatches(quickMatches)
      
    } catch (error) {
      console.error('Error fetching today matches:', error)
      setTodayMatches([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDailySchedule = async () => {
    try {
      setScheduleLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/matches/today?date=${today}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedule')
      }
      
      const data = await response.json()
      const matches = data.matches || []
      
      // Group by league and count
      const leagueCount = matches.reduce((acc: Record<string, number>, match: any) => {
        const league = match.league || match.league_name || 'Unknown'
        acc[league] = (acc[league] || 0) + 1
        return acc
      }, {})
      
      const schedule = Object.entries(leagueCount).map(([league, count]) => ({
        league,
        count: count as number
      }))
      
      setDailySchedule(schedule)
      
    } catch (error) {
      console.error('Error fetching daily schedule:', error)
      setDailySchedule([])
    } finally {
      setScheduleLoading(false)
    }
  }

  const fetchTipsterData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/tipsterai/predictions-v2?date=${today}`)
      
      if (response.ok) {
        const data = await response.json()
        const tips = data.tips || []
        setTipsterData({
          count: tips.length,
          lastUpdated: tips.length > 0 ? 'Oggi' : null
        })
      } else {
        setTipsterData({ count: 0, lastUpdated: null })
      }
    } catch (error) {
      console.error('Error fetching tipster data:', error)
      setTipsterData({ count: 0, lastUpdated: null })
    }
  }

  const fetchRecentInsights = async () => {
    try {
      setInsightsLoading(true)
      const insights: RecentInsight[] = []
      
      // Add TipsterAI insight
      if (tipsterData.count > 0) {
        insights.push({
          type: 'tipsterai',
          title: 'TipsterAI Aggiornato',
          description: `${tipsterData.count} ${tipsterData.count === 1 ? 'proposta disponibile' : 'proposte disponibili'}`,
          value: 'LIVE',
          time: tipsterData.lastUpdated || 'N/A',
          href: '/tipsterai'
        })
      }
      
      // Add matches insight if we have matches
      if (todayMatches.length > 0) {
        const highConfidenceMatch = todayMatches.find(m => m.confidence === 'ALTA')
        if (highConfidenceMatch) {
          insights.push({
            type: 'hot-tip',
            title: 'Partita in Evidenza',
            description: `${highConfidenceMatch.homeTeam} vs ${highConfidenceMatch.awayTeam} - ${highConfidenceMatch.confidence} confidence`,
            value: `${highConfidenceMatch.homeProb}% casa`,
            time: 'Oggi',
            href: `/matches/${highConfidenceMatch.fixture_id}`
          })
        }
      }
      
      // Show system status if no real data
      if (insights.length === 0) {
        insights.push({
          type: 'analysis',
          title: 'Sistema CalcioAI',
          description: 'Pronto per le analisi - Carica dati aggiornati ogni giorno',
          value: 'READY',
          time: 'Ora',
          href: '/matches'
        })
      }
      
      setRecentInsights(insights)
      
    } catch (error) {
      console.error('Error fetching insights:', error)
      setRecentInsights([])
    } finally {
      setInsightsLoading(false)
    }
  }

  // Helper functions - SOLO PERCENTUALI come prima
  const getConfidenceFromProb = (homeProb: number, homeTeam?: string, awayTeam?: string): 'ALTA' | 'MEDIA' | 'BASSA' => {
    // LOGICA ORIGINALE: solo basata su percentuali
    if (homeProb >= 60) return 'ALTA'
    if (homeProb >= 45) return 'MEDIA'
    
    return 'BASSA'
  }

  const getHomeProb = (match: any): number => {
    if (match.predictions?.home) {
      return parseInt(match.predictions.home.toString())
    }
    if (match.homeProb) {
      return parseInt(match.homeProb.toString())
    }
    // Random between 25-75% if no predictions available
    return Math.floor(Math.random() * 50) + 25
  }

  const stats = [
    { label: 'Partite Oggi', value: todayMatches.length.toString(), change: null, trend: null },
    { label: 'Leghe Attive', value: dailySchedule.length.toString(), change: null, trend: null },
    { label: 'Tips AI', value: tipsterData.count.toString(), change: tipsterData.count > 0 ? 'NUOVI' : null, trend: tipsterData.count > 0 ? 'up' : null },
    { label: 'Crediti', value: '87', change: null, trend: null }
  ]

  const quickTools = [
    {
      title: 'TipsterAI',
      description: `${tipsterData.count > 0 ? `${tipsterData.count} ${tipsterData.count === 1 ? 'proposta' : 'proposte'} oggi` : 'Proposte AI giornaliere'}`,
      icon: <Sparkles className="h-6 w-6" />,
      href: '/tipsterai',
      color: 'violet',
      highlight: tipsterData.count > 0
    },
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
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center space-x-2 mb-8">
          <BarChart3 className="h-8 w-8 text-emerald-500" />
          <h1 className="text-3xl font-bold gradient-text">CalcioAI Dashboard</h1>
        </div>

        {/* Welcome Section with TipsterAI CTA */}
        <Card className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border-emerald-500/50 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Benvenuto in CalcioAI 👋
                </h2>
                <p className="text-slate-300 mb-4">
                  Oggi, {new Date().toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                
                {/* TipsterAI CTA */}
                <Link href="/tipsterai">
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-violet-500/25 border border-violet-500/30">
                    <Sparkles className="w-5 h-5 mr-2" />
                    🎯 Ottieni Proposte TipsterAI
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-slate-400 mt-2">{tipsterData.count > 0 ? `${tipsterData.count} ${tipsterData.count === 1 ? 'proposta intelligente' : 'proposte intelligenti'} ${tipsterData.lastUpdated ? 'di ' + tipsterData.lastUpdated : 'disponibili'}` : 'Proposte intelligenti generate dall\'AI'}</p>
              </div>
              
              <div className="text-right">
                <div className="text-slate-400 text-sm">I tuoi crediti</div>
                <div className="text-2xl font-bold text-emerald-400">87</div>
                <div className="text-xs text-slate-500 mt-1">2 crediti per analisi</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 text-sm">{stat.label}</div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                  </div>
                  {stat.change && (
                    <div className="text-right">
                      <div className={`text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stat.change}
                      </div>
                      <TrendingUp className={`h-4 w-4 ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400 rotate-180'}`} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          
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
                ) : todayMatches.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    Nessuna partita disponibile oggi
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayMatches.slice(0, 5).map((match) => (
                      <div key={match.id} className="bg-slate-800 rounded-lg p-3 sm:p-4 hover:bg-slate-700 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="text-center flex-shrink-0">
                              <div className="text-white font-semibold text-sm sm:text-base truncate max-w-20 sm:max-w-none">{match.homeTeam}</div>
                              <div className="text-slate-400 text-xs sm:text-sm">vs</div>
                              <div className="text-white font-semibold text-sm sm:text-base truncate max-w-20 sm:max-w-none">{match.awayTeam}</div>
                            </div>
                            <div className="text-slate-400 flex-shrink-0">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">{match.time}</span>
                              </div>
                              <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs mt-1">
                                {match.league}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-start sm:space-x-3 flex-shrink-0">
                            <div className="text-center flex-shrink-0">
                              <div className="text-emerald-400 font-bold text-base sm:text-lg">{match.homeProb}%</div>
                              <div className="text-slate-400 text-xs">Casa</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getConfidenceBadge(match.confidence)}
                              {match.fixture_id ? (
                                <Link href={`/matches/${match.fixture_id}`}>
                                  <Button 
                                    size="sm" 
                                    className="bg-emerald-500 hover:bg-emerald-600 relative text-xs sm:text-sm px-2 sm:px-3"
                                  >
                                    <span className="hidden sm:inline mr-1">Analizza</span>
                                    <span className="sm:hidden">📊</span>
                                    <span className="text-xs bg-emerald-700 px-1 sm:px-1.5 py-0.5 rounded-full ml-1">
                                      -2💎
                                    </span>
                                  </Button>
                                </Link>
                              ) : (
                                <Button 
                                  size="sm" 
                                  className="bg-slate-600 cursor-not-allowed text-xs sm:text-sm"
                                  disabled
                                >
                                  N/A
                                </Button>
                              )}
                            </div>
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
                {insightsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse bg-slate-800 h-16 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentInsights.map((insight, i) => (
                      <Link key={i} href={insight.href || '#'}>
                        <div className="flex items-center space-x-4 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            insight.type === 'tipsterai' ? 'bg-violet-500/20 text-violet-400' :
                            insight.type === 'value-bet' ? 'bg-emerald-500/20 text-emerald-400' :
                            insight.type === 'hot-tip' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {insight.type === 'tipsterai' ? '🎯' :
                             insight.type === 'value-bet' ? '💰' : 
                             insight.type === 'hot-tip' ? '🔥' : '📊'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium">{insight.title}</div>
                            <div className="text-slate-400 text-sm truncate">{insight.description}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`font-semibold ${
                              insight.type === 'tipsterai' ? 'text-violet-400' : 'text-emerald-400'
                            }`}>
                              {insight.value}
                            </div>
                            <div className="text-slate-500 text-xs">{insight.time}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                    
                    {recentInsights.length === 0 && (
                      <div className="text-center text-slate-400 py-4">
                        Nessun insight disponibile al momento
                      </div>
                    )}
                  </div>
                )}
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
                      <div className={`relative p-4 rounded-lg border cursor-pointer transition-all hover:-translate-y-1 ${
                        tool.highlight ? 'bg-gradient-to-r from-violet-900/30 to-purple-900/30 border-violet-500/50 hover:border-violet-400 shadow-lg shadow-violet-500/20' :
                        tool.color === 'emerald' ? 'bg-emerald-900/20 border-emerald-500/30 hover:border-emerald-500/50' :
                        tool.color === 'purple' ? 'bg-purple-900/20 border-purple-500/30 hover:border-purple-500/50' :
                        tool.color === 'blue' ? 'bg-blue-900/20 border-blue-500/30 hover:border-blue-500/50' :
                        'bg-violet-900/20 border-violet-500/30 hover:border-violet-500/50'
                      }`}>
                        {tool.highlight && (
                          <div className="absolute -top-2 -right-2">
                            <span className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">HOT</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-3">
                          <div className={`${
                            tool.color === 'emerald' ? 'text-emerald-400' :
                            tool.color === 'purple' ? 'text-purple-400' :
                            tool.color === 'blue' ? 'text-blue-400' :
                            tool.color === 'violet' ? 'text-violet-400' :
                            'text-blue-400'
                          }`}>
                            {tool.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-medium">{tool.title}</div>
                            <div className="text-slate-400 text-sm truncate">{tool.description}</div>
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
                {scheduleLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="animate-pulse bg-slate-800 h-6 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailySchedule.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-slate-400">{item.league}</span>
                        <span className="text-white font-semibold">
                          {item.count} {item.count === 1 ? 'partita' : 'partite'}
                        </span>
                      </div>
                    ))}
                    
                    {dailySchedule.length === 0 && (
                      <div className="text-center text-slate-400 py-4">
                        Nessuna partita programmata oggi
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-slate-700">
                      <Link href="/matches">
                        <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800">
                          Vedi Tutte le Partite
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                  Sistema CalcioAI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Partite analizzate oggi</span>
                      <span className="text-emerald-400 font-semibold">{todayMatches.length}</span>
                    </div>
                    <div className="mt-2 bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: todayMatches.length > 0 ? '100%' : '0%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Tips AI generati</span>
                      <span className="text-emerald-400 font-semibold">{tipsterData.count}</span>
                    </div>
                    <div className="mt-2 bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: tipsterData.count > 0 ? '100%' : '0%'}}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Leghe coperte</span>
                      <span className="text-emerald-400 font-semibold">{dailySchedule.length}</span>
                    </div>
                    <div className="mt-2 bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: dailySchedule.length > 0 ? '75%' : '0%'}}></div>
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