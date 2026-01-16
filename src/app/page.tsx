'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  TrendingUp, Target, Brain, BarChart3, Trophy, Shield,
  ArrowRight, CheckCircle, Zap, Sparkles, Star,
  ChevronRight, Play, Lock, Eye, Users, Award,
  Calendar, Clock, Flame, TrendingDown
} from "lucide-react"
import Link from "next/link"

// Fake predictions for ticker
const fakePredictions = [
  { match: "Inter vs Milan", prediction: "Over 2.5", odds: 1.85, confidence: 92, league: "Serie A" },
  { match: "Real Madrid vs Barcelona", prediction: "1X", odds: 1.45, confidence: 88, league: "La Liga" },
  { match: "Liverpool vs Arsenal", prediction: "GOAL", odds: 1.65, confidence: 85, league: "Premier League" },
  { match: "PSG vs Marseille", prediction: "1", odds: 1.55, confidence: 90, league: "Ligue 1" },
  { match: "Bayern vs Dortmund", prediction: "Over 3.5", odds: 2.10, confidence: 78, league: "Bundesliga" },
  { match: "Juventus vs Napoli", prediction: "Under 3.5", odds: 1.40, confidence: 94, league: "Serie A" },
  { match: "Man City vs Chelsea", prediction: "1", odds: 1.70, confidence: 86, league: "Premier League" },
  { match: "Atletico vs Sevilla", prediction: "Under 2.5", odds: 1.75, confidence: 82, league: "La Liga" },
]

// Demo tips data
const demoTips = {
  singola: {
    emoji: "🎯",
    name: "SINGOLA",
    color: "emerald",
    match: "Inter vs Milan",
    league: "Serie A",
    prediction: "Over 2.5 Goal",
    odds: 1.85,
    confidence: 92,
    reasoning: "Derby ad alta intensità, entrambe le squadre in ottima forma offensiva. Negli ultimi 5 scontri diretti, 4 hanno visto più di 2.5 goal."
  },
  doppia: {
    emoji: "✌️",
    name: "DOPPIA",
    color: "blue",
    matches: [
      { match: "Real Madrid vs Getafe", prediction: "1", odds: 1.35 },
      { match: "Bayern vs Augsburg", prediction: "1", odds: 1.28 }
    ],
    totalOdds: 1.73,
    confidence: 89,
    reasoning: "Due favorite assolute in casa contro avversari in difficoltà. Quota sicura ma redditizia."
  },
  tripla: {
    emoji: "🔥",
    name: "TRIPLA",
    color: "purple",
    matches: [
      { match: "Liverpool vs Wolves", prediction: "1", odds: 1.40 },
      { match: "PSG vs Nantes", prediction: "Over 2.5", odds: 1.55 },
      { match: "Barcellona vs Celta", prediction: "1X", odds: 1.25 }
    ],
    totalOdds: 2.71,
    confidence: 84,
    reasoning: "Combinazione studiata per massimizzare valore e sicurezza. Tutte partite con trend chiari."
  },
  mista: {
    emoji: "🎲",
    name: "MISTA",
    color: "amber",
    matches: [
      { match: "Atalanta vs Fiorentina", prediction: "GOAL", odds: 1.45 },
      { match: "Napoli vs Torino", prediction: "1 + Over 1.5", odds: 1.60 },
      { match: "Roma vs Lazio", prediction: "GOAL + Over 2.5", odds: 1.90 }
    ],
    totalOdds: 4.41,
    confidence: 76,
    reasoning: "Mix di mercati diversi per quota più alta. Derby e big match con statistiche favorevoli."
  },
  bomba: {
    emoji: "💣",
    name: "BOMBA",
    color: "red",
    matches: [
      { match: "Lecce vs Empoli", prediction: "X", odds: 3.20 },
      { match: "Sassuolo vs Verona", prediction: "Over 3.5", odds: 2.80 },
      { match: "Cagliari vs Genoa", prediction: "GOAL + Over 2.5", odds: 2.10 }
    ],
    totalOdds: 18.82,
    confidence: 45,
    reasoning: "Schedina ad alto rischio/alto rendimento. Solo per chi vuole tentare il colpo grosso!"
  },
  serieA: {
    emoji: "🇮🇹",
    name: "SERIE A",
    color: "green",
    matches: [
      { match: "Inter vs Venezia", prediction: "1 + Over 2.5", odds: 1.65 },
      { match: "Milan vs Monza", prediction: "1", odds: 1.35 },
      { match: "Juventus vs Udinese", prediction: "1X", odds: 1.20 }
    ],
    totalOdds: 2.67,
    confidence: 87,
    reasoning: "Focus esclusivo Serie A. Le big italiane in casa sono sempre affidabili."
  }
}

