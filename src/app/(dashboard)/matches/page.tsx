'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, MapPin, BarChart3, TrendingUp, Users, Search, Filter, X } from 'lucide-react'
import Link from 'next/link'

interface Match {
  id: string
  league: string
  date: string
  time: string
  venue: string
  homeTeam: {
    name: string
    logo: string
  }
  awayTeam: {
    name: string
    logo: string
  }
  predictions?: {
    home: number
    draw: number
    away: number
    confidence: 'ALTA' | 'MEDIA' | 'BASSA'
    advice?: string
  }
}

// Traduzione pronostici in italiano
function translateAdvice(advice: string): string {
  if (!advice) return 'Nessun consiglio disponibile'
  
  let translated = advice
    // Base translations
    .replace(/Double chance/gi, 'Doppia chance')
    .replace(/Combo/gi, 'Combo')
    .replace(/Under/gi, 'Under')
    .replace(/Over/gi, 'Over')
    .replace(/goals?/gi, 'gol')
    .replace(/goal/gi, 'gol')
    .replace(/and/gi, 'e')
    .replace(/or/gi, 'o')
    .replace(/draw/gi, 'pareggio')
    .replace(/win/gi, 'vittoria')
    .replace(/winner/gi, 'vincente')
    .replace(/to win/gi, 'vincente')
    .replace(/match winner/gi, 'vincente partita')
    .replace(/both teams to score/gi, 'entrambe segnano')
    .replace(/clean sheet/gi, 'porta inviolata')
    .replace(/first half/gi, 'primo tempo')
    .replace(/second half/gi, 'secondo tempo')
    .replace(/corners/gi, 'calci d\'angolo')
    .replace(/yellow cards/gi, 'cartellini gialli')
    .replace(/red cards/gi, 'cartellini rossi')
    .replace(/penalties/gi, 'rigori')
    .replace(/no bet/gi, 'nessuna giocata')
    .replace(/avoid/gi, 'evita')
    .replace(/recommended/gi, 'consigliato')
    .replace(/handicap/gi, 'handicap')
    .replace(/\bX\b/g, 'X')  // Mantiene X per pareggio
    .replace(/1X/gi, '1X')   // Mantiene simboli scommesse
    .replace(/X2/gi, 'X2')
    .replace(/12/gi, '12')
    
  return translated
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  const leagues = [
    { key: 'all', name: 'Tutti i Campionati' },
    { key: 'serie-a', name: 'Serie A' },
    { key: 'serie-b', name: 'Serie B' },
    { key: 'premier', name: 'Premier League' },
    { key: 'la-liga', name: 'La Liga' },
    { key: 'bundesliga', name: 'Bundesliga' },
    { key: 'ligue-1', name: 'Ligue 1' },
    { key: 'champions', name: 'Champions League' },
    { key: 'europa', name: 'Europa League' },
    { key: 'eredivisie', name: 'Eredivisie' },
    { key: 'primeira', name: 'Primeira Liga' },
  ]

  // Genera array dei prossimi 7 giorni
  const getDates = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' })
      const dayNumber = date.getDate()
      dates.push({
        value: dateStr,
        label: i === 0 ? 'Oggi' : i === 1 ? 'Domani' : `${dayName} ${dayNumber}`,
        fullDate: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
      })
    }
    return dates
  }

  const dates = getDates()

  useEffect(() => {
    fetchMatches()
  }, [selectedLeague, selectedDate])

  useEffect(() => {
    filterMatches()
  }, [matches, searchQuery])

  const filterMatches = () => {
    if (!searchQuery.trim()) {
      setFilteredMatches(matches)
      return
    }

    const filtered = matches.filter(match => 
      match.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.league.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    setFilteredMatches(filtered)
  }

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/matches/today?league=${selectedLeague}&date=${selectedDate}`)
      const data = await response.json()
      setMatches(data.matches || [])
      setFilteredMatches(data.matches || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-6">
        {/* Header Mobile-First */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
            </div>
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                CalcioAI
              </h1>
            </Link>
            <div className="ml-auto">
              <Link href="/tipsterai">
                <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                  🎯 TipsterAI
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Match Center ⚽</h2>
              <p className="text-slate-400">Scopri e analizza tutte le partite</p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span>{filteredMatches.length} partite disponibili</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section - Mobile Optimized */}
        <div className="mb-6">
          <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cerca squadre o campionati..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-emerald-500/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Filter Toggle Mobile */}
              <Button
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 sm:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Nascondi Filtri ▲' : 'Mostra Filtri ▼'}
              </Button>
            </div>
            
            {/* Search Results Info */}
            {searchQuery && (
              <div className="mt-3 text-sm text-slate-400">
                {filteredMatches.length} risultati per "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className={`space-y-4 transition-all duration-300 mb-6 ${showFilters ? 'block' : 'hidden'} sm:block`}>
          
          {/* League Selector */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Campionati
            </h3>
            <div className="bg-slate-900/30 rounded-xl p-2">
              <div className="flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto pb-2">
                {leagues.map((league) => (
                  <button
                    key={league.key}
                    onClick={() => setSelectedLeague(league.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedLeague === league.key
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-600/30'
                    }`}
                  >
                    {league.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Date
            </h3>
            <div className="bg-slate-900/30 rounded-xl p-2">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => setSelectedDate(date.value)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-w-[80px] ${
                      selectedDate === date.value
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-600/30'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{date.label}</div>
                      <div className="text-xs opacity-70">{date.fullDate}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="mb-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50 animate-pulse">
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-8 bg-slate-700 rounded"></div>
                    <div className="h-6 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="bg-slate-900/50 backdrop-blur border-slate-700/50 hover:border-emerald-500/50 transition-all hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {match.league}
                      </Badge>
                      {match.predictions && getConfidenceBadge(match.predictions.confidence)}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-slate-400 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>🕐 {match.time}</span>
                      {match.venue && (
                        <>
                          <span>•</span>
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">
                            {typeof match.venue === 'object' && match.venue
                              ? `${(match.venue as any).name}${(match.venue as any).city ? `, ${(match.venue as any).city}` : ''}` 
                              : match.venue}
                          </span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Teams */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {match.homeTeam.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-semibold text-white">{match.homeTeam.name}</span>
                      </div>
                      
                      <div className="text-center text-slate-400 text-sm">VS</div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {match.awayTeam.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-semibold text-white">{match.awayTeam.name}</span>
                      </div>
                    </div>

                    {/* Predictions */}
                    {match.predictions && (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">1</span>
                            <span className="text-xs text-slate-400">X</span>
                            <span className="text-xs text-slate-400">2</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-1">
                            <div className="bg-emerald-500 h-2 rounded" style={{opacity: match.predictions.home / 100}}></div>
                            <div className="bg-yellow-500 h-2 rounded" style={{opacity: match.predictions.draw / 100}}></div>
                            <div className="bg-red-500 h-2 rounded" style={{opacity: match.predictions.away / 100}}></div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>{match.predictions.home}%</span>
                            <span>{match.predictions.draw}%</span>
                            <span>{match.predictions.away}%</span>
                          </div>
                        </div>
                        
                        {/* Consiglio rapido */}
                        {match.predictions.advice && (
                          <div className="text-center mt-2 text-sm text-emerald-400">
                            📊 {translateAdvice(match.predictions.advice)}
                          </div>
                        )}
                      </>
                    )}

                    {/* CTA */}
                    <Link href={`/matches/${match.id}`}>
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Analisi Completa (2 crediti)
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-12 border border-slate-700/50 max-w-md mx-auto">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {searchQuery ? 'Nessun risultato trovato' : 'Nessuna partita disponibile'}
                </h3>
                <p className="text-slate-400 mb-6">
                  {searchQuery 
                    ? `Non ci sono partite che corrispondono a "${searchQuery}". Prova un altro termine di ricerca.`
                    : 'Seleziona un altro campionato o data per vedere più partite.'
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Mostra tutte le partite
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-left">
                  <div className="text-sm font-medium text-amber-400 mb-1">Disclaimer</div>
                  <p className="text-xs text-amber-300/80">
                    Le probabilità sono calcolate su dati storici e algoritmi di machine learning. 
                    Non garantiscono risultati futuri. Gioca sempre responsabilmente e dentro le tue possibilità.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-slate-400">
              <Link href="/tipsterai" className="hover:text-emerald-400 transition-colors">
                🎯 TipsterAI - Proposte Giornaliere
              </Link>
              <span className="hidden sm:block">•</span>
              <span>Powered by CalcioAI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}