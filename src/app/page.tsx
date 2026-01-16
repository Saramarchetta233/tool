'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  TrendingUp, Target, Brain, BarChart3, Trophy, Shield,
  ArrowRight, CheckCircle, Zap, Sparkles, Star,
  ChevronRight, Play, Lock, Eye, Users, Award,
  Calendar, Clock, Flame, X, Check, AlertTriangle,
  CircleDollarSign, Percent, LineChart, Activity,
  Search, Filter, MapPin, Calculator, BookOpen,
  DollarSign, Plus, Trash2, RefreshCw, Euro,
  TrendingDown, MessageSquare, Home, CreditCard
} from "lucide-react"
import Link from "next/link"

// Fake predictions for ticker
const fakePredictions = [
  { match: "Inter vs Milan", prediction: "Over 2.5", odds: 1.85, confidence: 92, league: "Serie A", status: "WIN" },
  { match: "Real Madrid vs Barcelona", prediction: "1X", odds: 1.45, confidence: 88, league: "La Liga", status: "WIN" },
  { match: "Liverpool vs Arsenal", prediction: "GOAL", odds: 1.65, confidence: 85, league: "Premier League", status: "WIN" },
  { match: "PSG vs Marseille", prediction: "1", odds: 1.55, confidence: 90, league: "Ligue 1", status: "WIN" },
  { match: "Bayern vs Dortmund", prediction: "Over 3.5", odds: 2.10, confidence: 78, league: "Bundesliga", status: "PENDING" },
  { match: "Juventus vs Napoli", prediction: "Under 3.5", odds: 1.40, confidence: 94, league: "Serie A", status: "WIN" },
  { match: "Man City vs Chelsea", prediction: "1", odds: 1.70, confidence: 86, league: "Premier League", status: "WIN" },
  { match: "Atletico vs Sevilla", prediction: "Under 2.5", odds: 1.75, confidence: 82, league: "La Liga", status: "WIN" },
]

// Demo tips data
interface DemoTip {
  emoji: string
  name: string
  color: string
  odds: number
  confidence: number
  reasoning: string
  match?: string
  league?: string
  prediction?: string
  matches?: Array<{ match: string; prediction: string; odds: number; league?: string; time?: string }>
}

const demoTips: Record<string, DemoTip> = {
  singola: {
    emoji: "🎯",
    name: "SINGOLA",
    color: "emerald",
    match: "Inter vs Milan",
    league: "Serie A",
    prediction: "Over 2.5 Goal",
    odds: 1.85,
    confidence: 92,
    reasoning: "Derby ad alta intensità, entrambe le squadre in ottima forma offensiva. Negli ultimi 5 scontri diretti, 4 hanno visto più di 2.5 goal. L'AI ha analizzato 847 variabili statistiche."
  },
  doppia: {
    emoji: "✌️",
    name: "DOPPIA",
    color: "blue",
    matches: [
      { match: "Real Madrid vs Getafe", prediction: "1", odds: 1.35, league: "La Liga", time: "21:00" },
      { match: "Bayern vs Augsburg", prediction: "1", odds: 1.28, league: "Bundesliga", time: "18:30" }
    ],
    odds: 1.73,
    confidence: 89,
    reasoning: "Due favorite assolute in casa contro avversari in difficoltà. Real Madrid imbattuto in casa da 23 partite, Bayern con 94% vittorie casalinghe."
  },
  tripla: {
    emoji: "🔥",
    name: "TRIPLA",
    color: "purple",
    matches: [
      { match: "Liverpool vs Wolves", prediction: "1", odds: 1.40, league: "Premier League", time: "16:00" },
      { match: "PSG vs Nantes", prediction: "Over 2.5", odds: 1.55, league: "Ligue 1", time: "21:00" },
      { match: "Barcellona vs Celta", prediction: "1X", odds: 1.25, league: "La Liga", time: "18:30" }
    ],
    odds: 2.71,
    confidence: 84,
    reasoning: "Combinazione studiata per massimizzare valore e sicurezza. Tutte partite con trend chiari confermati su oltre 50 match analizzati."
  },
  mista: {
    emoji: "🎲",
    name: "MISTA",
    color: "amber",
    matches: [
      { match: "Atalanta vs Fiorentina", prediction: "GOAL", odds: 1.45, league: "Serie A", time: "15:00" },
      { match: "Napoli vs Torino", prediction: "1 + Over 1.5", odds: 1.60, league: "Serie A", time: "18:00" },
      { match: "Roma vs Lazio", prediction: "GOAL + Over 2.5", odds: 1.90, league: "Serie A", time: "20:45" }
    ],
    odds: 4.41,
    confidence: 76,
    reasoning: "Mix di mercati diversi per quota più alta. Derby della capitale storicamente ricco di gol (media 3.2 negli ultimi 10)."
  },
  bomba: {
    emoji: "💣",
    name: "BOMBA",
    color: "red",
    matches: [
      { match: "Lecce vs Empoli", prediction: "X", odds: 3.20, league: "Serie A", time: "15:00" },
      { match: "Sassuolo vs Verona", prediction: "Over 3.5", odds: 2.80, league: "Serie A", time: "18:00" },
      { match: "Cagliari vs Genoa", prediction: "GOAL + Over 2.5", odds: 2.10, league: "Serie A", time: "20:45" }
    ],
    odds: 18.82,
    confidence: 45,
    reasoning: "Schedina ad alto rischio/alto rendimento. Pattern statistici anomali rilevati dall'AI. Solo per chi vuole tentare il colpo grosso!"
  },
  serieA: {
    emoji: "🇮🇹",
    name: "SERIE A",
    color: "green",
    matches: [
      { match: "Inter vs Venezia", prediction: "1 + Over 2.5", odds: 1.65, league: "Serie A", time: "15:00" },
      { match: "Milan vs Monza", prediction: "1", odds: 1.35, league: "Serie A", time: "18:00" },
      { match: "Juventus vs Udinese", prediction: "1X", odds: 1.20, league: "Serie A", time: "20:45" }
    ],
    odds: 2.67,
    confidence: 87,
    reasoning: "Focus esclusivo Serie A. Le big italiane in casa sono sempre affidabili. Inter 100% vittorie casalinghe con Venezia."
  }
}

