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
      description: "Probabilita calcolate con AI e dati storici per ogni partita"
    },
    {
      icon: <Target className="h-10 w-10" />,
      title: "TipsterAI Giornaliero",
      description: "Proposte AI quotidiane: singola, doppia, tripla e bomba"
    },
    {
      icon: <Trophy className="h-10 w-10" />,
      title: "FantaCoach AI",
      description: "Formazioni ottimizzate per il tuo fantacalcio (Prossimamente)"
    }
  ]

  const stats = [
    { value: "92%", label: "Accuracy" },
    { value: "10k+", label: "Utenti Attivi" },
    { value: "50k+", label: "Analisi Generate" },
    { value: "4.9/5", label: "Rating" }
  ]

  const recharges = [
    {
      credits: 500,
      price: "9,99",
      popular: false,
    },
    {
      credits: 1500,
      price: "24,99",
      popular: true,
    },
    {
      credits: 3000,
      price: "39,99",
      popular: false,
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
              <Link href="/accedi">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Accedi
                </Button>
              </Link>
              <Link href="/accedi">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
                  Inizia Ora
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
              Probabilita avanzate, strategie di betting intelligenti e il tuo assistente personale per il fantacalcio.
              <span className="text-emerald-400 font-semibold"> Ti accompagna per tutta la stagione.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/accedi">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8">
                  Accedi Ora - Solo 49
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                  Scopri di Piu
                </Button>
              </Link>
            </div>

            {/* Price highlight */}
            <div className="inline-flex items-center gap-3 bg-slate-900/50 border border-emerald-500/30 rounded-2xl px-6 py-3 mb-8">
              <div className="text-left">
                <div className="text-sm text-slate-400">Una tantum</div>
                <div className="text-3xl font-bold text-emerald-400">49</div>
              </div>
              <div className="h-12 w-px bg-slate-700"></div>
              <div className="text-left">
                <div className="text-sm text-slate-400">Ricevi subito</div>
                <div className="text-2xl font-bold text-white">4000 crediti</div>
              </div>
              <div className="h-12 w-px bg-slate-700"></div>
              <div className="text-left">
                <div className="text-sm text-slate-400">Valido per</div>
                <div className="text-lg font-semibold text-cyan-400">Tutta la stagione</div>
              </div>
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
              Tutto cio che serve per vincere
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
              Tre semplici passi per iniziare
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Acquista l'accesso</h3>
              <p className="text-slate-400">
                Paga 49 una tantum e ricevi subito 4000 crediti per tutta la stagione
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Analizza</h3>
              <p className="text-slate-400">
                Scegli le partite e ottieni analisi complete con probabilita AI (10 crediti per analisi)
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Vinci</h3>
              <p className="text-slate-400">
                Usa le nostre strategie e il TipsterAI per decisioni informate
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
              Accesso Completo - 49
            </h2>
            <p className="text-xl text-slate-400">
              Una tantum. Ti accompagna per tutta la stagione 2025/2026.
            </p>
          </div>

          {/* Main pricing card */}
          <div className="max-w-md mx-auto mb-16">
            <Card className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <CardHeader className="text-center pb-8">
                <Badge className="w-fit mx-auto mb-4 bg-emerald-500 text-white">Accesso Completo</Badge>
                <CardTitle className="text-white text-2xl">CalcioAI Stagione</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-emerald-400">49</span>
                  <div className="text-slate-400 text-sm mt-1">Una tantum</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    <span><strong className="text-emerald-400">4000 crediti</strong> inclusi</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    Valido per tutta la stagione 2025/2026
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    Analisi partite (10 crediti/analisi)
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    TipsterAI gratis la prima volta
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    Tutte le funzionalita sbloccate
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    Supporto dedicato
                  </div>
                </div>
                <Link href="/accedi">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-lg py-6">
                    Accedi Ora - 49
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recharge options */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Hai finito i crediti?</h3>
            <p className="text-slate-400">Ricarica quando vuoi con questi pacchetti</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {recharges.map((pkg) => (
              <Card key={pkg.credits} className={`bg-slate-800/50 border-slate-700 ${pkg.popular ? 'border-emerald-500/50 scale-105' : ''}`}>
                {pkg.popular && (
                  <div className="text-center py-2 bg-emerald-500/20">
                    <span className="text-emerald-400 text-sm font-medium">Piu richiesto</span>
                  </div>
                )}
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{pkg.credits}</div>
                  <div className="text-slate-400 text-sm mb-4">crediti</div>
                  <div className="text-2xl font-bold text-emerald-400 mb-4">{pkg.price}</div>
                  <Link href="/accedi">
                    <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
                      Ricarica
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
              per prendere decisioni piu intelligenti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/accedi">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8">
                  Accedi Ora - 49
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
                <li><Link href="/tipsterai" className="hover:text-white">TipsterAI</Link></li>
                <li><Link href="/metodo" className="hover:text-white">Metodi AI</Link></li>
                <li><span className="text-slate-500">FantaCoach (In arrivo)</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Supporto</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/help" className="hover:text-white">Centro Assistenza</Link></li>
                <li><Link href="/tutorials" className="hover:text-white">Tutorial</Link></li>
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
                2025 CalcioAI. Tutti i diritti riservati.
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
    </div>
  )
}
