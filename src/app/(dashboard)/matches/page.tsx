'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, BarChart3, TrendingUp, Users } from 'lucide-react'
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
  }
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState('all')

  const leagues = [
    { key: 'all', name: 'Tutti i Campionati' },
    { key: 'serie-a', name: 'Serie A' },
    { key: 'premier', name: 'Premier League' },
    { key: 'la-liga', name: 'La Liga' },
    { key: 'bundesliga', name: 'Bundesliga' },
    { key: 'ligue-1', name: 'Ligue 1' },
  ]

  useEffect(() => {
    fetchMatches()
  }, [selectedLeague])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const leagueParam = selectedLeague === 'all' ? 'all' : selectedLeague
      const response = await fetch(`/api/matches/today?league=${leagueParam}`)
      const data = await response.json()
      setMatches(data.matches || [])
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
    <div className="min-h-screen bg-slate-950 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-8 w-8 text-emerald-500" />
          <Link href="/">
            <h1 className="text-2xl font-bold gradient-text cursor-pointer">CalcioAI</h1>
          </Link>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Match Center</h2>
            <p className="text-slate-400">Analizza le partite di oggi con l'AI</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-slate-400" />
            <span className="text-white">Oggi, {new Date().toLocaleDateString('it-IT')}</span>
          </div>
        </div>
      </div>

      {/* League Selector */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {leagues.map((league) => (
            <Button
              key={league.key}
              variant={selectedLeague === league.key ? 'default' : 'outline'}
              className={`whitespace-nowrap ${
                selectedLeague === league.key
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'border-slate-600 text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setSelectedLeague(league.key)}
            >
              {league.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Matches Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-800 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-slate-800 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Card key={match.id} className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {match.league}
                    </Badge>
                    {match.predictions && getConfidenceBadge(match.predictions.confidence)}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-slate-400 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{match.time}</span>
                    <MapPin className="h-4 w-4 ml-2" />
                    <span className="truncate">{match.venue}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Teams */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {match.homeTeam.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-semibold text-white">{match.homeTeam.name}</span>
                    </div>
                    
                    <div className="text-center text-slate-400 text-sm">VS</div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {match.awayTeam.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-semibold text-white">{match.awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Predictions */}
                  {match.predictions && (
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
          <Card className="bg-slate-900/50 border-slate-800 text-center p-12">
            <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nessuna partita oggi</h3>
            <p className="text-slate-400">
              Prova a selezionare un altro campionato o torna domani per nuove partite.
            </p>
          </Card>
        )}
      </div>

      {/* Footer note */}
      <div className="max-w-7xl mx-auto mt-12 text-center">
        <p className="text-xs text-slate-500">
          ⚠️ Le probabilità sono calcolate su dati storici e non garantiscono risultati futuri. 
          Gioca responsabilmente.
        </p>
      </div>
    </div>
  )
}