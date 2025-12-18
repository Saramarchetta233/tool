import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Target, Brain, BarChart3, Trophy, Users, Shield, CreditCard, ArrowRight, CheckCircle, Timer, DollarSign } from "lucide-react"
import Link from "next/link"

export default function HomePage() {

  const features = [
    {
      icon: <BarChart3 className="h-10 w-10" />,
      title: "Analisi Statistiche Avanzate",
      description: "Probabilità calcolate con AI e dati storici per ogni partita"
    },
    {
      icon: <Target className="h-10 w-10" />,
      title: "Strategie di Betting",
      description: "Metodi scientifici per value betting e gestione bankroll"
    },
    {
      icon: <Trophy className="h-10 w-10" />,
      title: "FantaCoach AI",
      description: "Formazioni ottimizzate per il tuo fantacalcio"
    }
  ]

  const stats = [
    { value: "92%", label: "Accuracy" },
    { value: "10k+", label: "Utenti Attivi" },
    { value: "50k+", label: "Analisi Generate" },
    { value: "4.9/5", label: "Rating" }
  ]

  const pricing = [
    {
      name: "Accesso Base",
      type: "one-time",
      price: "€27",
      originalPrice: "€49",
      duration: "30 giorni",
      popular: true,
      features: [
        "100 analisi complete",
        "Tutte le funzionalità",
        "Report AI personalizzati",
        "FantaCoach incluso",
        "Supporto dedicato"
      ]
    },
    {
      name: "Ricarica Extra",
      type: "addon",
      price: "€19",
      duration: "50 analisi",
      features: [
        "50 analisi aggiuntive",
        "Valido per sempre",
        "Stesso account",
        "Zero limitazioni"
      ]
    },
    {
      name: "Abbonamento Pro",
      type: "subscription",
      price: "€39",
      duration: "/mese",
      features: [
        "Analisi illimitate",
        "Accesso prioritario",
        "Report esclusivi",
        "API avanzate",
        "Cancellabile sempre"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 backdrop-blur-xl bg-slate-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-emerald-500" />
              <span className="text-2xl font-bold gradient-text">CalcioAI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Accedi
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
                  Inizia Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Powered by AI + Sports Data
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Analisi Calcistiche con
              <span className="block gradient-text">Intelligenza Artificiale</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Probabilità avanzate, strategie di betting intelligenti e il tuo assistente personale per il fantacalcio. 
              Trasforma i dati in decisioni vincenti.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8">
                  Accedi Ora - Solo €27
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                  Scopri di Più
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tutto ciò che serve per vincere
            </h2>
            <p className="text-xl text-slate-400">
              Strumenti professionali per scommettitori intelligenti e fantallenatori
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="text-emerald-400 mb-4">{feature.icon}</div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Come Funziona
            </h2>
            <p className="text-xl text-slate-400">
              Tre semplici passi per iniziare a vincere
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Registrati</h3>
              <p className="text-slate-400">
                Crea il tuo account gratuito e ricevi 5 crediti omaggio per iniziare
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Analizza</h3>
              <p className="text-slate-400">
                Scegli le partite e ottieni analisi complete con probabilità AI
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Vinci</h3>
              <p className="text-slate-400">
                Usa le nostre strategie per decisioni informate e risultati migliori
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Inizia Ora - Monetizza Subito
            </h2>
            <p className="text-xl text-slate-400">
              Accesso completo da €27. Niente freemium, niente attesa.
            </p>
            <div className="mt-4">
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                🔥 Offerta Lancio: -45% sul primo accesso
              </Badge>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <Card key={plan.name} className={`bg-slate-800/50 border-slate-700 relative ${plan.popular ? 'border-emerald-500 scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">Più Richiesto</Badge>
                  </div>
                )}
                {plan.type === 'one-time' && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-red-500 text-white">-45%</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    {plan.originalPrice && (
                      <div className="text-slate-400 line-through text-lg">{plan.originalPrice}</div>
                    )}
                    <span className="text-4xl font-bold text-emerald-400">{plan.price}</span>
                    <div className="text-slate-400 text-sm mt-1">{plan.duration}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center text-slate-300">
                        <CheckCircle className="h-4 w-4 text-emerald-400 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Link href="/signup">
                    <Button className={`w-full ${plan.popular ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : plan.type === 'subscription' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 hover:bg-slate-600'}`}>
                      {plan.type === 'one-time' ? 'Accesso Immediato' : 
                       plan.type === 'addon' ? 'Ricarica Account' : 
                       'Abbonati Ora'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto a iniziare?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Unisciti a migliaia di scommettitori e fantallenatori che usano CalcioAI 
              per prendere decisioni più intelligenti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8">
                  Accedi Ora - €27
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/metodo">
                <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                  Scopri i Metodi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
                <span className="text-xl font-bold gradient-text">CalcioAI</span>
              </div>
              <p className="text-slate-400 mb-4">
                Analisi calcistiche con intelligenza artificiale per decisioni vincenti.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Prodotti</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/matches" className="hover:text-white">Match Center</Link></li>
                <li><Link href="/fantacoach" className="hover:text-white">FantaCoach</Link></li>
                <li><Link href="/metodo" className="hover:text-white">Metodi AI</Link></li>
                <li><Link href="/credits" className="hover:text-white">Crediti</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Supporto</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/help" className="hover:text-white">Centro Assistenza</Link></li>
                <li><Link href="/tutorials" className="hover:text-white">Tutorial</Link></li>
                <li><Link href="/api" className="hover:text-white">API Docs</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contatti</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legale</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Termini di Servizio</Link></li>
                <li><Link href="/disclaimer" className="hover:text-white">Disclaimer</Link></li>
                <li><Link href="/responsible" className="hover:text-white">Gioco Responsabile</Link></li>
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
                  ⚠️ CalcioAI fornisce analisi statistiche a scopo informativo.
                </p>
                <p>
                  Non incoraggiamo il gioco d'azzardo. Gioca responsabilmente su piattaforme autorizzate ADM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}