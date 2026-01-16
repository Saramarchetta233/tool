'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, CreditCard, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'

function PagamentoCompletatoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const { refreshCredits, credits, isAuthenticated, fetchUser } = useUserStore()

  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionId) {
      verifyPayment()
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPaymentData(data)
        // Refresh user data and credits
        await fetchUser()
        await refreshCredits()
      } else {
        setError(data.error || 'Errore nella verifica del pagamento')
      }
    } catch (err) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Verifica pagamento in corso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <CardTitle className="text-white text-2xl">Pagamento Completato!</CardTitle>
          <CardDescription className="text-slate-400">
            Grazie per il tuo acquisto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-center">
              {error}
            </div>
          ) : (
            <>
              {/* Credits info */}
              <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  <span className="text-slate-400">Crediti aggiunti</span>
                </div>
                <div className="text-4xl font-bold text-emerald-400">
                  +{paymentData?.creditsAdded || '4000'}
                </div>
                <div className="text-slate-500 text-sm mt-2">
                  Il tuo saldo attuale: <span className="text-emerald-400 font-semibold">{credits}</span> crediti
                </div>
              </div>

              {/* What's next */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <Sparkles className="h-5 w-5 text-violet-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">TipsterAI</p>
                    <p className="text-slate-400 text-sm">Scopri le proposte AI giornaliere</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <CreditCard className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Analizza partite</p>
                    <p className="text-slate-400 text-sm">10 crediti per ogni analisi completa</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
                    Vai alla Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-slate-400 text-sm">
                    Per accedere ai tuoi crediti, completa la registrazione o accedi
                  </p>
                  <Link href="/accedi">
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
                      Accedi o Registrati
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PagamentoCompletatoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Caricamento...</p>
        </div>
      </div>
    }>
      <PagamentoCompletatoContent />
    </Suspense>
  )
}
