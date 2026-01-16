'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, CheckCircle, Zap, Star } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'

const packages = [
  {
    id: 'recharge_500',
    credits: 500,
    price: '9,99',
    priceValue: 999,
    perCredit: '0.02',
    popular: false,
    icon: <CreditCard className="h-6 w-6" />,
    color: 'slate',
  },
  {
    id: 'recharge_1500',
    credits: 1500,
    price: '24,99',
    priceValue: 2499,
    perCredit: '0.017',
    popular: true,
    icon: <Star className="h-6 w-6" />,
    color: 'emerald',
    savings: '15%',
  },
  {
    id: 'recharge_3000',
    credits: 3000,
    price: '39,99',
    priceValue: 3999,
    perCredit: '0.013',
    popular: false,
    icon: <Zap className="h-6 w-6" />,
    color: 'purple',
    savings: '33%',
  },
]

export default function RicaricaPage() {
  const { credits } = useUserStore()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId)
    setError('')

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageType: packageId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Errore durante la creazione del pagamento')
      }
    } catch (err) {
      setError('Errore di connessione')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Ricarica Crediti</h1>
        <p className="text-slate-400 mb-6">
          Scegli il pacchetto che preferisci e continua ad analizzare le partite
        </p>

        {/* Current balance */}
        <div className="inline-flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-3">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <div className="text-left">
            <div className="text-sm text-slate-400">Saldo attuale</div>
            <div className="text-2xl font-bold text-emerald-400">{credits} crediti</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Packages */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`relative bg-slate-900/50 border-slate-700 hover:border-emerald-500/50 transition-all ${
              pkg.popular ? 'border-emerald-500/50 scale-105 shadow-lg shadow-emerald-500/10' : ''
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-emerald-500 text-white">Piu richiesto</Badge>
              </div>
            )}
            {pkg.savings && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-amber-500 text-white">-{pkg.savings}</Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4 pt-8">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
                pkg.popular ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {pkg.icon}
              </div>
              <CardTitle className="text-white text-xl">{pkg.credits} Crediti</CardTitle>
              <CardDescription className="text-slate-400">
                {pkg.perCredit} per credito
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center">
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{pkg.price}</span>
              </div>

              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center text-slate-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mr-2 flex-shrink-0" />
                  {pkg.credits} crediti istantanei
                </div>
                <div className="flex items-center text-slate-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mr-2 flex-shrink-0" />
                  Validi per sempre
                </div>
                <div className="flex items-center text-slate-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mr-2 flex-shrink-0" />
                  {Math.floor(pkg.credits / 10)} analisi complete
                </div>
              </div>

              <Button
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading === pkg.id}
                className={`w-full ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'
                    : 'bg-slate-700 hover:bg-slate-600'
                } text-white`}
              >
                {loading === pkg.id ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Elaborazione...
                  </span>
                ) : (
                  `Acquista - ${pkg.price}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <div className="mt-12 max-w-2xl mx-auto">
        <Card className="bg-slate-900/30 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4">Come funzionano i crediti?</h3>
            <div className="space-y-3 text-slate-400 text-sm">
              <p>
                <span className="text-emerald-400 font-medium">10 crediti</span> = 1 analisi completa di una partita
              </p>
              <p>
                <span className="text-emerald-400 font-medium">10 crediti</span> = 1 rigenerazione TipsterAI (dopo la prima gratuita)
              </p>
              <p>
                I crediti non hanno scadenza e rimangono nel tuo account fino a quando non li utilizzi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment methods */}
      <div className="mt-8 text-center text-slate-500 text-sm">
        <p>Pagamento sicuro con Stripe. Accettiamo tutte le principali carte di credito.</p>
      </div>
    </div>
  )
}
