'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, TrendingUp, Zap, Bomb, MessageSquare, RefreshCw, History, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import Link from 'next/link'

interface Prediction {
  type: 'singola' | 'doppia' | 'tripla' | 'mista' | 'bomba'
  matches: Array<{
    fixture_id: number
    match: string
    league: string
    prediction: string
    odds: number
    confidence: number
    reasoning: string
    time?: string
  }>
  total_odds: number
  potential_multiplier: string
  description: string
  strategy_reasoning: string
  confidence: string
  result: string
  validUntil: string
  // Legacy
  totalOdds?: number
}

// Componente per singola selezione migliorato
function TipCard({ tip, type }: { tip: any, type: string }) {
  const isMultiple = tip.matches && Array.isArray(tip.matches) && tip.matches.length > 1
  
  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl p-6 border border-slate-600/50 shadow-2xl backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300">
      {/* Header migliorato */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl p-2 bg-slate-700/50 rounded-lg">
            {getEmoji(type)}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {type.toUpperCase()}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                Quota @{Number(tip.total_odds || tip.odds).toFixed(2)}
              </span>
              {tip.confidence && (
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                  {tip.confidence}% sicurezza
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Moltiplicatore evidenziato */}
        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-400">
            {Number(tip.total_odds || tip.odds).toFixed(2)}x
          </div>
          <div className="text-xs text-slate-400">moltiplicatore</div>
        </div>
      </div>
      
      {/* Partite con layout migliorato */}
      <div className="space-y-4">
        {(isMultiple ? tip.matches : tip.matches || [{ 
          home_team: tip.home_team, 
          away_team: tip.away_team, 
          league: tip.league, 
          time: tip.match_time,
          prediction: tip.prediction,
          prediction_label: tip.prediction_label,
          odds: tip.odds,
          reasoning: tip.reasoning,
          ...tip 
        }]).map((match: any, i: number) => (
          <div key={i} className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/30 hover:border-slate-600/50 transition-all">
            {/* Info partita */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white mb-1">
                  {match.match || 
                   (match.home_team && match.away_team ? `${match.home_team} vs ${match.away_team}` : null) ||
                   (tip.home_team && tip.away_team ? `${tip.home_team} vs ${tip.away_team}` : null) ||
                   'Partita in elaborazione'}
                </h4>
                <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    🏆 {match.league}
                  </span>
                  <span className="flex items-center gap-1">
                    🕐 {match.time}
                  </span>
                </div>
              </div>
              
              {isMultiple && (
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-cyan-400">
                    @{Number(match.odds).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400">quota</div>
                </div>
              )}
            </div>
            
            {/* Predizione evidenziata */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-lg p-3 mb-3">
              <div className="text-emerald-300 font-bold text-lg">
                {match.prediction || match.prediction_label}
              </div>
            </div>
            
            {/* Motivazione migliorata */}
            {(match.reasoning || tip.reasoning) && (
              <div className="bg-slate-700/30 rounded-lg p-4 border-l-4 border-amber-500">
                <div className="flex items-start gap-3">
                  <span className="text-amber-400 text-lg">💭</span>
                  <div>
                    <div className="text-xs text-amber-400/80 font-medium mb-1">ANALISI</div>
                    <p className="text-slate-200 leading-relaxed">
                      {match.reasoning || tip.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Strategia complessiva migliorata */}
      {(tip.strategy_reasoning || tip.strategy) && (
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="bg-blue-500/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 text-lg">🎯</span>
              <div>
                <div className="text-xs text-blue-400/80 font-medium mb-1">STRATEGIA</div>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {tip.strategy_reasoning || tip.strategy}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer con statistiche */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {Number(tip.total_odds || tip.odds).toFixed(2)}
            </div>
            <div className="text-xs text-slate-400">Quota Finale</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {isMultiple ? tip.matches.length : '1'}
            </div>
            <div className="text-xs text-slate-400">
              {isMultiple ? 'Selezioni' : 'Selezione'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getEmoji(type: string) {
  switch(type.toLowerCase()) {
    case 'singola': return '🎯'
    case 'doppia': return '✌️'
    case 'tripla': return '🔥'
    case 'mista': return '🎲'
    case 'bomba': return '💣'
    default: return '⚽'
  }
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface HistoryTip {
  id: string
  type: 'singola' | 'doppia' | 'tripla' | 'mista' | 'bomba'
  matches: Array<{
    fixture_id: number
    match: string
    league: string
    prediction: string
    odds: number
    confidence: number
    reasoning: string
    time?: string
  }>
  total_odds: number
  result: 'won' | 'lost' | 'pending'
  confidence: string
  created_at: string
  valid_until: string
}

interface HistoryStats {
  totalTips: number
  singole: { total: number; won: number; percentage: number }
  doppie: { total: number; won: number; percentage: number }
  triple: { total: number; won: number; percentage: number }
  miste: { total: number; won: number; percentage: number }
  bombe: { total: number; won: number; percentage: number }
}

export default function TipsterAI() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [noMatchesToday, setNoMatchesToday] = useState(false)
  const [noMatchesMessage, setNoMatchesMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('proposte')
  const [historyTips, setHistoryTips] = useState<HistoryTip[]>([])
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const today = new Date()

  useEffect(() => {
    fetchDailyPredictions()
  }, [])

  const fetchDailyPredictions = async (forceRegenerate = false) => {
    setLoading(true)
    try {
      let response, data
      
      if (forceRegenerate) {
        // Forza rigenerazione con sistema V4 aggiornato
        console.log('🔄 Forzando rigenerazione tips V4...')
        response = await fetch('/api/tipsterai/regenerate-v4', { 
          method: 'POST',
          cache: 'no-store'
        })
        data = await response.json()
        
        if (data.success) {
          console.log('✅ Tips V4 rigenerati, ricaricando...')
          // Dopo rigenerazione, ricarica i tips con cache-busting
          const cacheBuster = Date.now()
          response = await fetch(`/api/tipsterai/predictions-v2?v=${cacheBuster}`, { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          data = await response.json()
        }
      } else {
        // Caricamento normale con cache-busting
        const cacheBuster = Date.now()
        response = await fetch(`/api/tipsterai/predictions-v2?v=${cacheBuster}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        data = await response.json()
      }
      
      if (data.error) {
        setPredictions([])
        setNoMatchesToday(true)
        setNoMatchesMessage(data.error)
      } else if (data.predictions && Array.isArray(data.predictions)) {
        console.log('📊 Raw predictions data:', data.predictions)
        console.log('📊 Prediction types:', data.predictions.map(p => p.type))
        setPredictions(data.predictions)
        setNoMatchesToday(false)
        console.log(`📊 Tips caricati: ${data.predictions.length} selezioni`)
      } else if (data.tips && data.predictions) {
        // Nuovo formato con tips GPT-4
        setPredictions(data.predictions)
        setNoMatchesToday(false)
        console.log('📊 Tips GPT-4 ricevuti:', data.cached ? 'cached' : 'fresh')
      } else {
        console.error('Invalid predictions data:', data)
        setPredictions([])
        setNoMatchesToday(true)
        setNoMatchesMessage('Errore nel caricamento delle proposte')
      }
    } catch (error) {
      console.error('Error fetching predictions:', error)
      setPredictions([])
      setNoMatchesToday(true)
      setNoMatchesMessage('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/tipsterai/history-v2')
      const data = await response.json()
      
      if ((data.tips && Array.isArray(data.tips)) || (data.history && Array.isArray(data.history))) {
        setHistoryTips(data.tips || data.history || [])
        setHistoryStats(data.stats)
      } else {
        setHistoryTips([])
        setHistoryStats(null)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
      setHistoryTips([])
      setHistoryStats(null)
    } finally {
      setHistoryLoading(false)
    }
  }


  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    const newMessages = [...chatMessages, userMessage]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)

    try {
      // Invia anche la storia della conversazione per mantenere il contesto
      const conversationHistory = newMessages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/tipsterai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: chatInput,
          conversationHistory: conversationHistory.slice(0, -1) // Chat ora carica tips direttamente da Supabase
        })
      })
      
      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setChatLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'singola':
        return <TrendingUp className="w-5 h-5" />
      case 'doppia':
        return <Zap className="w-5 h-5" />
      case 'tripla':
        return <Sparkles className="w-5 h-5" />
      case 'mista':
        return <Sparkles className="w-6 h-6 text-yellow-500" />
      case 'bomba':
        return <Bomb className="w-6 h-6 text-red-500" />
      default:
        return null
    }
  }

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'singola':
        return '🎯 SINGOLA'
      case 'doppia':
        return '🎲 DOPPIA'
      case 'tripla':
        return '🎯 TRIPLA'
      case 'mista':
        return '🎰 MISTA'
      case 'bomba':
        return '💥 BOMBA'
      default:
        return ''
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'singola':
        return 'bg-green-100 text-green-800'
      case 'doppia':
        return 'bg-blue-100 text-blue-800'
      case 'tripla':
        return 'bg-purple-100 text-purple-800'
      case 'mista':
        return 'bg-yellow-100 text-yellow-800'
      case 'bomba':
        return 'bg-red-100 text-red-800'
      default:
        return ''
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'won':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'lost':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'won':
        return <Badge className="bg-green-500 hover:bg-green-600">✅ VINTA</Badge>
      case 'lost':
        return <Badge className="bg-red-500 hover:bg-red-600">❌ PERSA</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">⏳ In attesa</Badge>
      default:
        return <Badge variant="outline">❓ N/A</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">TipsterAI ⚽</h1>
        <p className="text-lg text-muted-foreground">
          Il tuo tutor personale per consigli basati su dati e statistiche
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {format(today, 'EEEE d MMMM yyyy', { locale: it })}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="proposte" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Proposte Attive
          </TabsTrigger>
          <TabsTrigger value="storico" className="flex items-center gap-2" onClick={() => {
            if (activeTab === 'proposte' && historyTips.length === 0) {
              fetchHistory()
            }
          }}>
            <History className="w-4 h-4" />
            Storico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proposte">
          <div className="mb-6 flex justify-center gap-4">
            <Button 
              onClick={() => fetchDailyPredictions(true)} 
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna Proposte
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Analizzando le partite di oggi...</p>
            </div>
          ) : predictions && predictions.length > 0 ? (
            <div className="grid gap-6 mb-12">
              {/* Info header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  {predictions.length} proposte attive per oggi
                </div>
              </div>
              
              {predictions.map((prediction, index) => (
                <TipCard key={index} tip={prediction} type={prediction.type} />
              ))}
            </div>
          ) : noMatchesToday ? (
            <div className="text-center py-12">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">⚽ Nessuna proposta per oggi</h3>
            <p className="text-muted-foreground mb-4 text-lg">
              {noMatchesMessage}
            </p>
            <p className="text-muted-foreground mb-6 text-sm">
              I tips vengono generati automaticamente quando ci sono partite dei campionati principali. Torna domani per le nuove proposte!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/matches">
              <Button variant="outline" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Vedi Tutte le Partite
              </Button>
            </Link>
            <Button 
              onClick={() => fetchDailyPredictions()} 
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Ricontrolla
            </Button>
            </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nessuna predizione disponibile al momento.</p>
              <Button 
                onClick={() => fetchDailyPredictions()} 
                className="mt-4 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Riprova
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="storico">
          <div className="mb-6 flex justify-center gap-4">
            <Button 
              onClick={fetchHistory} 
              disabled={historyLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              Aggiorna Storico
            </Button>
          </div>

          {historyLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Caricando storico tips...</p>
            </div>
          ) : (
            <div>
              {/* Statistics */}
              {historyStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-500">{historyStats.singole.percentage}%</div>
                      <div className="text-sm text-muted-foreground">Singole</div>
                      <div className="text-xs text-slate-400">{historyStats.singole.won}/{historyStats.singole.total}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-500">{historyStats.doppie.percentage}%</div>
                      <div className="text-sm text-muted-foreground">Doppie</div>
                      <div className="text-xs text-slate-400">{historyStats.doppie.won}/{historyStats.doppie.total}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-500">{historyStats.triple.percentage}%</div>
                      <div className="text-sm text-muted-foreground">Triple</div>
                      <div className="text-xs text-slate-400">{historyStats.triple.won}/{historyStats.triple.total}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-500">{historyStats.miste.percentage}%</div>
                      <div className="text-sm text-muted-foreground">Miste</div>
                      <div className="text-xs text-slate-400">{historyStats.miste.won}/{historyStats.miste.total}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-500">{historyStats.bombe.percentage}%</div>
                      <div className="text-sm text-muted-foreground">Bombe</div>
                      <div className="text-xs text-slate-400">{historyStats.bombe.won}/{historyStats.bombe.total}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* History Tips */}
              {historyTips && historyTips.length > 0 ? (
                <div className="grid gap-4">
                  {historyTips.map((tip) => (
                    <Card key={tip.id} className="bg-slate-900/50 border-slate-800">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(tip.type)}
                            <div>
                              <CardTitle className="text-lg">{getTypeTitle(tip.type)}</CardTitle>
                              <CardDescription className="text-xs">
                                {format(parseISO(tip.created_at), 'dd/MM/yyyy', { locale: it })}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getResultBadge(tip.result)}
                            <Badge variant="outline">
                              @{tip.total_odds.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {tip.matches.map((match, idx) => (
                            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{match.match}</p>
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    {match.league && <span>{match.league}</span>}
                                    {match.time && (
                                      <>
                                        {match.league && <span>•</span>}
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {match.time}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-sm text-emerald-400 font-semibold">{match.prediction}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  @{(typeof match.odds === 'number' ? match.odds : 0).toFixed(2)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Nessun tip nello storico.</p>
                  <p className="text-sm text-slate-400">I risultati verranno mostrati qui dopo che le partite saranno finite.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chiedi al TipsterAI
          </CardTitle>
          <CardDescription>
            Fai domande sulle partite, chiedi consigli o approfondimenti sui pronostici
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-96 overflow-y-auto border border-slate-800 rounded-lg p-4 bg-slate-900/30 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Inizia una conversazione chiedendo consigli sulle partite di oggi!
                </p>
              ) : (
                chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]' 
                        : 'bg-muted max-w-[80%]'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(message.timestamp, 'HH:mm')}
                    </p>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="bg-muted max-w-[80%] p-3 rounded-lg">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Chiedi informazioni sulle partite o sui pronostici..."
                disabled={chatLoading}
              />
              <Button onClick={sendChatMessage} disabled={chatLoading}>
                Invia
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}