'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, CheckCircle, ArrowRight, Shield, Sparkles, BarChart3, Lock } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'

interface RequirePurchaseProps {
  children: React.ReactNode
}

export default function RequirePurchase({ children }: RequirePurchaseProps) {
  const { hasPurchased, isLoading, isAuthenticated, refreshCredits } = useUserStore()
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      refreshCredits()
    }
  }, [isAuthenticated, refreshCredits])

  const handlePurchase = async () => {
    setPurchaseLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageType: 'initial' }),
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
      setPurchaseLoading(false)
    }
  }

  // Se sta caricando, mostra uno spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Caricamento...</p>
        </div>
      </div>
    )
  }

  // Se l'utente ha pagato, mostra il contenuto normalmente
  if (hasPurchased) {
    return <>{children}</>
  }

  // Altrimenti mostra il contenuto sfocato in background con overlay di acquisto
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Background: Dashboard content visible but slightly blurred */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="blur-[2px] opacity-80 pointer-events-none select-none">
          {children}
        </div>
        {/* Light dark overlay */}
        <div className="absolute inset-0 bg-slate-950/40"></div>
      </div>

      {/* Foreground: Purchase card */}
      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Lock icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-10 w-10 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Completa l'Acquisto</h1>
            <p className="text-slate-400">
              Per accedere a CalcioAI devi completare l'acquisto iniziale
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Main pricing card */}
          <Card className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/50 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

            <CardHeader className="text-center pb-4">
              <Badge className="w-fit mx-auto mb-4 bg-emerald-500 text-white">Accesso Completo</Badge>
              <CardTitle className="text-white text-2xl">CalcioAI Stagione 2025/2026</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold text-emerald-400">49</span>
                <span className="text-slate-400 ml-2">una tantum</span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-slate-300">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                  <span><strong className="text-emerald-400">4000 crediti</strong> inclusi subito</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                  Accesso per tutta la stagione 2025/2026
                </div>
                <div className="flex items-center text-slate-300">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                  Analisi partite complete (10 crediti/analisi)
                </div>
                <div className="flex items-center text-slate-300">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                  TipsterAI con proposte giornaliere
                </div>
                <div className="flex items-center text-slate-300">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                  Tracker scommesse e calcolatori
                </div>
                <div className="flex items-center text-slate-300">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                  Supporto dedicato
                </div>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={purchaseLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-lg py-6"
              >
                {purchaseLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Elaborazione...
                  </span>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Acquista Ora - 49
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="text-center text-slate-500 text-sm mt-4">
                Pagamento sicuro con Stripe. Nessun abbonamento, paghi solo una volta.
              </p>
            </CardContent>
          </Card>

          {/* Features preview */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-slate-900/80 rounded-lg border border-slate-800 backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Analisi AI</p>
              <p className="text-slate-500 text-xs">400+ analisi</p>
            </div>
            <div className="text-center p-4 bg-slate-900/80 rounded-lg border border-slate-800 backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-violet-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">TipsterAI</p>
              <p className="text-slate-500 text-xs">Tips giornalieri</p>
            </div>
            <div className="text-center p-4 bg-slate-900/80 rounded-lg border border-slate-800 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Tutta stagione</p>
              <p className="text-slate-500 text-xs">Zero scadenze</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