// Testimonials
const testimonials = [
  {
    name: "Marco R.",
    city: "Milano",
    text: "Ho recuperato l'abbonamento con la prima singola! Incredibile la precisione delle analisi.",
    rating: 5,
    profit: "+€320"
  },
  {
    name: "Giuseppe T.",
    city: "Roma",
    text: "Finalmente un tool serio. Le statistiche sono dettagliatissime e i tips AI sono oro.",
    rating: 5,
    profit: "+€185"
  },
  {
    name: "Andrea B.",
    city: "Napoli",
    text: "La bomba del weekend mi ha fatto vincere 15 volte la puntata. CalcioAI spacca!",
    rating: 5,
    profit: "+€450"
  },
  {
    name: "Luca M.",
    city: "Torino",
    text: "Uso il TipsterAI ogni giorno. Le triple sono quasi sempre in target. Consigliatissimo!",
    rating: 5,
    profit: "+€275"
  }
]

export default function HomePage() {
  const [activeTip, setActiveTip] = useState<keyof typeof demoTips>('singola')
  const [demoTab, setDemoTab] = useState<'tipsterai' | 'analisi'>('tipsterai')
  const [isVisible, setIsVisible] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Stats that update
  const stats = [
    { value: "94.2%", label: "Win Rate Singole", icon: <Target className="h-5 w-5" /> },
    { value: "12,847", label: "Utenti Attivi", icon: <Users className="h-5 w-5" /> },
    { value: "€2.4M", label: "Vinto dagli Utenti", icon: <TrendingUp className="h-5 w-5" /> },
    { value: "6", label: "Tips Giornalieri", icon: <Sparkles className="h-5 w-5" /> }
  ]

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <BarChart3 className="h-8 w-8 text-emerald-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CalcioAI</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">PRO</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/accedi">
                <Button variant="ghost" className="text-slate-300 hover:text-white hidden sm:flex">
                  Accedi
                </Button>
              </Link>
              <Link href="/accedi">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-emerald-500/25">
                  Inizia Ora - 49€
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Live Ticker */}
      <div className="bg-slate-900/80 border-b border-slate-800/50 py-2 overflow-hidden">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-emerald-500 text-white px-4 py-1 text-sm font-bold flex items-center gap-2 z-10">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            LIVE TIPS
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex animate-scroll whitespace-nowrap">
              {[...fakePredictions, ...fakePredictions].map((pred, i) => (
                <div key={i} className="inline-flex items-center gap-3 px-6 text-sm">
                  <span className="text-slate-400">{pred.league}</span>
                  <span className="text-white font-medium">{pred.match}</span>
                  <span className="text-emerald-400 font-bold">{pred.prediction}</span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs">@{pred.odds}</span>
                  <span className="text-slate-500">|</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full px-4 py-2 mb-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium text-sm">L'AI che vince per te</span>
              <Badge className="bg-red-500 text-white text-xs animate-pulse">NUOVO</Badge>
            </div>

            {/* Main headline */}
            <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              6 Pronostici AI
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Ogni Singolo Giorno
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-xl sm:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Singola, Doppia, Tripla, Mista, Bomba e Serie A.
              <span className="text-emerald-400 font-semibold"> Calcolati dall'AI analizzando migliaia di statistiche.</span>
              <span className="block mt-2 text-lg text-slate-400">+ Analisi complete di qualsiasi partita tu voglia.</span>
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-10 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Link href="/accedi">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-lg px-8 py-6 font-bold shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105">
                  ACCEDI ORA - SOLO 49€
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-600 text-white hover:bg-slate-800 text-lg px-8 py-6">
                  <Play className="mr-2 h-5 w-5" />
                  Prova la Demo
                </Button>
              </a>
            </div>

            {/* Price highlight box */}
            <div className={`inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-slate-900/80 backdrop-blur border border-emerald-500/30 rounded-2xl px-6 sm:px-8 py-4 mb-12 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="text-center sm:text-left">
                <div className="text-slate-400 text-sm">Pagamento unico</div>
                <div className="text-4xl font-black text-emerald-400">49€</div>
              </div>
              <div className="hidden sm:block h-12 w-px bg-slate-700"></div>
              <div className="text-center sm:text-left">
                <div className="text-slate-400 text-sm">Nessun rinnovo</div>
                <div className="text-xl font-bold text-white">Mai più</div>
              </div>
              <div className="hidden sm:block h-12 w-px bg-slate-700"></div>
              <div className="text-center sm:text-left">
                <div className="text-slate-400 text-sm">Valido per</div>
                <div className="text-xl font-bold text-cyan-400">Tutta la stagione 25/26</div>
              </div>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {stats.map((stat, i) => (
                <div key={i} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-4 hover:border-emerald-500/50 transition-all">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                    {stat.icon}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6 Daily Tips Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 mb-4">TipsterAI</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              6 Proposte Ogni Giorno
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              L'AI analizza <span className="text-emerald-400 font-semibold">oltre 200 statistiche</span> per ogni partita e genera 6 tipi di schedine diverse
            </p>
          </div>

          {/* Tips grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {(Object.keys(demoTips) as Array<keyof typeof demoTips>).map((key) => {
              const tip = demoTips[key]
              const isActive = activeTip === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTip(key)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    isActive
                      ? `bg-${tip.color}-500/20 border-${tip.color}-500 shadow-lg shadow-${tip.color}-500/20`
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{tip.emoji}</div>
                  <div className={`font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>{tip.name}</div>
                  {tip.totalOdds || tip.odds ? (
                    <div className="text-emerald-400 text-sm font-semibold">@{tip.totalOdds || tip.odds}</div>
                  ) : null}
                </button>
              )
            })}
          </div>

          {/* Active tip preview */}
          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{demoTips[activeTip].emoji}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{demoTips[activeTip].name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          @{demoTips[activeTip].totalOdds || demoTips[activeTip].odds}
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {demoTips[activeTip].confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-400">
                      {(demoTips[activeTip].totalOdds || demoTips[activeTip].odds).toFixed(2)}x
                    </div>
                    <div className="text-xs text-slate-400">moltiplicatore</div>
                  </div>
                </div>

                {/* Matches */}
                <div className="space-y-3 mb-6">
                  {demoTips[activeTip].matches ? (
                    demoTips[activeTip].matches.map((m: any, i: number) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">{m.match}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">{m.prediction}</span>
                            <span className="text-slate-400">@{m.odds}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-sm">{demoTips[activeTip].league}</span>
                        <span className="text-emerald-400 font-bold">@{demoTips[activeTip].odds}</span>
                      </div>
                      <div className="text-white font-medium text-lg">{demoTips[activeTip].match}</div>
                      <div className="mt-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded inline-block font-bold">
                        {demoTips[activeTip].prediction}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reasoning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-400">💭</span>
                    <div>
                      <div className="text-xs text-amber-400 font-bold mb-1">ANALISI AI</div>
                      <p className="text-slate-300">{demoTips[activeTip].reasoning}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-4">Demo Interattiva</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Prova CalcioAI
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Esplora il tool come se fossi già dentro. Questa è solo un'anteprima di quello che avrai.
            </p>
          </div>

          {/* Demo Container */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
              {/* Demo Header */}
              <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-emerald-500" />
                    <span className="font-bold text-white">CalcioAI Dashboard</span>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">DEMO</Badge>
                </div>
                <div className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full">
                  <span className="text-emerald-400 font-bold">4000</span>
                  <span className="text-slate-400 text-sm">crediti</span>
                </div>
              </div>

              {/* Demo Tabs */}
              <div className="border-b border-slate-700 px-6">
                <div className="flex gap-4">
                  <button
                    onClick={() => setDemoTab('tipsterai')}
                    className={`py-4 px-4 font-medium transition-all border-b-2 ${
                      demoTab === 'tipsterai'
                        ? 'text-emerald-400 border-emerald-400'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    TipsterAI
                  </button>
                  <button
                    onClick={() => setDemoTab('analisi')}
                    className={`py-4 px-4 font-medium transition-all border-b-2 ${
                      demoTab === 'analisi'
                        ? 'text-emerald-400 border-emerald-400'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Analisi Partite
                  </button>
                </div>
              </div>

              {/* Demo Content */}
              <div className="p-6">
                {demoTab === 'tipsterai' ? (
                  <div>
                    {/* TipsterAI Demo */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
                      {(Object.keys(demoTips) as Array<keyof typeof demoTips>).map((key) => {
                        const tip = demoTips[key]
                        return (
                          <div key={key} className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
                            <div className="text-2xl mb-1">{tip.emoji}</div>
                            <div className="text-xs text-slate-400">{tip.name}</div>
                            <div className="text-emerald-400 text-sm font-bold">@{tip.totalOdds || tip.odds}</div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">🎯</span>
                        <div>
                          <h4 className="text-xl font-bold text-white">SINGOLA DEL GIORNO</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">@1.85</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-blue-400">92% confidence</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-4 mb-4">
                        <div className="text-slate-400 text-sm mb-1">Serie A • Oggi 20:45</div>
                        <div className="text-white font-bold text-lg">Inter vs Milan</div>
                        <div className="mt-2 inline-block bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded font-bold">
                          Over 2.5 Goal
                        </div>
                      </div>
                      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded">
                        <p className="text-slate-300 text-sm">
                          <span className="text-amber-400 font-bold">💭 ANALISI:</span> Derby ad alta intensità con entrambe le squadre in forma offensiva...
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Analisi Demo */}
                    <div className="space-y-4">
                      {[
                        { home: "Juventus", away: "Napoli", time: "18:00", league: "Serie A", prob: 45 },
                        { home: "Roma", away: "Lazio", time: "20:45", league: "Serie A", prob: 52 },
                        { home: "Atalanta", away: "Fiorentina", time: "15:00", league: "Serie A", prob: 58 },
                      ].map((match, i) => (
                        <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-emerald-500/50 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <span>🏆 {match.league}</span>
                              <span>•</span>
                              <span>🕐 {match.time}</span>
                            </div>
                            <Badge className={match.prob >= 55 ? 'bg-emerald-500/20 text-emerald-400' : match.prob >= 45 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}>
                              {match.prob >= 55 ? 'ALTA' : match.prob >= 45 ? 'MEDIA' : 'BASSA'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-bold">{match.home}</div>
                              <div className="text-slate-400">vs {match.away}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-emerald-400 font-bold text-xl">{match.prob}%</div>
                              <div className="text-slate-500 text-xs">prob. casa</div>
                            </div>
                          </div>
                          <Button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600">
                            📊 Analizza Partita (-10 crediti)
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Demo Footer */}
              <div className="bg-slate-800/50 border-t border-slate-700 px-6 py-4 text-center">
                <p className="text-slate-400 mb-3">Questa è solo una demo. Vuoi accedere al tool completo?</p>
                <Link href="/accedi">
                  <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                    Accedi Ora - 49€
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why CalcioAI */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Perché CalcioAI è Diverso
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Non siamo l'ennesimo sito di pronostici. Siamo un'intelligenza artificiale che studia per te.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 hover:border-emerald-500/50 transition-all group">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI che Impara</h3>
              <p className="text-slate-400">
                Analizza oltre <span className="text-emerald-400 font-semibold">200 variabili statistiche</span> per ogni partita: forma, head-to-head, gol, corner, cartellini, expected goals e molto altro.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 hover:border-cyan-500/50 transition-all group">
              <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-7 w-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">6 Tips al Giorno</h3>
              <p className="text-slate-400">
                Ogni mattina trovi <span className="text-cyan-400 font-semibold">6 proposte fresche</span>: dalla singola sicura alla bomba rischiosa. Scegli tu il tuo stile di gioco.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 hover:border-violet-500/50 transition-all group">
              <div className="w-14 h-14 bg-violet-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="h-7 w-7 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Analisi su Richiesta</h3>
              <p className="text-slate-400">
                Vuoi analizzare una partita specifica? <span className="text-violet-400 font-semibold">Scegli tu</span> quale match approfondire con statistiche complete e probabilità AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">Testimonianze</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Cosa Dicono i Nostri Utenti
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-900 rounded-xl p-6 border border-slate-800 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">{t.name}</div>
                    <div className="text-slate-500 text-sm">{t.city}</div>
                  </div>
                  <div className="text-emerald-400 font-bold">{t.profit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">Prezzo Unico</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Un Solo Pagamento, Zero Rinnovi
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Basta abbonamenti mensili. Paghi una volta e CalcioAI è tuo per tutta la stagione.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative">
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-1 text-sm font-bold shadow-lg">
                  MIGLIOR OFFERTA
                </Badge>
              </div>

              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/20 rounded-3xl border-2 border-emerald-500/50 p-8 shadow-2xl shadow-emerald-500/10">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">CalcioAI Pro</h3>
                  <p className="text-slate-400">Stagione 2025/2026 completa</p>

                  <div className="mt-6">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-slate-500 line-through text-2xl">€99</span>
                      <span className="text-6xl font-black text-white">€49</span>
                    </div>
                    <div className="text-emerald-400 font-semibold mt-2">Risparmi €50!</div>
                    <div className="text-slate-500 text-sm mt-1">Pagamento unico • Nessun rinnovo automatico</div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    "6 pronostici AI ogni giorno (singola, doppia, tripla, mista, bomba, serie A)",
                    "4000 crediti per analisi partite",
                    "Accesso completo a TipsterAI",
                    "Analisi statistiche avanzate",
                    "Valido tutta la stagione 2025/2026",
                    "Aggiornamenti e nuove funzionalità incluse",
                    "Supporto prioritario"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/accedi">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-lg py-6 font-bold shadow-lg shadow-emerald-500/30">
                    ACCEDI ORA - 49€
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <p className="text-center text-slate-500 text-sm mt-4">
                  💡 Basta una singola vincente per recuperare l'abbonamento!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-900/30 via-slate-950 to-cyan-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
            Inizia a Vincere Oggi
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Non aspettare. Ogni giorno perso sono 6 pronostici che non hai visto.
            <span className="text-emerald-400 font-semibold"> Entra ora in CalcioAI.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/accedi">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-lg px-10 py-6 font-bold shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105">
                ACCEDI ORA - SOLO 49€
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-6">
            ✓ Pagamento sicuro con Stripe • ✓ Accesso immediato • ✓ Nessun rinnovo
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CalcioAI</span>
              </div>
              <p className="text-slate-400 mb-4">
                L'intelligenza artificiale che analizza il calcio per te. 6 pronostici al giorno, statistiche avanzate.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Prodotti</h4>
              <ul className="space-y-2 text-slate-400">
                <li><span className="hover:text-white cursor-pointer">TipsterAI</span></li>
                <li><span className="hover:text-white cursor-pointer">Match Center</span></li>
                <li><span className="hover:text-white cursor-pointer">Analisi Partite</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Supporto</h4>
              <ul className="space-y-2 text-slate-400">
                <li><span className="hover:text-white cursor-pointer">Centro Assistenza</span></li>
                <li><span className="hover:text-white cursor-pointer">Contatti</span></li>
                <li><span className="hover:text-white cursor-pointer">FAQ</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legale</h4>
              <ul className="space-y-2 text-slate-400">
                <li><span className="hover:text-white cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-white cursor-pointer">Termini di Servizio</span></li>
                <li><span className="hover:text-white cursor-pointer">Gioco Responsabile</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-slate-400 text-sm mb-4 md:mb-0">
                © 2025 CalcioAI. Tutti i diritti riservati.
              </div>
              <div className="text-xs text-slate-500 text-center md:text-right">
                <p className="mb-1">
                  CalcioAI fornisce analisi statistiche a scopo informativo.
                </p>
                <p>
                  Non incoraggiamo il gioco d'azzardo. Gioca responsabilmente su piattaforme autorizzate ADM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
