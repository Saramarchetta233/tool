'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calculator, 
  TrendingUp, 
  BookOpen, 
  Target, 
  DollarSign, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft, 
  Trophy,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  PieChart,
  Activity,
  Euro,
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'

// Types
interface Bet {
  id: string
  date: string
  match: string
  selection: string
  odds: number
  stake: number
  status: 'pending' | 'won' | 'lost' | 'void'
  result?: number // profit/loss
}

interface BankrollStats {
  initial: number
  current: number
  totalBets: number
  won: number
  lost: number
  pending: number
  totalProfit: number
  roi: number
  winRate: number
}

export default function MetodoPage() {
  const [activeTab, setActiveTab] = useState('tracker')
  const [activeGuide, setActiveGuide] = useState(0)

  // Tracker State
  const [bankroll, setBankroll] = useState<number>(0)
  const [bets, setBets] = useState<Bet[]>([])
  const [newBet, setNewBet] = useState({
    match: '',
    selection: '',
    odds: '',
    stake: '',
    status: 'pending'
  })

  // Calculator States
  const [multiplaCalc, setMultiplaCalc] = useState({
    odds: ['', ''],
    stake: ''
  })
  
  const [stakeCalc, setStakeCalc] = useState({
    bankroll: '',
    riskLevel: 'medium'
  })
  
  const [valueCalc, setValueCalc] = useState({
    bookmakerOdds: '',
    myProbability: ''
  })
  
  const [simulatorCalc, setSimulatorCalc] = useState({
    initialBankroll: '',
    fixedStake: '',
    averageOdds: '',
    winRate: ''
  })

  // Load data from localStorage on mount
  useEffect(() => {
    const savedBankroll = localStorage.getItem('calcio-ai-bankroll')
    const savedBets = localStorage.getItem('calcio-ai-bets')
    
    if (savedBankroll) {
      setBankroll(parseFloat(savedBankroll))
    }
    if (savedBets) {
      setBets(JSON.parse(savedBets))
    }
  }, [])

  // Save to localStorage
  const saveBankroll = (amount: number) => {
    setBankroll(amount)
    localStorage.setItem('calcio-ai-bankroll', amount.toString())
  }

  const saveBets = (newBets: Bet[]) => {
    setBets(newBets)
    localStorage.setItem('calcio-ai-bets', JSON.stringify(newBets))
  }

  // Bet management
  const addBet = () => {
    if (!newBet.match || !newBet.selection || !newBet.odds || !newBet.stake) return

    const bet: Bet = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      match: newBet.match,
      selection: newBet.selection,
      odds: parseFloat(newBet.odds),
      stake: parseFloat(newBet.stake),
      status: newBet.status as 'pending' | 'won' | 'lost' | 'void'
    }

    // Calculate result if not pending
    if (bet.status === 'won') {
      bet.result = bet.stake * bet.odds - bet.stake
    } else if (bet.status === 'lost') {
      bet.result = -bet.stake
    } else if (bet.status === 'void') {
      bet.result = 0
    }

    const updatedBets = [bet, ...bets]
    saveBets(updatedBets)
    
    // Reset form
    setNewBet({
      match: '',
      selection: '',
      odds: '',
      stake: '',
      status: 'pending'
    })
  }

  const updateBetStatus = (betId: string, status: 'won' | 'lost' | 'void' | 'pending') => {
    const updatedBets = bets.map(bet => {
      if (bet.id === betId) {
        const updatedBet = { ...bet, status }
        
        // Calculate result
        if (status === 'won') {
          updatedBet.result = bet.stake * bet.odds - bet.stake
        } else if (status === 'lost') {
          updatedBet.result = -bet.stake
        } else if (status === 'void') {
          updatedBet.result = 0
        } else {
          delete updatedBet.result
        }
        
        return updatedBet
      }
      return bet
    })
    saveBets(updatedBets)
  }

  const deleteBet = (betId: string) => {
    const updatedBets = bets.filter(bet => bet.id !== betId)
    saveBets(updatedBets)
  }

  // Calculate stats
  const calculateStats = (): BankrollStats => {
    const totalBets = bets.length
    const won = bets.filter(bet => bet.status === 'won').length
    const lost = bets.filter(bet => bet.status === 'lost').length
    const pending = bets.filter(bet => bet.status === 'pending').length
    const totalProfit = bets.reduce((sum, bet) => sum + (bet.result || 0), 0)
    const current = bankroll + totalProfit
    const roi = bankroll > 0 ? (totalProfit / bankroll) * 100 : 0
    const winRate = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0

    return {
      initial: bankroll,
      current,
      totalBets,
      won,
      lost,
      pending,
      totalProfit,
      roi,
      winRate
    }
  }

  const stats = calculateStats()

  // Calculator functions
  const calculateMultipla = () => {
    const validOdds = multiplaCalc.odds
      .filter(odd => odd.trim() !== '')
      .map(odd => parseFloat(odd))
      .filter(odd => !isNaN(odd) && odd > 1)
    
    if (validOdds.length === 0) return { totalOdds: 0, probability: 0, potential: 0 }
    
    const totalOdds = validOdds.reduce((acc, odd) => acc * odd, 1)
    const probability = (1 / totalOdds) * 100
    const stake = parseFloat(multiplaCalc.stake) || 0
    const potential = stake * totalOdds
    
    return { totalOdds, probability, potential }
  }

  const calculateStake = () => {
    const bankrollAmount = parseFloat(stakeCalc.bankroll) || 0
    const multipliers = {
      low: { single: 0.01, multiple: 0.005 },
      medium: { single: 0.03, multiple: 0.015 },
      high: { single: 0.05, multiple: 0.025 }
    }
    
    const multiplier = multipliers[stakeCalc.riskLevel as keyof typeof multipliers] || multipliers.medium
    
    return {
      single: bankrollAmount * multiplier.single,
      multiple: bankrollAmount * multiplier.multiple
    }
  }

  const calculateValue = () => {
    const odds = parseFloat(valueCalc.bookmakerOdds) || 0
    const prob = parseFloat(valueCalc.myProbability) || 0
    
    if (odds === 0 || prob === 0) return { value: 0, hasValue: false, edge: 0 }
    
    const impliedProb = (1 / odds) * 100
    const value = (prob / 100) * odds
    const hasValue = value > 1
    const edge = ((value - 1) * 100)
    
    return { value, hasValue, edge, impliedProb }
  }

  const simulateBetting = () => {
    const initial = parseFloat(simulatorCalc.initialBankroll) || 1000
    const stake = parseFloat(simulatorCalc.fixedStake) || 10
    const odds = parseFloat(simulatorCalc.averageOdds) || 2.0
    const winRate = parseFloat(simulatorCalc.winRate) || 50
    
    const results = []
    let currentBankroll = initial
    
    for (let i = 0; i < 100; i++) {
      const win = Math.random() * 100 < winRate
      if (win) {
        currentBankroll += stake * (odds - 1)
      } else {
        currentBankroll -= stake
      }
      results.push(currentBankroll)
    }
    
    return results
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Data', 'Partita', 'Selezione', 'Quota', 'Stake', 'Stato', 'Esito']
    const rows = bets.map(bet => [
      bet.date,
      bet.match,
      bet.selection,
      bet.odds,
      bet.stake,
      bet.status,
      bet.result ? (bet.result > 0 ? `+€${bet.result.toFixed(2)}` : `€${bet.result.toFixed(2)}`) : 'In attesa'
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'scommesse_tracker.csv'
    link.click()
  }

  const reset = () => {
    if (confirm('Sei sicuro di voler cancellare tutti i dati?')) {
      setBankroll(0)
      setBets([])
      localStorage.removeItem('calcio-ai-bankroll')
      localStorage.removeItem('calcio-ai-bets')
    }
  }

  const guides = [
    {
      title: "Le Quote Spiegate Semplice",
      description: "Come funzionano le quote e cosa ti dicono",
      content: `Ciao! Se sei qui probabilmente vuoi capire come funzionano le quote. Tranquillo, è più semplice di quello che sembra.

**La quota ti dice due cose:**
1. Quanto vinci se punti
2. Quanto è probabile quell'evento (secondo il bookmaker)

**Esempio pratico:**
- Roma vs Genoa, quota Roma = 1.60
- Punti €10 sulla Roma
- Se vince: €10 × 1.60 = €16 (guadagni €6)

**Come leggere la probabilità:**
La formula è: 100 / quota = probabilità %

- Quota 1.50 = 66% di probabilità
- Quota 2.00 = 50% di probabilità
- Quota 3.00 = 33% di probabilità

**Il trucco dei bookmaker:**
I bookmaker mettono un margine. Se sommi le probabilità di 1, X, 2 non fa mai 100%, fa tipo 105%. Quel 5% è il loro guadagno.

**Come ti aiuta CalcioAI:**
Su [/matches](/matches) vedi le quote reali e le nostre analisi. Ti diciamo quando una quota ha valore e quando è una trappola.`
    },
    {
      title: "Il Segreto per Non Perdere Tutto",
      description: "Gestione del bankroll spiegata semplice",
      content: `Guarda, te lo dico subito: il 90% di chi perde alle scommesse non perde perché sceglie male, ma perché gestisce male i soldi.

**Regola d'oro: Mai scommettere più del 5% del bankroll**

Cos'è il bankroll? È il budget che dedichi SOLO alle scommesse. Non i soldi per l'affitto, non i risparmi. Soldi che puoi permetterti di perdere.

**Esempio:**
- Bankroll: €200
- Stake massimo per scommessa: €10 (5%)
- Stake consigliato: €4-6 (2-3%)

**Perché funziona:**
Se perdi 10 scommesse di fila (capita!), hai perso €40-60, non tutto. Hai ancora €140-160 per recuperare.

**I livelli di stake:**
🟢 Alta sicurezza: 1-2% - Scommesse rischiose, quote alte
🟡 Media sicurezza: 3-4% - Scommesse normali  
🔴 Bassa sicurezza: 5% max - Solo quando sei MOLTO sicuro

**Come ti aiuta CalcioAI:**
Su [TipsterAI](/tipsterai) ti diamo la "confidence" di ogni proposta. Confidence alta? Puoi osare un po' di più. Confidence bassa? Stake minimo.

Usa il nostro Tracker qui sopra per tenere traccia di tutto!`
    },
    {
      title: "L'Unico Modo per Vincere a Lungo Termine",
      description: "Cos'è il Value Betting",
      content: `Ti svelo il segreto dei professionisti: non scommettono sulla squadra che vince, scommettono quando la quota è SBAGLIATA.

**Cos'è il value?**
C'è value quando la probabilità reale è più alta di quella che dice la quota.

**Esempio:**
- Quota Roma = 2.50 (implica 40% di probabilità)
- Ma secondo te la Roma ha 50% di vincere
- È VALUE! Perché 50% > 40%

**La formula:**
Value = (Probabilità tua × Quota) - 1
- Se è > 0 = VALUE, scommetti
- Se è < 0 = NO value, lascia stare

**Esempio numerico:**
- Quota: 2.50
- Tua probabilità: 50%
- Value = (0.50 × 2.50) - 1 = 0.25 = +25% di edge!

**Attenzione:**
Il value betting funziona sul LUNGO termine. Puoi perdere la singola scommessa, ma se scommetti sempre con value, dopo 100 scommesse sarai in profitto.

**Come ti aiuta CalcioAI:**
Le nostre analisi su [/matches](/matches) ti mostrano quando c'è value. Guarda la sezione "Value Bets" in ogni analisi!`
    },
    {
      title: "Tutte le Scommesse Spiegate",
      description: "Tipologie di scommesse",
      content: `Ecco tutti i tipi di scommessa che puoi fare:

**Esito Finale (1X2)**
- 1 = Vince la squadra di casa
- X = Pareggio
- 2 = Vince la squadra ospite

**Doppia Chance**
- 1X = Casa vince O pareggio
- X2 = Ospite vince O pareggio
- 12 = Casa vince O ospite vince (no pareggio)

Quote più basse ma più sicure!

**Over/Under**
- Over 2.5 = Almeno 3 gol totali
- Under 2.5 = Massimo 2 gol totali
- Esistono anche 1.5, 3.5, ecc.

**Gol/NoGol (BTTS)**
- Gol = Entrambe le squadre segnano
- NoGol = Almeno una squadra NON segna

**Risultato Esatto**
- Indovini il risultato preciso (es: 2-1)
- Quote alte (6-15), difficile ma paga bene

**Combo/Multiscommessa**
- Combini più selezioni sulla stessa partita
- Es: "1 + Under 2.5" = Casa vince E massimo 2 gol
- Le quote si moltiplicano!

**Come ti aiuta CalcioAI:**
Su [/matches](/matches) ti consigliamo il mercato migliore per ogni partita. Non devi decidere tu!`
    },
    {
      title: "I Numeri che Contano Davvero",
      description: "Leggere le statistiche",
      content: `Non tutte le statistiche sono utili. Ecco quelle che contano:

**1. Forma recente (ultime 5 partite)**
- Una squadra in forma vince più spesso
- Ma attenzione: guarda se erano partite facili o difficili!

**2. Rendimento Casa/Trasferta**
- Alcune squadre sono fortissime in casa e deboli fuori
- Altre giocano uguale ovunque

**3. Media gol**
- Media gol fatti + subiti > 3? Pensa all'Over
- Media < 2? Pensa all'Under

**4. Scontri diretti (H2H)**
- Come sono finite le ultime partite tra queste due squadre?
- Alcune squadre hanno "bestie nere" che non battono mai

**5. Classifica e motivazioni**
- Lotta per lo scudetto? Saranno carichi
- Salvezza già ok e niente da chiedere? Potrebbero rilassarsi

**Cosa NON guardare:**
- Possesso palla (non significa nulla)
- Tiri totali (conta la qualità, non la quantità)
- Statistiche di 2+ anni fa

**Come ti aiuta CalcioAI:**
Facciamo noi il lavoro sporco! Su [/matches](/matches) vedi già le statistiche che contano, elaborate dalla nostra AI.`
    },
    {
      title: "Le Partite da Evitare",
      description: "Quando NON scommettere",
      content: `A volte la scommessa migliore è NON scommettere. Ecco quando stare fermi:

**1. Derby e partite sentite**
- Troppo imprevedibili
- Le quote non riflettono la realtà del campo

**2. Ultima giornata di campionato**
- Motivazioni strane
- Accordi sottobanco? Mai dire mai...

**3. Amichevoli**
- Zero motivazione
- Turnover estremo
- Impossibile prevedere

**4. Squadre in crisi societaria**
- Stipendi non pagati = giocatori demotivati
- Notizie negative = prestazioni negative

**5. Quando sei in tilt**
- Hai perso 3 scommesse di fila e vuoi "recuperare"
- FERMATI. Fai una pausa.

**6. Quando non conosci le squadre**
- Se non sai nulla di Norvegia o Kazakistan, non scommettere
- Stick to what you know!

**La regola d'oro:**
"Non so" è una risposta valida. Non devi scommettere su tutto.

**Come ti aiuta CalcioAI:**
Se non siamo sicuri, te lo diciamo. Quando vedi "Confidence: 50%" su [TipsterAI](/tipsterai), significa "forse meglio lasciar stare".`
    },
    {
      title: "Cosa Conviene Davvero?",
      description: "Singola vs Multipla",
      content: `Spoiler: la singola vince quasi sempre. Ma vediamo perché.

**SINGOLA**
- 1 sola scommessa
- Se vinci, vinci
- Più facile vincere

**MULTIPLA**
- 2+ scommesse insieme
- Devono vincere TUTTE
- Quote più alte ma molto più difficile

**La matematica non mente:**

Singola con 70% di probabilità:
- Vinci 70 volte su 100

Doppia con due scommesse al 70%:
- Vinci 0.70 × 0.70 = 49 volte su 100

Tripla con tre scommesse al 70%:
- Vinci 0.70 × 0.70 × 0.70 = 34 volte su 100

**Vedi? Ogni selezione che aggiungi DIMEZZA le tue probabilità!**

**Quando ha senso la multipla:**
- Quando le quote singole sono troppo basse (< 1.30)
- Per divertimento con stake basso
- Mai con soldi che non puoi perdere

**Il mio consiglio:**
- 80% del bankroll su singole
- 20% su doppie/triple
- Bombe e miste solo per divertimento (1% max)

**Come ti aiuta CalcioAI:**
Su [TipsterAI](/tipsterai) ti diamo sia singole sicure che multiple per chi vuole rischiare. Scegli tu!`
    },
    {
      title: "Come Sopravvivere alle Serie Negative",
      description: "Gestire le perdite",
      content: `Perderai. È matematico. Anche il miglior tipster del mondo perde il 40% delle scommesse.

**La verità:**
- Serie di 5 sconfitte consecutive? Capita 1 volta al mese
- Serie di 10 sconfitte? Capita 1-2 volte all'anno
- Non significa che stai sbagliando tutto!

**Cosa NON fare quando perdi:**

❌ Raddoppiare lo stake per "recuperare"
❌ Scommettere su partite che non conosci
❌ Inseguire le perdite con multiple folli
❌ Depositare altri soldi "questa volta va bene"

**Cosa fare:**

✅ Fai una pausa (anche 2-3 giorni)
✅ Rivedi le scommesse: erano value? Il ragionamento era giusto?
✅ Se il ragionamento era giusto, continua così. La varianza si sistema.
✅ Se hai sbagliato analisi, impara e migliora

**Il mindset giusto:**
Non ragionare sulla singola scommessa. Ragiona su 100 scommesse.
- 60 vinte su 100 = profitto
- Quella singola persa non conta nulla

**La regola del "domani":**
Se oggi sei arrabbiato per una perdita, NON scommettere fino a domani. Mai scommettere con le emozioni.

**Come ti aiuta CalcioAI:**
Usa il Tracker qui sopra! Vedere i numeri reali (ROI, % vincita) ti aiuta a capire se stai andando bene o male, senza farti guidare dalle emozioni.`
    },
    {
      title: "La Strategia dei Pazienti",
      description: "Strategia Under 2.5",
      content: `L'Under 2.5 è una delle scommesse più sottovalutate. Ecco come usarla.

**Quando funziona:**

✅ Entrambe le squadre hanno media gol bassa
✅ Difese forti, attacchi deboli
✅ Partite con poco in palio
✅ Condizioni meteo avverse (pioggia, neve)
✅ Squadre che si conoscono bene (pochi rischi)

**Quando evitarla:**

❌ Derby e partite sentite (imprevedibili)
❌ Squadre che "devono" vincere (spingono)
❌ Sfide tra prime e ultime (la prima segna tanto)
❌ Quote sotto 1.50 (poco value)

**I campionati migliori per Under:**
- Serie A (sì, siamo difensivisti!)
- Ligue 1 (tranne PSG)
- Liga (squadre medio-basse)

**I campionati peggiori:**
- Bundesliga (si segna tantissimo)
- Eredivisie (difese colabrodo)

**Come ti aiuta CalcioAI:**
Nelle analisi su [/matches](/matches) vedi la media gol e il nostro consiglio Over/Under. Fidati dei dati!`
    },
    {
      title: "Quando Fidarsi del Fattore Campo",
      description: "Strategia Casa Forte",
      content: `Alcune squadre in casa sono imbattibili. Ecco come sfruttarle.

**Cosa cercare:**

1. % vittorie in casa > 60%
2. Pochi gol subiti in casa
3. Pubblico caldo (stadi sempre pieni)
4. Squadre che giocano diversamente casa/fuori

**Esempi storici:**
- Liverpool ad Anfield
- Atalanta a Bergamo
- Lazio all'Olimpico
- Athletic Bilbao a San Mamés

**Come scommettere:**

- Se quota "1" è tra 1.50-2.00 → Singola
- Se quota "1" è sotto 1.40 → Aspetta o fai combo
- Se quota "1" è sopre 2.20 → C'è un motivo, verifica

**Attenzione:**
Il fattore campo sta diminuendo negli ultimi anni. Verifica sempre i dati recenti, non la reputazione storica!

**Come ti aiuta CalcioAI:**
Su [/matches](/matches) vedi il rendimento casa/trasferta di ogni squadra. Dati freschi, non reputazione!`
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold gradient-text">Metodo AI</h1>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xl text-slate-400">
            Il tuo sistema completo per scommesse intelligenti e gestione del bankroll
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-900/50 border border-slate-700 h-auto">
            <TabsTrigger value="tracker" className="flex flex-col items-center gap-1 p-3 text-xs">
              <span>📊</span>
              <span className="hidden sm:inline">Tracker Scommesse</span>
              <span className="sm:hidden">Tracker</span>
            </TabsTrigger>
            <TabsTrigger value="calculators" className="flex flex-col items-center gap-1 p-3 text-xs">
              <span>🧮</span>
              <span className="hidden sm:inline">Calcolatori</span>
              <span className="sm:hidden">Calc</span>
            </TabsTrigger>
            <TabsTrigger value="academy" className="flex flex-col items-center gap-1 p-3 text-xs">
              <span>📚</span>
              <span className="hidden sm:inline">Academy</span>
              <span className="sm:hidden">Guide</span>
            </TabsTrigger>
          </TabsList>

          {/* TRACKER SECTION */}
          <TabsContent value="tracker" className="space-y-6">
            
            {/* Bankroll Setup */}
            {bankroll === 0 && (
              <Card className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border-emerald-500/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="h-6 w-6 mr-2 text-emerald-500" />
                    Imposta il tuo Bankroll
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Quanto vuoi dedicare alle scommesse? Questo sarà il tuo budget di partenza.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label htmlFor="initial-bankroll" className="text-slate-300 text-sm font-medium">Bankroll iniziale (€)</label>
                      <Input
                        id="initial-bankroll"
                        type="number"
                        placeholder="es. 100"
                        className="bg-slate-800 border-slate-700 text-white text-base"
                        style={{ fontSize: '16px' }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = parseFloat((e.target as HTMLInputElement).value)
                            if (value > 0) saveBankroll(value)
                          }
                        }}
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        const input = document.getElementById('initial-bankroll') as HTMLInputElement
                        const value = parseFloat(input.value)
                        if (value > 0) saveBankroll(value)
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      Inizia
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">
                    💡 Consiglio: usa solo soldi che puoi permetterti di perdere
                  </p>
                </CardContent>
              </Card>
            )}

            {bankroll > 0 && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Bankroll Attuale</p>
                          <p className={`text-2xl font-bold ${stats.current >= stats.initial ? 'text-emerald-400' : 'text-red-400'}`}>
                            €{stats.current.toFixed(2)}
                          </p>
                        </div>
                        <Euro className={`h-8 w-8 ${stats.current >= stats.initial ? 'text-emerald-500' : 'text-red-500'}`} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Profitto/Perdita</p>
                          <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stats.totalProfit >= 0 ? '+' : ''}€{stats.totalProfit.toFixed(2)}
                          </p>
                        </div>
                        {stats.totalProfit >= 0 ? (
                          <TrendingUp className="h-8 w-8 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-8 w-8 text-red-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">ROI</p>
                          <p className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                          </p>
                        </div>
                        <BarChart3 className={`h-8 w-8 ${stats.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">% Vincita</p>
                          <p className="text-2xl font-bold text-white">
                            {stats.winRate.toFixed(0)}%
                          </p>
                          <p className="text-xs text-slate-400">
                            {stats.won}V / {stats.lost}P / {stats.pending}A
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Add Bet Form */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Plus className="h-6 w-6 mr-2 text-emerald-500" />
                      Aggiungi Scommessa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div>
                        <label className="text-slate-300 text-sm font-medium">Partita</label>
                        <Input
                          placeholder="es. Roma vs Genoa"
                          value={newBet.match}
                          onChange={(e) => setNewBet({...newBet, match: e.target.value})}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="text-slate-300 text-sm font-medium">Selezione</label>
                        <Input
                          placeholder="es. 1, Over 2.5"
                          value={newBet.selection}
                          onChange={(e) => setNewBet({...newBet, selection: e.target.value})}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="text-slate-300">Quota</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1.75"
                          value={newBet.odds}
                          onChange={(e) => setNewBet({...newBet, odds: e.target.value})}
                          className="bg-slate-800 border-slate-700 text-white text-base"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      
                      <div>
                        <label className="text-slate-300">Stake (€)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="10"
                          value={newBet.stake}
                          onChange={(e) => setNewBet({...newBet, stake: e.target.value})}
                          className="bg-slate-800 border-slate-700 text-white text-base"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      
                      <div>
                        <label className="text-slate-300">Stato</label>
                        <select
                          value={newBet.status}
                          onChange={(e) => setNewBet({...newBet, status: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                        >
                          <option value="pending">In attesa</option>
                          <option value="won">Vinta</option>
                          <option value="lost">Persa</option>
                          <option value="void">Void</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button onClick={addBet} className="w-full bg-emerald-500 hover:bg-emerald-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bets List */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white flex items-center">
                      <Activity className="h-6 w-6 mr-2 text-emerald-500" />
                      Le Tue Scommesse ({bets.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={exportToCSV} variant="outline" size="sm" className="border-slate-700 text-slate-300">
                        <Download className="h-4 w-4 mr-2" />
                        Esporta CSV
                      </Button>
                      <Button onClick={reset} variant="outline" size="sm" className="border-red-500 text-red-400">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bets.length === 0 ? (
                      <p className="text-center text-slate-400 py-8">
                        Nessuna scommessa ancora. Aggiungi la prima!
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {bets.map((bet) => (
                          <div key={bet.id} className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 flex-1">
                              <div className="text-white font-medium">{bet.match}</div>
                              <div className="text-slate-400">{bet.selection}</div>
                              <div className="text-slate-400">@{bet.odds}</div>
                              <div className="text-slate-400">€{bet.stake}</div>
                              <div>
                                <select
                                  value={bet.status}
                                  onChange={(e) => updateBetStatus(bet.id, e.target.value as any)}
                                  className="w-24 h-8 bg-slate-700 border-none text-xs rounded px-2"
                                >
                                  <option value="pending">Attesa</option>
                                  <option value="won">Vinta</option>
                                  <option value="lost">Persa</option>
                                  <option value="void">Void</option>
                                </select>
                              </div>
                              <div className={`font-bold ${
                                bet.result === undefined ? 'text-slate-400' :
                                bet.result > 0 ? 'text-emerald-400' : 
                                bet.result < 0 ? 'text-red-400' : 'text-slate-400'
                              }`}>
                                {bet.result === undefined ? 'In attesa' : 
                                 bet.result > 0 ? `+€${bet.result.toFixed(2)}` :
                                 bet.result < 0 ? `€${bet.result.toFixed(2)}` : '€0.00'}
                              </div>
                            </div>
                            <Button
                              onClick={() => deleteBet(bet.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* CALCULATORS SECTION */}
          <TabsContent value="calculators" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Multipla Calculator */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calculator className="h-6 w-6 mr-2 text-emerald-500" />
                    Calcolatore Multipla
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Calcola quota totale e vincita potenziale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {multiplaCalc.odds.map((odd, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Quota ${index + 1}`}
                          value={odd}
                          onChange={(e) => {
                            const newOdds = [...multiplaCalc.odds]
                            newOdds[index] = e.target.value
                            setMultiplaCalc({...multiplaCalc, odds: newOdds})
                          }}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                        {multiplaCalc.odds.length > 2 && (
                          <Button
                            onClick={() => {
                              const newOdds = multiplaCalc.odds.filter((_, i) => i !== index)
                              setMultiplaCalc({...multiplaCalc, odds: newOdds})
                            }}
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      onClick={() => setMultiplaCalc({...multiplaCalc, odds: [...multiplaCalc.odds, '']})}
                      variant="outline"
                      className="w-full border-slate-700 text-slate-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Quota
                    </Button>
                  </div>
                  
                  <div>
                    <label className="text-slate-300">Stake (€)</label>
                    <Input
                      type="number"
                      value={multiplaCalc.stake}
                      onChange={(e) => setMultiplaCalc({...multiplaCalc, stake: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                    {(() => {
                      const result = calculateMultipla()
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Quota Totale:</span>
                            <span className="text-white font-bold">{result.totalOdds.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Probabilità:</span>
                            <span className="text-white">{result.probability.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Vincita Potenziale:</span>
                            <span className="text-emerald-400 font-bold">€{result.potential.toFixed(2)}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Stake Calculator */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="h-6 w-6 mr-2 text-emerald-500" />
                    Stake Consigliato
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Calcola quanto scommettere in base al rischio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-slate-300">Bankroll Totale (€)</label>
                    <Input
                      type="number"
                      value={stakeCalc.bankroll}
                      onChange={(e) => setStakeCalc({...stakeCalc, bankroll: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-slate-300">Livello di Rischio</label>
                    <select
                      value={stakeCalc.riskLevel}
                      onChange={(e) => setStakeCalc({...stakeCalc, riskLevel: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                    >
                      <option value="low">🟢 Basso (1-2%)</option>
                      <option value="medium">🟡 Medio (3-5%)</option>
                      <option value="high">🔴 Alto (5-10%)</option>
                    </select>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                    {(() => {
                      const result = calculateStake()
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stake Singola:</span>
                            <span className="text-emerald-400 font-bold">€{result.single.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stake Multipla:</span>
                            <span className="text-yellow-400 font-bold">€{result.multiple.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-2 p-2 bg-slate-700/50 rounded">
                            💡 Non superare mai questi limiti per proteggere il tuo bankroll
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Value Bet Calculator */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CheckCircle className="h-6 w-6 mr-2 text-emerald-500" />
                    Value Bet Detector
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Scopri se una scommessa ha valore matematico
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-slate-300">Quota Bookmaker</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={valueCalc.bookmakerOdds}
                      onChange={(e) => setValueCalc({...valueCalc, bookmakerOdds: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-slate-300">La Mia Probabilità (%)</label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={valueCalc.myProbability}
                      onChange={(e) => setValueCalc({...valueCalc, myProbability: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Secondo te, quante % ha di vincere?
                    </p>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                    {(() => {
                      const result = calculateValue()
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Risultato:</span>
                            <Badge className={result.hasValue ? 'bg-emerald-500' : 'bg-red-500'}>
                              {result.hasValue ? '✅ È VALUE!' : '❌ NON è value'}
                            </Badge>
                          </div>
                          {result.edge > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Edge:</span>
                              <span className="text-emerald-400 font-bold">+{result.edge.toFixed(1)}%</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Prob. Implicita:</span>
                            <span className="text-white">{(result.impliedProb || 0).toFixed(1)}%</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Simulator */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <PieChart className="h-6 w-6 mr-2 text-emerald-500" />
                    Simulatore 100 Scommesse
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Simula come andresti con questi parametri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300">Bankroll (€)</label>
                      <Input
                        type="number"
                        value={simulatorCalc.initialBankroll}
                        onChange={(e) => setSimulatorCalc({...simulatorCalc, initialBankroll: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300">Stake Fisso (€)</label>
                      <Input
                        type="number"
                        value={simulatorCalc.fixedStake}
                        onChange={(e) => setSimulatorCalc({...simulatorCalc, fixedStake: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300">Quota Media</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={simulatorCalc.averageOdds}
                        onChange={(e) => setSimulatorCalc({...simulatorCalc, averageOdds: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300">% Vincita</label>
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={simulatorCalc.winRate}
                        onChange={(e) => setSimulatorCalc({...simulatorCalc, winRate: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      const results = simulateBetting()
                      const final = results[results.length - 1]
                      const initial = parseFloat(simulatorCalc.initialBankroll) || 1000
                      alert(`Simulazione completata!\n\nBankroll finale: €${final.toFixed(2)}\nProfit/Loss: €${(final - initial).toFixed(2)}`)
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    <PieChart className="h-4 w-4 mr-2" />
                    Simula 100 Scommesse
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ACADEMY SECTION */}
          <TabsContent value="academy" className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-6">
              
              {/* Guides Sidebar */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">📚 Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {guides.map((guide, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveGuide(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          activeGuide === index 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{guide.title}</div>
                        <div className="text-xs opacity-75 mt-1">{guide.description}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Guide Content */}
              <div className="lg:col-span-3">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">{guides[activeGuide].title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {guides[activeGuide].description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      <div className="text-slate-200 leading-relaxed whitespace-pre-line">
                        {guides[activeGuide].content}
                      </div>
                    </div>
                    
                    <div className="mt-8 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                      <h4 className="text-emerald-400 font-bold mb-2">🎯 Prova CalcioAI</h4>
                      <p className="text-slate-300 text-sm mb-4">
                        Metti in pratica quello che hai imparato con le nostre analisi AI
                      </p>
                      <div className="flex gap-2">
                        <Link href="/matches">
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                            Analizza Partite
                          </Button>
                        </Link>
                        <Link href="/tipsterai">
                          <Button size="sm" variant="outline" className="border-emerald-500 text-emerald-400">
                            TipsterAI
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}