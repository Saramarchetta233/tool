'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, TrendingUp, Trophy, Target, Shield, 
  Calendar, AlertCircle, ChevronRight, Users,
  Activity, Zap, TrendingDown, ArrowLeft, Clock, MapPin, RefreshCw,
  Brain, Sparkles, TrendingUpIcon
} from 'lucide-react'
import Link from 'next/link'
import { AIAnalysisResponse } from '@/types/ai-analysis'

export default function MatchAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string
  
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  // Refs per tracciare se abbiamo già fatto fetch
  const hasFetchedRef = useRef(false)
  const isFetchingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchAnalysis = async () => {
    console.log('🔄 Manual fetchAnalysis called (retry)')
    
    // Reset refs per permettere nuovo fetch
    hasFetchedRef.current = false
    isFetchingRef.current = false
    
    try {
      setLoading(true)
      setError(false)
      const response = await fetch(`/api/matches/${matchId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const aiData: AIAnalysisResponse = await response.json()
    
      console.log('🤖 AI Analysis Response (retry):', {
        dataSource: aiData.dataSource,
        cacheHit: aiData.cacheHit,
        hasPrevisione: !!aiData.previsione_ai,
        hasMercati: !!aiData.mercati,
        hasValueBets: aiData.value_bets?.length || 0,
        hasReport: !!aiData.report_narrativo
      })
      
      // Verifica che i dati essenziali siano presenti
      if (aiData && aiData.match) {
        setAnalysis(aiData)
        setError(false)
        hasFetchedRef.current = true // Marco come fetchato con successo
        console.log('✅ Retry successful')
      } else {
        throw new Error('Dati analisi non validi')
      }
      
    } catch (error) {
      console.error('❌ Retry error:', error)
      setError(true)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    console.log('🔄 useEffect triggered for matchId:', matchId)
    
    // BLOCCA se già fetchato o in corso
    if (hasFetchedRef.current || isFetchingRef.current) {
      console.log('⚠️ Already fetched or fetching, skipping duplicate request...')
      return
    }
    
    isFetchingRef.current = true
    console.log('🚀 Starting fetch for match analysis...')
    
    // Cancella richieste precedenti
    if (abortControllerRef.current) {
      console.log('🛑 Aborting previous request')
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    const fetchWithAbort = async () => {
      try {
        setLoading(true)
        setError(false)
        
        console.log('📡 Making API call to:', `/api/matches/${matchId}`)
        
        const response = await fetch(`/api/matches/${matchId}`, {
          signal: abortControllerRef.current?.signal
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const aiData: AIAnalysisResponse = await response.json()
      
        console.log('📦 Received data:', {
          dataSource: aiData.dataSource,
          cacheHit: aiData.cacheHit,
          hasPrevisione: !!aiData.previsione_ai,
          hasMercati: !!aiData.mercati,
          hasValueBets: aiData.value_bets?.length || 0,
          hasReport: !!aiData.report_narrativo
        })
        
        // Verifica che i dati essenziali siano presenti
        if (aiData && aiData.match) {
          setAnalysis(aiData)
          setError(false)
          hasFetchedRef.current = true // Marco come completato con successo
          console.log('✅ Analysis set successfully')
        } else {
          throw new Error('Dati analisi non validi')
        }
        
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          console.log('🛑 Request aborted (normal behavior)')
          return
        }
        console.error('❌ Fetch error:', error)
        setError(true)
      } finally {
        setLoading(false)
        isFetchingRef.current = false // Reset flag dopo completamento
      }
    }
    
    fetchWithAbort()
    
    return () => {
      console.log('🧹 Cleanup: aborting any pending requests')
      abortControllerRef.current?.abort()
      // Reset i flag durante cleanup
      if (!hasFetchedRef.current) {
        isFetchingRef.current = false
      }
    }
  }, [matchId]) // Solo matchId come dipendenza

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Generando analisi AI...</p>
        </div>
      </div>
    )
  }

  if (error && !analysis) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Analisi Non Disponibile</h2>
            <p className="text-slate-400 mb-4">Non è stato possibile generare l'analisi per questa partita.</p>
            <Button onClick={fetchAnalysis} className="bg-emerald-600 hover:bg-emerald-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se non stiamo caricando e non abbiamo analysis, mostra loading (caso edge)
  if (!loading && !analysis) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-slate-700 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-slate-400">Caricamento analisi...</p>
        </div>
      </div>
    )
  }

  // Guard: se analysis è null, non renderizzare il contenuto principale
  if (!analysis || !analysis.match) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Elaborazione dati...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/matches">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tutte le Partite
            </Button>
          </Link>
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            🤖 AI POWERED
          </Badge>
        </div>

        {/* Match Info */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
                    <span className="text-xl font-bold">{analysis.match.homeTeam.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-semibold">{analysis.match.homeTeam.name}</h3>
                </div>
                
                <div className="text-center">
                  <div className="text-xl text-slate-400 mb-2">VS</div>
                  <div className="text-sm text-slate-500">
                    {new Date(analysis.match.date).toLocaleDateString('it-IT')} • {analysis.match.time}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
                    <span className="text-xl font-bold">{analysis.match.awayTeam.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-semibold">{analysis.match.awayTeam.name}</h3>
                </div>
              </div>
              
              <div className="text-sm text-slate-400">
                <MapPin className="inline h-4 w-4 mr-1" />
                {typeof analysis.match.venue === 'string' 
                  ? analysis.match.venue 
                  : analysis.match.venue?.name 
                    ? `${analysis.match.venue.name}, ${analysis.match.venue.city}` 
                    : 'Stadio TBD'} • {analysis.match.league}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* AI Prediction */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-500" />
                Previsione AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.previsione_ai && analysis.previsione_ai.percentuali ? (
                <>
                  <div>
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>1 (Casa)</span>
                      <span>{analysis.previsione_ai.percentuali.home || 0}%</span>
                    </div>
                    <Progress value={analysis.previsione_ai.percentuali.home || 0} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>X (Pareggio)</span>
                      <span>{analysis.previsione_ai.percentuali.draw || 0}%</span>
                    </div>
                    <Progress value={analysis.previsione_ai.percentuali.draw || 0} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>2 (Trasferta)</span>
                      <span>{analysis.previsione_ai.percentuali.away || 0}%</span>
                    </div>
                    <Progress value={analysis.previsione_ai.percentuali.away || 0} className="h-3" />
                  </div>
                  
                  <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
                    <div className="flex items-start space-x-2">
                      <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-purple-400 mb-1">
                          AI Raccomanda: {analysis.previsione_ai.esito_principale === '1' ? 'Vittoria Casa' : 
                                          analysis.previsione_ai.esito_principale === 'X' ? 'Pareggio' : 'Vittoria Trasferta'}
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed">
                          {analysis.previsione_ai.motivazione}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm">Analisi AI in elaborazione...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Markets */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="h-5 w-5 mr-2 text-emerald-500" />
                Mercati Consigliati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.mercati && Object.entries(analysis.mercati).slice(0, 3).map(([key, market]) => {
                const marketNames: Record<string, string> = {
                  risultato_finale: 'Risultato Finale',
                  over_under: 'Over/Under',
                  gol_nogol: 'Gol/NoGol', 
                  doppia_chance: 'Doppia Chance',
                  multigol: 'Multigol'
                }
                
                const getConfidenceColor = (conf: string) => {
                  switch(conf) {
                    case 'ALTA': return 'bg-emerald-500/20 text-emerald-400'
                    case 'MEDIA': return 'bg-yellow-500/20 text-yellow-400'
                    case 'BASSA': return 'bg-red-500/20 text-red-400'
                    default: return 'bg-slate-500/20 text-slate-400'
                  }
                }
                
                return (
                  <div key={key} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="text-sm font-semibold text-white">{marketNames[key]}</div>
                        <div className="text-xs text-slate-400">{market.consigliato}</div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs ${getConfidenceColor(market.confidence)}`}>
                          {market.confidence}
                        </Badge>
                        {market.value && (
                          <Badge className="ml-1 bg-emerald-500 text-xs">VALUE</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-cyan-400">@{market.quota}</div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* NEW: Combo Markets */}
        {analysis.mercati_combo && analysis.mercati_combo.length > 0 && (
          <Card className="bg-slate-900/50 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                🎯 Combo & Multigol
              </CardTitle>
              <CardDescription className="text-slate-400">
                Mercati combinati per massimizzare le probabilità
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.mercati_combo.map((combo, i) => {
                  const getConfidenceColor = (conf: string) => {
                    switch(conf) {
                      case 'ALTISSIMA': return 'bg-green-500/20 text-green-400 border-green-500/30'
                      case 'ALTA': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      case 'MEDIA': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      case 'BASSA': return 'bg-red-500/20 text-red-400 border-red-500/30'
                      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }
                  }
                  
                  return (
                    <div key={i} className={`rounded-lg p-3 border ${getConfidenceColor(combo.confidence)}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-white text-sm">{combo.tipo}</span>
                          <div className="text-xs text-slate-300 mt-1">{combo.nome}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          combo.confidence === 'ALTISSIMA' ? 'bg-green-500/30 text-green-300' :
                          combo.confidence === 'ALTA' ? 'bg-emerald-500/30 text-emerald-300' : 
                          combo.confidence === 'MEDIA' ? 'bg-yellow-500/30 text-yellow-300' :
                          'bg-red-500/30 text-red-300'
                        }`}>
                          {combo.confidence}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{combo.reasoning}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NEW SECTIONS: H2H, Team Form, and Standings */}
        
        {/* H2H - Confronti Precedenti */}
        {analysis.h2h && analysis.h2h.totale_partite > 0 && (
          <Card className="bg-slate-900/50 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                ⚔️ Confronti Precedenti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">{analysis.h2h.vittorie_casa}</div>
                  <div className="text-sm text-slate-400">{analysis.match.homeTeam.name}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-400">{analysis.h2h.pareggi}</div>
                  <div className="text-sm text-slate-400">Pareggi</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">{analysis.h2h.vittorie_ospite}</div>
                  <div className="text-sm text-slate-400">{analysis.match.awayTeam.name}</div>
                </div>
              </div>
              
              <div className="text-sm text-slate-400 text-center">
                {analysis.h2h.totale_partite} partite totali • Media gol: {analysis.h2h.media_gol}
              </div>
              
              {analysis.h2h.ultimi_5 && analysis.h2h.ultimi_5.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Ultimi scontri:</h4>
                  {analysis.h2h.ultimi_5.map((match, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-800/50 rounded p-2">
                      <span className="text-sm text-slate-400">{new Date(match.data).toLocaleDateString('it-IT')}</span>
                      <span className="text-sm">
                        {match.casa} <span className="font-bold text-white">{match.risultato}</span> {match.ospite}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-sm text-emerald-400 mt-4 p-3 bg-emerald-500/10 rounded border border-emerald-500/30">
                💡 {analysis.h2h.trend}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Form - Forma Squadre */}
        {analysis.forma_squadre && (
          <Card className="bg-slate-900/50 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                📈 Forma Ultime 5 Partite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Team Form */}
                <div>
                  <h4 className="font-semibold text-white mb-3">{analysis.forma_squadre.casa.nome}</h4>
                  <div className="flex gap-1 mb-3">
                    {analysis.forma_squadre.casa.ultime_5.map((result, i) => (
                      <span key={i} className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${
                        result === 'V' ? 'bg-emerald-500 text-white' : 
                        result === 'P' ? 'bg-yellow-500 text-black' : 
                        result === 'S' ? 'bg-red-500 text-white' :
                        'bg-slate-600 text-slate-300'
                      }`}>
                        {result}
                      </span>
                    ))}
                  </div>
                  {analysis.forma_squadre.casa.ultime_5_dettaglio && analysis.forma_squadre.casa.ultime_5_dettaglio.length > 0 && (
                    <div className="space-y-1">
                      {console.log(`📊 Home team has ${analysis.forma_squadre.casa.ultime_5_dettaglio.length} detailed matches`)}
                      {analysis.forma_squadre.casa.ultime_5_dettaglio.map((match, i) => (
                        <div key={i} className="text-xs text-slate-400">
                          {match.casa_trasferta === 'C' ? '🏠' : '✈️'} vs {match.avversario}: 
                          <span className="text-white ml-1">{match.risultato}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-cyan-400 mt-2">
                    {analysis.forma_squadre.casa.rendimento}
                  </div>
                </div>
                
                {/* Away Team Form */}
                <div>
                  <h4 className="font-semibold text-white mb-3">{analysis.forma_squadre.ospite.nome}</h4>
                  <div className="flex gap-1 mb-3">
                    {analysis.forma_squadre.ospite.ultime_5.map((result, i) => (
                      <span key={i} className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${
                        result === 'V' ? 'bg-emerald-500 text-white' : 
                        result === 'P' ? 'bg-yellow-500 text-black' : 
                        result === 'S' ? 'bg-red-500 text-white' :
                        'bg-slate-600 text-slate-300'
                      }`}>
                        {result}
                      </span>
                    ))}
                  </div>
                  {analysis.forma_squadre.ospite.ultime_5_dettaglio && analysis.forma_squadre.ospite.ultime_5_dettaglio.length > 0 && (
                    <div className="space-y-1">
                      {console.log(`📊 Away team has ${analysis.forma_squadre.ospite.ultime_5_dettaglio.length} detailed matches`)}
                      {analysis.forma_squadre.ospite.ultime_5_dettaglio.map((match, i) => (
                        <div key={i} className="text-xs text-slate-400">
                          {match.casa_trasferta === 'C' ? '🏠' : '✈️'} vs {match.avversario}: 
                          <span className="text-white ml-1">{match.risultato}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-cyan-400 mt-2">
                    {analysis.forma_squadre.ospite.rendimento}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Standings - Classifica */}
        {analysis.classifica && (analysis.classifica.casa || analysis.classifica.ospite) && (
          <Card className="bg-slate-900/50 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                🏆 Classifica Attuale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Team Standing */}
                {analysis.classifica.casa && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl font-bold text-emerald-400">#{analysis.classifica.casa.posizione}</span>
                      <span className="font-semibold text-white">{analysis.match.homeTeam.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><span className="text-slate-400">Punti:</span> <span className="text-white font-bold">{analysis.classifica.casa.punti}</span></div>
                      <div><span className="text-slate-400">V:</span> <span className="text-emerald-400">{analysis.classifica.casa.vittorie}</span></div>
                      <div><span className="text-slate-400">P:</span> <span className="text-yellow-400">{analysis.classifica.casa.pareggi}</span></div>
                      <div><span className="text-slate-400">S:</span> <span className="text-red-400">{analysis.classifica.casa.sconfitte}</span></div>
                      <div><span className="text-slate-400">GF:</span> <span className="text-white">{analysis.classifica.casa.gol_fatti}</span></div>
                      <div><span className="text-slate-400">GS:</span> <span className="text-white">{analysis.classifica.casa.gol_subiti}</span></div>
                    </div>
                  </div>
                )}
                
                {/* Away Team Standing */}
                {analysis.classifica.ospite && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl font-bold text-cyan-400">#{analysis.classifica.ospite.posizione}</span>
                      <span className="font-semibold text-white">{analysis.match.awayTeam.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><span className="text-slate-400">Punti:</span> <span className="text-white font-bold">{analysis.classifica.ospite.punti}</span></div>
                      <div><span className="text-slate-400">V:</span> <span className="text-emerald-400">{analysis.classifica.ospite.vittorie}</span></div>
                      <div><span className="text-slate-400">P:</span> <span className="text-yellow-400">{analysis.classifica.ospite.pareggi}</span></div>
                      <div><span className="text-slate-400">S:</span> <span className="text-red-400">{analysis.classifica.ospite.sconfitte}</span></div>
                      <div><span className="text-slate-400">GF:</span> <span className="text-white">{analysis.classifica.ospite.gol_fatti}</span></div>
                      <div><span className="text-slate-400">GS:</span> <span className="text-white">{analysis.classifica.ospite.gol_subiti}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Value Bets */}
        {analysis.value_bets && analysis.value_bets.length > 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUpIcon className="h-5 w-5 mr-2 text-green-500" />
                Value Bets Identificati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.value_bets.map((valueBet, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-white">{valueBet.mercato}</div>
                      <div className="text-sm text-green-400 font-bold">{valueBet.edge}</div>
                      <div className="text-xs text-slate-300 mt-1">{valueBet.spiegazione}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">@{valueBet.quota}</div>
                      <div className="text-xs text-slate-400">
                        {valueBet.probabilita_reale}% vs {valueBet.probabilita_quota}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* AI Strategy - New Smart Betting Plan */}
        {analysis.piano_scommessa && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-500" />
                Piano di Scommessa AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                {analysis.piano_scommessa.tipo === 'SKIP' ? (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-400 mb-3">
                      ⚠️ Partita senza valore
                    </div>
                    <p className="text-slate-300 mb-4">{analysis.piano_scommessa.reasoning}</p>
                    <Link 
                      href="/tipsterai"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <span>🎯</span>
                      <span>Vedi le proposte del TipsterAI</span>
                      <span>→</span>
                    </Link>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {analysis.piano_scommessa.tipo}: {analysis.piano_scommessa.selezione}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        {analysis.piano_scommessa.quota_reale && (
                          <div className="text-blue-400 text-xl font-bold mb-2">
                            Quota: @{analysis.piano_scommessa.quota_reale.toFixed(2)}
                          </div>
                        )}
                        {analysis.piano_scommessa.probabilita && (
                          <div className="text-sm text-slate-300 mb-2">
                            Probabilità: {analysis.piano_scommessa.probabilita}%
                          </div>
                        )}
                        {analysis.piano_scommessa.stake_consigliato && (
                          <div className="text-xs text-slate-400">
                            Stake: {analysis.piano_scommessa.stake_consigliato}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="text-slate-300">{analysis.piano_scommessa.reasoning}</div>
                        {analysis.piano_scommessa.rischio && (
                          <div className="mt-2">
                            <span className="text-slate-400">Rischio:</span>{' '}
                            <span className={`font-semibold ${
                              analysis.piano_scommessa.rischio === 'BASSO' ? 'text-green-400' :
                              analysis.piano_scommessa.rischio === 'MEDIO' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>{analysis.piano_scommessa.rischio}</span>
                          </div>
                        )}
                        {analysis.piano_scommessa.alternativa && (
                          <div className="text-xs text-slate-400 mt-2">
                            💡 {analysis.piano_scommessa.alternativa}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-sm text-slate-400 mb-3">
                        Vuoi più proposte di gioco per oggi?
                      </p>
                      <Link 
                        href="/tipsterai"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <span>🎯</span>
                        <span>Vedi le proposte del TipsterAI</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Old Strategy (keep for backwards compatibility) */}
        {!analysis.piano_scommessa && analysis.scommessa_principale && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-500" />
                Piano di Scommessa AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {analysis.scommessa_principale.tipo}: {analysis.scommessa_principale.selezione}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-blue-400 text-xl font-bold mb-2">
                      Probabilità: {analysis.scommessa_principale.probabilita}%
                    </div>
                    <div className="text-sm text-slate-300 mb-2">
                      <strong>Quota target:</strong> {analysis.scommessa_principale.quota_target}
                    </div>
                    <div className="text-xs text-slate-400">
                      {analysis.scommessa_principale.istruzioni.gioca}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>Quota minima: <span className="text-white">{analysis.scommessa_principale.istruzioni.quota_minima}</span></div>
                    <div>Timing: <span className="text-white">{analysis.scommessa_principale.istruzioni.timing}</span></div>
                    <div className="text-slate-400 mt-2">💡 {analysis.scommessa_principale.istruzioni.sicurezza}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risultati Esatti */}
        {analysis.risultati_esatti && analysis.risultati_esatti.length > 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="h-5 w-5 mr-2 text-yellow-500" />
                Risultati Esatti AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {analysis.risultati_esatti.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg text-center border ${
                    result.top === 1 ? 'bg-emerald-500/20 border-emerald-500/50' : 
                    result.top === 2 ? 'bg-yellow-500/20 border-yellow-500/50' :
                    'bg-slate-800/50 border-slate-700'
                  }`}>
                    <div className="text-2xl font-bold text-white mb-1">{result.risultato}</div>
                    <div className="text-sm text-slate-300 mb-1">{result.probabilita}%</div>
                    <div className="text-xs text-slate-400">@{result.quota}</div>
                    {result.top <= 2 && (
                      <Badge className="mt-2 text-xs">TOP {result.top}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Report */}
        {analysis.report_narrativo && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-500" />
                Report Narrativo AI
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analisi completa generata da GPT-4
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {analysis.report_narrativo}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}