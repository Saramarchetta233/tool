'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function PagamentoAnnullatoPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
          <CardTitle className="text-white text-2xl">Pagamento Annullato</CardTitle>
          <CardDescription className="text-slate-400">
            Il pagamento non e' stato completato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-slate-800/50 rounded-lg text-center">
            <p className="text-slate-300">
              Nessun addebito e' stato effettuato sulla tua carta.
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Puoi riprovare quando vuoi.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/accedi">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
                <RefreshCw className="mr-2 h-4 w-4" />
                Riprova l'acquisto
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Torna alla homepage
              </Button>
            </Link>
          </div>

          <p className="text-center text-slate-500 text-xs">
            Hai bisogno di aiuto? Contattaci a support@calcioai.com
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