// Demo matches for Match Center - EXACT like real app
const demoMatches = [
  {
    id: "1234567",
    league: "Serie A",
    time: "15:00",
    venue: "San Siro, Milano",
    homeTeam: { name: "Inter", logo: "" },
    awayTeam: { name: "Venezia", logo: "" },
    predictions: { home: 78, draw: 14, away: 8, confidence: "ALTA" as const, advice: "1 + Over 2.5" }
  },
  {
    id: "1234568",
    league: "Serie A",
    time: "18:00",
    venue: "San Siro, Milano",
    homeTeam: { name: "Milan", logo: "" },
    awayTeam: { name: "Monza", logo: "" },
    predictions: { home: 72, draw: 18, away: 10, confidence: "ALTA" as const, advice: "1" }
  },
  {
    id: "1234569",
    league: "Serie A",
    time: "20:45",
    venue: "Allianz Stadium, Torino",
    homeTeam: { name: "Juventus", logo: "" },
    awayTeam: { name: "Napoli", logo: "" },
    predictions: { home: 45, draw: 28, away: 27, confidence: "MEDIA" as const, advice: "Under 2.5" }
  },
  {
    id: "1234570",
    league: "Serie A",
    time: "20:45",
    venue: "Olimpico, Roma",
    homeTeam: { name: "Roma", logo: "" },
    awayTeam: { name: "Lazio", logo: "" },
    predictions: { home: 52, draw: 25, away: 23, confidence: "ALTA" as const, advice: "GOAL" }
  },
  {
    id: "1234571",
    league: "Serie A",
    time: "15:00",
    venue: "Gewiss Stadium, Bergamo",
    homeTeam: { name: "Atalanta", logo: "" },
    awayTeam: { name: "Fiorentina", logo: "" },
    predictions: { home: 58, draw: 24, away: 18, confidence: "ALTA" as const, advice: "Over 2.5" }
  },
  {
    id: "1234572",
    league: "Serie A",
    time: "18:00",
    venue: "Maradona, Napoli",
    homeTeam: { name: "Napoli", logo: "" },
    awayTeam: { name: "Torino", logo: "" },
    predictions: { home: 68, draw: 20, away: 12, confidence: "ALTA" as const, advice: "1" }
  },
]

// Testimonials
const testimonials = [
  {
    name: "Marco R.",
    city: "Milano",
    text: "Ho recuperato l'abbonamento con la prima singola! La precisione delle analisi è incredibile, non ho mai visto nulla di simile.",
    rating: 5,
    profit: "+€320",
    date: "2 giorni fa"
  },
  {
    name: "Giuseppe T.",
    city: "Roma",
    text: "Finalmente un tool serio che usa davvero l'AI. Le statistiche sono dettagliatissime e i tips sono oro puro.",
    rating: 5,
    profit: "+€185",
    date: "1 settimana fa"
  },
  {
    name: "Andrea B.",
    city: "Napoli",
    text: "La bomba del weekend mi ha fatto vincere 15 volte la puntata. CalcioAI ha cambiato il mio modo di scommettere!",
    rating: 5,
    profit: "+€450",
    date: "3 giorni fa"
  },
  {
    name: "Luca M.",
    city: "Torino",
    text: "Uso il TipsterAI ogni giorno. Le triple sono quasi sempre in target. Miglior investimento dell'anno!",
    rating: 5,
    profit: "+€275",
    date: "5 giorni fa"
  }
]

// Demo leagues
const demoLeagues = [
  { key: 'all', name: 'Tutti i Campionati' },
  { key: 'serie-a', name: 'Serie A' },
  { key: 'serie-b', name: 'Serie B' },
  { key: 'premier', name: 'Premier League' },
  { key: 'la-liga', name: 'La Liga' },
  { key: 'bundesliga', name: 'Bundesliga' },
  { key: 'ligue-1', name: 'Ligue 1' },
  { key: 'champions', name: 'Champions League' },
]

