'use client'

import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Oops, qualcosa è andato storto!
        </h1>
        <p className="text-slate-400 mb-6">
          Si è verificato un errore inaspettato. Riprova o contatta il supporto.
        </p>
        <Button onClick={reset} className="bg-gradient-to-r from-emerald-500 to-cyan-500">
          Riprova
        </Button>
      </div>
    </div>
  )
}
