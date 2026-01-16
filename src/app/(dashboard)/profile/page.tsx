'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Mail, CreditCard, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'

export default function ProfilePage() {
  const { user, credits, refreshCredits } = useUserStore()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  useEffect(() => {
    refreshCredits()
    fetchTransactions()
  }, [refreshCredits])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/credits/history')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Il tuo Profilo</h1>
          <p className="text-slate-400">Gestisci il tuo account e i crediti</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* User Info */}
          <Card className="md:col-span-2 bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-400" />
                Informazioni Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold">{user?.fullName || 'Utente'}</p>
                  <p className="text-slate-400 text-sm flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-sm mb-1">Membro dal</div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                  </div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-sm mb-1">Obiettivo</div>
                  <div className="text-white font-semibold">
                    {user?.goal === 'betting' ? 'Betting' : user?.goal === 'fantacalcio' ? 'Fantacalcio' : 'Entrambi'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits Card */}
          <Card className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                I tuoi Crediti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-emerald-400">{credits}</div>
                <div className="text-slate-400 text-sm">crediti disponibili</div>
              </div>

              <div className="space-y-2 mb-6 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Analisi partita</span>
                  <span className="text-emerald-400">10 crediti</span>
                </div>
                <div className="flex justify-between">
                  <span>Rigenera TipsterAI</span>
                  <span className="text-emerald-400">10 crediti</span>
                </div>
              </div>

              <Link href="/ricarica">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                  Ricarica Crediti
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card className="mt-6 bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Storico Transazioni
            </CardTitle>
            <CardDescription className="text-slate-400">
              Le tue ultime operazioni sui crediti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-slate-800 h-12 rounded"></div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-white">{tx.description}</p>
                      <p className="text-slate-500 text-xs">
                        {new Date(tx.created_at).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge className={tx.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                Nessuna transazione ancora
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
