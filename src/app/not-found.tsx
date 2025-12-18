import { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pagina Non Trovata | CalcioAI',
  description: 'La pagina che stai cercando non esiste.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <Search className="h-16 w-16 text-slate-500 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-300 mb-4">
          Pagina Non Trovata
        </h2>
        <p className="text-slate-400 mb-8">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <Link href="/">
          <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
            Torna alla Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
