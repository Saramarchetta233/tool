'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calculator, TrendingUp, BookOpen, Target, DollarSign, BarChart3, AlertTriangle, CheckCircle, ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function MetodoPage() {
  const [valueCalc, setValueCalc] = useState({
    probability: 50,
    odds: 2.0,
    bankroll: 1000
  })
  
  const [multiplaCalc, setMultiplaCalc] = useState({
    quotes: ['1.50', '1.80', '2.10']
  })

  const calculateValue = () => {
    const value = (valueCalc.probability / 100 * valueCalc.odds - 1) * 100
    const kellyStake = Math.max(0, ((valueCalc.odds * valueCalc.probability / 100 - 1) / (valueCalc.odds - 1)) * valueCalc.bankroll)
    
    return {
      value: value.toFixed(1),
      isValue: value > 0,
      verdict: value > 5 ? 'GIOCA' : value > 0 ? 'MARGINALE' : 'EVITA',
      kellyStake: kellyStake.toFixed(0),
      kellyPercent: (kellyStake / valueCalc.bankroll * 100).toFixed(1)
    }
  }

  const calculateMultipla = () => {
    const odds = multiplaCalc.quotes.filter(q => q.trim() !== '').map(q => parseFloat(q)).filter(q => !isNaN(q))
    if (odds.length === 0) return { totalOdds: '0.00', probability: '0.0', isRisky: false }
    
    const totalOdds = odds.reduce((acc, odd) => acc * odd, 1)
    const probability = (1 / totalOdds) * 100
    
    return {
      totalOdds: totalOdds.toFixed(2),
      probability: probability.toFixed(1),
      isRisky: probability < 20
    }
  }

  const valueResult = calculateValue()
  const multiplaResult = calculateMultipla()

  const addQuote = () => {
    setMultiplaCalc(prev => ({
      ...prev,
      quotes: [...prev.quotes, '']
    }))
  }

  const removeQuote = (index: number) => {
    setMultiplaCalc(prev => ({
      ...prev,
      quotes: prev.quotes.filter((_, i) => i !== index)
    }))
  }

  const updateQuote = (index: number, value: string) => {
    setMultiplaCalc(prev => ({
      ...prev,
      quotes: prev.quotes.map((quote, i) => i === index ? value : quote)
    }))
  }

  const guides = [
    {
      title: "Value Betting: cos'è e come calcolarlo",
      description: "Scopri come identificare le scommesse con valore positivo",
      readTime: "5 min",
      difficulty: "Principiante",
      content: "Il value betting è la strategia più redditizia nel lungo termine. Una scommessa ha valore quando la probabilità reale è maggiore di quella implicita nelle quote del bookmaker."
    },
    {
      title: "Bankroll Management: la regola del 2%",
      description: "Gestisci il tuo budget senza rischiare tutto",
      readTime: "4 min", 
      difficulty: "Principiante",
      content: "Non scommettere mai più del 2% del tuo bankroll su una singola giocata. Questa regola ti permette di sopravvivere alle serie negative e capitalizzare quelle positive."
    },
    {
      title: "Kelly Criterion spiegato semplice",
      description: "La formula matematica per ottimizzare le puntate",
      readTime: "7 min",
      difficulty: "Intermedio", 
      content: "Kelly = (bp - q) / b, dove b sono le odds-1, p la probabilità di vincita e q quella di perdita. Ti dice esattamente quanto puntare per massimizzare i profitti."
    },
    {
      title: "Singola vs Multipla: matematica delle probabilità",
      description: "Perché le multiple sono trappole matematiche",
      readTime: "6 min",
      difficulty: "Intermedio",
      content: "Una tripla con quote 1.50-1.80-2.10 ha probabilità reale del 17.6%. Sembra facile, ma statisticamente perderai 8 volte su 10. Le singole offrono controllo e value."
    },
    {
      title: "Expected Goals (xG): leggere oltre il risultato", 
      description: "Come interpretare le statistiche avanzate",
      readTime: "8 min",
      difficulty: "Avanzato",
      content: "Gli xG rivelano la vera performance offensiva. Una squadra che vince 1-0 con 0.3 xG ha avuto fortuna. Nel lungo termine, i risultati convergono verso gli xG."
    },
    {
      title: "Errori comuni dello scommettitore",
      description: "I bias psicologici che distruggono i profitti",
      readTime: "5 min",
      difficulty: "Tutti i livelli",
      content: "Gambler's fallacy, confirmation bias, chasing losses: riconosci questi errori per evitarli. La psicologia conta quanto la matematica."
    }
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
            <BarChart3 className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold gradient-text">Metodo AI</h1>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xl text-slate-400">
            Strumenti e strategie per scommesse intelligenti basate sui dati
          </p>
        </div>

        {/* Calcolatori */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          
          {/* Value Bet Calculator */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calculator className="h-6 w-6 mr-2 text-emerald-500" />
                Calcolatore Value Bet
              </CardTitle>
              <CardDescription className="text-slate-400">
                Scopri se una scommessa ha valore matematico positivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block">
                    Probabilità stimata (%)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={valueCalc.probability}
                    onChange={(e) => setValueCalc(prev => ({ ...prev, probability: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-center text-white font-bold text-lg mt-1">
                    {valueCalc.probability}%
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block">
                    Quota bookmaker
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={valueCalc.odds}
                    onChange={(e) => setValueCalc(prev => ({ ...prev, odds: parseFloat(e.target.value) || 1.01 }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block">
                    Bankroll totale (€)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={valueCalc.bankroll}
                    onChange={(e) => setValueCalc(prev => ({ ...prev, bankroll: parseInt(e.target.value) || 100 }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Value:</span>
                  <span className={`font-bold text-lg ${valueResult.isValue ? 'text-emerald-400' : 'text-red-400'}`}>
                    {parseFloat(valueResult.value) > 0 ? '+' : ''}{valueResult.value}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Verdetto:</span>
                  <Badge 
                    className={
                      valueResult.verdict === 'GIOCA' ? 'bg-emerald-500 text-white' :
                      valueResult.verdict === 'MARGINALE' ? 'bg-yellow-500 text-black' :
                      'bg-red-500 text-white'
                    }
                  >
                    {valueResult.verdict}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Stake Kelly:</span>
                  <span className="text-white font-bold">
                    €{valueResult.kellyStake} ({valueResult.kellyPercent}%)
                  </span>
                </div>

                {valueResult.isValue && (
                  <div className="mt-3 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded text-emerald-300 text-sm">
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Questa scommessa ha valore matematico positivo!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Multipla Calculator */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-emerald-500" />
                Calcolatore Multipla
              </CardTitle>
              <CardDescription className="text-slate-400">
                Calcola le probabilità reali della tua multipla
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Quote Inputs */}
              <div className="space-y-3">
                <label className="text-slate-300 text-sm font-medium">
                  Quote da moltiplicare
                </label>
                {multiplaCalc.quotes.map((quote, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      placeholder="es: 1.50"
                      value={quote}
                      onChange={(e) => updateQuote(index, e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500"
                    />
                    {index > 2 && (
                      <Button
                        onClick={() => removeQuote(index)}
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-red-400 hover:bg-red-900/20"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                
                {multiplaCalc.quotes.length < 8 && (
                  <Button
                    onClick={addQuote}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    + Aggiungi quota
                  </Button>
                )}
              </div>

              {/* Results */}
              <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Quota totale:</span>
                  <span className="text-white font-bold text-lg">{multiplaResult.totalOdds}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Probabilità implicita:</span>
                  <span className="text-white font-bold">{multiplaResult.probability}%</span>
                </div>

                {multiplaResult.isRisky && parseFloat(multiplaResult.probability) > 0 && (
                  <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-300 text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    ⚠️ Multipla rischiosa - Probabilità sotto il 20%
                  </div>
                )}

                <div className="mt-3 text-xs text-slate-400">
                  Ricorda: le multiple sono matematicamente svantaggiose. 
                  Preferisci sempre le singole per massimizzare i profitti nel lungo termine.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guides Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-emerald-500" />
            Academy - Guide e Strategie
          </h2>
          <p className="text-slate-400 mb-6">
            Approfondimenti teorici per diventare uno scommettitore profittevole
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide, index) => (
              <Card key={index} className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all hover:-translate-y-1 cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                      {guide.readTime}
                    </Badge>
                    <Badge 
                      className={
                        guide.difficulty === 'Principiante' ? 'bg-emerald-500/20 text-emerald-400' :
                        guide.difficulty === 'Intermedio' ? 'bg-yellow-500/20 text-yellow-400' :
                        guide.difficulty === 'Avanzato' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }
                    >
                      {guide.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg">{guide.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {guide.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    {guide.content}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-700 text-white hover:bg-slate-800"
                  >
                    Leggi l'articolo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border-emerald-500/50">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              Pronto per analisi complete?
            </h3>
            <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
              Accedi alle analisi AI delle partite, report personalizzati e tutto il sistema CalcioAI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/matches">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analizza Partite
                </Button>
              </Link>
              <Link href="/fantacoach">
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                  <Trophy className="h-4 w-4 mr-2" />
                  FantaCoach
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Legal Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-500 max-w-4xl mx-auto">
            ⚠️ I calcolatori forniscono supporto matematico per decisioni informate. 
            Non garantiscono profitti e non incoraggiano il gioco d'azzardo. 
            Scommetti sempre responsabilmente e solo con denaro che puoi permetterti di perdere. 
            Se hai problemi col gioco, visita <span className="text-emerald-400">gioca-responsabile.it</span>
          </p>
        </div>
      </div>
    </div>
  )
}