// Demo dates
const getDemoDates = () => {
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

// Metodo guides
const metodoGuides = [
  { title: "Le Quote Spiegate Semplice", description: "Come funzionano le quote" },
  { title: "Il Segreto per Non Perdere Tutto", description: "Gestione del bankroll" },
  { title: "L'Unico Modo per Vincere", description: "Value Betting" },
  { title: "Tutte le Scommesse Spiegate", description: "Tipologie di scommesse" },
  { title: "I Numeri che Contano", description: "Leggere le statistiche" },
]

export default function HomePage() {
  const [activeTip, setActiveTip] = useState<string>('singola')
  const [demoPage, setDemoPage] = useState<'dashboard' | 'matches' | 'tipsterai' | 'metodo'>('dashboard')
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [demoCredits, setDemoCredits] = useState(4000)
  const [selectedLeague, setSelectedLeague] = useState('all')
  const [selectedDate, setSelectedDate] = useState(getDemoDates()[0].value)
  const [searchQuery, setSearchQuery] = useState('')
  const [metodoTab, setMetodoTab] = useState('tracker')
  const [demoBankroll, setDemoBankroll] = useState(200)
  const [activeGuide, setActiveGuide] = useState(0)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleAnalyze = (matchId: string) => {
    setSelectedMatch(matchId)
    setDemoCredits(prev => Math.max(0, prev - 10))
  }

  const currentTip = demoTips[activeTip]
  const demoDates = getDemoDates()

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'ALTA':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">ALTA</Badge>
      case 'MEDIA':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">MEDIA</Badge>
      default:
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">BASSA</Badge>
    }
  }

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
                  {pred.status === "WIN" && <span className="text-emerald-400">✓</span>}
                  <span className="text-slate-500">|</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative py-16 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-5xl mx-auto">
            {/* Trust badges */}
            <div className={`flex flex-wrap justify-center gap-3 mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">94.2% Win Rate</span>
              </div>
              <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-medium">12,847 Utenti Attivi</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="text-amber-400 text-sm font-medium">4.9/5 Rating</span>
              </div>
            </div>

            {/* Main headline */}
            <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="text-slate-300">Smettila di</span>
              <span className="block text-red-400 line-through opacity-60">Perdere Soldi</span>
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Inizia a Vincere con l'AI
              </span>
            </h1>

            <p className={`text-xl sm:text-2xl text-slate-300 mb-6 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="text-white font-semibold">L'Intelligenza Artificiale che analizza 847 statistiche per partita</span> e ti dice esattamente cosa giocare.
            </p>

            {/* Value props */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="bg-slate-900/60 backdrop-blur border border-emerald-500/30 rounded-xl p-4">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-emerald-400 font-bold text-lg">+30% Precisione</div>
                <div className="text-slate-400 text-sm">nelle tue scelte pre-partita</div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur border border-cyan-500/30 rounded-xl p-4">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-cyan-400 font-bold text-lg">6 Tips al Giorno</div>
                <div className="text-slate-400 text-sm">pronti ogni mattina</div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur border border-amber-500/30 rounded-xl p-4">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-amber-400 font-bold text-lg">ROI Medio +47%</div>
                <div className="text-slate-400 text-sm">dei nostri utenti</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-8 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Link href="/accedi">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xl px-10 py-7 font-black shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105 uppercase tracking-wide">
                  Voglio Vincere - 49€
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <a href="#demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-600 text-white hover:bg-slate-800 text-lg px-8 py-7">
                  <Play className="mr-2 h-5 w-5" />
                  Prova Gratis la Demo
                </Button>
              </a>
            </div>

            {/* Urgency */}
            <div className={`inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-6 py-3 mb-10 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
              <span className="text-red-400 font-semibold">Offerta Lancio: 49€ invece di 99€ - Solo per questa settimana!</span>
            </div>

            {/* Price box */}
            <div className={`inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-slate-900/80 backdrop-blur border-2 border-emerald-500/50 rounded-2xl px-6 sm:px-8 py-6 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="text-center sm:text-left">
                <div className="text-slate-400 text-sm">Pagamento Unico</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-slate-500 line-through">€99</span>
                  <span className="text-5xl font-black text-emerald-400">€49</span>
                </div>
              </div>
              <div className="hidden sm:block h-16 w-px bg-slate-700"></div>
              <div className="text-center sm:text-left">
                <div className="text-slate-400 text-sm">Zero Rinnovi</div>
                <div className="text-xl font-bold text-white">Mai più pagare</div>
              </div>
              <div className="hidden sm:block h-16 w-px bg-slate-700"></div>
              <div className="text-center sm:text-left">
                <div className="text-slate-400 text-sm">Validità</div>
                <div className="text-xl font-bold text-cyan-400">Tutta la stagione 25/26</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-16 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Unisciti a <span className="text-emerald-400">12,847 Vincitori</span>
            </h2>
            <p className="text-slate-400">Ecco cosa dicono di CalcioAI</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-emerald-400 font-bold text-lg">{t.profit}</span>
                </div>
                <p className="text-slate-300 text-sm mb-3">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.city}</div>
                  </div>
                  <div className="text-slate-500 text-xs">{t.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COME FUNZIONA */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 mb-4">Come Funziona</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Vincere Non È Mai Stato Così Facile
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              3 semplici passi per trasformare le tue scommesse
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30">1</div>
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 h-full pt-12">
                <div className="text-4xl mb-4">🔑</div>
                <h3 className="text-xl font-bold text-white mb-3">Accedi a CalcioAI</h3>
                <p className="text-slate-400">
                  Paghi <span className="text-emerald-400 font-bold">49€ una volta sola</span> e hai accesso illimitato per tutta la stagione.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/30">2</div>
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 h-full pt-12">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-white mb-3">L'AI Lavora Per Te</h3>
                <p className="text-slate-400">
                  Ogni mattina trovi <span className="text-cyan-400 font-bold">6 pronostici freschi</span>: singola, doppia, tripla, mista, bomba e speciale Serie A.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/30">3</div>
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 h-full pt-12">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-3">Incassa le Vincite</h3>
                <p className="text-slate-400">
                  Con un win rate del <span className="text-amber-400 font-bold">94.2% sulle singole</span>, i nostri utenti hanno vinto oltre €2.4M.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERCHÉ L'AI VINCE */}
      <section className="py-20 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">La Tecnologia</Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
                Perché l'AI Batte<br/>
                <span className="text-emerald-400">Qualsiasi Tipster Umano</span>
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                Mentre un tipster umano può analizzare al massimo 20-30 variabili, la nostra AI elabora <span className="text-emerald-400 font-bold">847 dati statistici per ogni singola partita</span> in tempo reale.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <LineChart className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Analisi Statistica Profonda</h4>
                    <p className="text-slate-400 text-sm">Forma, head-to-head, xG, corner, cartellini e 800+ altre metriche</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Machine Learning Avanzato</h4>
                    <p className="text-slate-400 text-sm">L'AI impara da oltre 500.000 partite storiche</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Aggiornamento Real-Time</h4>
                    <p className="text-slate-400 text-sm">Quote e formazioni dell'ultimo minuto integrate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-2xl p-6 border border-emerald-500/30 text-center">
                <div className="text-5xl font-black text-emerald-400 mb-2">847</div>
                <div className="text-slate-400">Variabili Analizzate</div>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 border border-cyan-500/30 text-center">
                <div className="text-5xl font-black text-cyan-400 mb-2">94%</div>
                <div className="text-slate-400">Win Rate Singole</div>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 border border-violet-500/30 text-center">
                <div className="text-5xl font-black text-violet-400 mb-2">500K</div>
                <div className="text-slate-400">Partite Analizzate</div>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 border border-amber-500/30 text-center">
                <div className="text-5xl font-black text-amber-400 mb-2">€2.4M</div>
                <div className="text-slate-400">Vinto dagli Utenti</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 DAILY TIPS SHOWCASE */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 mb-4">TipsterAI</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              6 Proposte Pronte Ogni Mattina
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Dalla singola sicura alla bomba rischiosa. <span className="text-emerald-400 font-semibold">Scegli tu il tuo stile.</span>
            </p>
          </div>

          {/* Tips selector */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8 max-w-4xl mx-auto">
            {Object.entries(demoTips).map(([key, tip]) => {
              const isActive = activeTip === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTip(key)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    isActive
                      ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{tip.emoji}</div>
                  <div className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>{tip.name}</div>
                  <div className="text-emerald-400 text-xs font-semibold">@{tip.odds}</div>
                </button>
              )
            })}
          </div>

          {/* Active tip detail */}
          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{currentTip.emoji}</div>
                    <div>
                      <h3 className="text-2xl font-black text-white">{currentTip.name} DEL GIORNO</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-emerald-500/20 text-emerald-400">Quota @{currentTip.odds}</Badge>
                        <Badge className="bg-blue-500/20 text-blue-400">{currentTip.confidence}% confidence</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-4xl font-black text-emerald-400">{currentTip.odds}x</div>
                    <div className="text-xs text-slate-400">moltiplicatore</div>
                  </div>
                </div>

                {/* Matches */}
                <div className="space-y-3 mb-6">
                  {currentTip.matches ? (
                    currentTip.matches.map((m, i) => (
                      <div key={i} className="bg-slate-800/70 rounded-lg p-4 border border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-slate-400 text-xs mb-1">{m.league} • {m.time}</div>
                            <div className="text-white font-bold">{m.match}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400 font-bold">@{m.odds}</div>
                          </div>
                        </div>
                        <div className="inline-block bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded font-bold text-sm">
                          {m.prediction}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-slate-400 text-xs mb-1">{currentTip.league} • Oggi 20:45</div>
                          <div className="text-white font-bold text-lg">{currentTip.match}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-bold">@{currentTip.odds}</div>
                        </div>
                      </div>
                      <div className="inline-block bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded font-bold">
                        {currentTip.prediction}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Reasoning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-amber-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-amber-400 font-bold mb-1">ANALISI AI</div>
                      <p className="text-slate-300 text-sm">{currentTip.reasoning}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* DEMO INTERATTIVA - REPLICA ESATTA */}
      <section id="demo" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-4">Demo Interattiva</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Esplora CalcioAI Come Se Fossi Dentro
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Dashboard, Matches, TipsterAI, Metodo - <span className="text-emerald-400">tutto funzionante.</span>
            </p>
          </div>

          {/* Demo Container */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl shadow-emerald-500/10">
              {/* Demo Header - Like real app */}
              <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-emerald-500" />
                    <span className="font-bold text-white hidden sm:inline">CalcioAI</span>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">DEMO LIVE</Badge>
                </div>
                <div className="flex items-center gap-2 bg-slate-700 px-3 sm:px-4 py-2 rounded-full">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{demoCredits}</span>
                  <span className="text-slate-400 text-sm hidden sm:inline">crediti</span>
                </div>
              </div>

              {/* Demo Navigation - EXACT like real sidebar */}
              <div className="border-b border-slate-700 px-2 sm:px-6 bg-slate-800/50">
                <div className="flex gap-1 sm:gap-2 overflow-x-auto py-2">
                  {[
                    { key: 'dashboard', icon: <Home className="h-4 w-4" />, label: 'Dashboard' },
                    { key: 'matches', icon: <BarChart3 className="h-4 w-4" />, label: 'Matches' },
                    { key: 'tipsterai', icon: <Sparkles className="h-4 w-4" />, label: 'TipsterAI' },
                    { key: 'metodo', icon: <Calculator className="h-4 w-4" />, label: 'Metodo' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => { setDemoPage(item.key as any); setSelectedMatch(null); }}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                        demoPage === item.key
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {item.icon}
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo Content */}
              <div className="p-4 sm:p-6 min-h-[600px] max-h-[700px] overflow-y-auto">

                {/* DASHBOARD PAGE */}
                {demoPage === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Welcome Section */}
                    <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-500/50 rounded-xl p-4 sm:p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                            Benvenuto in CalcioAI 👋
                          </h2>
                          <p className="text-slate-300 mb-4">
                            {new Date().toLocaleDateString('it-IT', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <Button
                            onClick={() => setDemoPage('tipsterai')}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            🎯 Ottieni Proposte TipsterAI
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          <p className="text-xs text-slate-400 mt-2">6 proposte disponibili oggi</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                          <div className="text-slate-400 text-sm">I tuoi crediti</div>
                          <div className="text-2xl font-bold text-emerald-400">{demoCredits}</div>
                          <div className="text-xs text-slate-500 mt-1">10 crediti per analisi</div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {[
                        { label: 'Partite Oggi', value: '12', icon: <Calendar className="h-5 w-5 text-emerald-400" /> },
                        { label: 'Leghe Attive', value: '8', icon: <Trophy className="h-5 w-5 text-cyan-400" /> },
                        { label: 'Tips AI', value: '6', badge: 'NUOVI', icon: <Sparkles className="h-5 w-5 text-violet-400" /> },
                        { label: 'Crediti', value: demoCredits.toString(), icon: <CreditCard className="h-5 w-5 text-amber-400" /> },
                      ].map((stat, i) => (
                        <Card key={i} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-slate-400 text-xs sm:text-sm">{stat.label}</div>
                                <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {stat.badge && (
                                  <span className="text-xs text-emerald-400 font-semibold">{stat.badge}</span>
                                )}
                                {stat.icon}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Today's Matches */}
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white flex items-center text-base sm:text-lg">
                            <Zap className="h-5 w-5 mr-2 text-emerald-500" />
                            Partite in Evidenza Oggi
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300 hover:bg-slate-700"
                            onClick={() => setDemoPage('matches')}
                          >
                            Vedi tutto
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {demoMatches.slice(0, 3).map((match) => (
                            <div key={match.id} className="bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900 transition-colors">
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-slate-400 text-xs flex items-center gap-2">
                                    <span>🕐 {match.time}</span>
                                    <span>•</span>
                                    <span>{match.league}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-400 font-bold text-sm">{match.predictions.home}%</span>
                                    {getConfidenceBadge(match.predictions.confidence)}
                                  </div>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-white font-medium">{match.homeTeam.name}</span>
                                    <span className="text-slate-400 text-xs">CASA</span>
                                  </div>
                                  <div className="text-center text-slate-400 text-xs py-1">VS</div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-white font-medium">{match.awayTeam.name}</span>
                                    <span className="text-slate-400 text-xs">FUORI</span>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleAnalyze(match.id)}
                                  size="sm"
                                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                                >
                                  📊 Analizza Partita (-10 crediti)
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Tools */}
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-base sm:text-lg">Strumenti Rapidi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { title: 'TipsterAI', desc: '6 proposte oggi', icon: <Sparkles className="h-5 w-5 text-violet-400" />, page: 'tipsterai', highlight: true },
                            { title: 'Match Center', desc: 'Analizza partite', icon: <BarChart3 className="h-5 w-5 text-emerald-400" />, page: 'matches' },
                            { title: 'FantaCoach', desc: 'In arrivo', icon: <Trophy className="h-5 w-5 text-slate-500" />, disabled: true },
                            { title: 'Metodo AI', desc: 'Calcolatori', icon: <Calculator className="h-5 w-5 text-blue-400" />, page: 'metodo' },
                          ].map((tool, i) => (
                            <button
                              key={i}
                              onClick={() => !tool.disabled && setDemoPage(tool.page as any)}
                              disabled={tool.disabled}
                              className={`relative p-4 rounded-lg border transition-all text-left ${
                                tool.disabled
                                  ? 'bg-slate-800/30 border-slate-700/50 opacity-60 cursor-not-allowed'
                                  : tool.highlight
                                    ? 'bg-gradient-to-r from-violet-900/30 to-purple-900/30 border-violet-500/50 hover:border-violet-400'
                                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              {tool.highlight && (
                                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">HOT</span>
                              )}
                              <div className="flex items-center gap-3">
                                {tool.icon}
                                <div>
                                  <div className="text-white font-medium text-sm">{tool.title}</div>
                                  <div className="text-slate-400 text-xs">{tool.desc}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* MATCHES PAGE */}
                {demoPage === 'matches' && (
                  <div className="space-y-6">
                    {selectedMatch === null ? (
                      <>
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                            <BarChart3 className="h-6 w-6 text-emerald-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white">Match Center ⚽</h2>
                            <p className="text-slate-400 text-sm">Scopri e analizza tutte le partite</p>
                          </div>
                        </div>

                        {/* Search */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              placeholder="Cerca squadre o campionati..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 bg-slate-900/50 border-slate-600 text-white"
                            />
                          </div>
                        </div>

                        {/* League Selector */}
                        <div>
                          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                            Campionati
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {demoLeagues.map((league) => (
                              <button
                                key={league.key}
                                onClick={() => setSelectedLeague(league.key)}
                                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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

                        {/* Date Selector */}
                        <div>
                          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            Date
                          </h3>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {demoDates.map((date) => (
                              <button
                                key={date.value}
                                onClick={() => setSelectedDate(date.value)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-w-[70px] ${
                                  selectedDate === date.value
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-600/30'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="font-semibold text-xs">{date.label}</div>
                                  <div className="text-[10px] opacity-70">{date.fullDate}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Matches Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {demoMatches.map((match) => (
                            <Card key={match.id} className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all">
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                    {match.league}
                                  </Badge>
                                  {getConfidenceBadge(match.predictions.confidence)}
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                  <Clock className="h-3 w-3" />
                                  <span>🕐 {match.time}</span>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {/* Teams */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-bold text-white">{match.homeTeam.name.charAt(0)}</span>
                                    </div>
                                    <span className="font-semibold text-white text-sm">{match.homeTeam.name}</span>
                                  </div>
                                  <div className="text-center text-slate-400 text-xs">VS</div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-bold text-white">{match.awayTeam.name.charAt(0)}</span>
                                    </div>
                                    <span className="font-semibold text-white text-sm">{match.awayTeam.name}</span>
                                  </div>
                                </div>

                                {/* Predictions */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs text-slate-400">
                                    <span>1</span>
                                    <span>X</span>
                                    <span>2</span>
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

                                {/* Advice */}
                                <div className="text-center text-sm text-emerald-400">
                                  📊 {match.predictions.advice}
                                </div>

                                {/* CTA */}
                                <Button
                                  onClick={() => handleAnalyze(match.id)}
                                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-sm"
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Analisi Completa (10 crediti)
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      /* Match Analysis Detail */
                      <div>
                        <button
                          onClick={() => setSelectedMatch(null)}
                          className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 text-sm"
                        >
                          ← Torna alle partite
                        </button>

                        {(() => {
                          const match = demoMatches.find(m => m.id === selectedMatch)!
                          return (
                            <div className="space-y-6">
                              <div className="text-center">
                                <div className="text-slate-400 text-sm mb-2">{match.league} • {match.time}</div>
                                <h3 className="text-2xl font-bold text-white">{match.homeTeam.name} vs {match.awayTeam.name}</h3>
                              </div>

                              {/* Probabilities */}
                              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">{match.predictions.home}%</div>
                                  <div className="text-slate-400 text-xs sm:text-sm">Vittoria Casa</div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                                  <div className="text-2xl sm:text-3xl font-black text-amber-400">{match.predictions.draw}%</div>
                                  <div className="text-slate-400 text-xs sm:text-sm">Pareggio</div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                                  <div className="text-2xl sm:text-3xl font-black text-cyan-400">{match.predictions.away}%</div>
                                  <div className="text-slate-400 text-xs sm:text-sm">Vittoria Trasferta</div>
                                </div>
                              </div>

                              {/* Other stats */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Over 2.5</span>
                                    <span className="text-emerald-400 font-bold">68%</span>
                                  </div>
                                  <div className="mt-2 bg-slate-700 rounded-full h-2">
                                    <div className="bg-emerald-500 h-2 rounded-full" style={{width: '68%'}}></div>
                                  </div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400">GOAL</span>
                                    <span className="text-cyan-400 font-bold">72%</span>
                                  </div>
                                  <div className="mt-2 bg-slate-700 rounded-full h-2">
                                    <div className="bg-cyan-500 h-2 rounded-full" style={{width: '72%'}}></div>
                                  </div>
                                </div>
                              </div>

                              {/* AI Suggestion */}
                              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                  <Brain className="h-6 w-6 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">SUGGERIMENTO AI</span>
                                </div>
                                <div className="text-white text-lg font-semibold mb-2">
                                  {match.predictions.advice} @ 1.75
                                </div>
                                <p className="text-slate-300 text-sm">
                                  Basato su 847 variabili analizzate: forma recente, head-to-head, statistiche gol, assenze e condizioni meteo.
                                </p>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* TIPSTERAI PAGE */}
                {demoPage === 'tipsterai' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h1 className="text-3xl sm:text-4xl font-bold mb-2">TipsterAI ⚽</h1>
                      <p className="text-slate-400">
                        Il tuo tutor personale per consigli basati su dati e statistiche
                      </p>
                      <p className="text-slate-500 text-sm mt-2">
                        {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Tips Tabs - EXACT like real */}
                    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-2 border border-slate-700/50">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {Object.entries(demoTips).map(([key, tip]) => {
                          const colors: Record<string, string> = {
                            singola: 'from-emerald-600 to-emerald-500 shadow-emerald-500/30',
                            doppia: 'from-blue-600 to-blue-500 shadow-blue-500/30',
                            tripla: 'from-purple-600 to-purple-500 shadow-purple-500/30',
                            mista: 'from-amber-600 to-amber-500 shadow-amber-500/30',
                            bomba: 'from-red-600 to-red-500 shadow-red-500/30',
                            serieA: 'from-green-600 to-green-500 shadow-green-500/30',
                          }
                          return (
                            <button
                              key={key}
                              onClick={() => setActiveTip(key)}
                              className={`relative px-2 sm:px-4 py-3 rounded-xl transition-all font-medium ${
                                activeTip === key
                                  ? `bg-gradient-to-r ${colors[key]} text-white shadow-lg`
                                  : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xl sm:text-2xl">{tip.emoji}</span>
                                <span className="text-[10px] sm:text-xs font-semibold">{tip.name}</span>
                                <span className={`text-[10px] font-bold ${activeTip === key ? 'text-white/80' : 'text-emerald-400'}`}>
                                  @{tip.odds}
                                </span>
                              </div>
                              {activeTip !== key && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse border-2 border-slate-900"></span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Info header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                          6 proposte attive per oggi
                        </div>
                        <div className="inline-flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-full text-sm">
                          <CreditCard className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">{demoCredits}</span>
                          <span className="text-slate-400">crediti</span>
                        </div>
                      </div>
                      <Button variant="outline" className="border-slate-700 text-slate-300 text-sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Aggiorna (10 crediti)
                      </Button>
                    </div>

                    {/* Tip Card - EXACT like real */}
                    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl p-2 bg-slate-700/50 rounded-lg">{currentTip.emoji}</div>
                          <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                              {currentTip.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                                Quota @{currentTip.odds}
                              </span>
                              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                                {currentTip.confidence}% sicurezza
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl sm:text-3xl font-bold text-emerald-400">{currentTip.odds}x</div>
                          <div className="text-xs text-slate-400">moltiplicatore</div>
                        </div>
                      </div>

                      {/* Matches */}
                      <div className="space-y-4">
                        {(currentTip.matches || [{
                          match: currentTip.match,
                          league: currentTip.league,
                          time: '20:45',
                          prediction: currentTip.prediction,
                          odds: currentTip.odds
                        }]).map((match, i) => (
                          <div key={i} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="text-base sm:text-lg font-bold text-white mb-1">{match.match}</h4>
                                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400">
                                  <span>🏆 {match.league}</span>
                                  <span>🕐 {match.time}</span>
                                </div>
                              </div>
                              {currentTip.matches && (
                                <div className="text-right">
                                  <div className="text-lg font-bold text-cyan-400">@{match.odds}</div>
                                </div>
                              )}
                            </div>
                            <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-lg p-3">
                              <div className="text-emerald-300 font-bold">{match.prediction}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Strategy */}
                      <div className="mt-6 bg-amber-500/10 rounded-lg p-4 border-l-4 border-amber-500">
                        <div className="flex items-start gap-3">
                          <span className="text-amber-400 text-lg">💭</span>
                          <div>
                            <div className="text-xs text-amber-400/80 font-medium mb-1">ANALISI</div>
                            <p className="text-slate-200 text-sm leading-relaxed">{currentTip.reasoning}</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer stats */}
                      <div className="mt-6 pt-4 border-t border-slate-700/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-emerald-400">{currentTip.odds}</div>
                            <div className="text-xs text-slate-400">Quota Finale</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-blue-400">
                              {currentTip.matches ? currentTip.matches.length : '1'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {currentTip.matches ? 'Selezioni' : 'Selezione'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chat Section */}
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white text-base">
                          <MessageSquare className="w-5 h-5" />
                          Chiedi al TipsterAI
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-sm">
                          Fai domande sulle partite o chiedi approfondimenti
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 border border-slate-700 rounded-lg p-4 bg-slate-900/30 mb-4">
                          <p className="text-center text-slate-500 text-sm">
                            Inizia una conversazione chiedendo consigli sulle partite di oggi!
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Chiedi informazioni..."
                            className="bg-slate-900 border-slate-700 text-white"
                            disabled
                          />
                          <Button disabled>Invia</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* METODO PAGE */}
                {demoPage === 'metodo' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-emerald-500" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Metodo AI</h1>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm sm:text-base">
                      Il tuo sistema completo per scommesse intelligenti e gestione del bankroll
                    </p>

                    {/* Tabs */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-800/50 border border-slate-700 p-1 rounded-lg">
                      {[
                        { key: 'tracker', icon: '📊', label: 'Tracker' },
                        { key: 'calculators', icon: '🧮', label: 'Calc' },
                        { key: 'academy', icon: '📚', label: 'Guide' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setMetodoTab(tab.key)}
                          className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg text-xs transition-all ${
                            metodoTab === tab.key
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Tracker Tab */}
                    {metodoTab === 'tracker' && (
                      <div className="space-y-6">
                        {/* Bankroll Setup */}
                        <Card className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border-emerald-500/50">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center text-base sm:text-lg">
                              <DollarSign className="h-6 w-6 mr-2 text-emerald-500" />
                              Il tuo Bankroll
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-sm">
                              Budget attuale: €{demoBankroll.toFixed(2)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="200"
                                defaultValue={demoBankroll}
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                              <Button className="bg-emerald-500 hover:bg-emerald-600">
                                Aggiorna
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          {[
                            { label: 'Bankroll', value: `€${demoBankroll}`, color: 'emerald', icon: <Euro className="h-6 w-6" /> },
                            { label: 'Profitto', value: '+€45.50', color: 'emerald', icon: <TrendingUp className="h-6 w-6" /> },
                            { label: 'ROI', value: '+22.8%', color: 'emerald', icon: <BarChart3 className="h-6 w-6" /> },
                            { label: '% Vincita', value: '67%', color: 'white', icon: <Target className="h-6 w-6" /> },
                          ].map((stat, i) => (
                            <Card key={i} className="bg-slate-800/50 border-slate-700">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-slate-400 text-xs sm:text-sm">{stat.label}</p>
                                    <p className={`text-xl sm:text-2xl font-bold ${stat.color === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>
                                      {stat.value}
                                    </p>
                                  </div>
                                  <div className={stat.color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}>
                                    {stat.icon}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Add Bet */}
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center text-base">
                              <Plus className="h-6 w-6 mr-2 text-emerald-500" />
                              Aggiungi Scommessa
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                              <Input placeholder="Partita" className="bg-slate-900 border-slate-700 text-white text-sm" />
                              <Input placeholder="Selezione" className="bg-slate-900 border-slate-700 text-white text-sm" />
                              <Input placeholder="Quota" type="number" className="bg-slate-900 border-slate-700 text-white text-sm" />
                              <Input placeholder="Stake €" type="number" className="bg-slate-900 border-slate-700 text-white text-sm" />
                              <select className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
                                <option>In attesa</option>
                                <option>Vinta</option>
                                <option>Persa</option>
                              </select>
                              <Button className="bg-emerald-500 hover:bg-emerald-600 text-sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Aggiungi
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Recent Bets */}
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white text-base">Le Tue Scommesse (3)</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {[
                                { match: 'Inter vs Milan', sel: 'Over 2.5', odds: 1.85, stake: 10, status: 'won', result: '+€8.50' },
                                { match: 'Roma vs Lazio', sel: 'GOAL', odds: 1.65, stake: 15, status: 'won', result: '+€9.75' },
                                { match: 'Juve vs Napoli', sel: '1', odds: 2.10, stake: 10, status: 'pending', result: 'In attesa' },
                              ].map((bet, i) => (
                                <div key={i} className="bg-slate-900 rounded-lg p-3 flex items-center justify-between text-sm">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                                    <span className="text-white font-medium">{bet.match}</span>
                                    <span className="text-slate-400">{bet.sel}</span>
                                    <span className="text-slate-400 hidden sm:inline">@{bet.odds}</span>
                                    <span className={`font-bold ${bet.status === 'won' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                      {bet.result}
                                    </span>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-900/20">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Calculators Tab */}
                    {metodoTab === 'calculators' && (
                      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Multipla Calculator */}
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center text-base">
                              <Calculator className="h-6 w-6 mr-2 text-emerald-500" />
                              Calcolatore Multipla
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Input placeholder="Quota 1" className="bg-slate-900 border-slate-700 text-white text-sm" />
                            <Input placeholder="Quota 2" className="bg-slate-900 border-slate-700 text-white text-sm" />
                            <Input placeholder="Stake €" className="bg-slate-900 border-slate-700 text-white text-sm" />
                            <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Quota Totale:</span>
                                <span className="text-white font-bold">2.43</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Vincita Potenziale:</span>
                                <span className="text-emerald-400 font-bold">€24.30</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Stake Calculator */}
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center text-base">
                              <Target className="h-6 w-6 mr-2 text-emerald-500" />
                              Stake Consigliato
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Input placeholder="Bankroll €" defaultValue="200" className="bg-slate-900 border-slate-700 text-white text-sm" />
                            <select className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
                              <option>🟢 Basso (1-2%)</option>
                              <option>🟡 Medio (3-5%)</option>
                              <option>🔴 Alto (5-10%)</option>
                            </select>
                            <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Singola:</span>
                                <span className="text-emerald-400 font-bold">€6.00</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Multipla:</span>
                                <span className="text-yellow-400 font-bold">€3.00</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Academy Tab */}
                    {metodoTab === 'academy' && (
                      <div className="grid lg:grid-cols-4 gap-4 sm:gap-6">
                        {/* Guides Sidebar */}
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white text-base">📚 Guide</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {metodoGuides.map((guide, index) => (
                                <button
                                  key={index}
                                  onClick={() => setActiveGuide(index)}
                                  className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                                    activeGuide === index
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-slate-900/50 text-slate-300 hover:bg-slate-700/50'
                                  }`}
                                >
                                  <div className="font-medium">{guide.title}</div>
                                  <div className="text-xs opacity-75 mt-1">{guide.description}</div>
                                </button>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Guide Content */}
                        <div className="lg:col-span-3">
                          <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                              <CardTitle className="text-white text-base sm:text-lg">{metodoGuides[activeGuide].title}</CardTitle>
                              <CardDescription className="text-slate-400 text-sm">
                                {metodoGuides[activeGuide].description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-slate-300 text-sm leading-relaxed mb-6">
                                <p className="mb-4">Questa guida ti insegnerà le basi per scommettere in modo intelligente...</p>
                                <p className="mb-4">
                                  <span className="text-emerald-400 font-bold">Esempio pratico:</span> Se punti €10 con quota 1.60 e vinci, guadagni €6.
                                </p>
                                <p>
                                  <span className="text-cyan-400 font-bold">Come ti aiuta CalcioAI:</span> Nelle analisi ti mostriamo sempre le quote migliori e quando c'è value!
                                </p>
                              </div>

                              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                                <h4 className="text-emerald-400 font-bold mb-2 text-sm">🎯 Prova CalcioAI</h4>
                                <p className="text-slate-300 text-xs mb-4">
                                  Metti in pratica quello che hai imparato con le nostre analisi AI
                                </p>
                                <div className="flex gap-2">
                                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-xs" onClick={() => setDemoPage('matches')}>
                                    Analizza Partite
                                  </Button>
                                  <Button size="sm" variant="outline" className="border-emerald-500 text-emerald-400 text-xs" onClick={() => setDemoPage('tipsterai')}>
                                    TipsterAI
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Demo Footer */}
              <div className="bg-slate-800/50 border-t border-slate-700 px-4 sm:px-6 py-5 text-center">
                <p className="text-slate-400 mb-4 text-sm">Questa è la demo. Il tool completo ha dati in tempo reale!</p>
                <Link href="/accedi">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 font-bold text-base sm:text-lg px-6 sm:px-8">
                    Accedi al Tool Completo - 49€
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-20 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">Offerta Limitata</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Un Solo Pagamento.<br/>
              <span className="text-emerald-400">Zero Abbonamenti.</span>
            </h2>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-2 text-sm font-bold shadow-lg animate-pulse">
                  🔥 OFFERTA LANCIO -50%
                </Badge>
              </div>

              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/20 rounded-3xl border-2 border-emerald-500/50 p-8 shadow-2xl shadow-emerald-500/10">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">CalcioAI Pro</h3>
                  <p className="text-slate-400">Stagione 2025/2026 completa</p>

                  <div className="mt-6">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-slate-500 line-through text-3xl">€99</span>
                      <span className="text-7xl font-black text-white">€49</span>
                    </div>
                    <div className="text-emerald-400 font-bold text-lg mt-2">Risparmi €50!</div>
                    <div className="text-slate-500 text-sm mt-1">Pagamento unico • Mai più rinnovi</div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    "6 pronostici AI ogni giorno",
                    "Singola, Doppia, Tripla, Mista, Bomba, Serie A",
                    "4000 crediti per analisi partite",
                    "Analisi dettagliate con 847 statistiche",
                    "Valido tutta la stagione 2025/2026",
                    "Aggiornamenti gratuiti inclusi"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/accedi">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xl py-7 font-black shadow-lg shadow-emerald-500/30 uppercase">
                    Voglio CalcioAI - 49€
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>

                <div className="text-center mt-6 space-y-2">
                  <p className="text-emerald-400 font-semibold">
                    💡 Basta UNA singola vincente per recuperare tutto!
                  </p>
                  <p className="text-slate-500 text-sm">
                    ✓ Pagamento sicuro con Stripe • ✓ Accesso immediato
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-900/30 via-slate-950 to-cyan-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
            Ogni Giorno Che Aspetti<br/>
            <span className="text-red-400">Sono 6 Pronostici Persi</span>
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            I nostri utenti hanno già vinto oltre €2.4 milioni quest'anno.
            <span className="text-emerald-400 font-semibold"> Tu cosa aspetti?</span>
          </p>
          <Link href="/accedi">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xl px-12 py-8 font-black shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105 uppercase">
              Inizia a Vincere Ora - 49€
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
          <p className="text-slate-500 text-sm mt-6">
            ✓ Pagamento sicuro • ✓ Accesso immediato • ✓ Zero rinnovi
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CalcioAI</span>
              </div>
              <p className="text-slate-400 text-sm">
                L'intelligenza artificiale che analizza il calcio per te. 6 pronostici al giorno, statistiche avanzate, zero abbonamenti.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Prodotti</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><span className="hover:text-white cursor-pointer">TipsterAI</span></li>
                <li><span className="hover:text-white cursor-pointer">Analisi Partite</span></li>
                <li><span className="hover:text-white cursor-pointer">Match Center</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Supporto</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><span className="hover:text-white cursor-pointer">Centro Assistenza</span></li>
                <li><span className="hover:text-white cursor-pointer">Contatti</span></li>
                <li><span className="hover:text-white cursor-pointer">FAQ</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legale</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
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
                <p className="mb-1">CalcioAI fornisce analisi statistiche a scopo informativo.</p>
                <p>Non incoraggiamo il gioco d'azzardo. Gioca responsabilmente su piattaforme autorizzate ADM.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ANIMATIONS */}
      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
