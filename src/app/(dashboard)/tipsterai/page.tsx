'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, TrendingUp, Zap, Bomb, MessageSquare, RefreshCw, Clock, CreditCard, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'

interface Prediction {
  type: 'singola' | 'doppia' | 'tripla' | 'mista' | 'bomba' | 'serieA'
  matches: Array<{
    fixture_id: number
    match: string
    league: string
    prediction: string
    odds: number
    confidence: number
    reasoning: string
    time?: string
    date?: string
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
                  {match.date && (
                    <span className="flex items-center gap-1">
                      📅 {new Date(match.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
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
    case 'seriea': return '🇮🇹'
    default: return '⚽'
  }
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}


export default function TipsterAI() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [noMatchesToday, setNoMatchesToday] = useState(false)
  const [noMatchesMessage, setNoMatchesMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [activeTipTab, setActiveTipTab] = useState('singola')
  const [isFirstView, setIsFirstView] = useState(true)
  const [regenerateError, setRegenerateError] = useState('')
  const today = new Date()

  const { credits, tipsterFirstView, spendCredits, refreshCredits, markTipsterViewed, checkTipsterAccess } = useUserStore()

  useEffect(() => {
    checkInitialAccess()
    fetchDailyPredictions()
  }, [])

  const checkInitialAccess = async () => {
    const access = await checkTipsterAccess()
    setIsFirstView(access.isFirstView)

    // Se e' la prima volta, segna come visto
    if (access.isFirstView) {
      await markTipsterViewed()
    }
  }

  const fetchDailyPredictions = async (forceRegenerate = false) => {
    setLoading(true)
    setRegenerateError('')

    try {
      let response, data

      if (forceRegenerate) {
        // Per rigenerare servono 10 crediti (non e' piu' la prima volta)
        if (credits < 10) {
          setRegenerateError('Crediti insufficienti. Servono 10 crediti per rigenerare le proposte.')
          setLoading(false)
          return
        }

        // Spendi i crediti prima di rigenerare
        const spendResult = await spendCredits(10, 'Rigenerazione TipsterAI')
        if (!spendResult.success) {
          setRegenerateError(spendResult.error || 'Errore durante la spesa dei crediti')
          setLoading(false)
          return
        }

        // Forza rigenerazione con sistema V4 aggiornato
        console.log('🔄 Forzando rigenerazione tips V4...')
        response = await fetch('/api/tipsterai/regenerate-v4', {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ forceNewMatches: true }) // Assicura che cambino le partite
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

        // Refresh credits dopo la spesa
        await refreshCredits()
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
          conversationHistory: conversationHistory.slice(0, -1)
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
      case 'serieA':
        return <span className="text-2xl">🇮🇹</span>
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
      case 'serieA':
        return '🇮🇹 SERIE A'
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
      case 'serieA':
        return 'bg-green-100 text-green-800'
      default:
        return ''
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

      <div className="w-full">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Analizzando le partite di oggi...</p>
            </div>
          ) : predictions && predictions.length > 0 ? (
            <div>
              {/* Tab delle proposte - PRIMA del pulsante aggiorna */}
              <div className="mb-6">
                {/* Tab con design moderno */}
                <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-2 border border-slate-700/50 shadow-xl">
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    <button 
                      onClick={() => setActiveTipTab('singola')}
                      className={`
                        relative px-4 py-3 rounded-xl transition-all duration-200 font-medium
                        ${activeTipTab === 'singola' 
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                          : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">🎯</span>
                        <span className="text-xs font-semibold">Singola</span>
                        {predictions.find(p => p.type === 'singola') && (
                          <span className="text-[10px] text-emerald-400 font-bold">
                            @{predictions.find(p => p.type === 'singola')?.total_odds || predictions.find(p => p.type === 'singola')?.totalOdds}
                          </span>
                        )}
                      </div>
                      {predictions.find(p => p.type === 'singola') && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse border-2 border-slate-900"></span>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTipTab('doppia')}
                      className={`
                        relative px-4 py-3 rounded-xl transition-all duration-200 font-medium
                        ${activeTipTab === 'doppia' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' 
                          : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">✌️</span>
                        <span className="text-xs font-semibold">Doppia</span>
                        {predictions.find(p => p.type === 'doppia') && (
                          <span className="text-[10px] text-blue-400 font-bold">
                            @{predictions.find(p => p.type === 'doppia')?.total_odds || predictions.find(p => p.type === 'doppia')?.totalOdds}
                          </span>
                        )}
                      </div>
                      {predictions.find(p => p.type === 'doppia') && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse border-2 border-slate-900"></span>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTipTab('tripla')}
                      className={`
                        relative px-4 py-3 rounded-xl transition-all duration-200 font-medium
                        ${activeTipTab === 'tripla' 
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30' 
                          : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">🔥</span>
                        <span className="text-xs font-semibold">Tripla</span>
                        {predictions.find(p => p.type === 'tripla') && (
                          <span className="text-[10px] text-purple-400 font-bold">
                            @{predictions.find(p => p.type === 'tripla')?.total_odds || predictions.find(p => p.type === 'tripla')?.totalOdds}
                          </span>
                        )}
                      </div>
                      {predictions.find(p => p.type === 'tripla') && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse border-2 border-slate-900"></span>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTipTab('mista')}
                      className={`
                        relative px-4 py-3 rounded-xl transition-all duration-200 font-medium
                        ${activeTipTab === 'mista' 
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30' 
                          : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">🎲</span>
                        <span className="text-xs font-semibold">Mista</span>
                        {predictions.find(p => p.type === 'mista') && (
                          <span className="text-[10px] text-amber-400 font-bold">
                            @{predictions.find(p => p.type === 'mista')?.total_odds || predictions.find(p => p.type === 'mista')?.totalOdds}
                          </span>
                        )}
                      </div>
                      {predictions.find(p => p.type === 'mista') && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse border-2 border-slate-900"></span>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTipTab('bomba')}
                      className={`
                        relative px-4 py-3 rounded-xl transition-all duration-200 font-medium
                        ${activeTipTab === 'bomba' 
                          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30' 
                          : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">💣</span>
                        <span className="text-xs font-semibold">Bomba</span>
                        {predictions.find(p => p.type === 'bomba') && (
                          <span className="text-[10px] text-red-400 font-bold">
                            @{predictions.find(p => p.type === 'bomba')?.total_odds || predictions.find(p => p.type === 'bomba')?.totalOdds}
                          </span>
                        )}
                      </div>
                      {predictions.find(p => p.type === 'bomba') && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse border-2 border-slate-900"></span>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTipTab('serieA')}
                      className={`
                        relative px-4 py-3 rounded-xl transition-all duration-200 font-medium
                        ${activeTipTab === 'serieA' 
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30' 
                          : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">🇮🇹</span>
                        <span className="text-xs font-semibold">Serie A</span>
                        {predictions.find(p => p.type === 'serieA') && (
                          <span className="text-[10px] text-green-400 font-bold">
                            @{predictions.find(p => p.type === 'serieA')?.total_odds || predictions.find(p => p.type === 'serieA')?.totalOdds}
                          </span>
                        )}
                      </div>
                      {predictions.find(p => p.type === 'serieA') && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-slate-900"></span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Info header e pulsante aggiorna */}
              <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    {predictions.length} proposte attive per oggi
                  </div>
                  <div className="inline-flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-full text-sm">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">{credits}</span>
                    <span className="text-slate-400">crediti</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    onClick={() => fetchDailyPredictions(true)}
                    disabled={loading || credits < 10}
                    className="gap-2"
                    variant={credits < 10 ? "outline" : "default"}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Aggiorna Proposte (10 crediti)
                  </Button>
                  {regenerateError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {regenerateError}
                      <Link href="/ricarica" className="text-emerald-400 hover:underline ml-2">
                        Ricarica
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content delle proposte */}
              <Tabs value={activeTipTab} onValueChange={setActiveTipTab} className="w-full">
                <TabsList className="hidden"></TabsList>
                
                {/* Content per ogni tab */}
                <TabsContent value="singola">
                  {predictions.find(p => p.type === 'singola') ? (
                    <TipCard tip={predictions.find(p => p.type === 'singola')!} type="singola" />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Singola non disponibile oggi
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="doppia">
                  {predictions.find(p => p.type === 'doppia') ? (
                    <TipCard tip={predictions.find(p => p.type === 'doppia')!} type="doppia" />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Doppia non disponibile oggi
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="tripla">
                  {predictions.find(p => p.type === 'tripla') ? (
                    <TipCard tip={predictions.find(p => p.type === 'tripla')!} type="tripla" />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Tripla non disponibile oggi
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="mista">
                  {predictions.find(p => p.type === 'mista') ? (
                    <TipCard tip={predictions.find(p => p.type === 'mista')!} type="mista" />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Mista non disponibile oggi
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="bomba">
                  {predictions.find(p => p.type === 'bomba') ? (
                    <TipCard tip={predictions.find(p => p.type === 'bomba')!} type="bomba" />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Bomba non disponibile oggi
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="serieA">
                  {predictions.find(p => p.type === 'serieA') ? (
                    <TipCard tip={predictions.find(p => p.type === 'serieA')!} type="serieA" />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Serie A speciale non disponibile oggi
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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
      </div>

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
                className="text-base"
                style={{ fontSize: '16px' }}
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